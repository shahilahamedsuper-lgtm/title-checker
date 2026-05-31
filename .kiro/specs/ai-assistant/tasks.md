# Implementation Plan: AI Assistant Widget

## Overview

Implement a persistent, globally-available AI assistant widget for the Semantic Validator application. The widget is a floating chat panel that survives route changes, supports both general-purpose and file-context-aware conversation, and integrates with the existing Anthropic-backed services. Implementation proceeds backend-first (new endpoint + schemas), then frontend context, then UI components, then page integrations, and finally `index.html` polish.

---

## Tasks

- [x] 1. Add Pydantic schemas for the assistant endpoint
  - Add `AssistantChatRequest` and `AssistantChatResponse` to `backend/app/models/schemas.py`
  - `AssistantChatRequest`: `message: str = Field(..., min_length=1)`, `file_context: Optional[str] = None`, `conversation_history: list[ChatMessage] = Field(default_factory=list)`
  - `AssistantChatResponse`: `answer: str`
  - Import `Optional` from `typing` if not already present
  - _Requirements: 7.1, 7.2, 9.6_

- [x] 2. Implement the `assistant.py` router and register it in `main.py`
  - [x] 2.1 Create `backend/app/routers/assistant.py`
    - Define `GENERAL_SYSTEM_PROMPT` constant describing the Semantic Validator app
    - Implement `POST /api/assistant/chat` route with `Depends(get_current_user)` guard
    - When `file_context` is present → delegate to `chat_service.chat(message, file_context, conversation_history)`
    - When `file_context` is absent → build messages list from history + new user turn, call `call_anthropic(messages=..., system=GENERAL_SYSTEM_PROMPT, temperature=0.5)`
    - Catch `AITimeoutError` → raise `HTTPException(status_code=504, ...)`
    - Catch `AIServiceError` → raise `HTTPException(status_code=502, ...)`
    - Return `AssistantChatResponse(answer=answer)`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.6_

  - [x] 2.2 Register the router in `backend/app/main.py`
    - Import `assistant` from `app.routers`
    - Add `app.include_router(assistant.router)` after the existing router registrations
    - _Requirements: 7.1_

  - [ ]* 2.3 Write unit tests for `assistant.py` in `backend/tests/test_assistant.py`
    - `POST /api/assistant/chat` without token → 401
    - `POST /api/assistant/chat` with empty `message` → 422
    - With `file_context` → `chat_service.chat` is called (mock it)
    - Without `file_context` → `call_anthropic` is called with `GENERAL_SYSTEM_PROMPT` (mock it)
    - `AITimeoutError` raised → 504
    - `AIServiceError` raised → 502
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Checkpoint — backend wired up
  - Ensure all backend tests pass: `pytest backend/tests/` — ask the user if questions arise.

- [x] 4. Add `AssistantMessage` type and extend `frontend/src/types.ts`
  - Add `AssistantMessage` interface: `id: string`, `role: "user" | "assistant" | "error"`, `content: string`, `timestamp: number`
  - This is the richer in-memory representation used by the context; existing `ChatMessage` is reused for API payloads
  - _Requirements: 3.6, 4.2, 5.1, 5.2, 5.3_

- [x] 5. Implement `AIAssistantContext` in `frontend/src/context/AIAssistantContext.tsx`
  - Define `AIAssistantContextValue` interface matching the design spec (fileContext, filename, analysisResult, setFileContext, clearFileContext, setAnalysisResult, messages, addMessage, clearMessages, isOpen, togglePanel, openPanel, closePanel)
  - Implement `AIAssistantProvider` component using `useState` for all state slices
  - Export `useAIAssistant()` hook that throws if used outside the provider
  - Subscribe to `AuthContext.token` via `useAuth()`; when token becomes `null`, call `clearMessages()`
  - _Requirements: 1.2, 2.2, 2.3, 6.1, 6.2, 6.3, 9.1, 9.3, 12.1_

  - [ ]* 5.1 Write unit tests for `AIAssistantContext` in `frontend/src/__tests__/AIAssistant/AIAssistantContext.test.tsx`
    - `setFileContext` stores text and filename
    - `clearFileContext` resets both to null
    - `setAnalysisResult` stores result
    - `clearMessages` empties the messages array
    - Logout (token → null) clears messages
    - _Requirements: 6.3, 9.1, 9.3, 12.1_

