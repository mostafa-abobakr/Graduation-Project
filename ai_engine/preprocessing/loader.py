"""
preprocessing/loader.py
Public entry point for loading restaurant order data.

Delegates to database/queries.py which executes the normalized
three-table JOIN (Orders → OrderItems → MenuItems).

Output DataFrame columns (contract):
    order_timestamp     : datetime
    quantity            : int
    temperature_celsius : float
    event_day           : int (0 or 1)
    item_name           : str
"""
from database.queries import load_item_demand
import pandas as pd


def load_data(restaurant_id: str) -> pd.DataFrame:
    """
    Load the full order history for a restaurant from SQL Server.

    Internally JOINs Orders, OrderItems, and MenuItems so that
    callers receive a denormalized flat DataFrame identical in shape
    to what clean_data() and aggregate_hourly() expect.

    Args:
        restaurant_id: The restaurant identifier to filter by.

    Returns:
        DataFrame with columns:
            order_timestamp, quantity, temperature_celsius, event_day, item_name

    Raises:
        EnvironmentError: If DATABASE_URL is not set.
        sqlalchemy.exc.OperationalError: On connection failures.
    """
    return load_item_demand(restaurant_id)
