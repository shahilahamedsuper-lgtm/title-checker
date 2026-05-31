# Requirements Document

## Introduction

After a user uploads a file and runs deduplication, the application currently shows a before/after text comparison but provides no way to download the cleaned result as a file. This feature adds a file generation and download capability: once deduplication completes, the backend rebuilds a cleaned file in the same format as the original upload (TXT → TXT, DOCX → DOCX, XLSX → XLSX). Because PDF is a read-only format, PDF uploads produce a cleaned TXT file instead. The frontend exposes a download button in the BeforeAfterPanel that triggers the file download. The cleaned file is named `cleaned_<original_filename>`.

## Glossary

- **File_Generator**: The backend service responsible for rebuilding a cleaned file from deduplicated text.
- **Download_Endpoint**: The new `POST /api/download` HTTP endpoint that accepts deduplicated text and file metadata and returns a binary file response.
- **Download_Button**: The UI control rendered inside the BeforeAfterPanel after deduplication completes.
- **BeforeAfterPanel**: The existing React component that displays original vs. cleaned text side-by-side.
- **Cleaned_File**: The output file produced by the File_Generator, containing only the deduplicated content.
- **Original_Filename**: The filename of the file originally uploaded by the user (e.g., `report.xlsx`).
- **Cleaned_Filename**: The filename of the Cleaned_File, formed by prepending `cleaned_` to the Original_Filename (e.g., `cleaned_report.xlsx`).
- **PDF_Fallback**: The rule that PDF uploads produce a TXT Cleaned_File because PDF is a read-only format.
- **Supported_Format**: One of TXT, DOCX, XLSX, XLS, or PDF.

---

## Requirements

### Requirement 1: Generate a Cleaned File After Deduplication

**User Story:** As a user, I want the application to generate a cleaned file after deduplication, so that I can download a file that reflects the removed duplicates.

#### Acceptance Criteria

1. WHEN the Download_Endpoint receives a request with deduplicated text and a `content_type` of `text/plain`, THE File_Generator SHALL produce a UTF-8 encoded TXT file containing the deduplicated lines.
2. WHEN the Download_Endpoint receives a request with deduplicated text and a `content_type` of `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, THE File_Generator SHALL produce a DOCX file where each deduplicated line is stored as a separate paragraph.
3. WHEN the Download_Endpoint receives a request with deduplicated text and a `content_type` of `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` or `application/vnd.ms-excel`, THE File_Generator SHALL produce an XLSX file where each non-empty deduplicated line is stored as a row in the first column of the first worksheet.
4. WHEN the Download_Endpoint receives a request with a `content_type` of `application/pdf`, THE File_Generator SHALL apply the PDF_Fallback and produce a UTF-8 encoded TXT file containing the deduplicated lines.
5. IF the Download_Endpoint receives a request with an unsupported `content_type`, THEN THE Download_Endpoint SHALL return an HTTP 422 response with a descriptive error message.
6. IF the File_Generator encounters an error while building the output file, THEN THE Download_Endpoint SHALL return an HTTP 500 response with a descriptive error message.

---

### Requirement 2: Serve the Cleaned File for Download

**User Story:** As a user, I want the server to send the cleaned file as a downloadable attachment, so that my browser saves it to disk automatically.

#### Acceptance Criteria

1. WHEN the File_Generator successfully produces a Cleaned_File, THE Download_Endpoint SHALL return the file as an HTTP response with `Content-Disposition: attachment; filename="<Cleaned_Filename>"`.
2. WHEN the original upload was a TXT file, THE Download_Endpoint SHALL set the response `Content-Type` to `text/plain; charset=utf-8` and the Cleaned_Filename to `cleaned_<Original_Filename>`.
3. WHEN the original upload was a DOCX file, THE Download_Endpoint SHALL set the response `Content-Type` to `application/vnd.openxmlformats-officedocument.wordprocessingml.document` and the Cleaned_Filename to `cleaned_<Original_Filename>`.
4. WHEN the original upload was an XLSX or XLS file, THE Download_Endpoint SHALL set the response `Content-Type` to `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and the Cleaned_Filename to `cleaned_<Original_Filename>`.
5. WHEN the original upload was a PDF file, THE Download_Endpoint SHALL apply the PDF_Fallback: set the response `Content-Type` to `text/plain; charset=utf-8` and the Cleaned_Filename to `cleaned_<Original_Filename_stem>.txt` (replacing the `.pdf` extension with `.txt`).

---

### Requirement 3: Expose a Download Button in the BeforeAfterPanel

**User Story:** As a user, I want a download button to appear after deduplication completes, so that I can save the cleaned file with a single click.

#### Acceptance Criteria

1. WHEN deduplication completes and the BeforeAfterPanel is rendered, THE Download_Button SHALL be visible regardless of whether any duplicates were removed.
2. WHEN the user clicks the Download_Button, THE BeforeAfterPanel SHALL call the Download_Endpoint with the deduplicated text, the original `content_type`, and the Original_Filename.
3. WHEN the Download_Endpoint returns a successful file response, THE Download_Button SHALL trigger a browser file download using the Cleaned_Filename provided in the `Content-Disposition` header.
4. WHILE a download request is in progress, THE Download_Button SHALL be disabled and display a loading indicator to prevent duplicate submissions.
5. IF the Download_Endpoint returns an error, THE BeforeAfterPanel SHALL display an inline error message below the Download_Button describing the failure.

---

### Requirement 4: Pass Filename Through the Deduplication Flow

**User Story:** As a user, I want the application to remember the original filename throughout the deduplication flow, so that the downloaded file is named correctly.

#### Acceptance Criteria

1. WHEN a file upload succeeds, THE FileUploader SHALL pass the Original_Filename to the deduplication handler alongside the extracted text and content type.
2. WHEN deduplication completes, THE Dashboard SHALL store the Original_Filename and make it available to the BeforeAfterPanel.
3. THE BeforeAfterPanel SHALL receive the Original_Filename as a prop and include it in the Download_Endpoint request.
