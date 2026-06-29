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

def _get_timeframe_clause(timeframe: str, table_alias: str = "o") -> str:
    if timeframe == "all" or not timeframe:
        return ""
    days = {"day": 0, "week": 6, "month": 29}.get(timeframe, 0)
    return f" AND CAST({table_alias}.OrderTimestamp AS DATE) >= DATEADD(day, -{days}, (SELECT MAX(CAST(OrderTimestamp AS DATE)) FROM Orders WHERE RestaurantId = :restaurant_id))"

# ---------------------------------------------------------------------------
# 1. Revenue Summary
# ---------------------------------------------------------------------------
_REVENUE_SUMMARY_SQL = """
    WITH OrderStats AS (
        SELECT
            COUNT(OrderId) AS total_orders,
            SUM(TotalOrderValue) AS total_revenue,
            AVG(TotalOrderValue) AS avg_order_value
        FROM Orders o
        WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    ),
    ItemStats AS (
        SELECT
            SUM(oi.Quantity) AS total_items_sold,
            SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS total_profit
        FROM Orders o
        JOIN OrderItems oi ON oi.OrderId = o.OrderId
        JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
        WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    )
    SELECT
        o.total_revenue,
        o.total_orders,
        o.avg_order_value,
        i.total_items_sold,
        i.total_profit
    FROM OrderStats o
    CROSS JOIN ItemStats i
"""


def get_revenue_summary(restaurant_id: str, timeframe: str = "all") -> dict:
    engine = get_engine()
    clause = _get_timeframe_clause(timeframe, "o")
    with engine.connect() as conn:
        row = conn.execute(
            text(_REVENUE_SUMMARY_SQL.format(timeframe_clause=clause)), 
            {"restaurant_id": restaurant_id}
        ).fetchone()

    def _parse_row(r):
        if r is None or r[1] == 0:
            return {
                "total_revenue":     0.0,
                "total_orders":      0,
                "avg_order_value":   0.0,
                "total_items_sold":  0,
                "total_profit":      0.0,
                "margin_percentage": 0.0,
            }

        t_rev = float(r[0] or 0)
        t_prof  = float(r[4] or 0)
        m_pct    = round((t_prof / t_rev) * 100, 2) if t_rev > 0 else 0.0

        return {
            "total_revenue":     round(t_rev, 2),
            "total_orders":      int(r[1] or 0),
            "avg_order_value":   round(float(r[2] or 0), 2),
            "total_items_sold":  int(r[3] or 0),
            "total_profit":      round(t_prof, 2),
            "margin_percentage": m_pct,
        }

    current = _parse_row(row)

    if timeframe != "all" and timeframe:
        days = {"day": 0, "week": 6, "month": 29}.get(timeframe, 0)
        period_length = days + 1
        start_offset = days + period_length
        end_offset = days + 1

        max_date_subquery = "(SELECT MAX(CAST(OrderTimestamp AS DATE)) FROM Orders WHERE RestaurantId = :restaurant_id)"
        prev_clause = f" AND CAST(o.OrderTimestamp AS DATE) >= DATEADD(day, -{start_offset}, {max_date_subquery}) AND CAST(o.OrderTimestamp AS DATE) <= DATEADD(day, -{end_offset}, {max_date_subquery})"

        with engine.connect() as conn:
            prev_row = conn.execute(
                text(_REVENUE_SUMMARY_SQL.format(timeframe_clause=prev_clause)),
                {"restaurant_id": restaurant_id}
            ).fetchone()

        prev = _parse_row(prev_row)

        def _pct(curr_val, prev_val):
            if prev_val and prev_val > 0:
                pct = ((curr_val - prev_val) / prev_val) * 100
                sign = "+" if pct >= 0 else ""
                return f"{sign}{pct:.1f}%"
            return "N/A"

        current["revenue_change_pct"]          = _pct(current["total_revenue"],    prev["total_revenue"])
        current["profit_change_pct"]           = _pct(current["total_profit"],     prev["total_profit"])
        current["orders_change_pct"]           = _pct(current["total_orders"],     prev["total_orders"])
        current["avg_order_value_change_pct"]  = _pct(current["avg_order_value"],  prev["avg_order_value"])
        current["items_sold_change_pct"]       = _pct(current["total_items_sold"], prev["total_items_sold"])

    return current


