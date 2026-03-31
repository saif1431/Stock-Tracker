import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]

class Settings:
    PROJECT_NAME: str = "Stock Tracking Dashboard"
    # Get API key with a default value (empty string if not found)
    STOCK_API_KEY: str = os.getenv("STOCK_API_KEY") or ""

    # Database and cache
    DATABASE_URL: str = os.getenv("DATABASE_URL") or "sqlite:///./stock_dashboard.db"
    REDIS_URL: str = os.getenv("REDIS_URL") or "redis://localhost:6379/0"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    DEBUG: bool = _parse_bool(os.getenv("DEBUG"), True)
    CORS_ORIGINS: list[str] = _parse_list(os.getenv("CORS_ORIGINS")) or [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    ALLOWED_HOSTS: list[str] = _parse_list(os.getenv("ALLOWED_HOSTS"))

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()
