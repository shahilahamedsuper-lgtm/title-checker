# Requirements Document: Semantic Validator UI Redesign

## Introduction

This document specifies the requirements for a modern, futuristic UI redesign of the Semantic Validator web application. The redesign introduces a dark-first aesthetic with animated gradient backgrounds, glassmorphism cards, neon-glow interactive elements, mouse-follow spotlight effects, animated charts, and a fully responsive dashboard layout. The tech stack remains React + TypeScript + Tailwind CSS, with Framer Motion added for animation orchestration. All existing functionality (file upload, semantic analysis, deduplication, Excel analysis, file chat) is preserved; only the visual layer and interaction model are upgraded.

## Glossary

- **UI**: The client-side React application rendered in the browser.
- **Dashboard**: The main page (`/`) that hosts all feature sections.
- **GlassCard**: A reusable card component styled with backdrop blur, semi-transparent background, and a soft glowing border.
- **SpotlightEffect**: A radial gradient glow that follows the user's cursor position within a GlassCard.
- **NeonButton**: A button component that emits a coloured glow on hover and scales up slightly.
- **RippleEffect**: A circular expanding animation originating from the click point on a button.
- **AnimatedBackground**: The full-viewport gradient background with continuously animated colour shifts.
- **SkeletonLoader**: A placeholder shimmer animation shown while data is loading.
- **Tooltip**: A small floating label that appears when the user hovers over an interactive element.
- **Framer_Motion**: The animation library (`framer-motion`) used for declarative React animations.
- **Recharts**: The charting library already in use for Excel analysis charts.
- **User**: A person interacting with the UI via a web browser.

---

## Requirements

### Requirement 1: Animated Dark Background

**User Story:** As a User, I want a visually immersive background, so that the application feels modern and premium.

#### Acceptance Criteria

1. THE UI SHALL render a full-viewport animated gradient background using blue, cyan, and purple tones as the base layer beneath all content.
2. WHEN the UI is first rendered, THE AnimatedBackground SHALL begin a continuous, looping colour-shift animation with a cycle duration between 8 and 20 seconds.
3. THE AnimatedBackground SHALL remain fixed in the viewport so that scrolling content does not move the background.
4. WHERE the user's system or browser prefers reduced motion, THE AnimatedBackground SHALL display a static gradient instead of an animated one.

---

### Requirement 2: Glassmorphism Cards

**User Story:** As a User, I want content sections to appear as frosted-glass panels, so that the layout feels layered and modern.

#### Acceptance Criteria

1. THE GlassCard SHALL apply a backdrop blur of at least 12px to its background.
2. THE GlassCard SHALL use a semi-transparent background colour with opacity between 5% and 20%.
3. THE GlassCard SHALL display a soft, luminous border using a gradient or rgba colour with opacity between 10% and 30%.
4. WHEN the User moves the cursor over a GlassCard, THE SpotlightEffect SHALL render a radial gradient centred on the cursor position within the card bounds.
5. WHEN the User moves the cursor outside a GlassCard, THE SpotlightEffect SHALL fade out within 300ms.
6. THE GlassCard SHALL be used as the container for the File Upload section, Action Buttons section, Analysis Summary section, and Charts section.

---

### Requirement 3: Neon Button Interactions

**User Story:** As a User, I want buttons to respond visually to my interactions, so that the interface feels alive and responsive.

#### Acceptance Criteria

1. WHEN the User hovers over a NeonButton, THE NeonButton SHALL display a coloured box-shadow glow matching the button's accent colour.
2. WHEN the User hovers over a NeonButton, THE NeonButton SHALL scale up by a factor between 1.02 and 1.08 with a transition duration of 150ms or less.
3. WHEN the User clicks a NeonButton, THE RippleEffect SHALL render a circular expanding animation originating from the click coordinates within the button bounds.
4. THE RippleEffect animation SHALL complete within 600ms and then be removed from the DOM.
5. THE NeonButton SHALL apply the hover glow and scale-up animation to the following actions: Analyze, Populate Form, Remove Duplicates, Analyze Excel, Chat with File.
6. WHEN the NeonButton is in a disabled state, THE NeonButton SHALL NOT display the hover glow or scale-up animation.

---

### Requirement 4: Tooltip Labels

**User Story:** As a User, I want descriptive tooltips on action buttons, so that I understand what each button does without guessing.

#### Acceptance Criteria

1. WHEN the User hovers over the Analyze button, THE Tooltip SHALL display the label "Analyze file content for meaning, tone & clarity".
2. WHEN the User hovers over the Populate Form button, THE Tooltip SHALL display the label "Fill the analysis form with extracted text".
3. WHEN the User hovers over the Remove Duplicates button, THE Tooltip SHALL display the label "Detect and remove duplicate entries".
4. WHEN the User hovers over the Analyze Excel button, THE Tooltip SHALL display the label "Generate statistical summary of Excel data".
5. WHEN the User hovers over the Chat with File button, THE Tooltip SHALL display the label "Start an AI conversation about this file".
6. THE Tooltip SHALL appear within 300ms of hover start and disappear within 150ms of hover end.
7. THE Tooltip SHALL be positioned above the button by default and SHALL reposition below if insufficient space exists above.
8. IF the User's device is a touch device, THEN THE Tooltip SHALL NOT be displayed on tap.

---

### Requirement 5: Loading States

**User Story:** As a User, I want clear visual feedback while the application is processing, so that I know the system is working.

#### Acceptance Criteria

1. WHEN an analysis request is in progress, THE UI SHALL display an animated spinner in the Analyze button and disable the button.
2. WHEN an Excel analysis request is in progress, THE UI SHALL display a SkeletonLoader in the Excel Analysis Summary section instead of empty content.
3. THE SkeletonLoader SHALL animate with a shimmer effect moving from left to right with a cycle duration between 1 and 2 seconds.
4. WHEN a file upload is in progress, THE UI SHALL display an animated progress indicator in the File Upload section.
5. WHEN a deduplication request is in progress, THE UI SHALL display an animated spinner in the Remove Duplicates button and disable the button.

