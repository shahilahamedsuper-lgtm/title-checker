// Design tokens for the Semantic Validator UI Redesign
// All tokens are consumed by Tailwind config extensions and inline styles.

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Spacing scale (8 px grid — all values are multiples of 4 px)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

/** Section enter / exit variants for Dashboard sections */
export const sectionVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn"  } },
};

/** Cross-fade variants for ResultsPanel state transitions */
export const crossFadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

/** NeonButton hover / tap scale variants */
export const neonButtonVariants = {
  rest:  { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.1, ease: "easeOut" } },
  tap:   { scale: 0.98 },
};

// ---------------------------------------------------------------------------
// NeonButton glow colours (box-shadow values per variant)
// ---------------------------------------------------------------------------

export const neonGlowColors: Record<string, string> = {
  primary:   "0 0 20px rgba(59, 130, 246, 0.6)",
  secondary: "0 0 20px rgba(148, 163, 184, 0.4)",
  danger:    "0 0 20px rgba(239, 68, 68, 0.5)",
  success:   "0 0 20px rgba(16, 185, 129, 0.5)",
};
