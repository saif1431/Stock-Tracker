import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Stock Tracking Dashboard"
    # Get API key with a default value (empty string if not found)
    STOCK_API_KEY: str = os.getenv("STOCK_API_KEY") or ""
    # Use SQLite as default database if DATABASE_URL not set
    DATABASE_URL: str = os.getenv("DATABASE_URL") or "sqlite:///./stock_dashboard.db"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")

settings = Settings()
