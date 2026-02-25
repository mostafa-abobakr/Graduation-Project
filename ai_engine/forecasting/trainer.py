"""
forecasting/trainer.py
Trains a Prophet model for a single menu item and persists it to disk.

Changes vs original:
  - apply_temperature_features() is called before fitting so that
    temp_deviation_from_optimal, is_extreme_cold, is_extreme_heat
    are registered as additional Prophet regressors. Training and
    forecasting use exactly the same feature set.
"""
from prophet import Prophet
import joblib
import json
import os

from features.temperature import apply_temperature_features
from config.settings import MODEL_ROOT


def get_model_dir(restaurant_id: str) -> str:
    """Return (and lazily create) the model directory for a restaurant."""
    path = os.path.join(MODEL_ROOT, restaurant_id)
    os.makedirs(path, exist_ok=True)
    return path


def train_prophet(df, item_name: str, restaurant_id: str) -> str:
    """
    Train a Prophet model for a single item and persist to disk.

    Input DataFrame must have columns:
        ds, y, temperature_celsius, event_day

    Saves:
        {item_name}.pkl        – serialised Prophet model
        {item_name}_meta.json  – training metadata (last_ds, training_rows)

    Returns:
        Absolute path to the saved model file.
    """
    # --- Feature engineering (same pipeline used at forecast time) ----------
    train_df = df[["ds", "y", "temperature_celsius", "event_day"]].copy()
    train_df = apply_temperature_features(train_df)

    # --- Prophet setup -------------------------------------------------------
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=True,
        yearly_seasonality=False,
    )

    # Core regressors
    model.add_regressor("event_day")
    model.add_regressor("temperature_celsius")

    # Engineered temperature features — let Prophet learn item-specific
    # interactions naturally from data, no manual coefficients.
    model.add_regressor("temp_deviation_from_optimal")
    model.add_regressor("is_extreme_cold")
    model.add_regressor("is_extreme_heat")

    model.fit(train_df)

    # --- Persist -------------------------------------------------------------
    model_dir  = get_model_dir(restaurant_id)
    model_path = os.path.join(model_dir, f"{item_name}.pkl")
    meta_path  = os.path.join(model_dir, f"{item_name}_meta.json")

    joblib.dump(model, model_path)

    with open(meta_path, "w") as f:
        json.dump(
            {
                "item_name":     item_name,
                "last_ds":       str(train_df["ds"].max()),
                "training_rows": len(train_df),
            },
            f,
        )

    return model_path
