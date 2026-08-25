'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deliveryQueries, type Delivery } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';

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
      <h1 className="text-2xl font-bold">Your deliveries</h1>
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : deliveries.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing yet — matched requests will show up here.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {deliveries.map((d) => (
            <Link key={d.id} href={`/deliveries/${d.id}`}>
              <Card className="flex items-center justify-between hover:border-ink">
                <div>
                  <p className="font-medium">
                    {d.driver_id === user.id ? 'Carrying for someone' : 'Being carried for you'}
                  </p>
                  <p className="text-sm text-muted">${d.agreed_price.toFixed(2)}</p>
                </div>
                <Badge>{d.status.replace('_', ' ')}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
