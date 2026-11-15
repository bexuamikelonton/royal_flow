from app.routers.health import router as health_router
from app.routers.ai_copilot import router as ai_router
from app.routers.contents import router as contents_router
from app.routers.royalties import router as royalties_router
from app.routers.licenses import router as licenses_router

__all__ = [
    "health_router",
    "ai_router",
    "contents_router",
    "royalties_router",
    "licenses_router",
]
