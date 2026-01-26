import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error


def evaluate_prophet(df: pd.DataFrame):
    """
    df must contain:
    ds, quantity, weather_good, event_day
    """

    # Prophet format
    df = df.rename(columns={"quantity": "y"}).copy()

    # Minimum safety check
    test_hours = 7 * 24
    if len(df) <= test_hours:
        raise ValueError("Not enough data for evaluation")

    # Train / test split
    train_df = df.iloc[:-test_hours]
    test_df = df.iloc[-test_hours:]

    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=False
    )

    model.add_regressor("weather_good")
    model.add_regressor("event_day")

    model.fit(train_df)

    future = test_df[["ds", "weather_good", "event_day"]]
    forecast = model.predict(future)

    y_true = test_df["y"].values
    y_pred = forecast["yhat"].clip(lower=0).round().values

    mae = mean_absolute_error(y_true, y_pred)

    mape = np.mean(
        np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))
    ) * 100

    return {
        "mae": round(mae, 2),
        "mape": round(mape, 2)
    }
