import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  /** Animation cycle duration in ms (default: 12000) */
  duration?: number;
  children?: React.ReactNode;
}

export function AnimatedBackground({ duration = 12000, children }: AnimatedBackgroundProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    // Apply the CSS custom property for animation duration
    el.style.setProperty('--bg-duration', `${duration}ms`);

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = (e: MediaQueryList | MediaQueryListEvent) => {
      if (e.matches) {
        el.classList.add('animated-bg-no-motion');
      } else {
        el.classList.remove('animated-bg-no-motion');
      }
    };

    applyMotionPreference(mq);
    mq.addEventListener('change', applyMotionPreference);
    return () => mq.removeEventListener('change', applyMotionPreference);
  }, [duration]);

  return (
    <>
      {/* Fixed background layer */}
      <div
        ref={bgRef}
        className="animated-bg"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </>
  );
}

export default AnimatedBackground;
