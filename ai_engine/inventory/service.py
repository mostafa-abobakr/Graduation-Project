"""
inventory/service.py
Domain logic for Inventory management system.
"""

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


def check_low_stock(rest_id: str) -> List[Dict[str, Any]]:
    """
    Returns items where current stock is <= ReorderLevel.
    """
    engine = get_engine()
    with Session(engine) as session:
        low_stock_items = session.query(Inventory).filter(
            Inventory.RestID == rest_id,
            Inventory.Stock <= Inventory.ReorderLevel
        ).all()
        
        return [
            {
                "inventory_id": item.InventoryID,
                "item_name": item.ItemName,
                "stock": item.Stock,
                "reorder_level": item.ReorderLevel
            }
            for item in low_stock_items
        ]


def forecast_inventory_requirements(restaurant_id: str, forecast_output: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Converts ML predicted item demand into ingredient shortages.
    forecast_output format: [{"item_name": "x", "expected_orders": 10}, ...]
    """
    engine = get_engine()
    with Session(engine) as session:
        if not forecast_output:
            return []

        item_names = [f["item_name"] for f in forecast_output]
        demand_map = {f["item_name"]: float(f["expected_orders"]) for f in forecast_output}

        # Query required ingredients for all forecasted items in one go
        results = session.query(
            MenuItem.ItemName, 
            Inventory.InventoryID, 
            Inventory.ItemName.label("InventoryName"), 
            Inventory.Stock, 
            MenuItemIngredient.QuantityUsedPerItem
        )\
            .join(MenuItemIngredient, MenuItem.MenuItemId == MenuItemIngredient.MenuItemId)\
            .join(Inventory, MenuItemIngredient.InventoryID == Inventory.InventoryID)\
            .filter(MenuItem.RestaurantId == restaurant_id)\
            .filter(MenuItem.ItemName.in_(item_names))\
            .all()

        required_inventory = {}
        for row in results:
            menu_item_name = row.ItemName
            inv_id = row.InventoryID
            inv_name = row.InventoryName
            stock = row.Stock or 0
            qty_used = row.QuantityUsedPerItem
            
            demand = demand_map.get(menu_item_name, 0)
            total_req = qty_used * demand
            
            if inv_id not in required_inventory:
                required_inventory[inv_id] = {
                    "inventory_id": inv_id,
                    "item_name": inv_name,
                    "required": 0.0,
                    "in_stock": float(stock),
                }
            required_inventory[inv_id]["required"] += total_req

        final_results = []
        for _, data in required_inventory.items():
            shortage = data["required"] - data["in_stock"]
            data["shortage"] = float(max(0.0, shortage))
            final_results.append(data)

        # Sort by highest shortage first
        final_results.sort(key=lambda x: x["shortage"], reverse=True)
        return final_results


def get_menu_recipes(rest_id: str) -> List[Dict[str, Any]]:
    """
    Returns all menu items for a restaurant along with their mapped ingredient recipes.
    """
    engine = get_engine()
    with Session(engine) as session:
        # We left join to show items even if they don't have ingredients yet
        results = session.query(
            MenuItem.MenuItemId,
            MenuItem.ItemName.label("MenuItemName"),
            Inventory.InventoryID,
            Inventory.ItemName.label("IngredientName"),
            Inventory.Unit,
            MenuItemIngredient.QuantityUsedPerItem
        )\
        .outerjoin(MenuItemIngredient, MenuItem.MenuItemId == MenuItemIngredient.MenuItemId)\
        .outerjoin(Inventory, MenuItemIngredient.InventoryID == Inventory.InventoryID)\
        .filter(MenuItem.RestaurantId == rest_id)\
        .all()
        
        recipes = {}
        for row in results:
            mi_id = row.MenuItemId
            if mi_id not in recipes:
                recipes[mi_id] = {
                    "menu_item_id": mi_id,
                    "menu_item_name": row.MenuItemName,
                    "ingredients": []
                }
            if row.InventoryID:
                recipes[mi_id]["ingredients"].append({
                    "inventory_id": row.InventoryID,
                    "ingredient_name": row.IngredientName,
                    "unit": row.Unit,
                    "quantity": row.QuantityUsedPerItem
                })
        return list(recipes.values())


def add_ingredient_to_recipe(rest_id: str, menu_item_id: int, quantity: float, inventory_id: int = None, new_name: str = None, new_unit: str = None) -> dict:
    """
    Maps an ingredient to a menu item. If inventory_id is missing, creates a new Inventories record first.
    """
    engine = get_engine()
    with Session(engine) as session:
        menu_item = session.query(MenuItem).filter(MenuItem.MenuItemId == menu_item_id).first()
        if not menu_item:
            raise ValueError(f"Menu item {menu_item_id} not found entirely.")
        if str(menu_item.RestaurantId).strip() != str(rest_id).strip():
            raise ValueError(f"Menu item {menu_item_id} does not belong to restaurant {rest_id}")
            
        inv_id_to_map = inventory_id
        if inv_id_to_map is None:
            if not new_name or not new_unit:
                raise ValueError("Must provide either an existing 'inventory_id' OR a completely 'new_ingredient_name' and 'new_ingredient_unit'")
                
            new_inv = Inventory(
                RestID=rest_id,
                ItemName=new_name,
                Unit=new_unit,
                ReorderLevel=0.0,
                ReorderQuantity=0.0,
                Stock=0.0,
                CostPerUnit=0.0,
                Status="Active",
                Category="Custom"
            )
            session.add(new_inv)
            session.flush() # Commit visually to get the generated Identity ID safely
            inv_id_to_map = new_inv.InventoryID
        else:
            inv = session.query(Inventory).filter(Inventory.InventoryID == inv_id_to_map).first()
            if not inv:
                 raise ValueError("Provided inventory_id does not exist in the database.")
            if str(inv.RestID).strip() != str(rest_id).strip():
                 raise ValueError("You can only add your own restaurant's inventory items")
                 
        # Insert mapping
        existing_mapping = session.query(MenuItemIngredient).filter(
            MenuItemIngredient.MenuItemId == menu_item_id,
            MenuItemIngredient.InventoryID == inv_id_to_map
        ).first()
        
        if existing_mapping:
            existing_mapping.QuantityUsedPerItem = quantity
        else:
            new_mapping = MenuItemIngredient(
                MenuItemId=menu_item_id,
                InventoryID=inv_id_to_map,
                QuantityUsedPerItem=quantity
            )
            session.add(new_mapping)
            
        session.commit()
        return {
            "status": "success", 
            "message": "Recipe mapped correctly.",
            "menu_item_id": menu_item_id, 
            "inventory_id": inv_id_to_map, 
            "quantity": quantity
        }


def get_all_inventory(rest_id: str) -> List[Dict[str, Any]]:
    """
    Returns all inventory items for a restaurant with every DB column.
    """
    engine = get_engine()
    with Session(engine) as session:
        items = session.query(Inventory).filter(Inventory.RestID == rest_id).all()
        return [
            {
                "inventory_id": item.InventoryID,
                "restaurant_id": item.RestID,
                "item_name": item.ItemName,
                "unit": item.Unit,
                "category": item.Category,
                "stock": item.Stock,
                "reorder_level": item.ReorderLevel,
                "reorder_quantity": item.ReorderQuantity,
                "cost_per_unit": item.CostPerUnit,
                "status": item.Status,
            }
            for item in items
        ]
