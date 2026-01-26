from fastapi import FastAPI, HTTPException
import pandas as pd

from preprocessing.loader import load_data
from preprocessing.cleaner import clean_data
from preprocessing.aggregator import aggregate_hourly
from forecasting.trainer import train_prophet
from forecasting.predictor import forecast

app = FastAPI(title="ZeroBite ML Service")

MIN_HOURS = 14 * 24  # 14 days minimum history
FORECAST_HOURS = 7 * 24  # 1 week


@app.get("/")
def root():
    return {"status": "ZeroBite ML service running"}


@app.post("/train")
def train_model(path: str):
    df = load_data(path)
    df = clean_data(df)
    df = aggregate_hourly(df)

    trained, skipped = [], []

    for item in df["item_name"].unique():
        item_df = df[df["item_name"] == item]

        if len(item_df) < MIN_HOURS:
            skipped.append(item)
            continue

        train_prophet(item_df, item)
        trained.append(item)

    return {
        "trained_items": trained,
        "skipped_items": skipped
    }


# ================================
# Hourly Forecast (internal use)
# ================================
@app.post("/forecast/{item_name}")
def hourly_forecast(item_name: str):
    future_weather = [1] * FORECAST_HOURS
    future_events = [0] * FORECAST_HOURS

    result = forecast(item_name, future_weather, future_events)

    return result.to_dict(orient="records")


# ================================
# Daily Aggregated Forecast
# ================================
@app.post("/forecast/daily/{item_name}")
def daily_forecast(item_name: str):
    future_weather = [1] * FORECAST_HOURS
    future_events = [0] * FORECAST_HOURS

    hourly = forecast(item_name, future_weather, future_events)

    if hourly.empty:
        raise HTTPException(status_code=404, detail="No forecast data")

    # Convert ds to date
    hourly["date"] = hourly["ds"].dt.date

    daily = (
        hourly
        .groupby("date", as_index=False)["yhat"]
        .sum()
        .rename(columns={"yhat": "daily_demand"})
    )

    # Round & clip (step 1 already applied, but double safe)
    daily["daily_demand"] = daily["daily_demand"].round().clip(lower=0).astype(int)

    return daily.to_dict(orient="records")
