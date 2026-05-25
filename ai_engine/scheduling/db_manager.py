from typing import List, Dict, Any, Optional
from database.connection import get_engine
from sqlalchemy.orm import sessionmaker
from scheduling.models import EmployeeModel, ScheduleModel
from scheduling.schemas import ShiftAssignment
from scheduling.utils.normalization import normalize
from datetime import date, datetime

class DBManager:
    def __init__(self):
        self.engine = get_engine()
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_employees_from_db(self, restaurant_id: str) -> List[Dict[str, Any]]:
        print(f"DEBUG: Fetching employees for restaurant_id: {restaurant_id}")
        with self.SessionLocal() as session:
            # Using RestID to filter for the specific restaurant
            employees = session.query(EmployeeModel).filter(EmployeeModel.RestID == restaurant_id).all()
            
            print(f"DEBUG: Number of employees fetched: {len(employees)}")
            
            chefs_count = sum(1 for e in employees if e.Role == 'Chef')
            regular_count = sum(1 for e in employees if e.Role == 'Employee')
            print(f"DEBUG: Chefs found: {chefs_count}, Regular employees found: {regular_count}")
            
            employee_list = []
            for e in employees:
                employee_list.append({
                    "EmpID": e.EmpID,
                    "Role": normalize(e.Role),
                    "Shif": normalize(e.Shif),
                    "WorkingDaysPerWeek": e.WorkingDaysPerWeek,
                    "WorkingHoursPerDay": e.WorkingHoursPerDay,
                })
            return employee_list
            
    def save_schedule_to_db(self, assignments: List[ShiftAssignment], restaurant_id: str) -> int:
        if not assignments:
            return 0
            
        with self.SessionLocal() as session:
            try:
                db_assignments = []
                for a in assignments:
                    new_sched = ScheduleModel(
                        RestID=restaurant_id,
                        EmpID=a.EmpID,
                        Day=a.Date,
                        ShiftType=a.ShiftType,
                        StartTime=a.StartTime,
                        EndTime=a.EndTime,
                        Source=a.Source or "AI",
                        IsOverridden=a.IsOverridden or False,
                        UpdatedAt=a.UpdatedAt or datetime.utcnow()
                    )
                    db_assignments.append(new_sched)
                
                session.add_all(db_assignments)
                session.commit()
                return len(db_assignments)
            except Exception as e:
                session.rollback()
                print(f"Error saving schedule to DB: {e}")
                raise Exception(f"Failed to save schedule to database: {str(e)}")

    def delete_schedules_for_week(self, restaurant_id: str, start_date: date, end_date: date) -> int:
        with self.SessionLocal() as session:
            try:
                # Delete only AI generated schedules that have not been overridden
                stmt = session.query(ScheduleModel).filter(
                    ScheduleModel.RestID == restaurant_id,
                    ScheduleModel.Day >= start_date,
                    ScheduleModel.Day <= end_date,
                    ScheduleModel.Source == "AI",
                    ScheduleModel.IsOverridden == False
                )
                deleted_count = stmt.delete(synchronize_session=False)
                session.commit()
                return deleted_count
            except Exception as e:
                session.rollback()
                print(f"Error deleting old schedules: {e}")
                raise Exception(f"Failed to delete old schedules: {str(e)}")

    def get_overridden_schedules_for_week(self, restaurant_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        with self.SessionLocal() as session:
            overrides = session.query(ScheduleModel).filter(
                ScheduleModel.RestID == restaurant_id,
                ScheduleModel.Day >= start_date,
                ScheduleModel.Day <= end_date,
                ScheduleModel.IsOverridden == True
            ).all()
            
            override_list = []
            for o in overrides:
                override_list.append({
                    "ScheduleID": o.ScheduleID,
                    "RestID": o.RestID,
                    "EmpID": o.EmpID,
                    "Day": o.Day,
                    "ShiftType": o.ShiftType,
                    "StartTime": o.StartTime,
                    "EndTime": o.EndTime,
                    "Source": o.Source,
                    "IsOverridden": o.IsOverridden,
                    "UpdatedAt": o.UpdatedAt
                })
            return override_list

    def get_schedule_by_id(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        with self.SessionLocal() as session:
            sched = session.query(ScheduleModel).filter(ScheduleModel.ScheduleID == schedule_id).first()
            if not sched:
                return None
            return {
                "ScheduleID": sched.ScheduleID,
                "RestID": sched.RestID,
                "EmpID": sched.EmpID,
                "Day": sched.Day,
                "ShiftType": sched.ShiftType,
                "StartTime": sched.StartTime,
                "EndTime": sched.EndTime,
                "Source": sched.Source,
                "IsOverridden": sched.IsOverridden,
                "UpdatedAt": sched.UpdatedAt
            }

    def update_schedule(self, schedule_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.SessionLocal() as session:
            try:
                sched = session.query(ScheduleModel).filter(ScheduleModel.ScheduleID == schedule_id).first()
                if not sched:
                    return None
                
                # Apply data updates
                for key, val in data.items():
                    if hasattr(sched, key):
                        setattr(sched, key, val)
                
                # Automatically enforce manual override fields
                sched.IsOverridden = True
                sched.Source = "Manual"
                sched.UpdatedAt = datetime.utcnow()
                
                session.commit()
                
                return {
                    "ScheduleID": sched.ScheduleID,
                    "RestID": sched.RestID,
                    "EmpID": sched.EmpID,
                    "Day": sched.Day,
                    "ShiftType": sched.ShiftType,
                    "StartTime": sched.StartTime,
                    "EndTime": sched.EndTime,
                    "Source": sched.Source,
                    "IsOverridden": sched.IsOverridden,
                    "UpdatedAt": sched.UpdatedAt
                }
            except Exception as e:
                session.rollback()
                print(f"Error updating schedule {schedule_id}: {e}")
                raise Exception(f"Failed to update schedule: {str(e)}")

    def get_employee_schedules_for_day(self, emp_id: int, day: date) -> List[Dict[str, Any]]:
        with self.SessionLocal() as session:
            schedules = session.query(ScheduleModel).filter(
                ScheduleModel.EmpID == emp_id,
                ScheduleModel.Day == day
            ).all()
            return [
                {
                    "ScheduleID": s.ScheduleID,
                    "RestID": s.RestID,
                    "EmpID": s.EmpID,
                    "Day": s.Day,
                    "ShiftType": s.ShiftType,
                    "StartTime": s.StartTime,
                    "EndTime": s.EndTime,
                    "Source": s.Source,
                    "IsOverridden": s.IsOverridden,
                    "UpdatedAt": s.UpdatedAt
                }
                for s in schedules
            ]
