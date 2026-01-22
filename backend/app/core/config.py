"""Application configuration via environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import AnyUrl


class Settings(BaseSettings):
    app_name: str = "Cainiao Dispatch API"
    environment: str = "dev"
    postgres_url: AnyUrl
    default_admin_email: str | None = None
    default_admin_password: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
