# Implementation Plan: Semantic Validator UI Redesign

## Overview

Layer a modern, futuristic visual identity on top of the existing React + TypeScript + Tailwind CSS application. The plan proceeds in strict dependency order: tokens and global styles first, then primitive UI components, then layout components (Sidebar, Navbar), then page-level wiring (App, Dashboard), then feature component modifications, and finally tests. No backend changes are required.

---

## Tasks

- [x] 1. Install new dependencies
  - Run `npm install framer-motion@^11 @fontsource/inter@^5` inside `frontend/`
  - Verify both packages appear in `frontend/package.json` `dependencies`
  - _Requirements: 1.1, 3.2, 9.1_
  - _Design: Architecture → Dependency additions_

- [x] 2. Create design tokens file
  - Create `frontend/src/styles/tokens.ts`
  - Export `colors` object with all gradient stops, neon accents, chart palette, glass surface values, and text colours exactly as specified
  - Export `spacing` object with the 8 px-grid values (all multiples of 4 px)
  - Export `typography` object with font family, size scale, and weight scale
  - Export `sectionVariants`, `crossFadeVariants`, and `neonButtonVariants` Framer Motion variant objects
  - _Requirements: 7.4, 8.1, 8.2, 8.3_
  - _Design: Data Models → Design tokens_

  - [ ]* 2.1 Write property test for spacing tokens (Property 6)
    - **Property 6: Spacing tokens are multiples of 4 px**
    - **Validates: Requirements 8.3**
    - File: `frontend/src/__tests__/properties/spacingTokens.property.test.ts`
    - Use `fc.constantFrom(...Object.values(spacing))` to assert each value's numeric pixel amount is divisible by 4

- [x] 3. Add CSS keyframes and global styles to `index.css`
  - Add `@import '@fontsource/inter'` at the top of `frontend/src/index.css`
  - Add `gradientShift` keyframe and `.animated-bg` class with `prefers-reduced-motion` override
  - Add `ripple` keyframe and `.ripple` utility class
  - Add `shimmer` keyframe and `.skeleton` utility class
  - Add `@supports not (backdrop-filter: blur(1px))` fallback rule for `.glass-card` (solid `bg-slate-900/80` background)
  - _Requirements: 1.1, 1.2, 1.4, 3.3, 5.3_
  - _Design: Data Models → Animation specifications_

- [x] 4. Extend `tailwind.config.js` with design tokens
  - Import token values from `frontend/src/styles/tokens.ts` (or duplicate the values inline)
  - Extend `theme.colors` with `neon.*` and `glass.*` entries
  - Extend `theme.fontFamily` with `inter` pointing to the Inter stack
  - Extend `theme.animation` and `theme.keyframes` to expose `gradientShift`, `shimmer`, and `ripple` as Tailwind utilities
  - _Requirements: 8.1, 8.3_
  - _Design: Data Models → Design tokens_

- [x] 5. Create `AnimatedBackground` component
  - Create `frontend/src/components/ui/AnimatedBackground.tsx`
  - Render a `div` with `position: fixed; inset: 0; z-index: 0` and the `.animated-bg` CSS class
  - Accept optional `duration` prop (default 12 000 ms); apply as a CSS custom property `--bg-duration` consumed by the keyframe
  - Read `prefers-reduced-motion` via `window.matchMedia` on mount; if active, add a class that disables the animation (static gradient fallback)
  - Render `children` inside a relative `div` at `z-index: 10`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Design: Components → AnimatedBackground_

- [x] 6. Create `GlassCard` component
  - Create `frontend/src/components/ui/GlassCard.tsx`
  - Apply Tailwind classes: `backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl`
  - Track `mousemove` via `useRef` + event listener; compute cursor position relative to `getBoundingClientRect()`; apply a `radial-gradient` inline style as a spotlight overlay
  - On `mouseleave`, transition overlay opacity to 0 over 300 ms via CSS transition
  - Accept `disableSpotlight` prop to skip the mouse-tracking logic (for nested cards)
  - Accept `as` prop (default `"div"`) for semantic flexibility
  - Read `prefers-reduced-transparency` via `useMediaQuery`; if active, switch to `backdrop-blur-sm` and slightly higher background opacity
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.4_
  - _Design: Components → GlassCard_

  - [ ]* 6.1 Write property test for spotlight gradient tracking (Property 1)
    - **Property 1: Spotlight gradient tracks cursor position**
    - **Validates: Requirements 2.4**
    - File: `frontend/src/__tests__/properties/spotlight.property.test.ts`
    - Use `fc.record({ x: fc.integer({ min: 0, max: 800 }), y: fc.integer({ min: 0, max: 600 }) })` to fire synthetic `mousemove` events and assert the overlay's `background` style is centred within ±2 px

