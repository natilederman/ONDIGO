import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { deliveryQueries, type Delivery } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { colors } from '../../../src/lib/theme';

export default function DeliveriesScreen() {
  const client = getSupabaseClient();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    deliveryQueries.listMyDeliveries(client, user.id).then((d) => {
      setDeliveries(d);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useFocusEffect(load);

  if (!user) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        data={deliveries}
        keyExtractor={(d) => d.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Nothing yet — matched requests will show up here.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/deliveries/${item.id}`)}>
            <Card style={styles.row}>
              <View>
                <Text style={styles.title}>
                  {item.driver_id === user.id ? 'Carrying for someone' : 'Being carried for you'}
                </Text>
                <Text style={styles.subtitle}>${item.agreed_price.toFixed(2)}</Text>
              </View>
              <Badge>{item.status.replace('_', ' ')}</Badge>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  empty: { textAlign: 'center', marginTop: 40, color: colors.muted, fontSize: 14 },
});
