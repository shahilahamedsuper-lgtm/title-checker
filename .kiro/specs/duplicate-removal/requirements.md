# Requirements Document

## Introduction

The Duplicate Removal feature extends the Semantic Validator web application with the ability to detect and remove duplicate content from uploaded files. After a file is uploaded and text is extracted, users can trigger duplicate removal to clean their content. The feature handles two distinct content models: tabular data (Excel files), where duplicate rows are removed, and linear text content (PDF, DOCX, TXT), where repeated lines are removed. The result is presented as a side-by-side before/after comparison so users can review exactly what was removed before deciding to use the cleaned content.

## Glossary

- **Deduplication_Service**: The backend service responsible for detecting and removing duplicate content from extracted text.
- **Duplicate_Row**: In Excel content, a row whose cell values are identical to a previously seen row in the same sheet.
- **Duplicate_Line**: In text-based content (TXT, PDF, DOCX), a line whose normalized form is identical to a previously seen line within the same document.
- **Normalized_Line**: A line with leading/trailing whitespace stripped and consecutive internal whitespace collapsed to a single space, used for comparison purposes only; the original form is preserved in output.
- **Deduplication_Result**: The response payload containing the original content, the deduplicated content, the count of duplicates removed, and the file type category.
- **File_Type_Category**: A classification of the uploaded file as either `tabular` (Excel) or `text` (PDF, DOCX, TXT).
- **Before_After_Panel**: The frontend UI component that renders the original and deduplicated content side by side for user review.
- **Deduplication_Button**: The action button added to the FileUploader success state that triggers the duplicate removal workflow.
- **Dashboard**: The main page of the Semantic Validator application containing the FileUploader card and analysis grid.

---

## Requirements

### Requirement 1: Trigger Duplicate Removal from the File Uploader

**User Story:** As a user, I want to trigger duplicate removal directly from the file uploader after a successful upload, so that I can clean my content without navigating away or re-uploading.

#### Acceptance Criteria

1. WHEN a file upload succeeds, THE FileUploader SHALL display a "Remove Duplicates" button alongside the existing "Populate Form" and "Analyze" buttons.
2. WHILE a deduplication request is in progress, THE Deduplication_Button SHALL be disabled and display a loading indicator.
3. WHILE a deduplication request is in progress, THE FileUploader SHALL disable the "Populate Form" and "Analyze" buttons.
4. IF a deduplication request fails, THEN THE FileUploader SHALL display an inline error message describing the failure without clearing the uploaded file state.

---

### Requirement 2: Backend Deduplication Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for duplicate removal, so that the frontend can request deduplication independently of the upload and analysis flows.

#### Acceptance Criteria

1. THE Deduplication_Service SHALL expose a `POST /api/deduplicate` endpoint that accepts the extracted text and the file's MIME type.
2. WHEN a valid request is received, THE Deduplication_Service SHALL return a Deduplication_Result containing the original text, the deduplicated text, the number of duplicates removed, and the File_Type_Category.
3. WHEN the provided MIME type corresponds to an Excel file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` or `application/vnd.ms-excel`), THE Deduplication_Service SHALL classify the request as `tabular` and apply row-level deduplication.
4. WHEN the provided MIME type corresponds to a text-based file (`text/plain`, `application/pdf`, or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`), THE Deduplication_Service SHALL classify the request as `text` and apply line-level deduplication.
5. IF the provided MIME type is not one of the five supported types, THEN THE Deduplication_Service SHALL return a 422 error response with a descriptive message.
6. IF the provided text is empty, THEN THE Deduplication_Service SHALL return a Deduplication_Result with zero duplicates removed and identical original and deduplicated text.

---

### Requirement 3: Line-Level Deduplication for Text Content

**User Story:** As a user, I want repeated lines removed from my text documents, so that I receive a clean version without redundant content.

#### Acceptance Criteria

