from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AI_API_KEY: str = ""
    AI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models"
    AI_MODEL: str = "gemini-2.0-flash"
    CORS_ORIGIN: str = "http://localhost:5173"
    AI_TIMEOUT_SECONDS: int = 30

    # Auth
    JWT_SECRET: str = "change-me-to-a-long-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
