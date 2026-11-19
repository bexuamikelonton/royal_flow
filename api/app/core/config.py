from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RoyaltyFlow API"
    ENVIRONMENT: str = "development"
    VERSION: str = "1.0.0"
    
    # Database URL: Supports PostgreSQL (asyncpg) or SQLite (aiosqlite) fallback
    DATABASE_URL: str = "sqlite+aiosqlite:///./royaltyflow.db"
    
    # AI Gemini LLM API Key
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Avalanche Fuji C-Chain Network & RPC
    RPC_URL: str = "https://api.avax-test.network/ext/bc/C/rpc"
    CHAIN_ID: int = 43113
    
    # Deployed Smart Contracts Addresses on Avalanche Fuji
    MOCK_USDC_ADDRESS: str = "0xd4982321D81420F4504AFf00FDACaB626a19bC7F"
    CONTENT_REGISTRY_ADDRESS: str = "0x36F9912d229dAC5F8e061633B0240E9dCFbdCc0e"
    ROYALTY_SPLITTER_ADDRESS: str = "0x2D61b88c0eA9eD339aEa3a6398D1DCFA663167aB"
    PAYMENT_VAULT_ADDRESS: str = "0x4134E62861DCF203C86Db99352f693903894aC5f"
    LICENSE_MANAGER_ADDRESS: str = "0x6cD504472999f4cfCAb86dddB3d8967d1647538d"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
