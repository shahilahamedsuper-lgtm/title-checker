"""
History service — tracks file operations in memory.
Replace with a database in production.
"""
import uuid
from datetime import datetime, timezone
from typing import Literal

_HISTORY: list[dict] = []


def record(
    filename: str,
    size_bytes: int,
    status: Literal["analyzed", "pending", "failed"],
    operation: Literal["upload", "analyze", "deduplicate", "excel"],
) -> dict:
    entry = {
        "id": f"hist_{uuid.uuid4().hex[:10]}",
        "filename": filename,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "size_bytes": size_bytes,
        "status": status,
        "operation": operation,
    }
    _HISTORY.insert(0, entry)          # newest first
    if len(_HISTORY) > 200:            # cap at 200 entries
        _HISTORY.pop()
    return entry


def get_all() -> list[dict]:
    return list(_HISTORY)


def get_stats() -> dict:
    """
    Aggregate stats for the dashboard summary.

    Priority:
    1. Use the most recent Excel analysis result (has full row/column/missing/dup data).
    2. Fall back to counting history entries for files_analyzed.
    """
    files_analyzed = sum(1 for h in _HISTORY if h["status"] == "analyzed")

    # Pull the most recent excel analysis result if stored
    for h in _HISTORY:
        if h.get("excel_stats"):
            s = h["excel_stats"]
            return {
                "total_rows":     s.get("total_rows", 0),
                "total_columns":  s.get("total_columns", 0),
                "missing_values": s.get("missing_values", 0),
                "duplicate_rows": s.get("duplicate_rows", 0),
                "files_analyzed": files_analyzed,
                "last_updated":   datetime.now(timezone.utc).isoformat(),
            }

    # No Excel analysis yet — return zero stats but real file count
    return {
        "total_rows":     0,
        "total_columns":  0,
        "missing_values": 0,
        "duplicate_rows": 0,
        "files_analyzed": files_analyzed,
        "last_updated":   datetime.now(timezone.utc).isoformat(),
    }


def store_excel_stats(entry_id: str, stats: dict) -> None:
    for h in _HISTORY:
        if h["id"] == entry_id:
            h["excel_stats"] = stats
            break
