"""
config/settings.py
Centralised, immutable settings loaded from environment variables.
All other modules must import from here — never read os.getenv() directly.
"""
import os

# Load .env file automatically for local development.
# On Render, real env vars are injected by the platform and take precedence.
try:
    from dotenv import load_dotenv
    load_dotenv()   # reads .env from the working directory if present
except ImportError:
    pass  # python-dotenv not installed; env vars must be set externally


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASE_URL: str = os.getenv("DATABASE_URL", "")
"""
SQL Server connection string.
Format: mssql+pyodbc://user:password@host/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no
Must always be provided via environment variable — never hard-coded.
"""

# ---------------------------------------------------------------------------
# Model storage
# ---------------------------------------------------------------------------
MODEL_ROOT: str = os.getenv("MODEL_ROOT", "/opt/models")
"""
Root directory where trained Prophet models (.pkl) and metadata (.json)
are written and read back.  On Render, use a persistent disk mounted here.
"""

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.getenv("PORT", "7860"))
"""Listening port — Render injects $PORT automatically."""

AI_ENGINE_BASE_URL: str = os.getenv(
    "AI_ENGINE_BASE_URL", 
    "https://youseef-awaad-zerobite-ai-engine.hf.space"
).rstrip("/")
"""Base URL for the AI Engine for scheduling/forecasting requests."""

# ---------------------------------------------------------------------------
# Safety guard — fail fast if critical config is missing
# ---------------------------------------------------------------------------
def validate_required() -> None:
    """
    Raise EnvironmentError if any required variable is absent.
    Called at application start-up (lifespan event).
    """
    missing = []
    if not DATABASE_URL:
        missing.append("DATABASE_URL")
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}"
        )
