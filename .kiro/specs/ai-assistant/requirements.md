# Requirements Document

## Introduction

This feature adds a persistent AI assistant widget to the Semantic Validator web application. The assistant appears as a floating chat button accessible from every authenticated page. Users can open it to have a free-form conversation with the AI — asking general questions, getting help understanding features, or discussing their data — without leaving their current page or uploading a file. Conversation history is preserved for the duration of the browser session.

In addition to general-purpose conversation, the assistant is context-aware: when the user is on a page that has file content loaded (e.g., after uploading a file for analysis or chatting with a file on the ChatWithAI page), the assistant automatically uses that file as context. Users can ask the assistant to summarize the current file, answer questions about it, or explain analysis results already shown on screen. When no file context is available, the assistant falls back to general-purpose conversation.

## Glossary

- **AI_Assistant**: The floating chat widget component rendered globally within the authenticated app shell.
- **Assistant_Panel**: The expanded chat panel that opens when the user activates the AI_Assistant button.
- **Conversation**: The ordered sequence of user and assistant messages within a single browser session.
- **Message**: A single turn in the Conversation, attributed to either the "user" or the "assistant" role.
- **Session**: The period from when the user logs in until the browser tab is closed or the user logs out.
- **Anthropic_Client**: The existing backend service that communicates with the Claude API.
- **Chat_API**: The backend HTTP endpoint that accepts a message, an optional file context, and conversation history, and returns an assistant reply.
- **Authenticated_User**: A user who has successfully completed login and holds a valid access token.
- **File_Context**: The extracted text content of a file currently loaded in the application, made available to the AI_Assistant for context-aware responses.
- **Context_Provider**: The mechanism by which pages that have a file loaded share the File_Context with the AI_Assistant.
- **Summary_Request**: A user Message that explicitly asks the AI_Assistant to summarize the current file or analysis results.
- **Analysis_Result**: The structured output produced by the AI analysis service, including meaning, tone, clarity score, and suggestions.

---

## Requirements

### Requirement 1: Persistent Assistant Entry Point

**User Story:** As an Authenticated_User, I want a visible AI assistant button available on every page, so that I can start a conversation without navigating away from my current task.

#### Acceptance Criteria

1. THE AI_Assistant SHALL render a floating action button in the bottom-right corner of the viewport on every authenticated page.
2. THE AI_Assistant SHALL remain visible and accessible regardless of which route the Authenticated_User is currently viewing.
3. WHEN the Authenticated_User is not logged in, THE AI_Assistant SHALL not be rendered.
4. THE AI_Assistant button SHALL display a visual indicator (animated pulse) when the Assistant_Panel is closed, to draw attention to its availability.

---

### Requirement 2: Open and Close the Assistant Panel

**User Story:** As an Authenticated_User, I want to open and close the assistant panel with a single click, so that I can access help without disrupting my workflow.

#### Acceptance Criteria

1. WHEN the Authenticated_User clicks the AI_Assistant button, THE Assistant_Panel SHALL open and display the Conversation history.
2. WHEN the Assistant_Panel is open and the Authenticated_User clicks the close control, THE Assistant_Panel SHALL close without clearing the Conversation.
3. WHEN the Assistant_Panel is open and the Authenticated_User navigates to a different route, THE Assistant_Panel SHALL remain open and the Conversation SHALL be preserved.
4. THE Assistant_Panel SHALL render above all other page content with a z-index that prevents it from being obscured by other UI elements.

---

### Requirement 3: Sending Messages

**User Story:** As an Authenticated_User, I want to type a message and send it to the AI, so that I can get answers to my questions.

#### Acceptance Criteria

1. THE Assistant_Panel SHALL provide a text input field for composing a Message.
2. WHEN the Authenticated_User presses the Enter key while the text input is focused and the input is not empty, THE AI_Assistant SHALL submit the Message.
3. WHEN the Authenticated_User presses Shift+Enter while the text input is focused, THE AI_Assistant SHALL insert a newline character into the input without submitting.
4. WHEN the Authenticated_User clicks the send button and the text input is not empty, THE AI_Assistant SHALL submit the Message.
5. WHILE a Message is being processed, THE AI_Assistant SHALL disable the text input and send button to prevent duplicate submissions.
6. WHEN a Message is submitted, THE AI_Assistant SHALL append the Message to the Conversation with the "user" role before the response is received.

