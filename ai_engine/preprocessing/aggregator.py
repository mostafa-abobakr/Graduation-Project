"""
preprocessing/aggregator.py
Aggregates cleaned per-order rows into hourly item-level demand buckets.

Unlike the original version, this expands each item to a dense hourly series so
zero-demand hours remain visible to training and evaluation.
"""
import pandas as pd


def aggregate_hourly(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate cleaned order data into hourly buckets per item.

    Input columns:  ds, y, temperature_celsius, event_day, item_name
    Output columns: ds, y, temperature_celsius, event_day, item_name
    """
    if df.empty:
        return df.copy()

    df = df.copy()
    df["ds"] = pd.to_datetime(df["ds"]).dt.floor("h")
    df["date"] = df["ds"].dt.normalize()

    hourly_sales = (
        df.groupby(["ds", "item_name"], as_index=False)
        .agg({
            "y": "sum",
            "temperature_celsius": "mean",
            "event_day": "max",
        })
    )

    daily_context = (
        df.groupby("date", as_index=False)
        .agg({
            "temperature_celsius": "mean",
            "event_day": "max",
        })
    )

    dense_frames = []
    for item_name, item_sales in hourly_sales.groupby("item_name", sort=False):
        start_ds = item_sales["ds"].min()
        end_ds = item_sales["ds"].max()
        item_hours = pd.DataFrame({
            "ds": pd.date_range(start=start_ds, end=end_ds, freq="h"),
            "item_name": item_name,
        })
        item_hours["date"] = item_hours["ds"].dt.normalize()

        dense_item = item_hours.merge(
            item_sales,
            on=["ds", "item_name"],
            how="left",
        ).merge(
            daily_context,
            on="date",
            how="left",
            suffixes=("", "_daily"),
        )

        dense_item["y"] = dense_item["y"].fillna(0).astype(int)
        dense_item["temperature_celsius"] = (
            dense_item["temperature_celsius"]
            .fillna(dense_item["temperature_celsius_daily"])
            .ffill()
            .bfill()
        )
        dense_item["event_day"] = (
            dense_item["event_day"]
            .fillna(dense_item["event_day_daily"])
            .fillna(0)
            .astype(int)
        )

        dense_frames.append(
            dense_item[["ds", "y", "temperature_celsius", "event_day", "item_name"]]
        )

    hourly = pd.concat(dense_frames, ignore_index=True)
    return hourly.sort_values(["item_name", "ds"]).reset_index(drop=True)
