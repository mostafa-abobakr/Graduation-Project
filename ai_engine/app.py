"""
app.py
ZeroBite ML Service — FastAPI Application Entry Point.

All existing endpoint signatures, request bodies, and response shapes are preserved.
New endpoints added per spec:
    GET  /metrics/item/{restaurant_id}/{item_name}
    GET  /metrics/overall/{restaurant_id}
    GET  /metrics/temperature_sanity/{restaurant_id}/{item_name}

Internal data loading has been rewired to use the normalized SQL schema:
    Orders → OrderItems → MenuItems
"""
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, HTTPException
import joblib
import json
import os

from config.settings import validate_required
from preprocessing.loader import load_data
from preprocessing.cleaner import clean_data
from preprocessing.aggregator import aggregate_hourly

from forecasting.trainer import train_prophet
from forecasting.predictor import forecast, get_model_path, get_meta_path
from forecasting.evaluator import (
    evaluate_hourly,
    evaluate_daily,
    evaluate_overall_items,
    evaluate_temperature_sanity,
)
from schemas.forecast_requests import HourlyForecastRequest, DailyForecastRequest


# ---------------------------------------------------------------------------
# Application lifespan — validate config at startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required()   # raises EnvironmentError if DATABASE_URL missing
    yield


app = FastAPI(title="ZeroBite ML Service", lifespan=lifespan)

# System constants — do not expose to callers
FORECAST_HOURS = 7 * 24
MIN_HOURS      = 336   # 2 weeks of hourly data, enforced per item


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ZeroBite ML service running"}


# ---------------------------------------------------------------------------
# TRAIN
# ---------------------------------------------------------------------------

@app.post("/train/{restaurant_id}")
def train_model(restaurant_id: str):
    """
    Load full history for the restaurant from SQL Server, aggregate to
    hourly item-level demand, and train one Prophet model per item.

    - Enforces MIN_HOURS (336) per item — items below threshold are skipped.
    - Idempotent: re-running overwrites existing models.
    - Stores models on disk at MODEL_ROOT/{restaurant_id}/{item_name}.pkl
    """
    try:
        df = load_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail=f"No data found for restaurant_id={restaurant_id}",
        )

    df = clean_data(df)
    df = aggregate_hourly(df)

    trained, skipped = [], []

    for item in df["item_name"].unique():
        item_df = df[df["item_name"] == item]

        if len(item_df) < MIN_HOURS:
            skipped.append(item)
            continue

        train_prophet(item_df, item, restaurant_id)
        trained.append(item)

    status = "success" if trained else "no_models_trained"

    return {
        "restaurant_id": restaurant_id,
        "trained_items": trained,
        "skipped_items": skipped,
        "status":        status,
    }


# ---------------------------------------------------------------------------
# HOURLY FORECAST
# ---------------------------------------------------------------------------

@app.post("/forecast/hourly/{restaurant_id}/{item_name}")
def hourly_forecast(
    restaurant_id: str,
    item_name: str,
    request: HourlyForecastRequest,
):
    """
    Return 24 hourly demand predictions.
    The same temperature and event flag are repeated for all 24 hours.
    """
    future_temp   = [request.temperature_celsius] * 24
    future_events = [request.event_day] * 24

    try:
        result = forecast(restaurant_id, item_name, future_temp, future_events)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.to_dict(orient="records")


# ---------------------------------------------------------------------------
# DAILY FORECAST
# ---------------------------------------------------------------------------

@app.post("/forecast/daily/{restaurant_id}/{item_name}")
def daily_forecast(
    restaurant_id: str,
    item_name: str,
    request: DailyForecastRequest,
):
    """
    Return 7 daily demand totals.
    Each day is internally expanded to 24 hours; aggregation happens server-side.
    """
    if len(request.weekly_temperatures) != 7 or len(request.weekly_events) != 7:
        raise HTTPException(
            status_code=400,
            detail="Must provide exactly 7 values for weekly temps/events.",
        )

    future_temp: list[float] = []
    future_events: list[int] = []

    for t, e in zip(request.weekly_temperatures, request.weekly_events):
        future_temp.extend([t] * 24)
        future_events.extend([e] * 24)

    try:
        hourly = forecast(restaurant_id, item_name, future_temp, future_events)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if hourly.empty:
        raise HTTPException(status_code=404, detail="No forecast data")

    hourly["date"] = hourly["timestamp"].dt.date

    daily = (
        hourly
        .groupby("date", as_index=False)["predicted_demand"]
        .sum()
        .rename(columns={"predicted_demand": "daily_predicted_demand"})
    )

    return daily.to_dict(orient="records")