# ---------------------------------------------------------------------------
# 2. Revenue Trend  (hour | day granularity)
# ---------------------------------------------------------------------------
_REVENUE_TREND_HOUR_SQL = """
    SELECT
        DATEADD(hour, DATEDIFF(hour, 0, o.OrderTimestamp), 0) AS bucket,
        SUM(o.TotalOrderValue)    AS revenue,
        COUNT(DISTINCT o.OrderId) AS order_count
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY DATEADD(hour, DATEDIFF(hour, 0, o.OrderTimestamp), 0)
    ORDER BY bucket
"""

_REVENUE_TREND_DAY_SQL = """
    SELECT
        CAST(o.OrderTimestamp AS DATE) AS bucket,
        SUM(o.TotalOrderValue)    AS revenue,
        COUNT(DISTINCT o.OrderId) AS order_count
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY bucket
"""


def get_revenue_trend(restaurant_id: str, granularity: str, timeframe: str = "all") -> list[dict]:
    sql_template = _REVENUE_TREND_HOUR_SQL if granularity == "hour" else _REVENUE_TREND_DAY_SQL
    clause = _get_timeframe_clause(timeframe, "o")
    sql = text(sql_template.format(timeframe_clause=clause))
    
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
_MENU_PERFORMANCE_SQL = """
    SELECT
        mi.ItemName                   AS item_name,
        mi.ImageUrl                   AS image_url,
        COUNT(DISTINCT oi.OrderId)    AS orders,
        SUM(oi.LineTotal)             AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit,
        AVG(mi.Price)                 AS avg_price
    FROM OrderItems oi
    JOIN Orders    o  ON oi.OrderId    = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY mi.ItemName, mi.Price, mi.ImageUrl
    ORDER BY revenue DESC
"""


