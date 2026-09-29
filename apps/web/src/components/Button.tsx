'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-paper border border-ink hover:opacity-90 disabled:opacity-40',
  secondary: 'bg-transparent text-ink border border-line-strong hover:border-ink',
  ghost: 'bg-transparent text-muted border border-transparent hover:text-ink',
  // destructive actions are the one other place the signal is allowed to speak
  danger: 'bg-transparent text-signal border border-signal hover:bg-signal hover:text-paper',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', loading, className = '', children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.005em] transition-[transform,opacity,border-color,background-color,color] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Working…' : children}
    </button>
  )
);
Button.displayName = 'Button';
