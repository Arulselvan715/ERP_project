from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Shiv Furniture Works - Mini ERP"
    DATABASE_URL: str = "sqlite+aiosqlite:///./mini_erp.db"
    SECRET_KEY: str = "shiv-furniture-erp-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEFAULT_ADMIN_EMAIL: str = "admin@shivfurniture.com"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    LOW_STOCK_THRESHOLD: int = 10

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