def get_menu_performance(restaurant_id: str, timeframe: str = "all") -> list[dict]:
    engine = get_engine()
    clause = _get_timeframe_clause(timeframe, "o")
    with engine.connect() as conn:
        df = pd.read_sql(
            text(_MENU_PERFORMANCE_SQL.format(timeframe_clause=clause)), conn,
            params={"restaurant_id": restaurant_id}
        )

    if df.empty:
        return []

    # Aggregate across items that might share a name with different prices
    agg = (
        df.groupby("item_name", as_index=False)
        .agg({
            "image_url": "first",
            "orders": "sum",
            "revenue": "sum",
            "profit": "sum",
            "avg_price": "mean",
        })
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
_PEAK_HOURS_SQL = """
    SELECT TOP 5
        DATEPART(hour, o.OrderTimestamp) AS hour,
        COUNT(DISTINCT o.OrderId)        AS order_count,
        SUM(o.TotalOrderValue)           AS revenue
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY DATEPART(hour, o.OrderTimestamp)
    ORDER BY order_count DESC
"""

_PEAK_DAYS_SQL = """
    SELECT TOP 5
        DATENAME(weekday, o.OrderTimestamp) AS day_name,
        DATEPART(weekday, o.OrderTimestamp) AS day_num,
        COUNT(DISTINCT o.OrderId)           AS order_count,
        SUM(o.TotalOrderValue)              AS revenue
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY DATENAME(weekday, o.OrderTimestamp),
             DATEPART(weekday, o.OrderTimestamp)
    ORDER BY order_count DESC
"""


def get_peak_hours(restaurant_id: str, timeframe: str = "all") -> dict:
    engine = get_engine()
    clause = _get_timeframe_clause(timeframe, "o")
    with engine.connect() as conn:
        hours_df = pd.read_sql(
            text(_PEAK_HOURS_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id}
        )
        days_df = pd.read_sql(
            text(_PEAK_DAYS_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id}
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
_DAILY_REVENUE_SQL = """
    SELECT
        CAST(o.OrderTimestamp AS DATE)    AS day,
        SUM(o.TotalOrderValue)            AS revenue,
        COUNT(DISTINCT o.OrderId)         AS orders
    FROM Orders o
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY day DESC
"""

_COLD_DRINK_SALES_SQL = """
    SELECT
        CAST(o.OrderTimestamp AS DATE) AS day,
        AVG(o.TemperatureCelsius)      AS avg_temp,
        SUM(oi.Quantity)               AS cold_qty
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId    = o.OrderId
    JOIN MenuItems  mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
      AND (
        mi.ItemName LIKE '%Ice Cream%'
        OR mi.ItemName LIKE '%Cold%'
        OR mi.ItemName LIKE '%Shake%'
        OR mi.ItemName LIKE '%Smoothie%'
        OR mi.ItemName LIKE '%Juice%'
      )
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY day DESC
"""

_HOT_ITEM_SALES_SQL = """
    SELECT
        CAST(o.OrderTimestamp AS DATE) AS day,
        AVG(o.TemperatureCelsius)      AS avg_temp,
        SUM(oi.Quantity)               AS hot_qty
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId    = o.OrderId
    JOIN MenuItems  mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
      AND (
        mi.ItemName LIKE '%Coffee%'
        OR mi.ItemName LIKE '%Hot%'
        OR mi.ItemName LIKE '%Soup%'
        OR mi.ItemName LIKE '%Tea%'
        OR mi.ItemName LIKE '%Warm%'
      )
    GROUP BY CAST(o.OrderTimestamp AS DATE)
    ORDER BY day DESC
"""

_MARGIN_SQL = """
    SELECT
        mi.ItemName                    AS item_name,
        SUM(oi.LineTotal)              AS revenue,
        SUM(mi.Cost * oi.Quantity)     AS cost_estimate,
        COUNT(DISTINCT oi.OrderId)     AS orders
    FROM OrderItems oi
    JOIN Orders    o  ON oi.OrderId    = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id {timeframe_clause}
    GROUP BY mi.ItemName, mi.Price
    ORDER BY revenue DESC
"""


_REVENUE_DROP_THRESHOLD  = 0.20   # 20% day-over-day revenue drop
_REVENUE_SPIKE_THRESHOLD = 0.20   # 20% day-over-day revenue spike
_HIGH_TEMP_THRESHOLD     = 28.0   # °C — "hot day"
_LOW_TEMP_THRESHOLD      = 15.0   # °C — "cold day"
_LOW_COLD_QTY_THRESHOLD  = 5      # fewer than this = suspicious
_LOW_HOT_QTY_THRESHOLD   = 5      # fewer than this = suspicious
_LOW_MARGIN_THRESHOLD    = 10.0   # margin % below this = alert
_HIGH_MARGIN_THRESHOLD   = 60.0   # margin % above this = opportunity


def get_alerts(restaurant_id: str, timeframe: str = "all") -> list[dict]:
    engine = get_engine()
    alerts: list[dict] = []
    
    clause = _get_timeframe_clause(timeframe, "o")

    with engine.connect() as conn:
        daily_df     = pd.read_sql(text(_DAILY_REVENUE_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id})
        cold_df      = pd.read_sql(text(_COLD_DRINK_SALES_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id})
        hot_df       = pd.read_sql(text(_HOT_ITEM_SALES_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id})
        margin_df    = pd.read_sql(text(_MARGIN_SQL.format(timeframe_clause=clause)), conn, params={"restaurant_id": restaurant_id})

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
                    f"(${int(round(r['prev']))} → ${int(round(r['revenue']))})"
                ),
            })
            
        spikes = daily_df[daily_df["change"] > _REVENUE_SPIKE_THRESHOLD]
        for _, r in spikes.iterrows():
            alerts.append({
                "type":    "revenue_spike",
                "severity": "info",
                "message": (
                    f"Revenue spiked {abs(r['change'] * 100):.1f}% on "
                    f"{r['day'].date()} vs previous day "
                    f"(${int(round(r['prev']))} → ${int(round(r['revenue']))})"
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

    # --- Alert 3: Low temperature + low hot-drink/soup sales ---
    if not hot_df.empty:
        hot_df["day"] = pd.to_datetime(hot_df["day"])
        cold_low = hot_df[
            (hot_df["avg_temp"] <= _LOW_TEMP_THRESHOLD) &
            (hot_df["hot_qty"] <= _LOW_HOT_QTY_THRESHOLD)
        ]
        for _, r in cold_low.iterrows():
            alerts.append({
                "type":     "hot_item_underperformance",
                "severity": "info",
                "message": (
                    f"Cold day ({r['avg_temp']:.1f}°C) on {r['day'].date()} "
                    f"but hot-item sales were only {int(r['hot_qty'])} units. "
                    "Consider promoting warm items."
                ),
            })

    # --- Alert 4: High-volume items with low margin ---
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

    # --- Alert 5: Low-volume items with high margin ---
    if not margin_df.empty:
        low_vol_high_margin = margin_df[
            (margin_df["orders"] < margin_df["orders"].median()) &
            (margin_df["orders"] > 0) &
            (margin_df["margin_pct"] > _HIGH_MARGIN_THRESHOLD)
        ]
        for _, r in low_vol_high_margin.iterrows():
            alerts.append({
                "type":     "high_margin_low_volume",
                "severity": "info",
                "message": (
                    f"'{r['item_name']}' has a high margin ({r['margin_pct']:.1f}%) "
                    f"but lower than average sales volume ({int(r['orders'])} orders). "
                    "Consider featuring this item to boost profit."
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
        mi.Cost                     AS current_cost,
        SUM(oi.Quantity)            AS total_qty,
        SUM(oi.LineTotal)           AS total_revenue,
        (SELECT max_date FROM LatestDate) AS baseline_date
    FROM OrderItems oi
    JOIN Orders o    ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) = (SELECT max_date FROM LatestDate)
    GROUP BY mi.ItemName, mi.Price, mi.Cost
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
    
    agg = df.groupby("item_name", as_index=False).agg({
        "total_qty": "sum",
        "total_revenue": "sum",
        "current_price": "mean",
        "current_cost": "mean"
    })
    
    items_dict = {}
    for _, r in agg.iterrows():
        items_dict[r["item_name"]] = {
            "qty": int(r["total_qty"]),
            "revenue": round(float(r["total_revenue"]), 2),
            "price": round(float(r["current_price"]), 2),
            "cost": round(float(r["current_cost"]), 2)
        }
        
    return {
        "baseline_date": str(baseline_date) if baseline_date else None,
        "items": items_dict,
    }

# ---------------------------------------------------------------------------
# 6.5 Latest Week Actuals (For Week Forecast Comparison)
# ---------------------------------------------------------------------------
_LATEST_WEEK_ACTUALS_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date
        FROM Orders
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        mi.ItemName                 AS item_name,
        mi.Price                    AS current_price,
        mi.Cost                     AS current_cost,
        SUM(oi.Quantity)            AS total_qty,
        SUM(oi.LineTotal)           AS total_revenue,
        (SELECT max_date FROM LatestDate) AS baseline_date
    FROM OrderItems oi
    JOIN Orders o    ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) > DATEADD(day, -7, (SELECT max_date FROM LatestDate))
      AND CAST(o.OrderTimestamp AS DATE) <= (SELECT max_date FROM LatestDate)
    GROUP BY mi.ItemName, mi.Price, mi.Cost
""")

def get_latest_week_actuals(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(_LATEST_WEEK_ACTUALS_SQL, conn, params={"restaurant_id": restaurant_id})

    if df.empty:
        return {"baseline_date": None, "items": {}}

    baseline_date = df["baseline_date"].iloc[0]
    
    agg = df.groupby("item_name", as_index=False).agg({
        "total_qty": "sum",
        "total_revenue": "sum",
        "current_price": "mean",
        "current_cost": "mean"
    })
    
    items_dict = {}
    for _, r in agg.iterrows():
        items_dict[r["item_name"]] = {
            "qty": int(r["total_qty"]),
            "revenue": round(float(r["total_revenue"]), 2),
            "price": round(float(r["current_price"]), 2),
            "cost": round(float(r["current_cost"]), 2)
        }
        
    return {
        "baseline_date": str(baseline_date) if baseline_date else None,
        "items": items_dict,
    }


# ---------------------------------------------------------------------------
# 7. Cost Reduction KPI
# ---------------------------------------------------------------------------
_COST_REDUCTION_SQL = """
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date
        FROM Orders
        WHERE RestaurantId = :restaurant_id
    ),
    DateRanges AS (
        SELECT
            max_date,
            DATEADD(day, -{current_days}, max_date) AS current_start,
            DATEADD(day, -{previous_days}, max_date) AS previous_start
        FROM LatestDate
    ),
    CurrentWeek AS (
        SELECT
            SUM(oi.LineTotal) AS revenue,
            SUM(mi.Cost * oi.Quantity) AS cost
        FROM Orders o
        JOIN OrderItems oi ON oi.OrderId = o.OrderId
        JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
        CROSS JOIN DateRanges dr
        WHERE o.RestaurantId = :restaurant_id
          AND CAST(o.OrderTimestamp AS DATE) > dr.current_start
          AND CAST(o.OrderTimestamp AS DATE) <= dr.max_date
    ),
    PreviousWeek AS (
        SELECT
            SUM(oi.LineTotal) AS revenue,
            SUM(mi.Cost * oi.Quantity) AS cost
        FROM Orders o
        JOIN OrderItems oi ON oi.OrderId = o.OrderId
        JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
        CROSS JOIN DateRanges dr
        WHERE o.RestaurantId = :restaurant_id
          AND CAST(o.OrderTimestamp AS DATE) > dr.previous_start
          AND CAST(o.OrderTimestamp AS DATE) <= dr.current_start
    )
    SELECT
        cw.revenue AS cw_rev,
        cw.cost AS cw_cost,
        pw.revenue AS pw_rev,
        pw.cost AS pw_cost
    FROM CurrentWeek cw
    CROSS JOIN PreviousWeek pw
"""

def get_cost_percentage_kpi(restaurant_id: str, timeframe: str = "week") -> dict:
    engine = get_engine()
    
    if timeframe == "all" or not timeframe:
        current_days = 36500
        previous_days = 73000
    else:
        days_map = {"day": 1, "week": 7, "month": 30}
        current_days = days_map.get(timeframe, 7)
        previous_days = current_days * 2
        
    with engine.connect() as conn:
        row = conn.execute(
            text(_COST_REDUCTION_SQL.format(current_days=current_days, previous_days=previous_days)), 
            {"restaurant_id": restaurant_id}
        ).fetchone()

    if row is None or row[0] is None:
        return {"costPercentage": 0, "vsLastWeek": 0, "target": 30.0}

    cw_rev, cw_cost, pw_rev, pw_cost = row
    
    cw_pct = (cw_cost / cw_rev * 100) if (cw_rev and cw_cost) else 0.0
    pw_pct = (pw_cost / pw_rev * 100) if (pw_rev and pw_cost) else 0.0
    
    vs_last_week = cw_pct - pw_pct

    return {
        "costPercentage": round(float(cw_pct), 0),
        "vsLastWeek": round(float(vs_last_week), 0),
        "target": 30.0
    }


# ---------------------------------------------------------------------------
# 8. Sales & Profit Chart
# ---------------------------------------------------------------------------
_CHART_HOURLY_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date 
        FROM Orders 
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        DATEPART(hour, o.OrderTimestamp) AS bucket,
        SUM(oi.LineTotal) AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    CROSS JOIN LatestDate ld
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) = ld.max_date
    GROUP BY DATEPART(hour, o.OrderTimestamp)
    ORDER BY bucket
""")

_CHART_WEEKLY_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date 
        FROM Orders 
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        DATENAME(weekday, o.OrderTimestamp) AS bucket_label,
        DATEPART(weekday, o.OrderTimestamp) AS bucket_sort,
        SUM(oi.LineTotal) AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    CROSS JOIN LatestDate ld
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) > DATEADD(day, -7, ld.max_date)
      AND CAST(o.OrderTimestamp AS DATE) <= ld.max_date
    GROUP BY DATENAME(weekday, o.OrderTimestamp), DATEPART(weekday, o.OrderTimestamp)
    ORDER BY bucket_sort
""")

_CHART_MONTHLY_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date 
        FROM Orders 
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        (DATEDIFF(day, CAST(o.OrderTimestamp AS DATE), ld.max_date) / 7) AS weeks_ago,
        SUM(oi.LineTotal) AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    CROSS JOIN LatestDate ld
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) > DATEADD(day, -28, ld.max_date)
      AND CAST(o.OrderTimestamp AS DATE) <= ld.max_date
    GROUP BY (DATEDIFF(day, CAST(o.OrderTimestamp AS DATE), ld.max_date) / 7)
    ORDER BY weeks_ago DESC
""")

