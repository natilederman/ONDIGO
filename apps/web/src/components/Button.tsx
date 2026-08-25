'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-black disabled:bg-muted',
  secondary: 'bg-paper text-ink border border-ink hover:bg-ink hover:text-paper',
  ghost: 'bg-transparent text-ink hover:bg-line/60',
  danger: 'bg-accent text-paper hover:bg-accent-dark disabled:bg-muted',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', loading, className = '', children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Working…' : children}
    </button>
  )
);
Button.displayName = 'Button';
