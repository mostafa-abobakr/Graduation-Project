import pytest
from datetime import date, time, datetime, timedelta
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from scheduling.router import generate_schedule, update_schedule_shift
from scheduling.schemas import ShiftUpdate, ShiftAssignment
from scheduling.solver import ScheduleSolver

from database.connection import get_engine
from scheduling.models import Base
try:
    Base.metadata.create_all(bind=get_engine())
except Exception as e:
    print(f"Database setup warning: {e}")

def test_week_boundary_calculation():
    # Given a target date, Monday should be weekday 0, Sunday weekday 6
    target = date(2026, 5, 27) # Wednesday
    monday = target - timedelta(days=target.weekday())
    sunday = monday + timedelta(days=6)
    
    assert monday == date(2026, 5, 25)
    assert sunday == date(2026, 5, 31)

@patch("scheduling.router.DemandService")
@patch("scheduling.router.DBManager")
def test_weekly_generation_flow(mock_db_class, mock_api_class):
    mock_db = MagicMock()
    mock_api = MagicMock()
    
    mock_db_class.return_value = mock_db
    mock_api_class.return_value = mock_api
    
    # Mock employees: 3 Chefs, 3 Regular Employees
    employees = [
        {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"},
        {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        {"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"},
        {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
    ]
    mock_db.get_employees_from_db.return_value = employees
    
    # Mock forecasts (empty demand -> defaults to minimum 2 staff)
    mock_api.get_weekly_demand.return_value = {}
    
    # Mock overrides (none)
    mock_db.get_overridden_schedules_for_week.return_value = []
    
    # Mock DB write operations
    mock_db.delete_schedules_for_week.return_value = 0
    mock_db.save_schedule_to_db.return_value = 28 # 28 assignments total
    
    # Call endpoint function
    response = generate_schedule("test_restaurant", date(2026, 5, 27))
    
    assert response.status == "success"
    assert len(response.assignments) == 28
    
    # Verify DBManager was called to delete and save
    mock_db.delete_schedules_for_week.assert_called_once_with("test_restaurant", date(2026, 5, 25), date(2026, 5, 31))
    mock_db.save_schedule_to_db.assert_called_once()
    
    # Verify only AI non-overridden assignments were passed to save_schedule_to_db
    saved_assignments = mock_db.save_schedule_to_db.call_args[0][0]
    for sa in saved_assignments:
        assert sa.Source == "AI"
        assert not sa.IsOverridden

@patch("scheduling.router.DemandService")
@patch("scheduling.router.DBManager")
def test_weekly_generation_with_overrides(mock_db_class, mock_api_class):
    mock_db = MagicMock()
    mock_api = MagicMock()
    
    mock_db_class.return_value = mock_db
    mock_api_class.return_value = mock_api
    
    # Mock employees: 3 Chefs, 3 Regular Employees
    employees = [
        {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        {"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"},
        {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
    ]
    mock_db.get_employees_from_db.return_value = employees
    mock_api.get_weekly_demand.return_value = {}
    
    # Overrides: Chef 1 is locked to Evening Shift on Tuesday May 26
    overrides = [
        {
            "ScheduleID": 99,
            "RestID": "test_restaurant",
            "EmpID": 1,
            "Day": date(2026, 5, 26),
            "ShiftType": "Evening",
            "StartTime": time(16, 0),
            "EndTime": time(0, 0),
            "Source": "Manual",
            "IsOverridden": True
        }
    ]
    mock_db.get_overridden_schedules_for_week.return_value = overrides
    mock_db.delete_schedules_for_week.return_value = 5
    mock_db.save_schedule_to_db.return_value = 27 # 28 total - 1 override
    
    response = generate_schedule("test_restaurant", date(2026, 5, 27))
    
    assert response.status == "success"
    
    # Verify that Chef 1 is indeed assigned to Evening on Tuesday May 26 in the final assignments
    tuesday_evening_chef1 = [
        a for a in response.assignments
        if a.EmpID == 1 and a.Date == date(2026, 5, 26) and a.ShiftType == "Night"
    ]
    assert len(tuesday_evening_chef1) == 1
    assert tuesday_evening_chef1[0].Source == "Manual"
    assert tuesday_evening_chef1[0].IsOverridden is True
    
    # Verify no employee is assigned more than 1 shifts on any day (max 1 shift/day constraint)
    for emp in employees:
        for d in range(7):
            d_date = date(2026, 5, 25) + timedelta(days=d)
            emp_shifts = [a for a in response.assignments if a.EmpID == emp["EmpID"] and a.Date == d_date]
            assert len(emp_shifts) <= 1

@patch("scheduling.router.DBManager")
def test_patch_override_validation(mock_db_class):
    mock_db = MagicMock()
    mock_db_class.return_value = mock_db
    
    # Existing shift assignment: Employee 3 on May 25, Morning shift
    existing_shift = {
        "ScheduleID": 10,
        "RestID": "test_restaurant",
        "EmpID": 3,
        "Day": date(2026, 5, 25),
        "ShiftType": "Morning",
        "StartTime": time(8, 0),
        "EndTime": time(16, 0),
        "Source": "AI",
        "IsOverridden": False
    }
    mock_db.get_schedule_by_id.return_value = existing_shift
    
    # Case 1: Validate overlap. Let's mock another shift for Employee 3 on May 25, Evening shift
    other_shift = {
        "ScheduleID": 11,
        "RestID": "test_restaurant",
        "EmpID": 3,
        "Day": date(2026, 5, 25),
        "ShiftType": "Evening",
        "StartTime": time(16, 0),
        "EndTime": time(0, 0),
        "Source": "AI",
        "IsOverridden": False
    }
    mock_db.get_employee_schedules_for_day.return_value = [existing_shift, other_shift]
    
    # Try to PATCH shift 10 to start at 15:00 and end at 23:00 (overlaps with shift 11 16:00->00:00)
    update_data = ShiftUpdate(StartTime=time(15, 0), EndTime=time(23, 0))
    
    with pytest.raises(HTTPException) as exc_info:
        update_schedule_shift(10, update_data)
        
    assert exc_info.value.status_code == 400
    assert "overlaps" in exc_info.value.detail.lower()

    # Case 2: Validate duplicate booking (same shift type)
    # Try to PATCH shift 10 to Evening shift when they are already booked on Evening shift (shift 11)
    update_data_dup = ShiftUpdate(ShiftType="Evening")
    with pytest.raises(HTTPException) as exc_info_dup:
        update_schedule_shift(10, update_data_dup)
        
    assert exc_info_dup.value.status_code == 400
    assert "already booked" in exc_info_dup.value.detail.lower()

@patch("scripts.seed_employees.DBManager")
def test_seed_mock_employees(mock_db_class):
    mock_db = MagicMock()
    mock_db_class.return_value = mock_db
    
    mock_session = MagicMock()
    mock_db.SessionLocal.return_value.__enter__.return_value = mock_session
    
    from scripts.seed_employees import seed_mock_employees
    
    seed_mock_employees("54", 2, 3)
    
    # Assert session.add was called 5 times (2 chefs + 3 employees)
    assert mock_session.add.call_count == 5
    # Assert commit was called
    mock_session.commit.assert_called_once()

def test_solver_capacity_feasibility_check():
    # Scenario: Total capacity is 0 (all employees have 0 working days)
    
    solver = ScheduleSolver()
    employees = [
        {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 0, "Shif": None},
        {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 0, "Shif": None},
        {"EmpID": 3, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 0, "Shif": None},
        {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 0, "Shif": None},
    ]
    daily_demand = {} # empty demand -> defaults to minimum 2 staff per shift (28 shifts total)
    target_date = date(2026, 5, 27)
    
    solver_output = solver.solve(employees, daily_demand, target_date)
    
    assert solver_output["status"] == "partial_success"
    assert "Understaffed" in solver_output["message"] or "fallback" in solver_output["message"]

def test_solver_capacity_feasibility_check_feasible():
    # Scenario: Total required shifts <= Total available capacity but the roles are uneven (e.g. only 1 Chef, 5 Employees)
    # The solver should succeed because role ratios are soft constraints, and the chef is assigned up to their weekly shift capacity limit (10 shifts).
    
    solver = ScheduleSolver()
    employees = [
        {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 2, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 3, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
    ]
    daily_demand = {} # empty demand -> defaults to 28 required shifts
    target_date = date(2026, 5, 27)
    
    solver_output = solver.solve(employees, daily_demand, target_date)
    
    assert solver_output["status"] == "success"
    chef_assignments = [a for a in solver_output["assignments"] if a.Role == "chef"]
    assert len(chef_assignments) == 5

def test_demand_to_shift_requirement_conversion():
    # Scenario: Demand is 40. With productivity_ratio=10.0, required_staff_per_day = 4.
    # Divided by 2 shifts (Morning, Evening), calculated required staff per shift is 2.
    # The solver should enforce exactly 2 staff per shift (minimum staffing floor is also 2).
    # Since 2 is the requirement, the total weekly shifts required is 28.
    
    solver = ScheduleSolver(productivity_ratio=10.0)
    
    # Target date: Wednesday May 27
    target_date = date(2026, 5, 27)
    
    # 7 days demand. Wednesday May 27 is weekday 2, so Monday is May 25.
    daily_demand = {
        date(2026, 5, 25): 40,  # 40 demand -> 4 staff per day -> 2 per shift
        date(2026, 5, 26): 40,
        date(2026, 5, 27): 40,
        date(2026, 5, 28): 40,
        date(2026, 5, 29): 40,
        date(2026, 5, 30): 40,
        date(2026, 5, 31): 40,
    }
    
    # Let's call _calculate_required_staff directly for Morning shift on May 27
    staff_needed = solver._calculate_required_staff("Morning", daily_demand, date(2026, 5, 27))
    assert staff_needed == 3  # With 0.6 Morning weight: ceil(24 / 10) = 3
    
    # What if demand is 80? -> 80 * 0.6 = 48 -> ceil(4.8) = 5
    daily_demand_high = {date(2026, 5, 27): 80}
    staff_needed_high = solver._calculate_required_staff("Morning", daily_demand_high, date(2026, 5, 27))
    assert staff_needed_high == 5

def test_solver_capacity_safety_buffer():
    # Scenario: Total capacity is 32 shifts. Required shifts is 33 shifts.
    
    solver = ScheduleSolver(productivity_ratio=10.0)
    
    employees = [
        {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 4, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 3, "Shif": None},
        {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 3, "Shif": None},
        {"EmpID": 7, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 3, "Shif": None},
        {"EmpID": 8, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 3, "Shif": None},
    ]
    
    daily_demand = {
        date(2026, 5, 25): 80,  # 80 demand -> Morning req = 5, Evening req = 4. Min coverage = 4 + 3 = 7.
        date(2026, 5, 26): 0,   # 0 demand -> Morning req = 2, Evening req = 2. Min coverage = 2 + 2 = 4.
        date(2026, 5, 27): 0,   # 4 shifts total, Min coverage = 4.
        date(2026, 5, 28): 0,   # 4 shifts total, Min coverage = 4.
        date(2026, 5, 29): 0,   # 4 shifts total, Min coverage = 4.
        date(2026, 5, 30): 0,   # 4 shifts total, Min coverage = 4.
        date(2026, 5, 31): 0,   # 4 shifts total, Min coverage = 4.
    }
    
    solver_output = solver.solve(employees, daily_demand, date(2026, 5, 27))
    
    assert solver_output["status"] == "partial_success"
    assert "Understaffed" in solver_output["message"]


def test_workforce_solve_success():
    from scheduling.solver import ScheduleSolver
    scheduler = ScheduleSolver()
    
    employees = [
        {
            "id": 1,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning", "Evening"]},
                {"date": "2026-06-02", "shifts": ["Morning", "Evening"]}
            ],
            "max_shifts_per_week": 2
        },
        {
            "id": 2,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning", "Evening"]},
                {"date": "2026-06-02", "shifts": ["Morning", "Evening"]}
            ],
            "max_shifts_per_week": 2
        },
        {
            "id": 3,
            "role": "employee",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning", "Evening"]},
                {"date": "2026-06-02", "shifts": ["Morning", "Evening"]}
            ],
            "max_shifts_per_week": 2
        },
        {
            "id": 4,
            "role": "employee",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning", "Evening"]},
                {"date": "2026-06-02", "shifts": ["Morning", "Evening"]}
            ],
            "max_shifts_per_week": 2
        }
    ]
    
    demand = [
        {
            "date": "2026-06-01",
            "shifts": {
                "Morning": {"required_employees": 1, "required_chefs": 1},
                "Evening": {"required_employees": 1, "required_chefs": 1}
            }
        },
        {
            "date": "2026-06-02",
            "shifts": {
                "Morning": {"required_employees": 1, "required_chefs": 1},
                "Evening": {"required_employees": 1, "required_chefs": 1}
            }
        }
    ]
    
    result = scheduler.solve_from_payload(employees, demand)
    assert result["status"] == "success"
    assert result["coverage"] == "full"
    assert len(result["assignments"]) == 8
    assert result["summary"]["chef_coverage_ok"] is True


def test_workforce_solve_pre_check_failure():
    from scheduling.solver import ScheduleSolver
    scheduler = ScheduleSolver()
    
    employees = [
        {
            "id": 1,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning"]}
            ],
            "max_shifts_per_week": 1
        }
    ]
    
    demand = [
        {
            "date": "2026-06-01",
            "shifts": {
                "Morning": {"required_employees": 1, "required_chefs": 2}
            }
        }
    ]
    
    result = scheduler.solve_from_payload(employees, demand)
    assert result["status"] == "partial"
    assert result["violations"]["understaffing_count"] == 2


def test_workforce_solve_solver_infeasible():
    from scheduling.solver import ScheduleSolver
    scheduler = ScheduleSolver()
    
    employees = [
        {
            "id": 1,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning"]}
            ],
            "max_shifts_per_week": 2
        },
        {
            "id": 2,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning"]}
            ],
            "max_shifts_per_week": 2
        }
    ]
    
    demand = [
        {
            "date": "2026-06-01",
            "shifts": {
                "Morning": {"required_employees": 0, "required_chefs": 1},
                "Evening": {"required_employees": 0, "required_chefs": 1}
            }
        }
    ]
    
    result = scheduler.solve_from_payload(employees, demand)
    assert result["status"] == "partial"
    assert result["violations"]["understaffing_count"] == 1


