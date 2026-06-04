from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    text: str = Field(..., min_length=1, max_length=5000)


class AnalysisResult(BaseModel):
    meaning: str
    tone: str
    clarity_score: int = Field(..., ge=0, le=100)
    suggestions: list[str] = Field(..., min_length=1, max_length=5)


class ErrorResponse(BaseModel):
    detail: str


class AITimeoutError(Exception):
    """Raised when the AI provider does not respond within the timeout."""


class AIServiceError(Exception):
    """Raised when the AI provider returns an error or unparseable response."""


class UploadResult(BaseModel):
    extracted_text: str
    filename: str
    content_type: str


class DeduplicateRequest(BaseModel):
    text: str
    content_type: str


class DeduplicationResult(BaseModel):
    original_text: str
    deduplicated_text: str
    duplicates_removed: int
    file_type_category: Literal["text", "tabular"]


class DownloadRequest(BaseModel):
    deduplicated_text: str
    content_type: str
    original_filename: str


class NumericStats(BaseModel):
    min: float
    max: float
    mean: float


class ColumnStats(BaseModel):
    name: str
    dtype: Literal["numeric", "text", "date", "boolean", "mixed"]
    missing_count: int
    unique_count: int
    numeric_stats: NumericStats | None = None


class ExcelAnalysisResult(BaseModel):
    headers: list[str]
    rows: list[list[Any]]
    column_stats: list[ColumnStats]
    duplicate_row_count: int
    ai_summary: str | None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    file_context: str = Field(..., min_length=1)
    conversation_history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    file_context: Optional[str] = None
    conversation_history: list[ChatMessage] = Field(default_factory=list)


class AssistantChatResponse(BaseModel):
    answer: str


# ── Auth schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1)


class SendOTPRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)


class VerifyOTPRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    otp: str = Field(..., min_length=4, max_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfile"


class UserProfile(BaseModel):
    id: str
    email: str
    name: str


class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6)


# ── History schemas ───────────────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    id: str
    filename: str
    uploaded_at: str          # ISO-8601
    size_bytes: int
    status: Literal["analyzed", "pending", "failed"]
    operation: Literal["upload", "analyze", "deduplicate", "excel"]


class DashboardStats(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    duplicate_rows: int
    files_analyzed: int
    last_updated: str         # ISO-8601
