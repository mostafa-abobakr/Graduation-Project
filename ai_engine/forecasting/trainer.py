from prophet import Prophet
import joblib
import os

MODEL_DIR = "models/saved_models"
os.makedirs(MODEL_DIR, exist_ok=True)

def train_prophet(df, item_name: str):
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=True,
        yearly_seasonality=False
    )

    model.add_regressor("weather_good")
    model.add_regressor("event_day")

    model.fit(df[["ds", "y", "weather_good", "event_day"]])

    joblib.dump(model, f"{MODEL_DIR}/{item_name}.pkl")
