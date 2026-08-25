import type { ReactNode } from 'react';

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones = {
    default: 'bg-ink text-paper',
    accent: 'bg-accent-light text-accent-dark',
    muted: 'bg-line text-muted',
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
