from fastapi import FastAPI, HTTPException
from preprocessing.loader import load_data
from preprocessing.cleaner import clean_data
from preprocessing.aggregator import aggregate_hourly
from forecasting.trainer import train_prophet
from forecasting.predictor import forecast

app = FastAPI(title="ZeroBite ML Service")

MIN_HOURS = 14 * 24  # minimum 14 days history


@app.get("/")
def root():
    return {"status": "ZeroBite ML service running"}


@app.post("/train")
def train_model(path: str):
    df = load_data(path)
    df = clean_data(df)
    df = aggregate_hourly(df)

    trained = []
    skipped = []

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


@app.post("/forecast/{item_name}")
def get_forecast(
    item_name: str,
    future_weather: list[int] | None = None,
    future_events: list[int] | None = None
):
    # Defaults (normal conditions)
    if not future_weather or len(future_weather) != 168:
        future_weather = [1] * 168

    if not future_events or len(future_events) != 168:
        future_events = [0] * 168

    if len(future_weather) != 168 or len(future_events) != 168:
        raise HTTPException(
            status_code=400,
            detail="weather_good and event_day must have 168 values"
        )

    result = forecast(item_name, future_weather, future_events)
    return result.to_dict(orient="records")
