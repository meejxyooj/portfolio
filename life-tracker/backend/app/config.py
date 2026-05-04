from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    database_url: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/lifetracker'
    supabase_url: str = ''
    supabase_jwt_secret: str = ''
    terra_api_key: str = ''
    terra_dev_id: str = ''
    terra_webhook_secret: str = ''
    strava_client_id: str = ''
    strava_client_secret: str = ''
    strava_webhook_verify_token: str = ''
    encryption_key: str = ''
    anthropic_api_key: str = ''
    cors_origins: list[str] = ['http://localhost:8081', 'exp://localhost:8081']


settings = Settings()
