"""
database/seeder.py
Generates realistic historical standard POS data (dummy data) for a restaurant
by utilizing randomized volumes, temperature effects, and event days.
Inserts into MenuItems, Orders, and OrderItems.
"""
import random
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy import text
from database.connection import get_engine

# Common templates for generating restaurant menus
# Adjusted for realistic Egyptian market prices structure (approx 100-350 EGP per meal)
RESTAURANT_CATEGORIES = [
    {
        "category": "Burger Joint",
        "size_multiplier": 2.5,  # Medium-High volume
        "open_hour": 11,
        "close_hour": 23,
        "base_items": [
            ("Classic Burger", 45.0, 140.0), ("Cheese Burger", 50.0, 155.0),
            ("Double Burger", 80.0, 220.0), ("Chicken Burger", 45.0, 145.0),
            ("Veggie Burger", 40.0, 130.0), ("Fries", 15.0, 40.0),
            ("Onion Rings", 18.0, 45.0), ("Soft Drink", 10.0, 25.0),
            ("Milkshake", 25.0, 65.0), ("Ice Cream", 15.0, 40.0)
        ]
    },
    {
        "category": "Cafe & Bakery",
        "size_multiplier": 1.5,
        "open_hour": 7,
        "close_hour": 17,
        "base_items": [
            ("Espresso", 12.0, 40.0), ("Latte", 22.0, 65.0),
            ("Cappuccino", 22.0, 65.0), ("Americano", 18.0, 50.0),
            ("Iced Coffee", 25.0, 75.0), ("Croissant", 20.0, 55.0),
            ("Muffin", 18.0, 50.0), ("Bagel", 15.0, 45.0),
            ("Turkey Sandwich", 35.0, 95.0), ("Tea", 10.0, 25.0)
        ]
    },
    {
        "category": "Fine Dining Italian",
        "size_multiplier": 0.6,
        "open_hour": 17,
        "close_hour": 23,
        "base_items": [
            ("Spaghetti Carbonara", 80.0, 250.0), ("Lasagna", 95.0, 280.0),
            ("Margherita Pizza", 60.0, 180.0), ("Risotto", 90.0, 260.0),
            ("Caprese Salad", 45.0, 140.0), ("Tiramisu", 35.0, 110.0),
            ("Panna Cotta", 30.0, 95.0), ("House Wine", 100.0, 350.0),
            ("Sparkling Water", 15.0, 45.0), ("Garlic Bread", 25.0, 75.0)
        ]
    },
    {
        "category": "Casual Mexican",
        "size_multiplier": 2.0,
        "open_hour": 12,
        "close_hour": 23,
        "base_items": [
            ("Chicken Taco", 25.0, 70.0), ("Beef Taco", 30.0, 85.0),
            ("Burrito Bowl", 60.0, 175.0), ("Quesadilla", 50.0, 150.0),
            ("Nachos", 40.0, 120.0), ("Guacamole & Chips", 35.0, 100.0),
            ("Churros", 20.0, 60.0), ("Margarita", 80.0, 250.0),
            ("Mexican Cola", 15.0, 45.0), ("Fajitas", 75.0, 220.0)
        ]
    },
    {
        "category": "Traditional Egyptian",
        "size_multiplier": 3.0,
        "open_hour": 10,
        "close_hour": 23,
        "base_items": [
            ("Koshary Large", 20.0, 60.0), ("Koshary Medium", 15.0, 45.0),
            ("Macaroni Béchamel", 35.0, 90.0), ("Molokhia with Rice", 40.0, 110.0),
            ("Beef Shawarma", 35.0, 100.0), ("Chicken Shawarma", 30.0, 90.0),
            ("Falafel Sandwich", 5.0, 15.0), ("Foul Sandwich", 5.0, 15.0),
            ("Hawawshi", 25.0, 75.0), ("Hibiscus Tea", 10.0, 25.0)
        ]
    },
    {
        "category": "Fried Chicken",
        "size_multiplier": 2.8,
        "open_hour": 11,
        "close_hour": 24,
        "base_items": [
            ("3-Piece Meal", 60.0, 170.0), ("5-Piece Meal", 85.0, 240.0),
            ("Chicken Strips Meal", 55.0, 160.0), ("Spicy Chicken Sandwich", 45.0, 130.0),
            ("Classic Chicken Sandwich", 40.0, 120.0), ("Family Bucket (12 pcs)", 200.0, 600.0),
            ("Large Fries", 15.0, 45.0), ("Coleslaw", 10.0, 30.0),
            ("Garlic Dip", 5.0, 15.0), ("Soft Drink", 10.0, 25.0)
        ]
    },
    {
        "category": "Seafood",
        "size_multiplier": 1.2,
        "open_hour": 13,
        "close_hour": 23,
        "base_items": [
            ("Grilled Sea Bass", 120.0, 350.0), ("Fried Shrimp Meal", 100.0, 300.0),
            ("Seafood Soup", 40.0, 120.0), ("Calamari Rings", 60.0, 180.0),
            ("Sayadeya Rice", 15.0, 45.0), ("Grilled Salmon", 150.0, 420.0),
            ("Fish Fillet Sandwich", 45.0, 140.0), ("Mixed Seafood Platter", 250.0, 700.0),
            ("Tahini Salad", 8.0, 25.0), ("Lemon Mint Drink", 15.0, 45.0)
        ]
    },
    {
        "category": "Pizzeria",
        "size_multiplier": 2.2,
        "open_hour": 12,
        "close_hour": 24,
        "base_items": [
            ("Margherita Pizza", 50.0, 140.0), ("Pepperoni Pizza", 65.0, 180.0),
            ("BBQ Chicken Pizza", 70.0, 200.0), ("Vegetarian Pizza", 55.0, 160.0),
            ("Seafood Pizza", 85.0, 240.0), ("Cheese Stuffed Crust", 20.0, 50.0),
            ("Garlic Bread with Cheese", 25.0, 75.0), ("Chicken Wings (8 pcs)", 40.0, 120.0),
            ("Chocolate Pizza", 45.0, 130.0), ("Soft Drink (1L)", 15.0, 40.0)
        ]
    }
]

