"""
analytics/queries.py
Pure SQL analytics queries against Orders, OrderItems, MenuItems.

Rules:
  - NO ML models
  - NO forecasting logic
  - SQL aggregations first, pandas only for final formatting
  - All results are deterministic and fast
"""
import pandas as pd
from sqlalchemy import text

from database.connection import get_engine


# ---------------------------------------------------------------------------
# 1. Revenue Summary
# ---------------------------------------------------------------------------
_REVENUE_SUMMARY_SQL = text("""
    SELECT
        SUM(o.TotalOrderValue)  AS total_revenue,
        COUNT(DISTINCT o.OrderId) AS total_orders,
        AVG(o.TotalOrderValue)  AS avg_order_value,
        SUM(oi.Quantity)        AS total_items_sold
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    WHERE o.RestaurantId = :restaurant_id
""")


def get_revenue_summary(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            _REVENUE_SUMMARY_SQL, {"restaurant_id": restaurant_id}
        ).fetchone()

    if row is None or row[1] == 0:
        return {
            "total_revenue":    0.0,
            "total_orders":     0,
            "avg_order_value":  0.0,
            "total_items_sold": 0,
        }

    return {
        "total_revenue":    round(float(row[0] or 0), 2),
        "total_orders":     int(row[1] or 0),
        "avg_order_value":  round(float(row[2] or 0), 2),
        "total_items_sold": int(row[3] or 0),
    }


# ---------------------------------------------------------------------------
# 2. Revenue Trend  (hour | day granularity)
# ---------------------------------------------------------------------------
_REVENUE_TREND_HOUR_SQL = text("""
    SELECT
        DATEADD(hour, DATEDIFF(hour, 0, o.OrderTimestamp), 0) AS bucket,
        SUM(o.TotalOrderValue)    AS revenue,
        COUNT(DISTINCT o.OrderId) AS order_count
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY DATEADD(hour, DATEDIFF(hour, 0, o.OrderTimestamp), 0)
    ORDER BY bucket
""")

_REVENUE_TREND_DAY_SQL = text("""
    SELECT
        CAST(o.OrderTimestamp AS DATE) AS bucket,
        SUM(o.TotalOrderValue)    AS revenue,
        COUNT(DISTINCT o.OrderId) AS order_count
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY bucket
""")


def get_revenue_trend(restaurant_id: str, granularity: str) -> list[dict]:
    sql = _REVENUE_TREND_HOUR_SQL if granularity == "hour" else _REVENUE_TREND_DAY_SQL
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(sql, conn, params={"restaurant_id": restaurant_id})

    if df.empty:
        return []

    df["bucket"]      = df["bucket"].astype(str)
    df["revenue"]     = df["revenue"].round(2)
    df["order_count"] = df["order_count"].astype(int)
    df = df.rename(columns={"bucket": "timestamp"})
    return df.to_dict(orient="records")


# ---------------------------------------------------------------------------
# 3. Menu Performance
# ---------------------------------------------------------------------------
_MENU_PERFORMANCE_SQL = text("""
    SELECT
        mi.ItemName                   AS item_name,
        COUNT(DISTINCT oi.OrderId)    AS orders,
        SUM(oi.LineTotal)             AS revenue,
        SUM(mi.Price * oi.Quantity)   AS profit,
        AVG(mi.Price)                 AS avg_price
    FROM OrderItems oi
    JOIN Orders    o  ON oi.OrderId    = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY mi.ItemName, mi.Price
    ORDER BY revenue DESC
""")


def get_menu_performance(restaurant_id: str) -> list[dict]:
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(
            _MENU_PERFORMANCE_SQL, conn,
            params={"restaurant_id": restaurant_id}
        )

    if df.empty:
        return []

    # Aggregate across items that might share a name with different prices
    agg = (
        df.groupby("item_name", as_index=False)
        .agg({"orders": "sum", "revenue": "sum", "profit": "sum", "avg_price": "mean"})
    )

    def margin_pct(row):
        if row["revenue"] and row["revenue"] > 0:
            return round((row["profit"] / row["revenue"]) * 100, 2)
        return 0.0

    agg["margin_percentage"] = agg.apply(margin_pct, axis=1)
    agg["revenue"]           = agg["revenue"].round(2)
    agg["profit"]            = agg["profit"].round(2)
    agg["orders"]            = agg["orders"].astype(int)
    agg = agg.drop(columns=["avg_price"])
    agg = agg.sort_values("revenue", ascending=False)
    return agg.to_dict(orient="records")


