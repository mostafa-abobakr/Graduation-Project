"""
app.py
ZeroBite ML Service — FastAPI Application Entry Point.

Endpoints
─────────────────────────────────────────────────────────────────────
Health
  GET  /

Train / Forecast  (API contract locked — do not change signatures)
  POST /train/{restaurant_id}
  POST /forecast/hourly/{restaurant_id}/{item_name}
  POST /forecast/daily/{restaurant_id}/{item_name}

Metrics / Evaluation
  GET  /metrics/mae/{restaurant_id}/{item_name}       ← legacy (backward-compat)
  GET  /metrics/mae/{restaurant_id}                   ← legacy (backward-compat)
  GET  /metrics/summary/{restaurant_id}/{item_name}   ← MAE + RMSE diagnostics
  GET  /metrics/item/{restaurant_id}/{item_name}      ?granularity=hourly|daily
  GET  /metrics/overall/{restaurant_id}               ?granularity=hourly|daily
  GET  /metrics/temperature_sanity/{restaurant_id}/{item_name}

Analytics  (pure SQL — no ML)
  GET  /analytics/revenue/{restaurant_id}
  GET  /analytics/revenue/trend/{restaurant_id}       ?granularity=hour|day
  GET  /analytics/menu/performance/{restaurant_id}
  GET  /analytics/peaks/{restaurant_id}
  GET  /analytics/alerts/{restaurant_id}
"""
from contextlib import asynccontextmanager
from typing import Literal

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
import json
import os
import shutil

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
    _train_and_predict,
)
from schemas.forecast_requests import HourlyForecastRequest, DailyForecastRequest

from analytics.queries import (
    get_revenue_summary,
    get_revenue_trend,
    get_menu_performance,
    get_peak_hours,
    get_alerts,
    get_latest_day_actuals,
)


# ---------------------------------------------------------------------------
# Application lifespan — validate config at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required()
    yield


app = FastAPI(title="ZeroBite ML Service", lifespan=lifespan)

MIN_HOURS = 336   # 2 weeks of hourly data, enforced per item


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
    Idempotent — re-running overwrites existing models.
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

    return {
        "restaurant_id": restaurant_id,
        "trained_items": trained,
        "skipped_items": skipped,
        "status":        "success" if trained else "no_models_trained",
    }


