from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Float, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class EmployeeModel(Base):
    __tablename__ = 'Employees'
    __table_args__ = {"schema": "dbo"}
    
    EmpID = Column(Integer, primary_key=True, index=True)
    RestID = Column(String(50), nullable=False, index=True)
    FullName = Column(String(200), nullable=True)
    Role = Column(String(50), nullable=False) # 'Chef' or 'Employee'
    Salary = Column(Float, nullable=True)
    Phone = Column(String(50), nullable=True)
    HireDate = Column(Date, nullable=True)
    Status = Column(String(50), nullable=True)
    CreatedAt = Column(DateTime, nullable=True)
    UpdatedAt = Column(DateTime, nullable=True)
    Email = Column(String(100), nullable=True)
    HashedPassword = Column(String(500), nullable=True)
    Shif = Column(String(50), nullable=True) # 'Morning', 'Evening', or None/'Any'
    WorkingDaysPerWeek = Column(Integer, default=5)
    WorkingHoursPerDay = Column(Integer, default=8)

class ScheduleModel(Base):
    __tablename__ = 'Schedules'
    
    ScheduleID = Column(Integer, primary_key=True, autoincrement=True)
    RestID = Column(String(50), index=True)
    EmpID = Column(Integer, ForeignKey('dbo.Employees.EmpID'))
    Day = Column(Date, nullable=False)
    ShiftType = Column(String(50), nullable=False) # 'Morning' or 'Evening'
    StartTime = Column(Time, nullable=False)
    EndTime = Column(Time, nullable=False)
    Source = Column(String(50), default="AI")
    IsOverridden = Column(Boolean, default=False)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmployeeAvailability(Base):
    __tablename__ = 'EmployeeAvailabilities'
    __table_args__ = (
        UniqueConstraint('emp_id', 'day', name='uq_emp_availability_day'),
        {"schema": "dbo"}
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    emp_id = Column(Integer, ForeignKey('dbo.Employees.EmpID', ondelete='CASCADE'), nullable=False, index=True)
    day = Column(sa_Date := Date, nullable=False, index=True)
    available_shifts = Column(String(100), nullable=False)


class RestaurantSettings(Base):
    __tablename__ = 'RestaurantSettings'
    __table_args__ = {"schema": "dbo"}
    
    rest_id = Column(String(50), primary_key=True, index=True)
    morning_shift_weight = Column(Float, nullable=False, default=0.6)
    night_shift_weight = Column(Float, nullable=False, default=0.4)
    productivity_ratio = Column(Float, nullable=False, default=10.0)
    morning_productivity_ratio = Column(Float, nullable=True, default=10.0)
    night_productivity_ratio = Column(Float, nullable=True, default=10.0)
