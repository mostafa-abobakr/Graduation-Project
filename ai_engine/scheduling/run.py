from fastapi import FastAPI
from scheduling.router import router as scheduling_router

app = FastAPI(title="AI Engine Scheduling")

app.include_router(
    scheduling_router,
    prefix="/scheduling",
    tags=["Scheduling"]
)