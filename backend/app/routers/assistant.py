from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.schemas import (
    AIServiceError,
    AITimeoutError,
    AssistantChatRequest,
    AssistantChatResponse,
)
from app.services import chat_service
from app.services.anthropic_client import call_anthropic

router = APIRouter()

GENERAL_SYSTEM_PROMPT = (
    "You are a helpful AI assistant embedded in the Semantic Validator application. "
    "The Semantic Validator helps users upload documents and Excel files, analyze their "
    "content for meaning, tone, and clarity, deduplicate data, check text similarity, "
    "and chat with AI about their files. "
    "Answer questions helpfully and concisely. "
    "If the user asks about their data or files, let them know they can upload a file "
    "on the relevant page to get context-aware assistance."
)


@router.post("/api/assistant/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    request: AssistantChatRequest,
    _user: dict = Depends(get_current_user),
) -> AssistantChatResponse:
    """
    General-purpose AI assistant endpoint.

    - When ``file_context`` is provided, delegates to ``chat_service.chat`` which
      uses a document-grounded system prompt and truncates context to 12 000 chars.
    - When ``file_context`` is absent, calls ``call_anthropic`` directly with a
      general-purpose system prompt describing the Semantic Validator application.

    Returns HTTP 504 on AI timeout, HTTP 502 on AI service error.
    """
    try:
        if request.file_context:
            answer = await chat_service.chat(
                request.message,
                request.file_context,
                request.conversation_history,
            )
        else:
            messages = [
                {"role": turn.role, "content": turn.content}
                for turn in request.conversation_history
            ]
            messages.append({"role": "user", "content": request.message})
            answer = await call_anthropic(
                messages=messages,
                system=GENERAL_SYSTEM_PROMPT,
                temperature=0.5,
            )
        return AssistantChatResponse(answer=answer)
    except AITimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
