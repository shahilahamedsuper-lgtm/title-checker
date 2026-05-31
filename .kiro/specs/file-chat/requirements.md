# Requirements Document

## Introduction

This feature adds an AI-powered chat interface to the Semantic Validator application, allowing users to ask questions about the content of an uploaded file. After a file is successfully uploaded and its text extracted, a "Chat with File" button appears alongside the existing action buttons. Clicking it opens a chat panel with a ChatGPT-style UI. Each user message is sent to a new backend `/api/chat` endpoint together with the extracted file text as context and the accumulated conversation history. The AI responds based solely on the file content. Chat history is maintained in frontend state only and is not persisted to the backend. The feature must support the existing dark mode theme system.

## Glossary

- **Chat_Panel**: The UI section that renders the conversation between the user and the AI, including the message list and the input area.
- **Chat_Message**: A single turn in the conversation, attributed to either the user or the AI assistant.
- **Conversation_History**: The ordered list of Chat_Messages accumulated during a session, held in frontend state.
- **File_Context**: The full extracted text of the uploaded file, passed to the backend with every chat request.
- **Chat_Service**: The backend service responsible for constructing the AI prompt and calling the AI provider.
- **Chat_Endpoint**: The `POST /api/chat` HTTP endpoint that accepts a message, file context, and conversation history, and returns an AI response.
- **FileUploader**: The existing React component that handles file upload and displays action buttons on success.
- **Dashboard**: The existing React page component that coordinates state between all child components.

---

## Requirements

### Requirement 1: Chat Entry Point

**User Story:** As a user, I want a "Chat with File" button to appear after a successful file upload, so that I can start a conversation about the file content.

#### Acceptance Criteria

1. WHEN a file upload succeeds, THE FileUploader SHALL display a "Chat with File" button alongside the existing action buttons (Populate Form, Analyze, Remove Duplicates).
2. WHILE a file upload is in progress, THE FileUploader SHALL NOT display the "Chat with File" button.
3. WHEN the user clicks the "Chat with File" button, THE Dashboard SHALL open the Chat_Panel and pass the extracted file text as File_Context.
4. THE FileUploader SHALL render the "Chat with File" button in a style consistent with the existing action buttons and the active theme (light or dark).

---

### Requirement 2: Chat Panel Layout

**User Story:** As a user, I want a chat interface that looks like ChatGPT, so that the interaction feels familiar and easy to use.

#### Acceptance Criteria

1. THE Chat_Panel SHALL display user Chat_Messages aligned to the right side of the panel.
2. THE Chat_Panel SHALL display AI Chat_Messages aligned to the left side of the panel.
3. THE Chat_Panel SHALL render a text input field and a send button at the bottom of the panel.
4. WHEN the Conversation_History contains more messages than the visible area can display, THE Chat_Panel SHALL automatically scroll to the most recent Chat_Message.
5. THE Chat_Panel SHALL display a loading indicator in the AI message position WHILE an AI response is being fetched.
6. THE Chat_Panel SHALL render correctly in both light mode and dark mode, consistent with the existing theme system.
7. THE Chat_Panel SHALL display the filename of the uploaded file as a header or label so the user knows which file is being discussed.

---

### Requirement 3: Sending a Message

**User Story:** As a user, I want to type a question and send it, so that I can get an AI answer about the file content.

#### Acceptance Criteria

1. WHEN the user submits a non-empty message (via the send button or the Enter key), THE Chat_Panel SHALL append the user's Chat_Message to the Conversation_History and clear the input field.
2. IF the user attempts to submit an empty or whitespace-only message, THEN THE Chat_Panel SHALL NOT send the request and SHALL NOT append a Chat_Message.
3. WHILE an AI response is being fetched, THE Chat_Panel SHALL disable the send button and the text input to prevent duplicate submissions.
4. WHEN the user presses Shift+Enter in the text input, THE Chat_Panel SHALL insert a newline instead of submitting the message.

---

### Requirement 4: Backend Chat Endpoint

**User Story:** As a developer, I want a dedicated chat endpoint, so that the frontend can request AI responses grounded in the file content.

#### Acceptance Criteria

1. THE Chat_Endpoint SHALL accept a JSON request body containing: `message` (string), `file_context` (string), and `conversation_history` (array of objects with `role` and `content` fields).
2. WHEN a valid request is received, THE Chat_Endpoint SHALL return a JSON response containing an `answer` field (string) with the AI-generated reply.
3. IF the `message` field is empty or missing, THEN THE Chat_Endpoint SHALL return HTTP 422 with a descriptive validation error.
4. IF the `file_context` field is empty or missing, THEN THE Chat_Endpoint SHALL return HTTP 422 with a descriptive validation error.
5. IF the AI provider does not respond within the configured timeout, THEN THE Chat_Endpoint SHALL return HTTP 504 with an error message indicating a timeout.
6. IF the AI provider returns an error, THEN THE Chat_Endpoint SHALL return HTTP 502 with a descriptive error message.

---

### Requirement 5: AI Context Construction

**User Story:** As a user, I want the AI to answer questions based on the file I uploaded, so that responses are relevant and accurate.

#### Acceptance Criteria

1. WHEN constructing the AI request, THE Chat_Service SHALL include the File_Context as a system-level instruction that instructs the AI to answer only based on the provided document.
2. WHEN constructing the AI request, THE Chat_Service SHALL include the full Conversation_History so that the AI can reference prior turns.
3. THE Chat_Service SHALL append the current user message as the final user turn in the AI request.
4. WHERE the File_Context exceeds 12,000 characters, THE Chat_Service SHALL truncate it to 12,000 characters before including it in the AI request.

---

### Requirement 6: Conversation History Management

**User Story:** As a user, I want the chat to remember what was said earlier in the session, so that I can ask follow-up questions without repeating context.

#### Acceptance Criteria

1. THE Dashboard SHALL maintain the Conversation_History in frontend state as an ordered list of Chat_Messages.
2. WHEN an AI response is received, THE Dashboard SHALL append the AI Chat_Message to the Conversation_History.
3. WHEN the user uploads a new file, THE Dashboard SHALL reset the Conversation_History to an empty list.
4. THE Dashboard SHALL NOT persist the Conversation_History to the backend or to browser storage.

---

### Requirement 7: Error Handling in the Chat Panel

**User Story:** As a user, I want to see a clear error message if the chat fails, so that I understand what went wrong and can try again.

#### Acceptance Criteria

1. IF the Chat_Endpoint returns an error response, THEN THE Chat_Panel SHALL display an inline error message within the message list indicating that the request failed.
2. WHEN an error is displayed, THE Chat_Panel SHALL re-enable the text input and send button so the user can retry.
3. THE Chat_Panel SHALL NOT remove prior Chat_Messages from the Conversation_History when an error occurs.

---

### Requirement 8: Frontend API Integration

**User Story:** As a developer, I want a typed API client function for the chat endpoint, so that the frontend can call it consistently with the rest of the API layer.

#### Acceptance Criteria

1. THE Chat_Panel SHALL call a dedicated `chatWithFile` API function located in `frontend/src/api/chatApi.ts`.
2. THE `chatWithFile` function SHALL accept `message` (string), `fileContext` (string), and `conversationHistory` (array) parameters and return a Promise resolving to the AI answer string.
3. IF the HTTP response status is not 200, THEN THE `chatWithFile` function SHALL throw an Error with the detail message from the response body.