- [x] 7. Create `RippleEffect` component (internal to NeonButton)
  - Create `frontend/src/components/ui/RippleEffect.tsx`
  - Maintain a list of active ripples in state; each ripple has `{ id, x, y, size }`
  - Export a `useRipple` hook that returns `{ ripples, addRipple }` — `addRipple` accepts a `MouseEvent` and computes coordinates relative to the button's `getBoundingClientRect()`
  - Render each ripple as a `span` with the `.ripple` CSS class, positioned absolutely at `(x - size/2, y - size/2)`
  - After 600 ms, remove the ripple from state via `setTimeout`
  - _Requirements: 3.3, 3.4_
  - _Design: Components → RippleEffect_

  - [ ]* 7.1 Write property test for ripple origin (Property 3)
    - **Property 3: Ripple origin matches click coordinates**
    - **Validates: Requirements 3.3**
    - File: `frontend/src/__tests__/properties/ripple.property.test.ts`
    - Use `fc.record({ x: fc.float({ min: 0, max: 300 }), y: fc.float({ min: 0, max: 80 }) })` to assert ripple `left`/`top` places its centre within ±2 px of the click point

- [x] 8. Create `Tooltip` component
  - Create `frontend/src/components/ui/Tooltip.tsx`
  - Accept `label`, `showDelay` (default 300 ms), and `hideDelay` (default 150 ms) props
  - Use `useRef` on the trigger element to measure `getBoundingClientRect()`; position above by default, below if `triggerRect.top < tooltipHeight + 8`
  - Detect touch devices via `navigator.maxTouchPoints > 0`; return `children` unwrapped when on touch
  - Animate with Framer Motion `AnimatePresence` + `motion.div` (fade in/out)
  - If `getBoundingClientRect()` returns a zero-size rect, default to `position: absolute; top: -100%`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - _Design: Components → Tooltip_

  - [ ]* 8.1 Write property test for tooltip repositioning (Property 4)
    - **Property 4: Tooltip repositions based on available space**
    - **Validates: Requirements 4.7**
    - File: `frontend/src/__tests__/properties/tooltip.property.test.ts`
    - Use `fc.integer({ min: 0, max: 1080 })` for the button's `y` offset; assert tooltip is below when `y < tooltipHeight + 8`, above otherwise

- [x] 9. Create `NeonButton` component
  - Create `frontend/src/components/ui/NeonButton.tsx`
  - Accept `variant` (`"primary" | "secondary" | "danger" | "success"`), `isLoading`, `loadingLabel`, `tooltip`, `icon`, and all standard `ButtonHTMLAttributes` props
  - Apply Framer Motion `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.98 }}` with `transition={{ duration: 0.1 }}`; suppress when `disabled` or `isLoading`
  - Apply `boxShadow` glow on hover via Framer Motion `variants` using the four variant glow colours from the design
  - Render `RippleEffect` (via `useRipple`) on `onClick`
  - Wrap with `Tooltip` when `tooltip` prop is provided
  - Show spinner + `loadingLabel` (or "Loading…") when `isLoading={true}`; set `disabled` and `aria-busy="true"`
  - Ensure minimum height of 44 px via Tailwind `min-h-[44px]`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.3_
  - _Design: Components → NeonButton_

  - [ ]* 9.1 Write property test for NeonButton hover scale (Property 2)
    - **Property 2: NeonButton hover scale is within specification**
    - **Validates: Requirements 3.2**
    - File: `frontend/src/__tests__/properties/neonButton.property.test.ts`
    - Use `fc.constantFrom("primary", "secondary", "danger", "success")` to assert scale is between 1.02 and 1.08 and transition duration ≤ 150 ms

  - [ ]* 9.2 Write property test for NeonButton touch targets (Property 9)
    - **Property 9: NeonButton touch targets are at least 44 px tall on mobile**
    - **Validates: Requirements 10.3**
    - File: `frontend/src/__tests__/properties/touchTarget.property.test.ts`
    - Use `fc.constantFrom("primary", "secondary", "danger", "success")` and mock viewport width < 768 px; assert computed height ≥ 44 px

