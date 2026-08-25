'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  requestQueries,
  bidQueries,
  type DeliveryRequest,
  type BidWithDriver,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/AuthProvider';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BidList } from '@/components/BidList';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), { ssr: false });

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const { loading: authLoading } = useRequireAuth();
  const { user, profile } = useAuth();
  const client = getSupabaseClient();
  const router = useRouter();

  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [bids, setBids] = useState<BidWithDriver[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    requestQueries.getRequest(client, params.id).then(setRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  // find the resulting delivery once matched, so we can jump to it
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge tone={request.pricing_mode === 'auction' ? 'accent' : 'muted'}>
          {request.pricing_mode === 'auction' ? 'Auction' : 'Fixed price'}
        </Badge>
        {request.status !== 'open' && <Badge>{request.status}</Badge>}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{request.item_description}</h1>
        <p className="mt-1 text-sm text-muted">
          {request.item_size} · {request.item_weight_kg}kg · needed by{' '}
          {new Date(request.needed_by).toLocaleDateString()}
        </p>
      </div>

      <MapView
        markers={[
          { lat: request.pickup_lat, lng: request.pickup_lng, label: `Pickup: ${request.pickup_text}`, color: '#0A0A0A' },
          { lat: request.dropoff_lat, lng: request.dropoff_lng, label: `Drop-off: ${request.dropoff_text}`, color: '#FF5A1F' },
        ]}
        polyline={[
          [request.pickup_lat, request.pickup_lng],
          [request.dropoff_lat, request.dropoff_lng],
        ]}
      />

      <Card>
        {request.pricing_mode === 'fixed' ? (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">${request.fixed_price?.toFixed(2)}</span>
            {isDriver && request.status === 'open' && (
              <Button loading={busy} onClick={acceptFixed}>
                Accept &amp; carry this
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">${request.current_price?.toFixed(2)}</span>
              {request.bidding_ends_at && <CountdownTimer endsAt={request.bidding_ends_at} />}
            </div>
            {isDriver && request.status === 'open' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Below $${request.current_price?.toFixed(2)}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <Button loading={busy} onClick={placeBid}>
                  Place bid
                </Button>
              </div>
            )}
            <BidList bids={bids} isOwner={isOwner && request.status === 'open'} onAccept={acceptBid} />
          </div>
        )}
        {error && <p className="mt-3 text-sm text-accent-dark">{error}</p>}
      </Card>
    </div>
  );
}
