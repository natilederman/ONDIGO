'use client';

import { useEffect, useState } from 'react';

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  // past a day the seconds stop meaning anything; the day count is what you read
  if (d > 0) return `${d}d ${h}:${pad(m)}:${pad(s)}`;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function CountdownTimer({ endsAt, className = '' }: { endsAt: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = new Date(endsAt).getTime() - now;
  const closed = remaining <= 0;

  return (
    <span className={`tnum font-semibold tracking-display ${closed ? 'text-steel' : 'text-signal'} ${className}`}>
      {closed ? 'Closed' : formatRemaining(remaining)}
    </span>
  );
}
