import requests
from datetime import date, datetime
from typing import Dict, Any, List
from config.settings import AI_ENGINE_BASE_URL

class DemandService:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or AI_ENGINE_BASE_URL

    def get_weekly_demand(self, restaurant_id: str, start_date: date, end_date: date) -> Dict[date, int]:
        """
        Fetches daily forecast data for all menu items and sums daily_predicted_demand per date.
        """
        url = f"{self.base_url}/forecast/all/daily/{restaurant_id}"
        
        # Provide default values for weekly temperatures and events (7 days)
        payload = {
            "weekly_temperatures": [25.0] * 7,
            "weekly_events": [0] * 7
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            daily_demand: Dict[date, int] = {}
            
            if not isinstance(data, dict):
                print(f"WARNING: Expected dictionary response from daily forecast, got {type(data)}")
                return daily_demand
                
            # Iterate through each item's forecast records
            for item_name, records in data.items():
                if not isinstance(records, list):
                    continue
                for record in records:
                    date_str = record.get("date")
                    predicted_demand = record.get("daily_predicted_demand", 0)
                    if date_str:
                        try:
                            # Handle potential datetime or date string
                            if "T" in date_str:
                                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                            else:
                                date_obj = date.fromisoformat(date_str)
                                
                            if start_date <= date_obj <= end_date:
                                daily_demand[date_obj] = daily_demand.get(date_obj, 0) + int(predicted_demand)
                        except ValueError:
                            continue
                            
            return daily_demand
            
        except requests.RequestException as e:
            print(f"Error fetching daily forecast from API: {e}")
            raise Exception(f"Failed to fetch daily forecast: {str(e)}")
