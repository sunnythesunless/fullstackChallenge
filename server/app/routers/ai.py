"""AI API router — text generation endpoints."""

from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.services.ai_service import generate_ai_content

router = APIRouter(prefix="/api/ai", tags=["AI"])


class AiRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)
    action: str = Field(
        description="One of: summarize, fix_grammar, expand, title",
        pattern="^(summarize|fix_grammar|expand|title)$",
    )


class AiResponse(BaseModel):
    result: str
    action: str


@router.post("/generate", response_model=AiResponse)
async def generate(data: AiRequest):
    """Generate AI content (summarize, fix grammar, expand, suggest title)."""
    result = await generate_ai_content(data.text, data.action)
    return AiResponse(result=result or "", action=data.action)
