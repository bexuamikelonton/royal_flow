from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.services.web3_service import web3_service
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint checking Database and Avalanche Fuji RPC status."""
    db_status = "error"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unavailable: {str(e)}"

    network_health = await web3_service.get_network_health()

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": db_status,
        "blockchain": network_health
    }
