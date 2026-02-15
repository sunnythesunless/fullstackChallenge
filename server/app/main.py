"""FastAPI application — entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import ai, auth, posts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Shutdown: nothing special."""
    await init_db()
    yield


app = FastAPI(
    title="Smart Blog Editor API",
    description="Production-ready Notion-style blog editor backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router)
app.include_router(ai.router)
app.include_router(auth.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": "Smart Blog Editor API"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
