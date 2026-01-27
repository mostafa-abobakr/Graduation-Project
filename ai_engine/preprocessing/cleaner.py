import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df["order_timestamp"] = pd.to_datetime(df["order_timestamp"])
    df = df.dropna(subset=["item_name", "quantity"])
    return df