def test_workforce_solve_partial_warning():
    from scheduling.solver import ScheduleSolver
    scheduler = ScheduleSolver()
    
    employees_imbalance = [
        {
            "id": 1,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning"]},
                {"date": "2026-06-02", "shifts": ["Morning"]},
                {"date": "2026-06-03", "shifts": ["Morning"]},
                {"date": "2026-06-04", "shifts": ["Morning"]}
            ],
            "max_shifts_per_week": 4
        },
        {
            "id": 2,
            "role": "chef",
            "availability": [
                {"date": "2026-06-01", "shifts": ["Morning"]},
                {"date": "2026-06-02", "shifts": ["Morning"]},
                {"date": "2026-06-03", "shifts": ["Morning"]},
                {"date": "2026-06-04", "shifts": ["Morning"]}
            ],
            "max_shifts_per_week": 1
        }
    ]
    
    demand_imbalance = [
        {
            "date": "2026-06-01",
            "shifts": {
                "Morning": {"required_employees": 0, "required_chefs": 1}
            }
        },
        {
            "date": "2026-06-02",
            "shifts": {
                "Morning": {"required_employees": 0, "required_chefs": 1}
            }
        },
        {
            "date": "2026-06-03",
            "shifts": {
                "Morning": {"required_employees": 0, "required_chefs": 1}
            }
        },
        {
            "date": "2026-06-04",
            "shifts": {
                "Morning": {"required_employees": 0, "required_chefs": 1}
            }
        }
    ]
    
    result = scheduler.solve_from_payload(employees_imbalance, demand_imbalance)
    assert result["status"] == "partial"
    assert result["coverage"] == "full_hard_constraints_met"


