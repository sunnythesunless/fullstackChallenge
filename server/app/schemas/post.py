"""Pydantic schemas for Post API requests/responses."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------- Request schemas ----------

class PostCreate(BaseModel):
    title: str = Field(default="Untitled", max_length=500)
    content_json: Optional[dict[str, Any]] = None
    content_html: Optional[str] = None


class PostUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=500)
    content_json: Optional[dict[str, Any]] = None
    content_html: Optional[str] = None


# ---------- Response schemas ----------

class PostResponse(BaseModel):
    id: str
    title: str
    content_json: Optional[dict[str, Any]] = None
    content_html: Optional[str] = None
    status: str
    author_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
