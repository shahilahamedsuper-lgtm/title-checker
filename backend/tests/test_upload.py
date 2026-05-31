"""
Example-based tests for POST /api/upload endpoint.
Uses FastAPI TestClient (synchronous) to avoid asyncio complexity.
"""
import io
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.extraction_service import ExtractionError

client = TestClient(app)


class TestUploadSuccess:
    def test_valid_txt_file_returns_200_with_extracted_text(self):
        """POST /api/upload with a valid TXT file returns 200 with extracted_text and filename."""
        content = b"Hello, this is a test file."
        file = io.BytesIO(content)

        response = client.post(
            "/api/upload",
            files={"file": ("test.txt", file, "text/plain")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test.txt"
        assert data["extracted_text"] == "Hello, this is a test file."

    def test_empty_txt_file_returns_200_with_empty_extracted_text(self):
        """POST /api/upload with an empty TXT file returns 200 with empty extracted_text."""
        file = io.BytesIO(b"")

        response = client.post(
            "/api/upload",
            files={"file": ("empty.txt", file, "text/plain")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "empty.txt"
        assert data["extracted_text"] == ""


class TestUploadSizeLimit:
    def test_file_exceeding_10mb_returns_413(self):
        """POST /api/upload with a file > 10 MB returns 413."""
        oversized_data = b"x" * (10 * 1024 * 1024 + 1)
        file = io.BytesIO(oversized_data)

        response = client.post(
            "/api/upload",
            files={"file": ("big.txt", file, "text/plain")},
        )

        assert response.status_code == 413


class TestUploadUnsupportedType:
    def test_unsupported_mime_type_returns_422(self):
        """POST /api/upload with an unsupported MIME type (application/zip) returns 422."""
        file = io.BytesIO(b"PK\x03\x04fake zip content")

        response = client.post(
            "/api/upload",
            files={"file": ("archive.zip", file, "application/zip")},
        )

        assert response.status_code == 422


class TestUploadExtractionError:
    def test_extraction_error_returns_500(self):
        """POST /api/upload when ExtractionService raises ExtractionError returns 500."""
        file = io.BytesIO(b"some content")

        with patch(
            "app.routers.upload.extraction_service.extract",
            side_effect=ExtractionError("Failed to parse file"),
        ):
            response = client.post(
                "/api/upload",
                files={"file": ("broken.txt", file, "text/plain")},
            )

        assert response.status_code == 500
        assert "detail" in response.json()