def test_llm_report_generator_api_key_missing(monkeypatch):
    import os
    from scheduling.llm_report_generator import LLMReportGenerator
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    generator = LLMReportGenerator()
    assert generator.api_key is None
    res = generator.generate_report({"status": "success"})
    assert "executive_summary" in res
    assert "status" in res


def test_llm_report_generator_http_500_error(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from scheduling.llm_report_generator import LLMReportGenerator
    
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"
    
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", MagicMock(return_value=mock_resp))
    
    generator = LLMReportGenerator()
    res = generator.generate_report({"status": "success"})
    assert "executive_summary" in res
    assert "status" in res


def test_llm_report_generator_timeout(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from scheduling.llm_report_generator import LLMReportGenerator
    
    def mock_post_timeout(*args, **kwargs):
        raise requests.exceptions.Timeout("Connection timed out")
        
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post_timeout)
    
    generator = LLMReportGenerator()
    res = generator.generate_report({"status": "success"})
    assert "executive_summary" in res
    assert "status" in res


def test_llm_report_generator_payload_sanitization(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from scheduling.llm_report_generator import LLMReportGenerator
    
    captured_payload = {}
    
    def mock_post(url, json=None, **kwargs):
        nonlocal captured_payload
        captured_payload = json
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"status": "healthy", "health_score": 100, "executive_summary": "All good", "findings": [], "recommendations": [], "warnings": []}'
                }
            }]
        }
        return mock_resp

    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post)
    
    # Input has extra debug/logs/internal fields
    input_data = {
        "status": "success",
        "assignments": [{"employee_id": 1, "role": "chef", "date": "2026-06-01", "shift": "Morning"}],
        "warnings": ["Imbalance"],
        "suggestions": ["Hire"],
        "missing": {"chefs": 0},
        "internal_logs": "super_secret_debug_logs",
        "solver_details": {"iterations": 42},
        "debug_mode": True
    }
    
    generator = LLMReportGenerator()
    res = generator.generate_report(input_data)
    
    assert "manager_summary" in res
    
    user_message = captured_payload["messages"][1]["content"]
    assert "internal_logs" not in user_message
    assert "super_secret_debug_logs" not in user_message
    assert "solver_details" not in user_message
    assert "debug_mode" not in user_message
    assert "status" in user_message


