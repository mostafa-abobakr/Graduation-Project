import pytest
from datetime import date, time, datetime, timedelta
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from scheduling.router import generate_schedule, update_schedule_shift
from scheduling.schemas import ShiftUpdate, ShiftAssignment
from scheduling.solver import ScheduleSolver

def test_week_boundary_calculation():
    # Given a target date, Monday should be weekday 0, Sunday weekday 6
    target = date(2026, 5, 27) # Wednesday
    monday = target - timedelta(days=target.weekday())
    sunday = monday + timedelta(days=6)
    
    assert monday == date(2026, 5, 25)
    assert sunday == date(2026, 5, 31)

@patch("scheduling.router.SchedulingAPIClient")
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
    mock_api.fetch_forecast_data_for_range.return_value = []
    
    # Mock overrides (none)
    mock_db.get_overridden_schedules_for_week.return_value = []
    
    # Mock DB write operations
    mock_db.delete_schedules_for_week.return_value = 0
    mock_db.save_schedule_to_db.return_value = 28 # (1 chef + 1 employee) * 2 shifts/day * 7 days
    
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

@patch("scheduling.router.SchedulingAPIClient")
@patch("scheduling.router.DBManager")
def test_weekly_generation_with_overrides(mock_db_class, mock_api_class):
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
    mock_api.fetch_forecast_data_for_range.return_value = []
    
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
        if a.EmpID == 1 and a.Date == date(2026, 5, 26) and a.ShiftType == "Evening"
    ]
    assert len(tuesday_evening_chef1) == 1
    assert tuesday_evening_chef1[0].Source == "Manual"
    assert tuesday_evening_chef1[0].IsOverridden is True
    
    # Chef 1 must NOT be assigned to Morning on Tuesday May 26 (max 1 shift per day constraint)
    tuesday_morning_chef1 = [
        a for a in response.assignments
        if a.EmpID == 1 and a.Date == date(2026, 5, 26) and a.ShiftType == "Morning"
    ]
    assert len(tuesday_morning_chef1) == 0

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

@patch("scheduling.router.DBManager")
def test_seed_mock_employees(mock_db_class):
    mock_db = MagicMock()
    mock_db_class.return_value = mock_db
    
    mock_session = MagicMock()
    mock_db.SessionLocal.return_value.__enter__.return_value = mock_session
    
    from scheduling.router import seed_mock_employees, SeedEmployeesRequest
    
    req = SeedEmployeesRequest(chefs=2, employees=3)
    response = seed_mock_employees("54", req)
    
    assert response["status"] == "success"
    assert response["restaurant_id"] == 54
    assert response["created"] == 5
    
    # Assert session.add was called 5 times
    assert mock_session.add.call_count == 5
    # Assert commit was called
    mock_session.commit.assert_called_once()
