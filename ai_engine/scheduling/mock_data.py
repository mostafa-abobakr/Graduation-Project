import random
from datetime import datetime, timedelta

def generate_mock_hourly_forecast(restaurant_id: str, start_date: datetime, hours: int = 24):
    """Generates 24 hours of random demand for a given start date."""
    forecasts = []
    current_time = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    for _ in range(hours):
        forecasts.append({
            "timestamp": current_time.isoformat(),
            # Realistic demand: peak around 12-14 and 19-21
            "predicted_demand": random.randint(30, 80) if current_time.hour in [12, 13, 19, 20] else random.randint(5, 30)
        })
        current_time += timedelta(hours=1)
    return forecasts

def generate_mock_employees(restaurant_id: str):
    """Generates mock employees with various roles and shift preferences."""
    employees = []
    
    # 5 Chefs
    employees.append({"EmpID": 1, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"})
    employees.append({"EmpID": 2, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"})
    employees.append({"EmpID": 3, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": None})
    employees.append({"EmpID": 4, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Morning"})
    employees.append({"EmpID": 5, "Role": "Chef", "WorkingHoursPerDay": 8, "WorkingDaysPerWeek": 5, "Shif": "Evening"})
    
    # 10 Employees
    shifts = ["Morning", "Evening", None]
    for i in range(6, 16):
        pref = random.choice(shifts)
        employees.append({
            "EmpID": i, 
            "Role": "Employee", 
            "WorkingHoursPerDay": 8, 
            "WorkingDaysPerWeek": 5, 
            "Shif": pref
        })
        
    return employees
