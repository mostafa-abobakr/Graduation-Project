"""
preprocessing/aggregator.py
Aggregates cleaned per-order rows into hourly item-level demand buckets.

No changes from original — the DataFrame contract is unchanged.
"""
import pandas as pd


def aggregate_hourly(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate cleaned order data into hourly buckets per item.

    Input columns:  order_timestamp, quantity, temperature_celsius, event_day, item_name
    Output columns: ds, y, temperature_celsius, event_day, item_name
    """
    df = df.copy()
    df["ds"] = df["order_timestamp"].dt.floor("h")

    hourly = (
        df.groupby(["ds", "item_name"], as_index=False)
        .agg({
            "quantity":            "sum",
            "temperature_celsius": "mean",   # average temperature across the hour
            "event_day":           "max",    # flag is 1 if any order in the hour is event
        })
    )

    hourly = hourly.rename(columns={"quantity": "y"})
    return hourly