---

### Requirement 6: Dashboard Layout

**User Story:** As a User, I want a well-organised dashboard with clearly separated sections, so that I can navigate the application efficiently.

#### Acceptance Criteria

1. THE Dashboard SHALL contain the following sections in order: File Upload, Action Buttons, Analysis Summary, Charts.
2. THE Dashboard SHALL use a single-column layout on viewport widths below 768px.
3. WHEN the viewport width is 768px or above, THE Dashboard SHALL arrange the File Upload section and the Analysis Form in a two-column grid.
4. WHEN the viewport width is 1280px or above, THE Dashboard SHALL arrange the Excel Analysis Summary cards in a four-column grid.
5. WHEN the viewport width is below 1280px and 768px or above, THE Dashboard SHALL arrange the Excel Analysis Summary cards in a two-column grid.
6. WHEN the viewport width is below 768px, THE Dashboard SHALL arrange the Excel Analysis Summary cards in a single-column layout.
7. WHEN the User scrolls between sections, THE UI SHALL apply a subtle fade-in transition to each section as it enters the viewport.

---

### Requirement 7: Animated Charts

**User Story:** As a User, I want charts to animate into view, so that data visualisations feel engaging and easy to follow.

#### Acceptance Criteria

1. WHEN the Charts section first becomes visible in the viewport, THE UI SHALL animate each chart bar, line, or pie segment from zero to its final value.
2. THE chart entry animation SHALL complete within 800ms.
3. WHEN the User hovers over a chart data point or bar, THE Recharts tooltip SHALL appear with a smooth fade-in transition.
4. THE chart colour palette SHALL use the same blue, cyan, and purple tones as the AnimatedBackground to maintain visual consistency.

---

### Requirement 8: Typography and Spacing

**User Story:** As a User, I want clean, readable typography and consistent spacing, so that the interface is easy to scan and use.

#### Acceptance Criteria

1. THE UI SHALL use the Inter font family (or a system sans-serif fallback) for all body text.
2. THE UI SHALL use a minimum body font size of 14px and a minimum heading font size of 18px.
3. THE UI SHALL apply consistent spacing using an 8px base grid (padding and margin values SHALL be multiples of 4px).
4. THE UI SHALL maintain a minimum contrast ratio of 4.5:1 between text and its background for all body text, in compliance with WCAG 2.1 AA.
5. THE UI SHALL maintain a minimum contrast ratio of 3:1 between large text (18px bold or 24px regular) and its background.

---

### Requirement 9: Smooth Section Transitions

**User Story:** As a User, I want smooth transitions when sections appear or change state, so that the experience feels polished.

#### Acceptance Criteria

1. WHEN a new section becomes visible (e.g., Excel Dashboard appears after analysis), THE Framer_Motion SHALL animate the section in with a fade and upward slide over 300ms.
2. WHEN a section is dismissed or hidden, THE Framer_Motion SHALL animate the section out with a fade and downward slide over 200ms.
3. WHEN the panel state changes from loading to success or error, THE ResultsPanel SHALL transition between states with a cross-fade animation over 200ms.
4. THE UI SHALL NOT display layout shifts or content jumps during any transition.

---

### Requirement 10: Responsive Design

**User Story:** As a User, I want the redesigned UI to work on any device, so that I can use the application on mobile, tablet, and desktop.

#### Acceptance Criteria

1. THE UI SHALL render a usable layout on viewport widths from 320px to 2560px.
2. WHEN the viewport width is below 768px, THE UI SHALL hide non-essential decorative elements (e.g., floating particles) to preserve performance.
3. THE NeonButton touch targets SHALL be at least 44px in height on viewport widths below 768px.
4. THE GlassCard SHALL adjust its backdrop-blur intensity to 8px on devices where the `prefers-reduced-transparency` media query is active.
5. WHEN the viewport width is below 768px, THE Navbar SHALL collapse navigation links into a compact layout or hamburger menu.

---

### Requirement 11: Optional — Floating Particles Background

**User Story:** As a User, I want an optional floating particle animation in the background, so that the application has a premium, immersive feel.

#### Acceptance Criteria

1. WHERE the floating particles feature is enabled, THE UI SHALL render between 20 and 60 small semi-transparent particles that drift slowly across the viewport.
2. WHERE the floating particles feature is enabled, THE particles SHALL vary in size between 2px and 6px and in opacity between 10% and 40%.
3. WHERE the floating particles feature is enabled AND the User's system prefers reduced motion, THE particles SHALL be hidden.
4. WHERE the floating particles feature is enabled, THE particles SHALL be rendered on a canvas or absolutely-positioned layer that does not intercept pointer events.

---

### Requirement 12: Optional — Micro-interaction Sound Effects

**User Story:** As a User, I want subtle audio feedback on key interactions, so that the application feels tactile and responsive.

#### Acceptance Criteria

1. WHERE sound effects are enabled, WHEN the User clicks a NeonButton, THE UI SHALL play a short click sound effect with a duration of 100ms or less.
2. WHERE sound effects are enabled, WHEN an analysis completes successfully, THE UI SHALL play a short success chime with a duration of 500ms or less.
3. WHERE sound effects are enabled, THE UI SHALL provide a mute toggle in the Navbar that persists the mute preference in localStorage.
4. WHERE sound effects are enabled AND the mute toggle is active, THE UI SHALL NOT play any sound effects.
5. WHERE sound effects are enabled, THE audio volume SHALL default to 30% or less to avoid startling the User.
