import React from 'react';
import { motion } from 'framer-motion';
import { useRipple } from './RippleEffect';
import { Tooltip } from './Tooltip';
import { neonGlowColors } from '../../styles/tokens';

type NeonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeonVariant;
  isLoading?: boolean;
  loadingLabel?: string;
  tooltip?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<NeonVariant, string> = {
  primary:   'bg-gradient-to-r from-blue-600 to-blue-500 text-white',
  secondary: 'bg-white/10 text-slate-200 border border-white/20',
  danger:    'bg-gradient-to-r from-red-600 to-red-500 text-white',
  success:   'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white',
};

export function NeonButton({
  variant = 'primary',
  isLoading = false,
  loadingLabel,
  tooltip,
  icon,
  children,
  className = '',
  disabled,
  onClick,
  ...rest
}: NeonButtonProps) {
  const { addRipple, RippleContainer } = useRipple();
  const isDisabled = disabled || isLoading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      addRipple(e);
      onClick?.(e);
    }
  };

  const button = (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.05, boxShadow: neonGlowColors[variant] }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      disabled={isDisabled}
      aria-busy={isLoading ? 'true' : undefined}
      onClick={handleClick}
      className={`
        relative inline-flex items-center justify-center gap-2
        min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm
        overflow-hidden cursor-pointer select-none
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      <RippleContainer />
      {isLoading ? (
        <>
          {/* Spinner */}
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>{loadingLabel ?? 'Loading…'}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );

  if (tooltip && !isDisabled) {
    return <Tooltip label={tooltip}>{button as React.ReactElement}</Tooltip>;
  }

  return button;
}

export default NeonButton;