def generate_random_price() -> float:
    return round(random.uniform(5.0, 25.0), 2)

def generate_cost(price: float) -> float:
    # Cost should be < price, usually 25% to 45% of price
    pct = random.uniform(0.25, 0.45)
    return round(price * pct, 2)


def seed_restaurant_data(restaurant_id: str) -> Dict[str, Any]:
    """
    Generates realistic historical data for a newly 'signed-up' restaurant.
    Inserts directly cleanly into MenuItems, Orders, and OrderItems.
    """
    # 1. Profile the restaurant
    profile = random.choice(RESTAURANT_CATEGORIES)
    category_name = profile["category"]
    size_multiplier = profile["size_multiplier"]
    open_hour = profile["open_hour"]
    close_hour = profile["close_hour"]
    
    # 2. Generate Data Duration (Recent, minimum 3 months -> up to 12 months)
    months_back = random.randint(3, 12)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months_back * 30)
    
    engine = get_engine()
    inserted_menu_items = 0
    inserted_orders = 0
    inserted_order_items = 0

    with engine.begin() as conn:
        # Check if restaurant already exists to prevent duplicate seeding
        existing = conn.execute(
            text("SELECT TOP 1 1 FROM MenuItems WHERE RestaurantId = :rid"),
            {"rid": restaurant_id}
        ).fetchone()
        if existing:
            raise ValueError(f"Restaurant '{restaurant_id}' already has menu items. Cannot re-seed.")

        # --- A. Insert Menu Items ---
        menu_items_map = {} # ItemName -> MenuItemId
        menu_items_prices = {} # MenuItemId -> Price
        
        # We process base items and tweak their prices slightly with randomness
        sql_insert_menu = text("""
            INSERT INTO MenuItems (RestaurantId, ItemName, Price, Cost, ImageUrl)
            OUTPUT inserted.MenuItemId, inserted.ItemName, inserted.Price
            VALUES (:rid, :name, :price, :cost, NULL)
        """)
        
        for base_name, base_cost, base_price in profile["base_items"]:
            # Tweak prices by up to +/- 10% and round to nearest 5 for Egyptian market readability
            tweak = random.uniform(0.90, 1.10)
            final_price = float(round((base_price * tweak) / 5) * 5)
            if final_price < 5.0:
                final_price = 5.0
                
            final_cost = float(round((base_cost * tweak), 2))
            
            # Ensure constraint strictly (must be less than price, usually food cost is 25-45%)
            if final_cost >= final_price:
                 final_cost = round(final_price * 0.35, 2)
                 
            res = conn.execute(sql_insert_menu, {
                "rid": restaurant_id,
                "name": base_name,
                "price": final_price,
                "cost": final_cost
            }).fetchone()
            
            mi_id = res[0]
            mi_name = res[1]
            mi_price = res[2]
            
            menu_items_map[mi_name] = mi_id
            menu_items_prices[mi_id] = float(mi_price)
            inserted_menu_items += 1

        # --- B. Generate Daily Operational Data ---
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        all_generated_orders = []
        all_generated_order_items = []
        
        mi_ids_list = list(menu_items_map.values())
        
        while current_date <= end_date:
            daily_orders_buffer = [] # Store orders to bulk insert
            daily_items_buffer = []  # Correlated items

            # Realistic variables
            is_weekend = current_date.weekday() >= 5
            # Event probability: 10% on weekends, 2% on weekdays
            prob_event = 0.10 if is_weekend else 0.02
            is_event = 1 if random.random() < prob_event else 0
            
            # Temperature follows a rough seasonal sine wave over the year (0 to 35 C)
            day_of_year = current_date.timetuple().tm_yday
            seasonality = (random.random() * 5) + 15 + (15 * random.choice([1, -1]) * (abs(day_of_year - 180) / 180))
            daily_temp = max(min(round(seasonality, 1), 40.0), -5.0)

            # Volume calculation
            # Use normal distribution for realistic daily baseline volume
            mean_vol = 50 * size_multiplier
            base_vol = random.gauss(mean_vol, mean_vol * 0.2)
            
            # Weekend boost
            if is_weekend:
                base_vol *= random.uniform(1.2, 1.5)
            # Event boost
            if is_event:
                base_vol *= random.uniform(1.3, 1.8)
                
            # Temperature boost (Ice cream / Burgers / Cafe sell more on good days)
            if daily_temp > 20 and daily_temp < 32:
                base_vol *= 1.15
            elif daily_temp <= 10 or daily_temp >= 35:
                base_vol *= 0.85
                
            daily_target_orders = int(max(base_vol, 5))
            
            # Determine peak hour based on category to create realistic 'rush' bell-curves
            if "Cafe" in category_name:
                peak_hour = 10
            elif "Fine Dining" in category_name or "Seafood" in category_name:
                peak_hour = 20
            else:
                peak_hour = 18

            # Distribute orders over operating hours
            for _ in range(daily_target_orders):
                # Generate realistic order time using normal distribution
                rand_hour = int(random.gauss(peak_hour, 3))
                # Clip the hour strictly within the operating hours
                rand_hour = max(open_hour, min(rand_hour, close_hour - 1))
                
                rand_min = random.randint(0, 59)
                rand_sec = random.randint(0, 59)
                rand_ms = random.randint(0, 999) # Crucial for uniqueness mapping
                
                order_time = current_date.replace(hour=rand_hour, minute=rand_min, second=rand_sec, microsecond=rand_ms * 1000)
                
                # Pick 1 to 5 random unique menu items
                num_items_in_order = random.randint(1, min(5, len(mi_ids_list)))
                chosen_items = random.sample(mi_ids_list, num_items_in_order)
                
                total_value = 0.0
                total_qty = 0
                
                order_items_to_add = []
                for item_id in chosen_items:
                    qty = random.randint(1, 3)
                    unit_price = menu_items_prices[item_id]
                    line_total = float(qty * unit_price)
                    
                    total_value += line_total
                    total_qty += qty
                    
                    # We store the order timestamp as a temporary correlation ID
                    order_items_to_add.append({
                        "temp_corr": order_time,
                        "menu_item_id": item_id,
                        "qty": qty,
                        "unit_price": unit_price,
                        "line_total": line_total
                    })

                all_generated_orders.append({
                    "ts": order_time,
                    "temp": daily_temp,
                    "event": is_event,
                    "item_count": total_qty,
                    "total_value": round(total_value, 2)
                })
                all_generated_order_items.extend(order_items_to_add)

            current_date += timedelta(days=1)


        # --- C. Bulk Insert Orders and Read OrderIds ---
        # Insert in chunks of 200 to prevent parameterized query limits (SQL Server max 2100 params)
        CHUNK_SIZE = 200
        order_time_to_id_map = {}
        
        sql_insert_order = text("""
            INSERT INTO Orders (RestaurantId, OrderTimestamp, TemperatureCelsius, EventDay, ItemCount, TotalOrderValue)
            OUTPUT inserted.OrderId, inserted.OrderTimestamp
            VALUES (:rid, :ts, :temp, :event, :item_count, :total_val)
        """)

        # Fast execution via DBAPI executemany usually doesn't return OUTPUT correctly in pyodbc
        # We will loop and execute per chunk or individually to get the IDs mapping
        # Since we use OUTPUT, we can execute with parameters dictionary
        for i in range(0, len(all_generated_orders), CHUNK_SIZE):
            chunk = all_generated_orders[i:i+CHUNK_SIZE]
            
            # Values string construction for explicit batch output insertion
            value_strings = []
            params = {"rid": restaurant_id}
            
            for index, ord_data in enumerate(chunk):
                value_strings.append(f"(:rid, :ts_{index}, :temp_{index}, :event_{index}, :ic_{index}, :tv_{index})")
                params[f"ts_{index}"] = ord_data["ts"]
                params[f"temp_{index}"] = ord_data["temp"]
                params[f"event_{index}"] = ord_data["event"]
                params[f"ic_{index}"] = ord_data["item_count"]
                params[f"tv_{index}"] = ord_data["total_value"]

            batch_sql = text(f"""
                INSERT INTO Orders (RestaurantId, OrderTimestamp, TemperatureCelsius, EventDay, ItemCount, TotalOrderValue)
                OUTPUT inserted.OrderId, inserted.OrderTimestamp
                VALUES {','.join(value_strings)}
            """)
            
            res_orders = conn.execute(batch_sql, params).fetchall()
            inserted_orders += len(res_orders)
            
            for row in res_orders:
                db_id = row[0]
                db_ts = row[1] # datetime object
                order_time_to_id_map[db_ts] = db_id

        # --- D. Bulk Insert Order Items ---
        sql_insert_item = text("""
            INSERT INTO OrderItems (OrderId, MenuItemId, Quantity, UnitPrice, LineTotal)
            VALUES {values}
        """)
        
        for i in range(0, len(all_generated_order_items), CHUNK_SIZE):
            chunk = all_generated_order_items[i:i+CHUNK_SIZE]
            
            value_strings = []
            params = {}
            valid_inserts = 0
            
            for index, item_data in enumerate(chunk):
                temp_corr = item_data["temp_corr"]
                if temp_corr not in order_time_to_id_map:
                    continue # Should never happen unless precision was lost
                
                real_order_id = order_time_to_id_map[temp_corr]
                
                value_strings.append(f"(:oid_{index}, :mid_{index}, :q_{index}, :up_{index}, :lt_{index})")
                params[f"oid_{index}"] = real_order_id
                params[f"mid_{index}"] = item_data["menu_item_id"]
                params[f"q_{index}"] = item_data["qty"]
                params[f"up_{index}"] = item_data["unit_price"]
                params[f"lt_{index}"] = item_data["line_total"]
                valid_inserts += 1

            if value_strings:
                batch_item_sql = text(f"""
                    INSERT INTO OrderItems (OrderId, MenuItemId, Quantity, UnitPrice, LineTotal)
                    VALUES {','.join(value_strings)}
                """)
                conn.execute(batch_item_sql, params)
                inserted_order_items += valid_inserts

    return {
        "restaurant_id": restaurant_id,
        "profile_assigned": category_name,
        "months_generated": months_back,
        "date_range": {
            "start": start_date.strftime("%Y-%m-%d"),
            "end": end_date.strftime("%Y-%m-%d")
        },
        "operating_hours": f"{open_hour:02d}:00 - {close_hour:02d}:00",
        "inserted_records": {
            "menu_items": inserted_menu_items,
            "orders": inserted_orders,
            "order_items": inserted_order_items
        }
    }


