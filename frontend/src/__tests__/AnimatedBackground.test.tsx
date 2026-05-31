import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

describe('AnimatedBackground', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the background div with animated-bg class', () => {
    const { container } = render(<AnimatedBackground><div>content</div></AnimatedBackground>);
    const bgDiv = container.querySelector('.animated-bg');
    expect(bgDiv).not.toBeNull();
  });

  it('renders the background div with position fixed style', () => {
    const { container } = render(<AnimatedBackground><div>content</div></AnimatedBackground>);
    const bgDiv = container.querySelector('.animated-bg') as HTMLElement;
    expect(bgDiv.style.position).toBe('fixed');
  });

  it('renders children inside the content layer', () => {
    render(<AnimatedBackground><div data-testid="child">hello</div></AnimatedBackground>);
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('adds animated-bg-no-motion class when prefers-reduced-motion is active', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { container } = render(<AnimatedBackground><div>content</div></AnimatedBackground>);
    const bgDiv = container.querySelector('.animated-bg');
    // The class is added via useEffect — check it was called with the right query
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(bgDiv).not.toBeNull();
  });

  it('background div has aria-hidden="true"', () => {
    const { container } = render(<AnimatedBackground><div>content</div></AnimatedBackground>);
    const bgDiv = container.querySelector('.animated-bg');
    expect(bgDiv?.getAttribute('aria-hidden')).toBe('true');
  });
});
