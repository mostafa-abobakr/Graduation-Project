import pandas as pd
import logging
from sqlalchemy.orm import Session
from database.connection import get_engine
from database.models import Forecast

logger = logging.getLogger(__name__)

def save_forecasts_to_db(restaurant_id: str, item_name: str, forecast_df: pd.DataFrame):
    """
    Save the generated forecast dataframe to the SQL Server Forecasts table.
    
    Args:
        restaurant_id: The restaurant ID.
        item_name: The name of the menu item forecasted.
        forecast_df: DataFrame containing 'timestamp' and 'predicted_demand'.
    """
    engine = get_engine()
    
    try:
        with Session(engine) as session:
            forecast_records = []
            
            # Print loop and object generation
            for _, row in forecast_df.iterrows():
                record_date = row['timestamp']
                expected_orders = row['predicted_demand']
                
                print(f"Generated Forecast -> RecordDate: {record_date}, ExpectedOrders: {expected_orders}")
                
                forecast_record = Forecast(
                    RestaurantId=restaurant_id,
                    ItemName=item_name,
                    RecordDate=record_date,
                    ExpectedOrders=expected_orders
                )
                forecast_records.append(forecast_record)
            
            session.add_all(forecast_records)
            session.commit()
            logger.info(f"Successfully saved {len(forecast_records)} forecasts to the database for {item_name}.")
            
    except Exception as e:
        logger.error(f"Failed to insert forecasts into database: {str(e)}")
        print(f"DATABASE INSERT ERROR: {str(e)}")