# ---------------------------------------------------------------------------
# 4. Peak Hours & Days
# ---------------------------------------------------------------------------
_PEAK_HOURS_SQL = text("""
    SELECT TOP 3
        DATEPART(hour, o.OrderTimestamp) AS hour,
        COUNT(DISTINCT o.OrderId)        AS order_count,
        SUM(o.TotalOrderValue)           AS revenue
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY DATEPART(hour, o.OrderTimestamp)
    ORDER BY order_count DESC
""")

_PEAK_DAYS_SQL = text("""
    SELECT TOP 3
        DATENAME(weekday, o.OrderTimestamp) AS day_name,
        DATEPART(weekday, o.OrderTimestamp) AS day_num,
        COUNT(DISTINCT o.OrderId)           AS order_count,
        SUM(o.TotalOrderValue)              AS revenue
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY DATENAME(weekday, o.OrderTimestamp),
             DATEPART(weekday, o.OrderTimestamp)
    ORDER BY order_count DESC
""")


def get_peak_hours(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        hours_df = pd.read_sql(
            _PEAK_HOURS_SQL, conn, params={"restaurant_id": restaurant_id}
        )
        days_df = pd.read_sql(
            _PEAK_DAYS_SQL, conn, params={"restaurant_id": restaurant_id}
        )

    peak_hours = []
    if not hours_df.empty:
        for _, r in hours_df.iterrows():
            h = int(r["hour"])
            peak_hours.append({
                "hour":        f"{h:02d}:00",
                "order_count": int(r["order_count"]),
                "revenue":     round(float(r["revenue"]), 2),
            })

    peak_days = []
    if not days_df.empty:
        for _, r in days_df.iterrows():
            peak_days.append({
                "day":         r["day_name"],
                "order_count": int(r["order_count"]),
                "revenue":     round(float(r["revenue"]), 2),
            })

    return {"peak_hours": peak_hours, "peak_days": peak_days}


# ---------------------------------------------------------------------------
# 5. Alerts — rule-based, no ML
# ---------------------------------------------------------------------------
_DAILY_REVENUE_SQL = text("""
    SELECT
        CAST(o.OrderTimestamp AS DATE)    AS day,
        SUM(o.TotalOrderValue)            AS revenue,
        COUNT(DISTINCT o.OrderId)         AS orders
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY day DESC
""")

_COLD_DRINK_SALES_SQL = text("""
    SELECT
        CAST(o.OrderTimestamp AS DATE) AS day,
        AVG(o.TemperatureCelsius)      AS avg_temp,
        SUM(oi.Quantity)               AS cold_qty
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId    = o.OrderId
    JOIN MenuItems  mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
      AND (
        mi.ItemName LIKE '%Ice Cream%'
        OR mi.ItemName LIKE '%Cold%'
        OR mi.ItemName LIKE '%Shake%'
        OR mi.ItemName LIKE '%Smoothie%'
        OR mi.ItemName LIKE '%Juice%'
      )
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY day DESC
""")

_MARGIN_SQL = text("""
    SELECT
        mi.ItemName                    AS item_name,
        SUM(oi.LineTotal)              AS revenue,
        SUM(mi.Price * oi.Quantity)    AS cost_estimate,
        COUNT(DISTINCT oi.OrderId)     AS orders
    FROM OrderItems oi
    JOIN Orders    o  ON oi.OrderId    = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
    GROUP BY mi.ItemName, mi.Price
    ORDER BY revenue DESC
""")


_REVENUE_DROP_THRESHOLD  = 0.20   # 20% day-over-day revenue drop
_HIGH_TEMP_THRESHOLD     = 28.0   # °C — "hot day"
_LOW_COLD_QTY_THRESHOLD  = 5      # fewer than this = suspicious
_LOW_MARGIN_THRESHOLD    = 10.0   # margin % below this = alert


def get_alerts(restaurant_id: str) -> list[dict]:
    engine = get_engine()
    alerts: list[dict] = []

    with engine.connect() as conn:
        daily_df     = pd.read_sql(_DAILY_REVENUE_SQL, conn, params={"restaurant_id": restaurant_id})
        cold_df      = pd.read_sql(_COLD_DRINK_SALES_SQL, conn, params={"restaurant_id": restaurant_id})
        margin_df    = pd.read_sql(_MARGIN_SQL, conn, params={"restaurant_id": restaurant_id})

    # --- Alert 1: Revenue dropped > 20% day-over-day ---
    if len(daily_df) >= 2:
        daily_df["day"]     = pd.to_datetime(daily_df["day"])
        daily_df            = daily_df.sort_values("day", ascending=True)
        daily_df["prev"]    = daily_df["revenue"].shift(1)
        daily_df["change"]  = (daily_df["revenue"] - daily_df["prev"]) / daily_df["prev"].abs()
        drops               = daily_df[daily_df["change"] < -_REVENUE_DROP_THRESHOLD]
        for _, r in drops.iterrows():
            alerts.append({
                "type":    "revenue_drop",
                "severity": "warning",
                "message": (
                    f"Revenue dropped {abs(r['change'] * 100):.1f}% on "
                    f"{r['day'].date()} vs previous day "
                    f"(${r['prev']:.2f} → ${r['revenue']:.2f})"
                ),
            })

    # --- Alert 2: High temperature + low cold-drink sales ---
    if not cold_df.empty:
        cold_df["day"] = pd.to_datetime(cold_df["day"])
        hot_low = cold_df[
            (cold_df["avg_temp"] >= _HIGH_TEMP_THRESHOLD) &
            (cold_df["cold_qty"] <= _LOW_COLD_QTY_THRESHOLD)
        ]
        for _, r in hot_low.iterrows():
            alerts.append({
                "type":     "cold_item_underperformance",
                "severity": "info",
                "message": (
                    f"Hot day ({r['avg_temp']:.1f}°C) on {r['day'].date()} "
                    f"but cold-drink sales were only {int(r['cold_qty'])} units. "
                    "Check stock or visibility."
                ),
            })

    # --- Alert 3: High-volume items with low margin ---
    if not margin_df.empty:
        margin_df = margin_df.groupby("item_name", as_index=False).agg(
            {"revenue": "sum", "cost_estimate": "sum", "orders": "sum"}
        )
        margin_df["margin_pct"] = (
            (margin_df["revenue"] - margin_df["cost_estimate"])
            / margin_df["revenue"].replace(0, float("nan"))
            * 100
        )
        high_vol_low_margin = margin_df[
            (margin_df["orders"] > margin_df["orders"].median()) &
            (margin_df["margin_pct"] < _LOW_MARGIN_THRESHOLD)
        ]
        for _, r in high_vol_low_margin.iterrows():
            alerts.append({
                "type":     "low_margin_high_volume",
                "severity": "warning",
                "message": (
                    f"'{r['item_name']}' has {int(r['orders'])} orders "
                    f"but only {r['margin_pct']:.1f}% margin. "
                    "Consider repricing."
                ),
            })

    return alerts


# ---------------------------------------------------------------------------
# 6. Latest Day Actuals (For Forecast Comparison)
# ---------------------------------------------------------------------------
_LATEST_DAY_ACTUALS_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date
        FROM Orders
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        mi.ItemName                 AS item_name,
        mi.Price                    AS current_price,
        SUM(oi.Quantity)            AS total_qty,
        SUM(oi.LineTotal)           AS total_revenue,
        (SELECT max_date FROM LatestDate) AS baseline_date
    FROM OrderItems oi
    JOIN Orders o    ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) = (SELECT max_date FROM LatestDate)
    GROUP BY mi.ItemName, mi.Price
""")

def get_latest_day_actuals(restaurant_id: str) -> dict:
    """
    Finds the most recent day of sales for a restaurant, and returns the totals
    per item. Useful as a baseline to compare against tomorrow's forecast.
    """
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(_LATEST_DAY_ACTUALS_SQL, conn, params={"restaurant_id": restaurant_id})

    if df.empty:
        return {"baseline_date": None, "items": {}}

    # The baseline_date is the same for all rows, grab it from the first
    baseline_date = df["baseline_date"].iloc[0]
    
    # Aggregate by item_name in case there are multiple menu entries for the same name
    agg = df.groupby("item_name", as_index=False).agg({
        "total_qty": "sum",
        "total_revenue": "sum",
        "current_price": "mean"
    })
    
    items_dict = {}
    for _, r in agg.iterrows():
        items_dict[r["item_name"]] = {
            "qty": int(r["total_qty"]),
            "revenue": round(float(r["total_revenue"]), 2),
            "price": round(float(r["current_price"]), 2)
        }
        
    return {
        "baseline_date": str(baseline_date) if baseline_date else None,
        "items": items_dict,
    }
