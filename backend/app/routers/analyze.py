from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AIServiceError,
    AITimeoutError,
    AnalysisResult,
    AnalyzeRequest,
)
from app.services import ai_service

router = APIRouter()


@router.post("/api/analyze", response_model=AnalysisResult)
async def analyze(request: AnalyzeRequest) -> AnalysisResult:
    try:
        return await ai_service.analyze_text(request.title, request.text)
    except AITimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