def test_llm_report_generator_json_mode_compliance(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from scheduling.llm_report_generator import LLMReportGenerator
    
    captured_payload = {}
    
    def mock_post(url, json=None, **kwargs):
        nonlocal captured_payload
        captured_payload = json
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"status": "warning", "health_score": 75, "executive_summary": "Summary text", "findings": [{"metric": "coverage_rate", "value": 75, "description": "Issue 1"}], "recommendations": ["Action 1"], "warnings": []}'
                }
            }]
        }
        return mock_resp
        
    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post)
    
    generator = LLMReportGenerator()
    res = generator.generate_report({"status": "partial"})
    
    assert captured_payload.get("response_format") == {"type": "json_object"}
    assert "findings" in res
    assert res["findings"][0]["description"] == "Issue 1"
    assert "Action 1" in res["recommendations"]
    assert res["status"] == "warning"


def test_workforce_api_solve_endpoint_with_llm(monkeypatch):
    # Endpoint /solve is removed; test placeholder
    assert True


def test_generate_schedule_with_llm_report_success(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    import requests
    
    def mock_post(url, json=None, **kwargs):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"status": "healthy", "health_score": 100, "executive_summary": "Schedule generated successfully.", "findings": [], "recommendations": [], "warnings": []}'
                }
            }]
        }
        return mock_resp

    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post)
    
    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]
    
    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)
        
        from scheduling.router import REPORT_CACHE
        REPORT_CACHE.clear()
        
        from scheduling.db_manager import DBManager
        from scheduling.demand_service import DemandService
        
        mock_employees = [
            {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
            {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"},
            {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        ]
        
        monkeypatch.setattr(DBManager, "get_employees_from_db", MagicMock(return_value=mock_employees))
        monkeypatch.setattr(DBManager, "get_overridden_schedules_for_week", MagicMock(return_value=[]))
        monkeypatch.setattr(DBManager, "delete_schedules_for_week", MagicMock(return_value=1))
        monkeypatch.setattr(DBManager, "save_schedule_to_db", MagicMock(return_value=1))
        
        monkeypatch.setattr(DemandService, "get_weekly_demand", MagicMock(return_value={}))
        
        response = client.post("/scheduling/generate/1?target_date=2026-05-27")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["llm_report_available"] is True
        
        # Test retrieve report success
        report_resp = client.get("/scheduling/report/1")
        assert report_resp.status_code == 200
        report_data = report_resp.json()
        assert report_data["restaurant_id"] == 1 or report_data["restaurant_id"] == "1"
        assert report_data["analysis"]["status"] == "healthy"
        assert report_data["analysis"]["health_score"] == 100
        assert report_data["metrics"] is not None
        assert report_data["generated_at"] is not None
        
        # Test retrieve report missing
        report_missing_resp = client.get("/scheduling/report/999")
        assert report_missing_resp.status_code == 200
        missing_data = report_missing_resp.json()
        assert missing_data["restaurant_id"] == 999 or missing_data["restaurant_id"] == "999"
        assert missing_data["report"] is None
        assert "No report has been generated yet" in missing_data["message"]
        
    finally:
        sys.path = orig_path


def test_generate_schedule_llm_failure_fallback(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    import requests
    
    def mock_post(url, json=None, **kwargs):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Server Error"
        return mock_resp

    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post)
    
    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]
    
    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)
        
        from scheduling.router import REPORT_CACHE
        REPORT_CACHE.clear()
        
        from scheduling.db_manager import DBManager
        from scheduling.demand_service import DemandService
        
        mock_employees = [
            {"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
            {"EmpID": 4, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"},
            {"EmpID": 5, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
            {"EmpID": 6, "Role": "Employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        ]
        
        monkeypatch.setattr(DBManager, "get_employees_from_db", MagicMock(return_value=mock_employees))
        monkeypatch.setattr(DBManager, "get_overridden_schedules_for_week", MagicMock(return_value=[]))
        monkeypatch.setattr(DBManager, "delete_schedules_for_week", MagicMock(return_value=1))
        monkeypatch.setattr(DBManager, "save_schedule_to_db", MagicMock(return_value=1))
        
        monkeypatch.setattr(DemandService, "get_weekly_demand", MagicMock(return_value={}))
        
        response = client.post("/scheduling/generate/2?target_date=2026-05-27")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["llm_report_available"] is True
        
        report_resp = client.get("/scheduling/report/2")
        assert report_resp.status_code == 200
        report_data = report_resp.json()
        assert report_data["report"] is not None
        assert report_data["analysis"]["status"] == "healthy"
        
    finally:
        sys.path = orig_path


def test_generate_schedule_restaurant_76_capacity_exceeded(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    import requests

    def mock_post(url, json=None, **kwargs):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"status": "critical", "health_score": 30, "executive_summary": "Understaffed and capacity exceeded.", "findings": [{"metric": "workforce_capacity", "value": 30, "description": "Not enough staff"}], "recommendations": ["Hire more staff"], "warnings": ["Service delay"]}'
                }
            }]
        }
        return mock_resp

    monkeypatch.setenv("GROQ_API_KEY", "mock_key")
    monkeypatch.setattr(requests, "post", mock_post)

    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]

    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)

        from scheduling.router import REPORT_CACHE
        REPORT_CACHE.clear()

        from scheduling.db_manager import DBManager
        from scheduling.demand_service import DemandService

        mock_employees = [
            {"EmpID": i, "Role": "employee" if i > 3 else "chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None}
            for i in range(1, 11)
        ]
        
        mock_overrides = [
            {
                "ScheduleID": 100,
                "RestID": "76",
                "EmpID": 1,
                "Day": date(2026, 6, 1),
                "ShiftType": "Morning",
                "StartTime": time(8, 0),
                "EndTime": time(16, 0),
                "Source": "Manual",
                "IsOverridden": True
            }
        ]

        monkeypatch.setattr(DBManager, "get_employees_from_db", MagicMock(return_value=mock_employees))
        monkeypatch.setattr(DBManager, "get_overridden_schedules_for_week", MagicMock(return_value=mock_overrides))
        monkeypatch.setattr(DBManager, "delete_schedules_for_week", MagicMock(return_value=1))
        monkeypatch.setattr(DBManager, "save_schedule_to_db", MagicMock(return_value=0))

        high_demand = {
            date(2026, 6, 1): 250,
            date(2026, 6, 2): 250,
            date(2026, 6, 3): 250,
            date(2026, 6, 4): 250,
            date(2026, 6, 5): 250,
            date(2026, 6, 6): 250,
            date(2026, 6, 7): 250,
        }
        monkeypatch.setattr(DemandService, "get_weekly_demand", MagicMock(return_value=high_demand))

        response = client.post("/scheduling/generate/76?target_date=2026-06-01")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "partial_success"
        assert len(data["assignments"]) == 50
        override_assignments = [a for a in data["assignments"] if a["EmpID"] == 1 and a["Date"] == "2026-06-01" and a["ShiftType"] == "Morning"]
        assert len(override_assignments) == 1
        assert override_assignments[0]["Source"] == "Manual"
        assert data["coverage_percentage"] == 32.5
        assert data["llm_report_available"] is True

        report_resp = client.get("/scheduling/report/76")
        assert report_resp.status_code == 200
        report_data = report_resp.json()
        assert report_data["restaurant_id"] == 76 or report_data["restaurant_id"] == "76"
        assert report_data["analysis"]["status"] == "critical"
        assert report_data["analysis"]["status"] == "critical"

    finally:
        sys.path = orig_path


def test_generate_schedule_never_failed_or_infeasible(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    from scheduling.solver import ScheduleSolver

    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]

    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)

        from scheduling.db_manager import DBManager
        from scheduling.demand_service import DemandService

        mock_employees = [
            {"EmpID": 1, "Role": "chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"},
        ]

        monkeypatch.setattr(DBManager, "get_employees_from_db", MagicMock(return_value=mock_employees))
        monkeypatch.setattr(DBManager, "get_overridden_schedules_for_week", MagicMock(return_value=[]))
        monkeypatch.setattr(DBManager, "delete_schedules_for_week", MagicMock(return_value=1))
        monkeypatch.setattr(DBManager, "save_schedule_to_db", MagicMock(return_value=0))
        monkeypatch.setattr(DemandService, "get_weekly_demand", MagicMock(return_value={}))
        
        monkeypatch.setattr(ScheduleSolver, "solve", MagicMock(return_value={"assignments": [], "message": "Solver encountered internal error", "status": "failed", "metrics": {"total_required_shifts": 0, "total_available_capacity": 10, "missing_shifts": 0, "utilization_percentage": 0.0}, "violations": {"clopening_count": 0, "understaffing_count": 0}, "skipped_overrides": []}))
 
        response = client.post("/scheduling/generate/99?target_date=2026-06-01")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "partial_success"
        assert "Solver encountered internal error" in data["message"]
        
    finally:
        sys.path = orig_path


