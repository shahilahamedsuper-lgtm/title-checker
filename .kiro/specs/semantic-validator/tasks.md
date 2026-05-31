# Implementation Plan: Semantic Validator

## Overview

Full-stack implementation of the Semantic Validator application. The backend is a stateless FastAPI service that proxies requests to an AI provider and returns structured analysis results. The frontend is a React + Tailwind SPA that submits text and renders the analysis. Tasks are ordered so each step integrates cleanly into the previous one.

## Tasks

- [x] 1. Set up project structure and configuration
  - Create `backend/` directory with `app/main.py`, `app/config.py`, `app/models/schemas.py`, `app/routers/analyze.py`, `app/services/ai_service.py`
  - Create `frontend/` directory bootstrapped with Vite + React + TypeScript + Tailwind CSS
  - Add `backend/requirements.txt` with `fastapi`, `uvicorn`, `pydantic`, `httpx`, `python-dotenv`, `hypothesis`, `pytest`, `pytest-asyncio`
  - Add `frontend/package.json` dependencies: `axios`, `react-router-dom`, `fast-check`, `vitest`, `@testing-library/react`
  - Create `.env.example` for backend with `AI_API_KEY`, `AI_API_URL`, `CORS_ORIGIN`, `AI_TIMEOUT_SECONDS=30`
  - _Requirements: 7.1, 7.4_

- [x] 2. Implement backend data models and configuration
  - [x] 2.1 Implement Pydantic schemas in `app/models/schemas.py`
    - Write `AnalyzeRequest` with `title` (min 1, max 200) and `text` (min 1, max 5000)
    - Write `AnalysisResult` with `meaning: str`, `tone: str`, `clarity_score: int` (ge=0, le=100), `suggestions: list[str]` (min 1, max 5 items)
    - Write `ErrorResponse` with `detail: str`
    - Write `AITimeoutError` and `AIServiceError` custom exception classes
    - _Requirements: 7.1, 7.2, 7.3, 2.2_

  - [ ]* 2.2 Write property test for `AnalyzeRequest` and `AnalysisResult` validation
    - **Property 1: Invalid input rejection**
    - **Validates: Requirements 1.3, 1.4, 7.3**
    - Use Hypothesis to generate empty strings, whitespace-only strings, and strings exceeding max lengths; assert `ValidationError` is raised
    - Use Hypothesis to generate valid inputs; assert no `ValidationError` is raised

  - [ ]* 2.3 Write property test for `AnalysisResult` schema invariants
    - **Property 2: Analysis result completeness**
    - **Validates: Requirements 2.2, 3.1, 7.2**
    - Generate random valid `AnalysisResult` dicts; assert `clarity_score` in [0, 100], `suggestions` has 1–5 non-empty strings, `meaning` and `tone` are non-empty

  - [x] 2.4 Implement `app/config.py`
    - Load `AI_API_KEY`, `AI_API_URL`, `CORS_ORIGIN`, `AI_TIMEOUT_SECONDS` from environment using `pydantic-settings` or `python-dotenv`
    - _Requirements: 7.4_

- [x] 3. Implement AI service and route handler
  - [x] 3.1 Implement `app/services/ai_service.py`
    - Write `analyze_text(title: str, text: str) -> AnalysisResult` async function
    - Construct a structured prompt instructing the AI to return JSON matching `AnalysisResult`
    - Use `httpx.AsyncClient` to POST to the AI provider
    - Wrap the call with `asyncio.wait_for` using `AI_TIMEOUT_SECONDS`; raise `AITimeoutError` on `asyncio.TimeoutError`
    - Raise `AIServiceError` on non-2xx AI provider responses or JSON parse failures
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 3.2 Implement `app/routers/analyze.py` route handler
    - Register `POST /api/analyze` returning `AnalysisResult`
    - Validate request with `AnalyzeRequest` Pydantic model (FastAPI handles 422 automatically)
    - Call `ai_service.analyze_text`; catch `AITimeoutError` → HTTP 504, `AIServiceError` → HTTP 502
    - _Requirements: 7.1, 7.2, 7.3, 2.4, 2.5_

  - [x] 3.3 Implement `app/main.py`
    - Create FastAPI app instance
    - Add `CORSMiddleware` with `CORS_ORIGIN` from config
    - Register the analyze router
    - _Requirements: 7.4_

  - [ ]* 3.4 Write property test for AI timeout → 504
    - **Property 5: AI timeout produces 504**
    - **Validates: Requirements 2.4**
    - Mock `ai_service.analyze_text` to always raise `AITimeoutError`; generate random valid requests; assert handler returns 504

  - [ ]* 3.5 Write property test for AI provider error → 502
    - **Property 6: AI provider error produces 502**
    - **Validates: Requirements 2.5**
    - Mock `ai_service.analyze_text` to always raise `AIServiceError`; generate random valid requests; assert handler returns 502

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Run `pytest` in `backend/`; ensure all property and unit tests pass; ask the user if questions arise.

- [x] 5. Implement frontend TypeScript types and API client
  - [x] 5.1 Define TypeScript interfaces in `src/types.ts`
    - Write `AnalysisResult`, `AnalyzeRequest`, and `PanelState` (union: idle | loading | success | error)
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Implement `src/api/analyzeApi.ts`
    - Write `analyzeText(title: string, text: string): Promise<AnalysisResult>` using Axios
    - Map Axios errors: network error → throw with "Service unavailable" message; 4xx/5xx → throw with `detail` from response body
    - _Requirements: 7.1, 8.1, 8.2_

