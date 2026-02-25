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
        _engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=1800,
        )
    return _engine