- [x] 10. Create `SkeletonLoader` component
  - Create `frontend/src/components/ui/SkeletonLoader.tsx`
  - Accept `rows` (default 4), `rowHeight` (default 20 px), and `className` props
  - Render `rows` number of `div` elements with the `.skeleton` CSS class and the specified `rowHeight`
  - Add `aria-busy="true"` and `role="status"` with a visually-hidden "Loading…" label for screen readers
  - _Requirements: 5.2, 5.3_
  - _Design: Components → SkeletonLoader_

- [x] 11. Create `ParticleField` component (optional feature)
  - Create `frontend/src/components/ui/ParticleField.tsx`
  - Render a `<canvas>` with `position: fixed; inset: 0; pointer-events: none; z-index: 1`
  - On mount, initialise `count` particles (default 40), each with random size (2–6 px), opacity (0.10–0.40), and drift velocity
  - Animate via `requestAnimationFrame`; wrap particles at viewport edges
  - Check `prefers-reduced-motion` and `disabled` prop; return `null` if either is true
  - Check `canvas.getContext("2d")` support; return `null` if unavailable
  - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - _Design: Components → ParticleField_

  - [ ]* 11.1 Write property test for particle count and dimensions (Property 10)
    - **Property 10: Particle count and dimensions are within specification**
    - **Validates: Requirements 11.1, 11.2**
    - File: `frontend/src/__tests__/properties/particles.property.test.ts`
    - Use `fc.integer({ min: 20, max: 60 })` for `count`; assert active particle count equals `count`, each diameter is 2–6 px, each opacity is 0.10–0.40

- [x] 12. Create `SoundProvider` and `SoundContext` (optional feature)
  - Create `frontend/src/context/SoundContext.tsx`
  - Implement `SoundContextValue` interface: `{ isMuted, toggleMute, playClick, playSuccess }`
  - Load two short audio buffers via the Web Audio API; wrap `AudioContext` creation in try/catch (silent no-op if unavailable)
  - Persist `isMuted` to `localStorage` under key `"sound-muted"`; default volume 0.25
  - `playClick` plays a ≤100 ms tone; `playSuccess` plays a ≤500 ms chime; both are no-ops when muted
  - Export `useSoundContext` hook with a guard that throws if used outside `SoundProvider`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - _Design: Components → SoundManager / SoundProvider_

- [x] 13. Create new `Sidebar` component
  - Create `frontend/src/components/Sidebar.tsx`
  - Render the left sidebar with: logo area ("Semantic Validator" + icon), nav items (Dashboard, Upload File, Analyze Excel, Chat with AI, History, Settings), and an AI Assistant card at the bottom
  - Apply glassmorphism styling using `GlassCard` for the sidebar container
  - Use `useLocation` from `react-router-dom` to highlight the active nav item
  - All nav touch targets must be ≥ 44 px height
  - On mobile (< 768 px), the sidebar is hidden by default and toggled via the hamburger button in `Navbar`; accept an `isOpen` prop and animate open/close with Framer Motion `AnimatePresence`
  - _Requirements: 6.1, 10.1, 10.5_
  - _Design: Architecture → High-level component tree_

- [x] 14. Modify `Navbar.tsx` — glassmorphism header with hamburger and controls
  - Replace the current `bg-slate-900` background with glassmorphism styling (`backdrop-blur-md bg-white/10 dark:bg-white/5 border-b border-white/20`)
  - Add a hamburger button (`☰`) visible only on `< 768 px` viewports; clicking it toggles `isSidebarOpen` state passed down to `Sidebar`
  - Move the brand logo/name to the `Sidebar` component; the Navbar now shows only: hamburger (mobile), theme toggle, notifications bell icon, and user profile avatar
  - Style `ThemeToggle` as `NeonButton variant="secondary"`
  - Add optional mute toggle button (renders only when `SoundProvider` is present) using `useSoundContext`
  - Apply `position: sticky; top: 0; z-index: 100`
  - All touch targets ≥ 44 px
  - _Requirements: 10.5, 12.3_
  - _Design: Components → Modified existing components (Navbar)_

