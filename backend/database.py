import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Look for Render's environment variable first. Fallback to local SQLite if not found.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./study_plan.db")

# 2. Fix the Python SQLAlchemy PostgreSQL prefix requirement (Render uses postgres://, SQLAlchemy expects postgresql://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Handle connection arguments dynamically (SQLite needs check_same_thread, Postgres will crash if it's passed)
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()