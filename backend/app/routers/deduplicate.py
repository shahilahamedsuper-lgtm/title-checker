from fastapi import APIRouter, HTTPException

from app.models.schemas import DeduplicateRequest, DeduplicationResult
from app.services.deduplication_service import UnsupportedContentTypeError, deduplication_service

router = APIRouter()


@router.post("/api/deduplicate", response_model=DeduplicationResult)
async def deduplicate(request: DeduplicateRequest) -> DeduplicationResult:
    try:
        return deduplication_service.deduplicate(request.text, request.content_type)
    except UnsupportedContentTypeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred during deduplication.")
