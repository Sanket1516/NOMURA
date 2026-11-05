"""Settings from environment variables (pydantic-settings). No secret has a default value."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VAAKYA_", env_file=".env", extra="ignore")

    env: str = Field("development", description="development | test | production")
    database_url: str = Field(..., description="postgresql+psycopg://user:pass@host:5432/db (the API's restricted role)")
    admin_database_url: str | None = Field(None, description="Owner connection for migrations, seeding and the worker; defaults to database_url")
    oidc_issuer: str = Field(..., description="Issuer as it appears in tokens, e.g. https://host/auth/realms/vaakya")
    oidc_jwks_url: str | None = Field(None, description="JWKS URL if it differs from <issuer>/protocol/openid-connect/certs")
    oidc_audience: str = "vaakya-api"
    cors_origins: list[str] = Field(default_factory=list, description="Empty: same-origin only (BFF)")
    log_hmac_key: str = Field("dev-only-change-me", description="Key for hashing user ids in logs")
    rate_limit_enabled: bool = True
    metrics_token: str | None = Field(None, description="If set, /metrics requires Authorization: Bearer <token> (KI-13)")
    # Services added in later steps. Unset means the feature reports 503 honestly.
    inference_url: str | None = None
    inference_token: str | None = None
    s3_endpoint: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    vault_kek_b64: str | None = Field(None, description="32-byte key, base64, for document envelope encryption")
    neo4j_uri: str | None = None
    neo4j_user: str = "neo4j"
    neo4j_password: str | None = None
    qdrant_url: str | None = None
    ollama_url: str | None = None
    llm_private_model: str | None = Field(None, description="Chosen by T0.03, e.g. an Apache-2.0 small model")
    llm_reasoning_model: str | None = None


@lru_cache
def get_settings() -> Settings:
    s = Settings()  # type: ignore[call-arg]
    if s.env == "production" and s.log_hmac_key == "dev-only-change-me":
        raise RuntimeError("VAAKYA_LOG_HMAC_KEY must be set in production")
    return s
