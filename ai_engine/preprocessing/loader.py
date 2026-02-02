import pandas as pd
import os


def load_data(restaurant_id: str) -> pd.DataFrame:
    base_path = "../backend/data"
    restaurant_path = os.path.join(base_path, restaurant_id)

    if not os.path.exists(restaurant_path):
        raise FileNotFoundError(f"No data folder for restaurant {restaurant_id}")

    csv_files = [
        f for f in os.listdir(restaurant_path)
        if f.endswith(".csv")
    ]

    if not csv_files:
        raise FileNotFoundError("No CSV files found")

    dfs = [
        pd.read_csv(os.path.join(restaurant_path, f))
        for f in csv_files
    ]

    return pd.concat(dfs, ignore_index=True)
