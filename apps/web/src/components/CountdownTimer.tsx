'use client';

import { useEffect, useState } from 'react';

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Closed';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = new Date(endsAt).getTime() - now;
  const closed = remaining <= 0;

  return (
    <span className={closed ? 'font-medium text-muted' : 'font-medium text-accent-dark'}>
      {closed ? 'Bidding closed' : `${formatRemaining(remaining)} left`}
    </span>
  );
}
