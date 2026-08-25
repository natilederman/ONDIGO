'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripQueries, type TripWithDriver } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { DriverBadge } from '@/components/DriverBadge';

export default function TripsPage() {
  const { loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [trips, setTrips] = useState<TripWithDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripQueries.listOpenTrips(client).then((t) => {
      setTrips(t);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link href="/trips/new" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
          Post a trip
        </Link>
      </div>
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No trips posted yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`}>
              <Card className="h-full hover:border-ink">
                <div className="flex items-center justify-between">
                  <Badge>{t.vehicle_type}</Badge>
                  <span className="text-xs text-muted">{new Date(t.depart_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-3 font-medium">
                  {t.origin_text} → {t.destination_text}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Capacity: {t.capacity_weight_kg}kg / {t.capacity_size}
                </p>
                {t.notes && <p className="mt-2 text-sm text-ink line-clamp-2">{t.notes}</p>}
                <div className="mt-3 border-t border-line pt-3">
                  <DriverBadge driver={t.driver} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
