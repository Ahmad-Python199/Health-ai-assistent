import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "health_analyzer")
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    
    # AI OpenRouter Configuration
    openrouter_url: str = "https://openrouter.ai/api/v1"
    default_llm_model: str = "openrouter/free"  # Capable, fast and completely credit-free model
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
