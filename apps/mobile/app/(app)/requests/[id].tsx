import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { requestQueries, bidQueries, type DeliveryRequest, type BidWithDriver } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { CountdownTimer } from '../../../src/components/CountdownTimer';
import { BidList } from '../../../src/components/BidList';
import { OndigoMapView } from '../../../src/components/MapView';
import { colors } from '../../../src/lib/theme';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = getSupabaseClient();
  const { user, profile } = useAuth();

  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [bids, setBids] = useState<BidWithDriver[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    requestQueries.getRequest(client, id).then(setRequest);
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

  useEffect(() => {
    if (request?.status !== 'matched') return;
    client
      .from('deliveries')
      .select('id')
      .eq('request_id', request.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { id: string } | null;
        if (row) router.replace(`/(app)/deliveries/${row.id}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.status]);

  if (!request || !user) return null;

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
      router.replace(`/(app)/deliveries/${delivery.id}`);
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
      router.replace(`/(app)/deliveries/${delivery.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This request is no longer available');
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.row}>
        <Badge tone={request.pricing_mode === 'auction' ? 'accent' : 'muted'}>
          {request.pricing_mode === 'auction' ? 'Auction' : 'Fixed price'}
        </Badge>
        {request.status !== 'open' && <Badge>{request.status}</Badge>}
      </View>

      <Text style={styles.title}>{request.item_description}</Text>
      <Text style={styles.subtitle}>
        {request.item_size} · {request.item_weight_kg}kg · needed by{' '}
        {new Date(request.needed_by).toLocaleDateString()}
      </Text>

      <OndigoMapView
        markers={[
          { lat: request.pickup_lat, lng: request.pickup_lng, label: `Pickup: ${request.pickup_text}`, color: colors.ink },
          { lat: request.dropoff_lat, lng: request.dropoff_lng, label: `Drop-off: ${request.dropoff_text}`, color: colors.accent },
        ]}
        polyline={[
          [request.pickup_lat, request.pickup_lng],
          [request.dropoff_lat, request.dropoff_lng],
        ]}
      />

      <Card style={{ gap: 14 }}>
        {request.pricing_mode === 'fixed' ? (
          <View style={styles.row}>
            <Text style={styles.price}>${request.fixed_price?.toFixed(2)}</Text>
            {isDriver && request.status === 'open' && (
              <Button loading={busy} onPress={acceptFixed}>
                Accept &amp; carry this
              </Button>
            )}
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <View style={styles.row}>
              <Text style={styles.price}>${request.current_price?.toFixed(2)}</Text>
              {request.bidding_ends_at && <CountdownTimer endsAt={request.bidding_ends_at} />}
            </View>
            {isDriver && request.status === 'open' && (
              <View style={styles.bidRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    keyboardType="numeric"
                    placeholder={`Below $${request.current_price?.toFixed(2)}`}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                  />
                </View>
                <Button loading={busy} onPress={placeBid}>
                  Place bid
                </Button>
              </View>
            )}
            <BidList bids={bids} isOwner={isOwner && request.status === 'open'} onAccept={acceptBid} />
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.paper },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
  price: { fontSize: 22, fontWeight: '700', color: colors.ink },
  bidRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  error: { color: colors.accentDark, fontSize: 13 },
});
