"""
Integration tests for POST /api/deduplicate endpoint.
Uses FastAPI TestClient (synchronous) to avoid asyncio complexity.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.deduplication_service import DeduplicationService

client = TestClient(app)

EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
TEXT_MIME = "text/plain"
UNSUPPORTED_MIME = "image/png"


# ---------------------------------------------------------------------------
# Endpoint tests
# ---------------------------------------------------------------------------

class TestDeduplicateWithDuplicates:
    def test_duplicate_lines_returns_200_and_removes_duplicates(self):
        """POST /api/deduplicate with duplicate lines returns 200 and duplicates_removed > 0."""
        payload = {
            "text": "apple\nbanana\napple\ncherry\nbanana",
            "content_type": TEXT_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["duplicates_removed"] > 0


class TestDeduplicateNoDuplicates:
    def test_no_duplicates_returns_200_and_zero_removed(self):
        """POST /api/deduplicate with unique lines returns 200 and duplicates_removed == 0."""
        payload = {
            "text": "apple\nbanana\ncherry",
            "content_type": TEXT_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["duplicates_removed"] == 0


class TestDeduplicateEmptyText:
    def test_empty_text_returns_200_and_zero_removed(self):
        """POST /api/deduplicate with empty text returns 200 and duplicates_removed == 0."""
        payload = {
            "text": "",
            "content_type": TEXT_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["duplicates_removed"] == 0


class TestDeduplicateUnsupportedMime:
    def test_unsupported_mime_type_returns_422(self):
        """POST /api/deduplicate with unsupported MIME type returns 422."""
        payload = {
            "text": "some content",
            "content_type": UNSUPPORTED_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 422


class TestDeduplicateExcelMime:
    def test_excel_mime_returns_200_and_tabular_category(self):
        """POST /api/deduplicate with Excel MIME type returns 200 and file_type_category == 'tabular'."""
        payload = {
            "text": "row1\nrow2\nrow1",
            "content_type": EXCEL_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["file_type_category"] == "tabular"


class TestDeduplicateTextMime:
    def test_text_mime_returns_200_and_text_category(self):
        """POST /api/deduplicate with text/plain MIME type returns 200 and file_type_category == 'text'."""
        payload = {
            "text": "hello\nworld",
            "content_type": TEXT_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["file_type_category"] == "text"


class TestDeduplicateBlankLinesPreserved:
    def test_blank_lines_are_preserved_in_deduplicated_text(self):
        """Blank lines in input are preserved in deduplicated_text output."""
        payload = {
            "text": "apple\n\nbanana\n\napple",
            "content_type": TEXT_MIME,
        }
        response = client.post("/api/deduplicate", json=payload)
        assert response.status_code == 200
        data = response.json()
        deduplicated = data["deduplicated_text"]
        # Both blank lines should still be present
        assert "\n\n" in deduplicated


# ---------------------------------------------------------------------------
# Unit tests for DeduplicationService internals
# ---------------------------------------------------------------------------

class TestNormalizeLine:
    def setup_method(self):
        self.service = DeduplicationService()

    def test_strips_leading_and_trailing_whitespace(self):
        assert self.service._normalize_line("  hello  ") == "hello"

    def test_collapses_internal_whitespace(self):
        assert self.service._normalize_line("hello   world") == "hello world"

    def test_empty_string_returns_empty(self):
        assert self.service._normalize_line("") == ""

    def test_only_whitespace_returns_empty(self):
        assert self.service._normalize_line("   ") == ""

    def test_tabs_collapsed_to_single_space(self):
        assert self.service._normalize_line("hello\tworld") == "hello world"

    def test_mixed_whitespace_collapsed(self):
        assert self.service._normalize_line("  hello \t world  ") == "hello world"


class TestDeduplicateLines:
    def setup_method(self):
        self.service = DeduplicationService()

    def test_blank_lines_are_never_deduplicated(self):
        text = "a\n\n\nb"
        result, removed = self.service._deduplicate_lines(text)
        # Both blank lines should be kept
        assert result.count("\n\n") >= 1
        assert removed == 0

    def test_duplicate_non_blank_lines_are_removed(self):
        text = "foo\nbar\nfoo"
        result, removed = self.service._deduplicate_lines(text)
        assert removed == 1
        assert result == "foo\nbar"

    def test_blank_lines_preserved_alongside_duplicates(self):
        text = "x\n\nx\n\ny"
        result, removed = self.service._deduplicate_lines(text)
        lines = result.split("\n")
        # blank lines should still be present
        assert "" in lines
        assert removed == 1
