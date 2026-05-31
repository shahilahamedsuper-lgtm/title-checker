# Requirements Document

## Introduction

This feature adds a file upload system to the existing Semantic Validator web application. Users can upload documents (PDF, DOCX, TXT, Excel), have their text extracted on the backend, and then either populate the existing analysis form with the extracted text or trigger analysis directly. The upload UI integrates seamlessly into the existing Dashboard layout, matching the slate-900 / white-card / blue-action design language.

## Glossary

- **File_Uploader**: The frontend React component that renders the drag-and-drop upload zone and manages upload state.
- **Upload_API**: The FastAPI endpoint (`POST /api/upload`) that receives a multipart file, extracts its text, and returns the result.
- **Extraction_Service**: The backend Python service responsible for parsing file content and returning plain text.
- **Dashboard**: The existing single-page view that hosts the `AnalysisForm` and `ResultsPanel` components.
- **AnalysisForm**: The existing React component that accepts a title and body text and submits them for semantic analysis.
- **Supported_Format**: One of the four accepted MIME types — PDF (`application/pdf`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), TXT (`text/plain`), or Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` / `application/vnd.ms-excel`).
- **Extracted_Text**: The plain-text string produced by the Extraction_Service from an uploaded file.
- **Populate Action**: The user action of transferring Extracted_Text into the AnalysisForm body field without immediately submitting.
- **Analyze Action**: The user action of transferring Extracted_Text into the AnalysisForm and immediately triggering semantic analysis.

---

## Requirements

### Requirement 1: File Upload Endpoint

**User Story:** As a developer, I want a dedicated upload endpoint, so that the frontend can send files and receive extracted text without coupling file parsing to the analysis route.

#### Acceptance Criteria

1. THE Upload_API SHALL accept `multipart/form-data` POST requests containing a single file field named `file`.
2. WHEN a request is received with a Supported_Format file, THE Upload_API SHALL return a JSON response containing the `extracted_text` string and the `filename` string within 30 seconds.
3. WHEN a request is received with a file whose MIME type is not a Supported_Format, THE Upload_API SHALL return HTTP 422 with a descriptive error message identifying the unsupported type.
4. WHEN the uploaded file exceeds 10 MB, THE Upload_API SHALL return HTTP 413 with an error message stating the size limit.
5. IF the Extraction_Service raises an exception during parsing, THEN THE Upload_API SHALL return HTTP 500 with an error message describing the failure.
6. THE Upload_API SHALL enforce CORS rules consistent with the existing `/api/analyze` endpoint.

---

### Requirement 2: Text Extraction Service

**User Story:** As a developer, I want a dedicated extraction service, so that file-format-specific parsing logic is isolated and independently testable.

#### Acceptance Criteria

1. WHEN a TXT file is provided, THE Extraction_Service SHALL decode the file bytes as UTF-8 and return the full text content.
2. WHEN a PDF file is provided, THE Extraction_Service SHALL extract all readable text from every page and return it as a single string.
3. WHEN a DOCX file is provided, THE Extraction_Service SHALL extract text from all paragraphs in document order and return it as a single string.
4. WHEN an Excel file is provided, THE Extraction_Service SHALL extract the text content of every non-empty cell across all sheets, separated by whitespace, and return it as a single string.
5. IF a file is provided that contains no extractable text, THEN THE Extraction_Service SHALL return an empty string rather than raising an exception.
6. FOR ALL valid input files of a Supported_Format, THE Extraction_Service SHALL produce a non-null string (round-trip property: bytes in → text out, never null).

---

### Requirement 3: Drag-and-Drop Upload UI

**User Story:** As a user, I want to drag and drop a file onto the upload zone, so that I can upload documents without navigating a file picker dialog.

#### Acceptance Criteria

1. THE File_Uploader SHALL render a visually distinct drop zone that accepts drag-over events and provides a highlighted border when a file is dragged over it.
2. WHEN a user drops a file onto the drop zone, THE File_Uploader SHALL begin uploading the file immediately.
3. WHEN a user clicks the drop zone, THE File_Uploader SHALL open the native file picker dialog filtered to Supported_Format extensions (`.pdf`, `.docx`, `.txt`, `.xls`, `.xlsx`).
4. WHILE an upload is in progress, THE File_Uploader SHALL display a loading indicator and disable further file selection.
5. WHEN an upload completes successfully, THE File_Uploader SHALL display the filename and a preview of the first 300 characters of the Extracted_Text.
6. IF a user drops or selects a file with an unsupported extension, THEN THE File_Uploader SHALL display an inline error message listing the accepted formats without initiating an upload request.

---

### Requirement 4: Populate Form Action

**User Story:** As a user, I want to populate the analysis form with extracted text, so that I can review and edit the content before submitting it for analysis.

#### Acceptance Criteria

1. WHEN an upload completes successfully, THE File_Uploader SHALL display a "Populate Form" button.
2. WHEN the user activates the "Populate Form" button, THE Dashboard SHALL set the AnalysisForm body field to the full Extracted_Text.
3. WHEN the user activates the "Populate Form" button and the Extracted_Text exceeds 5000 characters, THE Dashboard SHALL truncate the text to 5000 characters and display a warning message indicating truncation occurred.
4. WHEN the user activates the "Populate Form" button, THE Dashboard SHALL scroll the viewport to the AnalysisForm.

---

### Requirement 5: Analyze Directly Action

**User Story:** As a user, I want to trigger analysis directly from an uploaded file, so that I can skip manual form editing when the extracted content is ready to analyze.

#### Acceptance Criteria

1. WHEN an upload completes successfully, THE File_Uploader SHALL display an "Analyze" button alongside the "Populate Form" button.
2. WHEN the user activates the "Analyze" button, THE Dashboard SHALL set the AnalysisForm body field to the Extracted_Text (truncated to 5000 characters if necessary) and immediately invoke the semantic analysis submission.
3. WHEN the user activates the "Analyze" button and no title has been entered in the AnalysisForm, THE Dashboard SHALL use the uploaded filename (without extension) as the title for the analysis request.
4. WHILE analysis triggered from the "Analyze" button is in progress, THE File_Uploader SHALL disable both the "Populate Form" and "Analyze" buttons.

---

### Requirement 6: Upload Error Handling

**User Story:** As a user, I want clear error feedback when an upload fails, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. IF the Upload_API returns an error response, THEN THE File_Uploader SHALL display the error message returned by the server in an inline error banner.
2. IF the network request fails before reaching the server, THEN THE File_Uploader SHALL display the message "Upload failed. Please check your connection and try again."
3. WHEN an error is displayed, THE File_Uploader SHALL render a "Try Again" button that resets the upload zone to its initial state.
4. WHEN the upload zone is reset, THE File_Uploader SHALL clear any previously displayed filename, preview text, and error messages.

---

### Requirement 7: Dashboard Layout Integration

**User Story:** As a user, I want the file upload panel to feel like a native part of the dashboard, so that the experience is consistent with the existing UI.

#### Acceptance Criteria

1. THE Dashboard SHALL render the File_Uploader in a white card panel with the same `rounded-xl shadow-sm border border-slate-200 p-6` styling as the AnalysisForm and ResultsPanel.
2. THE Dashboard SHALL position the File_Uploader above the existing two-column grid of AnalysisForm and ResultsPanel.
3. THE File_Uploader SHALL use blue (`bg-blue-600`) as the primary action color for buttons, consistent with the existing AnalysisForm submit button.
4. THE File_Uploader SHALL use the same `text-sm font-medium` typography scale as the rest of the Dashboard.
