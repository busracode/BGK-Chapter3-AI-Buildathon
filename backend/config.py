from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./hayat_agaci.db"
    SECRET_KEY: str = "secret"
    GROQ_API_KEY: str = ""
    REDIS_URL: str = ""
    ALLOWED_ORIGINS: str = ""
    EXPERT_NOTIFICATION_EMAIL: str = ""
    EXPERT_NOTIFICATION_PHONE: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
