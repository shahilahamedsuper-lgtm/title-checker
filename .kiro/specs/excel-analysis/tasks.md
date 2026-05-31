# Implementation Plan: Excel Analysis

## Overview

Implement end-to-end Excel analysis: new backend service + router, new frontend API layer + ExcelDashboard component, and extend the existing FileUploader and Dashboard. The feature is purely additive — no existing flows are modified.

## Tasks

- [x] 1. Add dependencies and Pydantic schemas
  - Add `pandas` to `backend/requirements.txt`
  - Add `recharts` and `@types/recharts` to `frontend/package.json` dependencies
  - Add `NumericStats`, `ColumnStats`, and `ExcelAnalysisResult` Pydantic models to `backend/app/models/schemas.py`
  - _Requirements: 2.1, 3.1, 3.3, 5.1_

- [x] 2. Implement `ExcelAnalysisService`
  - [x] 2.1 Create `backend/app/services/excel_analysis_service.py` with `ExcelAnalysisService` class
    - Implement `_normalize_headers`, `_infer_dtype`, `_compute_stats`, `_build_ai_prompt`, `_parse`, and `analyze` methods as specified in the design
    - Define `ExcelParseError`, `FileTooLargeError`, and `UnsupportedFileTypeError` custom exceptions
    - Reuse existing `AIService` pattern for the AI summary call with graceful degradation (`ai_summary = None` on any AI error)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.2 Write property test for `_parse` round-trip (Property 2)
    - **Property 2: Parse round-trip preserves tabular structure**
    - **Validates: Requirements 2.1, 2.5**
    - Use `hypothesis` strategies to generate DataFrames, write to Excel bytes, parse, and compare headers and row values

  - [ ]* 2.3 Write property test for invalid bytes raising `ExcelParseError` (Property 4)
    - **Property 4: Invalid bytes produce a parse error**
    - **Validates: Requirements 2.4**
    - Use `st.binary()` filtered to non-Excel magic bytes

  - [ ]* 2.4 Write property test for column statistics completeness (Property 5)
    - **Property 5: Column statistics completeness and correctness**
    - **Validates: Requirements 3.1**
    - Generate random DataFrames and assert `missing_count` and `unique_count` match pandas ground truth

  - [ ]* 2.5 Write property test for numeric stats correctness (Property 6)
    - **Property 6: Numeric stats are present and correct for numeric columns**
    - **Validates: Requirements 3.3**
    - Generate DataFrames with numeric columns and assert `min`, `max`, `mean` rounded to 2 dp

  - [ ]* 2.6 Write property test for duplicate row count (Property 7)
    - **Property 7: Duplicate row count matches pandas computation**
    - **Validates: Requirements 3.2**
    - Generate DataFrames with injected duplicate rows and assert count equals `df.duplicated().sum()`

  - [ ]* 2.7 Write property test for AI unavailability graceful degradation (Property 8)
    - **Property 8: AI unavailability does not suppress table data**
    - **Validates: Requirements 4.4**
    - Mock AI service to raise an exception; assert `headers`, `rows`, `column_stats` are valid and `ai_summary` is `None`

- [x] 3. Implement `analyze_excel` router
  - Create `backend/app/routers/analyze_excel.py` with `POST /api/analyze-excel`
  - Implement pre-parse guards: file size > 10 MB → 422, wrong MIME type → 422
  - Catch `ExcelParseError` → 422, `AITimeoutError` → 504, `AIServiceError` → 502 as specified in the design
  - Register the router in `backend/app/main.py`
  - _Requirements: 2.3, 2.4, 4.2, 4.3, 5.1, 5.2, 5.3_

  - [ ]* 3.1 Write property test for non-Excel MIME type always returning 422 (Property 9)
    - **Property 9: Non-Excel MIME type always returns 422**
    - **Validates: Requirements 5.3**
    - Use `st.text()` filtered to non-Excel MIME types via `httpx` test client

- [x] 4. Checkpoint — backend complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 5. Add TypeScript types and `analyzeExcelApi.ts`
  - Add `NumericStats`, `ColumnStats`, `ExcelAnalysisResult`, and `ExcelAnalysisState` interfaces to `frontend/src/types.ts`
  - Create `frontend/src/api/analyzeExcelApi.ts` with `analyzeExcel(file: File)` function using axios multipart/form-data, mapping network errors and endpoint `detail` fields as specified in the design
  - _Requirements: 5.1, 5.2, 10.2_

