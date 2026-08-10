import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'outline' | 'outline-sm' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Button component — xAI design system.
 * All buttons are pill-shaped (border-radius: 9999px).
 * primary = white-filled (rare, Sign Up CTA)
 * outline  = translucent-border pill (default interactive shape)
 */
export function Button({
  variant = 'outline',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-display font-normal transition-all duration-200 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2';

  const variants: Record<ButtonVariant, string> = {
    // White-filled pill — rare primary CTA
    primary:
      'bg-ink text-canvas border border-ink hover:bg-ink-hover hover:border-ink-hover active:scale-[0.97]',
    // Translucent-border outline pill — canonical CTA
    outline:
      'bg-transparent text-ink border border-white/20 hover:border-white/40 hover:bg-white/5 active:scale-[0.97]',
    // Smaller outline pill
    'outline-sm':
      'bg-transparent text-ink border border-white/20 hover:border-white/40 hover:bg-white/5 active:scale-[0.97]',
    // Ghost — no border
    ghost:
      'bg-transparent text-body hover:text-ink hover:bg-white/5 active:scale-[0.97]',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 h-7',
    md: 'text-sm px-4 py-2 h-9',
    lg: 'text-sm px-6 py-2.5 h-11',
  };

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
}
