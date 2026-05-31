# Implementation Plan: File Chat

## Overview

Implement the File Chat feature by adding a backend chat endpoint (schemas, service, router) and a frontend chat UI (types, API client, FileChat component, Dashboard/FileUploader wiring). Each task builds incrementally toward a fully integrated conversational interface grounded in uploaded file content.

## Tasks

- [x] 1. Add backend Pydantic schemas for chat
  - Add `ChatMessage`, `ChatRequest`, and `ChatResponse` to `backend/app/models/schemas.py`
  - `ChatMessage`: `role: Literal["user", "assistant"]`, `content: str`
  - `ChatRequest`: `message: str = Field(..., min_length=1)`, `file_context: str = Field(..., min_length=1)`, `conversation_history: list[ChatMessage] = Field(default_factory=list)`
  - `ChatResponse`: `answer: str`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implement `chat_service.py`
  - [x] 2.1 Create `backend/app/services/chat_service.py` with `build_prompt` and `chat` functions
    - `build_prompt(message, file_context, conversation_history)` returns messages array: system message with `file_context[:12000]`, then history entries, then final user message
    - `chat(message, file_context, conversation_history)` calls the AI provider and returns the answer string
    - Re-raise `httpx.TimeoutException` as `AITimeoutError`; raise `AIServiceError` on non-200 or unparseable response
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 4.5, 4.6_

  - [ ]* 2.2 Write property test for `build_prompt` — Property 3: system message contains file_context
    - **Property 3: build_prompt includes file_context in system message**
    - Use `hypothesis` to generate arbitrary strings ≤ 12,000 chars; assert first message has `role="system"` and content contains the string verbatim
    - **Validates: Requirements 5.1**

  - [ ]* 2.3 Write property test for `build_prompt` — Property 4: conversation history preserved
    - **Property 4: build_prompt preserves full conversation history**
    - Use `hypothesis` to generate arbitrary lists of `ChatMessage`; assert all entries appear in output between system message and final user message, in order
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 2.4 Write property test for `build_prompt` — Property 5: file_context truncation at 12,000 chars
    - **Property 5: File context truncation at 12,000 characters**
    - Use `hypothesis` to generate strings with `len > 12000`; assert system message content contains at most 12,000 characters of context
    - **Validates: Requirements 5.4**

  - [ ]* 2.5 Write unit tests for `chat_service.py` in `backend/tests/test_chat_service.py`
    - `build_prompt` with empty history; `build_prompt` with multi-turn history; truncation at exactly 12,000 chars; truncation above 12,000 chars
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Implement `routers/chat.py` and register in `main.py`
  - [x] 3.1 Create `backend/app/routers/chat.py` with `POST /api/chat` endpoint
    - Accept `ChatRequest`, call `chat_service.chat(...)`, return `ChatResponse`
    - Map `AITimeoutError` → HTTP 504; `AIServiceError` → HTTP 502; Pydantic validation failures → HTTP 422 (automatic)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 Register the chat router in `backend/app/main.py`
    - Import and include the chat router so `POST /api/chat` is reachable
    - _Requirements: 4.1_

  - [ ]* 3.3 Write unit tests for the chat router in `backend/tests/test_chat_router.py`
    - Valid request → 200 + answer; empty message → 422; empty file_context → 422; timeout → 504; AI error → 502
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add frontend types and API client
  - [x] 5.1 Add `ChatMessage` and `ChatState` types to `frontend/src/types.ts`
    - `ChatMessage`: `{ role: "user" | "assistant"; content: string }`
    - `ChatState`: discriminated union `{ status: "idle" } | { status: "loading" } | { status: "error"; message: string }`
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Create `frontend/src/api/chatApi.ts` with `chatWithFile` function
    - `chatWithFile(message: string, fileContext: string, conversationHistory: ChatMessage[]): Promise<string>`
    - POST to `/api/chat`, resolve to `answer` string on 200
    - Throw `Error(detail)` on non-200 responses
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 5.3 Write property test for `chatWithFile` — Property 8: throws with detail on non-200
    - **Property 8: chatWithFile throws on non-200 with detail message**
    - Use `fast-check` to generate arbitrary detail strings and non-200 status codes; mock fetch; assert thrown error message equals detail
    - **Validates: Requirements 8.3**

  - [ ]* 5.4 Write unit tests for `chatApi.ts` in `frontend/src/__tests__/chatApi.test.ts`
    - 200 response resolves to answer string; 502 response throws with detail
    - _Requirements: 8.2, 8.3_

