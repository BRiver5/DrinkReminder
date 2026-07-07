"""Database engine and session setup (SQLite + SQLAlchemy 2.0)."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Overridable so deployments can point at a mounted volume, and tests at a temp file.
DATABASE_URL = os.environ.get("DRINKREMINDER_DATABASE_URL", "sqlite:///./drinkreminder.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
