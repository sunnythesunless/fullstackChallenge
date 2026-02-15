"""Post business logic — CRUD operations."""

from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate


async def create_post(db: AsyncSession, data: PostCreate, author_id: Optional[str] = None) -> Post:
    post = Post(
        title=data.title,
        content_json=data.content_json,
        content_html=data.content_html,
        author_id=author_id,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def get_post(db: AsyncSession, post_id: str) -> Optional[Post]:
    result = await db.execute(select(Post).where(Post.id == post_id))
    return result.scalar_one_or_none()


async def list_posts(
    db: AsyncSession,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Post], int]:
    query = select(Post)
    count_query = select(func.count()).select_from(Post)

    if status:
        query = query.where(Post.status == status)
        count_query = count_query.where(Post.status == status)

    query = query.order_by(Post.updated_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    posts = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return posts, total


async def update_post(db: AsyncSession, post_id: str, data: PostUpdate) -> Optional[Post]:
    post = await get_post(db, post_id)
    if not post:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)

    await db.commit()
    await db.refresh(post)
    return post


async def publish_post(db: AsyncSession, post_id: str) -> Optional[Post]:
    post = await get_post(db, post_id)
    if not post:
        return None
    post.status = "published"
    await db.commit()
    await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post_id: str) -> bool:
    post = await get_post(db, post_id)
    if not post:
        return False
    await db.delete(post)
    await db.commit()
    return True
