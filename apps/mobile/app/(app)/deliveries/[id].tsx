import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
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
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { Chat } from '../../../src/components/Chat';
import { PhotoCapture } from '../../../src/components/PhotoCapture';
import { PanicButton } from '../../../src/components/PanicButton';
import { StarRating } from '../../../src/components/StarRating';
import { OndigoMapView } from '../../../src/components/MapView';
import { colors } from '../../../src/lib/theme';

const STATUS_STEPS = ['pending_pickup', 'picked_up', 'in_transit', 'delivered', 'completed'] as const;

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = getSupabaseClient();
  const { user } = useAuth();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [ping, setPing] = useState<LocationPing | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

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
    if (delivery) requestQueries.getRequest(client, delivery.request_id).then(setRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.request_id]);

  useEffect(() => {
    if (user) reviewQueries.hasReviewed(client, id, user.id).then(setReviewed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  // Live GPS: whichever participant is viewing while the delivery is in transit shares their position.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (delivery?.status !== 'in_transit') return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 8000 },
        (pos) => trackingQueries.recordPing(client, id, pos.coords.latitude, pos.coords.longitude)
      );
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.status, id]);

  if (!delivery || !request || !user) return null;

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
    { lat: request.pickup_lat, lng: request.pickup_lng, label: 'Pickup', color: colors.ink },
    { lat: request.dropoff_lat, lng: request.dropoff_lng, label: 'Drop-off', color: '#333' },
    ...(ping ? [{ lat: ping.lat, lng: ping.lng, label: 'Live location', color: colors.accent }] : []),
  ];

  const showProgressCard = delivery.status !== 'completed' && delivery.status !== 'disputed';

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{request.item_description}</Text>
          <Text style={styles.subtitle}>
            {request.pickup_text} → {request.dropoff_text} · ${delivery.agreed_price.toFixed(2)}
          </Text>
        </View>
        <PanicButton deliveryId={delivery.id} />
      </View>

      <View style={styles.stepsRow}>
        {STATUS_STEPS.map((s, i) => (
          <Badge key={s} tone={i <= stepIndex ? 'default' : 'muted'}>
            {s.replace('_', ' ')}
          </Badge>
        ))}
      </View>

      <OndigoMapView markers={markers} />

      {showProgressCard && (
        <Card style={{ gap: 14 }}>
          <Text style={styles.cardTitle}>Progress</Text>
          {delivery.status === 'pending_pickup' && (isSender || isDriver) && (
            <PhotoCapture
              deliveryId={delivery.id}
              kind="pickup"
              existingPath={delivery.pickup_photo_url}
              onUploaded={(path) => run(() => deliveryQueries.setPickupPhoto(client, delivery.id, path).then(() => {}))}
            />
          )}
          {delivery.status === 'picked_up' && isDriver && (
            <Button
              loading={busy}
              onPress={() => run(() => deliveryQueries.updateDeliveryStatus(client, delivery.id, 'in_transit').then(() => {}))}
            >
              Start transit
            </Button>
          )}
          {(delivery.status === 'in_transit' || delivery.status === 'picked_up') && (isSender || isDriver) && (
            <PhotoCapture
              deliveryId={delivery.id}
              kind="dropoff"
              existingPath={delivery.dropoff_photo_url}
              onUploaded={(path) => run(() => deliveryQueries.setDropoffPhoto(client, delivery.id, path).then(() => {}))}
            />
          )}
        </Card>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Card style={{ gap: 12 }}>
        <Text style={styles.cardTitle}>Escrow (simulated payment)</Text>
        {!transaction ? (
          isSender ? (
            <Button loading={busy} onPress={() => run(() => deliveryQueries.fundEscrow(client, delivery.id).then(setTransaction))}>
              Fund escrow — ${delivery.agreed_price.toFixed(2)} (simulated, no real card)
            </Button>
          ) : (
            <Text style={styles.muted}>Waiting for the sender to fund escrow.</Text>
          )
        ) : (
          <View style={styles.row}>
            <Badge tone={transaction.status === 'held' ? 'accent' : 'default'}>{transaction.status}</Badge>
            {isSender && transaction.status === 'held' && delivery.status === 'delivered' && (
              <Button
                loading={busy}
                onPress={() => run(() => deliveryQueries.confirmDelivery(client, delivery.id).then((d) => setDelivery(d)))}
              >
                Confirm delivery received
              </Button>
            )}
          </View>
        )}
      </Card>

      <View>
        <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Messages</Text>
        <Chat deliveryId={delivery.id} />
      </View>

      {delivery.status === 'completed' && !reviewed && (
        <Card style={{ gap: 12 }}>
          <Text style={styles.cardTitle}>Rate this delivery</Text>
          <StarRating value={rating} onChange={setRating} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Leave a note (optional)"
            placeholderTextColor={colors.muted}
            style={styles.commentInput}
          />
          <Button
            loading={busy}
            onPress={() =>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.paper },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muted: { fontSize: 13, color: colors.muted },
  error: { fontSize: 13, color: colors.accentDark },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
});
