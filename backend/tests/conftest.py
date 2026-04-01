import os
import sys
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure backend package roots like app/, core/, routes/ are importable in tests.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Stable defaults for local test runs.
TEST_DB_URL = "sqlite:///./test_local.db"
os.environ.setdefault("DATABASE_URL", TEST_DB_URL)
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("STOCK_API_KEY", "test-stock-key")

from database.database import Base, get_db
from app.main import app

# Synchronous testing engine for SQLite
# Note: Reuse same file but metadata.drop_all/create_all ensures isolation.
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh database for each test function."""
    # Ensure fresh schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function", autouse=True)
def override_get_db(db_session):
    """Overrides the get_db dependency for the FastAPI app."""
    def _get_db_override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def client():
    """Provides a test client for the application."""
    with TestClient(app) as c:
        yield c
