import pandas as pd
import joblib
from datetime import timedelta
import os

MODEL_DIR = "models"


def forecast(item_name: str, future_weather: list[int], future_events: list[int]):
    model_path = os.path.join(MODEL_DIR, f"{item_name}.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for item '{item_name}' not found")

    model = joblib.load(model_path)

    # 🔹 Last timestamp from training data
    last_ds = model.history["ds"].max()

    # 🔹 Build next 168 hours ONLY
    future_dates = pd.date_range(
        start=last_ds + timedelta(hours=1),
        periods=168,
        freq="h"
    )

    future_df = pd.DataFrame({
        "ds": future_dates,
        "weather_good": future_weather,
        "event_day": future_events
    })

    forecast = model.predict(future_df)

    # =========================
    # ✅ POST-PROCESSING STEP
    # =========================

    # 1️⃣ Clip negatives
    forecast["yhat"] = forecast["yhat"].clip(lower=0)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0)
    forecast["yhat_upper"] = forecast["yhat_upper"].clip(lower=0)

    # 2️⃣ Round to integers
    forecast["yhat"] = forecast["yhat"].round().astype(int)
    forecast["yhat_lower"] = forecast["yhat_lower"].round().astype(int)
    forecast["yhat_upper"] = forecast["yhat_upper"].round().astype(int)

    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]
