import requests
from typing import List, Dict, Any
from datetime import datetime, date
from config.settings import AI_ENGINE_BASE_URL

class SchedulingAPIClient:
    def fetch_forecast_data(self, restaurant_id: str, target_date: datetime) -> List[Dict[str, Any]]:
        """
        Fetches hourly forecast from the AI engine API.
        """
        url = f"{AI_ENGINE_BASE_URL}/forecast/all/hourly/{restaurant_id}"
        
        # Provide default values for weather and events
        payload = {
            "temperature_celsius": 25.0,
            "event_day": 0
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            forecast_list = []
            if isinstance(data, list):
                forecast_list = data
            elif isinstance(data, dict):
                forecast_list = data.get("data", data.get("forecast", []))
                
            # Filter for the specific target date
            target_date_obj = target_date.date() if isinstance(target_date, datetime) else target_date
            
            filtered_forecasts = []
            for f in forecast_list:
                ts_str = f.get("timestamp")
                if ts_str:
                    try:
                        # Handle potential 'Z' suffix for UTC
                        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                        if dt.date() == target_date_obj:
                            filtered_forecasts.append(f)
                    except ValueError:
                        continue
                        
            return filtered_forecasts
            
        except requests.RequestException as e:
            print(f"Error fetching forecast from API: {e}")
            raise Exception(f"Failed to fetch real forecast: {str(e)}")
            
    def fetch_forecast_data_for_range(self, restaurant_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Fetches hourly forecast from the AI engine API and filters for a date range.
        """
        url = f"{AI_ENGINE_BASE_URL}/forecast/all/hourly/{restaurant_id}"
        
        payload = {
            "temperature_celsius": 25.0,
            "event_day": 0
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            forecast_list = []
            if isinstance(data, list):
                forecast_list = data
            elif isinstance(data, dict):
                forecast_list = data.get("data", data.get("forecast", []))
                
            filtered_forecasts = []
            for f in forecast_list:
                ts_str = f.get("timestamp")
                if ts_str:
                    try:
                        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                        if start_date <= dt.date() <= end_date:
                            filtered_forecasts.append(f)
                    except ValueError:
                        continue
                        
            return filtered_forecasts
            
        except requests.RequestException as e:
            print(f"Error fetching forecast from API: {e}")
            raise Exception(f"Failed to fetch real forecast: {str(e)}")
