import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error


def _train_and_predict(train_df, test_df):
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

    return forecast


# =========================
# HOURLY EVALUATION
# =========================
def evaluate_hourly(df: pd.DataFrame, return_details: bool = False):
    df = df.rename(columns={"quantity": "y"}).copy()

    test_hours = 7 * 24
    train_df = df.iloc[:-test_hours]
    test_df = df.iloc[-test_hours:]

    forecast = _train_and_predict(train_df, test_df)

    y_true = test_df["y"].values
    y_pred = forecast["yhat"].clip(lower=0).round().values

    mae = mean_absolute_error(y_true, y_pred)
    mape = np.mean(
        np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))
    ) * 100

    response = {
        "granularity": "hourly",
        "mae": round(mae, 2),
        "mape": round(mape, 2)
    }

    if return_details:
        response["details"] = (
            pd.DataFrame({
                "ds": test_df["ds"].values,
                "actual": y_true,
                "predicted": y_pred
            })
            .to_dict(orient="records")
        )

    return response



# =========================
# DAILY EVALUATION
# =========================
def evaluate_daily(df: pd.DataFrame, return_details: bool = False):
    df = df.rename(columns={"quantity": "y"}).copy()

    test_hours = 7 * 24
    train_df = df.iloc[:-test_hours]
    test_df = df.iloc[-test_hours:]

    forecast = _train_and_predict(train_df, test_df)

    test_df["date"] = test_df["ds"].dt.date
    forecast["date"] = forecast["ds"].dt.date

    daily_true = test_df.groupby("date")["y"].sum()
    daily_pred = (
        forecast.groupby("date")["yhat"]
        .sum()
        .clip(lower=0)
        .round()
    )

    mae = mean_absolute_error(daily_true, daily_pred)
    mape = np.mean(
        np.abs((daily_true - daily_pred) / np.where(daily_true == 0, 1, daily_true))
    ) * 100

    response = {
        "granularity": "daily",
        "mae": round(mae, 2),
        "mape": round(mape, 2)
    }

    if return_details:
        response["details"] = (
            pd.DataFrame({
                "date": daily_true.index.astype(str),
                "actual": daily_true.values,
                "predicted": daily_pred.values
            })
            .to_dict(orient="records")
        )

    return response

