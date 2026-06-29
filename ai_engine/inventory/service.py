"""
inventory/service.py
Domain logic for Inventory management system.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from database.connection import get_engine


_EPSILON = 1e-9


def _json_datetime(value):
    return value.isoformat() if hasattr(value, "isoformat") else value


def _round_qty(value: float) -> float:
    return round(float(value or 0), 6)


def consume_inventory(restaurant_id: str, order_id: int, session: Session | None = None) -> dict:
    """
    Deducts POS ingredient usage from InventoryBatches using FEFO/FIFO order,
    syncs Inventories.Stock, and logs rows in InventoryTransactions.
    """
    if session is not None:
        return _consume_inventory_in_session(session, restaurant_id, order_id)

    engine = get_engine()
    with Session(engine) as local_session:
        try:
            result = _consume_inventory_in_session(local_session, restaurant_id, order_id)
            local_session.commit()
            return result
        except Exception:
            local_session.rollback()
            raise


def _consume_inventory_in_session(session: Session, restaurant_id: str, order_id: int) -> dict:
    order = session.execute(
        text(
            """
            SELECT OrderId, RestaurantId
            FROM Orders
            WHERE OrderId = :order_id
            """
        ),
        {"order_id": order_id},
    ).mappings().first()

    if not order:
        raise ValueError(f"Order {order_id} not found entirely in the database.")
    if str(order["RestaurantId"]).strip() != str(restaurant_id).strip():
        raise ValueError(
            f"Order {order_id} exists, but belongs to restaurant {order['RestaurantId']}, not {restaurant_id}"
        )

    invalid_maps = session.execute(
        text(
            """
            SELECT DISTINCT
                oi.MenuItemId AS menu_item_id,
                mii.InventoryID AS inventory_id
            FROM OrderItems oi
            JOIN MenuItemIngredients mii ON oi.MenuItemId = mii.MenuItemId
            LEFT JOIN Inventories i
              ON mii.InventoryID = i.InventoryID
             AND i.RestID = :restaurant_id
            WHERE oi.OrderId = :order_id
              AND i.InventoryID IS NULL
            """
        ),
        {"restaurant_id": restaurant_id, "order_id": order_id},
    ).mappings().all()
    if invalid_maps:
        details = [
            f"MenuItemId {row['menu_item_id']} -> InventoryID {row['inventory_id']}"
            for row in invalid_maps
        ]
        raise ValueError(f"Invalid inventory mappings for restaurant {restaurant_id}: {details}")

    missing_maps = [
        int(row["menu_item_id"])
        for row in session.execute(
            text(
                """
                SELECT DISTINCT oi.MenuItemId AS menu_item_id
                FROM OrderItems oi
                LEFT JOIN MenuItemIngredients mii ON oi.MenuItemId = mii.MenuItemId
                WHERE oi.OrderId = :order_id
                  AND mii.MenuItemId IS NULL
                """
            ),
            {"order_id": order_id},
        ).mappings().all()
    ]

    required_rows = session.execute(
        text(
            """
            SELECT
                i.InventoryID AS inventory_id,
                i.ItemName AS ingredient,
                i.Unit AS unit,
                i.CostPerUnit AS fallback_unit_cost,
                SUM(CAST(oi.Quantity AS float) * CAST(mii.QuantityUsedPerItem AS float)) AS qty_required
            FROM OrderItems oi
            JOIN MenuItemIngredients mii ON oi.MenuItemId = mii.MenuItemId
            JOIN Inventories i ON mii.InventoryID = i.InventoryID
            WHERE oi.OrderId = :order_id
              AND i.RestID = :restaurant_id
            GROUP BY i.InventoryID, i.ItemName, i.Unit, i.CostPerUnit
            HAVING SUM(CAST(oi.Quantity AS float) * CAST(mii.QuantityUsedPerItem AS float)) > 0
            ORDER BY i.ItemName
            """
        ),
        {"restaurant_id": restaurant_id, "order_id": order_id},
    ).mappings().all()

    if not required_rows:
        return {
            "status": "success",
            "ingredients_deducted": 0,
            "batches_consumed": 0,
            "transactions_created": 0,
            "deductions": [],
            "missing_maps": missing_maps,
        }

    for row in required_rows:
        available = session.execute(
            text(
                """
                SELECT COALESCE(SUM(Quantity), 0) AS available_qty
                FROM InventoryBatches WITH (UPDLOCK, HOLDLOCK)
                WHERE InventoryID = :inventory_id
                  AND Quantity > 0
                """
            ),
            {"inventory_id": row["inventory_id"]},
        ).scalar()
        available_qty = float(available or 0)
        required_qty = float(row["qty_required"] or 0)
        if available_qty + _EPSILON < required_qty:
            raise ValueError(
                "Insufficient inventory batches for "
                f"{row['ingredient']} (InventoryID {row['inventory_id']}): "
                f"required {_round_qty(required_qty)} {row['unit'] or ''}, "
                f"available {_round_qty(available_qty)} {row['unit'] or ''}."
            )

    now = datetime.utcnow()
    deductions = []
    transactions_created = 0

    for row in required_rows:
        inventory_id = int(row["inventory_id"])
        qty_required = float(row["qty_required"] or 0)
        remaining = qty_required
        batch_deductions = []

        batches = session.execute(
            text(
                """
                SELECT
                    BatchID AS batch_id,
                    Quantity AS quantity,
                    ExpiryDate AS expiry_date,
                    ReceivedDate AS received_date,
                    ProductionDate AS production_date,
                    UnitCost AS unit_cost
                FROM InventoryBatches WITH (UPDLOCK, ROWLOCK)
                WHERE InventoryID = :inventory_id
                  AND Quantity > 0
                ORDER BY
                    CASE WHEN ExpiryDate IS NULL THEN 1 ELSE 0 END,
                    ExpiryDate ASC,
                    CASE WHEN ReceivedDate IS NULL THEN 1 ELSE 0 END,
                    ReceivedDate ASC,
                    CASE WHEN ProductionDate IS NULL THEN 1 ELSE 0 END,
                    ProductionDate ASC,
                    BatchID ASC
                """
            ),
            {"inventory_id": inventory_id},
        ).mappings().all()

        for batch in batches:
            if remaining <= _EPSILON:
                break

            batch_qty = float(batch["quantity"] or 0)
            qty_to_consume = min(batch_qty, remaining)
            new_batch_qty = max(batch_qty - qty_to_consume, 0.0)
            unit_cost = batch["unit_cost"]
            if unit_cost is None:
                unit_cost = row["fallback_unit_cost"]

            session.execute(
                text(
                    """
                    UPDATE InventoryBatches
                    SET Quantity = :new_quantity
                    WHERE BatchID = :batch_id
                    """
                ),
                {
                    "new_quantity": new_batch_qty,
                    "batch_id": batch["batch_id"],
                },
            )
            session.execute(
                text(
                    """
                    INSERT INTO InventoryTransactions (
                        RestId,
                        InventoryId,
                        BatchId,
                        [Type],
                        Quantity,
                        Price,
                        TransactionDate,
                        Notes
                    )
                    VALUES (
                        :restaurant_id,
                        :inventory_id,
                        :batch_id,
                        :type,
                        :quantity,
                        :price,
                        :transaction_date,
                        :notes
                    )
                    """
                ),
                {
                    "restaurant_id": restaurant_id,
                    "inventory_id": inventory_id,
                    "batch_id": batch["batch_id"],
                    "type": "usage",
                    "quantity": qty_to_consume,
                    "price": float(unit_cost or 0),
                    "transaction_date": now,
                    "notes": f"POS order {order_id}",
                },
            )

            batch_deductions.append(
                {
                    "batch_id": int(batch["batch_id"]),
                    "qty_deducted": _round_qty(qty_to_consume),
                    "remaining_batch_qty": _round_qty(new_batch_qty),
                    "unit_cost": float(unit_cost or 0),
                    "expiry_date": _json_datetime(batch["expiry_date"]),
                    "received_date": _json_datetime(batch["received_date"]),
                    "production_date": _json_datetime(batch["production_date"]),
                }
            )
            transactions_created += 1
            remaining -= qty_to_consume

        if remaining > _EPSILON:
            raise ValueError(
                f"Unable to fully consume {row['ingredient']} from batches. "
                f"Remaining quantity: {_round_qty(remaining)} {row['unit'] or ''}."
            )

        session.execute(
            text(
                """
                UPDATE Inventories
                SET
                    Stock = (
                        SELECT COALESCE(SUM(Quantity), 0)
                        FROM InventoryBatches
                        WHERE InventoryID = :inventory_id
                    ),
                    LastUpdated = :last_updated
                WHERE InventoryID = :inventory_id
                  AND RestID = :restaurant_id
                """
            ),
            {
                "inventory_id": inventory_id,
                "restaurant_id": restaurant_id,
                "last_updated": now,
            },
        )
        new_stock = session.execute(
            text(
                """
                SELECT COALESCE(Stock, 0)
                FROM Inventories
                WHERE InventoryID = :inventory_id
                  AND RestID = :restaurant_id
                """
            ),
            {"inventory_id": inventory_id, "restaurant_id": restaurant_id},
        ).scalar()

        deductions.append(
            {
                "inventory_id": inventory_id,
                "ingredient": row["ingredient"],
                "unit": row["unit"],
                "qty_deducted": _round_qty(qty_required),
                "new_stock": _round_qty(new_stock),
                "batches": batch_deductions,
            }
        )

    return {
        "status": "success",
        "ingredients_deducted": len(deductions),
        "batches_consumed": sum(len(item["batches"]) for item in deductions),
        "transactions_created": transactions_created,
        "deductions": deductions,
        "missing_maps": missing_maps,
    }


def restock_inventory(
    restaurant_id: str,
    inventory_id: int,
    quantity: float,
    unit_price: float | None = None,
    expiry_date=None,
    production_date=None,
) -> dict:
    """
    Adds stock through InventoryBatches, syncs Inventories.Stock, and logs restock.
    """
    if quantity <= 0:
        raise ValueError("Restock quantity must be greater than zero.")

    engine = get_engine()
    with Session(engine) as session:
        try:
            inventory = session.execute(
                text(
                    """
                    SELECT
                        InventoryID AS inventory_id,
                        RestID AS restaurant_id,
                        CostPerUnit AS cost_per_unit,
                        ExpiryDate AS expiry_date,
                        ProductionDate AS production_date
                    FROM Inventories
                    WHERE InventoryID = :inventory_id
                    """
                ),
                {"inventory_id": inventory_id},
            ).mappings().first()

            if not inventory:
                raise ValueError(f"Inventory Item {inventory_id} not found entirely.")
            if str(inventory["restaurant_id"]).strip() != str(restaurant_id).strip():
                raise ValueError(
                    f"Inventory {inventory_id} belongs to restaurant {inventory['restaurant_id']}, not {restaurant_id}"
                )

            now = datetime.utcnow()
            batch_result = session.execute(
                text(
                    """
                    INSERT INTO InventoryBatches (
                        InventoryID,
                        Quantity,
                        ExpiryDate,
                        ReceivedDate,
                        ProductionDate,
                        UnitCost
                    )
                    OUTPUT inserted.BatchID
                    VALUES (
                        :inventory_id,
                        :quantity,
                        :expiry_date,
                        :received_date,
                        :production_date,
                        :unit_cost
                    )
                    """
                ),
                {
                    "inventory_id": inventory_id,
                    "quantity": quantity,
                    "expiry_date": expiry_date if expiry_date is not None else inventory["expiry_date"],
                    "received_date": now,
                    "production_date": production_date
                    if production_date is not None
                    else inventory["production_date"],
                    "unit_cost": unit_price
                    if unit_price is not None
                    else float(inventory["cost_per_unit"] or 0),
                },
            ).first()
            batch_id = int(batch_result[0])

            session.execute(
                text(
                    """
                    UPDATE Inventories
                    SET
                        Stock = (
                            SELECT COALESCE(SUM(Quantity), 0)
                            FROM InventoryBatches
                            WHERE InventoryID = :inventory_id
                        ),
                        LastUpdated = :last_updated
                    WHERE InventoryID = :inventory_id
                      AND RestID = :restaurant_id
                    """
                ),
                {
                    "inventory_id": inventory_id,
                    "restaurant_id": restaurant_id,
                    "last_updated": now,
                },
            )

            new_stock = session.execute(
                text(
                    """
                    SELECT COALESCE(Stock, 0)
                    FROM Inventories
                    WHERE InventoryID = :inventory_id
                      AND RestID = :restaurant_id
                    """
                ),
                {"inventory_id": inventory_id, "restaurant_id": restaurant_id},
            ).scalar()

            unit_cost = unit_price if unit_price is not None else float(inventory["cost_per_unit"] or 0)
            session.execute(
                text(
                    """
                    INSERT INTO InventoryTransactions (
                        RestId,
                        InventoryId,
                        BatchId,
                        [Type],
                        Quantity,
                        Price,
                        TransactionDate,
                        Notes
                    )
                    VALUES (
                        :restaurant_id,
                        :inventory_id,
                        :batch_id,
                        :type,
                        :quantity,
                        :price,
                        :transaction_date,
                        :notes
                    )
                    """
                ),
                {
                    "restaurant_id": restaurant_id,
                    "inventory_id": inventory_id,
                    "batch_id": batch_id,
                    "type": "restock",
                    "quantity": quantity,
                    "price": float(unit_cost or 0),
                    "transaction_date": now,
                    "notes": "Manual restock",
                },
            )

            session.commit()
            return {
                "inventory_id": inventory_id,
                "batch_id": batch_id,
                "quantity_added": _round_qty(quantity),
                "new_stock": _round_qty(new_stock),
            }
        except Exception:
            session.rollback()
            raise
