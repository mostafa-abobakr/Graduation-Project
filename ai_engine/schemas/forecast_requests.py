from pydantic import BaseModel
from typing import List


class HourlyForecastRequest(BaseModel):
    temperature_celsius: float
    event_day: int


class DailyForecastRequest(BaseModel):
    weekly_temperatures: List[float]
    weekly_events: List[int]
