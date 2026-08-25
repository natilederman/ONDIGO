import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { tripQueries, type TripWithDriver } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { DriverBadge } from '../../../src/components/DriverBadge';
import { colors } from '../../../src/lib/theme';

export default function TripsScreen() {
  const client = getSupabaseClient();
  const [trips, setTrips] = useState<TripWithDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    tripQueries.listOpenTrips(client).then((t) => {
      setTrips(t);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(load);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button onPress={() => router.push('/(app)/trips/new')}>Post a trip</Button>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No trips posted yet.</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/trips/${item.id}`)}>
            <Card>
              <View style={styles.row}>
                <Badge>{item.vehicle_type}</Badge>
                <Text style={styles.date}>{new Date(item.depart_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.title}>
                {item.origin_text} → {item.destination_text}
              </Text>
              <Text style={styles.subtitle}>
                Capacity: {item.capacity_weight_kg}kg / {item.capacity_size}
              </Text>
              {item.notes ? (
                <Text style={styles.notes} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
              <View style={styles.driverRow}>
                <DriverBadge driver={item.driver} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.paper },
  header: { marginBottom: 4, alignItems: 'flex-start' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: colors.muted },
  title: { marginTop: 10, fontSize: 15, fontWeight: '600', color: colors.ink },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  notes: { marginTop: 6, fontSize: 13, color: colors.ink },
  driverRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  empty: { textAlign: 'center', marginTop: 40, color: colors.muted, fontSize: 14 },
});
