import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from database.connection import get_engine

def run_migration():
    print("Connecting to database...")
    engine = get_engine()
    
    with engine.connect() as conn:
        print("Checking/adding morning_productivity_ratio...")
        try:
            conn.execute(text("ALTER TABLE dbo.RestaurantSettings ADD morning_productivity_ratio FLOAT NULL"))
            conn.commit()
            print("Successfully added morning_productivity_ratio.")
        except Exception as e:
            print(f"morning_productivity_ratio column check/add result: {e}")
            
        print("Checking/adding night_productivity_ratio...")
        try:
            conn.execute(text("ALTER TABLE dbo.RestaurantSettings ADD night_productivity_ratio FLOAT NULL"))
            conn.commit()
            print("Successfully added night_productivity_ratio.")
        except Exception as e:
            print(f"night_productivity_ratio column check/add result: {e}")
            
    print("Migration completed.")

if __name__ == "__main__":
    run_migration()
