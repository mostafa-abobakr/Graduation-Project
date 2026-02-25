"""
features/temperature.py
Engineers non-linear temperature features for demand modeling.

Rules:
  - NO per-item learned temperature curves
  - NO splines, Gaussians, or item-specific comfort functions
  - Global, deterministic feature engineering ONLY
  - Applied identically during training AND forecasting (never stored in DB)

The Prophet model learns item-specific interactions naturally:
  - Ice cream demand ↑ when hot (via temperature_celsius × item encoding)
  - Hot meals ↓ when extremely hot (via is_extreme_heat flag)
  - Neutral items respond ≈ flat
All behavior emerges from data + features — no hardcoded demand rules.
"""
import pandas as pd

# ---------------------------------------------------------------------------
# Configurable constants
# ---------------------------------------------------------------------------
OPTIMAL_TEMP           = 22.0   # °C — baseline comfort temperature
EXTREME_COLD_THRESHOLD = 5.0    # °C — below this → extreme cold flag activated
EXTREME_HEAT_THRESHOLD = 35.0   # °C — above this → extreme heat flag activated


def apply_temperature_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers non-linear temperature features.
    Uses global thresholds to avoid overfitting.

    Expects:
        df["temperature_celsius"]  (float)

    Adds:
        temp_deviation_from_optimal : abs distance from OPTIMAL_TEMP
        is_extreme_cold             : 1 if temp <= EXTREME_COLD_THRESHOLD
        is_extreme_heat             : 1 if temp >= EXTREME_HEAT_THRESHOLD

    Returns:
        New DataFrame (copy) with the three additional columns.

    Raises:
        ValueError: If 'temperature_celsius' is not present in df.
    """
    if "temperature_celsius" not in df.columns:
        raise ValueError("DataFrame must contain 'temperature_celsius' column.")

    df = df.copy()

    df["temp_deviation_from_optimal"] = (
        df["temperature_celsius"] - OPTIMAL_TEMP
    ).abs()

    df["is_extreme_cold"] = (
        df["temperature_celsius"] <= EXTREME_COLD_THRESHOLD
    ).astype(int)

    df["is_extreme_heat"] = (
        df["temperature_celsius"] >= EXTREME_HEAT_THRESHOLD
    ).astype(int)

    return df