def check_restaurant_has_data(restaurant_id: str) -> Dict[str, Any]:
    """
    Checks whether a restaurant already has menu items (i.e. has been seeded).
    Returns a dict with restaurant_id and has_data boolean.
    """
    engine = get_engine()
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT TOP 1 1 FROM MenuItems WHERE RestaurantId = :rid"),
            {"rid": restaurant_id}
        ).fetchone()
    return {
        "restaurant_id": restaurant_id,
        "has_data": existing is not None,
    }


def get_restaurants_without_data() -> Dict[str, Any]:
    """
    Iterates through all restaurants and returns those with no MenuItems.
    """
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT RestID FROM Restaurants")).fetchall()

    total = len(rows)
    empty_restaurants = []

    for row in rows:
        rest_id = str(row[0])
        result = check_restaurant_has_data(rest_id)
        if not result["has_data"]:
            empty_restaurants.append(rest_id)

    return {
        "total_restaurants": total,
        "empty_count": len(empty_restaurants),
        "empty_restaurants": empty_restaurants,
    }


def seed_all_restaurants() -> Dict[str, Any]:
    """
    Iterates through all restaurants in the Restaurants table.
    If a restaurant has no MenuItems, it calls seed_restaurant_data for it.
    """
    engine = get_engine()
    
    with engine.connect() as conn:
        # Fetch all restaurant IDs
        rows = conn.execute(text("SELECT RestID FROM Restaurants")).fetchall()
        
    seeded = []
    skipped = []
    errors = []
    
    for row in rows:
        rest_id = str(row[0])
        try:
            info = seed_restaurant_data(rest_id)
            seeded.append({
                "restaurant_id": rest_id,
                "profile": info["profile_assigned"],
                "records_inserted": info["inserted_records"]
            })
        except ValueError as e:
            if "already has menu items" in str(e):
                skipped.append(rest_id)
            else:
                errors.append({"restaurant_id": rest_id, "error": str(e)})
        except Exception as e:
            errors.append({"restaurant_id": rest_id, "error": str(e)})
            
    return {
        "total_restaurants": len(rows),
        "seeded_count": len(seeded),
        "skipped_count": len(skipped),
        "error_count": len(errors),
        "seeded_details": seeded,
        "skipped_restaurants": skipped,
        "errors": errors
    }


