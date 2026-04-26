"""
database/seeder.py
Generates realistic historical standard POS data (dummy data) for a restaurant
by utilizing randomized volumes, temperature effects, and event days.
Inserts into MenuItems, Orders, and OrderItems.
"""
import math
import random
from typing import Dict, Any, List, Optional, Set, Tuple
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


def _contains_any(text_value: str, keywords: Tuple[str, ...]) -> bool:
    return any(keyword in text_value for keyword in keywords)


def _gaussian_weight(value: float, peak: float, spread: float) -> float:
    spread = max(spread, 0.5)
    return math.exp(-((value - peak) ** 2) / (2 * (spread ** 2)))


def _generate_daily_temperature(day: datetime, rng: random.Random) -> float:
    """
    Generate a Cairo-like seasonal temperature curve with light day-to-day noise.
    Kept smooth on purpose so the forecasting model can learn it from seeded data.
    """
    day_of_year = day.timetuple().tm_yday
    seasonal = 23.0 + 10.5 * math.sin((2 * math.pi * (day_of_year - 80)) / 365.25)
    noisy = seasonal + rng.gauss(0.0, 2.2)
    return round(max(min(noisy, 40.0), 4.0), 1)


def _get_weekday_factor(category_name: str, weekday: int) -> float:
    """
    Egyptian demand pattern: Friday/Saturday are the strongest days.
    Python weekday(): Monday=0 ... Sunday=6.
    """
    if "Cafe" in category_name:
        factors = {
            0: 1.05, 1: 1.08, 2: 1.07, 3: 1.08,
            4: 0.95, 5: 0.92, 6: 0.98,
        }
    elif "Fine Dining" in category_name or "Seafood" in category_name:
        factors = {
            0: 0.84, 1: 0.88, 2: 0.92, 3: 1.00,
            4: 1.18, 5: 1.25, 6: 0.96,
        }
    else:
        factors = {
            0: 0.94, 1: 0.97, 2: 1.00, 3: 1.04,
            4: 1.16, 5: 1.20, 6: 1.02,
        }
    return factors.get(weekday, 1.0)


def _get_weather_factor(category_name: str, daily_temp: float) -> float:
    if "Cafe" in category_name:
        if 20 <= daily_temp <= 31:
            return 1.08
        if daily_temp >= 35:
            return 1.03
        if daily_temp <= 12:
            return 0.90
        return 1.0

    if "Fine Dining" in category_name or "Seafood" in category_name:
        if 18 <= daily_temp <= 30:
            return 1.06
        if daily_temp >= 36 or daily_temp <= 10:
            return 0.90
        return 1.0

    if 18 <= daily_temp <= 31:
        return 1.05
    if daily_temp >= 37 or daily_temp <= 8:
        return 0.88
    return 1.0


def _get_service_profile(category_name: str) -> List[Tuple[float, float, float]]:
    if "Cafe" in category_name:
        return [
            (9.0, 1.5, 0.42),
            (12.5, 2.0, 0.33),
            (15.5, 1.8, 0.25),
        ]
    if "Fine Dining" in category_name:
        return [
            (18.5, 1.4, 0.30),
            (20.2, 1.5, 0.50),
            (21.5, 1.1, 0.20),
        ]
    if "Seafood" in category_name:
        return [
            (14.0, 1.7, 0.34),
            (19.5, 1.8, 0.46),
            (21.0, 1.2, 0.20),
        ]
    if "Traditional Egyptian" in category_name:
        return [
            (11.5, 1.7, 0.26),
            (15.0, 1.9, 0.38),
            (19.5, 2.0, 0.36),
        ]
    return [
        (13.5, 2.1, 0.40),
        (18.0, 2.0, 0.30),
        (20.5, 1.9, 0.30),
    ]


def _allocate_hourly_orders(
    daily_target_orders: int,
    open_hour: int,
    close_hour: int,
    category_name: str,
    is_weekend: bool,
    is_event: bool,
) -> Dict[int, int]:
    hours = list(range(open_hour, close_hour))
    service_profile = _get_service_profile(category_name)
    weights: List[float] = []

    for hour in hours:
        weight = 0.0
        for peak, spread, strength in service_profile:
            weight += strength * _gaussian_weight(hour, peak, spread)

        if is_weekend and hour >= 18:
            weight *= 1.08
        if is_event and hour >= 17:
            weight *= 1.14

        weights.append(max(weight, 0.01))

    total_weight = sum(weights)
    raw_counts = [(daily_target_orders * weight) / total_weight for weight in weights]
    base_counts = [int(value) for value in raw_counts]

    remaining = daily_target_orders - sum(base_counts)
    remainders = sorted(
        enumerate(raw_counts),
        key=lambda item: item[1] - int(item[1]),
        reverse=True,
    )
    for index, _ in remainders[:remaining]:
        base_counts[index] += 1

    return dict(zip(hours, base_counts))


