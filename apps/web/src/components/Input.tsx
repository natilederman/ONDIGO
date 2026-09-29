import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FieldWrap({ label, error, hint, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
          {label}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-steel">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-signal">{error}</span>}
    </label>
  );
}

const baseClasses =
  'w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-steel transition-colors duration-150 focus:border-ink focus:outline-none focus:ring-0';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...rest }, ref) => (
    <FieldWrap label={label} error={error} hint={hint}>
      <input
        ref={ref}
        className={`${baseClasses} ${error ? 'border-signal' : ''} ${className}`}
        {...rest}
      />
    </FieldWrap>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...rest }, ref) => (
    <FieldWrap label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        className={`${baseClasses} ${error ? 'border-signal' : ''} ${className}`}
        {...rest}
      />
    </FieldWrap>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = '', children, ...rest }, ref) => (
    <FieldWrap label={label} error={error} hint={hint}>
      <select
        ref={ref}
        className={`${baseClasses} ${error ? 'border-signal' : ''} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldWrap>
  )
);
Select.displayName = 'Select';