RECIPE_KNOWLEDGE_BASE = {
    "Burger": [("Minced Meat", "Kg", 0.200, "Meat"), ("Burger Bun", "Units", 1.0, "Bakery"), ("Lettuce", "Kg", 0.03, "Produce"), ("Cheese Slice", "Units", 1.0, "Dairy")],
    "Fries": [("Potatoes", "Kg", 0.250, "Produce"), ("Frying Oil", "Liters", 0.050, "Pantry"), ("Salt", "Kg", 0.005, "Pantry")],
    "Pizza": [("Pizza Flour", "Kg", 0.200, "Pantry"), ("Mozzarella Cheese", "Kg", 0.150, "Dairy"), ("Pizza Sauce", "Liters", 0.100, "Pantry")],
    "Sandwich": [("Bread Roll", "Units", 1.0, "Bakery"), ("Deli Meat", "Kg", 0.150, "Meat"), ("Lettuce", "Kg", 0.03, "Produce")],
    "Espresso": [("Coffee Beans", "Kg", 0.018, "Beverage")],
    "Latte": [("Coffee Beans", "Kg", 0.018, "Beverage"), ("Milk", "Liters", 0.200, "Dairy")],
    "Cappuccino": [("Coffee Beans", "Kg", 0.018, "Beverage"), ("Milk", "Liters", 0.150, "Dairy")],
    "Tea": [("Tea Bag", "Units", 1.0, "Beverage"), ("Sugar", "Kg", 0.020, "Pantry")],
    "Croissant": [("Flour", "Kg", 0.080, "Pantry"), ("Butter", "Kg", 0.050, "Dairy")],
    "Pasta": [("Dry Pasta", "Kg", 0.150, "Pantry"), ("Cooking Cream", "Liters", 0.100, "Dairy")],
    "Carbonara": [("Dry Pasta", "Kg", 0.150, "Pantry"), ("Pancetta", "Kg", 0.050, "Meat"), ("Eggs", "Units", 2.0, "Dairy")],
    "Lasagna": [("Lasagna Sheets", "Kg", 0.200, "Pantry"), ("Minced Meat", "Kg", 0.150, "Meat"), ("Mozzarella", "Kg", 0.100, "Dairy")],
    "Taco": [("Taco Shell", "Units", 1.0, "Bakery"), ("Minced Meat", "Kg", 0.100, "Meat"), ("Salsa", "Liters", 0.030, "Produce")],
    "Burrito": [("Tortilla Wrap", "Units", 1.0, "Bakery"), ("Minced Meat", "Kg", 0.150, "Meat"), ("Rice", "Kg", 0.050, "Pantry")],
    "Koshary": [("Rice", "Kg", 0.100, "Pantry"), ("Macaroni", "Kg", 0.100, "Pantry"), ("Lentils", "Kg", 0.050, "Pantry"), ("Tomato Sauce", "Liters", 0.100, "Pantry")],
    "Molokhia": [("Molokhia Leaves", "Kg", 0.200, "Produce"), ("Garlic", "Kg", 0.020, "Produce"), ("Chicken Broth", "Liters", 0.200, "Pantry")],
    "Shawarma": [("Shredded Meat", "Kg", 0.150, "Meat"), ("Wrap Bread", "Units", 1.0, "Bakery"), ("Garlic Dip", "Liters", 0.030, "Pantry")],
    "Fried Chicken": [("Chicken Pieces", "Units", 3.0, "Meat"), ("Frying Oil", "Liters", 0.100, "Pantry"), ("Flour", "Kg", 0.100, "Pantry")],
    "Chicken Wings": [("Chicken Wings", "Units", 8.0, "Meat"), ("BBQ Sauce", "Liters", 0.050, "Pantry")],
    "Seafood": [("Mixed Seafood", "Kg", 0.250, "Seafood"), ("Lemon", "Units", 1.0, "Produce")],
    "Salmon": [("Salmon Fillet", "Kg", 0.200, "Seafood"), ("Butter", "Kg", 0.020, "Dairy")],
    "Salad": [("Lettuce", "Kg", 0.150, "Produce"), ("Tomato", "Kg", 0.050, "Produce"), ("Cucumber", "Kg", 0.050, "Produce")],
    "Drink": [("Soda Syrup", "Liters", 0.050, "Beverage"), ("Carbonated Water", "Liters", 0.300, "Beverage")],
    "Water": [("Bottled Water", "Units", 1.0, "Beverage")],
    "Ice Cream": [("Ice Cream Base", "Liters", 0.150, "Dairy"), ("Milk", "Liters", 0.050, "Dairy")],
}
FALLBACK_RECIPE = [("Main Raw Ingredient", "Kg", 0.250, "General"), ("Base Garnish", "Kg", 0.050, "Produce"), ("Packaging Box", "Units", 1.0, "Packaging")]

