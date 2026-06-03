from ortools.sat.python import cp_model
from datetime import datetime, date, time, timedelta
import math
from typing import List, Dict, Any, Tuple
from .schemas import ShiftAssignment
from .utils.normalization import normalize
from .metrics import (
    calculate_required_staff_for_shift,
    calculate_weekly_required_shifts,
    calculate_available_capacity,
    calculate_available_capacity_by_role,
    calculate_utilization
)

DEBUG_MODE = True

# Shift definitions
MORNING_SHIFT = "Morning"
NIGHT_SHIFT = "Night"
SHIFTS = [MORNING_SHIFT, NIGHT_SHIFT]
SHIFT_HOURS = {
    MORNING_SHIFT: {"start": time(8, 0), "end": time(16, 0)},
    NIGHT_SHIFT: {"start": time(16, 0), "end": time(0, 0)}
}

class SolverAssignment(dict):
    def __init__(self, employee_id: int, date_str: str, shift: str, hours: int, role: str, emp_id: int, date_obj: date, shift_type: str, is_override: bool):
        start_time = time(8, 0) if shift_type == "Morning" else time(16, 0)
        end_time = time(16, 0) if shift_type == "Morning" else time(0, 0)
        super().__init__(
            # Strict contract keys
            employee_id=employee_id,
            date=date_str,
            shift=shift,
            hours=hours,
            # Legacy keys for backward compatibility with Pydantic serialization in router
            EmpID=emp_id,
            Role=role,
            ShiftType=shift_type,
            Date=date_obj,
            StartTime=start_time,
            EndTime=end_time,
            Source="Manual" if is_override else "AI",
            IsOverridden=is_override,
            UpdatedAt=datetime.utcnow()
        )
        self.employee_id = employee_id
        self.date_str = date_str
        self.shift = shift
        self.hours = hours
        
        self.EmpID = emp_id
        self.Role = role
        self.ShiftType = shift_type
        self.Date = date_obj
        self.StartTime = start_time
        self.EndTime = end_time
        self.Source = "Manual" if is_override else "AI"
        self.IsOverridden = is_override
        self.UpdatedAt = datetime.utcnow()

    def __getattr__(self, name):
        if name in self:
            return self[name]
        raise AttributeError(f"'SolverAssignment' object has no attribute '{name}'")


def extract_constraints(payload: dict) -> dict:
    """Parses input scheduling payload and returns a structured dictionary of constraints."""
    employees = payload.get("employees", [])
    demand = payload.get("demand", {})
    overrides = payload.get("overrides", [])
    settings = payload.get("settings", None)
    
    # Calculate target date and week boundaries
    target_date = payload.get("target_date") or date.today()
    if isinstance(target_date, str):
        try:
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()
    elif isinstance(target_date, datetime):
        target_date = target_date.date()
        
    monday = target_date - timedelta(days=target_date.weekday())
    dates = [monday + timedelta(days=i) for i in range(7)]
    
    demand_per_day_shift = {}
    chef_reqs_per_shift = {}
    total_required_shifts = 0
    
    # Check demand format
    if isinstance(demand, list):
        # List payload format
        for d_date in dates:
            date_str = str(d_date)
            day_data = next((item for item in demand if str(item.get("date")) == date_str), None)
            demand_per_day_shift[date_str] = {}
            chef_reqs_per_shift[date_str] = {}
            for shift_name in SHIFTS:
                req_chef = 0
                req_emp = 0
                if day_data:
                    shift_info = day_data.get("shifts", {}).get(shift_name, {})
                    if not shift_info:
                        for k, v in day_data.get("shifts", {}).items():
                            if normalize(k) == normalize(shift_name):
                                shift_info = v
                                break
                    req_chef = shift_info.get("required_chefs", 0)
                    req_emp = shift_info.get("required_employees", 0)
                
                req_staff = req_chef + req_emp
                demand_per_day_shift[date_str][shift_name] = req_staff
                chef_reqs_per_shift[date_str][shift_name] = req_chef
                total_required_shifts += req_staff
    else:
        # Dict daily demand format (production)
        for d_date in dates:
            date_str = str(d_date)
            demand_per_day_shift[date_str] = {}
            chef_reqs_per_shift[date_str] = {}
            for shift_name in SHIFTS:
                total_daily_demand = demand.get(d_date, 0) if isinstance(demand, dict) else 0
                
                has_settings = settings and not isinstance(settings, list)
                w_morning = getattr(settings, 'morning_shift_weight', 0.6) if has_settings else 0.6
                w_night = getattr(settings, 'night_shift_weight', 0.4) if has_settings else 0.4
                
                if not isinstance(w_morning, (int, float)) or isinstance(w_morning, bool):
                    w_morning = 0.6
                if not isinstance(w_night, (int, float)) or isinstance(w_night, bool):
                    w_night = 0.4
                    
                total_weight = w_morning + w_night
                weight = w_morning if shift_name == MORNING_SHIFT else w_night
                
                if total_weight == 0.0:
                    demand_per_shift = 0.0
                else:
                    demand_per_shift = total_daily_demand * weight / total_weight
                    
                prod_ratio = 10.0
                if has_settings:
                    if shift_name == MORNING_SHIFT:
                        prod_ratio = getattr(settings, 'morning_productivity_ratio', None)
                        if prod_ratio is None:
                            prod_ratio = getattr(settings, 'productivity_ratio', 10.0)
                    else:
                        prod_ratio = getattr(settings, 'night_productivity_ratio', None)
                        if prod_ratio is None:
                            prod_ratio = getattr(settings, 'productivity_ratio', 10.0)
                
                if not isinstance(prod_ratio, (int, float)) or isinstance(prod_ratio, bool) or prod_ratio == 0.0:
                    prod_ratio = 10.0
                    
                calculated_required_staff = math.ceil(demand_per_shift / prod_ratio)
                req_staff = max(2, min(12, calculated_required_staff))
                req_chef = math.ceil(0.25 * req_staff)
                
                demand_per_day_shift[date_str][shift_name] = req_staff
                chef_reqs_per_shift[date_str][shift_name] = req_chef
                total_required_shifts += req_staff

    number_of_employees = len(employees)
    estimated_total_capacity = 0
    max_shifts_per_employee_per_week = {}
    
    for emp in employees:
        emp_id = emp.get("EmpID", emp.get("id"))
        w_days = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
        max_shifts_per_employee_per_week[str(emp_id)] = w_days
        estimated_total_capacity += w_days
        
    return {
        "demand_constraints": {
            "total_required_shifts": total_required_shifts,
            "demand_per_day_shift": demand_per_day_shift
        },
        "capacity_constraints": {
            "number_of_employees": number_of_employees,
            "estimated_total_capacity": estimated_total_capacity,
            "max_shifts_per_employee_per_week": max_shifts_per_employee_per_week
        },
        "role_constraints": {
            "chef_requirements_per_shift": chef_reqs_per_shift,
            "role_based_rules": [
                "Each shift should ideally satisfy role ratio targets: 25% Chefs and 75% regular Employees.",
                "Chefs count on each shift should meet or exceed chef requirement targets to avoid chef shortages."
            ]
        },
        "hard_constraints": [
            "An employee cannot be assigned to more than 1 shift per day.",
            "Assignments are blocked for shifts where the employee is unavailable.",
            "Total weekly shifts assigned to an employee cannot exceed their WorkingDaysPerWeek limit."
        ],
        "soft_constraints": [
            "Minimize uncovered shifts relative to demand (uncovered slack penalty: 10,000).",
            "Minimize role deficits for chefs and regular employees (role deficit penalty: 1,000; chef deficit weighted 5x).",
            "Minimize shift assignment balance deviations between Morning and Night (deviation penalty: 500).",
            "Minimize workload deviation from the average weekly workload (workload deviation penalty: 100).",
            "Minimize clopening violations (working Night shift then Morning shift next day; clopening penalty: 10).",
            "Minimize shift preference violations (preference violation penalty: 10)."
        ]
    }


