"""Posts API router — CRUD + publish endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.post import PostCreate, PostListResponse, PostResponse, PostUpdate
from app.services import post_service

router = APIRouter(prefix="/api/posts", tags=["Posts"])


@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db)):
    """Create a new draft post."""
    post = await post_service.create_post(db, data)
    return post


@router.get("/", response_model=PostListResponse)
async def list_posts(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all posts, optionally filtered by status."""
    posts, total = await post_service.list_posts(db, status=status, skip=skip, limit=limit)
    return PostListResponse(posts=posts, total=total)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single post by ID."""
    post = await post_service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(post_id: str, data: PostUpdate, db: AsyncSession = Depends(get_db)):
    """Update a post (used by auto-save)."""
    post = await post_service.update_post(db, post_id, data)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(post_id: str, db: AsyncSession = Depends(get_db)):
    """Publish a draft post."""
    post = await post_service.publish_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a post."""
    deleted = await post_service.delete_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found")
