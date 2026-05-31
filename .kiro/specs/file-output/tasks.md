# Implementation Plan: File Output

## Overview

Add file generation and download capability to the deduplication flow. The backend gains a `FileGeneratorService` and a `POST /api/download` endpoint; the frontend threads the original filename through `FileUploader` → `Dashboard` → `BeforeAfterPanel` and adds a download button.

## Tasks

- [x] 1. Add `DownloadRequest` schema and `FileGeneratorService`
  - Add `DownloadRequest` Pydantic model to `backend/app/models/schemas.py` with fields `deduplicated_text`, `content_type`, and `original_filename`
  - Create `backend/app/services/file_generator_service.py` with `FileGenerationError`, `UnsupportedContentTypeError`, and `FileGeneratorService`
  - Implement `_build_txt`, `_build_docx`, and `_build_xlsx` private methods
  - Implement `generate()` dispatching on `content_type` per the format dispatch table, including PDF fallback (stem replacement to `.txt`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.1 Write property test for TXT round-trip (Property 1)
    - **Property 1: TXT generation round-trip**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 1.2 Write property test for DOCX paragraph structure (Property 2)
    - **Property 2: DOCX paragraph structure**
    - **Validates: Requirements 1.2**

  - [ ]* 1.3 Write property test for XLSX row structure (Property 3)
    - **Property 3: XLSX row structure**
    - **Validates: Requirements 1.3**

  - [ ]* 1.4 Write unit tests for `FileGeneratorService`
    - One test per format verifying correct output structure
    - One test for unsupported `content_type` raising `UnsupportedContentTypeError`
    - One test for builder exception propagating as `FileGenerationError`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Implement `POST /api/download` router
  - Create `backend/app/routers/download.py` with a `POST /api/download` route
  - Inject `FileGeneratorService`, call `generate()`, and return a `StreamingResponse` with `Content-Disposition: attachment; filename="<cleaned_filename>"`
  - Map `UnsupportedContentTypeError` → HTTP 422 and `FileGenerationError` → HTTP 500 with descriptive `detail`
  - Register the router in `backend/app/main.py`
  - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.1 Write property test for response header mapping (Property 4)
    - **Property 4: Response header mapping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ]* 2.2 Write property test for unsupported content_type returns 422 (Property 5)
    - **Property 5: Unsupported content_type returns 422**
    - **Validates: Requirements 1.5**

  - [ ]* 2.3 Write unit tests for `POST /api/download` router
    - HTTP 422 on unsupported `content_type`
    - HTTP 500 on `FileGenerationError`
    - Correct `Content-Type` and `Content-Disposition` headers on success for each supported format
    - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Checkpoint — backend complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 4. Thread `originalFilename` through the frontend data flow
  - Extend `onDeduplicate` prop signature in `FileUploader` to `(text: string, contentType: string, filename: string) => void`
  - Update the "Remove Duplicates" button click handler in `FileUploader` to pass `state.result.filename` as the third argument
  - Add `const [originalFilename, setOriginalFilename] = useState<string>("")` to `Dashboard`
  - Update `handleDeduplicate` in `Dashboard` to accept and store `filename` via `setOriginalFilename`
  - Pass `originalFilename` as a prop to `BeforeAfterPanel` in `Dashboard`'s render
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Add download button to `BeforeAfterPanel`
  - Add `originalFilename: string` to `BeforeAfterPanelProps`
  - Add `isDownloading` and `downloadError` state variables
  - Implement `handleDownload`: POST to `/api/download` with `responseType: "blob"`, parse `Content-Disposition` for filename, create an object URL, trigger anchor click, revoke URL, and handle errors
  - Render the download button (disabled while `isDownloading`, shows loading indicator)
  - Render inline error message below the button when `downloadError` is set
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.1 Write component tests for `BeforeAfterPanel`
    - Download button is visible when deduplication result has 0 duplicates removed
    - Button is disabled while `isDownloading` is `true`
    - Inline error message is rendered when `downloadError` is set
    - Correct axios call parameters (text, content_type, filename) on button click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all backend and frontend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (already in the project) with a minimum of 100 iterations each
- Frontend tests use Vitest + React Testing Library; mock `URL.createObjectURL` and anchor click in the test environment
