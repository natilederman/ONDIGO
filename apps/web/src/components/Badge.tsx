import type { ReactNode } from 'react';

/**
 * State reads from line form and weight rather than fill colour, so the whole
 * interface stays legible in greyscale. `signal` is reserved for time running out.
 */
export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'muted' | 'signal';
}) {
  const tones = {
    default: 'border-ink text-ink',
    accent: 'border-ink text-ink',
    muted: 'border-line text-steel',
    signal: 'border-signal text-signal',
  } as const;

  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