- [x] 6. Add `chatWithAssistant` to `frontend/src/api/chatApi.ts`
  - Export `chatWithAssistant(message: string, fileContext: string | null, conversationHistory: ChatMessage[]): Promise<string>`
  - POST to `/api/assistant/chat` with `{ message, file_context: fileContext ?? undefined, conversation_history: conversationHistory }`
  - Map HTTP 504 → `"The AI took too long to respond. Please try again."`
  - Map HTTP 502 → `"The AI service is temporarily unavailable. Please try again."`
  - Map network error (no response) → `"Network error. Please check your connection."`
  - Map any other non-2xx → `"Something went wrong. Please try again."`
  - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.5, 7.4_

  - [ ]* 6.1 Write unit tests for `chatWithAssistant` in `frontend/src/__tests__/AIAssistant/chatApi.test.ts`
    - 504 → throws with `"The AI took too long to respond. Please try again."`
    - 502 → throws with `"The AI service is temporarily unavailable. Please try again."`
    - Network error (no response) → throws with `"Network error. Please check your connection."`
    - Other non-2xx (e.g. 500) → throws with `"Something went wrong. Please try again."`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 7. Implement `AIAssistantButton` in `frontend/src/components/AIAssistant/AIAssistantButton.tsx`
  - Fixed FAB: `bottom-6 right-6`, `z-50`, 56×56 px circle with purple→blue→cyan gradient and neon box-shadow
  - Animated pulse ring sibling (visible only when `!isOpen`)
  - `<Bot />` icon from `lucide-react` (24×24, white)
  - Framer Motion `whileHover={{ scale: 1.1 }}`, `whileTap={{ scale: 0.95 }}`
  - Unread badge: small red circle `top-0 right-0`, shows `messageCount` when `!isOpen && messageCount > 0`
  - `aria-label` toggles between `"Open AI Assistant"` and `"Close AI Assistant"` based on `isOpen`
  - Accept props: `isOpen: boolean`, `onClick: () => void`, `messageCount: number`
  - _Requirements: 1.1, 1.2, 1.4, 8.1_

  - [ ]* 7.1 Write unit tests for `AIAssistantButton` in `frontend/src/__tests__/AIAssistant/AIAssistantButton.test.tsx`
    - Renders `aria-label="Open AI Assistant"` when `isOpen=false`
    - Renders `aria-label="Close AI Assistant"` when `isOpen=true`
    - Pulse ring present when `isOpen=false`
    - Pulse ring absent when `isOpen=true`
    - Unread badge shows count when `!isOpen && messageCount > 0`
    - _Requirements: 1.4, 8.1_

