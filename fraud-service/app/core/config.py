from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Fraud Detection Service"
    LOG_LEVEL: str = "INFO"
    OPENAI_API_KEY: str
    DB_PATH: str = "transactions.db"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
