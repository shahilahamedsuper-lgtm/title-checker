# Implementation Plan: Duplicate Removal

## Overview

Implement the duplicate removal feature incrementally: backend schemas and service first, then the API router, then frontend types and API client, then the UI components, and finally wire everything together in Dashboard. Property-based and unit tests are included as optional sub-tasks alongside each implementation step.

## Tasks

- [x] 1. Extend backend schemas and upload router
  - [x] 1.1 Add `DeduplicateRequest` and `DeduplicationResult` Pydantic schemas to `backend/app/models/schemas.py`
    - Add `DeduplicateRequest(text: str, content_type: str)`
    - Add `DeduplicationResult(original_text, deduplicated_text, duplicates_removed, file_type_category: Literal["text","tabular"])`
    - _Requirements: 2.1, 2.2_
  - [x] 1.2 Extend `UploadResult` schema in `backend/app/models/schemas.py` with `content_type: str`
    - Add the field and update the upload router (`backend/app/routers/`) to pass `file.content_type or ""` into the response
    - _Requirements: 2.1_

- [x] 2. Implement `DeduplicationService`
  - [x] 2.1 Create `backend/app/services/deduplication_service.py` with `UnsupportedContentTypeError` and `DeduplicationService`
    - Implement `_normalize_line`: strip leading/trailing whitespace, collapse internal whitespace to a single space
    - Implement `_deduplicate_lines`: O(n) dict-based line deduplication preserving blank lines and first-occurrence order
    - Implement `_deduplicate_rows`: O(n) dict-based row deduplication (strip-only comparison) preserving first-occurrence order
    - Implement `deduplicate`: dispatch to lines/rows based on MIME type; raise `UnsupportedContentTypeError` for unsupported types; handle empty text (return zero count)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.1–3.6, 4.1–4.6, 7.2_
  - [ ]* 2.2 Write unit tests for `DeduplicationService` in `backend/tests/test_deduplicate.py`
    - Test `_normalize_line`: empty string, all-whitespace, internal spaces, tabs
    - Test `_deduplicate_lines`: empty input, single line, all-unique, all-duplicate, mixed, blank line preservation
    - Test `_deduplicate_rows`: same cases for tabular content
    - Test `deduplicate`: MIME dispatch for all 5 types, unsupported MIME raises `UnsupportedContentTypeError`, empty text returns zero count
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.1–3.6, 4.1–4.6_
  - [ ]* 2.3 Write property test — Property 1: Response structure completeness (`backend/tests/test_deduplicate_properties.py`)
    - **Property 1: Response structure completeness**
    - **Validates: Requirements 2.2**
  - [ ]* 2.4 Write property test — Property 2: MIME type classification
    - **Property 2: MIME type classification**
    - **Validates: Requirements 2.3, 2.4**
  - [ ]* 2.5 Write property test — Property 3: Unsupported MIME type rejection
    - **Property 3: Unsupported MIME type rejection**
    - **Validates: Requirements 2.5**
  - [ ]* 2.6 Write property test — Property 4: Text deduplication correctness
    - **Property 4: Text deduplication correctness — no duplicate normalized lines, original order preserved**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6**
  - [ ]* 2.7 Write property test — Property 5: Blank line preservation
    - **Property 5: Blank line preservation**
    - **Validates: Requirements 3.5**
  - [ ]* 2.8 Write property test — Property 6: Row deduplication correctness
    - **Property 6: Row deduplication correctness — no duplicate stripped rows, original order preserved**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6**

- [x] 3. Implement `POST /api/deduplicate` router
  - [x] 3.1 Create `backend/app/routers/deduplicate.py`
    - Accept `DeduplicateRequest`, delegate to `DeduplicationService`
    - Map `UnsupportedContentTypeError` → HTTP 422 with descriptive detail
    - Map unexpected exceptions → HTTP 500
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 3.2 Register the deduplicate router in `backend/app/main.py`
    - Import and include the router with prefix `/api`
    - _Requirements: 2.1_
  - [ ]* 3.3 Write router integration tests in `backend/tests/test_deduplicate.py`
    - Valid request returns 200 with correct `DeduplicationResult` shape
    - Unsupported MIME type returns 422
    - Empty text returns 200 with `duplicates_removed: 0`
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [x] 4. Checkpoint — backend complete
  - Ensure all backend tests pass. Ask the user if any questions arise before proceeding to the frontend.

