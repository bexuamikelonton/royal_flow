from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.routers import (
    health_router,
    ai_router,
    contents_router,
    royalties_router,
    licenses_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    try:
        await init_db()
        print("[Startup] Database initialized successfully.")
    except Exception as e:
        print(f"[Startup Warning] Database initialization skipped or deferred: {e}")
    yield
    # Shutdown
    print("[Shutdown] RoyaltyFlow API stopping.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for RoyaltyFlow - Digital Royalty Revenue Distribution Platform on Avalanche Fuji & Gemini AI",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(ai_router, prefix="/api/v1")
app.include_router(contents_router, prefix="/api/v1")
app.include_router(royalties_router, prefix="/api/v1")
app.include_router(licenses_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
