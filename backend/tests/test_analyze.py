"""
Integration tests for POST /api/analyze endpoint.
Uses FastAPI TestClient (synchronous) to avoid asyncio complexity.
"""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import AIServiceError, AITimeoutError, AnalysisResult

client = TestClient(app)

VALID_PAYLOAD = {"title": "Test Title", "text": "This is some test content for analysis."}

MOCK_RESULT = AnalysisResult(
    meaning="A concise summary of the content.",
    tone="formal",
    clarity_score=85,
    suggestions=["Improve sentence structure.", "Add more examples."],
)


class TestAnalyzeSuccess:
    def test_valid_input_returns_200_with_correct_shape(self):
        """POST /api/analyze with valid input and mocked ai_service returns 200 with AnalysisResult shape."""
        with patch(
            "app.routers.analyze.ai_service.analyze_text",
            new_callable=AsyncMock,
            return_value=MOCK_RESULT,
        ):
            response = client.post("/api/analyze", json=VALID_PAYLOAD)

        assert response.status_code == 200
        data = response.json()
        assert "meaning" in data
        assert "tone" in data
        assert "clarity_score" in data
        assert "suggestions" in data
        assert isinstance(data["meaning"], str) and data["meaning"]
        assert isinstance(data["tone"], str) and data["tone"]
        assert isinstance(data["clarity_score"], int)
        assert 0 <= data["clarity_score"] <= 100
        assert isinstance(data["suggestions"], list)
        assert 1 <= len(data["suggestions"]) <= 5


class TestAnalyzeValidation:
    def test_missing_title_returns_422(self):
        """POST /api/analyze with missing title field returns 422."""
        response = client.post("/api/analyze", json={"text": "Some content"})
        assert response.status_code == 422

    def test_missing_text_returns_422(self):
        """POST /api/analyze with missing text field returns 422."""
        response = client.post("/api/analyze", json={"title": "A title"})
        assert response.status_code == 422

    def test_empty_body_returns_422(self):
        """POST /api/analyze with empty body returns 422."""
        response = client.post("/api/analyze", json={})
        assert response.status_code == 422

    def test_empty_title_returns_422(self):
        """POST /api/analyze with empty title string returns 422."""
        response = client.post("/api/analyze", json={"title": "", "text": "Some content"})
        assert response.status_code == 422

    def test_empty_text_returns_422(self):
        """POST /api/analyze with empty text string returns 422."""
        response = client.post("/api/analyze", json={"title": "A title", "text": ""})
        assert response.status_code == 422

    def test_title_exceeds_max_length_returns_422(self):
        """POST /api/analyze with title > 200 chars returns 422."""
        response = client.post(
            "/api/analyze",
            json={"title": "x" * 201, "text": "Some content"},
        )
        assert response.status_code == 422

    def test_text_exceeds_max_length_returns_422(self):
        """POST /api/analyze with text > 5000 chars returns 422."""
        response = client.post(
            "/api/analyze",
            json={"title": "A title", "text": "x" * 5001},
        )
        assert response.status_code == 422


class TestAnalyzeErrorHandling:
    def test_ai_timeout_error_returns_504(self):
        """POST /api/analyze when AITimeoutError is raised returns 504."""
        with patch(
            "app.routers.analyze.ai_service.analyze_text",
            new_callable=AsyncMock,
            side_effect=AITimeoutError("AI provider timed out"),
        ):
            response = client.post("/api/analyze", json=VALID_PAYLOAD)

        assert response.status_code == 504
        assert "detail" in response.json()

    def test_ai_service_error_returns_502(self):
        """POST /api/analyze when AIServiceError is raised returns 502."""
        with patch(
            "app.routers.analyze.ai_service.analyze_text",
            new_callable=AsyncMock,
            side_effect=AIServiceError("AI provider returned an error"),
        ):
            response = client.post("/api/analyze", json=VALID_PAYLOAD)

        assert response.status_code == 502
        assert "detail" in response.json()


class TestCORS:
    def test_cors_header_present_for_configured_origin(self):
        """CORS Access-Control-Allow-Origin header is present for the configured origin."""
        from app.config import settings

        with patch(
            "app.routers.analyze.ai_service.analyze_text",
            new_callable=AsyncMock,
            return_value=MOCK_RESULT,
        ):
            response = client.post(
                "/api/analyze",
                json=VALID_PAYLOAD,
                headers={"Origin": settings.CORS_ORIGIN},
            )

        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == settings.CORS_ORIGIN
