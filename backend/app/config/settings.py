from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./brightbook.db"

    # Auth
    JWT_SECRET_KEY: str = "changeme-secret-key-dev"
    JWT_REFRESH_SECRET: str = "changeme-refresh-secret-dev"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI (plugged in later)
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@brightbook.app"

    # Payment (gateway-agnostic, fill in when ready)
    PAYMENT_API_KEY: str = ""
    PAYMENT_SECRET: str = ""

    # Monitoring
    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def reload_settings():
    """Clear lru_cache and reload Settings from .env file, updating the global settings instance."""
    get_settings.cache_clear()
    new_settings = get_settings()
    for field in Settings.model_fields:
        setattr(settings, field, getattr(new_settings, field))
