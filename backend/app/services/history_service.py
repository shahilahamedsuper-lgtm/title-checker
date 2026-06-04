"""
History service — backed by Supabase PostgreSQL (file_history table).

Public API is backward-compatible with the previous in-memory stub:
  record(filename, size_bytes, status, operation) -> dict
  get_all() -> list[dict]
  get_stats() -> dict
  store_excel_stats(entry_id, stats) -> None

New per-user API (used by authenticated endpoints):
  save_file_history(user_id, filename, content_type, size_bytes, operation) -> dict
  get_user_history(user_id, limit) -> list[dict]
  get_dashboard_stats(user_id) -> dict
"""
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import HTTPException, status

from app.services.auth_service import get_supabase


# ── Internal helpers ──────────────────────────────────────────────────────────

def _row_to_entry(row: dict) -> dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "uploaded_at": row.get("uploaded_at", datetime.now(timezone.utc).isoformat()),
        "size_bytes": row.get("size_bytes", 0),
        "status": row.get("status", "analyzed"),
        "operation": row["operation"],
        "content_type": row.get("content_type", ""),
        "user_id": row.get("user_id"),
    }


# ── Per-user Supabase API ─────────────────────────────────────────────────────

def save_file_history(
    user_id: str,
    filename: str,
    content_type: str,
    size_bytes: int,
    operation: str,
) -> dict:
    """Insert a file_history row for an authenticated user."""
    try:
        res = (
            get_supabase()
            .table("file_history")
            .insert(
                {
                    "user_id": user_id,
                    "filename": filename,
                    "content_type": content_type,
                    "size_bytes": size_bytes,
                    "operation": operation,
                    "status": "analyzed",
                }
            )
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error saving history: {exc}",
        )
    rows = res.data or []
    return _row_to_entry(rows[0]) if rows else {}


def get_user_history(user_id: str, limit: int = 50) -> list[dict]:
    """Return the most recent file_history rows for a user."""
    try:
        res = (
            get_supabase()
            .table("file_history")
            .select("*")
            .eq("user_id", user_id)
            .order("uploaded_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error fetching history: {exc}",
        )
    return [_row_to_entry(r) for r in (res.data or [])]


def get_dashboard_stats(user_id: str) -> dict:
    """
    Returns a DashboardStats-compatible dict for the given user.
    Counts analyzed files; excel_stats are populated separately via store_excel_stats.
    """
    try:
        res = (
            get_supabase()
            .table("file_history")
            .select("*")
            .eq("user_id", user_id)
            .order("uploaded_at", desc=True)
            .limit(200)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error fetching stats: {exc}",
        )

    rows = res.data or []
    files_analyzed = sum(1 for r in rows if r.get("status") == "analyzed")

    # Use excel_stats metadata if available on the most recent row that has it
    for r in rows:
        if r.get("excel_stats"):
            s = r["excel_stats"]
            return {
                "total_rows":     s.get("total_rows", 0),
                "total_columns":  s.get("total_columns", 0),
                "missing_values": s.get("missing_values", 0),
                "duplicate_rows": s.get("duplicate_rows", 0),
                "files_analyzed": files_analyzed,
                "last_updated":   datetime.now(timezone.utc).isoformat(),
            }

    return {
        "total_rows":     0,
        "total_columns":  0,
        "missing_values": 0,
        "duplicate_rows": 0,
        "files_analyzed": files_analyzed,
        "last_updated":   datetime.now(timezone.utc).isoformat(),
    }


# ── Backward-compatible API (used by upload/deduplicate routers) ──────────────
# These functions operate without a user_id, storing rows with user_id=None.
# They preserve the existing call-sites so no other routers need changing.

def record(
    filename: str,
    size_bytes: int,
    status_val: Literal["analyzed", "pending", "failed"],
    operation: Literal["upload", "analyze", "deduplicate", "excel"],
    content_type: str = "",
    user_id: str | None = None,
) -> dict:
    """Insert a file_history row. user_id is optional for backward compat."""
    try:
        res = (
            get_supabase()
            .table("file_history")
            .insert(
                {
                    "user_id": user_id,
                    "filename": filename,
                    "content_type": content_type,
                    "size_bytes": size_bytes,
                    "operation": operation,
                    "status": status_val,
                }
            )
            .execute()
        )
    except Exception:
        # Graceful degradation — don't let a history write failure break the main flow
        return {
            "id": f"hist_{uuid.uuid4().hex[:10]}",
            "filename": filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "size_bytes": size_bytes,
            "status": status_val,
            "operation": operation,
        }
    rows = res.data or []
    return _row_to_entry(rows[0]) if rows else {
        "id": f"hist_{uuid.uuid4().hex[:10]}",
        "filename": filename,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "size_bytes": size_bytes,
        "status": status_val,
        "operation": operation,
    }


def get_all() -> list[dict]:
    """Return recent history rows (no user filter — for backward compat)."""
    try:
        res = (
            get_supabase()
            .table("file_history")
            .select("*")
            .order("uploaded_at", desc=True)
            .limit(200)
            .execute()
        )
        return [_row_to_entry(r) for r in (res.data or [])]
    except Exception:
        return []


def get_stats() -> dict:
    """Aggregate stats (no user filter — for backward compat)."""
    try:
        res = (
            get_supabase()
            .table("file_history")
            .select("*")
            .order("uploaded_at", desc=True)
            .limit(200)
            .execute()
        )
        rows = res.data or []
    except Exception:
        rows = []

    files_analyzed = sum(1 for r in rows if r.get("status") == "analyzed")
    for r in rows:
        if r.get("excel_stats"):
            s = r["excel_stats"]
            return {
                "total_rows":     s.get("total_rows", 0),
                "total_columns":  s.get("total_columns", 0),
                "missing_values": s.get("missing_values", 0),
                "duplicate_rows": s.get("duplicate_rows", 0),
                "files_analyzed": files_analyzed,
                "last_updated":   datetime.now(timezone.utc).isoformat(),
            }
    return {
        "total_rows":     0,
        "total_columns":  0,
        "missing_values": 0,
        "duplicate_rows": 0,
        "files_analyzed": files_analyzed,
        "last_updated":   datetime.now(timezone.utc).isoformat(),
    }


def store_excel_stats(entry_id: str, stats: dict) -> None:
    """Update a history row with excel analysis metadata."""
    try:
        get_supabase().table("file_history").update(
            {"excel_stats": stats}
        ).eq("id", entry_id).execute()
    except Exception:
        pass  # Best-effort — don't crash on stat storage failure
