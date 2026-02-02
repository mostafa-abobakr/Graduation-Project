from prophet import Prophet
import joblib
import os


def get_model_dir(restaurant_id: str):
    path = f"../backend/models/{restaurant_id}"
    os.makedirs(path, exist_ok=True)
    return path


def train_prophet(df, item_name: str, restaurant_id: str):
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=True,
        yearly_seasonality=False
    )

    model.add_regressor("weather_good")
    model.add_regressor("event_day")

    model.fit(df[["ds", "y", "weather_good", "event_day"]])

    model_path = os.path.join(
        get_model_dir(restaurant_id),
        f"{item_name}.pkl"
    )

    joblib.dump(model, model_path)
