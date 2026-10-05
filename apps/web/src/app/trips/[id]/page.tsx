'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { tripQueries, requestQueries, afterStreet, type TripWithDriver, type DeliveryRequest } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { DriverBadge } from '@/components/DriverBadge';
import { matchRequests, type TripMatch } from '@/lib/route';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [trip, setTrip] = useState<TripWithDriver | null>(null);
  const [matches, setMatches] = useState<DeliveryRequest[]>([]);

  useEffect(() => {
    tripQueries.getTrip(client, id).then(setTrip);
    requestQueries.listOpenRequests(client).then(setMatches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (authLoading || !trip) return null;

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
