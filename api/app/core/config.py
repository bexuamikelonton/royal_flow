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
    MOCK_USDC_ADDRESS: str = "0x5412497645F3aA76b50eB2aEc59c77c908587b1c"
    CONTENT_REGISTRY_ADDRESS: str = "0x789b5c3F3c8340dAfE942D5eB684F66a2E4b2160"
    ROYALTY_SPLITTER_ADDRESS: str = "0xa522A00E9C7330755F19652a21F24FE3956E3d23"
    PAYMENT_VAULT_ADDRESS: str = "0xE61099f18731f24C32439169faA361e272a08892"
    LICENSE_MANAGER_ADDRESS: str = "0x6E57E88a2a8b9f71c4cFE7CDEc7e0c4D99bEb86B"
    
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
