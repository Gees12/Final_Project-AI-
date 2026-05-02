"""
Database setup — SQLite via SQLAlchemy.
File database: dashboard.db (dibuat otomatis di folder backend)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Path ke file SQLite (sama folder dengan backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'dashboard.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Perlu untuk SQLite + FastAPI async
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yield DB session, lalu tutup setelah request selesai."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
