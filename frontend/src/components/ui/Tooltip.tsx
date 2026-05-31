import React, { useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  showDelay?: number;
  hideDelay?: number;
}

export function Tooltip({ label, children, showDelay = 300, hideDelay = 150 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [positionBelow, setPositionBelow] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip tooltips on touch devices
  const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  if (isTouch) return children;

  const handleMouseEnter = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect && rect.top < 48) {
        setPositionBelow(true);
      } else {
        setPositionBelow(false);
      }
      setVisible(true);
    }, showDelay);
  }, [showDelay]);

  const handleMouseLeave = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [hideDelay]);

  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <span className="relative inline-flex">
      {child}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: positionBelow ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: positionBelow ? -4 : 4 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className={`
              pointer-events-none absolute z-50 whitespace-nowrap
              rounded-lg px-3 py-1.5 text-xs font-medium
              bg-slate-800/95 text-slate-100 border border-white/10
              shadow-lg backdrop-blur-sm
              ${positionBelow
                ? 'top-full mt-2 left-1/2 -translate-x-1/2'
                : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              }
            `}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
