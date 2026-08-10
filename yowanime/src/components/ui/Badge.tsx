import { type ReactNode } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'sunset' | 'dusk' | 'twilight' | 'breeze' | 'success' | 'outline' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge — small pill label for genres, status, ratings.
 * All variants use rounded-full (pill shape per design system).
 */
export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full font-mono font-normal tracking-widest uppercase select-none';

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variants: Record<BadgeVariant, string> = {
    default:  'bg-canvas-mid text-body border border-hairline',
    outline:  'bg-transparent text-body-mid border border-hairline',
    sunset:   'bg-sunset/10 text-sunset border border-sunset/30',
    dusk:     'bg-dusk/10 text-twilight border border-dusk/30',
    twilight: 'bg-twilight/10 text-twilight border border-twilight/30',
    breeze:   'bg-breeze/10 text-breeze border border-breeze/30',
    success:  'bg-green-500/10 text-green-400 border border-green-500/30',
    danger:   'bg-red-500/15 text-red-500 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
}
