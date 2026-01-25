import pandas as pd

def aggregate_hourly(df: pd.DataFrame) -> pd.DataFrame:
    df["ds"] = df["order_timestamp"].dt.floor("H")

    hourly = (
        df.groupby(["ds", "item_name"], as_index=False)
        .agg({
            "quantity": "sum",
            "weather_good": "max",
            "event_day": "max"
        })
    )

    hourly = hourly.rename(columns={"quantity": "y"})
    return hourly
