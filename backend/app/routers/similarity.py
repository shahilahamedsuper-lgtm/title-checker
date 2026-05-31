from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.similarity_service import (
    SimilarityMatch,
    check_similarity,
    get_checked_history,
    get_corpus,
    add_title,
)

router = APIRouter(prefix="/api", tags=["similarity"])


class CheckTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    top_n: int = Field(default=5, ge=1, le=20)


class CheckTitleResponse(BaseModel):
    query: str
    score: int
    status: str
    matches: list[SimilarityMatch]


class AddTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


@router.post("/check-title-similarity", response_model=CheckTitleResponse)
async def check_title_similarity(body: CheckTitleRequest):
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="Title cannot be empty.")
    result = check_similarity(body.title, top_n=body.top_n)
    return CheckTitleResponse(**result)


@router.post("/add-title")
async def add_title_to_corpus(body: AddTitleRequest):
    """Add a title to the similarity corpus (called after upload/analysis)."""
    add_title(body.title)
    return {"message": "Title added to corpus.", "corpus_size": len(get_corpus())}


@router.get("/similarity-history")
async def similarity_history(limit: int = 10):
    return get_checked_history(limit=limit)


@router.get("/corpus")
async def list_corpus():
    return {"titles": get_corpus(), "count": len(get_corpus())}
