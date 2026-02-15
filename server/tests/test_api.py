"""Backend tests — Posts CRUD, Auth, and AI endpoints."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import Base, engine
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP client for testing FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ──────────────────────────────────────────────
# Posts CRUD
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_post(client: AsyncClient):
    resp = await client.post("/api/posts/", json={"title": "Test Post"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Post"
    assert data["status"] == "draft"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_list_posts(client: AsyncClient):
    # Create 2 posts
    await client.post("/api/posts/", json={"title": "Post 1"})
    await client.post("/api/posts/", json={"title": "Post 2"})

    resp = await client.get("/api/posts/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["posts"]) == 2


@pytest.mark.asyncio
async def test_list_posts_filter_by_status(client: AsyncClient):
    # Create a post and publish it
    create_resp = await client.post("/api/posts/", json={"title": "Draft Post"})
    post_id = create_resp.json()["id"]
    await client.post(f"/api/posts/{post_id}/publish")

    # Create another draft
    await client.post("/api/posts/", json={"title": "Another Draft"})

    # Filter for published
    resp = await client.get("/api/posts/?status=published")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["posts"][0]["status"] == "published"


@pytest.mark.asyncio
async def test_get_post(client: AsyncClient):
    create_resp = await client.post("/api/posts/", json={"title": "My Post"})
    post_id = create_resp.json()["id"]

    resp = await client.get(f"/api/posts/{post_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "My Post"


@pytest.mark.asyncio
async def test_get_post_not_found(client: AsyncClient):
    resp = await client.get("/api/posts/nonexistent-id")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_post(client: AsyncClient):
    create_resp = await client.post("/api/posts/", json={"title": "Original"})
    post_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/posts/{post_id}",
        json={"title": "Updated", "content_json": {"root": {"children": []}}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated"
    assert data["content_json"] == {"root": {"children": []}}


@pytest.mark.asyncio
async def test_content_json_round_trip(client: AsyncClient):
    """Critical test: Lexical JSON state must round-trip losslessly."""
    lexical_state = {
        "root": {
            "children": [
                {
                    "type": "paragraph",
                    "children": [
                        {"type": "text", "text": "Hello, world!", "format": 1}
                    ],
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1,
        }
    }

    create_resp = await client.post(
        "/api/posts/",
        json={"title": "Round Trip Test", "content_json": lexical_state},
    )
    post_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/posts/{post_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["content_json"] == lexical_state


@pytest.mark.asyncio
async def test_publish_post(client: AsyncClient):
    create_resp = await client.post("/api/posts/", json={"title": "To Publish"})
    post_id = create_resp.json()["id"]

    resp = await client.post(f"/api/posts/{post_id}/publish")
    assert resp.status_code == 200
    assert resp.json()["status"] == "published"


@pytest.mark.asyncio
async def test_delete_post(client: AsyncClient):
    create_resp = await client.post("/api/posts/", json={"title": "To Delete"})
    post_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/posts/{post_id}")
    assert resp.status_code == 204

    # Verify it's gone
    get_resp = await client.get(f"/api/posts/{post_id}")
    assert get_resp.status_code == 404


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_signup(client: AsyncClient):
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "password": "secret123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "dup@example.com", "password": "other456"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "login@example.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "wrong@example.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


# ──────────────────────────────────────────────
# AI
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ai_generate_summarize(client: AsyncClient):
    resp = await client.post(
        "/api/ai/generate",
        json={"text": "This is a long blog post about Python programming.", "action": "summarize"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "summarize"
    assert len(data["result"]) > 0


@pytest.mark.asyncio
async def test_ai_generate_fix_grammar(client: AsyncClient):
    resp = await client.post(
        "/api/ai/generate",
        json={"text": "This text have bad grammer.", "action": "fix_grammar"},
    )
    assert resp.status_code == 200
    assert resp.json()["action"] == "fix_grammar"


@pytest.mark.asyncio
async def test_ai_generate_invalid_action(client: AsyncClient):
    resp = await client.post(
        "/api/ai/generate",
        json={"text": "Some text", "action": "invalid_action"},
    )
    assert resp.status_code == 422  # Validation error


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