def test_generate_schedule_capacity_gap_warning(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    from scheduling.solver import ScheduleSolver

    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]

    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)

        from scheduling.db_manager import DBManager
        from scheduling.demand_service import DemandService

        mock_employees = [
            {"EmpID": 1, "Role": "chef", "WorkingDaysPerWeek": 1},
        ]

        monkeypatch.setattr(DBManager, "get_employees_from_db", MagicMock(return_value=mock_employees))
        monkeypatch.setattr(DBManager, "get_overridden_schedules_for_week", MagicMock(return_value=[]))
        monkeypatch.setattr(DBManager, "delete_schedules_for_week", MagicMock(return_value=1))
        monkeypatch.setattr(DBManager, "save_schedule_to_db", MagicMock(return_value=0))
        monkeypatch.setattr(DemandService, "get_weekly_demand", MagicMock(return_value={}))
        
        monkeypatch.setattr(ScheduleSolver, "solve", MagicMock(return_value={"assignments": [], "message": "Insufficient capacity", "status": "partial_success", "metrics": {"total_required_shifts": 10, "total_available_capacity": 1, "missing_shifts": 10, "utilization_percentage": 1000.0}, "violations": {"clopening_count": 0, "understaffing_count": 10}, "skipped_overrides": []}))
 
        response = client.post("/scheduling/generate/99?target_date=2026-06-01")
        assert response.status_code == 200
        data = response.json()
        
        warnings = data.get("warnings", [])
        assert any("Restaurant is understaffed. Required:" in w for w in warnings)
        
    finally:
        sys.path = orig_path