- [x] 8. Implement `AIAssistantPanel` in `frontend/src/components/AIAssistant/AIAssistantPanel.tsx`
  - Fixed panel: `bottom-24 right-6`, `width: 380px`, `height: 520px`, `z-50`
  - Framer Motion entry/exit: `initial={{ opacity: 0, y: 24, scale: 0.96 }}`, `animate={{ opacity: 1, y: 0, scale: 1 }}`, `exit={{ opacity: 0, y: 16, scale: 0.97 }}`, `transition={{ duration: 0.22, ease: "easeOut" }}`
  - Header: gradient title "AI Assistant", filename pill (cyan border, visible when `filename` is set), close button
  - Quick-action buttons row (visible when `fileContext` is active): "Summarize this file", "Analyze this file", "Explain these results" (last one only when `analysisResult` is set)
    - "Summarize" submits `"Please summarize this file."`
    - "Analyze" submits `"Please analyze this file: describe its meaning, tone, clarity, and provide improvement suggestions."`
    - "Explain Results" submits a message containing all four serialized fields of `analysisResult` (meaning, tone, clarity_score, suggestions)
  - Message list: `flex-1 overflow-y-auto`, `aria-live="polite" aria-atomic="false"`
    - User bubbles: right-aligned, blue gradient, `rounded-2xl rounded-tr-sm`, `max-w-[85%]`
    - Assistant bubbles: left-aligned, glass bg, `rounded-2xl rounded-tl-sm`, `max-w-[85%]`
    - Error bubbles: left-aligned, `border border-red-500/30 text-red-400`
    - Typing indicator: left-aligned glass bubble with three bouncing dots (CSS animation)
  - Welcome message: static assistant bubble shown when `messages` array is empty
  - Textarea input: `rows=1`, auto-resize, `max-h-24`, glass bg; `Enter` submits, `Shift+Enter` inserts newline
  - Send button: `NeonButton` variant `"primary"`, disabled while loading or input is empty
  - `useEffect` to focus textarea when panel opens; return focus to FAB ref on close
  - Consume `useAIAssistant()` for all state; call `chatWithAssistant` from `chatApi.ts`; append user message before API call, append assistant/error message after
  - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 8.3, 8.4, 8.5, 9.2, 9.4, 10.3, 10.4, 11.3, 11.4, 12.4, 12.5_

  - [ ]* 8.1 Write unit tests for `AIAssistantPanel` in `frontend/src/__tests__/AIAssistant/AIAssistantPanel.test.tsx`
    - Welcome message shown when messages array is empty
    - Typing indicator shown while loading; hidden after response
    - Input and send button disabled while loading
    - Input and send button re-enabled after error
    - Filename pill visible when `fileContext` is active
    - Quick-action buttons visible when `fileContext` is active
    - "Explain Results" button visible only when `analysisResult` is set
    - `Shift+Enter` inserts newline without submitting
    - ARIA live region present on message list
    - _Requirements: 3.3, 3.5, 4.3, 5.4, 8.5, 9.4, 10.3, 11.3, 12.4_

- [x] 9. Implement `AIAssistantWidget` barrel in `frontend/src/components/AIAssistant/index.tsx`
  - Export `AIAssistantWidget` function component
  - Consume `useAIAssistant()` for `isOpen`, `togglePanel`, `closePanel`, `messages`
  - Render `<AIAssistantButton>` and wrap `<AIAssistantPanel>` in `<AnimatePresence>` (conditional on `isOpen`)
  - This is the single component added to `AppShell`
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 10. Wire `AIAssistantProvider` and `AIAssistantWidget` into `App.tsx`
  - Import `AIAssistantProvider` from `./context/AIAssistantContext`
  - Import `AIAssistantWidget` from `./components/AIAssistant`
  - Wrap `<SoundProvider>` (or its children) with `<AIAssistantProvider>` — mount it inside `<AuthProvider>` so `useAuth()` is available
  - Add `<AIAssistantWidget />` inside `AppShell`'s return, as a sibling to `<ParticleField>` and the main layout div (it is fixed-positioned so placement in JSX tree does not affect layout)
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2_

- [ ] 11. Checkpoint — widget renders globally
  - Run `npm run test` in `frontend/` to confirm all existing and new tests pass — ask the user if questions arise.

- [x] 12. Integrate file context into `ChatWithAIPage`
  - Import `useAIAssistant` from `../../context/AIAssistantContext`
  - After a successful file upload (`result = await uploadFile(file)`), call `setFileContext(result.extracted_text, result.filename)`
  - On "Change File" click (which resets local state), call `clearFileContext()`
  - Add `useEffect` cleanup: return `() => clearFileContext()` on unmount
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 13. Integrate file context into `UploadFilePage`
  - Import `useAIAssistant` from `../../context/AIAssistantContext`
  - In `handleAnalyze(text, fallbackTitle)`, after a successful analysis, call `setFileContext(text, fallbackTitle)` so the assistant can reference the uploaded document
  - Add `useEffect` cleanup: return `() => clearFileContext()` on unmount
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 14. Integrate analysis result context into `AnalyzeExcelPage`
  - Import `useAIAssistant` from `../../context/AIAssistantContext`
  - After a successful Excel analysis (`setState({ status: "success", result })`), call `setAnalysisResult` with a mapped `AnalysisResult` derived from the Excel summary (use `ai_summary` as `meaning`, set sensible defaults for `tone`, `clarity_score`, `suggestions`)
  - Add `useEffect` cleanup: return `() => clearFileContext()` on unmount
  - _Requirements: 9.1, 9.3, 12.1_

