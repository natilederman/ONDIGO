import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { requestQueries, type DeliveryRequest } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { Card } from '../../../src/components/Card';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { CountdownTimer } from '../../../src/components/CountdownTimer';
import { colors } from '../../../src/lib/theme';

export default function RequestsScreen() {
  const client = getSupabaseClient();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    requestQueries.listOpenRequests(client).then((r) => {
      setRequests(r);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(load);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button onPress={() => router.push('/(app)/requests/new')}>Post a request</Button>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No open requests right now.</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/requests/${item.id}`)}>
            <Card>
              <View style={styles.row}>
                <Badge tone={item.pricing_mode === 'auction' ? 'accent' : 'muted'}>
                  {item.pricing_mode === 'auction' ? 'Auction' : 'Fixed price'}
                </Badge>
                {item.pricing_mode === 'auction' && item.bidding_ends_at && (
                  <CountdownTimer endsAt={item.bidding_ends_at} />
                )}
              </View>
              <Text style={styles.title}>{item.item_description}</Text>
              <Text style={styles.subtitle}>
                {item.pickup_text} → {item.dropoff_text}
              </Text>
              <Text style={styles.price}>
                {item.pricing_mode === 'fixed' ? `$${item.fixed_price?.toFixed(2)}` : `$${item.current_price?.toFixed(2)}`}
              </Text>
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
  title: { marginTop: 10, fontSize: 15, fontWeight: '600', color: colors.ink },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  price: { marginTop: 8, fontSize: 17, fontWeight: '700', color: colors.ink },
  empty: { textAlign: 'center', marginTop: 40, color: colors.muted, fontSize: 14 },
});
