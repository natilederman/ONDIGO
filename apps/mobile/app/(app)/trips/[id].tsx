import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { tripQueries, requestQueries, type TripWithDriver, type DeliveryRequest } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { DriverBadge } from '../../../src/components/DriverBadge';
import { OndigoMapView } from '../../../src/components/MapView';
import { colors } from '../../../src/lib/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = getSupabaseClient();
  const [trip, setTrip] = useState<TripWithDriver | null>(null);
  const [matches, setMatches] = useState<DeliveryRequest[]>([]);

  useEffect(() => {
    tripQueries.getTrip(client, id).then(setTrip);
    requestQueries.listOpenRequests(client).then(setMatches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!trip) return null;

  const capacityMatches = matches.filter((r) => r.item_weight_kg <= trip.capacity_weight_kg);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Badge>{trip.vehicle_type}</Badge>
      <Text style={styles.title}>
        {trip.origin_text} → {trip.destination_text}
      </Text>
      <Text style={styles.subtitle}>
        Departs {new Date(trip.depart_at).toLocaleString()} · Capacity {trip.capacity_weight_kg}kg /{' '}
        {trip.capacity_size}
      </Text>
      {trip.notes ? <Text style={styles.notes}>{trip.notes}</Text> : null}

      <Pressable onPress={() => router.push(`/(app)/profile/${trip.driver?.id}`)}>
        <Card>
          <Text style={styles.driverLabel}>Driver</Text>
          <DriverBadge driver={trip.driver} size={16} />
        </Card>
      </Pressable>

      <OndigoMapView
        markers={[
          { lat: trip.origin_lat, lng: trip.origin_lng, label: trip.origin_text, color: colors.ink },
          { lat: trip.destination_lat, lng: trip.destination_lng, label: trip.destination_text, color: colors.accent },
        ]}
        polyline={[
          [trip.origin_lat, trip.origin_lng],
          [trip.destination_lat, trip.destination_lng],
        ]}
      />

      <Text style={styles.sectionTitle}>Open requests this trip could carry</Text>
      {capacityMatches.length === 0 ? (
        <Text style={styles.empty}>No open requests fit this trip&apos;s capacity right now.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {capacityMatches.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/(app)/requests/${r.id}`)}>
              <Card>
                <Text style={styles.matchTitle}>{r.item_description}</Text>
                <Text style={styles.matchSubtitle}>
                  {r.pickup_text} → {r.dropoff_text}
                </Text>
                <Text style={styles.matchPrice}>
                  {r.pricing_mode === 'fixed' ? `$${r.fixed_price?.toFixed(2)} fixed` : `$${r.current_price?.toFixed(2)} current bid`}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: colors.paper },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
  notes: { fontSize: 14, color: colors.ink },
  driverLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 4 },
  empty: { fontSize: 13, color: colors.muted },
  matchTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  matchSubtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  matchPrice: { marginTop: 6, fontSize: 14, fontWeight: '600', color: colors.ink },
});
