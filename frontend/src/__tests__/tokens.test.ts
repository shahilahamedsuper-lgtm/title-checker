import { describe, it, expect } from 'vitest';
import { sectionVariants, crossFadeVariants, spacing } from '../styles/tokens';

// Task 25.4 — Section animation variants
describe('sectionVariants', () => {
  it('visible transition duration is 0.3s', () => {
    expect(sectionVariants.visible.transition.duration).toBe(0.3);
  });

  it('exit transition duration is 0.2s', () => {
    expect(sectionVariants.exit.transition.duration).toBe(0.2);
  });

  it('hidden state has opacity 0', () => {
    expect(sectionVariants.hidden.opacity).toBe(0);
  });

  it('visible state has opacity 1', () => {
    expect(sectionVariants.visible.opacity).toBe(1);
  });
});

describe('crossFadeVariants', () => {
  it('visible transition duration is 0.2s', () => {
    expect(crossFadeVariants.visible.transition.duration).toBe(0.2);
  });

  it('exit transition duration is 0.2s', () => {
    expect(crossFadeVariants.exit.transition.duration).toBe(0.2);
  });
});

// Task 2.1 — Spacing tokens are multiples of 4px
describe('spacing tokens', () => {
  it('all spacing values are multiples of 4px', () => {
    for (const value of Object.values(spacing)) {
      const px = parseInt(value as string, 10);
      expect(px % 4).toBe(0);
    }
  });

  it('all spacing values are positive', () => {
    for (const value of Object.values(spacing)) {
      const px = parseInt(value as string, 10);
      expect(px).toBeGreaterThan(0);
    }
  });
});
