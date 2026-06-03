import pytest
from datetime import date, time, timedelta
from scheduling.intelligence import analyze_schedule
from scheduling.schemas import ShiftAssignment

def test_intelligence_missing_data():
    res = analyze_schedule(
        assignments=[],
        daily_demand={},
        employees=[],
        status="success",
        message="Ok",
        target_date=date(2026, 5, 27)
    )
    
    assert res["status"] == "success"
    assert "insufficient data to determine" in res["warnings"]
    assert "insufficient data to determine" in res["suggestions"]
    assert any("insufficient data to determine" in str(d) for d in res["diagnostics"])

def test_intelligence_success_insights():
    employees = [
        {"EmpID": 1, "Role": "chef", "WorkingDaysPerWeek": 5, "FullName": "Chef 1"},
        {"EmpID": 2, "Role": "chef", "WorkingDaysPerWeek": 5, "FullName": "Chef 2"},
        {"EmpID": 3, "Role": "employee", "WorkingDaysPerWeek": 5, "FullName": "Employee 1"},
        {"EmpID": 4, "Role": "employee", "WorkingDaysPerWeek": 5, "FullName": "Employee 2"},
    ]
    daily_demand = {
        date(2026, 5, 25): 40,
        date(2026, 5, 26): 40,
        date(2026, 5, 27): 40,
        date(2026, 5, 28): 40,
        date(2026, 5, 29): 40,
        date(2026, 5, 30): 40,
        date(2026, 5, 31): 40,
    }
    
    assignments = []
    for d in range(7):
        d_date = date(2026, 5, 25) + timedelta(days=d)
        assignments.append(
            ShiftAssignment(
                EmpID=1,
                Role="chef",
                ShiftType="Morning",
                Date=d_date,
                StartTime=time(8, 0),
                EndTime=time(16, 0)
            )
        )
        assignments.append(
            ShiftAssignment(
                EmpID=3,
                Role="employee",
                ShiftType="Morning",
                Date=d_date,
                StartTime=time(8, 0),
                EndTime=time(16, 0)
            )
        )
    
    res = analyze_schedule(
        assignments=assignments,
        daily_demand=daily_demand,
        employees=employees,
        status="success",
        message="Ok",
        target_date=date(2026, 5, 27)
    )
    
    assert res["status"] == "success"
    # Unused capacity warnings should detect that employee(s) have 0 assigned shifts
    assert any("Unused capacity detected" in w and "0 assigned" in w for w in res["warnings"])
    assert any("Employee 2" in s and "unused employee" in s for s in res["suggestions"])

def test_intelligence_failure_diagnostics():
    employees = [
        {"EmpID": 1, "Role": "chef", "WorkingDaysPerWeek": 0, "FullName": "Chef 1"},
        {"EmpID": 2, "Role": "employee", "WorkingDaysPerWeek": 0, "FullName": "Employee 1"},
    ]
    daily_demand = {
        date(2026, 5, 25): 40,
    }
    
    res = analyze_schedule(
        assignments=[],
        daily_demand=daily_demand,
        employees=employees,
        status="failed",
        message="Infeasible",
        target_date=date(2026, 5, 27)
    )
    
    assert res["status"] == "failed"
    # Diagnostics should contain constraint issue dictionary
    assert any(d.get("type") == "constraint_issue" and d.get("severity") == "critical" for d in res["diagnostics"])
    # Warnings should contain staff shortage warnings
    assert any("Staff shortage" in w for w in res["warnings"])
