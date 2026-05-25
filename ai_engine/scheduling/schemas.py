from pydantic import BaseModel
from typing import Optional, List
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
    assignments: List[ShiftAssignment]