- [x] 5. Extend frontend types and add API client
  - [x] 5.1 Add `DeduplicationResult` interface and extend `UploadResult` with `content_type` in `frontend/src/types.ts`
    - _Requirements: 2.2, 1.1_
  - [x] 5.2 Create `frontend/src/api/deduplicateApi.ts`
    - Export `deduplicateText(text, contentType): Promise<DeduplicationResult>`
    - Follow the same axios + error-handling pattern as `analyzeApi.ts`
    - _Requirements: 2.1_

- [x] 6. Implement `BeforeAfterPanel` component
  - [x] 6.1 Create `frontend/src/components/BeforeAfterPanel.tsx`
    - Render summary badge with duplicate count; show "no duplicates found" message when count is 0
    - Render two side-by-side scrollable `<pre>` panels labeled "Original" and "Cleaned"
    - Render "Use Cleaned Text" button; disable it when `isDeduplicating` is true
    - Call `onUseCleanedText(result.deduplicated_text)` on button click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_
  - [ ]* 6.2 Write unit tests for `BeforeAfterPanel` in `frontend/src/__tests__/BeforeAfterPanel.test.tsx`
    - Renders "Original" and "Cleaned" labels
    - Renders duplicate count badge
    - Renders "no duplicates found" when count is 0
    - "Use Cleaned Text" button enabled by default, disabled when `isDeduplicating=true`
    - Clicking "Use Cleaned Text" calls `onUseCleanedText` with `deduplicated_text`
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2_
  - [ ]* 6.3 Write property test — Property 7: BeforeAfterPanel renders correct content (`frontend/src/__tests__/BeforeAfterPanel.property.test.tsx`)
    - **Property 7: BeforeAfterPanel renders correct content**
    - **Validates: Requirements 5.1**
  - [ ]* 6.4 Write property test — Property 8: BeforeAfterPanel displays correct duplicate count
    - **Property 8: BeforeAfterPanel displays correct duplicate count**
    - **Validates: Requirements 5.2**
  - [ ]* 6.5 Write property test — Property 9: "Use Cleaned Text" passes deduplicated text
    - **Property 9: "Use Cleaned Text" callback receives exactly `deduplicated_text`**
    - **Validates: Requirements 6.2**

- [x] 7. Extend `FileUploader` component
  - [x] 7.1 Add `onDeduplicate` and `isDeduplicating` props to `FileUploader` in `frontend/src/components/FileUploader.tsx`
    - Render "Remove Duplicates" button in the upload-success state alongside existing buttons
    - Disable all three buttons while `isDeduplicating` is true; show spinner on "Remove Duplicates"
    - Display inline `deduplicationError` below the buttons when set; clear on retry or new upload
    - Pass `uploadResult.content_type` to `onDeduplicate`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 7.2 Write unit tests for `FileUploader` extensions in `frontend/src/__tests__/FileUploader.test.tsx`
    - "Remove Duplicates" button present in success state
    - All buttons disabled when `isDeduplicating=true`
    - Inline error shown when `deduplicationError` prop is set
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Wire deduplication into `Dashboard`
  - [x] 8.1 Add deduplication state and `handleDeduplicate` handler to `frontend/src/pages/Dashboard.tsx`
    - Add `deduplicationResult`, `isDeduplicating`, and `deduplicationError` state
    - Implement `handleDeduplicate(text, contentType)`: set loading, call `deduplicateText`, update result/error, clear loading
    - Clear `deduplicationResult` on new file upload and in `handlePopulate`
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 8.2 Render `BeforeAfterPanel` in `Dashboard` and implement `handleUseCleanedText`
    - Render `BeforeAfterPanel` below `FileUploader` and above the analysis grid when `deduplicationResult` is set
    - Implement `handleUseCleanedText(text)`: call `handlePopulate(text)` and scroll `analysisFormRef` into view
    - Pass `onDeduplicate`, `isDeduplicating`, and `deduplicationError` props to `FileUploader`
    - _Requirements: 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Run the full test suite (backend + frontend). Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **Hypothesis** (backend) and **fast-check** (frontend)
- The feature is fully additive — no existing routes or components are modified in a breaking way