def test_calculate_required_staff_with_shift_specific_ratios():
    from scheduling.metrics import calculate_required_staff_for_shift
    from scheduling.models import RestaurantSettings
    
    # settings with specific ratios
    settings = RestaurantSettings(
        rest_id="test_rest",
        morning_shift_weight=0.6,
        night_shift_weight=0.4,
        productivity_ratio=10.0,
        morning_productivity_ratio=15.0,
        night_productivity_ratio=5.0
    )
    
    # demand on a day is 300
    daily_demand = {date(2026, 6, 1): 300}
    
    # Morning: demand = 300 * 0.6 = 180.
    # Required staff = 180 / 15 = 12.
    morning_staff = calculate_required_staff_for_shift("Morning", daily_demand, date(2026, 6, 1), settings)
    assert morning_staff == 12
    
    # Night: demand = 300 * 0.4 = 120.
    # Required staff = 120 / 5 = 24. Limit to max_staff_per_shift (12)
    night_staff = calculate_required_staff_for_shift("Night", daily_demand, date(2026, 6, 1), settings)
    assert night_staff == 12
    
    # Night with higher max_staff_per_shift
    night_staff_unlimited = calculate_required_staff_for_shift("Night", daily_demand, date(2026, 6, 1), settings, max_staff_per_shift=30)
    assert night_staff_unlimited == 24