- [x] 15. Modify `App.tsx` — wire `AnimatedBackground`, `SoundProvider`, and `Sidebar`
  - Import and wrap the entire tree with `AnimatedBackground` as the outermost visual layer
  - Import and wrap with `SoundProvider` (optional; place inside `ThemeProvider`, outside `ErrorBoundary`)
  - Remove `bg-slate-50 dark:bg-zinc-900` from the root `div` (background now comes from `AnimatedBackground`)
  - Add `ParticleField` inside `AnimatedBackground`, passing `disabled={viewportWidth < 768}` computed via a `useWindowSize` hook
  - Add `Sidebar` alongside `Navbar` in the layout; manage `isSidebarOpen` state in `App` and pass it to both `Navbar` (for the hamburger toggle) and `Sidebar`
  - Ensure the content layer sits at `z-index: 10` relative to the background layers
  - _Requirements: 1.1, 1.3, 10.2, 11.3_
  - _Design: Architecture → High-level component tree, Layer z-index budget_

- [x] 16. Modify `Dashboard.tsx` — Framer Motion sections and GlassCard wrappers
  - Import `motion` and `useInView` from `framer-motion`
  - Wrap each major section (`FileUploader`, `AnalysisForm`/`ResultsPanel`, `BeforeAfterPanel`, `ExcelDashboard`, `FileChat`) in a `GlassCard`
  - Wrap each `GlassCard` in a `motion.div` using `sectionVariants` from `tokens.ts`; trigger `"visible"` when the section enters the viewport via `useInView`
  - Replace the plain `div` wrappers around sections with the animated `motion.div` + `GlassCard` pattern
  - Update the welcome header to "Welcome back, Admin 👋" and the subtitle to match the reference UI
  - Ensure the two-column grid (`md:grid-cols-2`) is preserved for the `AnalysisForm` / `ResultsPanel` pair
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.4_
  - _Design: Components → Modified existing components (Dashboard)_

- [x] 17. Modify `AnalysisForm.tsx` — NeonButton and glass inputs
  - Replace the submit `<button>` with `<NeonButton variant="primary" tooltip="Analyze file content for meaning, tone & clarity" isLoading={isLoading} loadingLabel="Analyzing…">`
  - Replace the `<input>` and `<textarea>` Tailwind classes with glass-styled variants: `bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-sm text-slate-100 placeholder-slate-400 focus:ring-neon-blue`
  - Remove the outer `bg-white dark:bg-zinc-800 rounded-xl shadow-sm border` wrapper (now provided by `GlassCard` in `Dashboard`)
  - _Requirements: 3.1, 3.2, 3.5, 4.1_
  - _Design: Components → Modified existing components (AnalysisForm)_

- [x] 18. Modify `FileUploader.tsx` — NeonButton actions and upload progress bar
  - Replace all action `<button>` elements in the success state with `NeonButton`:
    - "Populate Form" → `variant="secondary"` with `tooltip="Fill the analysis form with extracted text"`
    - "Analyze" → `variant="primary"` with `tooltip="Analyze file content for meaning, tone & clarity"`
    - "Remove Duplicates" → `variant="secondary"` with `tooltip="Detect and remove duplicate entries"`
    - "Analyze Excel" → `variant="success"` with `tooltip="Generate statistical summary of Excel data"`
    - "Chat with File" → `variant="secondary"` with `tooltip="Start an AI conversation about this file"`
  - Replace the uploading spinner state with an animated progress bar (`<div>` with a CSS width transition from 0% to 100% over the upload duration, styled with `bg-neon-blue`)
  - Update the drag-and-drop zone border and background to use glass token colours
  - Remove the outer card wrapper (now provided by `GlassCard` in `Dashboard`)
  - _Requirements: 3.1, 3.2, 3.5, 4.2, 4.3, 4.4, 4.5, 5.4_
  - _Design: Components → Modified existing components (FileUploader)_