def _build_item_profile(
    item_name: str,
    category_name: str,
    item_id: int,
    price: float,
    rank: int,
    rng: random.Random,
) -> Dict[str, Any]:
    lower_name = item_name.lower()

    beverage_keywords = (
        "espresso", "latte", "cappuccino", "americano", "tea", "coffee",
        "soft drink", "cola", "water", "milkshake", "wine", "margarita",
        "hibiscus", "lemon mint",
    )
    dessert_keywords = (
        "ice cream", "tiramisu", "panna cotta", "churros", "chocolate pizza",
    )
    side_keywords = (
        "fries", "onion rings", "coleslaw", "garlic dip", "stuffed crust",
        "garlic bread", "chips", "guacamole", "salad", "sparkling water",
    )
    breakfast_keywords = (
        "espresso", "latte", "cappuccino", "americano", "tea", "iced coffee",
        "croissant", "muffin", "bagel", "falafel", "foul",
    )
    lunch_keywords = (
        "burger", "shawarma", "sandwich", "taco", "burrito", "quesadilla",
        "koshary", "hawawshi", "molokhia",
    )
    dinner_keywords = (
        "pizza", "lasagna", "risotto", "sea bass", "salmon", "seafood",
        "platter", "bucket", "fajitas", "wine",
    )
    shareable_keywords = ("pizza", "bucket", "platter", "nachos", "fajitas", "quesadilla")
    hot_drink_keywords = ("espresso", "latte", "cappuccino", "americano", "tea")
    cold_refreshment_keywords = (
        "iced coffee", "ice cream", "milkshake", "soft drink", "cola",
        "water", "margarita", "lemon mint",
    )
    light_item_keywords = ("salad", "veggie", "vegetarian", "caprese", "sparkling water")
    comfort_food_keywords = (
        "burger", "pizza", "lasagna", "carbonara", "risotto", "fried",
        "shawarma", "bucket", "hawawshi", "koshary", "molokhia",
    )

    role = "main"
    if _contains_any(lower_name, beverage_keywords):
        role = "beverage"
    elif _contains_any(lower_name, dessert_keywords):
        role = "dessert"
    elif _contains_any(lower_name, side_keywords):
        role = "side"

    is_breakfast = _contains_any(lower_name, breakfast_keywords)
    is_lunch = _contains_any(lower_name, lunch_keywords)
    is_dinner = _contains_any(lower_name, dinner_keywords)
    is_shareable = _contains_any(lower_name, shareable_keywords)
    is_hot_drink = _contains_any(lower_name, hot_drink_keywords)
    is_cold_refreshment = _contains_any(lower_name, cold_refreshment_keywords)
    is_light_item = _contains_any(lower_name, light_item_keywords)
    is_comfort_food = _contains_any(lower_name, comfort_food_keywords)

    role_factor = 1.0
    if role == "main":
        role_factor = 1.24
    elif role == "side":
        role_factor = 0.80
    elif role == "beverage":
        role_factor = 0.92 if "Cafe" in category_name else 0.74
    elif role == "dessert":
        role_factor = 0.64

    rank_factor = max(0.84, 1.10 - (rank * 0.02))
    price_factor = max(0.65, 1.15 - (price / 450.0))
    base_popularity = rank_factor * price_factor * role_factor * rng.uniform(0.96, 1.08)

    if is_breakfast:
        peak_hour, peak_spread = 9.5, 1.8
    elif role == "dessert":
        peak_hour, peak_spread = (15.5, 2.0) if "Cafe" in category_name else (20.0, 2.0)
    elif role == "beverage" and is_cold_refreshment:
        peak_hour, peak_spread = (14.5, 2.3) if "Cafe" in category_name else (18.5, 2.4)
    elif is_lunch:
        peak_hour, peak_spread = 13.5, 2.2
    elif is_dinner:
        peak_hour, peak_spread = 19.5, 2.0
    elif "Cafe" in category_name:
        peak_hour, peak_spread = 10.5, 2.0
    elif "Fine Dining" in category_name or "Seafood" in category_name:
        peak_hour, peak_spread = 20.0, 1.9
    else:
        peak_hour, peak_spread = 18.0, 2.3

    weekend_multiplier = 1.0
    if is_shareable or role == "dessert" or _contains_any(lower_name, ("wine", "margarita")):
        weekend_multiplier = 1.18
    elif role == "main":
        weekend_multiplier = 1.08

    event_multiplier = 1.0
    if is_shareable or _contains_any(lower_name, ("wine", "margarita", "soft drink", "cola")):
        event_multiplier = 1.20
    elif role in ("dessert", "beverage"):
        event_multiplier = 1.10
    else:
        event_multiplier = 1.06

    return {
        "item_id": item_id,
        "item_name": item_name,
        "role": role,
        "base_popularity": base_popularity,
        "peak_hour": peak_hour,
        "peak_spread": peak_spread,
        "weekend_multiplier": weekend_multiplier,
        "event_multiplier": event_multiplier,
        "is_breakfast": is_breakfast,
        "is_lunch": is_lunch,
        "is_shareable": is_shareable,
        "is_hot_drink": is_hot_drink,
        "is_cold_refreshment": is_cold_refreshment,
        "is_light_item": is_light_item,
        "is_comfort_food": is_comfort_food,
    }


