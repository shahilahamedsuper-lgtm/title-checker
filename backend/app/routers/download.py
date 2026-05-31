from fastapi import APIRouter, HTTPException, Response

from app.models.schemas import DownloadRequest
from app.services.file_generator_service import (
    FileGenerationError,
    UnsupportedContentTypeError,
    file_generator_service,
)

router = APIRouter()


@router.post("/api/download")
def download_file(request: DownloadRequest) -> Response:
    try:
        file_bytes, media_type, cleaned_filename = file_generator_service.generate(
            request.deduplicated_text,
            request.content_type,
            request.original_filename,
        )
    except UnsupportedContentTypeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except FileGenerationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred during file generation.")

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{cleaned_filename}"'},
    )
