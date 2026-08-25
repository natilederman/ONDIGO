'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestQueries, type DeliveryRequest } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { CountdownTimer } from '@/components/CountdownTimer';

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery requests</h1>
        <Link href="/requests/new" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
          Post a request
        </Link>
      </div>
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No open requests right now.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {requests.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`}>
              <Card className="h-full hover:border-ink">
                <div className="flex items-center justify-between">
                  <Badge tone={r.pricing_mode === 'auction' ? 'accent' : 'muted'}>
                    {r.pricing_mode === 'auction' ? 'Auction' : 'Fixed price'}
                  </Badge>
                  {r.pricing_mode === 'auction' && r.bidding_ends_at && <CountdownTimer endsAt={r.bidding_ends_at} />}
                </div>
                <p className="mt-3 font-medium">{r.item_description}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.pickup_text} → {r.dropoff_text}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {r.pricing_mode === 'fixed' ? `$${r.fixed_price?.toFixed(2)}` : `$${r.current_price?.toFixed(2)}`}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