def get_sales_profit_chart(restaurant_id: str) -> dict:
    engine = get_engine()
    
    with engine.connect() as conn:
        hourly_df = pd.read_sql(_CHART_HOURLY_SQL, conn, params={"restaurant_id": restaurant_id})
        weekly_df = pd.read_sql(_CHART_WEEKLY_SQL, conn, params={"restaurant_id": restaurant_id})
        monthly_df = pd.read_sql(_CHART_MONTHLY_SQL, conn, params={"restaurant_id": restaurant_id})

    def ampm(hour):
        if hour == 0: return "12 AM"
        if hour < 12: return f"{hour} AM"
        if hour == 12: return "12 PM"
        return f"{hour-12} PM"

    hourly_list = []
    for _, r in hourly_df.iterrows():
        hourly_list.append({
            "label": ampm(int(r['bucket'])),
            "revenue": round(float(r['revenue']), 2),
            "profit": round(float(r['profit']), 2)
        })

    weekly_list = []
    for _, r in weekly_df.iterrows():
        weekly_list.append({
            "label": str(r['bucket_label'])[:3],
            "revenue": round(float(r['revenue']), 2),
            "profit": round(float(r['profit']), 2)
        })

    monthly_list = []
    week_idx = 1
    for _, r in monthly_df.iterrows():
        monthly_list.append({
            "label": f"Week {week_idx}",
            "revenue": round(float(r['revenue']), 2),
            "profit": round(float(r['profit']), 2)
        })
        week_idx += 1

    return {
        "hourly": hourly_list,
        "weekly": weekly_list,
        "monthly": monthly_list
    }


