'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  deliveryQueries,
  requestQueries,
  trackingQueries,
  reviewQueries,
  type Delivery,
  type DeliveryRequest,
  type Transaction,
  type LocationPing,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chat } from '@/components/Chat';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PanicButton } from '@/components/PanicButton';
import { StarRating } from '@/components/StarRating';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

const STATUS_STEPS = ['pending_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'] as const;

export default function DeliveryDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [ping, setPing] = useState<LocationPing | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    deliveryQueries.getDelivery(client, params.id).then(setDelivery);
    deliveryQueries.getTransaction(client, params.id).then(setTransaction);
    trackingQueries.latestPing(client, params.id).then(setPing);
    const unsubDelivery = deliveryQueries.subscribeToDelivery(client, params.id, setDelivery);
    const unsubPings = trackingQueries.subscribeToPings(client, params.id, setPing);
    return () => {
      unsubDelivery();
      unsubPings();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (delivery) requestQueries.getRequest(client, delivery.request_id).then(setRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.request_id]);

  useEffect(() => {
    if (user) reviewQueries.hasReviewed(client, params.id, user.id).then(setReviewed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, params.id]);

  // Live GPS: whichever participant is viewing while the delivery is in transit shares their position.
  useEffect(() => {
    if (delivery?.status !== 'in_transit' || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => trackingQueries.recordPing(client, params.id, pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.status, params.id]);

  if (authLoading || !delivery || !request || !user) return null;

  const isSender = user.id === delivery.sender_id;
  const isDriver = user.id === delivery.driver_id;
  const otherPartyId = isSender ? delivery.driver_id : delivery.sender_id;
  const stepIndex = STATUS_STEPS.indexOf(delivery.status as (typeof STATUS_STEPS)[number]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const markers = [
    { lat: request.pickup_lat, lng: request.pickup_lng, label: 'Pickup', color: '#0A0A0A' },
    { lat: request.dropoff_lat, lng: request.dropoff_lng, label: 'Drop-off', color: '#111' },
    ...(ping ? [{ lat: ping.lat, lng: ping.lng, label: 'Live location', color: '#FF5A1F' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{request.item_description}</h1>
          <p className="mt-1 text-sm text-muted">
            {request.pickup_text} → {request.dropoff_text} · ${delivery.agreed_price.toFixed(2)}
          </p>
        </div>
        <PanicButton deliveryId={delivery.id} />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {STATUS_STEPS.map((s, i) => (
          <Badge key={s} tone={i <= stepIndex ? 'default' : 'muted'}>
            {s.replace('_', ' ')}
          </Badge>
        ))}
      </div>

      <MapView markers={markers} />

      {delivery.status !== 'completed' && delivery.status !== 'disputed' && (
      <Card className="space-y-3">
        <h2 className="font-semibold">Progress</h2>
        {delivery.status === 'pending_pickup' && (isSender || isDriver) && (
          <PhotoUpload
            deliveryId={delivery.id}
            kind="pickup"
            existingPath={delivery.pickup_photo_url}
            onUploaded={(path) => run(() => deliveryQueries.setPickupPhoto(client, delivery.id, path).then(() => {}))}
          />
        )}
        {delivery.status === 'picked_up' && isDriver && (
          <Button loading={busy} onClick={() => run(() => deliveryQueries.updateDeliveryStatus(client, delivery.id, 'in_transit').then(() => {}))}>
            Start transit
          </Button>
        )}
        {(delivery.status === 'in_transit' || delivery.status === 'picked_up') && (isSender || isDriver) && (
          <PhotoUpload
            deliveryId={delivery.id}
            kind="dropoff"
            existingPath={delivery.dropoff_photo_url}
            onUploaded={(path) => run(() => deliveryQueries.setDropoffPhoto(client, delivery.id, path).then(() => {}))}
          />
        )}
      </Card>
      )}

      {error && <p className="text-sm text-accent-dark">{error}</p>}

      <Card className="space-y-3">
        <h2 className="font-semibold">Escrow (simulated payment)</h2>
        {!transaction ? (
          isSender ? (
            <Button
              loading={busy}
              onClick={() => run(() => deliveryQueries.fundEscrow(client, delivery.id).then(setTransaction))}
            >
              Fund escrow — ${delivery.agreed_price.toFixed(2)} (simulated, no real card)
            </Button>
          ) : (
            <p className="text-sm text-muted">Waiting for the sender to fund escrow.</p>
          )
        ) : (
          <div className="flex items-center justify-between">
            <Badge tone={transaction.status === 'held' ? 'accent' : 'default'}>{transaction.status}</Badge>
            {isSender && transaction.status === 'held' && delivery.status === 'delivered' && (
              <Button
                loading={busy}
                onClick={() => run(() => deliveryQueries.confirmDelivery(client, delivery.id).then((d) => setDelivery(d)))}
              >
                Confirm delivery received
              </Button>
            )}
          </div>
        )}
      </Card>

      <div>
        <h2 className="mb-2 font-semibold">Messages</h2>
        <Chat deliveryId={delivery.id} />
      </div>

      {delivery.status === 'completed' && !reviewed && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Rate this delivery</h2>
          <StarRating value={rating} onChange={setRating} />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a note (optional)"
            className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm"
          />
          <Button
            loading={busy}
            onClick={() =>
              run(async () => {
                await reviewQueries.createReview(client, user.id, {
                  deliveryId: delivery.id,
                  revieweeId: otherPartyId,
                  rating,
                  comment: comment || undefined,
                });
                setReviewed(true);
              })
            }
          >
            Submit review
          </Button>
        </Card>
      )}
    </div>
  );
}
