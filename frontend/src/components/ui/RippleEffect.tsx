import React, { useCallback, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface UseRippleReturn {
  ripples: Ripple[];
  addRipple: (e: React.MouseEvent<HTMLButtonElement>) => void;
  RippleContainer: React.FC;
}

let rippleIdCounter = 0;

export function useRipple(): UseRippleReturn {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = ++rippleIdCounter;

    setRipples((prev) => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  // eslint-disable-next-line react/display-name
  const RippleContainer: React.FC = useCallback(() => (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  ), [ripples]);

  return { ripples, addRipple, RippleContainer };
}

export default useRipple;
