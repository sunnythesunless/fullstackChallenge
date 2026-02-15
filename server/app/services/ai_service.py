"""AI service — wraps Groq API for text generation."""

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client

    if not settings.GROQ_API_KEY:
        return None

    try:
        from groq import Groq
        _client = Groq(api_key=settings.GROQ_API_KEY)
        return _client
    except Exception as e:
        logger.warning(f"Groq API init failed: {e}")
        return None


async def generate_ai_content(text: str, action: str) -> Optional[str]:
    """
    Generate AI content based on the action type.

    Args:
        text: The input text from the blog post.
        action: One of "summarize", "fix_grammar", "expand", "title".

    Returns:
        The generated text, or a fallback message if API is unavailable.
    """
    client = _get_client()

    if client is None:
        return _fallback_response(text, action)

    prompts = {
        "summarize": (
            "You are an expert blog editor. Summarize the following blog post content "
            "into 2-3 concise sentences that capture the key points:\n\n"
            f"{text}"
        ),
        "fix_grammar": (
            "You are an expert editor. Fix the grammar, spelling, and punctuation in the "
            "following text. Return ONLY the corrected text, nothing else:\n\n"
            f"{text}"
        ),
        "expand": (
            "You are an expert blog writer. Expand on the following text, adding more detail, "
            "examples, and depth. Keep the same tone and style:\n\n"
            f"{text}"
        ),
        "title": (
            "You are an expert blog editor. Suggest 3 compelling blog post titles for the "
            "following content. Return them as a numbered list:\n\n"
            f"{text}"
        ),
    }

    prompt = prompts.get(action)
    if not prompt:
        return f"Unknown action: {action}"

    try:
        response = await _async_generate(client, prompt)
        return response
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return _fallback_response(text, action)


async def _async_generate(client, prompt: str) -> str:
    """Run the Groq API call in a thread to avoid blocking."""
    import asyncio
    loop = asyncio.get_event_loop()

    def _call():
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    return await loop.run_in_executor(None, _call)


def _fallback_response(text: str, action: str) -> str:
    """Provide a fallback when Groq API is not available."""
    if action == "summarize":
        words = text.split()
        summary = " ".join(words[:30])
        return f"Summary (offline): {summary}{'...' if len(words) > 30 else ''}"
    elif action == "fix_grammar":
        return text
    elif action == "expand":
        return f"{text}\n\n[AI expansion unavailable — configure GROQ_API_KEY in .env]"
    elif action == "title":
        return "1. [AI titles unavailable — configure GROQ_API_KEY in .env]"
    return text
