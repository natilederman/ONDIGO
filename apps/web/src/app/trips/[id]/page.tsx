'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { tripQueries, requestQueries, tripThreadQueries, afterStreet, type TripWithDriver, type DeliveryRequest, type ThreadSummary } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { DriverBadge } from '@/components/DriverBadge';
import { matchRequests, type TripMatch } from '@/lib/route';
import { TripConversation } from '@/components/TripConversation';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [trip, setTrip] = useState<TripWithDriver | null>(null);
  const [matches, setMatches] = useState<DeliveryRequest[]>([]);
  // the member's own thread with the driver, or, for the driver, everyone who wrote
  const [myThread, setMyThread] = useState<string | null | undefined>(undefined);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);

  useEffect(() => {
    tripQueries.getTrip(client, id).then(setTrip);
    requestQueries.listOpenRequests(client).then(setMatches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isDriver = !!user && !!trip && trip.driver_id === user.id;
  useEffect(() => {
    if (!user || !trip) return;
    if (isDriver) tripThreadQueries.myThreads(client).then((all) => setThreads(all.filter((t) => t.trip_id === trip.id)));
    else tripThreadQueries.findThread(client, trip.id, user.id).then((t) => setMyThread(t?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, trip?.id, isDriver]);

  if (authLoading || !trip || !user) return null;
  const driverName = trip.driver?.full_name ?? 'the driver';

  // only what fits the vehicle, and only what is on this trip's way or starts where it starts
  const fits = matches.filter((r) => r.item_weight_kg <= trip.capacity_weight_kg);
  const { onTheWay, nearby } = matchRequests(
    { origin: { lat: trip.origin_lat, lng: trip.origin_lng }, destination: { lat: trip.destination_lat, lng: trip.destination_lng } },
    fits
  );
  const startCity = afterStreet(trip.origin_text).split(',')[0] || trip.origin_text;

  return (
    <div className="space-y-6">
      <div>
        <Badge>{trip.vehicle_type}</Badge>
        <h1 className="mt-3 text-2xl font-bold">
          {trip.origin_text} → {trip.destination_text}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Departs {new Date(trip.depart_at).toLocaleString()} · Capacity {trip.capacity_weight_kg}kg /{' '}
          {trip.capacity_size}
        </p>
        {trip.notes && <p className="mt-2 text-sm">{trip.notes}</p>}
      </div>

      <Card>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Driver</p>
        <Link href={`/profile/${trip.driver?.id}`} className="hover:underline">
          <DriverBadge driver={trip.driver} size={16} />
        </Link>
      </Card>

      {isDriver ? (
        <section>
          <h2 className="text-lg font-semibold">Messages about this trip</h2>
          {threads.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No one has written about this trip yet. Members can message you from this page.</p>
          ) : (
            <div className="mt-3 border-t border-ink">
              {threads.map((t) => (
                <Link key={t.id} href={`/messages/${t.id}`} className="flex items-baseline justify-between gap-4 border-b border-line px-1 py-3.5 hover:bg-ash/60">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{t.other_name}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {t.last_offer !== null ? `Offer: $${Number(t.last_offer).toFixed(0)}` : t.last_body || 'Answered an offer'}
                    </span>
                  </span>
                  {t.unread > 0 && (
                    <span className="tnum shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">{t.unread} new</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        myThread !== undefined && (
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">Message {driverName.split(' ')[0]}</h2>
              <span className="text-[12.5px] text-steel">Private between you and {driverName.split(' ')[0]}</span>
            </div>
            <TripConversation
              tripId={trip.id}
              threadId={myThread}
              me={user.id}
              otherId={trip.driver_id}
              otherName={driverName}
              asMember
              height={340}
            />
          </section>
        )
      )}

      <MapView
        markers={[
          { lat: trip.origin_lat, lng: trip.origin_lng, label: trip.origin_text, color: '#0A0A0A' },
          { lat: trip.destination_lat, lng: trip.destination_lng, label: trip.destination_text, color: '#FF5A1F' },
        ]}
        polyline={[
          [trip.origin_lat, trip.origin_lng],
          [trip.destination_lat, trip.destination_lng],
        ]}
      />

      <section>
        <h2 className="text-lg font-semibold">On your way</h2>
        <p className="mt-1 text-sm text-muted">Pickup and drop-off both sit along this trip, in that order.</p>
        {onTheWay.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing open along this route right now.</p>
        ) : (
          <MatchGrid items={onTheWay} />
        )}
      </section>

      {nearby.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Also starting in {startCity}</h2>
          <p className="mt-1 text-sm text-muted">Picked up near where you leave, going somewhere else. Worth a look if you can stretch the route.</p>
          <MatchGrid items={nearby} />
        </section>
      )}
    </div>
  );
}

function MatchGrid({ items }: { items: TripMatch[] }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {items.map(({ request: r, pickupOff, dropoffOff }) => (
        <Link key={r.id} href={`/requests/${r.id}`}>
          <Card className="h-full hover:border-ink">
            <p className="font-medium">{r.item_description}</p>
            <p className="mt-1 text-sm text-muted">
              {r.pickup_text} → {r.dropoff_text}
            </p>
            <p className="mt-2 text-sm">
              {r.pricing_mode === 'fixed' ? `$${r.fixed_price?.toFixed(2)} fixed` : `$${r.current_price?.toFixed(2)} current bid`}
            </p>
            {pickupOff !== undefined && (
              <p className="mt-1 text-xs text-steel">
                {Math.max(pickupOff, dropoffOff ?? 0) < 0.5 ? 'Right on your route' : `Up to ${Math.max(pickupOff, dropoffOff ?? 0).toFixed(1)} km off your route`}
              </p>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
