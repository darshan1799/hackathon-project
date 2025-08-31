from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "sqlite:///./alerts.db"
    twilio_account_sid: Optional[str] = Field(None, alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(None, alias="TWILIO_AUTH_TOKEN")
    twilio_phone_number: Optional[str] = Field(None, alias="TWILIO_PHONE_NUMBER")
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from env file
        populate_by_name = True  # Allow population by field name or alias

settings = Settings()