- [ ] 15. Write property-based tests for the frontend
  - Create `frontend/src/__tests__/properties/aiAssistant.property.test.ts`
  - Use `fast-check` (`fc`) with `numRuns: 100` for all properties
  - Tag each test with `// Feature: ai-assistant, Property N: <property text>`

  - [ ]* 15.1 Property 1 — Button present on every authenticated route
    - `fc.property(fc.constantFrom('/', '/upload', '/analyze-excel', '/similarity', '/excel-dedup', '/chat', '/history', '/settings'), route => { ... })`
    - Render `AppShell` wrapped in providers with `MemoryRouter` at each route; assert `getByLabelText(/AI Assistant/)` is in the document
    - **Property 1: Button present on every authenticated route**
    - **Validates: Requirements 1.2**

  - [ ]* 15.2 Property 2 — Panel close preserves conversation
    - `fc.property(fc.array(messageArbitrary, { minLength: 1 }), messages => { ... })`
    - Seed context with messages, open panel, close panel, assert messages array unchanged (same length, content, order)
    - **Property 2: Panel close preserves conversation**
    - **Validates: Requirements 2.2, 6.1**

  - [ ]* 15.3 Property 3 — Non-empty message submission adds user turn
    - `fc.property(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), msg => { ... })`
    - Type `msg` into textarea, press Enter, assert `messages[last].role === "user"` and `content === msg.trim()` before API resolves
    - **Property 3: Non-empty message submission adds user turn**
    - **Validates: Requirements 3.2, 3.4, 3.6**

  - [ ]* 15.4 Property 4 — API call carries full conversation context
    - `fc.property(fc.string({ minLength: 1 }), fc.array(chatMessageArbitrary), (msg, history) => { ... })`
    - Mock `apiClient.post`, call `chatWithAssistant(msg, null, history)`, assert POST body `message === msg` and `conversation_history` deep-equals `history`
    - **Property 4: API call carries full conversation context**
    - **Validates: Requirements 4.1, 7.4**

  - [ ]* 15.5 Property 5 — Successful API response appended as assistant turn
    - `fc.property(fc.string({ minLength: 1 }), answer => { ... })`
    - Mock API to return `{ answer }`, submit a message, assert last message has `role: "assistant"` and `content === answer`
    - **Property 5: Successful API response appended as assistant turn**
    - **Validates: Requirements 4.2**

  - [ ]* 15.6 Property 6 — Non-2xx errors produce inline error messages
    - `fc.property(fc.integer({ min: 400, max: 599 }).filter(s => s !== 504 && s !== 502), status => { ... })`
    - Mock `apiClient.post` to reject with an Axios error of the given status; call `chatWithAssistant`; assert thrown error message is `"Something went wrong. Please try again."`
    - **Property 6: Non-2xx errors produce inline error messages**
    - **Validates: Requirements 5.3**

  - [ ]* 15.7 Property 7 — File context forwarded with every message when active
    - `fc.property(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), (fileCtx, msg) => { ... })`
    - Set `fileContext` in context, submit `msg`, assert POST body `file_context === fileCtx`
    - **Property 7: File context forwarded with every message when active**
    - **Validates: Requirements 9.2, 10.1, 11.1**

  - [ ]* 15.8 Property 8 — No file context → general-purpose mode
    - `fc.property(fc.string({ minLength: 1 }), msg => { ... })`
    - Ensure `fileContext` is null, submit `msg`, assert POST body `file_context` is `undefined` or absent
    - **Property 8: No file context → general-purpose mode**
    - **Validates: Requirements 9.5, 7.1, 7.2**

  - [ ]* 15.9 Property 10 — Quick-action buttons submit exact prompt text
    - `fc.property(fc.string({ minLength: 1 }), fileCtx => { ... })`
    - Set `fileContext` to `fileCtx`, click "Summarize this file", assert submitted message is exactly `"Please summarize this file."`
    - Repeat for "Analyze this file" with its exact prompt string
    - **Property 10: Quick-action buttons submit exact prompt text**
    - **Validates: Requirements 10.4, 11.4**

  - [ ]* 15.10 Property 11 — Explain Results includes serialized AnalysisResult
    - `fc.property(analysisResultArbitrary, result => { ... })`
    - Set `analysisResult` in context, click "Explain these results", assert submitted message contains `result.meaning`, `result.tone`, `String(result.clarity_score)`, and at least one suggestion from `result.suggestions`
    - **Property 11: Explain Results includes serialized AnalysisResult**
    - **Validates: Requirements 12.2, 12.5**

  - [ ]* 15.11 Property 12 — Conversation preserved across route changes
    - `fc.property(fc.array(messageArbitrary, { minLength: 1 }), fc.constantFrom('/', '/upload', '/analyze-excel', '/chat'), (msgs, route) => { ... })`
    - Seed context with `msgs`, navigate to `route` via `MemoryRouter`, assert messages array unchanged
    - **Property 12: Conversation preserved across route changes**
    - **Validates: Requirements 2.3, 6.2**

