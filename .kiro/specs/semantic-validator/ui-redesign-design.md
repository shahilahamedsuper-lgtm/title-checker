# Design Document: Semantic Validator UI Redesign

## Overview

This document describes the technical design for the Semantic Validator UI redesign. The goal is to layer a modern, futuristic visual identity on top of the existing React + TypeScript + Tailwind CSS application without altering any backend API contracts or core business logic.

The redesign introduces:
- A full-viewport animated gradient background (`AnimatedBackground`)
- Glassmorphism card containers (`GlassCard`) with mouse-follow spotlight effects
- Neon-glow buttons (`NeonButton`) with ripple click feedback
- Hover tooltips (`Tooltip`) on all action buttons
- Skeleton loaders and enhanced loading states
- Framer Motion–driven section transitions and scroll-triggered animations
- Animated Recharts charts with a unified blue/cyan/purple palette
- Floating particles layer (optional, `ParticleField`)
- Micro-interaction sound effects (optional, `SoundManager`)
- Responsive layout from 320 px to 2560 px with hamburger Navbar on mobile

All existing components are preserved and wrapped or modified in-place. No API layer changes are required.

---

## Architecture

### Dependency additions

| Package | Version | Purpose |
|---|---|---|
| `framer-motion` | `^11.x` | Declarative animation orchestration |
| `@fontsource/inter` | `^5.x` | Self-hosted Inter font (avoids Google Fonts network request) |

`fast-check` is already present in `devDependencies` and will be used for property-based tests.

### High-level component tree (after redesign)

```
App
└── ThemeProvider
    └── SoundProvider          (new — optional sound context)
        └── ErrorBoundary
            └── BrowserRouter
                └── AnimatedBackground   (new — fixed layer, z-index 0)
                    └── ParticleField    (new — optional, z-index 1)
                    └── div.relative.z-10  (content layer)
                        ├── Navbar       (modified — hamburger, optional mute toggle)
                        └── Routes
                            └── Dashboard  (modified — Framer Motion sections)
                                ├── GlassCard > FileUploader   (modified)
                                ├── GlassCard > AnalysisForm + ResultsPanel
                                ├── GlassCard > BeforeAfterPanel
                                ├── GlassCard > ExcelDashboard (modified)
                                └── GlassCard > FileChat
```

### Layer z-index budget

| Layer | z-index | Description |
|---|---|---|
| AnimatedBackground | 0 | Fixed gradient behind everything |
| ParticleField | 1 | Canvas particle layer, pointer-events: none |
| Content | 10 | All interactive UI |
| Tooltip | 50 | Floating tooltip labels |
| Navbar | 100 | Sticky top bar |

---

## Components and Interfaces

### New components

#### `AnimatedBackground`

```tsx
// frontend/src/components/ui/AnimatedBackground.tsx
interface AnimatedBackgroundProps {
  /** Override animation duration in ms (default: 12000) */
  duration?: number;
  children?: React.ReactNode;
}
```

Renders a `div` with `position: fixed; inset: 0; z-index: 0` containing a CSS keyframe animation that cycles through the three gradient stops. Reads `prefers-reduced-motion` via `window.matchMedia` and disables the animation when active, falling back to a static gradient.

#### `GlassCard`

```tsx
// frontend/src/components/ui/GlassCard.tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Disable spotlight effect (e.g. for nested cards) */
  disableSpotlight?: boolean;
  as?: React.ElementType;  // default: "div"
}
```

Tracks `mousemove` events via a `useRef` + event listener to compute cursor position relative to the card bounds. Applies a `radial-gradient` as an inline `background` overlay that follows the cursor. On `mouseleave`, transitions the overlay opacity to 0 over 300 ms using a CSS transition.

Applies Tailwind classes:
- `backdrop-blur-md` (12 px blur)
- `bg-white/10 dark:bg-white/5` (semi-transparent background)
- `border border-white/20 dark:border-white/10` (luminous border)
- `rounded-2xl`

On devices where `prefers-reduced-transparency` is active, falls back to `backdrop-blur-sm` (8 px).

#### `NeonButton`

```tsx
// frontend/src/components/ui/NeonButton.tsx
type NeonVariant = "primary" | "secondary" | "danger" | "success";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeonVariant;
  isLoading?: boolean;
  loadingLabel?: string;
  tooltip?: string;
  icon?: React.ReactNode;
}
```

