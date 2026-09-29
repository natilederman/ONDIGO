'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deliveryQueries, type Delivery } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageHeader, TableHead, Notice } from '@/components/Page';

const COLS = 'md:grid-cols-[1.55fr_1fr_132px]';

/** In-flight deliveries keep the heavy rule; finished ones drop to a hairline. */
const SETTLED = new Set(['completed', 'disputed']);

export default function DeliveriesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    deliveryQueries.listMyDeliveries(client, user.id).then((d) => {
      setDeliveries(d);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (authLoading || !user) return null;

  return (
    <div>
      <PageHeader
        title="Your deliveries"
        lede="Everything you are carrying, and everything being carried for you."
      />

      {loading ? (
        <Notice>Loading deliveries…</Notice>
      ) : deliveries.length === 0 ? (
        <Notice>
          Nothing yet. Matched requests show up here once a bid is accepted.{' '}
          <Link href="/requests" className="font-medium text-ink underline">
            Browse requests
          </Link>
          .
        </Notice>
      ) : (
        <>
          <TableHead cols={['Delivery', 'Status', 'Agreed']} className={COLS} />
          <div>
            {deliveries.map((d) => {
              const done = SETTLED.has(d.status);
              return (
                <Link
                  key={d.id}
                  href={`/deliveries/${d.id}`}
                  className={`land row-wash block border-b px-1 py-5 md:grid md:items-center md:gap-6 ${COLS} ${
                    done ? 'border-line' : 'border-b-2 border-ink'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 md:contents">
                    <div
                      className={`text-[clamp(1.15rem,2vw,1.6rem)] font-semibold leading-[1.14] tracking-display md:order-1 ${
                        done ? 'opacity-45' : ''
                      }`}
                    >
                      {d.driver_id === user.id ? 'Carrying for someone' : 'Being carried for you'}
                    </div>
                    <div
                      className={`tnum shrink-0 text-right text-[clamp(1.05rem,1.5vw,1.3rem)] font-semibold tracking-display md:order-3 ${
                        done ? 'opacity-45' : ''
                      }`}
                    >
                      ${d.agreed_price.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-2 md:contents">
                    <div className="text-[13px] font-semibold uppercase tracking-[0.1em] text-steel md:order-2">
                      {d.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-1 pt-4 text-[13px] text-steel">
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'}
          </div>
        </>
      )}
    </div>
  );
}
