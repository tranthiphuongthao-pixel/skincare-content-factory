from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://skincare:skincare_pass@localhost:5432/skincare_factory"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"

settings = Settings()
