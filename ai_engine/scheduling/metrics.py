import math
from datetime import date, datetime
from typing import List, Dict, Any
from .utils.normalization import normalize

SHIFTS = ["Morning", "Night"]

def calculate_required_staff_for_shift(
    shift: str,
    daily_demand: Dict[date, int],
    target_date: date,
    settings: Any = None,
    max_staff_per_shift: int = 12
) -> int:
    """Calculates the required staff count for a given shift based on daily demand and settings."""
    total_daily_demand = daily_demand.get(target_date, 0)
    
    has_settings = settings and not isinstance(settings, list)
    w_morning = getattr(settings, 'morning_shift_weight', 0.6) if has_settings else 0.6
    w_night = getattr(settings, 'night_shift_weight', 0.4) if has_settings else 0.4
    
    if not isinstance(w_morning, (int, float)) or isinstance(w_morning, bool):
        w_morning = 0.6
    if not isinstance(w_night, (int, float)) or isinstance(w_night, bool):
        w_night = 0.4
        
    total_weight = w_morning + w_night
    weight = w_morning if shift == "Morning" else w_night
    
    if total_weight == 0.0:
        demand_per_shift = 0.0
    else:
        demand_per_shift = total_daily_demand * weight / total_weight
        
    prod_ratio = 10.0
    if has_settings:
        if shift == "Morning":
            prod_ratio = getattr(settings, 'morning_productivity_ratio', None)
            if prod_ratio is None:
                prod_ratio = getattr(settings, 'productivity_ratio', 10.0)
        else: # Night / Evening
            prod_ratio = getattr(settings, 'night_productivity_ratio', None)
            if prod_ratio is None:
                prod_ratio = getattr(settings, 'productivity_ratio', 10.0)
    else:
        prod_ratio = 10.0
        
    if not isinstance(prod_ratio, (int, float)) or isinstance(prod_ratio, bool):
        prod_ratio = 10.0
        
    if prod_ratio == 0.0:
        prod_ratio = 10.0
        
    calculated_required_staff = math.ceil(demand_per_shift / prod_ratio)
    final_required_staff = min(max_staff_per_shift, calculated_required_staff)
    final_required_staff = max(2, final_required_staff)
    return final_required_staff

def calculate_weekly_required_shifts(
    dates: List[date],
    daily_demand: Dict[date, int],
    settings: Any = None
) -> int:
    """Calculates total required shifts for a week (Monday to Sunday)."""
    total = 0
    for d_date in dates:
        for shift_name in SHIFTS:
            total += calculate_required_staff_for_shift(shift_name, daily_demand, d_date, settings)
    return total

def calculate_available_capacity(employees: List[Dict[str, Any]]) -> int:
    """Calculates total weekly available capacity in shifts for all employees."""
    return sum(emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5)) for emp in employees)

def calculate_available_capacity_by_role(employees: List[Dict[str, Any]], role: str) -> int:
    """Calculates total capacity for a specific role."""
    role_normalized = normalize(role)
    return sum(
        emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
        for emp in employees
        if normalize(emp.get("Role", emp.get("role", ""))) == role_normalized
    )

def calculate_utilization(required_shifts: int, available_capacity: int) -> float:
    """Calculates capacity utilization percentage."""
    return round((required_shifts / max(1, available_capacity)) * 100, 1)

def calculate_coverage(assigned_shifts: int, required_shifts: int) -> float:
    """Calculates shift coverage percentage."""
    return round((assigned_shifts / max(1, required_shifts)) * 100, 1)
