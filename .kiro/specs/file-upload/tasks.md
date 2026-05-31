# Implementation Plan: File Upload

## Overview

Implement a file upload pipeline for the Semantic Validator app. The backend gains a new `ExtractionService` and `POST /api/upload` endpoint; the frontend gains an `uploadApi.ts`, a `FileUploader` component, and state-coordination changes in `Dashboard` and `AnalysisForm`.

## Tasks

- [x] 1. Backend — Add schemas and ExtractionService
  - [x] 1.1 Add `UploadResult` Pydantic schema to `backend/app/models/schemas.py`
    - Add `UploadResult(BaseModel)` with `extracted_text: str` and `filename: str`
    - _Requirements: 1.2_

  - [x] 1.2 Create `backend/app/services/extraction_service.py` with `ExtractionService`
    - Define `ExtractionError` and `UnsupportedFileTypeError` custom exceptions
    - Implement `ExtractionService` with `MAX_FILE_SIZE`, `SUPPORTED_MIME_TYPES`, and `extract()` dispatcher
    - Implement `_extract_txt()` (UTF-8 with `errors="replace"`), `_extract_pdf()`, `_extract_docx()`, `_extract_excel()`
    - Empty/blank files return `""` rather than raising
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 1.3 Write property tests for ExtractionService (Property 1 & 2)
    - Create `backend/tests/test_extraction_service.py`
    - **Property 1: Extraction always produces a string** — `given(supported_format_file())` → `extract()` returns `str`, never raises unhandled exception
    - **Validates: Requirements 2.6**
    - **Property 2: Extraction completeness** — `given(txt_with_tokens())` → all tokens appear in result; repeat for PDF, DOCX, Excel using in-memory builders
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Use `hypothesis` with `settings(max_examples=100)`
    - Tag each test: `# Feature: file-upload, Property N: <property_text>`

  - [ ]* 1.4 Write example-based unit tests for ExtractionService
    - File exactly at 10 MB → succeeds; file at 10 MB + 1 byte → raises size error
    - Empty TXT / PDF / DOCX / Excel → returns `""`
    - Non-UTF-8 bytes in TXT → returns string (no exception)
    - _Requirements: 2.5, 2.6_

- [x] 2. Backend — Upload router and wiring
  - [x] 2.1 Create `backend/app/routers/upload.py` with `POST /api/upload`
    - Validate file size (> 10 MB → 413) and MIME type (unsupported → 422)
    - Call `ExtractionService.extract()` and return `UploadResult`
    - Map `ExtractionError` → 500; unexpected exceptions → 500 with generic message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Register the upload router in `backend/app/main.py`
    - Import and include `upload.router` with the same CORS settings as the analyze router
    - _Requirements: 1.6_

  - [x] 2.3 Add extraction dependencies to `backend/requirements.txt`
    - Add `pypdf2` (or `pypdf`), `python-docx`, `openpyxl`, `python-multipart`
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 2.4 Write property tests for the upload endpoint (Properties 3 & 4)
    - **Property 3: Upload endpoint rejects unsupported MIME types** — `given(unsupported_mime_type())` → 422 with non-empty `detail`
    - **Validates: Requirements 1.3**
    - **Property 4: Upload response shape for supported files** — `given(supported_format_file())` → 200 with `filename` and `extracted_text` strings
    - **Validates: Requirements 1.2**
    - Use `hypothesis` with `settings(max_examples=100)`

  - [ ]* 2.5 Write example-based endpoint tests
    - `ExtractionService` mock raises `ExtractionError` → 500
    - File > 10 MB → 413
    - Valid PDF / DOCX / TXT / Excel → 200 with correct shape
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Checkpoint — Backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Frontend — Types and API layer
  - [x] 4.1 Add `UploadResult` and `UploaderState` types to `frontend/src/types.ts`
    - Add `UploadResult` interface (`extracted_text: string`, `filename: string`)
    - Add `UploaderState` discriminated union (`idle | dragging | uploading | success | error`)
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 4.2 Create `frontend/src/api/uploadApi.ts`
    - Implement `uploadFile(file: File): Promise<UploadResult>` using `multipart/form-data`
    - Mirror `analyzeApi.ts` error-handling: Axios `detail` → `Error`; network failure → user-friendly message
    - _Requirements: 1.1, 6.1, 6.2_

