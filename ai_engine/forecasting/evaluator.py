"""
forecasting/evaluator.py
Model evaluation logic.

Changes vs original:
  - _train_and_predict() now applies apply_temperature_features() before
    fitting and predicting, matching the production training pipeline.
  - evaluate_overall_items() is renamed to align with new /metrics/overall endpoint.
  - evaluate_temperature_sanity() already existed and is unchanged.
  - All metric formulas (MAE, MAPE) are preserved exactly.
  - Hold-out strategy (last 168 hours) is preserved exactly.
  - Data loading uses load_data() which now calls the normalized SQL JOIN.
"""
import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error

from preprocessing.loader import load_data
from preprocessing.cleaner import clean_data
from preprocessing.aggregator import aggregate_hourly
from features.temperature import apply_temperature_features
from forecasting.predictor import forecast


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _train_and_predict(train_df: pd.DataFrame, test_df: pd.DataFrame) -> pd.DataFrame:
    """
    Train a temporary Prophet model on train_df and predict on test_df dates.

    Temperature features are applied before fitting and before predicting
    so evaluation results are consistent with production models.
    """
    # Apply engineered features to both sets
    train_df = apply_temperature_features(train_df.copy())

    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=True,
        yearly_seasonality=False,
    )

    model.add_regressor("event_day")
    model.add_regressor("temperature_celsius")
    model.add_regressor("temp_deviation_from_optimal")
    model.add_regressor("is_extreme_cold")
    model.add_regressor("is_extreme_heat")

    model.fit(train_df)

    future = test_df[["ds", "temperature_celsius", "event_day"]].copy()
    future = apply_temperature_features(future)

    return model.predict(future)


# ---------------------------------------------------------------------------
# HOURLY EVALUATION
# ---------------------------------------------------------------------------

def evaluate_hourly(df: pd.DataFrame, return_details: bool = False) -> dict:
    """
    Evaluate hourly forecast accuracy using a hold-out of the last 7 days (168 h).

    Expects columns: ds, y, temperature_celsius, event_day

    Returns dict with keys: granularity, mae, mape
    """
    test_hours = 7 * 24

    if len(df) <= test_hours * 2:
        raise ValueError(
            f"Not enough data for evaluation: need >{test_hours * 2} rows, got {len(df)}"
        )

    train_df    = df.iloc[:-test_hours].copy()
    test_df     = df.iloc[-test_hours:].copy()
    forecast_df = _train_and_predict(train_df, test_df)

    y_true = test_df["y"].values
    y_pred = forecast_df["yhat"].clip(lower=0).round().values

    mae  = mean_absolute_error(y_true, y_pred)
    mape = np.mean(
        np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))
    ) * 100

    response: dict = {
        "granularity": "hourly",
        "mae":  round(float(mae),  2),
        "mape": round(float(mape), 2),
    }

    if return_details:
        response["details"] = (
            pd.DataFrame({
                "timestamp": test_df["ds"].values,
                "actual":    y_true,
                "predicted": y_pred,
            }).to_dict(orient="records")
        )

    return response


# ---------------------------------------------------------------------------
# DAILY EVALUATION
# ---------------------------------------------------------------------------

def evaluate_daily(df: pd.DataFrame, return_details: bool = False) -> dict:
    """
    Evaluate daily forecast accuracy using a hold-out of the last 7 days.

    Expects columns: ds, y, temperature_celsius, event_day

    Returns dict with keys: granularity, mae, mape
    """
    test_hours = 7 * 24

    if len(df) <= test_hours * 2:
        raise ValueError(
            f"Not enough data for evaluation: need >{test_hours * 2} rows, got {len(df)}"
        )

    train_df    = df.iloc[:-test_hours].copy()
    test_df     = df.iloc[-test_hours:].copy()
    forecast_df = _train_and_predict(train_df, test_df)

    test_df["date"]     = test_df["ds"].dt.date
    forecast_df["date"] = forecast_df["ds"].dt.date

    daily_true = test_df.groupby("date")["y"].sum()
    daily_pred = (
        forecast_df.groupby("date")["yhat"]
        .sum()
        .clip(lower=0)
        .round()
    )

    mae  = mean_absolute_error(daily_true, daily_pred)
    mape = np.mean(
        np.abs((daily_true - daily_pred) / np.where(daily_true == 0, 1, daily_true))
    ) * 100

    response: dict = {
        "granularity": "daily",
        "mae":  round(float(mae),  2),
        "mape": round(float(mape), 2),
    }

    if return_details:
        response["details"] = (
            pd.DataFrame({
                "date":      daily_true.index.astype(str),
                "actual":    daily_true.values,
                "predicted": daily_pred.values,
            }).to_dict(orient="records")
        )

    return response


