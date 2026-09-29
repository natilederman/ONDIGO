import type { ReactNode } from 'react';

export function PageHeader({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-5 pb-6 sm:flex-row sm:items-end">
      <div>
        <h1 className="max-w-[24ch] text-[clamp(1.5rem,2.4vw,1.95rem)] font-semibold leading-[1.1] tracking-display text-balance">
          {title}
        </h1>
        {lede && <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3.5">{action}</div>}
    </div>
  );
}

/** Column headings for a ruled table. Hidden on narrow widths, where rows restack. */
export function TableHead({ cols, className = '' }: { cols: string[]; className?: string }) {
  return (
    <div
      aria-hidden
      className={`hidden items-end gap-6 border-b border-ink px-1 pb-2.5 text-[11px] font-semibold tracking-[0.1em] text-steel md:grid ${className}`}
    >
      {cols.map((c, i) => (
        <span key={c} className={i === 0 || i === 1 ? '' : 'text-right'}>
          {c}
        </span>
      ))}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-line px-1 pt-6 text-[14.5px] text-muted">{children}</p>
  );
}
