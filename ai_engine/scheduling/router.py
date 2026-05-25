from fastapi import APIRouter, HTTPException
from datetime import date, datetime, time, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel

from .api_client import SchedulingAPIClient
from .db_manager import DBManager
from .solver import ScheduleSolver, SHIFT_HOURS
from .schemas import GenerateScheduleResponse, ShiftAssignment, ShiftUpdate
from .utils.normalization import normalize
from .models import EmployeeModel

router = APIRouter()

def shifts_overlap(s1_start: time, s1_end: time, s1_date: date, s2_start: time, s2_end: time, s2_date: date) -> bool:
    """Helper to check if two shifts overlap, accounting for midnight wrap-around."""
    def to_dt(t, d):
        if t == time(0, 0):
            return datetime.combine(d + timedelta(days=1), t)
        return datetime.combine(d, t)
    
    dt1_start = to_dt(s1_start, s1_date)
    dt1_end = to_dt(s1_end, s1_date)
    if dt1_end <= dt1_start and s1_end != time(0, 0):
        dt1_end += timedelta(days=1)
        
    dt2_start = to_dt(s2_start, s2_date)
    dt2_end = to_dt(s2_end, s2_date)
    if dt2_end <= dt2_start and s2_end != time(0, 0):
        dt2_end += timedelta(days=1)
        
    return dt1_start < dt2_end and dt2_start < dt1_end

def print_schedule_to_console(restaurant_id: str, start_date: date, end_date: date, assignments: list):
    """Helper to pretty-print the weekly schedule to the terminal."""
    print("\n" + "="*70)
    print(f" SCHEDULE GENERATED FOR {restaurant_id} FROM {start_date} TO {end_date} ")
    print("="*70)
    
    if not assignments:
        print(">> No assignments generated (Solver failed or constraints too tight).")
        print("="*70 + "\n")
        return

    # Group by day
    from collections import defaultdict
    by_day = defaultdict(list)
    for a in assignments:
        by_day[a.Date].append(a)
        
    for day in sorted(by_day.keys()):
        day_assignments = by_day[day]
        print(f"\n--- {day.strftime('%A %Y-%m-%d')} ---")
        morning_staff = [a for a in day_assignments if a.ShiftType == "Morning"]
        night_staff = [a for a in day_assignments if a.ShiftType in ["Evening", "Night"]]
        
        def print_shift(shift_name, staff_list):
            print(f"  [{shift_name} Shift] (Total Staff: {len(staff_list)})")
            print(f"    {'EmpID':<10} | {'Role':<15} | {'Time':<15} | {'Source':<10}")
            print("    " + "-" * 55)
            for s in sorted(staff_list, key=lambda x: (x.Role, x.EmpID)):
                time_str = f"{s.StartTime.strftime('%H:%M')} - {s.EndTime.strftime('%H:%M')}"
                print(f"    {s.EmpID:<10} | {s.Role:<15} | {time_str:<15} | {s.Source:<10}")
        
        print_shift("Morning", morning_staff)
        print_shift("Night", night_staff)
    print("\n" + "="*70 + "\n")


