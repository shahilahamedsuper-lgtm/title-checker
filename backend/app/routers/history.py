from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.schemas import DashboardStats, HistoryEntry
from app.services import history_service

router = APIRouter(tags=["history"])


@router.get("/api/history", response_model=list[HistoryEntry])
async def get_history(current_user: dict = Depends(get_current_user)):
    return history_service.get_user_history(current_user["id"])


@router.get("/api/dashboard-stats", response_model=DashboardStats)
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    return history_service.get_dashboard_stats(current_user["id"])
