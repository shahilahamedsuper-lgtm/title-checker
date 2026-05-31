"""
POST /api/deduplicate-excel

Accepts a raw Excel file upload, removes duplicate rows, and returns
the cleaned .xlsx file as a download — preserving all columns and structure.
"""
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.services.excel_dedup_service import deduplicate_excel_bytes

router = APIRouter()

EXCEL_MIME_TYPES = frozenset({
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
})

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/api/deduplicate-excel")
async def deduplicate_excel(file: UploadFile = File(...)):
    """
    Upload an Excel file → get back a cleaned .xlsx with duplicate rows removed.
    The response is a file download with the same column structure as the original.
    """
    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds the 10 MB limit.")

    # Accept by extension if MIME type is wrong
    filename = file.filename or "file.xlsx"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    ct = (file.content_type or "").strip().lower().split(";")[0].strip()

    if ct not in EXCEL_MIME_TYPES and ext not in ("xlsx", "xls"):
        raise HTTPException(
            status_code=422,
            detail="Only Excel files (.xlsx, .xls) are supported for this endpoint.",
        )

    try:
        cleaned_bytes, original_count, duplicates_removed = deduplicate_excel_bytes(data)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process Excel file: {exc}",
        )

    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    cleaned_filename = f"cleaned_{stem}.xlsx"

    return Response(
        content=cleaned_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{cleaned_filename}"',
            "X-Original-Rows": str(original_count),
            "X-Duplicates-Removed": str(duplicates_removed),
            "Access-Control-Expose-Headers": "X-Original-Rows, X-Duplicates-Removed",
        },
    )
