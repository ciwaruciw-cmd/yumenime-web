import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Card component — xAI design system.
 * canvas-card (#191919) background, hairline border, 8px radius, no shadow.
 */
export function Card({
  children,
  hover = false,
  padding = 'lg',
  className,
  ...props
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'bg-canvas-card border border-hairline rounded-[8px] transition-colors duration-200',
        hover && 'hover:border-white/20 cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