- [x] 19. Modify `ResultsPanel.tsx` — AnimatePresence cross-fade between states
  - Import `AnimatePresence` and `motion` from `framer-motion`
  - Wrap the four conditional state blocks (`idle`, `loading`, `error`, `success`) in `AnimatePresence mode="wait"`
  - Wrap each state's root element in a `motion.div` using `crossFadeVariants` from `tokens.ts` with a unique `key` per state
  - Remove the outer `bg-white dark:bg-zinc-800 rounded-xl shadow-sm border` wrapper (now provided by `GlassCard` in `Dashboard`)
  - _Requirements: 9.3, 9.4_
  - _Design: Components → Modified existing components (ResultsPanel), Data Models → crossFadeVariants_

- [x] 20. Modify `ExcelDashboard.tsx` — SkeletonLoader, chart animations, and palette update
  - Replace the loading spinner block with `<SkeletonLoader rows={6} />` wrapped in a `GlassCard`
  - In `ChartsTab`, update `CHART_COLORS` to use `colors.chartPalette` from `tokens.ts` (replacing the current mixed palette)
  - Add a `useInView` ref to the charts container; pass `isAnimationActive={inView}` and `animationDuration={800}` to each Recharts chart component
  - Remove the outer `bg-white dark:bg-zinc-800 rounded-xl shadow-sm border` wrapper from the main `ExcelDashboard` return (now provided by `GlassCard` in `Dashboard`)
  - Update `StatCard` to use glass token colours instead of `bg-slate-50 dark:bg-zinc-700`
  - _Requirements: 5.2, 5.3, 7.1, 7.2, 7.4_
  - _Design: Components → Modified existing components (ExcelDashboard)_

  - [ ]* 20.1 Write property test for chart colour palette (Property 5)
    - **Property 5: Chart colours are from the approved palette**
    - **Validates: Requirements 7.4**
    - File: `frontend/src/__tests__/properties/chartColors.property.test.ts`
    - Use `fc.array(fc.record({ name: fc.string(), value: fc.integer({ min: 0, max: 100 }) }))` to render `ChartsTab` with arbitrary data and assert every `fill` / `stroke` colour is a member of `colors.chartPalette`

- [x] 21. Modify `BeforeAfterPanel.tsx` — GlassCard wrapping and NeonButton
  - Remove the outer `bg-white dark:bg-zinc-800 rounded-xl shadow-sm border` wrapper (now provided by `GlassCard` in `Dashboard`)
  - Replace the "Use Cleaned Text" `<button>` with `<NeonButton variant="primary">`
  - Replace the "Download Cleaned File" `<button>` with `<NeonButton variant="success">`
  - Wrap the component's entry in a Framer Motion `motion.div` using `sectionVariants` so it animates in when `deduplicationResult` becomes non-null
  - _Requirements: 3.1, 3.5, 9.1_
  - _Design: Components → Modified existing components (BeforeAfterPanel)_

- [x] 22. Modify `FileChat.tsx` — GlassCard wrapping and NeonButton send button
  - Remove the outer `bg-white dark:bg-zinc-800 rounded-xl shadow-sm border` wrapper (now provided by `GlassCard` in `Dashboard`)
  - Replace the send `<button>` with `<NeonButton variant="primary" aria-label="Send message">`
  - Apply glass-styled classes to the `<textarea>` input (matching the pattern used in `AnalysisForm`)
  - Apply glass-styled classes to the header bar (replacing `bg-slate-50 dark:bg-zinc-800/80`)
  - _Requirements: 3.1, 3.5_
  - _Design: Components → Modified existing components (FileChat)_