1. WHEN processing text-based content, THE Deduplication_Service SHALL split the content into lines using newline characters as delimiters.
2. WHEN comparing lines for duplication, THE Deduplication_Service SHALL use the Normalized_Line form for comparison while preserving the original line form in the output.
3. WHEN a line's Normalized_Line matches a previously seen Normalized_Line, THE Deduplication_Service SHALL omit that line from the deduplicated output.
4. WHEN a line's Normalized_Line does not match any previously seen Normalized_Line, THE Deduplication_Service SHALL include the original line in the deduplicated output in its original position order.
5. THE Deduplication_Service SHALL preserve blank lines as distinct structural elements; a blank line SHALL NOT be treated as a duplicate of another blank line.
6. THE Deduplication_Service SHALL process lines in document order, retaining the first occurrence of each unique Normalized_Line.

---

### Requirement 4: Row-Level Deduplication for Excel Content

**User Story:** As a user, I want duplicate rows removed from my Excel data, so that I receive a clean dataset without redundant entries.

#### Acceptance Criteria

1. WHEN processing tabular content, THE Deduplication_Service SHALL treat each tab-separated line in the extracted text as a row.
2. WHEN comparing rows for duplication, THE Deduplication_Service SHALL compare the full row string after stripping leading and trailing whitespace.
3. WHEN a row's normalized form matches a previously seen row, THE Deduplication_Service SHALL omit that row from the deduplicated output.
4. WHEN a row's normalized form does not match any previously seen row, THE Deduplication_Service SHALL include the original row in the deduplicated output in its original order.
5. THE Deduplication_Service SHALL treat the first row as a potential header and SHALL apply the same deduplication logic to it as to all other rows.
6. THE Deduplication_Service SHALL process rows in document order, retaining the first occurrence of each unique row.

---

### Requirement 5: Before/After Comparison Display

**User Story:** As a user, I want to see a side-by-side before/after comparison of my content, so that I can verify what was removed before using the cleaned version.

#### Acceptance Criteria

1. WHEN a deduplication response is received, THE Before_After_Panel SHALL render the original text in a left panel labeled "Original" and the deduplicated text in a right panel labeled "Cleaned".
2. THE Before_After_Panel SHALL display the count of duplicates removed as a summary badge above the comparison panels.
3. WHEN zero duplicates are removed, THE Before_After_Panel SHALL display a message indicating no duplicates were found.
4. THE Before_After_Panel SHALL render both panels with independent vertical scroll so that long content does not overflow the page layout.
5. WHEN the Before_After_Panel is visible, THE Dashboard SHALL display it below the FileUploader card and above the analysis grid.
6. WHEN a new file is uploaded, THE Dashboard SHALL clear and hide the Before_After_Panel.

---

### Requirement 6: Use Cleaned Content in Analysis Workflow

**User Story:** As a user, I want to use the deduplicated content in the existing analysis workflow, so that I can analyze clean content without manually copying it.

#### Acceptance Criteria

1. WHEN the Before_After_Panel is visible, THE Before_After_Panel SHALL display a "Use Cleaned Text" button.
2. WHEN the user activates the "Use Cleaned Text" button, THE Dashboard SHALL populate the AnalysisForm text field with the deduplicated text.
3. WHEN the user activates the "Use Cleaned Text" button, THE Dashboard SHALL scroll the AnalysisForm into view.
4. WHILE a deduplication request is in progress, THE Before_After_Panel "Use Cleaned Text" button SHALL be disabled.

---

### Requirement 7: Performance Constraints

**User Story:** As a user, I want duplicate removal to complete quickly, so that the workflow does not feel slow.

#### Acceptance Criteria

1. WHEN a deduplication request is received with content up to 10 MB (the existing upload size limit), THE Deduplication_Service SHALL return a response within 2 seconds under normal server load.
2. THE Deduplication_Service SHALL process deduplication in O(n) time with respect to the number of lines or rows, where n is the total line/row count.