# ---------------------------------------------------------------------------
# EVALUATION — Legacy endpoints (locked API contract — do not change)
# ---------------------------------------------------------------------------

@app.get("/metrics/mae/{restaurant_id}/{item_name}")
def get_item_mae(restaurant_id: str, item_name: str):
    try:
        df = load_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if df.empty:
        raise HTTPException(status_code=400, detail="No data found")

    df      = clean_data(df)
    df      = aggregate_hourly(df)
    item_df = df[df["item_name"] == item_name]

    if item_df.empty:
        raise HTTPException(status_code=404, detail=f"No data for item: {item_name}")

    try:
        res = evaluate_daily(item_df)
        return {"restaurant_id": restaurant_id, "item_name": item_name, "mae": res["mae"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/mae/{restaurant_id}")
def get_overall_mae(restaurant_id: str):
    try:
        res = evaluate_overall_items(restaurant_id)
        return {
            "restaurant_id":    restaurant_id,
            "overall_mean_mae": res["overall_stats"]["mean_mae"],
            "best_item":        res["overall_stats"]["best_item"],
            "worst_item":       res["overall_stats"]["worst_item"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/summary/{restaurant_id}/{item_name}")
def get_model_diagnostics(restaurant_id: str, item_name: str):
    """
    Return MAE, RMSE, training row count, and last training timestamp
    for a specific item model.
    """
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    model_path = get_model_path(restaurant_id, item_name)
    meta_path  = get_meta_path(restaurant_id, item_name)

    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404, detail=f"Model not found for {item_name}"
        )

    with open(meta_path, "r") as f:
        meta = json.load(f)

    try:
        df = load_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    df      = clean_data(df)
    df      = aggregate_hourly(df)
    item_df = df[df["item_name"] == item_name]

    if item_df.empty:
        raise HTTPException(
            status_code=400, detail="Data not available for evaluation"
        )

    test_hours = 7 * 24
    if len(item_df) <= test_hours * 2:
        raise HTTPException(
            status_code=400, detail="Not enough data to calculate errors"
        )

    train_df = item_df.iloc[:-test_hours].copy()
    test_df  = item_df.iloc[-test_hours:].copy()

    from forecasting.evaluator import _train_and_predict
    forecast_df = _train_and_predict(train_df, test_df)

    test_df["date"]     = test_df["ds"].dt.date
    forecast_df["date"] = forecast_df["ds"].dt.date

    daily_true = test_df.groupby("date")["y"].sum()
    daily_pred = forecast_df.groupby("date")["yhat"].sum().clip(lower=0).round()

    mae  = mean_absolute_error(daily_true, daily_pred)
    rmse = np.sqrt(mean_squared_error(daily_true, daily_pred))

    return {
        "restaurant_id": restaurant_id,
        "item_name":     item_name,
        "mae":           round(float(mae),  2),
        "rmse":          round(float(rmse), 2),
        "training_rows": meta.get("training_rows", 0),
        "last_ds":       meta.get("last_ds", "Unknown"),
    }


# ---------------------------------------------------------------------------
# EVALUATION — New endpoints (spec §8)
# ---------------------------------------------------------------------------

@app.get("/metrics/item/{restaurant_id}/{item_name}")
def get_item_metrics(restaurant_id: str, item_name: str):
    """
    Daily MAE & MAPE for a single item.
    Uses last 7 days as hold-out; skips if insufficient data.
    """
    try:
        df = load_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if df.empty:
        raise HTTPException(status_code=400, detail="No data found")

    df      = clean_data(df)
    df      = aggregate_hourly(df)
    item_df = df[df["item_name"] == item_name]

    if item_df.empty:
        raise HTTPException(status_code=404, detail=f"No data for item: {item_name}")

    try:
        return evaluate_daily(item_df, return_details=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/overall/{restaurant_id}")
def get_overall_metrics(restaurant_id: str):
    """
    Evaluate all items for a restaurant.
    Returns overall stats (mean_mae, best_item, worst_item) and
    per-item breakdown (mae, mape). Skips items with insufficient data.
    """
    try:
        res = evaluate_overall_items(restaurant_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/temperature_sanity/{restaurant_id}/{item_name}")
def get_temperature_sanity(restaurant_id: str, item_name: str):
    """
    Sweep temperatures from -10°C to +45°C (step=5) to validate
    that the model's demand response is physically plausible.
    Requires a trained model; returns peak and trough temperatures with
    per-temperature daily demand totals.
    """
    try:
        return evaluate_temperature_sanity(restaurant_id, item_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