def _get_item_weight(
    item_profile: Dict[str, Any],
    order_hour: int,
    daily_temp: float,
    is_weekend: bool,
    is_event: bool,
) -> float:
    weight = item_profile["base_popularity"]
    weight *= 0.35 + (1.15 * _gaussian_weight(
        order_hour,
        item_profile["peak_hour"],
        item_profile["peak_spread"],
    ))

    if item_profile["is_breakfast"] and order_hour >= 12:
        weight *= 0.72
    if item_profile["role"] == "dessert" and order_hour < 13:
        weight *= 0.70

    if item_profile["is_cold_refreshment"]:
        if daily_temp >= 24:
            weight *= 1.0 + min((daily_temp - 24) * 0.025, 0.45)
        elif daily_temp <= 14:
            weight *= 0.80
    elif item_profile["is_hot_drink"]:
        if daily_temp <= 18:
            weight *= 1.0 + min((18 - daily_temp) * 0.03, 0.35)
        elif daily_temp >= 30:
            weight *= 0.78
    elif item_profile["is_light_item"] and daily_temp >= 28:
        weight *= 1.12
    elif item_profile["is_comfort_food"]:
        if daily_temp <= 16:
            weight *= 1.08
        elif daily_temp >= 35:
            weight *= 0.84

    if is_weekend:
        weight *= item_profile["weekend_multiplier"]
    if is_event:
        weight *= item_profile["event_multiplier"]

    return max(weight, 0.05)


def _choose_weighted_item(
    candidates: List[Dict[str, Any]],
    order_hour: int,
    daily_temp: float,
    is_weekend: bool,
    is_event: bool,
    rng: random.Random,
    exclude_item_ids: Optional[Set[int]] = None,
) -> Optional[Dict[str, Any]]:
    available = [
        item for item in candidates
        if exclude_item_ids is None or item["item_id"] not in exclude_item_ids
    ]
    if not available:
        return None

    weights = [
        _get_item_weight(item, order_hour, daily_temp, is_weekend, is_event)
        for item in available
    ]
    total_weight = sum(weights)
    if total_weight <= 0:
        return rng.choice(available)

    pick = rng.uniform(0.0, total_weight)
    cumulative = 0.0
    for item, weight in zip(available, weights):
        cumulative += weight
        if cumulative >= pick:
            return item
    return available[-1]


def _sample_quantity(item_profile: Dict[str, Any], rng: random.Random) -> int:
    if item_profile["is_shareable"]:
        return 1 if rng.random() < 0.92 else 2
    if item_profile["role"] == "beverage":
        return 1 if rng.random() < 0.94 else 2
    if item_profile["role"] == "side":
        roll = rng.random()
        if roll < 0.82:
            return 1
        if roll < 0.98:
            return 2
        return 3
    if item_profile["role"] == "dessert":
        return 1 if rng.random() < 0.96 else 2
    return 1 if rng.random() < 0.84 else 2


