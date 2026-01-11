from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = ""
    serpapi_api_key: str = ""
    
    database_url: str = "postgresql://postgres:postgres@localhost:5432/workflow_db"
    database_ssl: bool = True
    
    pinecone_api_key: str = ""
    pinecone_environment: str = "gcp-starter"
    pinecone_index_name: str = "workflow-kb"
    
    SECRET_KEY: str = "your-secret-key-change-this-in-production-min-32-chars"
    
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
