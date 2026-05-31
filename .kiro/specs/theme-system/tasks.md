# Implementation Plan: Theme System

## Overview

Implement a light/dark theme system using Tailwind CSS `darkMode: 'class'`, a React `ThemeContext`, flash-prevention inline script, and dark mode variants across all 11 components. Theme preference is persisted in `localStorage` and initialized before first paint.

## Tasks

- [x] 1. Configure Tailwind for dark mode
  - Add `darkMode: 'class'` to `frontend/tailwind.config.js`
  - _Requirements: 1.4, 1.5, 3.1_

- [x] 2. Add flash-prevention inline script to index.html
  - Insert IIFE `<script>` inside `<head>` before stylesheets in `frontend/index.html`
  - Script reads `localStorage.getItem('theme')`, falls back to `prefers-color-scheme`, falls back to light
  - Wrap in `try/catch` to handle blocked `localStorage`
  - _Requirements: 1.1, 1.2, 1.3, 5.3_

- [ ] 3. Create ThemeContext and ThemeProvider
  - Create `frontend/src/context/ThemeContext.tsx`
  - [x] 3.1 Implement `resolveInitialTheme()` helper
    - Priority order: `localStorage` → `prefers-color-scheme` → `'light'`
    - Wrap `localStorage` access in `try/catch`
    - Use optional chaining for `window.matchMedia?.(...)`
    - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.3_
  - [x] 3.2 Implement `applyTheme(theme)` helper
    - Toggle `dark` class on `document.documentElement`
    - Persist to `localStorage` with `try/catch`
    - _Requirements: 1.4, 1.5, 2.3, 2.4, 5.1_
  - [x] 3.3 Implement `ThemeProvider` component
    - Initialize state synchronously using `resolveInitialTheme()`
    - Call `applyTheme` on every theme change
    - Expose `{ theme, toggleTheme }` via `ThemeContext`
    - _Requirements: 6.1, 6.4_
  - [x] 3.4 Implement `useTheme` hook
    - Consume `ThemeContext`; throw descriptive error if called outside provider
    - _Requirements: 6.2, 6.3_
  - [ ]* 3.5 Write unit tests for `resolveInitialTheme`
    - Test: stored `"dark"` → returns `"dark"`
    - Test: stored `"light"` → returns `"light"`
    - Test: no stored value + OS dark → returns `"dark"`
    - Test: no stored value + OS light → returns `"light"`
    - Test: no stored value + no OS preference → returns `"light"`
    - Test: invalid stored value → falls through to OS preference
    - Test: `localStorage` blocked → does not throw
    - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.3_
  - [ ]* 3.6 Write unit tests for `ThemeProvider` and `useTheme`
    - Test: `ThemeProvider` renders children and provides context
    - Test: `useTheme()` outside `ThemeProvider` throws descriptive error
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 3.7 Write property test for HTML class invariant
    - **Property 1: HTML class invariant**
    - **Validates: Requirements 1.4, 1.5, 2.4**
  - [ ]* 3.8 Write property test for toggle inverse
    - **Property 2: Toggle is its own inverse**
    - **Validates: Requirements 2.2**
  - [ ]* 3.9 Write property test for persistence round-trip
    - **Property 3: Persistence round-trip**
    - **Validates: Requirements 2.3, 5.1**
  - [ ]* 3.10 Write property test for initialization reads stored preference
    - **Property 4: Initialization reads stored preference**
    - **Validates: Requirements 1.1, 5.2**

