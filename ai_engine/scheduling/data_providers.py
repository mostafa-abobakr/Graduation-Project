from datetime import datetime
from .mock_data import generate_mock_hourly_forecast, generate_mock_employees
from typing import List, Dict, Any

class MockForecastProvider:
    def fetch_forecast(self, restaurant_id: str, target_date: datetime = None) -> List[Dict[str, Any]]:
        """Returns mock hourly forecast for the given day."""
        if not target_date:
            target_date = datetime.now()
        return generate_mock_hourly_forecast(restaurant_id, target_date)

class MockEmployeeProvider:
    def get_employees(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Returns mock employee roster."""
        return generate_mock_employees(restaurant_id)
