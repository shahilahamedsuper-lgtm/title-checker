from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import UploadResult
from app.services import history_service
from app.services.extraction_service import (
    ExtractionError,
    ExtractionService,
    UnsupportedFileTypeError,
    extraction_service,
)

router = APIRouter()

# Map file extensions → canonical MIME types when the browser sends nothing useful
_EXT_TO_MIME: dict[str, str] = {
    ".txt":  "text/plain",
    ".pdf":  "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls":  "application/vnd.ms-excel",
    ".csv":  "text/plain",
}

_KNOWN_MIME_TYPES = frozenset(_EXT_TO_MIME.values())


def _resolve_content_type(filename: str | None, raw_content_type: str) -> str:
    """
    Return a reliable MIME type.
    If the browser sends an empty string or 'application/octet-stream',
    fall back to the file extension.
    """
    ct = (raw_content_type or "").strip().lower().split(";")[0].strip()
    if ct and ct != "application/octet-stream" and ct in _KNOWN_MIME_TYPES:
        return ct
    # Fall back to extension
    if filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in _EXT_TO_MIME:
            return _EXT_TO_MIME[ext]
    # Last resort
    return ct or "text/plain"


@router.post("/api/upload", response_model=UploadResult)
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()

    if len(data) > ExtractionService.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds the 10 MB limit.")

    content_type = _resolve_content_type(file.filename, file.content_type or "")

    try:
        text = extraction_service.extract(file.filename, content_type, data)
    except UnsupportedFileTypeError as exc:
        history_service.record(file.filename or "unknown", len(data), "failed", "upload")
        raise HTTPException(status_code=422, detail=str(exc))
    except ExtractionError as exc:
        history_service.record(file.filename or "unknown", len(data), "failed", "upload")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        history_service.record(file.filename or "unknown", len(data), "failed", "upload")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during file processing.")

    history_service.record(file.filename or "unknown", len(data), "analyzed", "upload")
    return UploadResult(
        extracted_text=text,
        filename=file.filename or "",
        content_type=content_type,   # always a valid MIME type now
    )