- [ ] 16. Write property-based tests for the backend
  - Create `backend/tests/test_assistant_properties.py`
  - Use `hypothesis` with `@given` and `@settings(max_examples=100)`
  - Tag each test with `# Feature: ai-assistant, Property N: <property text>`

  - [ ]* 16.1 Property 9 — File context truncated to 12,000 characters
    - `@given(st.text(min_size=12001))`
    - Mock `chat_service.chat` to capture the `file_context` argument; POST to `/api/assistant/chat` with the long text; assert the captured `file_context` argument has length ≤ 12,000
    - **Property 9: File context truncated to 12,000 characters**
    - **Validates: Requirements 9.6**

  - [ ]* 16.2 Property 4 (backend) — API call carries full conversation context
    - `@given(st.text(min_size=1), st.lists(chat_message_strategy(), max_size=10))`
    - Mock `call_anthropic` to capture its `messages` argument; POST without `file_context`; assert the captured messages list ends with `{"role": "user", "content": message}` and the preceding entries match the supplied history
    - **Property 4 (backend): API call carries full conversation context**
    - **Validates: Requirements 4.1, 7.4**

- [x] 17. Enhance `frontend/index.html` with production-ready meta tags and resource hints
  - Replace the placeholder `<title>` with a descriptive title: `Semantic Validator — AI-Powered Document Analysis`
  - Add `<meta name="description">` with a concise app description (≤ 160 chars)
  - Add `<meta name="keywords">` with relevant terms
  - Add `<meta name="author">` tag
  - Add `<meta name="robots" content="index, follow">`
  - Add `<meta name="theme-color" content="#020408">` (matches the app's deep-space background)
  - Add `<meta name="color-scheme" content="dark light">`
  - Add Open Graph tags: `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale`
  - Add Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - Add canonical `<link rel="canonical" href="...">` tag
  - Replace `<link rel="icon" type="image/svg+xml" href="/vite.svg">` with proper multi-size favicon links: `<link rel="icon" sizes="32x32">`, `<link rel="apple-touch-icon" sizes="180x180">`, `<link rel="manifest" href="/site.webmanifest">`
  - Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` for Google Fonts
  - Add `<link rel="dns-prefetch">` for the backend API origin
  - Add `<meta http-equiv="X-UA-Compatible" content="IE=edge">` for legacy browser compatibility
  - Add `<meta name="format-detection" content="telephone=no">` to prevent iOS auto-linking phone numbers
  - Ensure the existing dark-mode flash-prevention inline script is preserved
  - _Requirements: (non-functional polish — no direct requirement reference)_

- [ ] 18. Final checkpoint — all tests pass
  - Run `npm run test` in `frontend/` and `pytest backend/tests/` — ensure all tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 3, 11, 18) ensure incremental validation at meaningful milestones
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The `AIAssistantProvider` must be mounted inside `AuthProvider` (already in `App.tsx`) so `useAuth()` is available to the context
- `chatWithAssistant` reuses the existing `apiClient` from `frontend/src/api/client.ts` — no new HTTP client needed
- The backend `assistant.py` router reuses `chat_service.chat` and `call_anthropic` — no new AI service code required
- `AnalyzeExcelPage` does not produce a standard `AnalysisResult`; task 14 maps the Excel summary to the closest equivalent for the "Explain Results" quick action
