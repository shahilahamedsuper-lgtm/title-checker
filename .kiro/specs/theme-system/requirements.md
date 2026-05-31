# Requirements Document

## Introduction

This feature adds a light/dark theme system to the Semantic Validator web application. Users can toggle between a light theme (the current design) and a premium dark theme built on dark slate/zinc tones. The selected preference is persisted in `localStorage` and restored on page load. If no saved preference exists, the system defaults to the user's OS-level color scheme preference.

The implementation uses Tailwind CSS's `darkMode: 'class'` strategy, a `ThemeContext` with a `useTheme` hook, and a toggle button in the Navbar. All existing components receive dark mode Tailwind variants.

## Glossary

- **Theme_System**: The React context, hook, and logic responsible for managing and applying the active color theme.
- **ThemeContext**: The React context that exposes the current theme value and the toggle function to all child components.
- **useTheme**: The custom React hook that consumes `ThemeContext`.
- **Theme_Toggle**: The button rendered in the Navbar that switches between light and dark themes.
- **Dark_Theme**: The premium dark color scheme using dark slate/zinc backgrounds (not pure black).
- **Light_Theme**: The existing default color scheme using white/slate-50 backgrounds.
- **Preference_Store**: The `localStorage` key (`theme`) used to persist the user's theme selection.
- **System_Preference**: The OS-level color scheme preference exposed via the `prefers-color-scheme` media query.

---

## Requirements

### Requirement 1: Theme Initialization

**User Story:** As a returning user, I want my previously chosen theme to be applied immediately on page load, so that I never see a flash of the wrong theme.

#### Acceptance Criteria

1. WHEN the application loads, THE Theme_System SHALL read the `theme` key from the Preference_Store and apply the corresponding theme before the first render.
2. IF no value exists in the Preference_Store, THEN THE Theme_System SHALL apply the theme that matches the System_Preference (`prefers-color-scheme`).
3. IF neither a stored preference nor a detectable System_Preference exists, THEN THE Theme_System SHALL apply the Light_Theme as the default.
4. WHEN the active theme is Dark_Theme, THE Theme_System SHALL add the `dark` class to the `<html>` element.
5. WHEN the active theme is Light_Theme, THE Theme_System SHALL ensure the `dark` class is absent from the `<html>` element.

---

### Requirement 2: Theme Toggle

**User Story:** As a user, I want a clearly visible toggle button in the navigation bar, so that I can switch between light and dark themes at any time.

#### Acceptance Criteria

1. THE Navbar SHALL render the Theme_Toggle as a single icon button displaying a sun icon when the Dark_Theme is active and a moon icon when the Light_Theme is active.
2. WHEN the user activates the Theme_Toggle, THE Theme_System SHALL switch the active theme to the opposite theme.
3. WHEN the user activates the Theme_Toggle, THE Theme_System SHALL persist the new theme value to the Preference_Store.
4. WHEN the user activates the Theme_Toggle, THE Theme_System SHALL update the `dark` class on the `<html>` element to reflect the new theme without a full page reload.
5. THE Theme_Toggle SHALL include an accessible `aria-label` attribute that describes the action it will perform (e.g., "Switch to dark mode" or "Switch to light mode").

---

### Requirement 3: Dark Theme Visual Design

**User Story:** As a user, I want the dark theme to feel premium and polished, so that the application looks professional in low-light environments.

#### Acceptance Criteria

1. WHILE the Dark_Theme is active, THE Theme_System SHALL apply a `zinc-900` or `slate-900` background to the page root (replacing `slate-50`).
2. WHILE the Dark_Theme is active, THE Theme_System SHALL apply `zinc-800` or `slate-800` backgrounds to card/panel surfaces (replacing `white`).
3. WHILE the Dark_Theme is active, THE Theme_System SHALL apply `zinc-700` or `slate-700` borders to card/panel borders (replacing `slate-200`).
4. WHILE the Dark_Theme is active, THE Theme_System SHALL apply `slate-100` or `zinc-100` color to primary body text (replacing `slate-800`).
5. WHILE the Dark_Theme is active, THE Theme_System SHALL apply `slate-400` color to secondary/muted text (replacing `slate-500`).
6. WHILE the Dark_Theme is active, THE Theme_System SHALL preserve `blue-600` / `blue-500` as the primary action color, adjusting to `blue-500` for improved contrast on dark surfaces.
7. WHILE the Dark_Theme is active, THE Navbar SHALL apply a `zinc-950` or `slate-950` background to maintain visual hierarchy above card surfaces.

---

### Requirement 4: Component Dark Mode Coverage

**User Story:** As a user, I want every part of the interface to respect the active theme, so that no component appears broken or unthemed when dark mode is active.

#### Acceptance Criteria

1. THE Theme_System SHALL apply dark mode variants to all of the following components: `App`, `Navbar`, `Dashboard`, `AnalysisForm`, `ResultsPanel`, `FileUploader`, `BeforeAfterPanel`, `ExcelDashboard`, `SuggestionItem`, `CharCounter`, `FieldError`, and `ErrorBoundary`.
2. WHEN the Dark_Theme is active, THE Theme_System SHALL ensure no component retains a hardcoded light-only Tailwind class (e.g., `bg-white`, `text-slate-800`, `border-slate-200`) without a corresponding `dark:` variant.
3. WHEN the Dark_Theme is active, THE Theme_System SHALL style form inputs (`<input>`, `<textarea>`) with dark backgrounds (`zinc-800`/`slate-800`) and light text (`slate-100`) so that user-entered content remains legible.
4. WHEN the Dark_Theme is active, THE Theme_System SHALL style status/alert banners (loading, error, success, warning) with dark-appropriate background and text colors that maintain sufficient contrast.

---

### Requirement 5: Preference Persistence

**User Story:** As a user, I want my theme choice to be remembered across browser sessions, so that I do not have to re-select my preferred theme every time I visit.

#### Acceptance Criteria

1. WHEN the user activates the Theme_Toggle, THE Theme_System SHALL write the new theme value (`"dark"` or `"light"`) to `localStorage` under the key `"theme"`.
2. WHEN the application loads, THE Theme_System SHALL read the `"theme"` key from `localStorage` before rendering any component.
3. THE Theme_System SHALL function correctly when `localStorage` is unavailable (e.g., private browsing with storage blocked) by falling back to the System_Preference without throwing an unhandled exception.

---

### Requirement 6: ThemeContext API

**User Story:** As a developer, I want a clean React context and hook API for theme management, so that any component can read or change the theme without prop drilling.

#### Acceptance Criteria

1. THE Theme_System SHALL export a `ThemeProvider` component that wraps the application and supplies theme state to all descendants via `ThemeContext`.
2. THE Theme_System SHALL export a `useTheme` hook that returns the current theme value (`"light"` or `"dark"`) and a `toggleTheme` function.
3. IF `useTheme` is called outside of a `ThemeProvider`, THEN THE Theme_System SHALL throw a descriptive error identifying the misuse.
4. THE `ThemeProvider` SHALL initialize theme state synchronously on mount using the priority order: Preference_Store → System_Preference → Light_Theme default.