- [x] 6. Implement frontend UI components
  - [x] 6.1 Implement `CharCounter` component
    - Accept `current: number` and `max: number` props; render `{current}/{max}`; apply red styling when `current >= max`
    - _Requirements: 1.4_

  - [x] 6.2 Implement `FieldError` component
    - Accept `message: string | undefined`; render inline error text when message is present
    - _Requirements: 1.3_

  - [x] 6.3 Implement `AnalysisForm` component
    - Render title input (max 200) and body textarea (max 5000) with `CharCounter` and `FieldError` per field
    - Block submission and show `FieldError` when either field is empty or over limit
    - Disable submit button when `isLoading` is true
    - Call `onSubmit(title, text)` on valid submission
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.3_

  - [ ]* 6.4 Write property test for `AnalysisForm` validation
    - **Property 1 (frontend): Invalid input rejection**
    - **Validates: Requirements 1.3, 1.4**
    - Use fast-check to generate empty/whitespace/over-limit strings; assert submit is blocked and error is displayed

  - [x] 6.5 Implement `SuggestionItem` component
    - Render suggestion text; on click call `navigator.clipboard.writeText(suggestion)` and show a brief confirmation message
    - _Requirements: 3.2, 3.3_

  - [ ]* 6.6 Write property test for `SuggestionItem` clipboard round-trip
    - **Property 4: Suggestion clipboard round-trip**
    - **Validates: Requirements 3.3**
    - Use fast-check to generate arbitrary suggestion strings; simulate click; assert `navigator.clipboard.writeText` called with exact string

  - [x] 6.7 Implement `ResultsPanel` component
    - Accept `state: PanelState` prop
    - Render `PlaceholderState` when `status === "idle"`
    - Render `LoadingState` (spinner) when `status === "loading"`
    - Render `ErrorState` with human-readable message when `status === "error"`
    - Render `AnalysisResult` view (meaning, tone, clarity score, suggestions via `SuggestionItem`) when `status === "success"`
    - _Requirements: 2.3, 3.2, 5.2, 5.3, 5.4, 8.1_

  - [ ]* 6.8 Write property test for `ResultsPanel` display completeness
    - **Property 3: Result display completeness**
    - **Validates: Requirements 2.3, 3.2, 5.4**
    - Use fast-check to generate random `AnalysisResult` objects; render `ResultsPanel`; assert meaning, tone, clarity_score, and every suggestion appear as visible elements

  - [ ]* 6.9 Write property test for `ResultsPanel` error display
    - **Property 7: Backend error triggers UI error display**
    - **Validates: Requirements 8.1**
    - Use fast-check to generate various error messages; render `ResultsPanel` with `status === "error"`; assert a human-readable message is rendered

- [x] 7. Implement `ErrorBoundary`, `Navbar`, and `Dashboard`
  - [x] 7.1 Implement `ErrorBoundary` class component in `src/components/ErrorBoundary.tsx`
    - Catch unhandled render errors via `componentDidCatch`; render a fallback error UI instead of crashing
    - _Requirements: 8.3_

  - [ ]* 7.2 Write property test for `ErrorBoundary` fallback
    - **Property 8: Unhandled frontend error triggers fallback UI**
    - **Validates: Requirements 8.3**
    - Use fast-check to generate components that throw arbitrary errors during render; assert `ErrorBoundary` renders fallback UI

  - [x] 7.3 Implement `Navbar` component in `src/components/Navbar.tsx`
    - Display "Semantic Validator" brand link navigating to `/`
    - Display Dashboard nav link; apply active styling when on `/`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.4 Implement `Dashboard` page in `src/pages/Dashboard.tsx`
    - Manage `PanelState` with `useState`
    - On `AnalysisForm` submit: set state to `loading`, call `analyzeText`, set state to `success` or `error`
    - Render `AnalysisForm` and `ResultsPanel` side-by-side on ≥768px, stacked on <768px (Tailwind responsive classes)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [x] 7.5 Wire up `App.tsx` with React Router, `ErrorBoundary`, and `Navbar`
    - Wrap app in `ErrorBoundary`; render `Navbar` and `<Routes>` with `/` → `Dashboard`
    - _Requirements: 4.1, 8.3_

- [x] 8. Checkpoint — Ensure all frontend tests pass
  - Run `vitest --run` in `frontend/`; ensure all property and unit tests pass; ask the user if questions arise.

- [x] 9. Integration and final wiring
  - [x] 9.1 Write backend integration test for `POST /api/analyze`
    - Use `pytest` + `httpx.AsyncClient` with a mocked AI provider; assert full `AnalysisResult` response shape and HTTP 200
    - Assert CORS `Access-Control-Allow-Origin` header is present for the configured origin
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 9.2 Write Playwright responsive layout tests
    - Test layout at 320px, 768px, and 1280px viewports; assert stacked vs side-by-side layout as per requirements
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Run full test suite (`pytest` backend + `vitest --run` frontend); ensure everything passes; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (backend) and fast-check (frontend)
- Checkpoints ensure incremental validation at natural boundaries
