"""
inventory/service.py
Domain logic for Inventory management system.
"""

from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from database.connection import get_engine
from database.models import Order, OrderItem, MenuItem, Inventory, MenuItemIngredient, InventoryTransaction


def consume_inventory(restaurant_id: str, order_id: int) -> dict:
    """
    Deducts stock based on items ordered and inserts usage transactions.
    """
    engine = get_engine()
    with Session(engine) as session:
        order = session.query(Order).filter(Order.OrderId == order_id).first()
        if not order:
            raise ValueError(f"Order {order_id} not found entirely in the database.")
        if str(order.RestaurantId).strip() != str(restaurant_id).strip():
            raise ValueError(f"Order {order_id} exists, but belongs to restaurant {order.RestaurantId}, not {restaurant_id}")
        
        rest_id = order.RestaurantId
        
        # Determine total ingredients used
        # We use pure SQL text for efficiency here
        sql = text("""
            SELECT 
                i.InventoryID,
                SUM(oi.Quantity * mii.QuantityUsedPerItem) as TotalUsed
            FROM OrderItems oi
            JOIN MenuItemIngredients mii ON oi.MenuItemId = mii.MenuItemId
            JOIN Inventories i ON mii.InventoryID = i.InventoryID
            WHERE oi.OrderId = :order_id
            GROUP BY i.InventoryID
        """)
        results = session.execute(sql, {"order_id": order_id}).fetchall()
        
        used_count = 0
        for row in results:
            inv_id = row.InventoryID
            qty_used = float(row.TotalUsed)
            
            inventory = session.query(Inventory).filter(Inventory.InventoryID == inv_id).first()
            if inventory:
                inventory.Stock = (inventory.Stock or 0) - qty_used
                inventory.LastUpdated = datetime.now()
                
                txn = InventoryTransaction(
                    InventoryID=inv_id,
                    RestID=rest_id,
                    ChangeType='usage',
                    QuantityChange=-qty_used,
                    ReferenceID=order_id,
                    ReferenceType='order'
                )
                session.add(txn)
                used_count += 1
                
        session.commit()
        return {"status": "success", "ingredients_deducted": used_count}


def restock_inventory(restaurant_id: str, inventory_id: int, quantity: float) -> dict:
    """
    Increases stock for an inventory item and logs the restock transaction.
    """
    engine = get_engine()
    with Session(engine) as session:
        inventory = session.query(Inventory).filter(Inventory.InventoryID == inventory_id).first()
        if not inventory:
            raise ValueError(f"Inventory Item {inventory_id} not found entirely.")
        if str(inventory.RestID).strip() != str(restaurant_id).strip():
            raise ValueError(f"Inventory {inventory_id} belongs to restaurant {inventory.RestID}, not {restaurant_id}")
            
        inventory.Stock = (inventory.Stock or 0) + quantity
        inventory.LastUpdated = datetime.now()
        
        txn = InventoryTransaction(
            InventoryID=inventory_id,
            RestID=inventory.RestID,
            ChangeType='restock',
            QuantityChange=quantity,
            ReferenceID=None,
            ReferenceType='manual'
        )
        session.add(txn)
        session.commit()
        return {"inventory_id": inventory_id, "new_stock": inventory.Stock}