- [x] 6. Extend `FileUploader` to show "Analyze Excel" button
  - Add `onAnalyzeExcel?: (file: File) => void` and `isAnalyzingExcel?: boolean` props to `FileUploaderProps`
  - Store the raw `File` object in a `useState<File | null>` alongside the upload result
  - Render the "Analyze Excel" button conditionally on Excel MIME type in the success state block, disabled when `isAnalyzingExcel`, `isAnalyzing`, or `isDeduplicating` is true
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 6.1 Write property test for button visibility matching MIME type (Property 1)
    - **Property 1: Excel button visibility matches MIME type**
    - **Validates: Requirements 1.1, 1.2**
    - Use `fast-check` with `fc.record({ content_type: fc.string() })` and assert button presence/absence

- [x] 7. Extend `Dashboard` with Excel analysis state and handler
  - Add `excelAnalysisState` (`ExcelAnalysisState`) state initialized to `{ status: "idle" }`
  - Implement `handleAnalyzeExcel(file: File)` that clears deduplication and analysis results, sets loading state, calls `analyzeExcel`, and updates state on success or error
  - Pass `onAnalyzeExcel` and `isAnalyzingExcel` props to `FileUploader`
  - Render `<ExcelDashboard>` below the uploader card when `excelAnalysisState.status !== "idle"`, replacing `BeforeAfterPanel` and the content grid
  - _Requirements: 9.1, 10.3_

- [x] 8. Implement `ExcelDashboard` component
  - [x] 8.1 Create `frontend/src/components/ExcelDashboard.tsx` with tab navigation ("Summary", "Data Table", "Charts")
    - Accept `state: ExcelAnalysisState` and `onDismissError: () => void` props
    - Implement loading skeleton, error banner with "Dismiss" button, and three-tab layout using Tailwind CSS design language
    - _Requirements: 9.2, 9.3, 9.4, 10.1, 10.2, 10.3_

  - [ ]* 8.2 Write property test for three tabs always present (Property 16)
    - **Property 16: Three tabs are always present**
    - **Validates: Requirements 9.2**
    - Use `fast-check` with any valid `ExcelAnalysisResult` shape

  - [ ]* 8.3 Write property test for active tab isolation (Property 17)
    - **Property 17: Active tab shows only its own content**
    - **Validates: Requirements 9.3**
    - Use `fc.constantFrom("summary", "table", "charts")` and assert only selected tab content is rendered

  - [ ]* 8.4 Write property test for error banner displaying endpoint messages (Property 18)
    - **Property 18: Error banner displays endpoint error messages**
    - **Validates: Requirements 10.1**
    - Use `fc.string()` for error message and assert exact string appears in banner

  - [x] 8.5 Implement Summary tab content
    - Render stats cards: total row count, total column count, total missing value count, duplicate row count
    - Render AI summary card (text when present, `"AI summary unavailable."` placeholder when null)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.6 Write property test for summary card statistics correctness (Property 10)
    - **Property 10: Summary card displays all four statistics correctly**
    - **Validates: Requirements 6.1**
    - Use `fast-check` to generate `ExcelAnalysisResult` and assert rendered card values match

  - [ ]* 8.7 Write property test for AI summary text display (Property 11)
    - **Property 11: AI summary text is displayed when present**
    - **Validates: Requirements 6.2**
    - Use `fc.string()` for `ai_summary` and assert exact string is rendered

  - [x] 8.8 Implement Data Table tab with sort, filter, and pagination
    - Render column headers and up to 100 rows per page with pagination controls
    - Implement ascending/descending column sort on header click (reset to page 1 on change)
    - Implement case-insensitive global filter input (reset to page 1 on change)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 8.9 Write property test for pagination correctness (Property 12)
    - **Property 12: Data table pagination is correct**
    - **Validates: Requirements 7.1**
    - Use `fc.integer({ min: 0, max: 500 })` for row count and assert page 1 row count and pagination control visibility

  - [ ]* 8.10 Write property test for sort order invariant (Property 13)
    - **Property 13: Sort order invariant**
    - **Validates: Requirements 7.2**
    - Generate random rows and column index; assert adjacent row ordering after sort

  - [ ]* 8.11 Write property test for filter inclusion invariant (Property 14)
    - **Property 14: Filter inclusion invariant**
    - **Validates: Requirements 7.3**
    - Generate random rows and search string; assert every displayed row contains the search string

  - [x] 8.12 Implement Charts tab with Recharts visualizations
    - Render missing-values bar chart (one entry per column, value = `missing_count`)
    - Render line chart for first numeric column values across row indices (hide if no numeric column)
    - Render pie chart for first text column with ≤10 unique values (hide if none qualifies)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.13 Write property test for bar chart data matching column stats (Property 15)
    - **Property 15: Missing-values bar chart data matches column stats**
    - **Validates: Requirements 8.1**
    - Use `fast-check` to generate `column_stats` and assert bar chart data entries match `missing_count` values

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all backend and frontend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–18 from the design)
- Unit tests validate specific examples and edge cases
- The feature is purely additive — no existing upload, analyze, deduplicate, or download flows are modified
