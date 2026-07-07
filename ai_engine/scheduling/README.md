# Scheduling & Optimization Module

This module is a sub-component of the `ai_engine` microservice, responsible for generating optimal staff schedules based on hourly demand forecasts and employee constraints.

## Current State: Independent Development Mode
This iteration uses **mock data providers** (`mock_data.py`, `data_providers.py`) to simulate database queries and external API calls. This allows the scheduling logic (Google OR-Tools) to be developed, tested, and refined independently of other services.

## Directory Structure
- `models.py`: SQLAlchemy ORM models (`Employees`, `Schedules`).
- `schemas.py`: Pydantic models for request/response validation and internal data passing.
- `mock_data.py`: Functions to generate synthetic demand forecasts and employee rosters.
- `data_providers.py`: Wrapper classes providing mock data.
- `solver.py`: Core CP-SAT scheduling logic.
- `router.py`: FastAPI router with the `/generate/{restaurant_id}` endpoint.

## How to Test Independently

1. **Install Dependencies:**
   Ensure you are in the correct environment, then run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run a Standalone FastAPI Server (Optional):**
   If you want to test the router independently before integration, you can create a simple `main.py` in this folder:
   ```python
   import uvicorn
   from fastapi import FastAPI
   from router import router as scheduling_router
   
   app = FastAPI()
   app.include_router(scheduling_router, prefix="/scheduling", tags=["Scheduling"])
   
   if __name__ == "__main__":
       uvicorn.run(app, host="0.0.0.0", port=8000)
   ```
   Then run `python main.py` and visit `http://localhost:8000/docs`.

3. **Call the Endpoint:**
   Send a POST request to `/scheduling/generate/test_restaurant_1`. The generated schedule will be returned in the API response and pretty-printed to the terminal console.

## Integration into Main `ai_engine` App

To include this module in the main FastAPI application, add the following to your main app file (e.g., `ai_engine/main.py`):

```python
from fastapi import FastAPI
from scheduling.router import router as scheduling_router

app = FastAPI(title="AI Engine API")

# Include the scheduling module router
app.include_router(scheduling_router, prefix="/scheduling", tags=["Scheduling"])
```

## String Normalization Policy
All string fields coming from DB MUST be normalized using:
lowercase + strip before any business logic.
