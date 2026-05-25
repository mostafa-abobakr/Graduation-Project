from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Float, DateTime, Boolean
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