def seed_restaurant_data(restaurant_id: str) -> Dict[str, Any]:
    """
    Generates realistic historical data for a newly 'signed-up' restaurant.
    Inserts directly cleanly into MenuItems, Orders, and OrderItems.
    """
    rng = random.Random(f"restaurant-seed::{restaurant_id}")

    # 1. Profile the restaurant
    profile = rng.choice(RESTAURANT_CATEGORIES)
    category_name = profile["category"]
    size_multiplier = profile["size_multiplier"]
    open_hour = profile["open_hour"]
    close_hour = profile["close_hour"]
    
    # 2. Generate enough history for Prophet to learn stable item patterns.
    months_back = rng.randint(8, 12)
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
        
        inserted_items_metadata = []

        for rank, (base_name, base_cost, base_price) in enumerate(profile["base_items"]):
            # Tweak prices by up to +/- 10% and round to nearest 5 for Egyptian market readability
            tweak = rng.uniform(0.90, 1.10)
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
            inserted_items_metadata.append({
                "item_id": mi_id,
                "item_name": mi_name,
                "price": float(mi_price),
                "rank": rank,
            })
            inserted_menu_items += 1

        # --- B. Generate Daily Operational Data ---
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        all_generated_orders = []
        all_generated_order_items = []

        item_profiles = [
            _build_item_profile(
                item_name=item["item_name"],
                category_name=category_name,
                item_id=item["item_id"],
                price=item["price"],
                rank=item["rank"],
                rng=rng,
            )
            for item in inserted_items_metadata
        ]
        main_pool = [item for item in item_profiles if item["role"] == "main"]
        side_pool = [item for item in item_profiles if item["role"] == "side"]
        beverage_pool = [item for item in item_profiles if item["role"] == "beverage"]
        dessert_pool = [item for item in item_profiles if item["role"] == "dessert"]
        breakfast_food_pool = [
            item for item in item_profiles
            if item["role"] != "beverage" and item["is_breakfast"]
        ]
        lunch_main_pool = [
            item for item in main_pool
            if item["is_lunch"] or not item["is_breakfast"]
        ]
        
        while current_date <= end_date:
            # Realistic variables
            weekday = current_date.weekday()
            is_weekend = weekday in (4, 5)
            prob_event = 0.16 if is_weekend else 0.05
            is_event = 1 if rng.random() < prob_event else 0
            daily_temp = _generate_daily_temperature(current_date, rng)

            progress_ratio = (current_date - start_date).days / max((end_date - start_date).days, 1)
            weekday_factor = _get_weekday_factor(category_name, weekday)
            weather_factor = _get_weather_factor(category_name, daily_temp)
            trend_factor = 0.96 + (0.10 * progress_ratio)
            noise_factor = max(rng.gauss(1.0, 0.05), 0.88)
            event_factor = rng.uniform(1.22, 1.45) if is_event else 1.0

            mean_vol = 52 * size_multiplier
            base_vol = mean_vol * weekday_factor * weather_factor * trend_factor * noise_factor * event_factor
            daily_target_orders = max(int(round(base_vol)), 10)
            hourly_orders = _allocate_hourly_orders(
                daily_target_orders=daily_target_orders,
                open_hour=open_hour,
                close_hour=close_hour,
                category_name=category_name,
                is_weekend=is_weekend,
                is_event=bool(is_event),
            )

            for order_hour, order_count in hourly_orders.items():
                for _ in range(order_count):
                    rand_min = rng.randint(0, 59)
                    rand_sec = rng.randint(0, 59)
                    rand_ms = rng.randint(0, 999)
                    order_time = current_date.replace(
                        hour=order_hour,
                        minute=rand_min,
                        second=rand_sec,
                        microsecond=rand_ms * 1000,
                    )

                    if "Cafe" in category_name:
                        primary_pool = main_pool + beverage_pool
                    else:
                        primary_pool = main_pool
                    if not primary_pool:
                        primary_pool = item_profiles

                    used_item_ids = set()
                    order_items_to_add = []
                    total_value = 0.0
                    total_qty = 0

                    primary_item = _choose_weighted_item(
                        primary_pool,
                        order_hour,
                        daily_temp,
                        is_weekend,
                        bool(is_event),
                        rng,
                        used_item_ids,
                    )
                    if primary_item is None:
                        continue

                    primary_qty = _sample_quantity(primary_item, rng)
                    primary_price = menu_items_prices[primary_item["item_id"]]
                    primary_line_total = float(primary_qty * primary_price)
                    order_items_to_add.append({
                        "temp_corr": order_time,
                        "menu_item_id": primary_item["item_id"],
                        "qty": primary_qty,
                        "unit_price": primary_price,
                        "line_total": primary_line_total,
                    })
                    used_item_ids.add(primary_item["item_id"])
                    total_value += primary_line_total
                    total_qty += primary_qty

                    if "Cafe" in category_name:
                        pastry_probability = 0.44 if primary_item["role"] == "beverage" else 0.18
                        sandwich_probability = 0.14 if 11 <= order_hour <= 15 else 0.05
                        beverage_probability = 0.78 if primary_item["role"] != "beverage" else 0.0

                        companion_pools = [
                            (breakfast_food_pool, pastry_probability),
                            (lunch_main_pool, sandwich_probability),
                            (beverage_pool, beverage_probability),
                        ]
                    else:
                        side_probability = 0.34 + (0.10 if primary_item["is_shareable"] else 0.0)
                        beverage_probability = 0.42 + (0.12 if daily_temp >= 30 else 0.0)
                        dessert_probability = 0.08 + (0.08 if (is_weekend or is_event) else 0.0)

                        if "Fine Dining" in category_name or "Seafood" in category_name:
                            beverage_probability += 0.12
                            dessert_probability += 0.10

                        companion_pools = [
                            (side_pool, min(side_probability, 0.75)),
                            (beverage_pool, min(beverage_probability, 0.85)),
                            (dessert_pool, min(dessert_probability, 0.50)),
                        ]

                    for pool, probability in companion_pools:
                        if not pool or rng.random() >= probability:
                            continue

                        companion = _choose_weighted_item(
                            pool,
                            order_hour,
                            daily_temp,
                            is_weekend,
                            bool(is_event),
                            rng,
                            used_item_ids,
                        )
                        if companion is None:
                            continue

                        companion_qty = _sample_quantity(companion, rng)
                        companion_price = menu_items_prices[companion["item_id"]]
                        companion_line_total = float(companion_qty * companion_price)
                        order_items_to_add.append({
                            "temp_corr": order_time,
                            "menu_item_id": companion["item_id"],
                            "qty": companion_qty,
                            "unit_price": companion_price,
                            "line_total": companion_line_total,
                        })
                        used_item_ids.add(companion["item_id"])
                        total_value += companion_line_total
                        total_qty += companion_qty

                    if not order_items_to_add:
                        continue

                    # Small ticket uplift on event nights for group orders.
                    if is_event and order_hour >= 18 and rng.random() < 0.08 and main_pool:
                        extra_main = _choose_weighted_item(
                            main_pool,
                            order_hour,
                            daily_temp,
                            is_weekend,
                            bool(is_event),
                            rng,
                            used_item_ids,
                        )
                        if extra_main is not None:
                            extra_qty = 1
                            extra_price = menu_items_prices[extra_main["item_id"]]
                            extra_line_total = float(extra_qty * extra_price)
                            order_items_to_add.append({
                                "temp_corr": order_time,
                                "menu_item_id": extra_main["item_id"],
                                "qty": extra_qty,
                                "unit_price": extra_price,
                                "line_total": extra_line_total,
                            })
                            used_item_ids.add(extra_main["item_id"])
                            total_value += extra_line_total
                            total_qty += extra_qty

                    total_value = round(total_value, 2)

                    all_generated_orders.append({
                        "ts": order_time,
                        "temp": daily_temp,
                        "event": is_event,
                        "item_count": total_qty,
                        "total_value": total_value,
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
        
        SUPPLIERS = [
            "Fresh Farms Co.", "Metro Wholesale", "Al-Ahram Foods",
            "Delta Distribution", "Nile Valley Produce", "Cairo Direct Supply",
            "Golden Harvest Ltd.", "El-Salam Trading", "AlexFood Supplies",
        ]
        
        sql_insert_inv = text("""
            INSERT INTO Inventories (RestID, ItemName, Unit, ReorderLevel, ReorderQuantity,
                                    Stock, CostPerUnit, Category, Description, Supplier,
                                    ExpiryDate, LastUpdated)
            OUTPUT inserted.InventoryID
            VALUES (:rid, :name, :unit, :rl, :rq, :stock, :cost, :category,
                    :description, :supplier, :expiry, :last_updated)
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
                        
                    # Generate realistic dummy values for new columns
                    supplier = random.choice(SUPPLIERS)
                    expiry = datetime.now() + timedelta(days=random.randint(30, 365))
                    description = f"Raw ingredient: {ing_name} ({unit})"
                    
                    res = conn.execute(sql_insert_inv, {
                        "rid": restaurant_id,
                        "name": ing_name,
                        "unit": unit,
                        "rl": rl,
                        "rq": rq,
                        "stock": stock,
                        "cost": cost,
                        "category": category,
                        "description": description,
                        "supplier": supplier,
                        "expiry": expiry,
                        "last_updated": datetime.now()
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