def seed_inventory_data(restaurant_id: str) -> Dict[str, Any]:
    """
    Generates realistic dummy inventory items, links them to the existing menu items
    via MenuItemIngredients with realistic recipes (BOM), and seeds initial stock.
    """
    engine = get_engine()
    
    with engine.begin() as conn:
        # 1. Fetch menu items
        menu_items = conn.execute(
            text("SELECT MenuItemId, ItemName FROM MenuItems WHERE RestaurantId = :rid"),
            {"rid": restaurant_id}
        ).fetchall()
        
        if not menu_items:
            raise ValueError(f"Restaurant '{restaurant_id}' has no menu items. Seed POS data first.")
            
        existing_inv = conn.execute(
            text("SELECT TOP 1 1 FROM Inventories WHERE RestID = :rid"),
            {"rid": restaurant_id}
        ).fetchone()
        
        if existing_inv:
            raise ValueError(f"Restaurant '{restaurant_id}' already has inventory seeded.")
            
        inserted_inventories = 0
        inserted_mii = 0
        
        # We will keep a dictionary of created inventory items per restaurant to reuse them
        # e.g., if multiple items need "Lettuce", we only create "Lettuce" once in Inventories.
        created_inventories: Dict[str, int] = {}
        
        sql_insert_inv = text("""
            INSERT INTO Inventories (RestID, ItemName, Unit, ReorderLevel, ReorderQuantity, Stock, CostPerUnit, Status, Category)
            OUTPUT inserted.InventoryID
            VALUES (:rid, :name, :unit, :rl, :rq, :stock, :cost, :status, :category)
        """)
        
        sql_insert_mii = text("""
            INSERT INTO MenuItemIngredients (MenuItemId, InventoryID, QuantityUsedPerItem)
            VALUES (:mi_id, :inv_id, :qty)
        """)
            
        # 2. Map realistic ingredients to Menu Items
        for mi_id, mi_name in menu_items:
            
            # Find matching recipe
            matched_recipe = FALLBACK_RECIPE
            for keyword, recipe in RECIPE_KNOWLEDGE_BASE.items():
                if keyword.lower() in mi_name.lower():
                    matched_recipe = recipe
                    break
                    
            for ing_name, unit, qty, category in matched_recipe:
                # Deduplicate inventory creation
                if ing_name not in created_inventories:
                    # Give realistic limits based on unit
                    if unit == "Kg" or unit == "Liters":
                        rl = round(random.uniform(10, 50), 1)
                        rq = round(random.uniform(50, 100), 1)
                        stock = round(random.uniform(100, 300), 1)
                        cost = round(random.uniform(10, 80), 2)
                    else: # Units
                        rl = round(random.uniform(100, 500), 1)
                        rq = round(random.uniform(500, 2000), 1)
                        stock = round(random.uniform(1000, 3000), 1)
                        cost = round(random.uniform(0.5, 5), 2)
                        
                    res = conn.execute(sql_insert_inv, {
                        "rid": restaurant_id,
                        "name": ing_name,
                        "unit": unit,
                        "rl": rl,
                        "rq": rq,
                        "stock": stock,
                        "cost": cost,
                        "status": "Active",
                        "category": category
                    }).fetchone()
                    created_inventories[ing_name] = res[0]
                    inserted_inventories += 1
                
                inv_id = created_inventories[ing_name]
                
                # Check if this link already exists (just in case recipe has duplicates)
                try:
                    conn.execute(sql_insert_mii, {
                        "mi_id": mi_id,
                        "inv_id": inv_id,
                        "qty": qty
                    })
                    inserted_mii += 1
                except Exception:
                    pass # ignore duplicate insertions
                
    return {
        "restaurant_id": restaurant_id,
        "unique_ingredients_created": inserted_inventories,
        "recipes_mapped": inserted_mii
    }
    

def seed_all_inventory() -> Dict[str, Any]:
    """
    Seeds inventory data for all restaurants that do not have it yet.
    """
    engine = get_engine()
    
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT RestID FROM Restaurants")).fetchall()
        
    seeded = []
    skipped = []
    errors = []
    
    for row in rows:
        rest_id = str(row[0])
        try:
            info = seed_inventory_data(rest_id)
            seeded.append(info)
        except ValueError as e:
            skipped.append({"restaurant_id": rest_id, "reason": str(e)})
        except Exception as e:
            errors.append({"restaurant_id": rest_id, "error": str(e)})
            
    return {
        "total": len(rows),
        "seeded_count": len(seeded),
        "skipped_count": len(skipped),
        "error_count": len(errors),
        "details": seeded,
        "skipped": skipped,
        "errors": errors
    }