def log_solver_debug(state: dict):
    """Prints a structured debug/observability dashboard of the solver execution state using ASCII only."""
    print("\n" + "="*80)
    print("      SCHEDULER DIAGNOSTIC & OBSERVABILITY DASHBOARD  ")
    print("="*80)
    
    employees = state.get("employees", [])
    assignments = state.get("assignments", [])
    required_shifts = state.get("required_shifts", {})
    dates = state.get("dates", [])
    violations = state.get("violations", {})
    metrics = state.get("metrics", {})
    
    # 1. WORKFORCE SUMMARY
    num_employees = len(employees)
    chefs = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "chef"]
    regular_emps = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "employee"]
    
    print("\n[1] WORKFORCE SUMMARY")
    print(f"  * Total Employees      : {num_employees}")
    print(f"  * Chefs                : {len(chefs)}")
    print(f"  * Regular Employees    : {len(regular_emps)}")
    
    # 2. CAPACITY SUMMARY
    estimated_capacity = metrics.get("total_available_capacity", 0)
    chef_capacity = calculate_available_capacity_by_role(employees, "chef")
    regular_emp_capacity = calculate_available_capacity_by_role(employees, "employee")
    
    print("\n[2] CAPACITY SUMMARY")
    print(f"  * Total Capacity       : {estimated_capacity} shifts")
    print(f"  * Chef Capacity        : {chef_capacity} shifts")
    print(f"  * Regular Emp Capacity : {regular_emp_capacity} shifts")
    
    # 3. COVERAGE SUMMARY
    total_demand = metrics.get("total_required_shifts", 0)
    covered_shifts = metrics.get("covered", len(assignments))
    uncovered_shifts = metrics.get("uncovered", total_demand - covered_shifts)
    coverage_rate = metrics.get("coverage_rate", 0.0)
    
    print("\n[3] COVERAGE SUMMARY")
    print(f"  * Required Shifts      : {total_demand}")
    print(f"  * Covered Shifts       : {covered_shifts}")
    print(f"  * Uncovered Shifts     : {uncovered_shifts}")
    print(f"  * Coverage Rate        : {coverage_rate}%")
    
    # 4. WORKLOAD DISTRIBUTION
    print("\n[4] WORKLOAD DISTRIBUTION")
    employee_shifts = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    for a in assignments:
        emp_id = a.employee_id
        if emp_id in employee_shifts:
            employee_shifts[emp_id] += 1
            
    w_vals = list(employee_shifts.values())
    max_w = max(w_vals) if w_vals else 0
    min_w = min(w_vals) if w_vals else 0
    imbalance = max_w - min_w
    avg_w = sum(w_vals) / max(1, num_employees)
    
    print(f"  {'Employee ID':<12} | {'Role':<10} | {'Assigned Shifts':<15} | {'Weekly Limit':<12}")
    print("  " + "-"*55)
    for emp in employees:
        emp_id = emp.get("EmpID", emp.get("id"))
        role = emp.get("Role", emp.get("role", "employee"))
        w_limit = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
        assigned = employee_shifts.get(emp_id, 0)
        print(f"  {emp_id:<12} | {role:<10} | {assigned:<15} | {w_limit:<12}")
    print(f"  * Workload Range (Imbalance): {imbalance} shifts (Max: {max_w}, Min: {min_w}, Avg: {avg_w:.2f})")
    
    # 5. OFF-DAY DISTRIBUTION
    print("\n[5] OFF-DAY DISTRIBUTION")
    off_counts = {}
    for d_idx, d_date in enumerate(dates):
        working_count = sum(1 for a in assignments if str(a.Date) == str(d_date))
        off_counts[d_date] = num_employees - working_count
        
    print(f"  {'Date':<12} | {'Day':<10} | {'Off Employees':<15}")
    print("  " + "-"*40)
    for d_date in dates:
        print(f"  {str(d_date):<12} | {d_date.strftime('%A'):<10} | {off_counts[d_date]:<15}")
    
    # 6. CHEF ALLOCATION SUMMARY
    print("\n[6] CHEF ALLOCATION SUMMARY")
    chef_ids = {emp.get("EmpID", emp.get("id")) for emp in chefs}
    total_chef_req = 0
    total_chef_assigned = 0
    
    print(f"  {'Date':<12} | {'Shift':<8} | {'Required Chefs':<15} | {'Assigned Chefs':<15}")
    print("  " + "-"*55)
    for d_idx, d_date in enumerate(dates):
        for s_name in SHIFTS:
            req_c = state.get("chef_requirements", {}).get((d_idx, SHIFTS.index(s_name)), 0)
            total_chef_req += req_c
            
            assigned_c = sum(1 for a in assignments if str(a.Date) == str(d_date) and a.ShiftType == s_name and a.employee_id in chef_ids)
            total_chef_assigned += assigned_c
            print(f"  {str(d_date):<12} | {s_name:<8} | {req_c:<15} | {assigned_c:<15}")
    print(f"  * Total Chefs Required: {total_chef_req}")
    print(f"  * Total Chefs Assigned: {total_chef_assigned}")
    
    print("\n[E] ROOT CAUSE SUMMARY")
    reasons = []
    gap = total_demand - estimated_capacity
    if gap > 0:
        reasons.append(f"Capacity Deficit: Required shifts ({total_demand}) exceed total available employee capacity ({estimated_capacity}) by {gap} shifts.")
    
    chef_deficit_count = violations.get('chef_deficit', 0)
    if chef_deficit_count > 0:
        reasons.append(f"Role Constraint Target Shortage: {chef_deficit_count} chef target deficits detected. There may not be enough chef capacity or availability to cover role ratio requirements.")
        
    if imbalance > 1:
        reasons.append(f"Workload Imbalance: Assignment distribution has a range of {imbalance} shifts. Some employees are scheduled for more shifts than others.")
        
    if not reasons:
        reasons.append("Schedule generated successfully with no significant issues or gaps.")
        
    for r in reasons:
        print(f"  * {r}")
        
    print("\n" + "="*80 + "\n")