- [x] 4. Create ThemeToggle component
  - Create `frontend/src/components/ThemeToggle.tsx`
  - Use `useTheme()` — no props needed
  - Render moon icon when `theme === 'light'`, sun icon when `theme === 'dark'`
  - Include `aria-label` describing the action to be performed (e.g., "Switch to dark mode")
  - _Requirements: 2.1, 2.2, 2.5_
  - [ ]* 4.1 Write property test for toggle icon matches theme
    - **Property 5: Toggle icon matches theme**
    - **Validates: Requirements 2.1**
  - [ ]* 4.2 Write property test for aria-label describes the action
    - **Property 6: aria-label describes the action**
    - **Validates: Requirements 2.5**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Wire ThemeProvider into App.tsx and update Navbar
  - [x] 6.1 Update `frontend/src/App.tsx`
    - Wrap root with `<ThemeProvider>`
    - Add `dark:bg-zinc-900` to the root div alongside existing `bg-slate-50`
    - _Requirements: 3.1, 4.1_
  - [x] 6.2 Update `frontend/src/components/Navbar.tsx`
    - Add `dark:bg-zinc-950` to the nav element
    - Render `<ThemeToggle />` in the nav links area
    - _Requirements: 2.1, 3.7, 4.1_

- [x] 7. Apply dark mode variants to Dashboard and AnalysisForm
  - [x] 7.1 Update `frontend/src/pages/Dashboard.tsx`
    - Add `dark:text-slate-100` to page heading, `dark:text-slate-400` to subtext
    - Add `dark:bg-zinc-800 dark:border-zinc-700` to card wrappers
    - Add dark variants to warning banners
    - _Requirements: 3.1–3.7, 4.1, 4.2_
  - [x] 7.2 Update `frontend/src/components/AnalysisForm.tsx`
    - Add `dark:bg-zinc-800 dark:border-zinc-700` to card
    - Add `dark:text-slate-100` to heading, `dark:text-slate-300` to labels
    - Add `dark:bg-zinc-800 dark:border-zinc-600 dark:text-slate-100 dark:placeholder-zinc-500` to inputs and textarea
    - _Requirements: 3.1–3.5, 4.1, 4.3_

- [x] 8. Apply dark mode variants to ResultsPanel and FileUploader
  - [x] 8.1 Update `frontend/src/components/ResultsPanel.tsx`
    - Add dark variants to card, icon bg, text, progress bar track, and error banner
    - _Requirements: 3.1–3.6, 4.1, 4.4_
  - [x] 8.2 Update `frontend/src/components/FileUploader.tsx`
    - Add dark variants to drop zone, uploading state, preview area, deduplicate button, and error banner
    - _Requirements: 3.1–3.6, 4.1, 4.3, 4.4_

- [x] 9. Apply dark mode variants to BeforeAfterPanel and SuggestionItem
  - [x] 9.1 Update `frontend/src/components/BeforeAfterPanel.tsx`
    - Add dark variants to card, no-dup badge, original header, pre block, count text, and error banner
    - _Requirements: 3.1–3.6, 4.1, 4.2_
  - [x] 9.2 Update `frontend/src/components/SuggestionItem.tsx`
    - Add `dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-blue-900/20 dark:hover:border-blue-700` to item container
    - Add `dark:text-zinc-500` to icon, `dark:text-slate-300` to text
    - _Requirements: 3.1–3.5, 4.1, 4.2_

- [ ] 10. Apply dark mode variants to ExcelDashboard, CharCounter, and ErrorBoundary
  - [x] 10.1 Update `frontend/src/components/ExcelDashboard.tsx`
    - Add dark variants to card, tabs (active/inactive), StatCard, table (thead, tbody, rows, cells), filter input, pagination buttons, AI summary section, and error banner
    - _Requirements: 3.1–3.7, 4.1, 4.3, 4.4_
  - [x] 10.2 Update `frontend/src/components/CharCounter.tsx`
    - Change `text-slate-400` to `text-slate-400 dark:text-zinc-500`
    - _Requirements: 3.5, 4.1_
  - [x] 10.3 Update `frontend/src/components/ErrorBoundary.tsx`
    - Add `dark:bg-zinc-900` to full-screen wrapper
    - Add `dark:bg-zinc-800 dark:border-red-900/50` to card, `dark:text-slate-100` to heading, `dark:text-slate-400` to error message
    - _Requirements: 3.1–3.4, 4.1_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` with a minimum of 100 iterations each
- Each property test references the design property number and the requirements it validates
- The inline script in `index.html` and `ThemeProvider` use identical priority logic to avoid any flash
- `FieldError.tsx` requires no changes — `red-500` has sufficient contrast on both themes
