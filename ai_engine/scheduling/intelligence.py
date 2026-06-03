import math
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from .utils.normalization import normalize
from .metrics import (
    calculate_required_staff_for_shift,
    calculate_weekly_required_shifts,
    calculate_available_capacity,
    calculate_available_capacity_by_role,
    calculate_utilization,
    calculate_coverage
)

SHIFTS = ["Morning", "Night"]

def analyze_schedule(
    assignments: List[Any],
    daily_demand: Dict[date, int],
    employees: List[Dict[str, Any]],
    status: str,
    message: str,
    target_date: date
) -> Dict[str, Any]:
    """
    Analyzes weekly schedule assignments and inputs to generate operational insights.
    Returns structured dict with warnings, suggestions, and diagnostics.
    """
    # Calculate boundaries (Monday -> Sunday)
    monday = target_date - timedelta(days=target_date.weekday())
    dates = [monday + timedelta(days=i) for i in range(7)]

    # Safety check for empty inputs
    if not employees or not daily_demand:
        return {
            "status": status,
            "message": message,
            "assignments": assignments,
            "warnings": ["insufficient data to determine"],
            "suggestions": ["insufficient data to determine"],
            "diagnostics": [{"message": "insufficient data to determine"}]
        }

    # Reconstruct staffing requirements per shift using metrics.py
    shift_reqs = {}
    for d_date in dates:
        for shift_name in SHIFTS:
            req_staff = calculate_required_staff_for_shift(shift_name, daily_demand, d_date)
            shift_reqs[(d_date, shift_name)] = req_staff

    total_required_shifts = calculate_weekly_required_shifts(dates, daily_demand)
    total_available_capacity = calculate_available_capacity(employees)
    total_chef_capacity = calculate_available_capacity_by_role(employees, "chef")
    total_employee_capacity = calculate_available_capacity_by_role(employees, "employee")

    chefs = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "chef"]
    regular_emps = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "employee"]

    # =================================================
    # FAILED SCHEDULE ANALYSIS
    # =================================================
    if status == "failed":
        warnings = []
        suggestions = []
        diagnostics = []

        for d_date in dates:
            for shift_name in SHIFTS:
                req = shift_reqs.get((d_date, shift_name), 0)
                if req > 0:
                    warnings.append(f"Staff shortage on {d_date} [{shift_name}]: Required {req} staff, but 0 available.")

        chef_count_in_db = len(chefs)
        if chef_count_in_db == 0:
            any_chef_req = False
            for d_date in dates:
                for shift_name in SHIFTS:
                    req = shift_reqs.get((d_date, shift_name), 0)
                    if math.ceil(0.25 * req) > 0:
                        any_chef_req = True
                        break
            if any_chef_req:
                warnings.append("Chef shortage: Chef requirements exist, but no chefs are available in the employee list.")
                suggestions.append("Register at least one chef in the database with non-zero WorkingDaysPerWeek.")

        if warnings and not suggestions:
            suggestions.append("Ensure employees are registered in the database with non-zero WorkingDaysPerWeek to provide scheduling capacity.")

        diagnostics.append({
            "type": "constraint_issue",
            "severity": "critical",
            "message": "Schedule infeasible due to staffing or constraint limitations."
        })

        return {
            "status": "failed",
            "message": message,
            "assignments": [],
            "warnings": warnings,
            "suggestions": suggestions,
            "diagnostics": diagnostics
        }

    # =================================================
    # SUCCESS ANALYSIS (status is success or partial_success)
    # =================================================
    warnings = []
    suggestions = []
    diagnostics = []

    # 1. Workforce Summary
    num_employees = len(employees)
    chefs = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "chef"]
    regular_emps = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "employee"]
    
    workforce_diagnostic = {
        "module": "workforce_summary",
        "total_employees": num_employees,
        "total_chefs": len(chefs),
        "total_regular_employees": len(regular_emps)
    }
    diagnostics.append(workforce_diagnostic)
    
    # 2. Capacity Summary
    chef_capacity = calculate_available_capacity_by_role(employees, "chef")
    regular_emp_capacity = calculate_available_capacity_by_role(employees, "employee")
    
    capacity_diagnostic = {
        "module": "capacity_summary",
        "total_capacity": total_available_capacity,
        "chef_capacity": chef_capacity,
        "regular_employee_capacity": regular_emp_capacity
    }
    diagnostics.append(capacity_diagnostic)
    
    # 3. Coverage Summary
    covered_shifts = len(assignments)
    uncovered_shifts = max(0, total_required_shifts - covered_shifts)
    coverage_rate = calculate_coverage(covered_shifts, total_required_shifts)
    
    coverage_diagnostic = {
        "module": "coverage_summary",
        "required_shifts": total_required_shifts,
        "covered_shifts": covered_shifts,
        "uncovered_shifts": uncovered_shifts,
        "coverage_rate": coverage_rate
    }
    diagnostics.append(coverage_diagnostic)
    
    # 4. Workload Distribution
    employee_shifts = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    mon_morning_counts = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    mon_night_counts = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    
    for a in assignments:
        emp_id = getattr(a, "EmpID", None)
        if emp_id is None and isinstance(a, dict):
            emp_id = a.get("employee_id", a.get("EmpID"))
            
        shift_type = getattr(a, "ShiftType", None)
        if shift_type is None and isinstance(a, dict):
            shift_type = a.get("shift", a.get("ShiftType"))
            
        if emp_id in employee_shifts:
            employee_shifts[emp_id] += 1
            if normalize(shift_type) == "morning":
                mon_morning_counts[emp_id] += 1
            else:
                mon_night_counts[emp_id] += 1
                
    w_vals = list(employee_shifts.values())
    max_w = max(w_vals) if w_vals else 0
    min_w = min(w_vals) if w_vals else 0
    avg_w = sum(w_vals) / max(1, num_employees)
    
    shift_diversity_violations = 0
    for emp_id, w_total in employee_shifts.items():
        if w_total >= 2:
            if mon_morning_counts[emp_id] == w_total or mon_night_counts[emp_id] == w_total:
                shift_diversity_violations += 1
                
    workload_dist_diagnostic = {
        "module": "workload_distribution",
        "employee_workloads": employee_shifts,
        "max_workload": max_w,
        "min_workload": min_w,
        "average_workload": round(avg_w, 2),
        "workload_range": max_w - min_w,
        "shift_diversity_violations": shift_diversity_violations
    }
    diagnostics.append(workload_dist_diagnostic)
    
    # 5. Off-day Distribution
    off_counts_by_date = {}
    for d_date in dates:
        date_str = str(d_date)
        working_count = 0
        for a in assignments:
            a_date = getattr(a, "Date", None)
            if a_date is None and isinstance(a, dict):
                a_date = a.get("date", a.get("Date"))
            if isinstance(a_date, str):
                try:
                    a_date = datetime.strptime(a_date, "%Y-%m-%d").date()
                except ValueError:
                    pass
            if a_date == d_date:
                working_count += 1
        off_counts_by_date[date_str] = num_employees - working_count
        
    off_vals = list(off_counts_by_date.values())
    max_off = max(off_vals) if off_vals else 0
    min_off = min(off_vals) if off_vals else 0
    off_imbalance = max_off - min_off
    
    off_day_diagnostic = {
        "module": "off_day_distribution",
        "total_off_days_assigned": sum(7 - w for w in w_vals),
        "off_days_by_date": off_counts_by_date,
        "off_day_imbalance": off_imbalance
    }
    diagnostics.append(off_day_diagnostic)
    
    # 6. Chef Allocation Summary
    chef_ids = {emp.get("EmpID", emp.get("id")) for emp in chefs}
    chef_req_vs_assigned = []
    total_chef_req = 0
    total_chef_assigned = 0
    
    for d_date in dates:
        date_str = str(d_date)
        for shift_name in SHIFTS:
            req = shift_reqs.get((d_date, shift_name), 0)
            target_chefs = math.ceil(0.25 * req)
            total_chef_req += target_chefs
            
            assigned_chefs = 0
            for a in assignments:
                a_date = getattr(a, "Date", None)
                a_shift = getattr(a, "ShiftType", None)
                a_empid = getattr(a, "EmpID", None)
                if isinstance(a, dict):
                    a_date = a.get("date")
                    a_shift = a.get("shift")
                    a_empid = a.get("employee_id")
                if isinstance(a_date, str):
                    try:
                        a_date = datetime.strptime(a_date, "%Y-%m-%d").date()
                    except ValueError:
                        pass
                if a_date == d_date and normalize(a_shift) == normalize(shift_name) and a_empid in chef_ids:
                    assigned_chefs += 1
            
            total_chef_assigned += assigned_chefs
            chef_req_vs_assigned.append({
                "date": date_str,
                "shift": shift_name,
                "required_chefs": target_chefs,
                "assigned_chefs": assigned_chefs
            })
            
    chef_alloc_diagnostic = {
        "module": "chef_allocation_summary",
        "chef_coverage_rate": calculate_coverage(total_chef_assigned, total_chef_req),
        "chef_req_vs_assigned": chef_req_vs_assigned
    }
    diagnostics.append(chef_alloc_diagnostic)

    employee_lookup = {emp.get("EmpID", emp.get("id")): emp for emp in employees}

    # A) Peak Demand Detection
    avg_demand = sum(daily_demand.values()) / len(daily_demand) if daily_demand else 0
    max_demand = max(daily_demand.values()) if daily_demand else 0
    peak_dates = [d for d, v in daily_demand.items() if v == max_demand]
    
    peak_diff_pct = 0.0
    if avg_demand > 0:
        peak_diff_pct = ((max_demand - avg_demand) / avg_demand) * 100

    peak_diagnostic = {
        "module": "peak_demand_detection",
        "peak_demand_value": max_demand,
        "weekly_average_demand": avg_demand,
        "peak_percentage_difference": peak_diff_pct,
        "peak_dates": [str(d) for d in peak_dates]
    }
    diagnostics.append(peak_diagnostic)

    if peak_diff_pct > 20.0:
        warnings.append(f"Peak demand of {max_demand} detected on {', '.join(str(d) for d in peak_dates)} (+{peak_diff_pct:.1f}% above weekly average of {avg_demand:.1f}).")
        suggestions.append(f"Ensure extra staff or backup coverage is scheduled on peak demand days ({', '.join(str(d) for d in peak_dates)}) to handle the workload spike.")

    # B) Employee Workload Analysis
    workload = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    for a in assignments:
        emp_id = getattr(a, "EmpID", None)
        if emp_id is None and isinstance(a, dict):
            emp_id = a.get("employee_id", a.get("EmpID"))
        if emp_id in workload:
            workload[emp_id] += 1

    assigned_workloads = [w for w in workload.values() if w > 0]
    avg_workload = sum(assigned_workloads) / len(assigned_workloads) if assigned_workloads else 0

    high_workload_employees = []
    low_workload_employees = []

    for emp_id, w in workload.items():
        emp = employee_lookup.get(emp_id, {})
        emp_name = emp.get("FullName", f"Employee {emp_id}")
        if w > avg_workload:
            high_workload_employees.append({
                "emp_id": emp_id,
                "name": emp_name,
                "workload": w,
                "avg_workload": avg_workload,
                "difference": w - avg_workload
            })
        elif 0 < w < avg_workload:
            low_workload_employees.append({
                "emp_id": emp_id,
                "name": emp_name,
                "workload": w,
                "avg_workload": avg_workload,
                "difference": avg_workload - w
            })

    workload_diagnostic = {
        "module": "employee_workload_analysis",
        "average_workload": avg_workload,
        "high_workload_employees": high_workload_employees,
        "low_workload_employees": low_workload_employees
    }
    diagnostics.append(workload_diagnostic)

    if high_workload_employees:
        warnings.append(f"Workload imbalance: {len(high_workload_employees)} employee(s) have workloads above the team average of {avg_workload:.1f} shifts.")
        for item in high_workload_employees:
            suggestions.append(f"Consider redistributing shifts from high workload employee {item['name']} (ID {item['emp_id']} has {item['workload']} shifts, which is {item['difference']:.1f} shifts above average).")

    # C) Capacity Utilization using metrics.py
    utilization = 0.0
    if total_available_capacity > 0:
        utilization = total_required_shifts / total_available_capacity

    utilization_diagnostic = {
        "module": "capacity_utilization",
        "total_required_shifts": total_required_shifts,
        "total_available_capacity": total_available_capacity,
        "utilization_ratio": utilization
    }
    diagnostics.append(utilization_diagnostic)

    if utilization > 0.90:
        warnings.append(f"CRITICAL: Very high capacity utilization of {utilization*100:.1f}% detected. System is operating at near-maximum capacity limits.")
        suggestions.append("Hire additional staff or adjust operating hours to reduce critical workload pressure.")
    elif utilization > 0.80:
        warnings.append(f"Warning: High capacity utilization of {utilization*100:.1f}% detected. Operational capacity is tight.")
        suggestions.append("Monitor staffing closely and consider scheduling extra part-time employees.")

    # D) Unused Capacity Detection
    unused_employees = []
    significantly_low_employees = []
    for emp_id, w in workload.items():
        emp = employee_lookup.get(emp_id, {})
        emp_name = emp.get("FullName", f"Employee {emp_id}")
        if w == 0:
            unused_employees.append({
                "emp_id": emp_id,
                "name": emp_name
            })
        elif w < 0.5 * avg_workload:
            significantly_low_employees.append({
                "emp_id": emp_id,
                "name": emp_name,
                "workload": w,
                "avg_workload": avg_workload
            })

    unused_diagnostic = {
        "module": "unused_capacity_detection",
        "unused_employees": unused_employees,
        "significantly_low_employees": significantly_low_employees
    }
    diagnostics.append(unused_diagnostic)

    if unused_employees:
        warnings.append(f"Unused capacity detected: {len(unused_employees)} employee(s) have 0 assigned shifts.")
        for item in unused_employees:
            suggestions.append(f"Consider assigning shifts to unused employee {item['name']} (ID {item['emp_id']}) to relieve pressure on others.")
    if significantly_low_employees:
        for item in significantly_low_employees:
            suggestions.append(f"Employee {item['name']} (ID {item['emp_id']}) has only {item['workload']} assignments, which is significantly below the team average of {item['avg_workload']:.1f}.")

    # E) Chef Coverage
    chef_coverage_issues = []
    chef_ids = {emp.get("EmpID", emp.get("id")) for emp in chefs}
    if chefs:
        for d_date in dates:
            for shift_name in SHIFTS:
                req = shift_reqs.get((d_date, shift_name), 0)
                target_chefs = math.ceil(0.25 * req)
                
                shift_chefs = []
                for a in assignments:
                    a_date = getattr(a, "Date", None)
                    a_shift = getattr(a, "ShiftType", None)
                    a_empid = getattr(a, "EmpID", None)
                    if isinstance(a, dict):
                        a_date = a.get("date")
                        a_shift = a.get("shift")
                        a_empid = a.get("employee_id")
                        
                    # Normalize string dates if needed
                    if isinstance(a_date, str):
                        try:
                            a_date = datetime.strptime(a_date, "%Y-%m-%d").date()
                        except ValueError:
                            pass
                            
                    if a_date == d_date and a_shift == shift_name and a_empid in chef_ids:
                        shift_chefs.append(a)
                        
                chef_count = len(shift_chefs)
                if chef_count < target_chefs:
                    chef_coverage_issues.append({
                        "date": str(d_date),
                        "shift": shift_name,
                        "assigned_chefs": chef_count,
                        "target_chefs": target_chefs,
                        "deficit": target_chefs - chef_count
                    })

        chef_diagnostic = {
            "module": "chef_coverage",
            "chef_coverage_issues": chef_coverage_issues
        }
        diagnostics.append(chef_diagnostic)

        if chef_coverage_issues:
            warnings.append(f"Chef coverage risk: {len(chef_coverage_issues)} shift(s) are below the chef-to-employee ratio target.")
            for issue in chef_coverage_issues:
                suggestions.append(f"Assign {issue['deficit']} more chef(s) to {issue['date']} [{issue['shift']}] to satisfy the chef target.")

    # Understaffing Check (for partial_success status)
    total_shortage = 0
    for d_date in dates:
        for shift_name in SHIFTS:
            req = shift_reqs.get((d_date, shift_name), 0)
            assigned_count = 0
            for a in assignments:
                a_date = getattr(a, "Date", None)
                a_shift = getattr(a, "ShiftType", None)
                if isinstance(a, dict):
                    a_date = a.get("date")
                    a_shift = a.get("shift")
                if isinstance(a_date, str):
                    try:
                        a_date = datetime.strptime(a_date, "%Y-%m-%d").date()
                    except ValueError:
                        pass
                if a_date == d_date and a_shift == shift_name:
                    assigned_count += 1
                    
            if assigned_count < req:
                total_shortage += (req - assigned_count)

    if total_shortage > 0:
        warnings.append(f"Understaffing detected: {total_shortage} shifts could not be covered due to capacity limits.")
        suggestions.append(f"Hire additional staff or request employees to work overtime to cover the {total_shortage} missing shifts.")

    return {
        "status": status,
        "message": message,
        "assignments": assignments,
        "warnings": warnings,
        "suggestions": suggestions,
        "diagnostics": diagnostics
    }