- [x] 23. Checkpoint — verify build and visual integration
  - Run `npm run build` inside `frontend/` and confirm zero TypeScript errors
  - Ensure all components import correctly and no circular dependencies exist
  - Confirm `AnimatedBackground`, `GlassCard`, `NeonButton`, `SkeletonLoader`, `Sidebar`, and `Tooltip` are all reachable from `App.tsx`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Write unit tests for new UI primitive components
  - [x] 24.1 Write unit tests for `AnimatedBackground`
    - Assert it renders with `position: fixed` and the `.animated-bg` class
    - Mock `window.matchMedia` to return `prefers-reduced-motion: reduce`; assert animation class is absent
    - _Requirements: 1.1, 1.4_

  - [ ]* 24.2 Write unit tests for `GlassCard`
    - Assert it renders with `backdrop-blur-md` class by default
    - Mock `prefers-reduced-transparency`; assert it switches to `backdrop-blur-sm`
    - Assert `disableSpotlight` prop prevents mouse-tracking listener attachment
    - _Requirements: 2.1, 10.4_

  - [ ]* 24.3 Write unit tests for `NeonButton`
    - Assert spinner is rendered and button is `disabled` when `isLoading={true}`
    - Assert hover variants are not applied when `disabled={true}`
    - Assert `aria-busy="true"` is set when `isLoading={true}`
    - _Requirements: 3.6, 5.1_

  - [ ]* 24.4 Write unit tests for `Tooltip`
    - Assert correct label text is rendered for each action button tooltip string
    - Assert tooltip is not rendered when `navigator.maxTouchPoints > 0` is mocked
    - _Requirements: 4.1–4.8_

  - [ ]* 24.5 Write unit tests for `SkeletonLoader`
    - Assert it renders exactly `rows` skeleton elements
    - Assert `role="status"` and `aria-busy="true"` are present
    - _Requirements: 5.2, 5.3_

  - [ ]* 24.6 Write unit tests for `RippleEffect`
    - Assert ripple element is removed from the DOM after 600 ms using `vi.useFakeTimers()`
    - _Requirements: 3.4_

- [x] 25. Write unit tests for modified components
  - [x] 25.1 Write unit tests for `Navbar`
    - Assert hamburger button is rendered at a mocked viewport width of 375 px
    - Assert nav links are hidden at 375 px viewport
    - _Requirements: 10.5_

  - [ ]* 25.2 Write unit tests for `ResultsPanel`
    - Assert `AnimatePresence` wraps the state blocks (check for `motion.div` with correct `key` values)
    - Assert cross-fade variant `duration` values are 0.2 s for both enter and exit
    - _Requirements: 9.3_

  - [ ]* 25.3 Write unit tests for `ExcelDashboard`
    - Assert `SkeletonLoader` is rendered when `state.status === "loading"`
    - Assert chart colours in `ChartsTab` match `colors.chartPalette` entries
    - _Requirements: 5.2, 7.4_

  - [ ]* 25.4 Write unit tests for section animation variants
    - Assert `sectionVariants.visible.transition.duration === 0.3`
    - Assert `sectionVariants.exit.transition.duration === 0.2`
    - _Requirements: 9.1, 9.2_

- [x] 26. Write property-based tests for WCAG contrast (Properties 7 & 8)
  - [ ]* 26.1 Write property test for body text contrast (Property 7)
    - **Property 7: Body text colour pairs meet WCAG AA contrast (4.5:1)**
    - **Validates: Requirements 8.4**
    - File: `frontend/src/__tests__/properties/contrast.property.test.ts`
    - Use `fc.constantFrom(...bodyColorPairs)` where pairs are `(textPrimary, glassBgDark)` etc.; implement WCAG relative luminance formula; assert ratio ≥ 4.5

  - [ ]* 26.2 Write property test for large text contrast (Property 8)
    - **Property 8: Large text colour pairs meet WCAG AA contrast (3:1)**
    - **Validates: Requirements 8.5**
    - Same file as 26.1; use large-text colour pairs; assert ratio ≥ 3.0

- [ ] 27. Final checkpoint — full test suite
  - Run `npm test` inside `frontend/` (executes `vitest --run`)
  - Confirm all non-optional unit tests pass
  - Confirm all property-based tests pass with ≥ 100 iterations each
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Tasks 11 (`ParticleField`) and 12 (`SoundProvider`) implement optional features (Requirements 11 and 12); they can be deferred without blocking any other task
- Checkpoints at tasks 23 and 27 ensure incremental validation
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- All component wrappers (`bg-white dark:bg-zinc-800 rounded-xl shadow-sm border`) are removed from individual components in tasks 17–22 because `GlassCard` in `Dashboard` (task 16) now provides the card container — do not remove them before task 16 is complete