def test_calculate_and_save_productivity_ratios_success(monkeypatch):
    from scheduling.db_manager import DBManager
    from scheduling.models import RestaurantSettings, ScheduleModel
    from database.models import Forecast
    from unittest.mock import MagicMock
    
    mock_session = MagicMock()
    db_manager = DBManager()
    monkeypatch.setattr(db_manager, "SessionLocal", MagicMock(return_value=mock_session))
    mock_session.__enter__.return_value = mock_session
    
    class MockForecastRow:
        def __init__(self, date, total_demand):
            self.date = date
            self.total_demand = total_demand
            
    mock_forecasts = [
        MockForecastRow(date(2026, 5, 20), 100.0),
        MockForecastRow(date(2026, 5, 21), 200.0),
        MockForecastRow(date(2026, 5, 22), 150.0),
        MockForecastRow(date(2026, 5, 23), 300.0),
    ]
    
    class MockScheduleRow:
        def __init__(self, date, shift_type, staff_count):
            self.date = date
            self.shift_type = shift_type
            self.staff_count = staff_count
            
    mock_schedules = [
        MockScheduleRow(date(2026, 5, 20), "Morning", 6),
        MockScheduleRow(date(2026, 5, 20), "Night", 4),
        MockScheduleRow(date(2026, 5, 21), "Morning", 12),
        MockScheduleRow(date(2026, 5, 21), "Night", 8),
        MockScheduleRow(date(2026, 5, 22), "Morning", 9),
        MockScheduleRow(date(2026, 5, 22), "Night", 6),
        MockScheduleRow(date(2026, 5, 23), "Morning", 18),
        MockScheduleRow(date(2026, 5, 23), "Night", 12),
    ]
    
    mock_settings = RestaurantSettings(
        rest_id="test_rest",
        morning_shift_weight=0.6,
        night_shift_weight=0.4,
        productivity_ratio=10.0,
        morning_productivity_ratio=10.0,
        night_productivity_ratio=10.0
    )
    
    def mock_query(*args):
        args_str = str(args)
        query_mock = MagicMock()
        if "Forecast" in args_str or "ExpectedOrders" in args_str:
            query_mock.filter.return_value.group_by.return_value.all.return_value = mock_forecasts
        elif "Schedule" in args_str or "ShiftType" in args_str:
            query_mock.filter.return_value.group_by.return_value.all.return_value = mock_schedules
        elif "RestaurantSettings" in args_str:
            query_mock.filter.return_value.first.return_value = mock_settings
        return query_mock
        
    mock_session.query.side_effect = mock_query
    
    ratios = db_manager.calculate_and_save_productivity_ratios("test_rest", days=10, anchor_date=date(2026, 5, 25))
    
    assert ratios["morning_productivity_ratio"] == pytest.approx(10.0)
    assert ratios["night_productivity_ratio"] == pytest.approx(10.0)
    assert mock_settings.morning_productivity_ratio == pytest.approx(10.0)
    assert mock_settings.night_productivity_ratio == pytest.approx(10.0)
    mock_session.commit.assert_called()


def test_calculate_and_save_productivity_ratios_outlier_filtering(monkeypatch):
    from scheduling.db_manager import DBManager
    from scheduling.models import RestaurantSettings, ScheduleModel
    from database.models import Forecast
    from unittest.mock import MagicMock
    
    mock_session = MagicMock()
    db_manager = DBManager()
    monkeypatch.setattr(db_manager, "SessionLocal", MagicMock(return_value=mock_session))
    mock_session.__enter__.return_value = mock_session
    
    class MockForecastRow:
        def __init__(self, date, total_demand):
            self.date = date
            self.total_demand = total_demand
            
    mock_forecasts = [
        MockForecastRow(date(2026, 5, 20), 100.0),
        MockForecastRow(date(2026, 5, 21), 100.0),
        MockForecastRow(date(2026, 5, 22), 100.0),
        MockForecastRow(date(2026, 5, 23), 100.0),
        MockForecastRow(date(2026, 5, 24), 100.0),
    ]
    
    class MockScheduleRow:
        def __init__(self, date, shift_type, staff_count):
            self.date = date
            self.shift_type = shift_type
            self.staff_count = staff_count
            
    mock_schedules = [
        MockScheduleRow(date(2026, 5, 20), "Morning", 6),
        MockScheduleRow(date(2026, 5, 21), "Morning", 6),
        MockScheduleRow(date(2026, 5, 22), "Morning", 6),
        MockScheduleRow(date(2026, 5, 23), "Morning", 6),
        MockScheduleRow(date(2026, 5, 24), "Morning", 1), # ratio = 60 (outlier)
    ]
    
    mock_settings = RestaurantSettings(
        rest_id="test_rest",
        morning_shift_weight=0.6,
        night_shift_weight=0.4,
        productivity_ratio=10.0,
        morning_productivity_ratio=10.0,
        night_productivity_ratio=10.0
    )
    
    def mock_query(*args):
        args_str = str(args)
        query_mock = MagicMock()
        if "Forecast" in args_str or "ExpectedOrders" in args_str:
            query_mock.filter.return_value.group_by.return_value.all.return_value = mock_forecasts
        elif "Schedule" in args_str or "ShiftType" in args_str:
            query_mock.filter.return_value.group_by.return_value.all.return_value = mock_schedules
        elif "RestaurantSettings" in args_str:
            query_mock.filter.return_value.first.return_value = mock_settings
        return query_mock
        
    mock_session.query.side_effect = mock_query
    
    ratios = db_manager.calculate_and_save_productivity_ratios("test_rest", days=10, anchor_date=date(2026, 5, 25))
    
    assert ratios["morning_productivity_ratio"] == pytest.approx(10.0)


