import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { colors } from '../../styles/tokens';

/**
 * WCAG 2.1 relative luminance calculation.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function linearise(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearise);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Body text pairs: text colour vs a representative dark glass background
// We approximate the glass background as a very dark navy (#0f172a = slate-900)
const DARK_BG = '#0f172a';

const bodyTextPairs: Array<{ text: string; bg: string; label: string }> = [
  { text: colors.textPrimary,   bg: DARK_BG, label: 'textPrimary on dark bg' },
];

// Large text pairs (heading colours)
const largeTextPairs: Array<{ text: string; bg: string; label: string }> = [
  { text: colors.textPrimary,   bg: DARK_BG, label: 'textPrimary (large) on dark bg' },
  { text: colors.textSecondary, bg: DARK_BG, label: 'textSecondary (large) on dark bg' },
  { text: colors.neonBlue,      bg: DARK_BG, label: 'neonBlue on dark bg' },
  { text: colors.neonCyan,      bg: DARK_BG, label: 'neonCyan on dark bg' },
  { text: colors.neonPurple,    bg: DARK_BG, label: 'neonPurple on dark bg' },
  { text: colors.neonGreen,     bg: DARK_BG, label: 'neonGreen on dark bg' },
];

// Feature: semantic-validator-ui-redesign, Property 7: Body text colour pairs meet WCAG AA contrast (4.5:1)
describe('WCAG contrast — body text (Property 7)', () => {
  it('all body text colour pairs have contrast ratio ≥ 4.5:1', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...bodyTextPairs),
        (pair) => {
          const ratio = contrastRatio(pair.text, pair.bg);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
          return ratio >= 4.5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('textPrimary on dark background meets 4.5:1', () => {
    const ratio = contrastRatio(colors.textPrimary, DARK_BG);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

// Feature: semantic-validator-ui-redesign, Property 8: Large text colour pairs meet WCAG AA contrast (3:1)
describe('WCAG contrast — large text (Property 8)', () => {
  it('all large text colour pairs have contrast ratio ≥ 3:1', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...largeTextPairs),
        (pair) => {
          const ratio = contrastRatio(pair.text, pair.bg);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
          return ratio >= 3.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it.each(largeTextPairs)('$label meets 3:1', ({ text, bg }) => {
    const ratio = contrastRatio(text, bg);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});
