# Design Document: File Chat

## Overview

The File Chat feature adds a ChatGPT-style conversational interface to the Semantic Validator. After a file is uploaded and its text extracted, a "Chat with File" button appears in the FileUploader success state. Clicking it opens a `FileChat` panel where the user can ask questions about the file content. Every message is sent to a new `POST /api/chat` backend endpoint along with the full extracted text (as context) and the accumulated conversation history. The AI answers solely based on the provided document. History is held in React state only — no persistence to the backend or browser storage.

The feature slots into the existing architecture without modifying any existing endpoints or services:

- **Backend**: new Pydantic schemas → new `chat_service.py` → new `chat` router → registered in `main.py`
- **Frontend**: new types → new `chatApi.ts` → new `FileChat.tsx` component → wired into `FileUploader` and `Dashboard`

---

## Architecture

```mermaid
sequenceDiagram
    participant User
    participant FileUploader
    participant Dashboard
    participant FileChat
    participant chatApi
    participant /api/chat
    participant chat_service
    participant AI Provider

    User->>FileUploader: uploads file (success)
    FileUploader->>User: shows "Chat with File" button
    User->>FileUploader: clicks "Chat with File"
    FileUploader->>Dashboard: onChatWithFile(extractedText, filename)
    Dashboard->>FileChat: renders with fileContext + filename + history
    User->>FileChat: types message, presses Enter
    FileChat->>chatApi: chatWithFile(message, fileContext, history)
    chatApi->>/api/chat: POST {message, file_context, conversation_history}
    /api/chat->>chat_service: chat(message, file_context, history)
    chat_service->>AI Provider: POST messages array
    AI Provider-->>chat_service: {choices[0].message.content}
    chat_service-->>/api/chat: answer string
    /api/chat-->>chatApi: {answer}
    chatApi-->>FileChat: answer string
    FileChat->>Dashboard: updates conversationHistory state
    FileChat->>User: renders AI message
```

---

## Components and Interfaces

### Backend

#### `ChatMessage` schema
```python
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
```

#### `ChatRequest` schema
```python
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    file_context: str = Field(..., min_length=1)
    conversation_history: list[ChatMessage] = Field(default_factory=list)
```

#### `ChatResponse` schema
```python
class ChatResponse(BaseModel):
    answer: str
```

#### `chat_service.py`
```python
async def build_prompt(
    message: str,
    file_context: str,
    conversation_history: list[ChatMessage],
) -> list[dict]:
    """
    Returns the messages array for the AI provider.
    Truncates file_context to 12,000 characters.
    System message instructs AI to answer only from the document.
    """

async def chat(
    message: str,
    file_context: str,
    conversation_history: list[ChatMessage],
) -> str:
    """
    Calls the AI provider and returns the answer string.
    Raises AITimeoutError or AIServiceError on failure.
    """
```

#### `routers/chat.py`
```python
@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    ...
```

---

### Frontend

#### New types in `types.ts`
```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };
```

#### `chatApi.ts`
```typescript
export async function chatWithFile(
  message: string,
  fileContext: string,
  conversationHistory: ChatMessage[]
): Promise<string>
```
Throws `Error` with the `detail` field from the response body on non-200 responses.

#### `FileChat.tsx` props
```typescript
interface FileChatProps {
  filename: string;
  fileContext: string;
  conversationHistory: ChatMessage[];
  onHistoryUpdate: (updated: ChatMessage[]) => void;
}
```

#### `FileUploader.tsx` — new optional prop
```typescript
onChatWithFile?: (extractedText: string, filename: string) => void;
```
The "Chat with File" button is rendered only when this prop is provided and the uploader is in the `success` state.

#### `Dashboard.tsx` — new state
```typescript
const [chatFileContext, setChatFileContext] = useState<string | null>(null);
const [chatFilename, setChatFilename] = useState<string>("");
const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
```
`handleChatWithFile(text, filename)` sets context + filename and resets history. `FileChat` is rendered when `chatFileContext !== null`.

---

## Data Models

### API Request / Response

**`POST /api/chat`**

Request body:
```json
{
  "message": "What is the main topic of this document?",
  "file_context": "<extracted text of the uploaded file>",
  "conversation_history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

Response body (200):
```json
{
  "answer": "The document discusses..."
}
```

Error responses:
| Status | Condition |
|--------|-----------|
| 422 | `message` or `file_context` is empty/missing (FastAPI validation) |
| 504 | AI provider timeout (`AITimeoutError`) |
| 502 | AI provider error (`AIServiceError`) |

### Prompt Construction

`build_prompt` produces a messages array in this order:

1. `{"role": "system", "content": "You are a helpful assistant. Answer questions based only on the following document:\n\n<file_context[:12000]>"}` 
2. All entries from `conversation_history` (in order)
3. `{"role": "user", "content": "<message>"}`

### Frontend State Flow

```
Dashboard state:
  chatFileContext: string | null   — null = chat not active
  chatFilename: string
  chatHistory: ChatMessage[]

FileChat internal state:
  inputValue: string
  chatState: ChatState            — idle | loading | error