class ScheduleSolver:
    def __init__(self, productivity_ratio: float = 30.0, max_staff_per_shift: int = 12):
        self.productivity_ratio = productivity_ratio
        self.max_staff_per_shift = max_staff_per_shift
        self.clopening_violations_count = 0
        self.skipped_overrides = []

    def _calculate_required_staff(self, shift: str, daily_demand: Dict[date, int], target_date: date, settings=None) -> int:
        return calculate_required_staff_for_shift(shift, daily_demand, target_date, settings, self.max_staff_per_shift)

    def solve(self, employees: List[Dict[str, Any]], daily_demand: Dict[date, int], target_date: date, overrides: List[Dict[str, Any]] = None, settings = None) -> Dict[str, Any]:
        self.clopening_violations_count = 0
        self.skipped_overrides = []
        if overrides is None:
            overrides = []

        if DEBUG_MODE:
            payload = {
                "employees": employees,
                "demand": daily_demand,
                "overrides": overrides,
                "settings": settings,
                "target_date": target_date
            }
            try:
                extract_constraints(payload)
            except Exception as ex:
                print(f"DEBUG constraints extraction warning: {ex}")

        # Calculate Monday to Sunday dates
        monday = target_date - timedelta(days=target_date.weekday())
        dates = [monday + timedelta(days=i) for i in range(7)]

        num_employees = len(employees)
        chefs = [i for i, emp in enumerate(employees) if normalize(emp.get("Role", emp.get("role"))) == "chef"]
        regular_emps = [i for i, emp in enumerate(employees) if normalize(emp.get("Role", emp.get("role"))) == "employee"]
        
        # Calculate capacities and requirements using metrics.py
        total_available_capacity = calculate_available_capacity(employees)

        # Unify list vs dict demand input
        shift_reqs = {}
        shift_chef_reqs = {}
        shift_emp_reqs = {}
        
        if isinstance(daily_demand, list):
            # List payload format (from solve_from_payload)
            for d_idx, d_date in enumerate(dates):
                day_data = next((item for item in daily_demand if str(item.get("date")) == str(d_date)), None)
                for s_idx, shift_name in enumerate(SHIFTS):
                    req_chef = 0
                    req_emp = 0
                    if day_data:
                        shift_info = day_data.get("shifts", {}).get(shift_name, {})
                        if not shift_info:
                            for k, v in day_data.get("shifts", {}).items():
                                if normalize(k) == normalize(shift_name):
                                    shift_info = v
                                    break
                        req_chef = shift_info.get("required_chefs", 0)
                        req_emp = shift_info.get("required_employees", 0)
                    shift_chef_reqs[(d_idx, s_idx)] = req_chef
                    shift_emp_reqs[(d_idx, s_idx)] = req_emp
                    shift_reqs[(d_idx, s_idx)] = req_chef + req_emp
        else:
            # Dict daily demand format (production)
            for d_idx, d_date in enumerate(dates):
                for s_idx, shift_name in enumerate(SHIFTS):
                    req_staff = self._calculate_required_staff(shift_name, daily_demand, d_date, settings)
                    req_chef = math.ceil(0.25 * req_staff)
                    req_emp = math.ceil(0.75 * req_staff)
                    shift_chef_reqs[(d_idx, s_idx)] = req_chef
                    shift_emp_reqs[(d_idx, s_idx)] = req_emp
                    shift_reqs[(d_idx, s_idx)] = req_staff

        total_required_shifts = sum(shift_reqs.values())

        model = cp_model.CpModel()
        
        # 1. Variables (Full Domain Setup)
        x = {}
        for e in range(num_employees):
            emp = employees[e]
            emp_shift = normalize(emp.get("Shif", emp.get("preferred_shift")))
            
            # Build availability mapping
            avail_map = None
            raw_avail = emp.get("availability")
            if raw_avail is not None:
                avail_map = {}
                if isinstance(raw_avail, dict):
                    for k, v in raw_avail.items():
                        avail_map[str(k)] = [normalize(s) for s in v]
                elif isinstance(raw_avail, list):
                    for item in raw_avail:
                        if isinstance(item, dict) and "date" in item:
                            avail_map[str(item["date"])] = [normalize(s) for s in item.get("shifts", [])]

            for d_idx, d_date in enumerate(dates):
                for s_idx, s_name in enumerate(SHIFTS):
                    norm_s = normalize(s_name)
                    # Variable ALWAYS created
                    x[(e, d_idx, s_idx)] = model.NewBoolVar(f'shift_e{e}_d{d_idx}_s{s_idx}')
                    
                    # Availability constraint checks
                    is_available = True
                    if emp_shift in ["morning", "night"] and emp_shift != norm_s:
                        is_available = False
                    if avail_map is not None:
                        allowed_shifts = avail_map.get(str(d_date))
                        if allowed_shifts is None:
                            is_available = False
                        elif norm_s not in allowed_shifts:
                            is_available = False
                            
                    if not is_available:
                        # Hard constraint blocking unavailable shift
                        model.Add(x[(e, d_idx, s_idx)] == 0)

        # 2. Deficit / Shortage Variables (Soft constraints slacks)
        uncovered = {}
        chef_deficit = {}
        emp_deficit = {}
        balance_dev = {}
        
        # OFF Day Setup
        off = {}
        for e in range(num_employees):
            for d_idx in range(7):
                off[(e, d_idx)] = model.NewBoolVar(f"off_e{e}_d{d_idx}")
                model.Add(off[(e, d_idx)] + sum(x[(e, d_idx, s_idx)] for s_idx in range(len(SHIFTS))) == 1)

        # OFF Day Spreading / Imbalance
        O_max = model.NewIntVar(0, num_employees, "O_max")
        O_min = model.NewIntVar(0, num_employees, "O_min")
        off_imbalance = model.NewIntVar(0, num_employees, "off_imbalance")
        for d_idx in range(7):
            day_off_sum = sum(off[(e, d_idx)] for e in range(num_employees))
            model.Add(day_off_sum <= O_max)
            model.Add(day_off_sum >= O_min)
        model.Add(O_max - O_min == off_imbalance)

        # 6-Shift Limit OFF Day Requirement
        shift_limit_deficit_vars = []
        for e in range(num_employees):
            emp = employees[e]
            w_days = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
            if w_days == 6:
                shift_limit_deficit_e = model.NewIntVar(0, 6, f"shift_limit_deficit_e{e}")
                model.Add(sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS))) + shift_limit_deficit_e == 6)
                shift_limit_deficit_vars.append(shift_limit_deficit_e)

        # Workload Range / Variance Setup
        max_workload = model.NewIntVar(0, 7, "max_workload")
        min_workload = model.NewIntVar(0, 7, "min_workload")
        workload_range = model.NewIntVar(0, 7, "workload_range")
        for e in range(num_employees):
            workload_e = sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS)))
            model.Add(workload_e <= max_workload)
            model.Add(workload_e >= min_workload)
        model.Add(max_workload - min_workload == workload_range)

        # Shift Diversity Setup
        monotonous_morning = {}
        monotonous_night = {}
        for e in range(num_employees):
            monotonous_morning[e] = model.NewBoolVar(f"mon_m_{e}")
            monotonous_night[e] = model.NewBoolVar(f"mon_n_{e}")
            morning_shifts_e = sum(x[(e, d_idx, 0)] for d_idx in range(7))
            night_shifts_e = sum(x[(e, d_idx, 1)] for d_idx in range(7))
            model.Add(monotonous_morning[e] * 7 >= morning_shifts_e - 1 - 7 * night_shifts_e)
            model.Add(monotonous_night[e] * 7 >= night_shifts_e - 1 - 7 * morning_shifts_e)

        for d_idx in range(7):
            balance_dev[d_idx] = model.NewIntVar(0, max(1, num_employees), f"balance_dev_d{d_idx}")
            morning_staff_count = sum(x[(e, d_idx, 0)] for e in range(num_employees))
            evening_staff_count = sum(x[(e, d_idx, 1)] for e in range(num_employees))
            model.Add(morning_staff_count - evening_staff_count <= 2 + balance_dev[d_idx])
            model.Add(evening_staff_count - morning_staff_count <= 2 + balance_dev[d_idx])

            for s_idx in range(len(SHIFTS)):
                req_staff = shift_reqs[(d_idx, s_idx)]
                target_chefs = shift_chef_reqs[(d_idx, s_idx)]
                target_emps = shift_emp_reqs[(d_idx, s_idx)]

                uncovered[(d_idx, s_idx)] = model.NewIntVar(0, max(0, req_staff), f'uncovered_d{d_idx}_s{s_idx}')
                chef_deficit[(d_idx, s_idx)] = model.NewIntVar(0, max(0, target_chefs), f'chef_deficit_d{d_idx}_s{s_idx}')
                emp_deficit[(d_idx, s_idx)] = model.NewIntVar(0, max(0, target_emps), f'emp_deficit_d{d_idx}_s{s_idx}')

                # Soft Coverage demand constraints
                total_staff_assigned = sum(x[(e, d_idx, s_idx)] for e in range(num_employees))
                model.Add(total_staff_assigned + uncovered[(d_idx, s_idx)] == req_staff)

                # Soft Role Deficits
                chef_count = sum(x[(c, d_idx, s_idx)] for c in chefs)
                model.Add(chef_count + chef_deficit[(d_idx, s_idx)] >= target_chefs)

                employee_count = sum(x[(r, d_idx, s_idx)] for r in regular_emps)
                model.Add(employee_count + emp_deficit[(d_idx, s_idx)] >= target_emps)

        # 3. Hard Workload Constraints (Minimum Only)
        # Max 1 shift per day per employee
        for e in range(num_employees):
            for d_idx in range(7):
                model.Add(sum(x[(e, d_idx, s_idx)] for s_idx in range(len(SHIFTS))) <= 1)

        # Hard limit: Max working days per week = WorkingDaysPerWeek shifts
        for e in range(num_employees):
            emp = employees[e]
            w_days = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
            model.Add(sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS))) <= w_days)

        # 4. Soft Overwork Model
        overwork = {}
        for e in range(num_employees):
            emp = employees[e]
            w_days = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
            contractual_hours = w_days * 8
            assigned_hours = sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS))) * 8
            
            overwork[e] = model.NewIntVar(0, 48, f"overwork_e{e}")
            model.Add(assigned_hours <= contractual_hours + overwork[e])

        # 5. Soft Constraints & Preferences (Clopening)
        clopening_violations = []
        for e in range(num_employees):
            for d_idx in range(6):
                viol = model.NewBoolVar(f'clopen_viol_e{e}_d{d_idx}')
                model.Add(x[(e, d_idx, 1)] + x[(e, d_idx + 1, 0)] >= 2 * viol)
                model.Add(x[(e, d_idx, 1)] + x[(e, d_idx + 1, 0)] <= 1 + viol)
                clopening_violations.append(viol)

        # Preferences Penalty Setup
        preference_violations = []
        for e, emp in enumerate(employees):
            pref = emp.get("Shif", emp.get("preferred_shift"))
            if pref:
                norm_pref = normalize(pref)
                for d_idx in range(7):
                    for s_idx, shift_name in enumerate(SHIFTS):
                        if norm_pref in [normalize(s) for s in SHIFTS] and norm_pref != normalize(shift_name):
                            preference_violations.append(x[(e, d_idx, s_idx)])

        # Enforce Manual Overrides (Soft constraint with penalty)
        emp_id_to_idx = {emp["EmpID"]: idx for idx, emp in enumerate(employees) if "EmpID" in emp}
        if not emp_id_to_idx:
            emp_id_to_idx = {emp["id"]: idx for idx, emp in enumerate(employees) if "id" in emp}
            
        date_to_idx = {d_date: idx for idx, d_date in enumerate(dates)}
        
        override_keys = set()
        override_penalties = []
        override_viol_vars = {}
        
        for o in overrides:
            o_emp_id = o.get("EmpID")
            o_day = o.get("Day")
            if isinstance(o_day, datetime):
                o_day = o_day.date()
            o_shift = normalize(o.get("ShiftType"))
            
            e_idx = emp_id_to_idx.get(o_emp_id)
            d_idx = date_to_idx.get(o_day)
            
            s_idx = None
            for idx, s in enumerate(SHIFTS):
                if normalize(s) == o_shift:
                    s_idx = idx
                    break
                    
            if e_idx is not None and d_idx is not None and s_idx is not None:
                viol_var = model.NewBoolVar(f"override_viol_e{e_idx}_d{d_idx}_s{s_idx}")
                model.Add(x[(e_idx, d_idx, s_idx)] + viol_var >= 1)
                override_penalties.append(viol_var)
                override_viol_vars[(o_emp_id, o_day, o_shift)] = (viol_var, o.get("ScheduleID"))
                override_keys.add((o_emp_id, o_day, o_shift))
            else:
                reason = "employee or day not in week"
                self.skipped_overrides.append({
                    "employee_id": o_emp_id,
                    "override_id": o.get("ScheduleID"),
                    "reason": reason
                })

        # Workload Fairness (deviation from average workload)
        avg_workload = total_required_shifts / max(1, num_employees)
        avg_workload_int = int(round(avg_workload))
        
        workload_deviation = {}
        for e in range(num_employees):
            emp = employees[e]
            workload_deviation[e] = model.NewIntVar(0, max(14, avg_workload_int), f"wd_{e}")
            workload_e = sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS)))
            model.Add(workload_deviation[e] >= workload_e - avg_workload_int)
            model.Add(workload_deviation[e] >= avg_workload_int - workload_e)

        # 5. Objective Function Optimization
        total_override_violations = sum(override_penalties)
        total_uncovered = sum(uncovered[(d_idx, s_idx)] for d_idx in range(7) for s_idx in range(2))
        total_chef_deficit = sum(chef_deficit[(d_idx, s_idx)] for d_idx in range(7) for s_idx in range(2))
        total_balance_dev = sum(balance_dev[d_idx] for d_idx in range(7))
        total_workload_deviation = sum(workload_deviation[e] for e in range(num_employees))
        total_clopening_violations = sum(clopening_violations)
        total_pref_violations = sum(preference_violations)
        total_off_demand_penalty = sum(off[(e, d_idx)] * sum(shift_reqs[(d_idx, s_idx)] for s_idx in range(2)) for e in range(num_employees) for d_idx in range(7))
        total_shift_limit_deficit = sum(shift_limit_deficit_vars) if shift_limit_deficit_vars else 0
        total_monotonous = sum(monotonous_morning[e] + monotonous_night[e] for e in range(num_employees))

        model.Minimize(
            100_000_000 * total_override_violations
            + 10_000_000 * total_uncovered
            + 1_000_000 * total_chef_deficit
            + 10_000 * workload_range
            + 1_000 * total_workload_deviation
            + 500 * total_balance_dev
            + 1_000 * off_imbalance
            + 100 * total_shift_limit_deficit
            + 10 * total_off_demand_penalty
            + 10 * (total_clopening_violations + total_pref_violations)
            + 1 * total_monotonous
        )
        
        # 6. Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        status = solver.Solve(model)
        
        assignments = []
        clopening_count = 0
        uncovered_shifts_count = total_required_shifts
        overwork_count = 0
        status_str = "partial_success"
        message = "Solver failed to find a feasible solution. Returning overrides-only fallback."

        # Verify which overrides were violated
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            clopening_count = int(sum(solver.Value(viol) for viol in clopening_violations))
            self.clopening_violations_count = clopening_count
            
            for key, (viol_var, schedule_id) in override_viol_vars.items():
                if solver.Value(viol_var) == 1:
                    self.skipped_overrides.append({
                        "employee_id": key[0],
                        "override_id": schedule_id,
                        "reason": "conflict with other hard constraints (availability/max workload)"
                    })

            for e, emp in enumerate(employees):
                emp_id = emp.get("EmpID", emp.get("id"))
                role = normalize(emp.get("Role", emp.get("role", "employee")))
                for d_idx, d_date in enumerate(dates):
                    for s_idx, shift_name in enumerate(SHIFTS):
                        if solver.Value(x[(e, d_idx, s_idx)]) == 1:
                            is_override = (emp_id, d_date, normalize(shift_name)) in override_keys
                            if is_override:
                                viol_var, _ = override_viol_vars.get((emp_id, d_date, normalize(shift_name)), (None, None))
                                if viol_var is not None and solver.Value(viol_var) == 1:
                                    is_override = False
                                    
                            shift_name_norm = "morning" if shift_name == MORNING_SHIFT else "night"
                            assignments.append(
                                SolverAssignment(
                                    employee_id=emp_id,
                                    date_str=str(d_date),
                                    shift=shift_name_norm,
                                    hours=8,
                                    role=role,
                                    emp_id=emp_id,
                                    date_obj=d_date,
                                    shift_type=shift_name,
                                    is_override=is_override
                                )
                            )
            
            uncovered_shifts_count = int(sum(solver.Value(uncovered[(d_idx, s_idx)]) for d_idx in range(7) for s_idx in range(2)))
            overwork_count = int(sum(1 for e in range(num_employees) if solver.Value(overwork[e]) > 0))
            off_imbalance_val = int(solver.Value(off_imbalance))
            
            # Post-solve workload metrics calculation
            workloads = []
            shift_diversity_violations_count = 0
            for e in range(num_employees):
                w_morning = int(solver.Value(sum(x[(e, d, 0)] for d in range(7))))
                w_night = int(solver.Value(sum(x[(e, d, 1)] for d in range(7))))
                w_total = w_morning + w_night
                workloads.append(w_total)
                if (solver.Value(monotonous_morning[e]) == 1) or (solver.Value(monotonous_night[e]) == 1):
                    shift_diversity_violations_count += 1
                    
            max_w = max(workloads) if workloads else 0
            min_w = min(workloads) if workloads else 0
            avg_w = sum(workloads) / max(1, num_employees)
            
            # Off day metrics
            total_off_days = int(sum(solver.Value(off[(e, d)]) for e in range(num_employees) for d in range(7)))
            
            # Find low demand days off count
            day_demands = [sum(shift_reqs[(d, s)] for s in range(2)) for d in range(7)]
            min_demand_val = min(day_demands) if day_demands else 0
            low_demand_days = [d for d in range(7) if day_demands[d] == min_demand_val]
            off_days_on_low_demand = int(sum(solver.Value(off[(e, d)]) for e in range(num_employees) for d in low_demand_days))
            
            # Eligible 6-shift employees
            eligible_for_six_shift_count = 0
            for e in range(num_employees):
                emp = employees[e]
                w_days = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
                if w_days == 6 and workloads[e] == 6:
                    eligible_for_six_shift_count += 1
            
            # Chef metrics
            chef_assigned_count = sum(1 for a in assignments if normalize(a.Role) == "chef")
            chef_required_total = sum(shift_chef_reqs.values())
            chef_coverage_rate_val = round((chef_assigned_count / max(1, chef_required_total)) * 100, 1)
            
            # Regular employee metrics
            regular_assigned_count = sum(1 for a in assignments if normalize(a.Role) == "employee")
            regular_required_total = sum(shift_emp_reqs.values())
            regular_coverage_rate_val = round((regular_assigned_count / max(1, regular_required_total)) * 100, 1)
                        
            if uncovered_shifts_count > 0:
                status_str = "partial_success"
                message = f"Understaffed: Assigned available employees, but {uncovered_shifts_count} more shifts are needed to cover demand."
            else:
                status_str = "success"
                message = "Schedule generated successfully for the week."
        else:
            # Solver failed completely: construct partial schedule using overrides only
            for o in overrides:
                o_emp = next((e for e in employees if e.get("EmpID", e.get("id")) == o.get("EmpID")), None)
                if o_emp:
                    o_day = o.get("Day")
                    if isinstance(o_day, datetime):
                        o_day = o_day.date()
                    o_shift = o.get("ShiftType")
                    o_shift_norm = "morning" if normalize(o_shift) == "morning" else "night"
                    assignments.append(
                        SolverAssignment(
                            employee_id=o.get("EmpID"),
                            date_str=str(o_day),
                            shift=o_shift_norm,
                            hours=8,
                            role=normalize(o_emp.get("Role", o_emp.get("role", "employee"))),
                            emp_id=o.get("EmpID"),
                            date_obj=o_day,
                            shift_type="Morning" if o_shift_norm == "morning" else "Night",
                            is_override=True
                        )
                    )
            uncovered_shifts_count = max(0, total_required_shifts - len(assignments))
            status_str = "partial_success"
            message = f"Solver was unable to run. Returning {len(assignments)} overrides as fallback."
            
            # Fallback metrics
            off_imbalance_val = 0
            max_w = 0
            min_w = 0
            avg_w = 0.0
            shift_diversity_violations_count = 0
            total_off_days = 7 * num_employees - len(assignments)
            off_days_on_low_demand = 0
            eligible_for_six_shift_count = 0
            chef_coverage_rate_val = 0.0
            regular_coverage_rate_val = 0.0

        # Compute utilization and metrics
        covered_count = len(assignments)
        coverage_rate_val = round((covered_count / max(1, total_required_shifts)) * 100, 1)

        by_shift = {
            "morning": [a for a in assignments if a.shift == "morning"],
            "night": [a for a in assignments if a.shift == "night"]
        }

        warnings = []
        if clopening_count > 0:
            warnings.append(f"Clopening violations detected: {clopening_count}")
        if uncovered_shifts_count > 0:
            warnings.append(f"Understaffing detected: {uncovered_shifts_count} shifts missing.")
        if overwork_count > 0:
            warnings.append(f"Overwork detected: {overwork_count} employees working overtime.")

        capacity_utilization_pct = calculate_utilization(total_required_shifts, total_available_capacity)

        # Build structured metrics payload
        llm_metrics_payload = {
            "workforce_metrics": {
                "total_employees": num_employees,
                "total_chefs": len(chefs),
                "total_regular_employees": len(regular_emps)
            },
            "capacity_metrics": {
                "total_available_capacity": total_available_capacity,
                "chef_capacity": calculate_available_capacity_by_role(employees, "chef"),
                "regular_employee_capacity": calculate_available_capacity_by_role(employees, "employee")
            },
            "coverage_metrics": {
                "covered_shifts": covered_count,
                "uncovered_shifts": uncovered_shifts_count,
                "coverage_rate": coverage_rate_val,
                "chef_coverage_rate": chef_coverage_rate_val,
                "regular_employee_coverage_rate": regular_coverage_rate_val
            },
            "workload_metrics": {
                "average_workload": round(avg_w, 2),
                "max_workload": max_w,
                "min_workload": min_w,
                "workload_variance": max_w - min_w,
                "shift_diversity_violations": shift_diversity_violations_count
            },
            "demand_metrics": {
                "total_required_shifts": total_required_shifts,
                "total_required_chefs": sum(shift_chef_reqs.values()),
                "total_required_regular_employees": sum(shift_emp_reqs.values())
            },
            "off_day_metrics": {
                "total_off_days_assigned": total_off_days,
                "off_days_on_low_demand_dates": off_days_on_low_demand,
                "off_day_imbalance": off_imbalance_val,
                "eligible_for_six_shift_off_day": eligible_for_six_shift_count
            }
        }

        if DEBUG_MODE:
            chef_deficit_total = 0
            if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                chef_deficit_total = int(sum(solver.Value(chef_deficit[(d_idx, s_idx)]) for d_idx in range(7) for s_idx in range(2)))
            else:
                chef_deficit_total = int(sum(shift_chef_reqs[(d_idx, s_idx)] for d_idx in range(7) for s_idx in range(2)))
                
            state = {
                "employees": employees,
                "dates": dates,
                "required_shifts": shift_reqs,
                "chef_requirements": shift_chef_reqs,
                "assignments": assignments,
                "metrics": {
                    "total_demand": total_required_shifts,
                    "total_required_shifts": total_required_shifts,
                    "total_available_capacity": total_available_capacity,
                    "covered": covered_count,
                    "uncovered": uncovered_shifts_count,
                    "coverage_rate": coverage_rate_val,
                },
                "violations": {
                    "uncovered_shifts": uncovered_shifts_count,
                    "overwork_count": overwork_count,
                    "chef_deficit": chef_deficit_total,
                    "clopening_count": clopening_count
                },
                "skipped_overrides": self.skipped_overrides,
                "warnings": warnings
            }
            try:
                log_solver_debug(state)
            except Exception as ex:
                print(f"DEBUG logging warning: {ex}")

        try:
            log_solver_debug(state)
        except Exception:
            pass

        return {
            "status": status_str,
            "assignments": assignments,
            "metrics": {
                "total_demand": total_required_shifts,
                "covered": covered_count,
                "uncovered": uncovered_shifts_count,
                "coverage_rate": coverage_rate_val,
                # Legacy keys for backward compatibility
                "total_required_shifts": total_required_shifts,
                "total_available_capacity": total_available_capacity,
                "missing_shifts": uncovered_shifts_count,
                "utilization_percentage": capacity_utilization_pct,
                # Structured metrics payload for LLM and response
                "llm_metrics_payload": llm_metrics_payload,
                "workforce_metrics": llm_metrics_payload["workforce_metrics"],
                "capacity_metrics": llm_metrics_payload["capacity_metrics"],
                "coverage_metrics": llm_metrics_payload["coverage_metrics"],
                "workload_metrics": llm_metrics_payload["workload_metrics"],
                "demand_metrics": llm_metrics_payload["demand_metrics"],
                "off_day_metrics": llm_metrics_payload["off_day_metrics"]
            },
            "by_shift": by_shift,
            "violations": {
                "overwork_count": overwork_count,
                "uncovered_shifts": uncovered_shifts_count,
                "clopening_count": clopening_count,
                "understaffing_count": uncovered_shifts_count
            },
            "warnings": warnings,
            "message": message,
            "skipped_overrides": self.skipped_overrides
        }

    def solve_from_payload(self, employees_payload: List[Dict[str, Any]], demand_payload: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Internal debugging/testing method. Processes raw synthetic JSON inputs directly."""
        # Normalize employees to solver internal schema format
        converted_employees = []
        for emp in employees_payload:
            avail = []
            for av in emp.get("availability", []):
                avail.append({
                    "date": av.get("date"),
                    "shifts": av.get("shifts", [])
                })
            converted_employees.append({
                "EmpID": emp.get("id"),
                "Role": emp.get("role"),
                "WorkingDaysPerWeek": emp.get("max_shifts_per_week", 5),
                "Shif": emp.get("preferred_shift"),
                "availability": avail,
                "FullName": f"Employee {emp.get('id')}"
            })

        # Calculate target_date from first demand date, default to today
        target_date = date.today()
        if demand_payload and len(demand_payload) > 0:
            date_str = demand_payload[0].get("date")
            if date_str:
                try:
                    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    pass

        # Run solver
        solver_output = self.solve(converted_employees, demand_payload, target_date)
        
        # Format return to keep backward compatibility with test client solve response
        assignments_out = []
        for a in solver_output["assignments"]:
            assignments_out.append({
                "employee_id": a.EmpID,
                "role": a.Role,
                "date": str(a.Date),
                "shift": a.ShiftType
            })
            
        metrics = solver_output["metrics"]
        violations = solver_output["violations"]
        
        # Calculate coverage type
        coverage = "full"
        if violations["understaffing_count"] > 0:
            coverage = "partial"
            
        summary = {
            "total_shifts": len(assignments_out),
            "chef_coverage_ok": violations["understaffing_count"] == 0,
            "employee_coverage_ok": violations["understaffing_count"] == 0
        }

        # Check workload range for imbalance warnings
        workloads = {emp["EmpID"]: 0 for emp in converted_employees}
        for a in assignments_out:
            emp_id = a["employee_id"]
            if emp_id in workloads:
                workloads[emp_id] += 1
        w_vals = list(workloads.values())
        
        has_imbalance = False
        if w_vals and max(w_vals) - min(w_vals) > 1:
            has_imbalance = True

        warnings = []
        if has_imbalance:
            warnings.append("Workload imbalance detected: workload range between employees is greater than 1 shift.")
        if violations["clopening_count"] > 0:
            warnings.append(f"Clopening violations detected: {violations['clopening_count']}")
        if violations["understaffing_count"] > 0:
            warnings.append(f"Understaffing detected: {violations['understaffing_count']} shifts missing.")

        # Determine coverage string
        coverage_str = "full"
        if violations["understaffing_count"] > 0:
            coverage_str = "partial"
        elif has_imbalance:
            coverage_str = "full_hard_constraints_met"

        ret_val = {
            "status": "success" if (solver_output["status"] == "success" and not warnings) else "partial",
            "coverage": coverage_str,
            "assignments": assignments_out,
            "summary": summary,
            "warnings": warnings,
            "metrics": metrics,
            "violations": violations,
            "skipped_overrides": solver_output["skipped_overrides"]
        }
        
        # Handle infeasible / failed status specifically if needed for tests
        if solver_output["status"] == "partial_success" and not assignments_out:
            ret_val["status"] = "infeasible"
            ret_val["missing"] = {"chefs": violations["understaffing_count"]}
            ret_val["missing_coverage"] = {"chefs": violations["understaffing_count"]}
            ret_val["conflicts"] = [f"shortage of {violations['understaffing_count']} shifts"]

        return ret_val