@router.post("/generate/{restaurant_id}", response_model=GenerateScheduleResponse)
def generate_schedule(restaurant_id: str, target_date: date = None):
    """
    Generate an optimized weekly schedule (Monday -> Sunday) for the given restaurant.
    Preserves manual overrides and rebuilds AI assignments.
    """
    if not target_date:
        target_date = date.today()
        
    try:
        # 1. Calculate boundaries (Monday -> Sunday)
        monday = target_date - timedelta(days=target_date.weekday())
        sunday = monday + timedelta(days=6)
        
        # 2. Instantiate Providers
        api_client = SchedulingAPIClient()
        db_manager = DBManager()
        
        # 3. Fetch Data
        forecasts = api_client.fetch_forecast_data_for_range(restaurant_id, monday, sunday)
        employees = db_manager.get_employees_from_db(restaurant_id)
        
        if not employees:
            raise HTTPException(status_code=400, detail="No employees found for this restaurant.")
            
        # 4. Fetch existing manual overrides for the week
        overrides = db_manager.get_overridden_schedules_for_week(restaurant_id, monday, sunday)
        
        # 5. Safety normalization
        for emp in employees:
            emp["Role"] = normalize(emp.get("Role"))
            emp["Shif"] = normalize(emp.get("Shif"))
            
        # 6. Solve Schedule
        solver = ScheduleSolver()
        assignments, message, solver_status = solver.solve(employees, forecasts, target_date, overrides)
        
        if solver_status in ["success", "partial_success"]:
            # Delete only existing non-overridden AI schedules for the week range
            deleted_count = db_manager.delete_schedules_for_week(restaurant_id, monday, sunday)
            print(f"DEBUG: Deleted {deleted_count} old AI-generated schedules.")
            
            # Save only the newly generated AI assignments (non-overridden)
            ai_assignments = [a for a in assignments if not a.IsOverridden]
            saved_count = db_manager.save_schedule_to_db(ai_assignments, restaurant_id)
            
            message = f"{message} Deleted {deleted_count} old AI shifts, created {saved_count} new AI shifts, and preserved {len(overrides)} manual overrides."
            
        # 7. Print Schedule to Console
        print_schedule_to_console(restaurant_id, monday, sunday, assignments)
        
        return GenerateScheduleResponse(
            restaurant_id=restaurant_id,
            date=target_date,
            status=solver_status,
            message=message,
            assignments=assignments
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate schedule: {str(e)}")


@router.patch("/schedule/shift/{id}")
def update_schedule_shift(id: int, update_data: ShiftUpdate):
    """
    Safely update a shift assignment (triggered by frontend drag & drop).
    Automatically flags it as overridden and performs validation rules.
    """
    db_manager = DBManager()
    
    # 1. Fetch existing assignment
    existing = db_manager.get_schedule_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Schedule shift with ID {id} not found.")
        
    # 2. Merge updates
    emp_id = update_data.EmpID if update_data.EmpID is not None else existing["EmpID"]
    day = update_data.Day if update_data.Day is not None else existing["Day"]
    shift_type_raw = update_data.ShiftType if update_data.ShiftType is not None else existing["ShiftType"]
    
    start_time = update_data.StartTime if update_data.StartTime is not None else existing["StartTime"]
    end_time = update_data.EndTime if update_data.EndTime is not None else existing["EndTime"]
    
    # 3. Normalize and validate ShiftType
    norm_shift = normalize(shift_type_raw)
    if norm_shift not in ["morning", "night"]:
        raise HTTPException(status_code=400, detail="Invalid ShiftType. Must be 'Morning' or 'Evening'.")
        
    # Set default times if updating shift type but not times
    if update_data.ShiftType is not None:
        if update_data.StartTime is None:
            start_time = SHIFT_HOURS["Morning" if norm_shift == "morning" else "Evening"]["start"]
        if update_data.EndTime is None:
            end_time = SHIFT_HOURS["Morning" if norm_shift == "morning" else "Evening"]["end"]
            
    # 4. Validation Rules: Overlap & Duplicate Bookings
    other_schedules = db_manager.get_employee_schedules_for_day(emp_id, day)
    for s in other_schedules:
        if s["ScheduleID"] == id:
            continue # skip checking self
            
        # Prevent double booking of same shift type
        if normalize(s["ShiftType"]) == norm_shift:
            raise HTTPException(status_code=400, detail=f"Employee {emp_id} is already booked on a {shift_type_raw} shift on {day}.")
            
        # Prevent overlapping shift times
        if shifts_overlap(start_time, end_time, day, s["StartTime"], s["EndTime"], s["Day"]):
            raise HTTPException(status_code=400, detail=f"The proposed shift overlaps with another shift for employee {emp_id} on {day}.")
            
    # 5. Apply updates
    update_fields = {
        "EmpID": emp_id,
        "Day": day,
        "ShiftType": "Morning" if norm_shift == "morning" else "Evening",
        "StartTime": start_time,
        "EndTime": end_time
    }
    
    try:
        updated = db_manager.update_schedule(id, update_fields)
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update database record.")
            
        return {
            "status": "success",
            "message": "Shift updated successfully and marked as manual override.",
            "data": updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SeedEmployeesRequest(BaseModel):
    chefs: int
    employees: int

@router.post("/employees/seed/{restaurant_id}")
def seed_mock_employees(restaurant_id: str, request_data: SeedEmployeesRequest):
    """
    Seed mock employees dynamically in the database for testing.
    """
    try:
        rest_id_int = int(restaurant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="restaurant_id must be an integer.")

    db_manager = DBManager()
    with db_manager.SessionLocal() as session:
        try:
            # Clear existing mock employees for this restaurant to avoid duplicate email/phone or accumulation
            session.query(EmployeeModel).filter(
                EmployeeModel.RestID == rest_id_int,
                EmployeeModel.Status == "MOCK"
            ).delete(synchronize_session=False)

            created_count = 0
            
            # Seed Chefs
            for i in range(1, request_data.chefs + 1):
                new_emp = EmployeeModel(
                    RestID=rest_id_int,
                    FullName=f"Mock Chef {i}",
                    Role="Chef",
                    Salary=3000.0,
                    Phone=f"0100000000{i}",
                    HireDate=datetime.utcnow(),
                    Status="MOCK",
                    CreatedAt=datetime.utcnow(),
                    UpdatedAt=datetime.utcnow(),
                    Email=f"mock_chef_{rest_id_int}_{i}@test.local",
                    HashedPassword="123456",
                    Shif="Any",
                    WorkingDaysPerWeek=5,
                    WorkingHoursPerDay=8
                )
                session.add(new_emp)
                created_count += 1
                
            # Seed Regular Employees
            for i in range(1, request_data.employees + 1):
                new_emp = EmployeeModel(
                    RestID=rest_id_int,
                    FullName=f"Mock Employee {i}",
                    Role="Employee",
                    Salary=2500.0,
                    Phone=f"0100000000{i}",
                    HireDate=datetime.utcnow(),
                    Status="MOCK",
                    CreatedAt=datetime.utcnow(),
                    UpdatedAt=datetime.utcnow(),
                    Email=f"mock_employee_{rest_id_int}_{i}@test.local",
                    HashedPassword="123456",
                    Shif="Any",
                    WorkingDaysPerWeek=5,
                    WorkingHoursPerDay=8
                )
                session.add(new_emp)
                created_count += 1
                
            session.commit()
            
            return {
                "status": "success",
                "restaurant_id": rest_id_int,
                "created": created_count
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to seed mock employees: {str(e)}")
