import React, { useCallback, useEffect, useRef, useState } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  disableSpotlight?: boolean;
  as?: React.ElementType;
  /** Spotlight colour — defaults to a blue/purple mix */
  spotlightColor?: string;
}

export function GlassCard({
  children,
  className = '',
  disableSpotlight = false,
  as: Tag = 'div',
  spotlightColor,
}: GlassCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [reducedTransparency, setReducedTransparency] = useState(false);
  const isHovered = useRef(false);

  // Detect prefers-reduced-transparency
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-transparency: reduce)');
    setReducedTransparency(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedTransparency(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const card = cardRef.current;
    const overlay = overlayRef.current;
    if (!card || !overlay) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--spotlight-x', `${x}px`);
    card.style.setProperty('--spotlight-y', `${y}px`);

    if (!isHovered.current) {
      isHovered.current = true;
      overlay.style.opacity = '1';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    isHovered.current = false;
    overlay.style.opacity = '0';
  }, []);

  useEffect(() => {
    if (disableSpotlight) return;
    const card = cardRef.current;
    if (!card) return;
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [disableSpotlight, handleMouseMove, handleMouseLeave]);

  const blurClass = reducedTransparency ? 'backdrop-blur-sm' : 'backdrop-blur-xl';
  const bgClass = reducedTransparency
    ? 'bg-white/[0.10] dark:bg-white/[0.06]'
    : 'bg-white/[0.04] dark:bg-white/[0.03]';

  const color = spotlightColor ?? 'rgba(99, 102, 241, 0.22)';
  const colorEdge = spotlightColor
    ? spotlightColor.replace(/[\d.]+\)$/, '0)')
    : 'rgba(99, 102, 241, 0)';

  return (
    <Tag
      ref={cardRef as React.Ref<HTMLDivElement>}
      className={`glass-card holo-card relative overflow-hidden rounded-2xl ${blurClass} ${bgClass} ${className}`}
      style={{
        border: "1px solid rgba(99,102,241,0.15)",
        boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 0 24px rgba(99,102,241,0.02)",
      }}
    >
      {!disableSpotlight && (
        <div
          ref={overlayRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 350ms ease',
            background: `radial-gradient(
              320px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
              ${color},
              rgba(139, 92, 246, 0.08) 40%,
              ${colorEdge} 70%
            )`,
          }}
        />
      )}
      {children}
    </Tag>
  );
}

export default GlassCard;
