import pandas as pd
import joblib
from datetime import timedelta
import os


def get_model_path(restaurant_id: str, item_name: str):
    return f"../backend/models/{restaurant_id}/{item_name}.pkl"


def forecast(
    restaurant_id: str,
    item_name: str,
    future_weather: list[int],
    future_events: list[int]
):
    model_path = get_model_path(restaurant_id, item_name)

    if not os.path.exists(model_path):
        raise FileNotFoundError("Model not found")

    model = joblib.load(model_path)

    last_ds = model.history["ds"].max()

    future_dates = pd.date_range(
        start=last_ds + timedelta(hours=1),
        periods=len(future_weather),
        freq="h"
    )

    future_df = pd.DataFrame({
        "ds": future_dates,
        "weather_good": future_weather,
        "event_day": future_events
    })

    forecast = model.predict(future_df)

    forecast["yhat"] = forecast["yhat"].clip(lower=0).round().astype(int)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0).round().astype(int)
    forecast["yhat_upper"] = forecast["yhat_upper"].clip(lower=0).round().astype(int)

    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]
