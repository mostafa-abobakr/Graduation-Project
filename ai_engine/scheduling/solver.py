from ortools.sat.python import cp_model
from datetime import datetime, date, time, timedelta
import math
from typing import List, Dict, Any, Tuple
from .schemas import ShiftAssignment
from .utils.normalization import normalize

# Shift definitions
MORNING_SHIFT = "Morning"
EVENING_SHIFT = "Evening"
SHIFTS = [MORNING_SHIFT, EVENING_SHIFT]
SHIFT_HOURS = {
    MORNING_SHIFT: {"start": time(8, 0), "end": time(16, 0)},
    EVENING_SHIFT: {"start": time(16, 0), "end": time(0, 0)} # 00:00 is next day midnight
}

class ScheduleSolver:
    def __init__(self, productivity_ratio: float = 10.0, max_staff_per_shift: int = 12):
        # Productivity Ratio: e.g. 1 staff per 10 orders/hour
        self.productivity_ratio = productivity_ratio
        self.max_staff_per_shift = max_staff_per_shift

    def _calculate_required_staff(self, shift: str, forecasts: List[Dict[str, Any]], target_date: date) -> int:
        """Calculates minimum required staff based on peak hourly demand for a shift on a specific date."""
        start_hour = 8 if shift == MORNING_SHIFT else 16
        end_hour = 16 if shift == MORNING_SHIFT else 24
        
        max_staff_needed = 0
        
        # Group forecasts by hour for the target date
        hourly_demand = {}
        for f in forecasts:
            ts_str = f.get("timestamp")
            if not ts_str:
                continue
            try:
                dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                if dt.date() == target_date:
                    if start_hour <= dt.hour < end_hour:
                        hour_key = dt.hour
                        hourly_demand[hour_key] = hourly_demand.get(hour_key, 0) + f.get("predicted_demand", 0)
            except ValueError:
                continue
                
        for hour, demand in hourly_demand.items():
            staff_for_hour = math.ceil(demand / self.productivity_ratio)
            if staff_for_hour > max_staff_needed:
                max_staff_needed = staff_for_hour
                
        # Cap at maximum allowed staff per shift
        max_staff_needed = min(self.max_staff_per_shift, max_staff_needed)
                
        # Make sure it's at least 2 (1 Chef + 1 Employee minimum)
        return max(2, max_staff_needed)

    def solve(self, employees: List[Dict[str, Any]], forecasts: List[Dict[str, Any]], target_date: date, overrides: List[Dict[str, Any]] = None) -> Tuple[List[ShiftAssignment], str, str]:
        if overrides is None:
            overrides = []

        # Calculate Monday to Sunday dates
        monday = target_date - timedelta(days=target_date.weekday())
        dates = [monday + timedelta(days=i) for i in range(7)]

        num_employees = len(employees)
        chefs = [i for i, emp in enumerate(employees) if normalize(emp.get("Role")) == "chef"]
        regular_emps = [i for i, emp in enumerate(employees) if normalize(emp.get("Role")) == "employee"]
        
        # Pre-check diagnostics
        if len(chefs) < len(SHIFTS):
            msg = f"Infeasible: Insufficient Chefs to cover all shifts. Need at least {len(SHIFTS)}, have {len(chefs)}."
            print(f"WARNING: {msg}")
            return [], msg, "failed"
            
        if len(regular_emps) < len(SHIFTS):
            msg = f"Infeasible: Insufficient Employees to cover all shifts. Need at least {len(SHIFTS)}, have {len(regular_emps)}."
            print(f"WARNING: {msg}")
            return [], msg, "failed"

        model = cp_model.CpModel()
        
        # 1. Variables
        # x[(e, d, s)] = 1 if employee e is assigned to day d (0-6), shift s (0-1)
        x = {}
        for e in range(num_employees):
            for d_idx in range(7):
                for s_idx, s in enumerate(SHIFTS):
                    x[(e, d_idx, s_idx)] = model.NewBoolVar(f'shift_e{e}_d{d_idx}_s{s_idx}')
                    
        # 2. Constraints
        # C1: Max 1 shift per day per employee
        for e in range(num_employees):
            for d_idx in range(7):
                model.AddAtMostOne(x[(e, d_idx, s_idx)] for s_idx in range(len(SHIFTS)))

        # C2: Weekly working days limit (WorkingDaysPerWeek)
        for e in range(num_employees):
            emp = employees[e]
            max_days = emp.get("WorkingDaysPerWeek")
            if max_days is None:
                max_days = 5
            model.Add(sum(x[(e, d_idx, s_idx)] for d_idx in range(7) for s_idx in range(len(SHIFTS))) <= max_days)
            
        shift_reqs = {}
        penalties = []
        
        for d_idx, d_date in enumerate(dates):
            for s_idx, shift_name in enumerate(SHIFTS):
                # C3 & C4: Minimum Coverage (HARD)
                model.Add(sum(x[(c, d_idx, s_idx)] for c in chefs) >= 1)
                model.Add(sum(x[(r, d_idx, s_idx)] for r in regular_emps) >= 1)
                
                # C5: Demand-Based Scaling (SOFT)
                req_staff = self._calculate_required_staff(shift_name, forecasts, d_date)
                shift_reqs[(d_idx, s_idx)] = req_staff
                
                assigned_staff = sum(x[(e, d_idx, s_idx)] for e in range(num_employees))
                gap = model.NewIntVar(0, req_staff, f'understaff_gap_d{d_idx}_s{s_idx}')
                model.Add(assigned_staff + gap >= req_staff)
                
                # Heavy penalty for understaffing
                penalties.append(1000 * gap)
                
        # 3. Preferences and Labor Cost
        for e, emp in enumerate(employees):
            pref = emp.get("Shif")
            for d_idx in range(7):
                for s_idx, shift_name in enumerate(SHIFTS):
                    # Labor cost penalty (minimize total staff used)
                    penalties.append(10 * x[(e, d_idx, s_idx)])
                    
                    # Preference violation penalty
                    if pref is not None and normalize(pref) in [normalize(s) for s in SHIFTS] and normalize(pref) != normalize(shift_name):
                        penalties.append(5 * x[(e, d_idx, s_idx)])
                        
        # 4. Enforce Manual Overrides (Locked Constraints)
        emp_id_to_idx = {emp["EmpID"]: idx for idx, emp in enumerate(employees)}
        date_to_idx = {d_date: idx for idx, d_date in enumerate(dates)}
        
        override_keys = set()
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
                print(f"DEBUG: Enforcing override constraint: EmpID {o_emp_id} on {o_day} for shift {o_shift}")
                model.Add(x[(e_idx, d_idx, s_idx)] == 1)
                override_keys.add((o_emp_id, o_day, o_shift))
            else:
                print(f"WARNING: Cannot apply override for EmpID {o_emp_id} on {o_day} - employee or day not in week.")

        model.Minimize(sum(penalties))
        
        # 5. Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        status = solver.Solve(model)
        
        status_name = solver.StatusName(status)
        print(f"INFO: Solver Status: {status_name}")
        
        assignments = []
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for e, emp in enumerate(employees):
                for d_idx, d_date in enumerate(dates):
                    for s_idx, shift_name in enumerate(SHIFTS):
                        if solver.Value(x[(e, d_idx, s_idx)]) == 1:
                            is_override = (emp["EmpID"], d_date, normalize(shift_name)) in override_keys
                            assignments.append(
                                ShiftAssignment(
                                    EmpID=emp["EmpID"],
                                    Role=normalize(emp["Role"]),
                                    ShiftType=shift_name,
                                    Date=d_date,
                                    StartTime=SHIFT_HOURS[shift_name]["start"],
                                    EndTime=SHIFT_HOURS[shift_name]["end"],
                                    Source="Manual" if is_override else "AI",
                                    IsOverridden=is_override,
                                    UpdatedAt=datetime.utcnow()
                                )
                            )
                            
            # 6. Validate Generated Schedule
            total_understaffed = 0
            for d_idx, d_date in enumerate(dates):
                for s_idx, shift_name in enumerate(SHIFTS):
                    shift_assignments = [a for a in assignments if a.ShiftType == shift_name and a.Date == d_date]
                    chefs_in_shift = [a for a in shift_assignments if a.Role == "chef"]
                    emps_in_shift = [a for a in shift_assignments if a.Role == "employee"]
                    
                    if len(chefs_in_shift) < 1:
                        msg = f"Validation Failed: No Chef assigned for {shift_name} shift on {d_date}."
                        print(f"WARNING: {msg}")
                        return [], msg, "failed"
                      
                    if len(emps_in_shift) < 1:
                        msg = f"Validation Failed: No Employee assigned for {shift_name} shift on {d_date}."
                        print(f"WARNING: {msg}")
                        return [], msg, "failed"
                    
                    if len(shift_assignments) < shift_reqs[(d_idx, s_idx)]:
                        total_understaffed += (shift_reqs[(d_idx, s_idx)] - len(shift_assignments))
                        
            if total_understaffed > 0:
                msg = f"Understaffed: Assigned all available employees, but {total_understaffed} more shifts are needed across the week to cover peak demand."
                print(f"WARNING: {msg}")
                return assignments, msg, "partial_success"
            else:
                return assignments, "Schedule generated successfully for the week.", "success"
        else:
            msg = "Infeasible: Solver could not find a valid weekly schedule with the given constraints."
            print(f"WARNING: {msg}")
            return [], msg, "failed"
