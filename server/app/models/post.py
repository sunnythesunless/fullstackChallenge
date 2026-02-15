"""Post ORM model — stores blog posts with Lexical JSON state."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy import JSON

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid() -> str:
    return str(uuid.uuid4())


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=_new_uuid)
    title = Column(String, nullable=False, default="Untitled")
    content_json = Column(JSON, nullable=True)       # Lexical editor state (lossless)
    content_html = Column(Text, nullable=True)        # Rendered HTML (read-only / SEO)
    status = Column(String, nullable=False, default="draft")  # "draft" | "published"
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
