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
  GET  /analytics/cost-reduction/{restaurant_id}
  GET  /analytics/sales-profit-chart/{restaurant_id}
  GET  /analytics/revenue/trend/{restaurant_id}       ?granularity=hour|day
  GET  /analytics/menu/performance/{restaurant_id}
  GET  /analytics/peaks/{restaurant_id}
  GET  /analytics/alerts/{restaurant_id}

Seed / Data Generation
  POST /seed/{restaurant_id}
  POST /seedAll
  GET  /seed/check/{restaurant_id}     ← check if a single restaurant has data
  GET  /seed/check/all                 ← list all restaurants with no data
"""
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path as FilePath
from typing import Literal

import numpy as np
import pandas as pd
from fastapi import FastAPI, BackgroundTasks, HTTPException, Path, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
import os
import shutil

from config.settings import validate_required
from database.connection import get_engine
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
from schemas.forecast_requests import HourlyForecastRequest, DailyForecastRequest, WeeklyDashboardRequest

from analytics.queries import (
    get_revenue_summary,
    get_revenue_trend,
    get_menu_performance,
    get_peak_hours,
    get_alerts,
    get_latest_day_actuals,
    get_latest_week_actuals,
    get_cost_percentage_kpi,
    get_sales_profit_chart,
    get_menu_items_pricing,
    get_previous_day_kpis,
    get_previous_week_kpis,
)

from database.seeder import (
    seed_restaurant_data, 
    check_restaurant_has_data, 
    get_restaurants_without_data,
    seed_inventory_data,
    seed_all_inventory
)

from inventory.service import (
    consume_inventory,
)
from schemas.inventory_requests import InvoiceConfirmRequest

# ---------------------------------------------------------------------------
# Application lifespan — validate config at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required()
    yield


tags_metadata = [
    {"name": "Health", "description": "Service health and status checks."},
    {"name": "POS", "description": "Simple POS menu and order endpoints used by the POS tester."},
    {"name": "Seed", "description": "Generate and insert dummy POS and inventory data for testing."},
    {"name": "Training", "description": "Train Prophet demand-forecasting models."},
    {"name": "Forecast", "description": "Generate hourly, daily, and dashboard demand forecasts."},
    {"name": "Metrics", "description": "Model evaluation metrics — MAE, MAPE, accuracy, and diagnostics."},
    {"name": "Analytics", "description": "Business analytics — revenue, cost, peaks, alerts, and dashboards. Pure SQL, no ML."},
    {"name": "Models", "description": "Manage saved ML models."},
    {"name": "Inventory", "description": "Inventory management — stock consumption, invoice scanning, and restocking."},
]

app = FastAPI(title="ZeroBite ML Service", lifespan=lifespan, openapi_tags=tags_metadata)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MIN_HOURS = 336   # 2 weeks of hourly data, enforced per item
POS_TESTER_PATH = FilePath(__file__).resolve().parent / "pos_tester" / "index.html"


class PosOrderItemRequest(BaseModel):
    menu_item_id: int
    quantity: int
    unit_price: float


class PosOrderRequest(BaseModel):
    restaurant_id: str
    items: List[PosOrderItemRequest]


def _load_pos_menu_items(restaurant_id: str) -> list[dict]:
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                    MenuItemId,
                    ItemName,
                    Price,
                    ImageUrl
                FROM MenuItems
                WHERE RestaurantId = :restaurant_id
                ORDER BY ItemName
                """
            ),
            {"restaurant_id": restaurant_id},
        ).mappings().all()

    return [
        {
            "MenuItemId": row["MenuItemId"],
            "ItemName": row["ItemName"],
            "Price": float(row["Price"] or 0.0),
            "ImageUrl": row["ImageUrl"],
        }
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {"status": "ZeroBite ML service running"}


@app.get("/pos", tags=["POS"])
@app.get("/pos/", tags=["POS"])
def pos_page(restaurant_id: str | None = Query(default=None)):
    if not POS_TESTER_PATH.exists():
        raise HTTPException(status_code=404, detail="POS tester page not found.")
    html = POS_TESTER_PATH.read_text(encoding="utf-8")
    bootstrap = {
        "restaurantId": restaurant_id or "",
        "menuItems": _load_pos_menu_items(restaurant_id) if restaurant_id else [],
    }
    html = html.replace(
        "<script>",
        f"<script>window.__POS_BOOTSTRAP__ = {json.dumps(bootstrap)};</script>\n    <script>",
        1,
    )
    return HTMLResponse(content=html)


@app.post("/pos", tags=["POS"])
@app.post("/pos/", tags=["POS"])
def pos_submit(request: PosOrderRequest):
    restaurant_id = request.restaurant_id.strip()
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="Restaurant ID is required.")
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    engine = get_engine()
    with Session(engine) as session:
        requested_ids = sorted({item.menu_item_id for item in request.items})
        placeholders = ", ".join(f":menu_id_{idx}" for idx in range(len(requested_ids)))
        menu_rows = session.execute(
            text(
                f"""
                SELECT MenuItemId, ItemName, Price
                FROM MenuItems
                WHERE RestaurantId = :restaurant_id
                  AND MenuItemId IN ({placeholders})
                """
            ),
            {
                "restaurant_id": restaurant_id,
                **{f"menu_id_{idx}": menu_id for idx, menu_id in enumerate(requested_ids)},
            },
        ).mappings().all()

        menu_lookup = {row["MenuItemId"]: row for row in menu_rows}
        missing_ids = [menu_id for menu_id in requested_ids if menu_id not in menu_lookup]
        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Menu items not found for restaurant {restaurant_id}: {missing_ids}",
            )

        normalized_items = []
        total_item_count = 0
        total_order_value = 0.0
        for item in request.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail="Item quantity must be greater than zero.")

            menu_item = menu_lookup[item.menu_item_id]
            unit_price = float(menu_item["Price"] or item.unit_price or 0.0)
            line_total = round(unit_price * item.quantity, 2)
            total_item_count += item.quantity
            total_order_value += line_total
            normalized_items.append(
                {
                    "menu_item_id": item.menu_item_id,
                    "item_name": menu_item["ItemName"],
                    "quantity": item.quantity,
                    "unit_price": unit_price,
                    "line_total": line_total,
                }
            )

        order_result = session.execute(
            text(
                """
                INSERT INTO Orders (
                    RestaurantId,
                    OrderTimestamp,
                    TemperatureCelsius,
                    EventDay,
                    ItemCount,
                    TotalOrderValue
                )
                OUTPUT inserted.OrderId
                VALUES (
                    :restaurant_id,
                    :order_timestamp,
                    NULL,
                    0,
                    :item_count,
                    :total_order_value
                )
                """
            ),
            {
                "restaurant_id": restaurant_id,
                "order_timestamp": datetime.utcnow(),
                "item_count": total_item_count,
                "total_order_value": round(total_order_value, 2),
            },
        ).first()

        order_id = int(order_result[0])

        for item in normalized_items:
            session.execute(
                text(
                    """
                    INSERT INTO OrderItems (OrderId, MenuItemId, Quantity, UnitPrice, LineTotal)
                    VALUES (:order_id, :menu_item_id, :quantity, :unit_price, :line_total)
                    """
                ),
                {
                    "order_id": order_id,
                    **item,
                },
            )

        session.commit()

    try:
        inventory_consumption = consume_inventory(restaurant_id, order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inventory consume failed: {exc}")

    return {
        "status": "success",
        "message": "Order recorded successfully.",
        "order_id": order_id,
        "restaurant_id": restaurant_id,
        "item_count": total_item_count,
        "total_order_value": round(total_order_value, 2),
        "inventory_consumption": inventory_consumption,
    }



# ---------------------------------------------------------------------------
# SEED DATA
# ---------------------------------------------------------------------------
@app.get("/seed/check/all", tags=["Seed"])
def check_all_restaurants_data():
    """
    Scan all restaurants and return those that have no seeded data (no menu items).
    """
    try:
        return get_restaurants_without_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan restaurants: {str(e)}")


@app.get("/seed/check/{restaurant_id}", tags=["Seed"])
def check_restaurant_data(restaurant_id: str):
    """
    Check whether a specific restaurant already has seeded data (menu items).
    Returns has_data: true/false.
    """
    try:
        return check_restaurant_has_data(restaurant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check restaurant data: {str(e)}")


@app.post("/seed/{restaurant_id}", tags=["Seed"])
def seed_dummy_data(restaurant_id: str):
    """
    Generate and insert 3-12 months of realistic POS dummy data for a restaurant.
    """
    try:
        from database.seeder import seed_restaurant_data
        return seed_restaurant_data(restaurant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed data: {str(e)}")


@app.post("/seedAll", tags=["Seed"])
def seed_all_dummy_data():
    """
    Go through all restaurants and seed dummy data for those that don't have any menu items.
    """
    try:
        from database.seeder import seed_all_restaurants
        return seed_all_restaurants()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run batch seed: {str(e)}")


@app.post("/seed/inventory/{restaurant_id}", tags=["Seed"])
def api_seed_inventory(restaurant_id: str):
    """
    Seed dummy inventory data and item recipes for a specific restaurant.
    """
    try:
        return seed_inventory_data(restaurant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed inventory data: {str(e)}")


@app.post("/seedAll/inventory", tags=["Seed"])
def api_seed_all_inventory():
    """
    Seed dummy inventory data for all restaurants without it.
    """
    try:
        return seed_all_inventory()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run batch inventory seed: {str(e)}")

# ---------------------------------------------------------------------------
# TRAIN
# ---------------------------------------------------------------------------
@app.post("/train/{restaurant_id}", tags=["Training"])
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


@app.post("/train/{restaurant_id}/{item_name}", tags=["Training"])
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
@app.post("/forecast/hourly/{restaurant_id}/{item_name}", tags=["Forecast"])
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
@app.post("/forecast/daily/{restaurant_id}/{item_name}", tags=["Forecast"])
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
@app.post("/forecast/all/hourly/{restaurant_id}", tags=["Forecast"])
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
@app.post("/forecast/all/daily/{restaurant_id}", tags=["Forecast"])
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
@app.post("/forecast/all/peaks/{restaurant_id}", tags=["Forecast"])
def forecast_all_peaks(
    restaurant_id: str,
    request: DailyForecastRequest,
):
    """Return top 5 peak hours and peak days from a 7-day forecast across all items."""
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
        .head(5)
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
        .head(5)
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
# DASHBOARD FORECASTS
# ---------------------------------------------------------------------------
@app.post("/forecast/dashboard/day/{restaurant_id}", tags=["Forecast"])
def forecast_dashboard_day(
    restaurant_id: str,
    request: HourlyForecastRequest,
):
    """
    Day view for the Sales Dashboard.
    Provides total expected revenue, profit, and orders,
    item-level details, and hourly sales chart data for tomorrow.
    """
    model_dir = os.path.dirname(get_model_path(restaurant_id, "dummy"))
    if not os.path.exists(model_dir):
        raise HTTPException(status_code=404, detail="No models found for restaurant")
        
    items = [f[:-4] for f in os.listdir(model_dir) if f.endswith(".pkl")]
    if not items:
        raise HTTPException(status_code=404, detail="No models found for restaurant")

    future_temp   = [request.temperature_celsius] * 24
    future_events = [request.event_day] * 24

    pricing = get_menu_items_pricing(restaurant_id)
    
    # Fetch accuracy metrics dynamically
    try:
        metrics_data = get_overall_metrics(restaurant_id, granularity="daily")
        overall_accuracy = metrics_data["overall_stats"]["mean_accuracy"]
        item_accuracy_map = {item: data["accuracy"] for item, data in metrics_data["item_breakdown"].items()}
    except Exception:
        overall_accuracy = 0.0
        item_accuracy_map = {}

    total_revenue = 0.0
    total_profit = 0.0
    total_orders = 0

    dashboard_items = []

    for item_name in items:
        try:
            hourly = forecast(restaurant_id, item_name, future_temp, future_events)
            if hourly.empty:
                continue
            
            p_data = pricing.get(item_name, {"price": 0.0, "cost": 0.0})
            price = p_data["price"]
            cost = p_data["cost"]
            
            orders = float(hourly["predicted_demand"].sum())
            revenue = orders * price
            profit = orders * (price - cost)

            total_orders += int(round(orders))
            total_revenue += revenue
            total_profit += profit

            chart_data = []
            max_orders = -1
            peak_hour = "00:00"

            for _, row in hourly.iterrows():
                h_orders = float(row["predicted_demand"])
                h_rev = h_orders * price
                h_prof = h_orders * (price - cost)
                h_str = row["timestamp"].strftime("%H:00")
                
                chart_data.append({
                    "hour": h_str,
                    "orders": int(round(h_orders)),
                    "revenue": round(h_rev, 2),
                    "profit": round(h_prof, 2)
                })

                if h_orders > max_orders:
                    max_orders = h_orders
                    peak_hour = h_str

            dashboard_items.append({
                "item_name": item_name,
                "expected_orders": int(round(orders)),
                "revenue": round(revenue, 2),
                "profit": round(profit, 2),
                "accuracy": item_accuracy_map.get(item_name, 0.0),
                "peak_hour": {
                    "hour": peak_hour,
                    "orders": int(round(max_orders)) if max_orders > 0 else 0
                },
                "chart_data": chart_data
            })
            
        except (FileNotFoundError, ValueError):
            continue

    if not dashboard_items:
        raise HTTPException(status_code=400, detail="Could not generate forecast for any items")

    # Sort items by revenue descending
    dashboard_items.sort(key=lambda x: x["revenue"], reverse=True)

    previous = get_previous_day_kpis(restaurant_id)
    def format_pct(current, prev):
        if prev > 0:
            pct = ((current - prev) / prev) * 100
            sign = "+" if pct > 0 else ""
            return f"{sign}{pct:.1f}%"
        return "0.0%"

    return {
        "overall_accuracy": overall_accuracy,
        "total_revenue": round(total_revenue, 2),
        "revenue_change_pct": format_pct(total_revenue, previous["revenue"]),
        "total_profit": round(total_profit, 2),
        "profit_change_pct": format_pct(total_profit, previous["profit"]),
        "total_orders": total_orders,
        "orders_change_pct": format_pct(total_orders, previous["orders"]),
        "items": dashboard_items
    }


@app.post("/forecast/dashboard/week/{restaurant_id}", tags=["Forecast"])
def forecast_dashboard_week(
    restaurant_id: str,
    request: WeeklyDashboardRequest,
):
    """
    Week view for the Sales Dashboard.
    Provides total expected revenue, profit, and orders,
    item-level details, and daily sales chart data for the next 7 days.
    """
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

    pricing = get_menu_items_pricing(restaurant_id)

    # Fetch accuracy metrics dynamically
    try:
        metrics_data = get_overall_metrics(restaurant_id, granularity="daily")
        overall_accuracy = metrics_data["overall_stats"]["mean_accuracy"]
        item_accuracy_map = {item: data["accuracy"] for item, data in metrics_data["item_breakdown"].items()}
    except Exception:
        overall_accuracy = 0.0
        item_accuracy_map = {}

    total_revenue = 0.0
    total_profit = 0.0
    total_orders = 0

    dashboard_items = []

    for item_name in items:
        try:
            hourly = forecast(restaurant_id, item_name, future_temp, future_events)
            if hourly.empty:
                continue
            
            p_data = pricing.get(item_name, {"price": 0.0, "cost": 0.0})
            price = p_data["price"]
            cost = p_data["cost"]
            
            hourly["date"] = hourly["timestamp"].dt.date
            daily = hourly.groupby("date", as_index=False)["predicted_demand"].sum()
            
            orders = float(daily["predicted_demand"].sum())
            revenue = orders * price
            profit = orders * (price - cost)

            total_orders += int(round(orders))
            total_revenue += revenue
            total_profit += profit

            chart_data = []
            max_orders = -1
            peak_date = ""

            for _, row in daily.iterrows():
                d_orders = float(row["predicted_demand"])
                d_rev = d_orders * price
                d_prof = d_orders * (price - cost)
                d_str = row["date"].strftime("%Y-%m-%d")
                
                chart_data.append({
                    "date": d_str,
                    "orders": int(round(d_orders)),
                    "revenue": round(d_rev, 2),
                    "profit": round(d_prof, 2)
                })

                if d_orders > max_orders:
                    max_orders = d_orders
                    peak_date = d_str

            dashboard_items.append({
                "item_name": item_name,
                "expected_orders": int(round(orders)),
                "revenue": round(revenue, 2),
                "profit": round(profit, 2),
                "accuracy": item_accuracy_map.get(item_name, 0.0),
                "peak_day": {
                    "date": peak_date,
                    "orders": int(round(max_orders)) if max_orders > 0 else 0
                },
                "chart_data": chart_data
            })
            
        except (FileNotFoundError, ValueError):
            continue

    if not dashboard_items:
        raise HTTPException(status_code=400, detail="Could not generate forecast for any items")

    # Sort items by revenue descending
    dashboard_items.sort(key=lambda x: x["revenue"], reverse=True)

    previous = get_previous_week_kpis(restaurant_id)
    def format_pct(current, prev):
        if prev > 0:
            pct = ((current - prev) / prev) * 100
            sign = "+" if pct > 0 else ""
            return f"{sign}{pct:.1f}%"
        return "0.0%"

    return {
        "overall_accuracy": overall_accuracy,
        "total_revenue": round(total_revenue, 2),
        "revenue_change_pct": format_pct(total_revenue, previous["revenue"]),
        "total_profit": round(total_profit, 2),
        "profit_change_pct": format_pct(total_profit, previous["profit"]),
        "total_orders": total_orders,
        "orders_change_pct": format_pct(total_orders, previous["orders"]),
        "items": dashboard_items
    }


# ---------------------------------------------------------------------------
# EVALUATION — Legacy endpoints (backward-compatible, unchanged signatures)
# ---------------------------------------------------------------------------
@app.get("/metrics/mae/{restaurant_id}/{item_name}", tags=["Metrics"])
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


@app.get("/metrics/mae/{restaurant_id}", tags=["Metrics"])
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


@app.get("/metrics/summary/{restaurant_id}/{item_name}", tags=["Metrics"])
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
@app.get("/metrics/item/{restaurant_id}/{item_name}", tags=["Metrics"])
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


@app.get("/metrics/overall/{restaurant_id}", tags=["Metrics"])
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
    accuracy_list = []

    for item in items:
        item_df = df[df["item_name"] == item]
        try:
            res = evaluator(item_df, return_details=False)
            acc = max(0.0, 100.0 - res["mape"])
            item_metrics[item] = {
                "mae": res["mae"], 
                "mape": res["mape"],
                "accuracy": round(acc, 2)
            }
            mae_list.append((item, res["mae"]))
            accuracy_list.append(acc)
        except ValueError:
            pass

    if not mae_list:
        raise HTTPException(
            status_code=400,
            detail="No items had enough continuous data to evaluate.",
        )

    mae_list.sort(key=lambda x: x[1])
    mean_mae = sum(x[1] for x in mae_list) / len(mae_list)
    mean_accuracy = sum(accuracy_list) / len(accuracy_list)

    return {
        "granularity": granularity,
        "overall_stats": {
            "mean_mae":   round(mean_mae, 2),
            "mean_accuracy": round(mean_accuracy, 2),
            "best_item":  mae_list[0][0],
            "worst_item": mae_list[-1][0],
        },
        "item_breakdown": item_metrics,
    }


@app.get("/metrics/accuracy/{restaurant_id}", tags=["Metrics"])
def get_overall_accuracy(
    restaurant_id: str,
    granularity: Literal["hourly", "daily"] = Query(default="daily"),
):
    """
    Returns the overall accuracy metric (derived from MAPE) for a restaurant.
    """
    overall = get_overall_metrics(restaurant_id, granularity)
    return {
        "restaurant_id": restaurant_id,
        "granularity": granularity,
        "overall_accuracy": overall["overall_stats"]["mean_accuracy"]
    }


@app.get("/metrics/temperature_sanity/{restaurant_id}/{item_name}", tags=["Metrics"])
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
@app.get("/analytics/cost-reduction/{restaurant_id}", tags=["Analytics"])
def analytics_cost_reduction(restaurant_id: str):
    """
    Cost Reduction KPI comparing periods.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_cost_percentage_kpi(restaurant_id, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/sales-profit-chart/{restaurant_id}", tags=["Analytics"])
def analytics_sales_profit_chart(restaurant_id: str):
    """
    Sales & Profit Trend chart data.
    Divided by timeframes: day, week, month, all.
    """
    try:
        chart_data = get_sales_profit_chart(restaurant_id)
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = chart_data
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/revenue/{restaurant_id}", tags=["Analytics"])
def analytics_revenue(restaurant_id: str):
    """
    Aggregate revenue KPIs for a restaurant.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_revenue_summary(restaurant_id, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/revenue/trend/{restaurant_id}", tags=["Analytics"])
def analytics_revenue_trend(
    restaurant_id: str,
    granularity: Literal["hour", "day"] = Query(default="day"),
):
    """
    Time-series revenue trend.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_revenue_trend(restaurant_id, granularity, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/menu/performance/{restaurant_id}", tags=["Analytics"])
def analytics_menu_performance(restaurant_id: str):
    """
    Per-item menu performance.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_menu_performance(restaurant_id, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/peaks/{restaurant_id}", tags=["Analytics"])
def analytics_peaks(restaurant_id: str):
    """
    Top 3 peak hours and top 3 peak days by order count.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_peak_hours(restaurant_id, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/alerts/{restaurant_id}", tags=["Analytics"])
def analytics_alerts(restaurant_id: str):
    """
    Rule-based business alerts.
    Divided by timeframes: day, week, month, all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = get_alerts(restaurant_id, timeframe)
        return {"restaurant_id": restaurant_id, "data": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analytics/alerts/forecast/{restaurant_id}", tags=["Analytics"])
def analytics_forecast_alerts(
    restaurant_id: str,
    request: WeeklyDashboardRequest
):
    """
    Predictive alerts comparing tomorrow's and next week's ML forecast against
    the most recent actual day/week data in the database.
    Accepts 7 days of temperatures and events.
    """
    day_actuals = get_latest_day_actuals(restaurant_id)
    week_actuals = get_latest_week_actuals(restaurant_id)
    
    day_baseline = day_actuals.get("baseline_date")
    week_baseline = week_actuals.get("baseline_date")
    
    day_items = day_actuals.get("items", {})
    week_items = week_actuals.get("items", {})

    if len(request.weekly_temperatures) != 7 or len(request.weekly_events) != 7:
        raise HTTPException(
            status_code=400,
            detail="Must provide exactly 7 values for weekly temps/events."
        )

    temps: list[float] = []
    events: list[int] = []
    
    for t, e in zip(request.weekly_temperatures, request.weekly_events):
        temps.extend([t] * 24)
        events.extend([e] * 24)

    # We only forecast items that exist in our historical data baselines
    all_items = set(day_items.keys()).union(set(week_items.keys()))

    day_alerts = []
    week_alerts = []
    
    day_total_actual_rev = sum(d["revenue"] for d in day_items.values())
    week_total_actual_rev = sum(d["revenue"] for d in week_items.values())
    
    day_total_pred_rev = 0.0
    week_total_pred_rev = 0.0

    for item_name in all_items:
        try:
            hourly_pred = forecast(restaurant_id, item_name, temps, events)
            if hourly_pred.empty:
                continue

            day_pred_qty = float(hourly_pred["predicted_demand"].iloc[:24].sum())
            week_pred_qty = float(hourly_pred["predicted_demand"].sum())

            # Evaluate Day Alerts
            if item_name in day_items:
                act_day = day_items[item_name]
                act_qty = float(act_day["qty"])
                pred_revenue = day_pred_qty * act_day["price"]
                day_total_pred_rev += pred_revenue

                if act_qty >= 5:
                    change_pct = (day_pred_qty - act_qty) / act_qty
                    cost = act_day.get("cost", 0)
                    margin_pct = (act_day["price"] - cost) / act_day["price"] if act_day["price"] > 0 else 0
                    
                    if change_pct <= -0.20:
                        day_alerts.append({
                            "type": "item_decrease", "severity": "warning",
                            "message": f"Forecast indicates '{item_name}' orders will drop by {abs(change_pct * 100):.1f}% tomorrow vs {day_baseline} ({int(act_qty)} → {int(day_pred_qty)} units)"
                        })
                    elif change_pct >= 0.25:
                        if margin_pct < 0.15:
                            day_alerts.append({
                                "type": "low_margin_surge", "severity": "warning",
                                "message": f"Forecast indicates a surge in '{item_name}' orders by {change_pct * 100:.1f}% tomorrow vs {day_baseline} ({int(act_qty)} → {int(day_pred_qty)} units), but margin is low ({margin_pct * 100:.1f}%)."
                            })
                        elif margin_pct > 0.50:
                            day_alerts.append({
                                "type": "high_margin_surge", "severity": "info",
                                "message": f"Forecast indicates a highly profitable surge in '{item_name}' orders by {change_pct * 100:.1f}% tomorrow vs {day_baseline} ({int(act_qty)} → {int(day_pred_qty)} units). Margin is excellent ({margin_pct * 100:.1f}%)."
                            })
                        else:
                            day_alerts.append({
                                "type": "item_surge", "severity": "info",
                                "message": f"Forecast indicates a surge in '{item_name}' orders by {change_pct * 100:.1f}% tomorrow vs {day_baseline} ({int(act_qty)} → {int(day_pred_qty)} units)."
                            })

            # Evaluate Week Alerts
            if item_name in week_items:
                act_week = week_items[item_name]
                act_qty = float(act_week["qty"])
                pred_revenue = week_pred_qty * act_week["price"]
                week_total_pred_rev += pred_revenue

                if act_qty >= 15: # slightly higher threshold for weekly volume
                    change_pct = (week_pred_qty - act_qty) / act_qty
                    cost = act_week.get("cost", 0)
                    margin_pct = (act_week["price"] - cost) / act_week["price"] if act_week["price"] > 0 else 0
                    
                    freq_word = "next week"
                    
                    if change_pct <= -0.20:
                        week_alerts.append({
                            "type": "item_decrease", "severity": "warning",
                            "message": f"Forecast indicates '{item_name}' orders will drop by {abs(change_pct * 100):.1f}% {freq_word} ({int(act_qty)} → {int(week_pred_qty)} units)"
                        })
                    elif change_pct >= 0.25:
                        if margin_pct < 0.15:
                            week_alerts.append({
                                "type": "low_margin_surge", "severity": "warning",
                                "message": f"Forecast indicates a surge in '{item_name}' orders by {change_pct * 100:.1f}% {freq_word} ({int(act_qty)} → {int(week_pred_qty)} units), but margin is low ({margin_pct * 100:.1f}%)."
                            })
                        elif margin_pct > 0.50:
                            week_alerts.append({
                                "type": "high_margin_surge", "severity": "info",
                                "message": f"Forecast indicates a highly profitable surge in '{item_name}' orders by {change_pct * 100:.1f}% {freq_word} ({int(act_qty)} → {int(week_pred_qty)} units). Margin is excellent ({margin_pct * 100:.1f}%)."
                            })
                        else:
                            week_alerts.append({
                                "type": "item_surge", "severity": "info",
                                "message": f"Forecast indicates a surge in '{item_name}' orders by {change_pct * 100:.1f}% {freq_word} ({int(act_qty)} → {int(week_pred_qty)} units)."
                            })

        except (FileNotFoundError, ValueError):
            pass

    # Evaluate Day Revenue
    if day_total_actual_rev > 0 and day_total_pred_rev > 0:
        rev_change = (day_total_pred_rev - day_total_actual_rev) / day_total_actual_rev
        if rev_change <= -0.15:
            day_alerts.append({
                "type": "forecast_revenue_drop", "severity": "warning",
                "message": f"Forecasted revenue for tomorrow is expected to drop {abs(rev_change * 100):.1f}% vs {day_baseline} (${int(round(day_total_actual_rev))} → ${int(round(day_total_pred_rev))})"
            })
        elif rev_change >= 0.20:
            day_alerts.append({
                "type": "forecast_revenue_spike", "severity": "info",
                "message": f"Forecasted revenue for tomorrow is expected to surge {rev_change * 100:.1f}% vs {day_baseline} (${int(round(day_total_actual_rev))} → ${int(round(day_total_pred_rev))})"
            })

    # Evaluate Week Revenue
    if week_total_actual_rev > 0 and week_total_pred_rev > 0:
        rev_change = (week_total_pred_rev - week_total_actual_rev) / week_total_actual_rev
        if rev_change <= -0.15:
            week_alerts.append({
                "type": "forecast_revenue_drop", "severity": "warning",
                "message": f"Forecasted revenue for next week is expected to drop {abs(rev_change * 100):.1f}% vs last week (${int(round(week_total_actual_rev))} → ${int(round(week_total_pred_rev))})"
            })
        elif rev_change >= 0.20:
            week_alerts.append({
                "type": "forecast_revenue_spike", "severity": "info",
                "message": f"Forecasted revenue for next week is expected to surge {rev_change * 100:.1f}% vs last week (${int(round(week_total_actual_rev))} → ${int(round(week_total_pred_rev))})"
            })

    day_alerts.sort(key=lambda x: 0 if x["severity"] == "warning" else 1)
    week_alerts.sort(key=lambda x: 0 if x["severity"] == "warning" else 1)

    return {
        "restaurant_id": restaurant_id,
        "day": {
            "baseline_date": day_baseline,
            "total_actual_revenue": round(day_total_actual_rev, 2),
            "total_predicted_revenue": round(day_total_pred_rev, 2),
            "alerts": day_alerts
        },
        "week": {
            "baseline_date": week_baseline,
            "total_actual_revenue": round(week_total_actual_rev, 2),
            "total_predicted_revenue": round(week_total_pred_rev, 2),
            "alerts": week_alerts
        }
    }


@app.get("/analytics/dashboard/{restaurant_id}", tags=["Analytics"])
def analytics_dashboard(restaurant_id: str):
    """
    Combined endpoint for the overall analytics dashboard.
    Returns data from revenue, cost-reduction, sales-profit-chart, peaks, and alerts.
    Data is divided by timeframes: day, week, month, and all.
    """
    try:
        chart_data = get_sales_profit_chart(restaurant_id)
        response_data = {}
        
        for timeframe in ["day", "week", "month", "all"]:
            response_data[timeframe] = {
                "revenue": get_revenue_summary(restaurant_id, timeframe),
                "cost_reduction": get_cost_percentage_kpi(restaurant_id, timeframe),
                "sales_profit_chart": chart_data,
                "peaks": get_peak_hours(restaurant_id, timeframe),
                "alerts": get_alerts(restaurant_id, timeframe)
            }

        return {
            "restaurant_id": restaurant_id,
            "data": response_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/dashboard/revenue/{restaurant_id}", tags=["Analytics"])
def analytics_dashboard_revenue(restaurant_id: str):
    """
    Combined endpoint for the Revenue Analytics dashboard.
    Returns data from revenue summary, revenue trend, and menu performance.
    Data is divided by timeframes: day, week, month, and all.
    """
    try:
        response_data = {}
        for timeframe in ["day", "week", "month", "all"]:
            summary = get_revenue_summary(restaurant_id, timeframe)
            granularity = "hour" if timeframe == "day" else "day"
            trend = get_revenue_trend(restaurant_id, granularity, timeframe)
            item_performance = get_menu_performance(restaurant_id, timeframe)
            
            period_revenue = summary.get("total_revenue", 0.0)
            avg_profit_margin = summary.get("margin_percentage", 0.0)
            
            days_map = {"day": 1, "week": 7, "month": 30}
            days = days_map.get(timeframe)
            if days:
                daily_average = round(period_revenue / days, 2)
            else:
                daily_average = round(period_revenue / len(trend), 2) if trend else 0.0

            response_data[timeframe] = {
                "metrics": {
                    "period_revenue": period_revenue,
                    "daily_average": daily_average,
                    "avg_profit_margin": avg_profit_margin,
                    "revenue_change_pct": summary.get("revenue_change_pct", "0.0%"),
                },
                "revenue_trend": trend,
                "item_performance": item_performance
            }

        return {
            "restaurant_id": restaurant_id,
            "data": response_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# MODELS MANAGEMENT
# ---------------------------------------------------------------------------
@app.delete("/models/{restaurant_id}", tags=["Models"])
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


# ---------------------------------------------------------------------------
# INVENTORY MANAGEMENT
# ---------------------------------------------------------------------------
@app.post("/inventory/consume/{restaurant_id}/{order_id}", tags=["Inventory"])
def api_consume_inventory(restaurant_id: str, order_id: int):
    """
    Deduct stock from Inventories based on consumed menu items in an Order.
    """
    try:
        return consume_inventory(restaurant_id, order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to consume inventory: {str(e)}")





@app.post("/inventory/invoice-scan/{restaurant_id}", tags=["Inventory"])
async def api_invoice_scan(restaurant_id: str, file: UploadFile = File(...), mode: str = Query(default="auto", enum=["auto", "local", "cloud"])):
    """
    Invoice Scanning with OCR + AI.
    Scans the invoice and returns matched items for review — does NOT modify the database.
    The user should review/edit the results, then call /inventory/invoice-confirm to apply.
    Modes:
      - **auto** (default): Tries local Tesseract OCR first, falls back to cloud AI.
      - **local**: Uses only Tesseract OCR (no API calls, fully offline).
      - **cloud**: Uses only Gemini / OpenRouter cloud vision AI.
    """
    try:
        contents = await file.read()
        
        # Validate and convert the uploaded file to a proper image
        from PIL import Image as PILImage
        import io as _io
        try:
            img = PILImage.open(_io.BytesIO(contents))
            # Convert to RGB PNG bytes to standardize format
            buf = _io.BytesIO()
            img.convert("RGB").save(buf, format="PNG")
            contents = buf.getvalue()
        except Exception:
            raise ValueError(
                f"Uploaded file '{file.filename}' is not a valid image. "
                f"Please upload a JPG, PNG, or WEBP image of the invoice."
            )
        
        from inventory.invoice_scanner import scan_invoice
        return scan_invoice(restaurant_id, contents, mode=mode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/inventory/invoice-confirm/{restaurant_id}", tags=["Inventory"])
def api_invoice_confirm(restaurant_id: str, request: InvoiceConfirmRequest):
    """
    Confirm and apply restocking from a previously scanned invoice.
    Accepts the (possibly user-edited) list of items and applies the stock changes.
    """
    try:
        from inventory.invoice_scanner import confirm_invoice_restock
        items = [item.model_dump() for item in request.items]
        return confirm_invoice_restock(restaurant_id, items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