---

### Requirement 4: Receiving AI Responses

**User Story:** As an Authenticated_User, I want to receive a reply from the AI after sending a message, so that my questions are answered.

#### Acceptance Criteria

1. WHEN a Message is submitted, THE Chat_API SHALL be called with the Message text and the full Conversation history.
2. WHEN the Chat_API returns a successful response, THE AI_Assistant SHALL append the reply to the Conversation with the "assistant" role.
3. WHILE the Chat_API call is in progress, THE AI_Assistant SHALL display a loading indicator (animated typing dots) in the Conversation.
4. WHEN the Chat_API returns a successful response, THE AI_Assistant SHALL remove the loading indicator and display the reply.
5. WHEN the Chat_API call completes, THE AI_Assistant SHALL scroll the Conversation to the most recent Message.

---

### Requirement 5: Error Handling

**User Story:** As an Authenticated_User, I want to be informed when the AI is unavailable, so that I understand why I did not receive a response.

#### Acceptance Criteria

1. IF the Chat_API returns an HTTP 504 status, THEN THE AI_Assistant SHALL display the message "The AI took too long to respond. Please try again." inline in the Conversation.
2. IF the Chat_API returns an HTTP 502 status, THEN THE AI_Assistant SHALL display the message "The AI service is temporarily unavailable. Please try again." inline in the Conversation.
3. IF the Chat_API returns any other non-2xx status, THEN THE AI_Assistant SHALL display the message "Something went wrong. Please try again." inline in the Conversation.
4. WHEN an error message is displayed, THE AI_Assistant SHALL re-enable the text input and send button so the Authenticated_User can retry.
5. IF the network request fails before reaching the server, THEN THE AI_Assistant SHALL display the message "Network error. Please check your connection." inline in the Conversation.

---

### Requirement 6: Session-Scoped Conversation History

**User Story:** As an Authenticated_User, I want my conversation to persist while I navigate the app, so that I do not lose context when switching between pages.

#### Acceptance Criteria

1. THE AI_Assistant SHALL retain the full Conversation in memory for the duration of the Session.
2. WHEN the Authenticated_User navigates between routes, THE AI_Assistant SHALL preserve the Conversation without resetting it.
3. WHEN the Authenticated_User logs out, THE AI_Assistant SHALL clear the Conversation.
4. WHEN the browser tab is closed or refreshed, THE AI_Assistant SHALL not be required to restore the previous Conversation.

---

### Requirement 7: General-Purpose AI Endpoint

**User Story:** As an Authenticated_User, I want the assistant to answer general questions (not just file-specific ones), so that I can get help with any topic.

#### Acceptance Criteria

1. THE Chat_API SHALL accept a message and an optional conversation history and return an assistant reply without requiring a file context.
2. WHEN no file context is provided, THE Anthropic_Client SHALL use a general-purpose system prompt that describes the Semantic Validator application and its features.
3. THE Chat_API SHALL require a valid authentication token; IF no valid token is present, THEN THE Chat_API SHALL return HTTP 401.
4. WHEN a Message is received, THE Chat_API SHALL forward the Message and Conversation history to the Anthropic_Client and return the reply within 60 seconds.
5. IF the Anthropic_Client does not respond within 60 seconds, THEN THE Chat_API SHALL return HTTP 504 with a descriptive error message.

---

### Requirement 8: Accessibility

**User Story:** As an Authenticated_User using assistive technology, I want the AI assistant to be keyboard-navigable and screen-reader-friendly, so that I can use it without a mouse.

#### Acceptance Criteria

1. THE AI_Assistant button SHALL have an accessible label readable by screen readers (aria-label="Open AI Assistant").
2. WHEN the Assistant_Panel opens, THE AI_Assistant SHALL move keyboard focus to the text input field.
3. THE Assistant_Panel SHALL be navigable using the Tab key to reach the text input and send button.
4. WHEN the Assistant_Panel closes, THE AI_Assistant SHALL return keyboard focus to the floating action button.
5. WHEN a new Message is appended to the Conversation, THE AI_Assistant SHALL announce the Message content to screen readers using an ARIA live region.

---

### Requirement 9: File Context Awareness

**User Story:** As an Authenticated_User, I want the AI assistant to automatically use the file I am currently working with as context, so that I can ask questions about it without re-uploading or switching pages.

#### Acceptance Criteria

