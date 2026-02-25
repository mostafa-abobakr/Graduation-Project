"""
forecasting/predictor.py
Generates hourly demand forecasts from a trained Prophet model.

Changes vs original:
  - apply_temperature_features() is applied to future_df before predict(),
    matching the exact feature set used during training.
  - Uses config.settings.MODEL_ROOT instead of raw os.getenv().
"""
import pandas as pd
import joblib
import json
import os
from datetime import timedelta

from features.temperature import apply_temperature_features
from config.settings import MODEL_ROOT


def _get_base_path() -> str:
    return MODEL_ROOT


def get_model_path(restaurant_id: str, item_name: str) -> str:
    return os.path.join(_get_base_path(), restaurant_id, f"{item_name}.pkl")


def get_meta_path(restaurant_id: str, item_name: str) -> str:
    return os.path.join(_get_base_path(), restaurant_id, f"{item_name}_meta.json")


def forecast(
    restaurant_id: str,
    item_name: str,
    future_temp: list[float],
    future_events: list[int],
) -> pd.DataFrame:
    """
    Generate hourly demand forecast for a trained item model.

    Args:
        restaurant_id: Restaurant identifier.
        item_name:     Menu item to forecast.
        future_temp:   Temperature_celsius value per forecast hour.
        future_events: event_day flag (0 or 1) per forecast hour.

    Returns:
        DataFrame with columns:
            timestamp, predicted_demand, min_expected_demand, max_expected_demand

    Raises:
        FileNotFoundError: If no trained model exists for the item.
        ValueError:        If regressor arrays have mismatched lengths.
    """
    if len(future_temp) != len(future_events):
        raise ValueError(
            f"Regressor length mismatch: "
            f"temperature={len(future_temp)}, events={len(future_events)}"
        )

    model_path = get_model_path(restaurant_id, item_name)
    meta_path  = get_meta_path(restaurant_id, item_name)

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found for restaurant={restaurant_id}, item={item_name}"
        )

    model = joblib.load(model_path)

    # Determine start of forecast window from metadata
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            meta = json.load(f)
        last_ds = pd.Timestamp(meta["last_ds"])
    else:
        last_ds = model.history["ds"].max()

    periods = len(future_temp)
    future_dates = pd.date_range(
        start=last_ds + timedelta(hours=1),
        periods=periods,
        freq="h",
    )

    future_df = pd.DataFrame({
        "ds":                  future_dates,
        "temperature_celsius": future_temp,
        "event_day":           future_events,
    })

    # Apply same feature engineering used at training time
    future_df = apply_temperature_features(future_df)

    result = model.predict(future_df)

    # Post-processing: non-negative, rounded integers
    result["predicted_demand"]    = result["yhat"].clip(lower=0).round().astype(int)
    result["min_expected_demand"] = result["yhat_lower"].clip(lower=0).round().astype(int)
    result["max_expected_demand"] = result["yhat_upper"].clip(lower=0).round().astype(int)

    return (
        result[["ds", "predicted_demand", "min_expected_demand", "max_expected_demand"]]
        .rename(columns={"ds": "timestamp"})
    )
