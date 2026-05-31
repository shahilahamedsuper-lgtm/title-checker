"""
Example-based integration tests for POST /api/download endpoint.
Uses FastAPI TestClient (synchronous).
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TXT_MIME = "text/plain"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PDF_MIME = "application/pdf"
UNSUPPORTED_MIME = "image/png"

SAMPLE_TEXT = "line one\nline two\nline three"
SAMPLE_FILENAME = "document.txt"


def _payload(content_type: str, filename: str = SAMPLE_FILENAME) -> dict:
    return {
        "deduplicated_text": SAMPLE_TEXT,
        "content_type": content_type,
        "original_filename": filename,
    }


class TestDownloadTxt:
    def test_txt_returns_200_with_text_plain_content_type(self):
        """POST /api/download with text/plain returns 200 and Content-Type text/plain."""
        response = client.post("/api/download", json=_payload(TXT_MIME))
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]

    def test_txt_content_disposition_contains_cleaned_prefix(self):
        """POST /api/download with text/plain has Content-Disposition with 'cleaned_' prefix."""
        response = client.post("/api/download", json=_payload(TXT_MIME))
        assert response.status_code == 200
        assert "cleaned_" in response.headers["content-disposition"]


class TestDownloadDocx:
    def test_docx_returns_200_with_docx_content_type(self):
        """POST /api/download with DOCX MIME returns 200 and correct Content-Type."""
        response = client.post(
            "/api/download",
            json=_payload(DOCX_MIME, "document.docx"),
        )
        assert response.status_code == 200
        assert DOCX_MIME in response.headers["content-type"]


class TestDownloadXlsx:
    def test_xlsx_returns_200_with_xlsx_content_type(self):
        """POST /api/download with XLSX MIME returns 200 and correct Content-Type."""
        response = client.post(
            "/api/download",
            json=_payload(XLSX_MIME, "spreadsheet.xlsx"),
        )
        assert response.status_code == 200
        assert XLSX_MIME in response.headers["content-type"]


class TestDownloadPdf:
    def test_pdf_returns_200_with_text_plain_fallback(self):
        """POST /api/download with PDF MIME returns 200 and text/plain (PDF fallback)."""
        response = client.post(
            "/api/download",
            json=_payload(PDF_MIME, "report.pdf"),
        )
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]

    def test_pdf_fallback_filename_ends_with_txt(self):
        """POST /api/download with PDF MIME produces a filename ending in .txt."""
        response = client.post(
            "/api/download",
            json=_payload(PDF_MIME, "report.pdf"),
        )
        assert response.status_code == 200
        disposition = response.headers["content-disposition"]
        assert disposition.endswith('.txt"') or disposition.endswith(".txt")


class TestDownloadUnsupported:
    def test_unsupported_content_type_returns_422(self):
        """POST /api/download with unsupported MIME type returns 422."""
        response = client.post("/api/download", json=_payload(UNSUPPORTED_MIME))
        assert response.status_code == 422


class TestDownloadContentDisposition:
    def test_content_disposition_contains_attachment(self):
        """Content-Disposition header contains 'attachment'."""
        response = client.post("/api/download", json=_payload(TXT_MIME))
        assert response.status_code == 200
        assert "attachment" in response.headers["content-disposition"]

    def test_content_disposition_contains_cleaned_prefix(self):
        """Content-Disposition header contains 'cleaned_' prefix in filename."""
        response = client.post("/api/download", json=_payload(TXT_MIME))
        assert response.status_code == 200
        assert "cleaned_" in response.headers["content-disposition"]