# ---------------------------------------------------------------------------
# OVERALL RESTAURANT EVALUATION
# ---------------------------------------------------------------------------

def evaluate_overall_items(restaurant_id: str) -> dict:
    """
    Evaluate all items for a restaurant using daily MAE & MAPE.

    Data is loaded via the normalized SQL JOIN (Orders→OrderItems→MenuItems).
    Items with insufficient data to evaluate are silently skipped.

    Returns:
        {
            "overall_stats": {"mean_mae", "best_item", "worst_item"},
            "item_breakdown": { item_name: {"mae", "mape"} }
        }
    """
    df = load_data(restaurant_id)
    if df.empty:
        raise ValueError(f"No data found for restaurant_id={restaurant_id}")

    df = clean_data(df)
    df = aggregate_hourly(df)

    items        = df["item_name"].unique()
    item_metrics = {}
    mae_list     = []

    for item in items:
        item_df = df[df["item_name"] == item]
        try:
            eval_res = evaluate_daily(item_df, return_details=False)
            item_metrics[item] = {"mae": eval_res["mae"], "mape": eval_res["mape"]}
            mae_list.append((item, eval_res["mae"]))
        except ValueError:
            pass  # Skip items that lack enough continuous data

    if not mae_list:
        raise ValueError("No items had enough continuous data to evaluate.")

    mae_list.sort(key=lambda x: x[1])

    best_item  = mae_list[0][0]
    worst_item = mae_list[-1][0]
    mean_mae   = sum(x[1] for x in mae_list) / len(mae_list)

    return {
        "overall_stats": {
            "mean_mae":  round(mean_mae, 2),
            "best_item": best_item,
            "worst_item": worst_item,
        },
        "item_breakdown": item_metrics,
    }


# ---------------------------------------------------------------------------
# TEMPERATURE SANITY EVALUATION
# ---------------------------------------------------------------------------

def evaluate_temperature_sanity(restaurant_id: str, item_name: str) -> dict:
    """
    Sweep temperatures from -10°C to +45°C (step=5) to validate
    that the model's demand response is physically plausible.

    Uses event_day=0 for all hours.
    Calls the production forecast() pipeline so engineered features are applied.

    Returns:
        {
            "restaurant_id", "item_name",
            "peak_demand_temperature", "lowest_demand_temperature",
            "temperature_sweep_daily_demand": { "XC": int }
        }
    """
    temp_sweep  = list(range(-10, 46, 5))   # -10, -5, 0, 5, …, 45
    predictions = {}
    max_demand  = -1
    min_demand  = float("inf")
    peak_temp   = None
    trough_temp = None

    for temp in temp_sweep:
        try:
            future_temps  = [float(temp)] * 24
            future_events = [0] * 24

            pred_df      = forecast(restaurant_id, item_name, future_temps, future_events)
            daily_demand = pred_df["predicted_demand"].sum()
            key          = f"{temp}°C"
            predictions[key] = int(daily_demand)

            if daily_demand > max_demand:
                max_demand = daily_demand
                peak_temp  = key

            if daily_demand < min_demand:
                min_demand  = daily_demand
                trough_temp = key

        except FileNotFoundError:
            raise ValueError(
                f"Model not found for {item_name}. Train the model first."
            )

    return {
        "restaurant_id":                 restaurant_id,
        "item_name":                     item_name,
        "peak_demand_temperature":       peak_temp,
        "lowest_demand_temperature":     trough_temp,
        "temperature_sweep_daily_demand": predictions,
    }
