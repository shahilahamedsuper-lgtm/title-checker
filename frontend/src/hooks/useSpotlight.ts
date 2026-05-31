import { useRef, useCallback } from 'react';

/**
 * Tracks mouse position relative to an element and exposes
 * CSS custom properties --spotlight-x / --spotlight-y on it.
 * Returns a ref to attach to the target element.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const active = useRef(false);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
    if (!active.current) {
      active.current = true;
      el.style.setProperty('--spotlight-opacity', '1');
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    active.current = false;
    el.style.setProperty('--spotlight-opacity', '0');
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