def test_real_workforce_constraints_solver():
    from scheduling.solver import ScheduleSolver
    from scheduling.intelligence import analyze_schedule
    
    # 1. Prepare inputs: 3 chefs, 3 regular employees
    employees = [
        {"EmpID": 1, "Role": "chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 6, "Shif": None},
        {"EmpID": 2, "Role": "chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 3, "Role": "chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 4, "Role": "employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 6, "Shif": None},
        {"EmpID": 5, "Role": "employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
        {"EmpID": 6, "Role": "employee", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None},
    ]
    
    # Daily demand: 4 staff required per day (2 morning, 2 night)
    # Total required weekly shifts = 7 * 4 = 28
    # Total capacity = 6 + 5 + 5 + 6 + 5 + 5 = 32 shifts. Capacity is sufficient.
    daily_demand = {
        date(2026, 6, 1) + timedelta(days=i): 20
        for i in range(7)
    }
    
    # We will pass settings where we force required_staff per shift to be 2.
    class MockSettings:
        morning_shift_weight = 0.6
        night_shift_weight = 0.4
        productivity_ratio = 10.0
        morning_productivity_ratio = 10.0
        night_productivity_ratio = 10.0
        
    settings = MockSettings()
    
    solver = ScheduleSolver()
    output = solver.solve(employees, daily_demand, date(2026, 6, 1), overrides=[], settings=settings)
    
    assert output["status"] == "success"
    metrics = output["metrics"]
    assert "llm_metrics_payload" in metrics
    
    payload = metrics["llm_metrics_payload"]
    assert "workforce_metrics" in payload
    assert "capacity_metrics" in payload
    assert "coverage_metrics" in payload
    assert "workload_metrics" in payload
    assert "demand_metrics" in payload
    assert "off_day_metrics" in payload
    
    # Verify values inside workforce metrics
    assert payload["workforce_metrics"]["total_employees"] == 6
    assert payload["workforce_metrics"]["total_chefs"] == 3
    assert payload["workforce_metrics"]["total_regular_employees"] == 3
    
    # Verify values inside capacity metrics
    assert payload["capacity_metrics"]["total_available_capacity"] == 32
    
    # Run analyze_schedule and verify detailed diagnostics
    analysis = analyze_schedule(
        assignments=output["assignments"],
        daily_demand=daily_demand,
        employees=employees,
        status=output["status"],
        message=output["message"],
        target_date=date(2026, 6, 1)
    )
    
    diagnostics = analysis["diagnostics"]
    diag_modules = [d["module"] for d in diagnostics if "module" in d]
    
    assert "workforce_summary" in diag_modules
    assert "capacity_summary" in diag_modules
    assert "coverage_summary" in diag_modules
    assert "workload_distribution" in diag_modules
    assert "off_day_distribution" in diag_modules
    assert "chef_allocation_summary" in diag_modules


def test_view_weekly_schedule(monkeypatch):
    import sys
    import os
    from unittest.mock import MagicMock
    from datetime import date, time
    
    orig_path = list(sys.path)
    sys.path = [p for p in sys.path if not p.endswith("scheduling") and not os.path.basename(p) == "scheduling"]
    
    try:
        from fastapi.testclient import TestClient
        from app import app
        client = TestClient(app)
        
        from scheduling.db_manager import DBManager
        
        mock_assignments = [
            {
                "EmpID": 1,
                "Role": "chef",
                "ShiftType": "Morning",
                "Date": date(2026, 6, 2),
                "StartTime": time(8, 0),
                "EndTime": time(16, 0),
                "Source": "AI",
                "IsOverridden": False
            },
            {
                "EmpID": 2,
                "Role": "employee",
                "ShiftType": "Night",
                "Date": date(2026, 6, 1),
                "StartTime": time(16, 0),
                "EndTime": time(0, 0),
                "Source": "AI",
                "IsOverridden": False
            },
            {
                "EmpID": 3,
                "Role": "employee",
                "ShiftType": "Morning",
                "Date": date(2026, 6, 1),
                "StartTime": time(8, 0),
                "EndTime": time(16, 0),
                "Source": "Manual",
                "IsOverridden": True
            }
        ]
        
        monkeypatch.setattr(DBManager, "get_schedules_for_week", MagicMock(return_value=mock_assignments))
        
        response = client.get("/scheduling/76/view?target_date=2026-06-01")
        assert response.status_code == 200
        data = response.json()
        
        assert data["restaurant_id"] == "76"
        assert "tables" in data
        assert "morning" in data["tables"]
        assert "night" in data["tables"]
        
        # Verify morning shifts (sorted ascending: 2026-06-01, then 2026-06-02)
        morning_tables = data["tables"]["morning"]
        assert len(morning_tables) == 2
        assert morning_tables[0]["Date"] == "2026-06-01"
        assert len(morning_tables[0]["employees"]) == 1
        assert morning_tables[0]["employees"][0]["EmpID"] == 3
        assert morning_tables[0]["employees"][0]["Role"] == "employee"
        assert morning_tables[0]["employees"][0]["StartTime"] == "08:00:00"
        assert morning_tables[0]["employees"][0]["EndTime"] == "16:00:00"
        
        assert morning_tables[1]["Date"] == "2026-06-02"
        assert len(morning_tables[1]["employees"]) == 1
        assert morning_tables[1]["employees"][0]["EmpID"] == 1
        assert morning_tables[1]["employees"][0]["Role"] == "chef"
        assert morning_tables[1]["employees"][0]["StartTime"] == "08:00:00"
        
        # Verify night shifts
        night_tables = data["tables"]["night"]
        assert len(night_tables) == 1
        assert night_tables[0]["Date"] == "2026-06-01"
        assert len(night_tables[0]["employees"]) == 1
        assert night_tables[0]["employees"][0]["EmpID"] == 2
        assert night_tables[0]["employees"][0]["Role"] == "employee"
        assert night_tables[0]["employees"][0]["StartTime"] == "16:00:00"
        assert night_tables[0]["employees"][0]["EndTime"] == "00:00:00"
        
    finally:
        sys.path = orig_path