# ---------------------------------------------------------------------------
# 9. Menu Items Pricing
# ---------------------------------------------------------------------------
_MENU_PRICING_SQL = text("""
    SELECT ItemName, Price, Cost
    FROM MenuItems
    WHERE RestaurantId = :restaurant_id
""")

def get_menu_items_pricing(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(_MENU_PRICING_SQL, conn, params={"restaurant_id": restaurant_id})
    
    if df.empty:
        return {}
        
    prices = {}
    for _, r in df.iterrows():
        prices[r["ItemName"]] = {
            "price": float(r["Price"] or 0.0),
            "cost": float(r["Cost"] or 0.0)
        }
    return prices


# ---------------------------------------------------------------------------
# 10. Previous Period Dashboard KPIs
# ---------------------------------------------------------------------------
_PREVIOUS_DAY_KPIS_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date 
        FROM Orders 
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        SUM(oi.LineTotal) AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit,
        COUNT(DISTINCT o.OrderId) AS orders
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    CROSS JOIN LatestDate ld
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) = ld.max_date
""")

_PREVIOUS_WEEK_KPIS_SQL = text("""
    WITH LatestDate AS (
        SELECT MAX(CAST(OrderTimestamp AS DATE)) AS max_date 
        FROM Orders 
        WHERE RestaurantId = :restaurant_id
    )
    SELECT
        SUM(oi.LineTotal) AS revenue,
        SUM(oi.LineTotal - (mi.Cost * oi.Quantity)) AS profit,
        COUNT(DISTINCT o.OrderId) AS orders
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderId = o.OrderId
    JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId
    CROSS JOIN LatestDate ld
    WHERE o.RestaurantId = :restaurant_id
      AND CAST(o.OrderTimestamp AS DATE) > DATEADD(day, -7, ld.max_date)
      AND CAST(o.OrderTimestamp AS DATE) <= ld.max_date
""")

def get_previous_day_kpis(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            _PREVIOUS_DAY_KPIS_SQL, {"restaurant_id": restaurant_id}
        ).fetchone()

    if row is None or row[0] is None:
        return {"revenue": 0.0, "profit": 0.0, "orders": 0}

    return {
        "revenue": float(row[0]),
        "profit": float(row[1]),
        "orders": int(row[2])
    }

def get_previous_week_kpis(restaurant_id: str) -> dict:
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            _PREVIOUS_WEEK_KPIS_SQL, {"restaurant_id": restaurant_id}
        ).fetchone()

    if row is None or row[0] is None:
        return {"revenue": 0.0, "profit": 0.0, "orders": 0}

    return {
        "revenue": float(row[0]),
        "profit": float(row[1]),
        "orders": int(row[2])
    }
