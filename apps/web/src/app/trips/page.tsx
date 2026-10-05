'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripQueries, type TripWithDriver } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DriverBadge } from '@/components/DriverBadge';
import { PageHeader, TableHead, Notice } from '@/components/Page';
import { Route } from '@/components/Route';
import { PlaceFilter, placeMatches, usePlaceEnds, usePlaceFilter } from '@/components/PlaceFilter';

const COLS = 'md:grid-cols-[1.55fr_1fr_120px_132px]';

export default function TripsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [trips, setTrips] = useState<TripWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const { ends, names, ready } = usePlaceEnds(trips, (t) => [t.origin_lat, t.origin_lng, t.destination_lat, t.destination_lng], (t) => t.id);
  const [filter, setFilter] = usePlaceFilter();
  const shown = trips.filter((t) => placeMatches(ends[t.id], filter));

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
      <PageHeader
        title="Trips with room in them"
        lede="Drivers already making the journey, and what they can still fit."
        action={
          <Link
            href="/trips/new"
            className="inline-flex items-center whitespace-nowrap rounded-full border border-ink bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Post a trip
          </Link>
        }
      />

      {loading ? (
        <Notice>Loading trips…</Notice>
      ) : trips.length === 0 ? (
        <Notice>
          No trips posted yet.{' '}
          <Link href="/trips/new" className="font-medium text-ink underline">
            Post the first one
          </Link>
          .
        </Notice>
      ) : (
        <>
          <PlaceFilter ends={ends} names={names} ready={ready} value={filter} onChange={setFilter} total={trips.length} shown={shown.length} noun={['trip', 'trips']} dirLabels={{ from: 'Starting here', to: 'Ending here' }} />
          {shown.length === 0 ? (
            <Notice>
              No trips through this place yet.{' '}
              <button type="button" onClick={() => setFilter({ state: null, city: null, dir: 'any' })} className="font-medium text-ink underline">Show everything</button>
            </Notice>
          ) : (
          <>
          <TableHead cols={['Route', 'Driver', 'Capacity', 'Departs']} className={COLS} />
          <div>
            {shown.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className={`land row-wash block border-b border-line px-1 py-5 md:grid md:items-center md:gap-6 ${COLS}`}
              >
                <div className="flex items-baseline justify-between gap-4 md:contents">
                  <Route from={t.origin_text} to={t.destination_text} size="sm" className="md:order-1" />

                  <div className="shrink-0 text-right md:order-4">
                    <span className="tnum block text-[clamp(1rem,1.6vw,1.25rem)] font-semibold tracking-display">
                      {new Date(t.depart_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
                      {t.vehicle_type}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-4 md:contents">
                  <div className="md:order-2">
                    <span className="flex items-center gap-2">
                      <DriverBadge driver={t.driver} />
                      {/* your own trips: messages arrive there rather than go out */}
                      {t.driver_id === user?.id && (
                        <span className="border border-ink px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-[0.1em]">Your trip</span>
                      )}
                    </span>
                    {t.notes && (
                      <p className="mt-1 line-clamp-1 text-[13px] text-steel">{t.notes}</p>
                    )}
                  </div>
                  <div className="tnum min-w-0 max-w-[45%] shrink-0 text-right text-[13px] text-muted md:order-3 md:max-w-none">
                    {t.capacity_weight_kg}kg
                    <span className="mt-0.5 block break-words text-[11px] uppercase tracking-[0.1em] text-steel">
                      {t.capacity_size}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
