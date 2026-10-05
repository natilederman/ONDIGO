'use client';

/** Every conversation I am in: with drivers about their trips, and with members about mine. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripThreadQueries, type ThreadSummary } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageHeader, Notice } from '@/components/Page';

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';
const street = (s: string) => s.split(',').slice(0, 2).join(',');

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);

  useEffect(() => {
    if (!user) return;
    tripThreadQueries.myThreads(client).then(setThreads).catch(() => setThreads([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (authLoading || !user) return null;

  return (
    <div>
      <PageHeader title="Messages" lede="Conversations about trips, before anything is booked. Only the two people in a conversation can read it." />
      {threads === null ? (
        <Notice>Loading messages…</Notice>
      ) : threads.length === 0 ? (
        <Notice>
          No conversations yet. Open a{' '}
          <Link href="/trips" className="font-medium text-ink underline">trip</Link>{' '}
          and message its driver to ask a question or offer a price.
        </Notice>
      ) : (
        <div className="border-t-2 border-ink">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/messages/${t.id}`}
              className={`block border-b px-1 py-4 transition-colors duration-150 hover:bg-ash/60 ${t.unread > 0 ? 'border-ink' : 'border-line'}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[16px] font-semibold">
                  {t.other_name}
                  <span className={`ml-2 ${LABEL}`}>{t.role === 'driver' ? 'About your trip' : 'Driver'}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5 text-[12px] text-steel">
                  {t.unread > 0 && <span className="tnum rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">{t.unread} new</span>}
                  {ago(t.last_at)}
                </span>
              </div>
              <div className="mt-1 truncate text-[13px] text-muted">
                {street(t.origin_text)} <span aria-hidden className="text-steel">&#8594;</span> {street(t.destination_text)}
              </div>
              <div className={`mt-1.5 truncate text-[14px] ${t.unread > 0 ? 'font-medium text-ink' : 'text-muted'}`}>
                {t.last_offer !== null ? `Offer: $${Number(t.last_offer).toFixed(0)}` : t.last_body || 'Answered an offer'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