Wraps a `<button>` with:
- Framer Motion `whileHover={{ scale: 1.05 }}` and `transition={{ duration: 0.1 }}` (≤ 150 ms)
- `boxShadow` variant map for each `NeonVariant` applied on hover via Framer Motion `variants`
- `RippleEffect` child rendered on `onClick`
- Integrated `Tooltip` rendered above (or below if near viewport top)
- When `disabled` or `isLoading`, hover variants are suppressed via `whileHover={undefined}`

Variant glow colours:

| Variant | Glow colour |
|---|---|
| primary | `rgba(59, 130, 246, 0.6)` (blue-500) |
| secondary | `rgba(148, 163, 184, 0.4)` (slate-400) |
| danger | `rgba(239, 68, 68, 0.5)` (red-500) |
| success | `rgba(16, 185, 129, 0.5)` (emerald-500) |

#### `RippleEffect`

```tsx
// frontend/src/components/ui/RippleEffect.tsx
interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

// Internal — rendered inside NeonButton, not exported directly
```

Maintains a list of active ripples in state. On each click, appends a new ripple with coordinates relative to the button bounds. Each ripple is a `span` with a CSS keyframe animation (`scale(0) → scale(4)`, `opacity(0.4) → opacity(0)`) over 600 ms. After 600 ms a `setTimeout` removes the ripple from state.

#### `Tooltip`

```tsx
// frontend/src/components/ui/Tooltip.tsx
interface TooltipProps {
  label: string;
  children: React.ReactElement;
  /** Delay before showing in ms (default: 300) */
  showDelay?: number;
  /** Delay before hiding in ms (default: 150) */
  hideDelay?: number;
}
```

Uses a `useRef` on the trigger element to measure its `getBoundingClientRect()`. Positions the tooltip above by default; if `triggerRect.top < tooltipHeight + 8`, positions below. Detects touch devices via `navigator.maxTouchPoints > 0` and skips rendering entirely on touch. Uses Framer Motion `AnimatePresence` + `motion.div` for fade-in/out.

#### `SkeletonLoader`

```tsx
// frontend/src/components/ui/SkeletonLoader.tsx
interface SkeletonLoaderProps {
  /** Number of skeleton rows (default: 4) */
  rows?: number;
  /** Height of each row in px (default: 20) */
  rowHeight?: number;
  className?: string;
}
```

Renders `rows` number of `div` elements with a shimmer CSS animation (`background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`) cycling left-to-right in 1.5 s.

#### `ParticleField` (optional)

```tsx
// frontend/src/components/ui/ParticleField.tsx
interface ParticleFieldProps {
  /** Number of particles (default: 40) */
  count?: number;
  /** Disable entirely (e.g. on mobile) */
  disabled?: boolean;
}
```

Renders a `<canvas>` element with `position: fixed; inset: 0; pointer-events: none; z-index: 1`. Uses `requestAnimationFrame` to animate 20–60 particles. Each particle has:
- Size: random 2–6 px
- Opacity: random 10–40%
- Drift velocity: slow random direction
- Wraps at viewport edges

Hidden when `prefers-reduced-motion` is active or `disabled` prop is true.

#### `SoundManager` / `SoundProvider` (optional)

```tsx
// frontend/src/context/SoundContext.tsx
interface SoundContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
  playSuccess: () => void;
}
```

Loads two short audio buffers via the Web Audio API. `isMuted` is persisted to `localStorage` under the key `"sound-muted"`. Default volume is 0.25 (25%). `playClick` plays a ≤100 ms tone; `playSuccess` plays a ≤500 ms chime. When muted, play functions are no-ops.

### Modified existing components

| Component | Changes |
|---|---|
| `App.tsx` | Add `AnimatedBackground` wrapper; add `SoundProvider` (optional); remove `bg-slate-50 dark:bg-zinc-900` from root div (background now comes from `AnimatedBackground`) |
| `Navbar.tsx` | Add hamburger menu for mobile (< 768 px); add optional mute toggle button; apply glassmorphism styling |
| `Dashboard.tsx` | Wrap each section in `GlassCard`; wrap sections in Framer Motion `motion.div` with scroll-triggered `useInView`; replace plain `div` wrappers |
| `AnalysisForm.tsx` | Replace submit button with `NeonButton variant="primary"`; replace inputs with styled glass inputs |
| `FileUploader.tsx` | Replace action buttons with `NeonButton`; add progress bar during upload state |
| `ResultsPanel.tsx` | Wrap state transitions in `AnimatePresence` for cross-fade |
| `ExcelDashboard.tsx` | Replace loading state with `SkeletonLoader`; add chart entry animations via `useInView` |
| `BeforeAfterPanel.tsx` | Wrap in `GlassCard`; animate in/out with Framer Motion |
| `FileChat.tsx` | Wrap in `GlassCard`; replace send button with `NeonButton` |
| `ThemeToggle.tsx` | Style as `NeonButton variant="secondary"` |

