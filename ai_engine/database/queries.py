"""
database/queries.py
Named, typed SQL queries for all data access patterns.

All queries return only the columns needed — never SELECT *.
All parameterised inputs use SQLAlchemy's :param syntax (safe from injection).
"""
import pandas as pd
from sqlalchemy import text

from database.connection import get_engine


# ---------------------------------------------------------------------------
# Primary data-loading query
# ---------------------------------------------------------------------------
_ITEM_DEMAND_SQL = text("""
    SELECT
        o.OrderTimestamp   AS ds,
        oi.Quantity        AS y,
        o.TemperatureCelsius AS temperature_celsius,
        o.EventDay         AS event_day,
        mi.ItemName        AS item_name
    FROM OrderItems oi
    JOIN Orders     o  ON oi.OrderId     = o.OrderId
    JOIN MenuItems  mi ON oi.MenuItemId  = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
    ORDER BY o.OrderTimestamp
""")


def load_item_demand(restaurant_id: str) -> pd.DataFrame:
    """
    Join Orders → OrderItems → MenuItems for a single restaurant and return
    a flat DataFrame ready for clean_data() → aggregate_hourly().

    Output columns (contract — do not change):
        ds               : datetime
        y                : int
        temperature_celsius : float
        event_day        : int (0 or 1)
        item_name        : str

    This replaces the old single-table SELECT FROM orders query.
    """
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(
            _ITEM_DEMAND_SQL,
            conn,
            params={"restaurant_id": restaurant_id},
        )

    if df.empty:
        return pd.DataFrame(
            columns=[
                "ds",
                "y",
                "temperature_celsius",
                "event_day",
                "item_name",
            ]
        )

    df["ds"] = pd.to_datetime(df["ds"])
    df["event_day"] = df["event_day"].fillna(0).astype(int)
    return df


# ---------------------------------------------------------------------------
# Distinct items for a restaurant (used for iteration in evaluator)
# ---------------------------------------------------------------------------
_DISTINCT_ITEMS_SQL = text("""
    SELECT DISTINCT mi.ItemName
    FROM MenuItems mi
    WHERE mi.RestaurantId = :restaurant_id
    ORDER BY mi.ItemName
""")


def load_distinct_items(restaurant_id: str) -> list[str]:
    """Return a sorted list of item names for a given restaurant."""
    engine = get_engine()
    with engine.connect() as conn:
        result = conn.execute(
            _DISTINCT_ITEMS_SQL,
            {"restaurant_id": restaurant_id},
        )
        return [row[0] for row in result]
