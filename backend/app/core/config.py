import os
import secrets
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Settings
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    
    # CORS
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"])
    
    # Database
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5433)
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="postgres")
    DB_NAME: str = Field(default="pagey_ai")
    
    # Use SQLite for development
    USE_SQLITE: bool = Field(default=False)
    
    # Database URL
    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            # Use SQLite with an absolute path
            sqlite_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sqlite_db.db")
            return f"sqlite:///{sqlite_db_path}"
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_SECRET: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    
    # OpenAI
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_ORG_ID: str = Field(default="")
    
    # File Storage
    UPLOAD_DIR: str = Field(default="uploads")
    MAX_UPLOAD_SIZE: int = Field(default=52428800)  # 50MB
    
    # Stripe
    STRIPE_SECRET_KEY: str = Field(default="")
    STRIPE_WEBHOOK_SECRET: str = Field(default="")
    
    # Groq
    GROQ_API_KEY: str = Field(default="")
    
    class Config:
        env_file = [".env.local", ".env"]
        case_sensitive = True

# Create singleton settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 