---

## Data Models

### Design tokens

All tokens are defined in `frontend/src/styles/tokens.ts` and consumed by Tailwind config extensions and inline styles.

#### Colour palette

```ts
export const colors = {
  // Primary gradient stops
  gradientBlue:   "#1e3a8a",  // blue-900
  gradientCyan:   "#0e7490",  // cyan-700
  gradientPurple: "#6b21a8",  // purple-800

  // Neon accent colours
  neonBlue:   "#3b82f6",  // blue-500
  neonCyan:   "#06b6d4",  // cyan-500
  neonPurple: "#a855f7",  // purple-500
  neonGreen:  "#10b981",  // emerald-500

  // Chart palette (matches gradient tones)
  chartPalette: [
    "#3b82f6",  // blue-500
    "#06b6d4",  // cyan-500
    "#a855f7",  // purple-500
    "#818cf8",  // indigo-400
    "#67e8f9",  // cyan-300
    "#c084fc",  // purple-400
  ],

  // Glass surfaces
  glassBg:     "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.15)",
  glassBgDark: "rgba(255, 255, 255, 0.04)",

  // Text (WCAG AA compliant on glass backgrounds)
  textPrimary:   "#f1f5f9",  // slate-100  — contrast ≥ 4.5:1 on glass dark bg
  textSecondary: "#94a3b8",  // slate-400  — contrast ≥ 3:1 on glass dark bg
  textMuted:     "#64748b",  // slate-500
} as const;
```

#### Spacing scale (8 px grid)

```ts
export const spacing = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  8:  "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;
// All values are multiples of 4px
```

#### Typography

```ts
export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  sizeBody:   "14px",   // minimum body
  sizeSmall:  "12px",
  sizeBase:   "16px",
  sizeH3:     "18px",   // minimum heading
  sizeH2:     "20px",
  sizeH1:     "24px",
  weightNormal:    400,
  weightMedium:    500,
  weightSemibold:  600,
  weightBold:      700,
} as const;
```

### Animation specifications

#### `AnimatedBackground` keyframe

```css
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-bg {
  background: linear-gradient(
    135deg,
    #1e3a8a 0%,
    #0e7490 33%,
    #6b21a8 66%,
    #1e3a8a 100%
  );
  background-size: 300% 300%;
  animation: gradientShift 12s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animated-bg {
    animation: none;
    background-position: 0% 50%;
  }
}
```

#### Framer Motion section variants

```ts
export const sectionVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn"  } },
};
```

#### Framer Motion cross-fade (ResultsPanel states)

```ts
export const crossFadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};
```

#### NeonButton hover variants

```ts
// Applied via Framer Motion whileHover / whileTap
export const neonButtonVariants = {
  rest:  { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.1, ease: "easeOut" } },
  tap:   { scale: 0.98 },
};
```

#### RippleEffect keyframe

```css
@keyframes ripple {
  0%   { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(4); opacity: 0;   }
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  animation: ripple 600ms linear forwards;
  pointer-events: none;
}
```

