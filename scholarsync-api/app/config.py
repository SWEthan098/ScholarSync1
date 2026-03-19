from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Teller
    teller_cert_path: str = "certificate.pem"
    teller_key_path: str = "private_key.pem"
    teller_env: str = "sandbox"

    # Microsoft SSO
    ms_client_id: str
    ms_client_secret: str
    ms_tenant_id: str
    ms_redirect_uri: str

    # OpenAI
    openai_api_key: str

    # App
    frontend_url: str
    secret_key: str

    class Config:
        env_file = ".env"


settings = Settings()