'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestQueries, type DeliveryRequest } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { CountdownTimer } from '@/components/CountdownTimer';
import { PageHeader, TableHead, Notice } from '@/components/Page';
import { Route } from '@/components/Route';

const COLS = 'md:grid-cols-[1.55fr_1fr_108px_128px]';

export default function RequestsPage() {
  const { loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestQueries.listOpenRequests(client).then((r) => {
      setRequests(r);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) return null;

  return (
    <div>
      <PageHeader
        title="Delivery requests"
        lede="Open departures looking for a driver. Auctions close on their own clock."
        action={
          <Link
            href="/requests/new"
            className="inline-flex items-center whitespace-nowrap rounded-full border border-ink bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Post a request
          </Link>
        }
      />

      {loading ? (
        <Notice>Loading departures…</Notice>
      ) : requests.length === 0 ? (
        <Notice>
          No open requests right now.{' '}
          <Link href="/requests/new" className="font-medium text-ink underline">
            Post the first one
          </Link>
          .
        </Notice>
      ) : (
        <>
          <TableHead cols={['Route', 'Item', 'Price', 'Closes']} className={COLS} />
          <div>
            {requests.map((r) => {
              const auction = r.pricing_mode === 'auction';
              const price = auction ? r.current_price : r.fixed_price;
              return (
                <Link
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className={`land row-wash block border-b px-1 py-5 md:grid md:items-center md:gap-6 ${COLS} ${
                    auction ? 'border-dashed border-line' : 'border-line'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 md:contents">
                    <Route from={r.pickup_text} to={r.dropoff_text} size="sm" className="md:order-1" />

                    <div className="shrink-0 text-right md:order-4">
                      <span className="block text-[clamp(1rem,1.7vw,1.35rem)]">
                        {auction && r.bidding_ends_at ? (
                          <CountdownTimer endsAt={r.bidding_ends_at} />
                        ) : (
                          <span className="font-semibold tracking-display">Fixed</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
                        {auction ? 'Auction' : 'No bidding'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-4 md:contents">
                    <div className="text-[14.5px] leading-snug text-muted md:order-2">
                      {r.item_description}
                    </div>
                    <div className="tnum shrink-0 text-right text-[clamp(1.05rem,1.5vw,1.3rem)] font-semibold tracking-display md:order-3">
                      {typeof price === 'number' ? `$${price.toFixed(2)}` : 'n/a'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-1 pt-4 text-[13px] text-steel">
            {requests.length} open {requests.length === 1 ? 'request' : 'requests'}
          </div>
        </>
      )}
    </div>
  );
}
