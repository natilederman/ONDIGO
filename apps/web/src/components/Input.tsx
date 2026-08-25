import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface FieldWrapProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function FieldWrap({ label, error, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-accent-dark">{error}</span>}
    </label>
  );
}

const baseClasses =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...rest }, ref) => (
  <FieldWrap label={label} error={error}>
    <input ref={ref} className={`${baseClasses} ${className}`} {...rest} />
  </FieldWrap>
));
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...rest }, ref) => (
    <FieldWrap label={label} error={error}>
      <textarea ref={ref} className={`${baseClasses} ${className}`} {...rest} />
    </FieldWrap>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...rest }, ref) => (
    <FieldWrap label={label} error={error}>
      <select ref={ref} className={`${baseClasses} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrap>
  )
);
Select.displayName = 'Select';