- [x] 6. Implement `FileChat.tsx` component
  - [x] 6.1 Create `frontend/src/components/FileChat.tsx`
    - Props: `filename`, `fileContext`, `conversationHistory`, `onHistoryUpdate`
    - Render filename header, scrollable message list (user messages right-aligned, AI messages left-aligned), text input, and send button
    - Auto-scroll to latest message when history updates
    - Show loading indicator in AI message position while fetching
    - Show inline error message in message list on API error (do not clear history)
    - Re-enable input and button after error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 7.2, 7.3_

  - [x] 6.2 Implement message submission logic in `FileChat.tsx`
    - On Enter (without Shift): append user message to history copy, clear input, call `chatWithFile`, on success call `onHistoryUpdate` with assistant reply appended
    - On Shift+Enter: insert newline
    - Reject empty/whitespace-only messages without calling API
    - Disable input and send button while loading
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.2_

  - [ ]* 6.3 Write property test for `FileChat` — Property 1: non-empty submission grows history
    - **Property 1: Non-empty message submission grows history**
    - Use `fast-check` to generate arbitrary non-empty strings; simulate submit; assert history length increases by 1 and input is cleared
    - **Validates: Requirements 3.1**

  - [ ]* 6.4 Write property test for `FileChat` — Property 2: whitespace-only messages are rejected
    - **Property 2: Whitespace-only messages are rejected**
    - Use `fast-check` with `fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') })`; simulate submit; assert `chatWithFile` not called and history unchanged
    - **Validates: Requirements 3.2**

  - [ ]* 6.5 Write property test for `FileChat` — Property 6: AI response appended as assistant message
    - **Property 6: AI response is appended to history as assistant message**
    - Use `fast-check` to generate arbitrary answer strings; simulate successful API response; assert last history entry is `{ role: "assistant", content: answer }`
    - **Validates: Requirements 6.2**

  - [ ]* 6.6 Write property test for `FileChat` — Property 7: error preserves history
    - **Property 7: Error response displays inline error without clearing history**
    - Use `fast-check` to generate arbitrary histories and error messages; simulate API error; assert history length unchanged and error text visible
    - **Validates: Requirements 7.1, 7.3**

  - [ ]* 6.7 Write unit tests for `FileChat.tsx` in `frontend/src/__tests__/FileChat.test.tsx`
    - Renders filename header; renders input and send button; loading state disables controls; error state shows inline message; Shift+Enter inserts newline; Enter submits
    - _Requirements: 2.3, 2.5, 2.7, 3.1, 3.3, 3.4, 7.1, 7.2_

- [x] 7. Wire `FileChat` into `FileUploader` and `Dashboard`
  - [x] 7.1 Extend `FileUploader.tsx` with optional `onChatWithFile` prop
    - Add `onChatWithFile?: (extractedText: string, filename: string) => void` to props
    - Render "Chat with File" button only when `onChatWithFile` is provided and uploader is in `success` state
    - Style button consistently with existing action buttons and active theme
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 7.2 Extend `Dashboard.tsx` with chat state and `FileChat` rendering
    - Add `chatFileContext`, `chatFilename`, `chatHistory` state
    - Implement `handleChatWithFile(text, filename)`: set context + filename, reset history
    - Pass `onChatWithFile={handleChatWithFile}` to `FileUploader`
    - Render `<FileChat>` when `chatFileContext !== null`, passing history and `onHistoryUpdate={setChatHistory}`
    - Reset `chatHistory` when a new file is uploaded
    - _Requirements: 1.3, 2.6, 6.1, 6.3, 6.4_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `hypothesis` (backend) and `fast-check` (frontend)
- Unit tests use `pytest` (backend) and `vitest` + `@testing-library/react` (frontend)
- Chat history is held in React state only — no backend or browser storage persistence