- [x] 5. Frontend — FileUploader component
  - [x] 5.1 Create `frontend/src/components/FileUploader.tsx`
    - Implement drag-and-drop zone with `onDragOver` / `onDrop` handlers and highlighted-border state
    - Hidden `<input type="file">` filtered to `.pdf,.docx,.txt,.xls,.xlsx`; click-to-open via `useRef`
    - Validate MIME type client-side before calling `uploadFile`; show inline error for unsupported types
    - Show loading indicator and disable input while uploading
    - On success: display filename, 300-char preview, "Populate Form" and "Analyze" buttons
    - On error: display server `detail` or network fallback message, "Try Again" button
    - Disable both action buttons when `isAnalyzing` prop is `true`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 5.1, 5.4, 6.1, 6.2, 6.3, 6.4, 7.3, 7.4_

  - [ ]* 5.2 Write property tests for FileUploader (Properties 5–10)
    - Create `frontend/src/__tests__/FileUploader.test.tsx`
    - **Property 5: Text truncation invariant** — `fc.string()` as `extracted_text` → text in form is `text.slice(0, 5000)`; warning shown iff `len > 5000`
    - **Validates: Requirements 4.2, 4.3, 5.2**
    - **Property 6: Filename-without-extension as fallback title** — `fc.tuple(fc.string(), fc.string())` as `[name, ext]` → title is `name` when form title is empty
    - **Validates: Requirements 5.3**
    - **Property 7: Preview is first 300 characters** — `fc.string()` as `extracted_text` → preview equals `text.slice(0, 300)`
    - **Validates: Requirements 3.5**
    - **Property 8: Unsupported file type blocks upload** — non-supported MIME → `uploadFile` not called, error shown
    - **Validates: Requirements 3.6**
    - **Property 9: Server error message surfaced verbatim** — `fc.string()` as server `detail` → displayed verbatim
    - **Validates: Requirements 6.1**
    - **Property 10: Try Again resets to idle** — any error state → click Try Again → idle with no filename/preview/error
    - **Validates: Requirements 6.3, 6.4**
    - Use `fast-check` with `{ numRuns: 100 }`
    - Tag each test: `// Feature: file-upload, Property N: <property_text>`

  - [ ]* 5.3 Write example-based unit tests for FileUploader
    - Dragover → highlighted border class applied
    - Drop → `uploadFile` called
    - Upload in progress → loading indicator shown, input disabled
    - Successful upload → "Populate Form" and "Analyze" buttons rendered
    - `isAnalyzing=true` → both action buttons disabled
    - Network failure → fixed fallback message shown
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 5.1, 5.4, 6.2_

- [x] 6. Frontend — AnalysisForm and Dashboard wiring
  - [x] 6.1 Extend `AnalysisForm` props in `frontend/src/components/AnalysisForm.tsx`
    - Add optional `externalTitle?: string` and `externalText?: string` to `AnalysisFormProps`
    - Add `useEffect` hooks to sync internal `title` / `text` state when these props change
    - Preserve full backward compatibility (component works without the new props)
    - _Requirements: 4.2, 5.2_

  - [x] 6.2 Update `frontend/src/pages/Dashboard.tsx`
    - Add `externalTitle`, `externalText`, `truncationWarning` state and `analysisFormRef`
    - Implement `handlePopulate(text)`: truncate to 5000, set `truncationWarning`, set `externalText`, scroll ref into view
    - Implement `handleAnalyze(text, fallbackTitle)`: truncate, set state, call `handleSubmit` with resolved title and text
    - Render `FileUploader` above the existing two-column grid, inside a white card (`rounded-xl shadow-sm border border-slate-200 p-6`)
    - Pass `externalTitle` / `externalText` to `AnalysisForm`; pass `onPopulate` / `onAnalyze` / `isAnalyzing` to `FileUploader`
    - Show truncation warning banner when `truncationWarning` is `true`
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3, 7.1, 7.2_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–10 from design)
- Unit tests validate specific examples and edge cases
