import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input — xAI design system.
 * canvas-soft bg, hairline border, 8px radius.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm text-body mb-1.5 font-display"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-mute pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full bg-canvas-soft text-ink border border-hairline rounded-[8px]',
              'text-sm font-display placeholder:text-mute',
              'px-4 py-3 outline-none transition-colors duration-200',
              'focus:border-white/30 focus:bg-canvas-soft',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-mute pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-400 font-display">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