@app.post("/train/{restaurant_id}/{item_name}")
def train_single_model(restaurant_id: str, item_name: str):
    """
    Train a Prophet model for a single menu item.
    This bypasses 60-second HTTP timeouts on cloud host load balancers.
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

    item_df = df[df["item_name"] == item_name]
    if len(item_df) < MIN_HOURS:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough data for {item_name}. Found {len(item_df)}, need {MIN_HOURS}."
        )

    train_prophet(item_df, item_name, restaurant_id)
    return {
        "restaurant_id": restaurant_id,
        "item_name": item_name,
        "status": "success"
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
    """Return 24 hourly demand predictions for a single temperature/event."""
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
    """Return 7 daily demand totals from weekly temperature/event inputs."""
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
# HOURLY FORECAST ALL
# ---------------------------------------------------------------------------
@app.post("/forecast/all/hourly/{restaurant_id}")
def hourly_forecast_all(
    restaurant_id: str,
    request: HourlyForecastRequest,
):
    """Return 24 hourly demand predictions for all trained items in a single response."""
    model_dir = os.path.dirname(get_model_path(restaurant_id, "dummy"))
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="No models found for restaurant")
        
    items = [f[:-4] for f in os.listdir(model_dir) if f.endswith(".pkl")]
    if not items:
        raise HTTPException(status_code=404, detail="No models found for restaurant")

    future_temp   = [request.temperature_celsius] * 24
    future_events = [request.event_day] * 24

    response = {}
    for item_name in items:
        try:
            result = forecast(restaurant_id, item_name, future_temp, future_events)
            response[item_name] = result.to_dict(orient="records")
        except (FileNotFoundError, ValueError):
            continue

    if not response:
        raise HTTPException(status_code=400, detail="Could not generate forecast for any items")

    return response


# ---------------------------------------------------------------------------
# DAILY FORECAST ALL
# ---------------------------------------------------------------------------
@app.post("/forecast/all/daily/{restaurant_id}")
def daily_forecast_all(
    restaurant_id: str,
    request: DailyForecastRequest,
):
    """Return 7 daily demand totals for all trained items in a single response."""
    if len(request.weekly_temperatures) != 7 or len(request.weekly_events) != 7:
        raise HTTPException(
            status_code=400,
            detail="Must provide exactly 7 values for weekly temps/events.",
        )

    model_dir = os.path.dirname(get_model_path(restaurant_id, "dummy"))
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="No models found for restaurant")
        
    items = [f[:-4] for f in os.listdir(model_dir) if f.endswith(".pkl")]
    if not items:
        raise HTTPException(status_code=404, detail="No models found for restaurant")

    future_temp: list[float] = []
    future_events: list[int] = []
    for t, e in zip(request.weekly_temperatures, request.weekly_events):
        future_temp.extend([t] * 24)
        future_events.extend([e] * 24)

    response = {}
    for item_name in items:
        try:
            hourly = forecast(restaurant_id, item_name, future_temp, future_events)
            if hourly.empty:
                continue
            hourly["date"] = hourly["timestamp"].dt.date
            daily = (
                hourly
                .groupby("date", as_index=False)["predicted_demand"]
                .sum()
                .rename(columns={"predicted_demand": "daily_predicted_demand"})
            )
            response[item_name] = daily.to_dict(orient="records")
        except (FileNotFoundError, ValueError):
            continue

    if not response:
        raise HTTPException(status_code=400, detail="Could not generate forecast for any items")

    return response


# ---------------------------------------------------------------------------
# PEAK FORECAST ALL
# ---------------------------------------------------------------------------
@app.post("/forecast/all/peaks/{restaurant_id}")
def forecast_all_peaks(
    restaurant_id: str,
    request: DailyForecastRequest,
):
    """Return top 3 peak hours and peak days from a 7-day forecast across all items."""
    if len(request.weekly_temperatures) != 7 or len(request.weekly_events) != 7:
        raise HTTPException(
            status_code=400,
            detail="Must provide exactly 7 values for weekly temps/events.",
        )

    model_dir = os.path.dirname(get_model_path(restaurant_id, "dummy"))
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="No models found for restaurant")
        
    items = [f[:-4] for f in os.listdir(model_dir) if f.endswith(".pkl")]
    if not items:
        raise HTTPException(status_code=404, detail="No models found for restaurant")

    future_temp: list[float] = []
    future_events: list[int] = []
    for t, e in zip(request.weekly_temperatures, request.weekly_events):
        future_temp.extend([t] * 24)
        future_events.extend([e] * 24)

    actuals = get_latest_day_actuals(restaurant_id)
    actual_items = actuals.get("items", {})

    all_forecasts = []
    for item_name in items:
        try:
            hourly = forecast(restaurant_id, item_name, future_temp, future_events)
            if hourly.empty:
                continue
            
            price = actual_items.get(item_name, {}).get("price", 0.0)
            hourly["revenue"] = hourly["predicted_demand"] * price
            all_forecasts.append(hourly)
        except (FileNotFoundError, ValueError):
            continue

    if not all_forecasts:
        raise HTTPException(status_code=400, detail="Could not generate forecast for any items")

    combined = pd.concat(all_forecasts, ignore_index=True)

    # 1. Peak Hours (aggregate across all days and items by hour of day)
    combined["hour"] = combined["timestamp"].dt.hour
    hourly_agg = (
        combined.groupby("hour", as_index=False)
        .agg({"predicted_demand": "sum", "revenue": "sum"})
        .sort_values("predicted_demand", ascending=False)
        .head(3)
    )

    peak_hours = []
    for _, r in hourly_agg.iterrows():
        h = int(r["hour"])
        peak_hours.append({
            "hour": f"{h:02d}:00",
            "order_count": int(r["predicted_demand"]),
            "revenue": round(float(r["revenue"]), 2)
        })

    # 2. Peak Days (aggregate across all hours and items by day date/name)
    combined["date"] = combined["timestamp"].dt.date
    combined["day_name"] = combined["timestamp"].dt.day_name()
    
    daily_agg = (
        combined.groupby(["date", "day_name"], as_index=False)
        .agg({"predicted_demand": "sum", "revenue": "sum"})
        .sort_values("predicted_demand", ascending=False)
        .head(3)
    )

    peak_days = []
    for _, r in daily_agg.iterrows():
        peak_days.append({
            "day": r["day_name"],
            "order_count": int(r["predicted_demand"]),
            "revenue": round(float(r["revenue"]), 2)
        })

    return {"peak_hours": peak_hours, "peak_days": peak_days}


# ---------------------------------------------------------------------------
# EVALUATION — Legacy endpoints (backward-compatible, unchanged signatures)
# ---------------------------------------------------------------------------
@app.get("/metrics/mae/{restaurant_id}/{item_name}")
def get_item_mae(restaurant_id: str, item_name: str):
    """Legacy: daily MAE for one item."""
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
        return {
            "restaurant_id": restaurant_id,
            "item_name":     item_name,
            "mae":           res["mae"],
            "mape":          res["mape"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/mae/{restaurant_id}")
def get_overall_mae(restaurant_id: str):
    """Legacy: overall daily MAE across all items."""
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
    Full model diagnostics: MAE + RMSE + training row count + last_ds.
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
        raise HTTPException(status_code=400, detail="Data not available for evaluation")

    test_hours = 7 * 24
    if len(item_df) <= test_hours * 2:
        raise HTTPException(status_code=400, detail="Not enough data to calculate errors")

    train_df    = item_df.iloc[:-test_hours].copy()
    test_df     = item_df.iloc[-test_hours:].copy()
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
# EVALUATION — New endpoints with granularity switch
# ---------------------------------------------------------------------------
@app.get("/metrics/item/{restaurant_id}/{item_name}")
def get_item_metrics(
    restaurant_id: str,
    item_name: str,
    granularity: Literal["hourly", "daily"] = Query(default="daily"),
):
    """
    MAE + MAPE for a single item.
    hourly  → evaluate_hourly() with last 168-hour hold-out
    daily   → evaluate_daily()  with last 7-day hold-out  (default)
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
        evaluator = evaluate_hourly if granularity == "hourly" else evaluate_daily
        return evaluator(item_df, return_details=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/overall/{restaurant_id}")
def get_overall_metrics(
    restaurant_id: str,
    granularity: Literal["hourly", "daily"] = Query(default="daily"),
):
    """
    Evaluate all items for a restaurant.
    hourly|daily (default: daily)

    Returns overall stats (mean_mae, best_item, worst_item) and
    per-item breakdown (mae, mape). Items with insufficient data are skipped.
    """
    try:
        df = load_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if df.empty:
        raise HTTPException(status_code=400, detail="No data found")

    df    = clean_data(df)
    df    = aggregate_hourly(df)
    items = df["item_name"].unique()

    evaluator    = evaluate_hourly if granularity == "hourly" else evaluate_daily
    item_metrics = {}
    mae_list     = []

    for item in items:
        item_df = df[df["item_name"] == item]
        try:
            res = evaluator(item_df, return_details=False)
            item_metrics[item] = {"mae": res["mae"], "mape": res["mape"]}
            mae_list.append((item, res["mae"]))
        except ValueError:
            pass

    if not mae_list:
        raise HTTPException(
            status_code=400,
            detail="No items had enough continuous data to evaluate.",
        )

    mae_list.sort(key=lambda x: x[1])
    mean_mae = sum(x[1] for x in mae_list) / len(mae_list)

    return {
        "granularity": granularity,
        "overall_stats": {
            "mean_mae":   round(mean_mae, 2),
            "best_item":  mae_list[0][0],
            "worst_item": mae_list[-1][0],
        },
        "item_breakdown": item_metrics,
    }


@app.get("/metrics/temperature_sanity/{restaurant_id}/{item_name}")
def get_temperature_sanity(restaurant_id: str, item_name: str):
    """
    Sweep -10°C → 45°C to validate that the model's demand response
    is physically plausible. Requires a trained model.
    """
    try:
        return evaluate_temperature_sanity(restaurant_id, item_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# ANALYTICS — Pure SQL, no ML
# ---------------------------------------------------------------------------
@app.get("/analytics/revenue/{restaurant_id}")
def analytics_revenue(restaurant_id: str):
    """
    Aggregate revenue KPIs for a restaurant.
    Returns: total_revenue, total_orders, avg_order_value, total_items_sold
    """
    try:
        return get_revenue_summary(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/revenue/trend/{restaurant_id}")
def analytics_revenue_trend(
    restaurant_id: str,
    granularity: Literal["hour", "day"] = Query(default="day"),
):
    """
    Time-series revenue trend.
    hour  → bucketed by hour
    day   → bucketed by calendar day (default)

    Returns list of: { timestamp, revenue, order_count }
    """
    try:
        return get_revenue_trend(restaurant_id, granularity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/menu/performance/{restaurant_id}")
def analytics_menu_performance(restaurant_id: str):
    """
    Per-item menu performance.
    Returns list of: { item_name, orders, revenue, profit, margin_percentage }
    Sorted by revenue descending.
    """
    try:
        return get_menu_performance(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/peaks/{restaurant_id}")
def analytics_peaks(restaurant_id: str):
    """
    Top 3 peak hours and top 3 peak days by order count.
    Returns: { peak_hours: [...], peak_days: [...] }
    """
    try:
        return get_peak_hours(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/alerts/{restaurant_id}")
def analytics_alerts(restaurant_id: str):
    """
    Rule-based business alerts. No ML — deterministic SQL aggregations only.
    Alert types:
      - revenue_drop        (>20% day-over-day decline)
      - cold_item_underperformance  (hot day + low cold-drink sales)
      - low_margin_high_volume      (high-volume item with <10% margin)

    Returns list of: { type, severity, message }
    """
    try:
        alerts = get_alerts(restaurant_id)
        return {"restaurant_id": restaurant_id, "alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/alerts/forecast/{restaurant_id}")
def analytics_forecast_alerts(
    restaurant_id: str,
    future_temp: float = Query(22.0, description="Assumed temperature °C for tomorrow"),
    future_event: int = Query(0, description="Assumed event flag (0/1) for tomorrow"),
):
    """
    Predictive alerts comparing tomorrow's ML forecast against the most recent
    actual day's data in the database.
    """
    actuals = get_latest_day_actuals(restaurant_id)
    baseline_date = actuals.get("baseline_date")
    if not baseline_date:
        return {"restaurant_id": restaurant_id, "alerts": [], "message": "No historical data found"}

    actual_items = actuals.get("items", {})
    if not actual_items:
        return {"restaurant_id": restaurant_id, "alerts": [], "message": "No sales found on baseline date"}

    alerts = []
    total_actual_revenue = sum(data["revenue"] for data in actual_items.values())
    total_predicted_revenue = 0.0

    temps = [future_temp] * 24
    events = [future_event] * 24

    for item_name, actual_data in actual_items.items():
        try:
            # 24 hour forecast gives us exactly 1 full day for "tomorrow"
            # It starts from wherever the training data ended
            hourly_pred = forecast(restaurant_id, item_name, temps, events)
            if hourly_pred.empty:
                continue
                
            pred_qty = hourly_pred["predicted_demand"].sum()
            pred_revenue = float(pred_qty) * actual_data["price"]
            total_predicted_revenue += pred_revenue

            # Evaluate item-level changes (-10% to +10% is considered normal variance)
            act_qty = float(actual_data["qty"])
            if act_qty >= 5: # Only alert on items with meaningful volume
                change_pct = (pred_qty - act_qty) / act_qty
                
                if change_pct <= -0.20:
                    alerts.append({
                        "type": "item_decrease",
                        "severity": "warning",
                        "message": (
                            f"Forecast indicates '{item_name}' orders will drop by "
                            f"{abs(change_pct * 100):.1f}% tomorrow vs {baseline_date} "
                            f"({int(act_qty)} → {int(pred_qty)} units)"
                        )
                    })
                elif change_pct >= 0.25:
                    alerts.append({
                        "type": "item_surge",
                        "severity": "info",
                        "message": (
                            f"Forecast indicates a surge in '{item_name}' orders by "
                            f"{change_pct * 100:.1f}% tomorrow vs {baseline_date} "
                            f"({int(act_qty)} → {int(pred_qty)} units). "
                            "Ensure sufficient stock."
                        )
                    })

        except (FileNotFoundError, ValueError):
            # Model doesn't exist for this item, or couldn't forecast. Skip it.
            pass

    # Evaluate total revenue change
    if total_actual_revenue > 0 and total_predicted_revenue > 0:
        rev_change = (total_predicted_revenue - total_actual_revenue) / total_actual_revenue
        if rev_change <= -0.15:
            alerts.append({
                "type": "forecast_revenue_drop",
                "severity": "warning",
                "message": (
                    f"Forecasted revenue for tomorrow is expected to drop {abs(rev_change * 100):.1f}% "
                    f"vs {baseline_date} (${total_actual_revenue:.2f} → ${total_predicted_revenue:.2f})"
                )
            })
        elif rev_change >= 0.20:
             alerts.append({
                "type": "forecast_revenue_spike",
                "severity": "info",
                "message": (
                    f"Forecasted revenue for tomorrow is expected to surge {rev_change * 100:.1f}% "
                    f"vs {baseline_date} (${total_actual_revenue:.2f} → ${total_predicted_revenue:.2f})"
                )
            })

    # Sort alerts: warnings first, then info
    alerts.sort(key=lambda x: 0 if x["severity"] == "warning" else 1)

    return {
        "restaurant_id": restaurant_id,
        "baseline_date": baseline_date,
        "total_actual_revenue": round(total_actual_revenue, 2),
        "total_predicted_revenue": round(total_predicted_revenue, 2),
        "alerts": alerts
    }


# ---------------------------------------------------------------------------
# MODELS MANAGEMENT
# ---------------------------------------------------------------------------
@app.delete("/models/{restaurant_id}")
def delete_all_models(restaurant_id: str):
    """
    Clear all saved models and metadata for a specific restaurant.
    """
    model_dir = os.path.dirname(get_model_path(restaurant_id, "dummy"))
    
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="No models found for restaurant")
        
    try:
        shutil.rmtree(model_dir)
        return {
            "restaurant_id": restaurant_id,
            "status": "success",
            "message": "All models deleted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete models: {str(e)}")

