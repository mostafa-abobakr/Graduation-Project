from fastapi import FastAPI, HTTPException

from preprocessing.loader import load_data
from preprocessing.cleaner import clean_data
from preprocessing.aggregator import aggregate_hourly

from forecasting.trainer import train_prophet
from forecasting.predictor import forecast
from forecasting.evaluator import evaluate_hourly, evaluate_daily


app = FastAPI(title="ZeroBite ML Service")

MIN_HOURS = 14 * 24
FORECAST_HOURS = 7 * 24


@app.get("/")
def root():
    return {"status": "ZeroBite ML service running (V2)"}


# =========================
# TRAIN
# =========================
@app.post("/train/{restaurant_id}")
def train_model(restaurant_id: str):
    df = load_data(restaurant_id)
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
        "skipped_items": skipped
    }


# =========================
# HOURLY FORECAST
# =========================
@app.post("/forecast/hourly/{restaurant_id}/{item_name}")
def hourly_forecast(restaurant_id: str, item_name: str):
    future_weather = [1] * FORECAST_HOURS
    future_events = [0] * FORECAST_HOURS

    result = forecast(
        restaurant_id,
        item_name,
        future_weather,
        future_events
    )

    return result.to_dict(orient="records")


# =========================
# DAILY FORECAST
# =========================
@app.post("/forecast/daily/{restaurant_id}/{item_name}")
def daily_forecast(restaurant_id: str, item_name: str):
    future_weather = [1] * FORECAST_HOURS
    future_events = [0] * FORECAST_HOURS

    hourly = forecast(
        restaurant_id,
        item_name,
        future_weather,
        future_events
    )

    if hourly.empty:
        raise HTTPException(404, "No forecast data")

    # ⬅️ UPDATED COLUMN NAMES
    hourly["date"] = hourly["timestamp"].dt.date

    daily = (
        hourly
        .groupby("date", as_index=False)["predicted_demand"]
        .sum()
        .rename(columns={"predicted_demand": "daily_predicted_demand"})
    )

    return daily.to_dict(orient="records")



# =========================
# EVALUATION
# =========================
@app.get("/evaluate/hourly/{restaurant_id}/{item_name}")
def eval_hourly(restaurant_id: str, item_name: str):
    df = load_data(restaurant_id)
    df = clean_data(df)
    df = aggregate_hourly(df)

    item_df = df[df["item_name"] == item_name]

    if len(item_df) < MIN_HOURS:
        raise HTTPException(400, "Not enough data")

    return evaluate_hourly(item_df)


@app.get("/evaluate/daily/{restaurant_id}/{item_name}")
def eval_daily(restaurant_id: str, item_name: str):
    df = load_data(restaurant_id)
    df = clean_data(df)
    df = aggregate_hourly(df)

    item_df = df[df["item_name"] == item_name]

    if len(item_df) < MIN_HOURS:
        raise HTTPException(400, "Not enough data")

    return evaluate_daily(item_df)