1. THE Context_Provider SHALL expose a mechanism for pages that have a file loaded to share the File_Context and filename with the AI_Assistant.
2. WHEN the Authenticated_User is on a page with a File_Context available, THE AI_Assistant SHALL pass the File_Context to the Chat_API with each Message submission.
3. WHEN the Authenticated_User navigates away from a page that provided a File_Context, THE AI_Assistant SHALL clear the File_Context so subsequent messages use the general-purpose mode.
4. WHEN a File_Context is active, THE Assistant_Panel SHALL display the filename of the active file so the Authenticated_User knows which file the assistant is referencing.
5. WHEN no File_Context is available, THE AI_Assistant SHALL fall back to general-purpose conversation without requiring any action from the Authenticated_User.
6. THE Chat_API SHALL truncate the File_Context to 12,000 characters before forwarding it to the Anthropic_Client to stay within token limits.

---

### Requirement 10: On-Demand File Summarization

**User Story:** As an Authenticated_User, I want to ask the AI assistant to summarize the file I am currently viewing, so that I can quickly understand its content without reading it in full.

#### Acceptance Criteria

1. WHEN a File_Context is active and the Authenticated_User sends a Summary_Request, THE AI_Assistant SHALL submit the request to the Chat_API with the File_Context included.
2. WHEN the Chat_API receives a Summary_Request with a File_Context, THE Anthropic_Client SHALL produce a concise summary of the file content and return it as the assistant reply.
3. THE Assistant_Panel SHALL display a "Summarize this file" quick-action button when a File_Context is active, so the Authenticated_User can trigger a summary with a single click.
4. WHEN the Authenticated_User clicks the "Summarize this file" quick-action button, THE AI_Assistant SHALL submit the text "Please summarize this file." as a Message with the active File_Context.
5. IF no File_Context is active when the Authenticated_User requests a summary, THEN THE AI_Assistant SHALL reply with a message explaining that no file is currently loaded and suggesting the Authenticated_User upload a file on the Chat with AI page.

---

### Requirement 11: AI-Powered File Analysis via the Assistant

**User Story:** As an Authenticated_User, I want to ask the AI assistant to analyze the file I am currently viewing, so that I can get meaning, tone, clarity, and improvement suggestions without navigating to a separate page.

#### Acceptance Criteria

1. WHEN a File_Context is active and the Authenticated_User asks the AI_Assistant to analyze the file, THE AI_Assistant SHALL submit the request to the Chat_API with the File_Context included.
2. WHEN the Chat_API receives an analysis request with a File_Context, THE Anthropic_Client SHALL return an analysis covering the file's meaning, tone, clarity, and improvement suggestions as a conversational reply.
3. THE Assistant_Panel SHALL display an "Analyze this file" quick-action button when a File_Context is active, so the Authenticated_User can trigger analysis with a single click.
4. WHEN the Authenticated_User clicks the "Analyze this file" quick-action button, THE AI_Assistant SHALL submit the text "Please analyze this file: describe its meaning, tone, clarity, and provide improvement suggestions." as a Message with the active File_Context.
5. IF no File_Context is active when the Authenticated_User requests analysis, THEN THE AI_Assistant SHALL reply with a message explaining that no file is currently loaded.

---

### Requirement 12: Context-Aware Summary of On-Screen Analysis Results

**User Story:** As an Authenticated_User, I want the AI assistant to explain the analysis results currently shown on screen, so that I can understand what the scores and suggestions mean without leaving the page.

#### Acceptance Criteria

1. THE Context_Provider SHALL allow pages that display an Analysis_Result to share the Analysis_Result data with the AI_Assistant alongside the File_Context.
2. WHEN an Analysis_Result is available as context and the Authenticated_User asks the AI_Assistant to explain the results, THE AI_Assistant SHALL include the Analysis_Result data in the Message submitted to the Chat_API.
3. WHEN the Chat_API receives a Message that includes Analysis_Result data, THE Anthropic_Client SHALL produce a plain-language explanation of the meaning, tone classification, clarity score, and suggestions.
4. THE Assistant_Panel SHALL display an "Explain these results" quick-action button when an Analysis_Result is available as context.
5. WHEN the Authenticated_User clicks the "Explain these results" quick-action button, THE AI_Assistant SHALL submit a Message that includes the serialized Analysis_Result and asks the Anthropic_Client to explain it in plain language.
