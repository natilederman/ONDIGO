'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  requestQueries,
  bidQueries,
  verificationQueries,
  ITEM_CATEGORIES,
  PLATFORM_FEE_RATE,
  vehicleClassForWeight,
  type DeliveryRequest,
  type BidWithDriver,
  type RequestContactDetails,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/AuthProvider';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BidList } from '@/components/BidList';
import { AddressPanel } from '@/components/AddressPanel';
import { formatDeadline, formatWindow } from '@/lib/format';
import { Route } from '@/components/Route';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loading: authLoading } = useRequireAuth();
  const { user, profile } = useAuth();
  const client = getSupabaseClient();
  const router = useRouter();

  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [bids, setBids] = useState<BidWithDriver[]>([]);
  const [contact, setContact] = useState<RequestContactDetails | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // why this signed-in person may not take the job, in a sentence; null when they may
  const [blocked, setBlocked] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, number>>({});

  // the bid form has to disappear the moment the clock runs out, not on reload
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    verificationQueries.getSettings(client).then(setSettings).catch(() => {});
    verificationQueries.whyCannotTake(client, id).then(setBlocked).catch(() => setBlocked(null));
    requestQueries.getRequest(client, id).then(setRequest);
    // RLS decides who gets this row: the sender always, the matched driver once matched.
    requestQueries.getContactDetails(client, id).then(setContact).catch(() => setContact(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!request || request.pricing_mode !== 'auction') return;
    bidQueries.listBidsForRequest(client, request.id).then(setBids);
    const unsubBids = bidQueries.subscribeToBids(client, request.id, setBids);
    const unsubRequest = requestQueries.subscribeToRequest(client, request.id, setRequest);
    return () => {
      unsubBids();
      unsubRequest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  // jump to the delivery once the request matches
  useEffect(() => {
    if (request?.status !== 'matched') return;
    client
      .from('deliveries')
      .select('id')
      .eq('request_id', request.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { id: string } | null;
        if (row) router.push(`/deliveries/${row.id}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.status]);

  if (authLoading || !request || !user) return null;

  const isOwner = user.id === request.sender_id;
  const isDriver = !isOwner && !!profile?.vehicle_type;
  const auction = request.pricing_mode === 'auction';
  const price = auction ? request.current_price : request.fixed_price;
  const biddingClosed =
    auction && (!request.bidding_ends_at || new Date(request.bidding_ends_at).getTime() <= now);
  const canBid = isDriver && request.status === 'open' && !biddingClosed && !blocked;
  const vehicleClass = request.vehicle_type_required ?? vehicleClassForWeight(request.item_weight_kg);
  const threshold = settings.value_threshold_screened ?? 1000;
  const needsScreened = (request.declared_value ?? 0) > threshold;
  const category = ITEM_CATEGORIES.find((c) => c.value === request.declared_category)?.label;
  const fee = PLATFORM_FEE_RATE;
  const net = (amount: number) => Math.max(0, amount * (1 - fee));

  const placeBid = async () => {
    setBusy(true);
    setError(null);
    try {
      await bidQueries.placeBid(client, request.id, Number(bidAmount));
      setBidAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place bid');
    } finally {
      setBusy(false);
    }
  };

  const acceptBid = async (bidId: string) => {
    setBusy(true);
    setError(null);
    try {
      const delivery = await bidQueries.acceptBid(client, bidId);
      router.push(`/deliveries/${delivery.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept bid');
      setBusy(false);
    }
  };

  const acceptFixed = async () => {
    setBusy(true);
    setError(null);
    try {
      const delivery = await bidQueries.acceptFixedPriceRequest(client, request.id);
      router.push(`/deliveries/${delivery.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This request is no longer available');
      setBusy(false);
    }
  };

  return (
    <div>
      {/* the route is the headline; the item is its caption */}
      <Route from={request.pickup_text} to={request.dropoff_text} size="lg" />
      <p className="mt-3 text-[15px] text-muted">{request.item_description}</p>

      <dl className="mt-7 grid grid-cols-2 border-t border-ink sm:grid-cols-3">
        {[
          ['Size', request.item_size],
          ['Weight', `${request.item_weight_kg}kg`],
          ['Pricing', auction ? 'Auction' : 'Fixed price'],
          ['Collect', formatWindow(request.pickup_from, request.pickup_until, request.needed_by)],
          ['Deliver by', formatDeadline(request.deliver_by, request.needed_by)],
          ['Handling', request.fragile ? 'Fragile' : 'Standard'],
          ['Declared value', request.declared_value != null ? `$${Number(request.declared_value).toLocaleString()}` : 'Not declared'],
          ['Kind', category ?? 'Not stated'],
          ['Who can carry it', vehicleClass === 'truck' ? 'Truck on file' : vehicleClass === 'car' ? 'Car or truck on file' : 'Any identified courier'],
        ].map(([k, v]) => (
          <div key={k as string} className="border-b border-line py-4 pr-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">{k}</dt>
            <dd className="mt-1.5 text-[15px] font-medium first-letter:uppercase">{v}</dd>
          </div>
        ))}
      </dl>
      {request.contents && (
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          <b className="font-semibold text-ink">Contents:</b> {request.contents}
          {request.open_box_required && <span className="text-steel"> · Packaging left open for inspection at pickup.</span>}
        </p>
      )}
      {needsScreened && (
        <p className="mt-2 text-[13px] text-muted">Above ${threshold.toLocaleString()}: only drivers with a completed records check may take this job.</p>
      )}
      {request.handling_notes && (
        <p className="mt-4 border-l-2 border-line-strong pl-3 text-[14px] leading-relaxed text-muted">
          {request.handling_notes}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 border-b border-ink pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
          Handover details
        </h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <AddressPanel
            title="Pickup"
            end="pickup"
            line1={request.pickup_text}
            line2={contact?.pickup_line2}
            postcode={contact?.pickup_postcode}
            name={contact?.pickup_contact_name}
            phone={contact?.pickup_contact_phone}
            notes={contact?.pickup_instructions}
            handoff={request.pickup_handoff}
            when={formatWindow(request.pickup_from, request.pickup_until, request.needed_by)}
            locked={!contact}
          />
          <AddressPanel
            title="Drop-off"
            end="dropoff"
            line1={request.dropoff_text}
            line2={contact?.dropoff_line2}
            postcode={contact?.dropoff_postcode}
            name={contact?.dropoff_contact_name}
            phone={contact?.dropoff_contact_phone}
            notes={contact?.dropoff_instructions}
            handoff={request.dropoff_handoff}
            when={`By ${formatDeadline(request.deliver_by, request.needed_by)}`}
            locked={!contact}
          />
        </div>
      </section>

      <div className="mt-8 border border-line">
        <MapView
          markers={[
            {
              lat: request.pickup_lat,
              lng: request.pickup_lng,
              label: `Pickup: ${request.pickup_text}`,
              color: '#0A0B0D',
            },
            {
              lat: request.dropoff_lat,
              lng: request.dropoff_lng,
              label: `Drop-off: ${request.dropoff_text}`,
              color: '#D92C1F',
            },
          ]}
          polyline={[
            [request.pickup_lat, request.pickup_lng],
            [request.dropoff_lat, request.dropoff_lng],
          ]}
        />
      </div>

      {/* price and clock, the two numbers that decide everything */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink pt-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
            {auction ? 'Current price' : 'Fixed price'}
          </span>
          <div className="tnum mt-1.5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-none tracking-display">
            {typeof price === 'number' ? `$${price.toFixed(2)}` : 'n/a'}
          </div>
        </div>

        {auction && request.bidding_ends_at && (
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
              Bidding closes
            </span>
            <div className="mt-1.5 text-[clamp(1.5rem,2.8vw,2.1rem)] leading-none">
              <CountdownTimer endsAt={request.bidding_ends_at} />
            </div>
          </div>
        )}

        {!auction && isDriver && request.status === 'open' && !blocked && (
          <div className="text-right">
            <Button loading={busy} onClick={acceptFixed}>
              Accept and carry this
            </Button>
            <p className="mt-2 text-[12px] text-steel">You keep ${net(request.fixed_price ?? 0).toFixed(2)} after the {Math.round(fee * 100)}% fee.</p>
          </div>
        )}
      </div>

      {isDriver && request.status === 'open' && blocked && (
        <div className="mt-8 border-l-2 border-ink pl-4">
          <p className="text-[15px] font-medium">{blocked}</p>
          <Link href="/verify" className="mt-2 inline-block text-[13.5px] underline">Get ready to carry</Link>
        </div>
      )}

      {auction && (
        <div className="mt-8">
          {canBid && (
            <div className="mb-7 flex items-end gap-3">
              <div className="flex-1">
                <Input
                  id="bid-amount"
                  label="Your bid"
                  type="number"
                  inputMode="decimal"
                  placeholder={`Below $${request.current_price?.toFixed(2)}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
              </div>
              <Button loading={busy} onClick={placeBid} className="mb-[1px]">
                Place bid
              </Button>
            </div>
          )}
          {canBid && (
            <p className="-mt-4 mb-7 text-[12.5px] leading-relaxed text-steel">
              {bidAmount && Number(bidAmount) > 0 ? `You would keep $${net(Number(bidAmount)).toFixed(2)} after the ${Math.round(fee * 100)}% fee. ` : `ONDIGO keeps ${Math.round(fee * 100)}% of the agreed price. `}
              Your personal auto policy probably does not cover carrying goods for payment; ONDIGO does not insure your vehicle.
            </p>
          )}

          {isDriver && request.status === 'open' && biddingClosed && (
            <p className="mb-7 border-l-2 border-line pl-3 text-sm text-muted">
              Bidding has closed on this request. The lowest standing bid is being matched.
            </p>
          )}
          <BidList bids={bids} isOwner={isOwner && request.status === 'open'} onAccept={acceptBid} />
        </div>
      )}

      {request.status !== 'open' && (
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.1em] text-steel">
          Status: {request.status}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-signal pl-3 text-sm text-signal">
          {error}
        </p>
      )}
    </div>
  );
}
