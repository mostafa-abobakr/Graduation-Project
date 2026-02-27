"""
preprocessing/cleaner.py
Cleans raw order data loaded from the database.

No changes from original — the DataFrame contract from load_data()
is identical, so this module is untouched.
"""
import pandas as pd


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean raw order data:
    - Parse order_timestamp as datetime
    - Drop rows missing item_name or quantity
    - Drop duplicate rows
    """
    df = df.copy()
    df["order_timestamp"] = pd.to_datetime(df["order_timestamp"])
    df = df.dropna(subset=["item_name", "quantity"])
    df = df.drop_duplicates()
    return df
