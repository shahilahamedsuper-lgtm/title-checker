from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import AIServiceError, AITimeoutError, ExcelAnalysisResult
from app.services import history_service
from app.services.excel_analysis_service import (
    EXCEL_MIME_TYPES,
    MAX_FILE_SIZE,
    ExcelParseError,
    FileTooLargeError,
    UnsupportedExcelTypeError,
    excel_analysis_service,
)

router = APIRouter()


@router.post("/api/analyze-excel", response_model=ExcelAnalysisResult)
async def analyze_excel_file(file: UploadFile = File(...)) -> ExcelAnalysisResult:
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File exceeds the 10 MB size limit.")
    if file.content_type not in EXCEL_MIME_TYPES:
        raise HTTPException(status_code=422, detail="Only Excel files (.xlsx, .xls) are supported.")
    try:
        result = await excel_analysis_service.analyze(
            file.filename or "", file.content_type or "", data
        )
        # Record history + store stats
        entry = history_service.record(file.filename or "unknown", len(data), "analyzed", "excel")
        history_service.store_excel_stats(entry["id"], {
            "total_rows": len(result.rows),
            "total_columns": len(result.headers),
            "missing_values": sum(c.missing_count for c in result.column_stats),
            "duplicate_rows": result.duplicate_row_count,
        })
        return result
    except ExcelParseError as exc:
        history_service.record(file.filename or "unknown", len(data), "failed", "excel")
        raise HTTPException(status_code=422, detail=str(exc))
    except FileTooLargeError as exc:
        history_service.record(file.filename or "unknown", len(data), "failed", "excel")
        raise HTTPException(status_code=422, detail=str(exc))
    except UnsupportedExcelTypeError as exc:
        history_service.record(file.filename or "unknown", len(data), "failed", "excel")
        raise HTTPException(status_code=422, detail=str(exc))
    except AITimeoutError:
        history_service.record(file.filename or "unknown", len(data), "failed", "excel")
        raise HTTPException(status_code=504, detail="AI provider timed out.")
    except AIServiceError:
        history_service.record(file.filename or "unknown", len(data), "failed", "excel")
        raise HTTPException(status_code=502, detail="AI provider error.")
