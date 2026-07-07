import os
from typing import List, Dict, Any, Optional
from database.connection import get_cached_engine, get_cached_session_factory
from sqlalchemy.orm import sessionmaker
from scheduling.models import EmployeeModel, ScheduleModel
from scheduling.schemas import ShiftAssignment
from scheduling.utils.normalization import normalize
from datetime import date, datetime

class DBManager:
    def __init__(self, connection_string: str = None):
        if connection_string is None:
            connection_string = os.getenv("DATABASE_URL")
        self.engine = get_cached_engine(connection_string)
        self.SessionLocal = get_cached_session_factory(connection_string)

    def get_employees_from_db(self, restaurant_id: str, week_dates: List[date] = None) -> List[Dict[str, Any]]:
        print(f"DEBUG: Fetching employees for restaurant_id: {restaurant_id}")
        if week_dates is None:
            week_dates = []
            
        with self.SessionLocal() as session:
            # Using RestID to filter for the specific restaurant
            employees = session.query(EmployeeModel).filter(EmployeeModel.RestID == restaurant_id).all()
            
            print(f"DEBUG: Number of employees fetched: {len(employees)}")
            
            # Batch load availability records for the retrieved employees
            from scheduling.models import EmployeeAvailability
            emp_ids = [e.EmpID for e in employees]
            avail_records = []
            if emp_ids and week_dates:
                avail_records = session.query(EmployeeAvailability).filter(
                    EmployeeAvailability.emp_id.in_(emp_ids),
                    EmployeeAvailability.day.in_(week_dates)
                ).all()
                
            # Build lookup dict: {emp_id: {date_obj: [shifts]}}
            avail_lookup = {emp_id: {} for emp_id in emp_ids}
            for rec in avail_records:
                shifts = [s.strip() for s in rec.available_shifts.split(",") if s.strip()]
                avail_lookup[rec.emp_id][rec.day] = shifts
                
            employee_list = []
            for e in employees:
                # Default availability mapping
                emp_avail = {}
                for d in week_dates:
                    emp_avail[str(d)] = avail_lookup[e.EmpID].get(d, ["Morning", "Night"])
                    
                employee_list.append({
                    "EmpID": e.EmpID,
                    "Role": normalize(e.Role),
                    "Shif": normalize(e.Shif),
                    "WorkingDaysPerWeek": e.WorkingDaysPerWeek,
                    "WorkingHoursPerDay": e.WorkingHoursPerDay,
                    "availability": emp_avail
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

    def get_schedules_for_week(self, restaurant_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        with self.SessionLocal() as session:
            results = session.query(
                ScheduleModel,
                EmployeeModel.Role
            ).join(
                EmployeeModel,
                ScheduleModel.EmpID == EmployeeModel.EmpID
            ).filter(
                ScheduleModel.RestID == restaurant_id,
                ScheduleModel.Day >= start_date,
                ScheduleModel.Day <= end_date
            ).all()
            
            schedule_list = []
            for s, role in results:
                schedule_list.append({
                    "EmpID": s.EmpID,
                    "Role": normalize(role),
                    "ShiftType": s.ShiftType,
                    "Date": s.Day,
                    "StartTime": s.StartTime,
                    "EndTime": s.EndTime,
                    "Source": s.Source,
                    "IsOverridden": s.IsOverridden
                })
            return schedule_list

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

    def calculate_and_save_productivity_ratios(self, restaurant_id: str, days: int = 30, anchor_date: Optional[date] = None) -> Dict[str, Optional[float]]:
        """
        Calculates the median productivity ratios (Morning/Night) from historical schedules
        and forecast data over the specified number of days, filters outliers, and saves
        them to RestaurantSettings.
        """
        import math
        from sqlalchemy import func, cast, Date as SADate
        from datetime import datetime, date, timedelta
        from database.models import Forecast
        from scheduling.models import RestaurantSettings
        from scheduling.utils.normalization import normalize

        if anchor_date is None:
            anchor_date = date.today()
        elif isinstance(anchor_date, datetime):
            anchor_date = anchor_date.date()

        start_date = anchor_date - timedelta(days=days)
        end_date = anchor_date - timedelta(days=1)

        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())

        def calculate_median_with_iqr(ratios: List[float]) -> Optional[float]:
            if not ratios:
                return None
            
            ratios = sorted(ratios)
            n = len(ratios)
            
            # If we have enough data points, apply IQR filtering
            if n >= 4:
                def percentile(sorted_data, percent):
                    k = (len(sorted_data) - 1) * percent
                    f = math.floor(k)
                    c = math.ceil(k)
                    if f == c:
                        return sorted_data[int(k)]
                    d0 = sorted_data[int(f)] * (c - k)
                    d1 = sorted_data[int(c)] * (k - f)
                    return d0 + d1
                    
                q1 = percentile(ratios, 0.25)
                q3 = percentile(ratios, 0.75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                
                filtered_ratios = [r for r in ratios if lower_bound <= r <= upper_bound]
                if filtered_ratios:
                    ratios = sorted(filtered_ratios)
                    n = len(ratios)
                    
            if n % 2 == 1:
                return ratios[n // 2]
            else:
                return (ratios[n // 2 - 1] + ratios[n // 2]) / 2.0

        with self.SessionLocal() as session:
            # Query daily demands from Forecasts table
            daily_forecasts = (
                session.query(
                    cast(Forecast.RecordDate, SADate).label("date"),
                    func.sum(Forecast.ExpectedOrders).label("total_demand")
                )
                .filter(
                    Forecast.RestaurantId == restaurant_id,
                    Forecast.RecordDate >= start_datetime,
                    Forecast.RecordDate <= end_datetime
                )
                .group_by(cast(Forecast.RecordDate, SADate))
                .all()
            )
            
            demand_map = {}
            for row in daily_forecasts:
                if row.date:
                    d_val = row.date
                    if isinstance(d_val, str):
                        try:
                            d_val = date.fromisoformat(d_val.split()[0])
                        except ValueError:
                            pass
                    demand_map[d_val] = float(row.total_demand)
            
            # Query daily actual schedules
            daily_schedules = (
                session.query(
                    ScheduleModel.Day.label("date"),
                    ScheduleModel.ShiftType.label("shift_type"),
                    func.count(ScheduleModel.EmpID).label("staff_count")
                )
                .filter(
                    ScheduleModel.RestID == restaurant_id,
                    ScheduleModel.Day >= start_date,
                    ScheduleModel.Day <= end_date
                )
                .group_by(ScheduleModel.Day, ScheduleModel.ShiftType)
                .all()
            )
            
            staff_counts = {}
            for row in daily_schedules:
                d = row.date
                if not d:
                    continue
                if isinstance(d, str):
                    try:
                        d = date.fromisoformat(d.split()[0])
                    except ValueError:
                        pass
                st = normalize(row.shift_type)
                count = row.staff_count
                
                if d not in staff_counts:
                    staff_counts[d] = {"morning": 0, "night": 0}
                
                if st == "morning":
                    staff_counts[d]["morning"] += count
                elif st == "night":
                    staff_counts[d]["night"] += count
            
            morning_ratios = []
            night_ratios = []
            
            all_dates = set(demand_map.keys()).union(set(staff_counts.keys()))
            for d in all_dates:
                demand = demand_map.get(d, 0.0)
                if demand <= 0:
                    continue
                
                staff = staff_counts.get(d, {"morning": 0, "night": 0})
                morning_staff = staff["morning"]
                night_staff = staff["night"]
                
                # Morning demand split (0.6)
                morning_demand = demand * 0.6
                if morning_staff > 0:
                    morning_ratios.append(morning_demand / morning_staff)
                    
                # Night demand split (0.4)
                night_demand = demand * 0.4
                if night_staff > 0:
                    night_ratios.append(night_demand / night_staff)
            
            m_ratio = calculate_median_with_iqr(morning_ratios)
            n_ratio = calculate_median_with_iqr(night_ratios)
            
            # Load settings or create if not present
            settings = session.query(RestaurantSettings).filter(RestaurantSettings.rest_id == restaurant_id).first()
            if not settings:
                settings = RestaurantSettings(
                    rest_id=restaurant_id,
                    morning_shift_weight=0.6,
                    night_shift_weight=0.4,
                    productivity_ratio=10.0
                )
                session.add(settings)
            
            if m_ratio is not None:
                settings.morning_productivity_ratio = m_ratio
            if n_ratio is not None:
                settings.night_productivity_ratio = n_ratio
                
            session.commit()
            session.refresh(settings)
            
            return {
                "morning_productivity_ratio": settings.morning_productivity_ratio,
                "night_productivity_ratio": settings.night_productivity_ratio
            }