#### SkeletonLoader shimmer keyframe

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 25%,
    rgba(255,255,255,0.15) 50%,
    rgba(255,255,255,0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

#### Chart entry animation

Charts use Recharts' built-in `isAnimationActive` prop combined with a `useInView` hook. When the chart container enters the viewport, `isAnimationActive` is set to `true` and `animationDuration` is set to `800` (ms). Before viewport entry, `isAnimationActive` is `false` so bars/lines start at zero.

---

## Responsive Layout Specifications

### Breakpoints

| Name | Min width | Tailwind prefix |
|---|---|---|
| mobile | 320 px | (default) |
| tablet | 768 px | `md:` |
| desktop | 1280 px | `xl:` |
| wide | 2560 px | `2xl:` |

### Dashboard grid

```
Mobile (< 768px):
  [File Upload]
  [Analysis Form]
  [Results Panel]
  [BeforeAfter / Excel / Chat]

Tablet (768px – 1279px):
  [File Upload          ] [Analysis Form  ]
  [Results Panel        ] [Results Panel  ]
  [BeforeAfter / Excel / Chat — full width]

Desktop (≥ 1280px):
  [File Upload          ] [Analysis Form  ]
  [Results Panel        ] [Results Panel  ]
  [Excel Summary: 4-col grid             ]
  [Charts — full width                   ]
```

### Navbar responsive behaviour

- **≥ 768 px**: Horizontal nav links visible, ThemeToggle and optional mute button inline.
- **< 768 px**: Nav links hidden; hamburger icon (`☰`) shown. Clicking opens a slide-down drawer with nav links stacked vertically. All touch targets ≥ 44 px height.

### Particle visibility

`ParticleField` receives `disabled={viewportWidth < 768}` to hide particles on mobile. This is computed via a `useWindowSize` hook.

### Reduced transparency fallback

A `useMediaQuery("(prefers-reduced-transparency: reduce)")` hook is used inside `GlassCard` to switch from `backdrop-blur-md` (12 px) to `backdrop-blur-sm` (8 px) and increase background opacity slightly for legibility.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The feature uses `fast-check` (already installed) for property-based testing.

### Property 1: Spotlight gradient tracks cursor position

*For any* (x, y) cursor position within the bounds of a GlassCard, after a `mousemove` event at those coordinates, the spotlight radial-gradient style applied to the card's overlay element should be centred at approximately (x, y) relative to the card's bounding rectangle (within ±2 px tolerance).

**Validates: Requirements 2.4**

### Property 2: NeonButton hover scale is within specification

*For any* enabled NeonButton variant, when a hover interaction is applied, the resulting scale transform value should be between 1.02 and 1.08 inclusive, and the transition duration should be 150 ms or less.

**Validates: Requirements 3.2**

### Property 3: Ripple origin matches click coordinates

*For any* (x, y) click coordinates within a NeonButton's bounding rectangle, the ripple element created by that click should have its `left` and `top` CSS properties set to values that place its centre at approximately (x, y) relative to the button bounds (within ±2 px tolerance).

**Validates: Requirements 3.3**

### Property 4: Tooltip repositions based on available space

*For any* button positioned at a vertical offset `y` from the top of the viewport, if `y` is less than the tooltip height plus 8 px of clearance, the tooltip should be positioned below the button; otherwise it should be positioned above.

**Validates: Requirements 4.7**

### Property 5: Chart colours are from the approved palette

*For any* chart rendered in the ChartsTab component, all fill colours applied to bars, lines, and pie cells should be values drawn exclusively from the `chartPalette` design token array (`#3b82f6`, `#06b6d4`, `#a855f7`, `#818cf8`, `#67e8f9`, `#c084fc`).

**Validates: Requirements 7.4**

### Property 6: Spacing tokens are multiples of 4 px

*For any* spacing token defined in the `spacing` design token map, its numeric pixel value should be a positive integer that is evenly divisible by 4.

**Validates: Requirements 8.3**

### Property 7: Body text colour pairs meet WCAG AA contrast (4.5:1)

*For any* body text colour and its paired background colour defined in the design token colour map, the WCAG 2.1 relative luminance contrast ratio should be greater than or equal to 4.5.

**Validates: Requirements 8.4**

### Property 8: Large text colour pairs meet WCAG AA contrast (3:1)

*For any* large-text colour and its paired background colour defined in the design token colour map, the WCAG 2.1 relative luminance contrast ratio should be greater than or equal to 3.0.

**Validates: Requirements 8.5**

### Property 9: NeonButton touch targets are at least 44 px tall on mobile

*For any* NeonButton rendered at a viewport width below 768 px, its computed height should be greater than or equal to 44 px.

**Validates: Requirements 10.3**

### Property 10: Particle count and dimensions are within specification

*For any* rendered `ParticleField` with a given `count` prop between 20 and 60, the number of active particles should equal `count`, each particle's diameter should be between 2 px and 6 px inclusive, and each particle's opacity should be between 0.10 and 0.40 inclusive.

**Validates: Requirements 11.1, 11.2**

---

## Error Handling

### Animation failures

Framer Motion animations are purely visual. If the animation library fails to load (e.g. bundle error), components fall back to their static Tailwind-styled appearance because all structural markup and Tailwind classes are applied independently of Framer Motion variants.

### `backdrop-filter` not supported

Some older browsers do not support `backdrop-filter`. The `GlassCard` applies a semi-opaque solid background fallback (`bg-slate-900/80`) via `@supports not (backdrop-filter: blur(1px))` in `index.css`. This ensures readability even without blur.

### `prefers-reduced-motion` / `prefers-reduced-transparency`

Both media queries are checked at component mount via `window.matchMedia`. If `matchMedia` is unavailable (e.g. test environment), the hooks return `false` (no reduction), which is the safe default — animations run but do not cause harm.

### Web Audio API unavailable (optional sound)

`SoundProvider` wraps all `AudioContext` creation in a try/catch. If the API is unavailable or the user has not interacted with the page (autoplay policy), sound functions silently no-op. The mute toggle remains functional.

### Canvas unavailable (optional particles)

`ParticleField` checks for `canvas.getContext("2d")` support. If unavailable, the component returns `null` without error.

### Tooltip positioning edge cases

If `getBoundingClientRect()` returns a zero-size rect (e.g. during SSR or hidden elements), the `Tooltip` defaults to `position: absolute; top: -100%` (above) and does not throw.

---

## Testing Strategy

### Unit tests (example-based)

Located in `frontend/src/__tests__/`. Use Vitest + React Testing Library.

Key example tests:
- `AnimatedBackground` renders with `position: fixed` and gradient classes
- `AnimatedBackground` suppresses animation when `prefers-reduced-motion` is mocked
- `GlassCard` renders with `backdrop-blur-md` class
- `GlassCard` switches to `backdrop-blur-sm` when `prefers-reduced-transparency` is mocked
- `NeonButton` renders spinner and is disabled when `isLoading={true}`
- `NeonButton` does not apply hover variants when `disabled={true}`
- `RippleEffect` element is removed from DOM after 600 ms (using `vi.useFakeTimers`)
- `Tooltip` renders correct label text for each action button
- `Tooltip` is not rendered on touch devices (mocked `navigator.maxTouchPoints`)
- `SkeletonLoader` renders correct number of rows
- `ExcelDashboard` renders `SkeletonLoader` when `status="loading"`
- `ResultsPanel` uses `AnimatePresence` for cross-fade between states
- `Navbar` renders hamburger button at mobile viewport width
- Section animation variants have correct `duration` values (0.3 s enter, 0.2 s exit)

### Property-based tests

Located in `frontend/src/__tests__/properties/`. Use Vitest + `fast-check`.

Each property test runs a minimum of **100 iterations**. Tests are tagged with a comment referencing the design property.

```ts
// Feature: semantic-validator-ui-redesign, Property 1: Spotlight gradient tracks cursor position
fc.assert(fc.property(
  fc.record({ x: fc.integer({ min: 0, max: 800 }), y: fc.integer({ min: 0, max: 600 }) }),
  ({ x, y }) => { /* ... */ }
), { numRuns: 100 });
```

Property tests to implement:

| Test file | Property | fast-check arbitraries |
|---|---|---|
| `spotlight.property.test.ts` | Property 1 | `fc.record({ x: fc.integer, y: fc.integer })` |
| `neonButton.property.test.ts` | Property 2 | `fc.constantFrom("primary","secondary","danger","success")` |
| `ripple.property.test.ts` | Property 3 | `fc.record({ x: fc.float, y: fc.float })` within button bounds |
| `tooltip.property.test.ts` | Property 4 | `fc.integer({ min: 0, max: 1080 })` for y position |
| `chartColors.property.test.ts` | Property 5 | `fc.array(fc.record({ ... }))` for chart data |
| `spacingTokens.property.test.ts` | Property 6 | `fc.constantFrom(...Object.values(spacing))` |
| `contrast.property.test.ts` | Properties 7 & 8 | `fc.constantFrom(...colorPairs)` |
| `touchTarget.property.test.ts` | Property 9 | `fc.constantFrom("primary","secondary","danger","success")` |
| `particles.property.test.ts` | Property 10 | `fc.integer({ min: 20, max: 60 })` for count |

### Integration tests

- Full `Dashboard` render smoke test: assert all four GlassCard sections are present
- `ExcelDashboard` with mock data: assert chart colours match palette
- `Navbar` at 375 px viewport: assert hamburger is visible, nav links hidden

### Accessibility tests

- Run `axe-core` (via `@axe-core/react`) on `Dashboard` render in test environment
- Assert zero critical or serious violations
- Manual testing with VoiceOver / NVDA for keyboard navigation and screen reader announcements

### Visual regression (recommended, not blocking)

- Use Storybook + Chromatic or Playwright visual snapshots for `GlassCard`, `NeonButton`, `AnimatedBackground`
- Capture at 375 px, 768 px, 1280 px, and 1920 px viewport widths

### Running tests

```bash
# From frontend/
npm test          # runs all unit + property tests once (vitest --run)
npm run test:watch  # watch mode during development
```
