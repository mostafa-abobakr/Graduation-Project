import os
from functools import lru_cache
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

@lru_cache(maxsize=5)
def get_cached_engine(connection_string: str) -> Engine:
    safe_url = connection_string.replace("Encrypt=no", "").replace("Encrypt=yes", "")
    if safe_url.endswith("&") or safe_url.endswith("?"):
        sa_url = safe_url[:-1]
    else:
        sa_url = safe_url
        
    return create_engine(
        sa_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=1800,
        connect_args={
            "Encrypt": "no",
            "TrustServerCertificate": "yes"
        }
    )

@lru_cache(maxsize=5)
def get_cached_session_factory(connection_string: str) -> sessionmaker:
    engine = get_cached_engine(connection_string)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session() -> Generator[Session, None, None]:
    connection_string = os.getenv("DATABASE_URL")
    if not connection_string:
        raise EnvironmentError(
            "DATABASE_URL environment variable is not set. "
            "Example: mssql+pyodbc://user:password@host/db?"
            "driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
        )
    session_factory = get_cached_session_factory(connection_string)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()

def get_engine() -> Engine:
    connection_string = os.getenv("DATABASE_URL")
    if not connection_string:
        raise EnvironmentError("DATABASE_URL environment variable is not set.")
    return get_cached_engine(connection_string)
