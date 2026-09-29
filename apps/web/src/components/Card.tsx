import type { HTMLAttributes } from 'react';

/**
 * Structure comes from hairline rules, not elevation. A "card" here is a ruled
 * block on the page ground, never a floating rounded container.
 */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border border-line bg-paper p-6 ${className}`} {...rest} />;
}

/** A section opened by a single rule above it, for stacked content. */
export function Panel({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-t border-ink pt-5 ${className}`} {...rest} />;
}
