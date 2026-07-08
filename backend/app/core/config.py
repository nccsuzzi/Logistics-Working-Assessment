import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Logistics AI Platform"
    API_V1_STR: str = "/api/v1"
    
    # Defaults to SQLite for local development
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./logistics.db")
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-local-dev-only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Groq configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    model_config = SettingsConfigDict(
        case_sensitive=True, 
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"), 
        extra="ignore"
    )

settings = Settings()
