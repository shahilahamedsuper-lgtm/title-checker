"""
AI client — backed by the Google Gemini generateContent REST API.

The public interface (call_anthropic) is kept identical so that all callers
(ai_service.py, chat_service.py, assistant.py) require zero changes.

Gemini REST format:
  - Endpoint : POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}
  - Auth     : API key as query param (no Authorization header needed)
  - System   : top-level "system_instruction" field with parts[0].text
  - Messages : "contents" array with role "user" / "model" (not "assistant")
  - Response : candidates[0].content.parts[0].text
"""
from __future__ import annotations

import logging

import httpx

from app.config import settings
from app.models.schemas import AIServiceError, AITimeoutError

logger = logging.getLogger(__name__)

MAX_OUTPUT_TOKENS = 4096


def _build_gemini_url() -> str:
    """Build the full Gemini endpoint URL with the API key as a query param.
    
    The model name in .env should NOT include the 'models/' prefix.
    The API requires: /v1beta/models/{model}:generateContent
    """
    # Strip 'models/' prefix if accidentally included in config
    model = settings.AI_MODEL.removeprefix("models/")
    return (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={settings.AI_API_KEY}"
    )


def _to_gemini_role(role: str) -> str:
    """Convert OpenAI-style role names to Gemini role names."""
    # Gemini uses "model" instead of "assistant"
    return "model" if role == "assistant" else "user"


async def call_anthropic(
    messages: list[dict],
    system: str | None = None,
    temperature: float = 0.3,
) -> str:
    """
    Call the Google Gemini generateContent API.

    Args:
        messages: List of {"role": "user"|"assistant", "content": str} dicts.
        system:   Optional system prompt string.
        temperature: Sampling temperature (0.0–1.0).

    Returns:
        The assistant's reply as a plain string.

    Raises:
        AITimeoutError: If the request times out.
        AIServiceError: If the API returns an error or unparseable response.
    """
    # Convert messages to Gemini "contents" format
    contents = [
        {"role": _to_gemini_role(m["role"]), "parts": [{"text": m["content"]}]}
        for m in messages
    ]

    payload: dict = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
            "temperature": temperature,
        },
    }

    # System instruction is a top-level field in Gemini
    if system:
        payload["system_instruction"] = {"parts": [{"text": system}]}

    url = _build_gemini_url()

    logger.debug("Calling Gemini API: model=%s", settings.AI_MODEL)

    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
    except httpx.TimeoutException:
        raise AITimeoutError("AI provider did not respond within the timeout period.")

    if response.status_code != 200:
        try:
            err = response.json()
            detail = err.get("error", {}).get("message", f"HTTP {response.status_code}")
        except Exception:
            detail = f"HTTP {response.status_code}"
        print(
            f"[AI ERROR] status={response.status_code} model={settings.AI_MODEL} "
            f"key_prefix={settings.AI_API_KEY[:12] + '...' if settings.AI_API_KEY else '(empty)'} "
            f"detail={detail}",
            flush=True,
        )
        logger.error(
            "Gemini API error: status=%s model=%s detail=%s",
            response.status_code,
            settings.AI_MODEL,
            detail,
        )
        if response.status_code == 429:
            raise AIServiceError(f"Gemini quota exceeded or rate limited. Detail: {detail}")
        if response.status_code == 400:
            raise AIServiceError(f"Gemini bad request (check API key or model name). Detail: {detail}")
        if response.status_code == 403:
            raise AIServiceError(f"Invalid Gemini API key. Please check AI_API_KEY in .env. Detail: {detail}")
        raise AIServiceError(f"Gemini API error: {detail}")

    try:
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        raise AIServiceError(f"Failed to parse Gemini response: {exc}") from exc
