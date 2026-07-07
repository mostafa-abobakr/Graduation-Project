from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import date, time, datetime

class ForecastData(BaseModel):
    timestamp: str # ISO string format
    predicted_demand: int

class EmployeeData(BaseModel):
    EmpID: int
    Role: str
    WorkingHoursPerDay: int
    WorkingDaysPerWeek: int
    Shif: Optional[str] = None # 'Morning', 'Evening', or None

class ShiftAssignment(BaseModel):
    EmpID: int
    Role: str
    ShiftType: str
    Date: date
    StartTime: time
    EndTime: time
    Source: Optional[str] = "AI"
    IsOverridden: Optional[bool] = False
    UpdatedAt: Optional[datetime] = None
    
    def dict_for_display(self):
        return {
            "EmpID": self.EmpID,
            "Role": self.Role,
            "ShiftType": self.ShiftType,
            "StartTime": self.StartTime.strftime("%H:%M"),
            "EndTime": self.EndTime.strftime("%H:%M"),
            "Source": self.Source,
            "IsOverridden": self.IsOverridden,
            "UpdatedAt": self.UpdatedAt.isoformat() if self.UpdatedAt else None
        }

class ShiftUpdate(BaseModel):
    EmpID: Optional[int] = None
    ShiftType: Optional[str] = None
    StartTime: Optional[time] = None
    EndTime: Optional[time] = None
    Day: Optional[date] = None

class GenerateScheduleResponse(BaseModel):
    restaurant_id: str
    date: date
    status: str
    message: Optional[str] = None
    assignments: List[ShiftAssignment] = []
    warnings: List[str] = []
    suggestions: List[str] = []
    diagnostics: List[Dict[str, Any]] = []
    llm_report_available: Optional[bool] = False
    coverage_percentage: Optional[float] = None



class AvailabilityDay(BaseModel):
    date: str
    shifts: List[str]

class EmployeeInput(BaseModel):
    id: int
    role: str
    availability: List[AvailabilityDay]
    max_shifts_per_week: int
    preferred_shift: Optional[str] = None

class ShiftDemand(BaseModel):
    required_employees: int
    required_chefs: int

class DayDemand(BaseModel):
    date: str
    shifts: Dict[str, ShiftDemand]

class SolveScheduleRequest(BaseModel):
    employees: List[EmployeeInput]
    demand: List[DayDemand]

class AssignmentOutput(BaseModel):
    employee_id: int
    role: str
    date: str
    shift: str

class SolveScheduleSummary(BaseModel):
    total_shifts: int
    chef_coverage_ok: bool
    employee_coverage_ok: bool

class InfeasibleMissing(BaseModel):
    chefs: Optional[int] = None
    employees: Optional[int] = None

class SolveScheduleResponse(BaseModel):
    status: str
    coverage: Optional[str] = None
    reason: Optional[str] = None
    missing: Optional[InfeasibleMissing] = None
    missing_coverage: Optional[InfeasibleMissing] = None
    conflicts: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    assignments: Optional[List[AssignmentOutput]] = None
    summary: Optional[SolveScheduleSummary] = None
    llm_report: Optional[str] = None

class Finding(BaseModel):
    metric: str
    value: Optional[Union[float, int]] = None
    description: str


class KeyIssue(BaseModel):
    metric: str
    value: Optional[Union[float, int]] = None
    description: str


class Report(BaseModel):
    key_issues: List[KeyIssue]


class Analysis(BaseModel):
    status: str
    health_score: int
    findings: List[Finding]
    recommendations: List[str]
    warnings: List[str]


class RetrieveReportResponse(BaseModel):
    restaurant_id: Union[int, str]
    generated_at: Optional[str] = None
    report: Optional[Report] = None
    metrics: Optional[Dict[str, Any]] = None
    analysis: Optional[Analysis] = None
    message: Optional[str] = None


class ScheduleViewEmployee(BaseModel):
    EmpID: int
    Role: str
    StartTime: str
    EndTime: str


class ScheduleViewDay(BaseModel):
    Date: str
    employees: List[ScheduleViewEmployee]


class ScheduleViewTables(BaseModel):
    morning: List[ScheduleViewDay]
    night: List[ScheduleViewDay]


class ScheduleViewResponse(BaseModel):
    restaurant_id: str
    tables: ScheduleViewTables




