interface SkeletonLoaderProps {
  /** Number of skeleton rows (default: 4) */
  rows?: number;
  /** Height of each row in px (default: 20) */
  rowHeight?: number;
  className?: string;
}

export function SkeletonLoader({ rows = 4, rowHeight = 20, className = '' }: SkeletonLoaderProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading…"
      className={`space-y-3 ${className}`}
    >
      {/* Visually hidden label for screen readers */}
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded"
          style={{ height: rowHeight, width: i % 3 === 2 ? '60%' : '100%' }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default SkeletonLoader;