```

When the user sends a message:
1. `FileChat` appends `{role:"user", content: message}` to a local copy of history
2. Calls `chatWithFile(message, fileContext, history)`
3. On success: calls `onHistoryUpdate([...history, {role:"assistant", content: answer}])`
4. On error: sets `chatState` to `{status:"error", message: ...}`, does NOT modify history

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Non-empty message submission grows history

*For any* non-empty message string and any existing conversation history, submitting the message via the chat input should result in the conversation history growing by exactly one entry (the user message), and the input field should be cleared.

**Validates: Requirements 3.1**

---

### Property 2: Whitespace-only messages are rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to submit it should leave the conversation history unchanged and should not invoke the `chatWithFile` API function.

**Validates: Requirements 3.2**

---

### Property 3: build_prompt includes file_context in system message

*For any* non-empty `file_context` string (up to 12,000 characters), `build_prompt()` should return a messages list whose first element has `role="system"` and whose `content` contains the file_context verbatim.

**Validates: Requirements 5.1**

---

### Property 4: build_prompt preserves full conversation history

*For any* list of `ChatMessage` objects as `conversation_history`, `build_prompt()` should return a messages list that contains all entries from `conversation_history` in the same order, positioned between the system message and the final user message.

**Validates: Requirements 5.2, 5.3**

---

### Property 5: File context truncation at 12,000 characters

*For any* `file_context` string whose length exceeds 12,000 characters, the system message produced by `build_prompt()` should contain at most 12,000 characters of the context (i.e., `file_context[:12000]`).

**Validates: Requirements 5.4**

---

### Property 6: AI response is appended to history as assistant message

*For any* answer string returned by the AI provider, after the chat response is processed, the conversation history should contain a new entry with `role="assistant"` and `content` equal to the answer string.

**Validates: Requirements 6.2**

---

### Property 7: Error response displays inline error without clearing history

*For any* non-empty conversation history and any error message returned by the API, after the error is received the conversation history length should be unchanged and an inline error message should be visible in the chat panel.

**Validates: Requirements 7.1, 7.3**

---

### Property 8: chatWithFile throws on non-200 with detail message

*For any* non-200 HTTP status code and any `detail` string in the response body, `chatWithFile` should throw an `Error` whose `message` property equals the `detail` string.

**Validates: Requirements 8.3**

---

## Error Handling

| Layer | Error | Handling |
|-------|-------|----------|
| `chat_service` | `httpx.TimeoutException` | Re-raise as `AITimeoutError` |
| `chat_service` | Non-200 from AI provider | Raise `AIServiceError` |
| `chat_service` | Unparseable AI response | Raise `AIServiceError` |
| `routers/chat` | `AITimeoutError` | HTTP 504 |
| `routers/chat` | `AIServiceError` | HTTP 502 |
| `routers/chat` | Pydantic validation failure | HTTP 422 (automatic) |
| `chatApi.ts` | Non-200 response | Throw `Error(detail)` |
| `FileChat.tsx` | Thrown error from `chatWithFile` | Set `chatState` to `{status:"error", message}`, re-enable input/button, display inline error |

The `FileChat` component never removes prior messages from the conversation history on error — the user can read the history and retry.

---

## Testing Strategy

### Unit Tests (example-based)

**Backend (`pytest`):**
- `test_chat_router.py`: valid request → 200 + answer; empty message → 422; empty file_context → 422; timeout → 504; AI error → 502
- `test_chat_service.py`: `build_prompt` with empty history; `build_prompt` with multi-turn history; truncation at exactly 12,000 chars; truncation above 12,000 chars

**Frontend (`vitest` + `@testing-library/react`):**
- `FileChat.test.tsx`: renders filename header; renders input + send button; loading state disables controls; error state shows inline message; Shift+Enter inserts newline; Enter submits
- `chatApi.test.ts`: 200 response resolves to answer string; 502 response throws with detail

### Property-Based Tests

Property-based testing is applicable here because the core logic — prompt construction, input validation, and history management — involves pure functions whose correctness must hold across a wide range of inputs.

**Library**: `hypothesis` (Python, backend) and `fast-check` (TypeScript, frontend)

**Minimum 100 iterations per property test.**

Each test is tagged with a comment referencing the design property:
> `# Feature: file-chat, Property N: <property_text>`

**Backend property tests (`hypothesis`):**

- **Property 3** — `build_prompt` system message contains file_context: generate arbitrary strings ≤ 12,000 chars, assert system message content contains the string
- **Property 4** — `build_prompt` preserves history order: generate arbitrary lists of `ChatMessage`, assert all appear in output between system and final user message
- **Property 5** — Truncation: generate strings with `len > 12000`, assert system message content length ≤ 12,000

**Frontend property tests (`fast-check`):**

- **Property 1** — Non-empty submission grows history: generate arbitrary non-empty strings, simulate submit, assert history length increases by 1 and input is cleared
- **Property 2** — Whitespace rejection: generate strings from `fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') })`, simulate submit, assert `chatWithFile` not called and history unchanged
- **Property 6** — AI response appended as assistant: generate arbitrary answer strings, simulate successful API response, assert last history entry is `{role:"assistant", content: answer}`
- **Property 7** — Error preserves history: generate arbitrary histories and error messages, simulate API error, assert history length unchanged and error text visible
- **Property 8** — `chatWithFile` throws with detail: generate arbitrary detail strings and non-200 status codes, mock fetch, assert thrown error message equals detail

### Integration Tests

- End-to-end: POST `/api/chat` with a real (mocked) AI provider response, verify full round-trip
- Verify `main.py` registers the chat router and the endpoint is reachable
