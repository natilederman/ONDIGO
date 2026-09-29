'use client';

import { useEffect, useRef, useState, use } from 'react';
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
  type RequestContactDetails,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chat } from '@/components/Chat';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PanicButton } from '@/components/PanicButton';
import { AddressPanel } from '@/components/AddressPanel';
import { formatDeadline, formatWindow } from '@/lib/format';
import { StarRating } from '@/components/StarRating';
import { Route } from '@/components/Route';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

const STATUS_STEPS = ['pending_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'] as const;

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [ping, setPing] = useState<LocationPing | null>(null);
  const [contact, setContact] = useState<RequestContactDetails | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    deliveryQueries.getDelivery(client, id).then(setDelivery);
    deliveryQueries.getTransaction(client, id).then(setTransaction);
    trackingQueries.latestPing(client, id).then(setPing);
    const unsubDelivery = deliveryQueries.subscribeToDelivery(client, id, setDelivery);
    const unsubPings = trackingQueries.subscribeToPings(client, id, setPing);
    return () => {
      unsubDelivery();
      unsubPings();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!delivery) return;
    requestQueries.getRequest(client, delivery.request_id).then(setRequest);
    requestQueries.getContactDetails(client, delivery.request_id).then(setContact).catch(() => setContact(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.request_id]);

  useEffect(() => {
    if (user) reviewQueries.hasReviewed(client, id, user.id).then(setReviewed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  // Live GPS: whichever participant is viewing while the delivery is in transit shares their position.
  useEffect(() => {
    if (delivery?.status !== 'in_transit' || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => trackingQueries.recordPing(client, id, pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.status, id]);

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
    { lat: request.pickup_lat, lng: request.pickup_lng, label: 'Pickup', color: '#0A0B0D' },
    { lat: request.dropoff_lat, lng: request.dropoff_lng, label: 'Drop-off', color: '#0A0B0D' },
    // the live position is the one thing on this map worth the accent
    ...(ping ? [{ lat: ping.lat, lng: ping.lng, label: 'Live location', color: '#D92C1F' }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Route from={request.pickup_text} to={request.dropoff_text} size="lg" />
          <p className="mt-2.5 text-[15px] text-muted">
            {request.item_description}
            <span className="tnum ml-2 font-medium text-ink">
              ${delivery.agreed_price.toFixed(2)}
            </span>
          </p>
        </div>
        <PanicButton deliveryId={delivery.id} />
      </div>

      {/* chain of custody: reached steps carry ink and a solid rule, the rest stay hairline */}
      <ol className="grid grid-cols-2 gap-x-6 sm:grid-cols-5 sm:gap-x-0">
        {STATUS_STEPS.map((s, i) => {
          const reached = i <= stepIndex;
          const current = i === stepIndex;
          return (
            <li key={s} className="min-w-0 pt-3" aria-current={current ? 'step' : undefined}>
              <div
                className={`mb-2.5 h-px w-full ${reached ? 'bg-ink' : 'bg-line'}`}
                style={{ height: current ? 2 : 1 }}
              />
              <span
                className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  reached ? 'text-ink' : 'text-steel'
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    reached ? 'bg-ink' : 'border border-line-strong'
                  }`}
                />
                <span className="truncate">{s.replace(/_/g, ' ')}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <MapView markers={markers} />

      <section>
        <h2 className="mb-3 border-b border-ink pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
          Handover details
        </h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <AddressPanel
            title="Pickup"
            end="pickup"
            handoff={request.pickup_handoff}
            when={formatWindow(request.pickup_from, request.pickup_until, request.needed_by)}
            line1={request.pickup_text}
            line2={contact?.pickup_line2}
            postcode={contact?.pickup_postcode}
            name={contact?.pickup_contact_name}
            phone={contact?.pickup_contact_phone}
            notes={contact?.pickup_instructions}
            locked={!contact}
          />
          <AddressPanel
            title="Drop-off"
            end="dropoff"
            handoff={request.dropoff_handoff}
            when={`By ${formatDeadline(request.deliver_by, request.needed_by)}`}
            line1={request.dropoff_text}
            line2={contact?.dropoff_line2}
            postcode={contact?.dropoff_postcode}
            name={contact?.dropoff_contact_name}
            phone={contact?.dropoff_contact_phone}
            notes={contact?.dropoff_instructions}
            locked={!contact}
          />
        </div>
      </section>

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

      {error && <p className="text-sm text-signal">{error}</p>}

      <Card className="space-y-3">
        <h2 className="font-semibold">Escrow (simulated payment)</h2>
        {!transaction ? (
          isSender ? (
            <Button
              loading={busy}
              onClick={() => run(() => deliveryQueries.fundEscrow(client, delivery.id).then(setTransaction))}
            >
              Fund escrow, ${delivery.agreed_price.toFixed(2)} (simulated, no real card)
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
            className="w-full border border-line px-3.5 py-2.5 text-sm"
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
