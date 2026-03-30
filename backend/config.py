from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./hayat_koprusu.db"
    ALLOWED_ORIGINS: list[str] = ["*"]
    SECRET_KEY: str = "secret"

    class Config:
        env_file = ".env"

settings = Settings()
