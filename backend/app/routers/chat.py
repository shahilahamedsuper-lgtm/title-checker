from fastapi import APIRouter, HTTPException

from app.models.schemas import AIServiceError, AITimeoutError, ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter()


@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    try:
        answer = await chat_service.chat(
            request.message,
            request.file_context,
            request.conversation_history,
        )
        return ChatResponse(answer=answer)
    except AITimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
