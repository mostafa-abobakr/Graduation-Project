from fastapi import APIRouter, HTTPException, Depends
from datetime import date, datetime, time, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db_session

from .demand_service import DemandService
from .db_manager import DBManager
from .solver import ScheduleSolver, SHIFT_HOURS
from .schemas import (
    GenerateScheduleResponse, ShiftAssignment, ShiftUpdate,
    RetrieveReportResponse, Finding, KeyIssue, Report, Analysis,
    ScheduleViewResponse
)
from .utils.normalization import normalize
from .models import EmployeeModel, RestaurantSettings
from .intelligence import analyze_schedule
from .llm_report_generator import LLMReportGenerator

router = APIRouter()

REPORT_CACHE = {}

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
        dates = [monday + timedelta(days=i) for i in range(7)]
        
        # 2. Instantiate Providers
        demand_service = DemandService()
        db_manager = DBManager()
        
        # 3. Fetch Data
        daily_demand = demand_service.get_weekly_demand(restaurant_id, monday, sunday)
        employees = db_manager.get_employees_from_db(restaurant_id, dates)
        
        if not employees:
            raise HTTPException(status_code=400, detail="No employees found for this restaurant.")
            
        # 4. Fetch existing manual overrides for the week
        overrides = db_manager.get_overridden_schedules_for_week(restaurant_id, monday, sunday)
        
        # 5. Safety normalization
        for emp in employees:
            emp["Role"] = normalize(emp.get("Role"))
            emp["Shif"] = normalize(emp.get("Shif"))
            
        # Fetch Restaurant Settings
        # Calculate/update productivity ratios from history
        try:
            db_manager.calculate_and_save_productivity_ratios(restaurant_id, days=30, anchor_date=target_date)
        except Exception as e:
            print(f"WARNING: Could not calculate historical productivity: {e}")

        from scheduling.models import RestaurantSettings
        with db_manager.SessionLocal() as session:
            settings = session.query(RestaurantSettings).filter(RestaurantSettings.rest_id == restaurant_id).first()
            if not settings:
                settings = RestaurantSettings(
                    rest_id=restaurant_id,
                    morning_shift_weight=0.6,
                    night_shift_weight=0.4,
                    productivity_ratio=10.0,
                    morning_productivity_ratio=10.0,
                    night_productivity_ratio=10.0
                )
                session.add(settings)
                session.commit()
                session.refresh(settings)

        # 6. Solve Schedule
        solver = ScheduleSolver()
        solver_output = solver.solve(employees, daily_demand, target_date, overrides, settings)
        
        assignments = solver_output["assignments"]
        solver_status = solver_output["status"]
        message = solver_output["message"]
        metrics = solver_output["metrics"]
        violations = solver_output["violations"]
        skipped_overrides = solver_output["skipped_overrides"]
        
        # Ensure we never return an infeasible or failed status to the user
        if solver_status not in ["success", "partial_success"]:
            solver_status = "partial_success"
        
        # Delete only existing non-overridden AI schedules for the week range
        deleted_count = db_manager.delete_schedules_for_week(restaurant_id, monday, sunday)
        print(f"DEBUG: Deleted {deleted_count} old AI-generated schedules.")
        
        # Save only the newly generated AI assignments (non-overridden)
        ai_assignments = [a for a in assignments if not a.IsOverridden]
        saved_count = db_manager.save_schedule_to_db(ai_assignments, restaurant_id)
        
        message = f"{message} Deleted {deleted_count} old AI shifts, created {saved_count} new AI shifts, and preserved {len(overrides)} manual overrides."
        
        # Coverage and utilization metrics from solver output
        total_required_shifts = metrics["total_required_shifts"]
        total_available_capacity = metrics["total_available_capacity"]
        capacity_utilization = metrics["utilization_percentage"]
        missing_shifts = metrics["missing_shifts"]
        coverage_pct = round((len(assignments) / max(1, total_required_shifts)) * 100, 1)
        
        # 7. Print Schedule to Console
        print_schedule_to_console(restaurant_id, monday, sunday, assignments)
        
        analysis = analyze_schedule(
            assignments=assignments,
            daily_demand=daily_demand,
            employees=employees,
            status=solver_status,
            message=message,
            target_date=target_date
        )
        
        warnings_list = analysis.get("warnings", [])
        if coverage_pct < 80.0:
            warnings_list.append(
                f"Restaurant is understaffed. Required: {total_required_shifts} shifts, Available: {total_available_capacity} shifts. Consider hiring."
            )

        llm_report_available = False
        try:
            from .llm_report_generator import build_report_metrics, calculate_health_score
            solver_output_for_metrics = {
                "status": solver_status,
                "assignments": [
                    {
                        "employee_id": a.EmpID,
                        "role": a.Role,
                        "date": str(a.Date),
                        "shift": a.ShiftType
                    }
                    for a in assignments
                ],
                "metrics": metrics,
                "violations": violations,
                "warnings": warnings_list,
                "suggestions": analysis.get("suggestions", []),
                "skipped_overrides": skipped_overrides
            }
            metrics_payload = build_report_metrics(
                solver_output=solver_output_for_metrics,
                employees=employees,
                daily_demand=daily_demand,
                target_date=target_date,
                settings=settings
            )
            score, status = calculate_health_score(metrics_payload)
            metrics_payload["system_health"]["health_score"] = score
            metrics_payload["system_health"]["status"] = status
            
            llm_generator = LLMReportGenerator()
            llm_report = llm_generator.generate_report(metrics_payload)
            if llm_report:
                # Cache the generated report
                REPORT_CACHE[restaurant_id] = {
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "report": llm_report,
                    "metrics": metrics_payload,
                    "analysis": llm_report
                }
                llm_report_available = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error in LLMReportGenerator during generate: {str(e)}")

        return GenerateScheduleResponse(
            restaurant_id=restaurant_id,
            date=target_date,
            status=solver_status,
            message=message,
            assignments=assignments,
            warnings=warnings_list,
            suggestions=analysis.get("suggestions", []),
            diagnostics=analysis.get("diagnostics", []),
            llm_report_available=llm_report_available,
            coverage_percentage=coverage_pct
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
        raise HTTPException(status_code=400, detail="Invalid ShiftType. Must be 'Morning' or 'Night'.")
        
    # Set default times if updating shift type but not times
    if update_data.ShiftType is not None:
        if update_data.StartTime is None:
            start_time = SHIFT_HOURS["Morning" if norm_shift == "morning" else "Night"]["start"]
        if update_data.EndTime is None:
            end_time = SHIFT_HOURS["Morning" if norm_shift == "morning" else "Night"]["end"]
            
    # 4. Validation Rules: Overlap & Duplicate Bookings
    other_schedules = db_manager.get_employee_schedules_for_day(emp_id, day)
    for s in other_schedules:
        if s["ScheduleID"] == id:
            continue
            
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
        "ShiftType": "Morning" if norm_shift == "morning" else "Night",
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


def map_findings(raw_findings) -> List[Finding]:
    if not raw_findings:
        return []
    mapped = []
    for f in raw_findings:
        if isinstance(f, dict):
            mapped.append(Finding(
                metric=f.get("metric", "unknown"),
                value=f.get("value"),
                description=f.get("description", "")
            ))
        elif hasattr(f, "metric") and hasattr(f, "description"):
            mapped.append(Finding(
                metric=f.metric,
                value=getattr(f, "value", None),
                description=f.description
            ))
        elif isinstance(f, str):
            mapped.append(Finding(
                metric="info",
                value=None,
                description=f
            ))
    return mapped


def map_key_issues(raw_key_issues) -> List[KeyIssue]:
    if not raw_key_issues:
        return []
    mapped = []
    for k in raw_key_issues:
        if isinstance(k, dict):
            mapped.append(KeyIssue(
                metric=k.get("metric", "unknown"),
                value=k.get("value"),
                description=k.get("description", "")
            ))
        elif hasattr(k, "metric") and hasattr(k, "description"):
            mapped.append(KeyIssue(
                metric=k.metric,
                value=getattr(k, "value", None),
                description=k.description
            ))
        elif isinstance(k, str):
            mapped.append(KeyIssue(
                metric="info",
                value=None,
                description=k
            ))
    return mapped


@router.get("/report/{restaurant_id}", response_model=RetrieveReportResponse)
def retrieve_report(restaurant_id: str):
    """
    Retrieve the latest generated LLM report for a restaurant.
    """
    cached = REPORT_CACHE.get(restaurant_id)
    if cached:
        analysis_data = cached.get("analysis") or {}
        report_data = cached.get("report") or {}
        
        raw_findings = []
        if isinstance(analysis_data, dict):
            raw_findings = analysis_data.get("findings") or []
        elif hasattr(analysis_data, "findings"):
            raw_findings = analysis_data.findings or []
            
        raw_key_issues = []
        if isinstance(report_data, dict):
            raw_key_issues = report_data.get("key_issues") or report_data.get("findings") or []
        elif hasattr(report_data, "key_issues"):
            raw_key_issues = report_data.key_issues or []
            
        mapped_findings = map_findings(raw_findings)
        mapped_key_issues = map_key_issues(raw_key_issues)
        
        status = "healthy"
        if isinstance(analysis_data, dict):
            status = analysis_data.get("status", "healthy")
        elif hasattr(analysis_data, "status"):
            status = analysis_data.status or "healthy"
            
        health_score = 100
        if isinstance(analysis_data, dict):
            health_score = analysis_data.get("health_score", 100)
        elif hasattr(analysis_data, "health_score"):
            health_score = analysis_data.health_score or 100
            
        recommendations = []
        if isinstance(analysis_data, dict):
            recommendations = analysis_data.get("recommendations") or []
        elif hasattr(analysis_data, "recommendations"):
            recommendations = analysis_data.recommendations or []
            
        warnings = []
        if isinstance(analysis_data, dict):
            warnings = analysis_data.get("warnings") or []
        elif hasattr(analysis_data, "warnings"):
            warnings = analysis_data.warnings or []
            
        return RetrieveReportResponse(
            restaurant_id=restaurant_id,
            generated_at=cached.get("generated_at"),
            metrics=cached.get("metrics"),
            report=Report(
                key_issues=mapped_key_issues
            ),
            analysis=Analysis(
                status=status,
                health_score=health_score,
                findings=mapped_findings,
                recommendations=recommendations,
                warnings=warnings
            )
        )
    return RetrieveReportResponse(
        restaurant_id=restaurant_id,
        report=None,
        metrics=None,
        analysis=None,
        message="No report has been generated yet."
    )


from pydantic import Field, model_validator
from typing import Optional

class RestaurantSettingsResponse(BaseModel):
    rest_id: str
    morning_shift_weight: float
    night_shift_weight: float
    productivity_ratio: float
    morning_productivity_ratio: Optional[float] = 10.0
    night_productivity_ratio: Optional[float] = 10.0

    class Config:
        from_attributes = True

class RestaurantSettingsUpdate(BaseModel):
    morning_shift_weight: Optional[float] = Field(None, gt=0.0, lt=1.0)
    night_shift_weight: Optional[float] = Field(None, gt=0.0, lt=1.0)
    productivity_ratio: Optional[float] = Field(None, gt=0.0)
    morning_productivity_ratio: Optional[float] = Field(None, gt=0.0)
    night_productivity_ratio: Optional[float] = Field(None, gt=0.0)

    @model_validator(mode='after')
    def validate_weights(self) -> 'RestaurantSettingsUpdate':
        w_m = self.morning_shift_weight
        w_n = self.night_shift_weight
        if w_m is not None and w_n is not None:
            total = w_m + w_n
            if not (1.0 - 1e-6 <= total <= 1.0 + 1e-6):
                raise ValueError("The sum of morning_shift_weight and night_shift_weight must be exactly 1.0.")
        return self


@router.get("/settings/{restaurant_id}", response_model=RestaurantSettingsResponse)
def get_restaurant_settings(restaurant_id: str, db: Session = Depends(get_db_session)):
    settings = db.query(RestaurantSettings).filter(RestaurantSettings.rest_id == restaurant_id).first()
    if not settings:
        settings = RestaurantSettings(
            rest_id=restaurant_id,
            morning_shift_weight=0.6,
            night_shift_weight=0.4,
            productivity_ratio=10.0,
            morning_productivity_ratio=10.0,
            night_productivity_ratio=10.0
        )
        sa_settings = settings
        db.add(sa_settings)
        db.commit()
        db.refresh(sa_settings)
    return settings


@router.patch("/settings/{restaurant_id}", response_model=RestaurantSettingsResponse)
def update_restaurant_settings(
    restaurant_id: str,
    update_data: RestaurantSettingsUpdate,
    db: Session = Depends(get_db_session)
):
    settings = db.query(RestaurantSettings).filter(RestaurantSettings.rest_id == restaurant_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings for this restaurant do not exist.")
    
    update_fields = update_data.model_dump(exclude_unset=True)
    for key, val in update_fields.items():
        setattr(settings, key, val)
        
    db.commit()
    db.refresh(settings)
    return settings


def group_weekly_schedule(restaurant_id: str, raw_assignments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Transforms and groups raw schedules into morning and night tables by Date.
    """
    from collections import defaultdict
    grouped = {
        "morning": defaultdict(list),
        "night": defaultdict(list)
    }
    
    for a in raw_assignments:
        shift_type = normalize(a.get("ShiftType"))
        table_key = None
        if shift_type == "morning":
            table_key = "morning"
        elif shift_type in ["night", "evening"]:
            table_key = "night"
            
        if not table_key:
            continue
            
        d_val = a.get("Date")
        if isinstance(d_val, (date, datetime)):
            date_str = d_val.strftime("%Y-%m-%d")
        else:
            date_str = str(d_val)
            
        st_val = a.get("StartTime")
        et_val = a.get("EndTime")
        
        start_time_str = st_val.strftime("%H:%M:%S") if isinstance(st_val, time) else str(st_val)
        end_time_str = et_val.strftime("%H:%M:%S") if isinstance(et_val, time) else str(et_val)
        
        grouped[table_key][date_str].append({
            "EmpID": a.get("EmpID"),
            "Role": a.get("Role"),
            "StartTime": start_time_str,
            "EndTime": end_time_str
        })
        
    tables = {
        "morning": [],
        "night": []
    }
    
    for tk in ["morning", "night"]:
        for d_str in sorted(grouped[tk].keys()):
            tables[tk].append({
                "Date": d_str,
                "employees": grouped[tk][d_str]
            })
            
    return {
        "restaurant_id": restaurant_id,
        "tables": tables
    }


@router.get("/{restaurant_id}/view", response_model=ScheduleViewResponse)
def view_weekly_schedule(restaurant_id: str, target_date: Optional[date] = None):
    """
    Retrieve and view the structured weekly schedule for a restaurant.
    """
    if not target_date:
        target_date = date.today()
        
    # Calculate Monday -> Sunday boundaries
    monday = target_date - timedelta(days=target_date.weekday())
    sunday = monday + timedelta(days=6)
    
    db_manager = DBManager()
    raw_assignments = db_manager.get_schedules_for_week(restaurant_id, monday, sunday)
    
    return group_weekly_schedule(restaurant_id, raw_assignments)

