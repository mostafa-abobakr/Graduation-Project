"""
database/connection.py
Singleton SQLAlchemy engine for SQL Server via pyodbc.
All database access must go through get_engine().
"""
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from config.settings import DATABASE_URL

_engine: Engine | None = None


def get_engine() -> Engine:
    """
    Return a process-level singleton SQLAlchemy engine.

    Connection pool settings:
        pool_size=5       – keep 5 connections alive
        max_overflow=10   – allow up to 10 additional connections under load
        pool_pre_ping=True – discard stale connections before use (safe for Render)
        pool_recycle=1800  – recycle connections every 30 min to avoid MSSQL timeout kills
    """
    global _engine
    if _engine is None:
        if not DATABASE_URL:
            raise EnvironmentError(
                "DATABASE_URL environment variable is not set. "
                "Example: mssql+pyodbc://user:password@host/db?"
                "driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
            )
        # SQLAlchemy coerces 'Encrypt=no' into the integer 0.
        # On Windows this is fine, but on Linux (Docker), ODBC Driver 18 strictly
        # expects the literal string "no" or "yes" and crashes with:
        # "Invalid value specified for connection string attribute 'Encrypt' (0)"
        # FIX: We strip it from the URL and explicitly pass string values in connect_args.
        safe_url = DATABASE_URL.replace("Encrypt=no", "").replace("Encrypt=yes", "")
        if safe_url.endswith("&"):
            safe_url = safe_url[:-1]

        _engine = create_engine(
            safe_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=1800,
            connect_args={
                "Encrypt": "no",
                "TrustServerCertificate": "yes"
            }
        )
    return _engine
