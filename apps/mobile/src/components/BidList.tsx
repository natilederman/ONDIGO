import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { BidWithDriver } from '@ondigo/shared';
import { Badge } from './Badge';
import { Button } from './Button';
import { DriverBadge } from './DriverBadge';
import { colors } from '../lib/theme';

const statusTone: Record<BidWithDriver['status'], 'default' | 'accent' | 'muted'> = {
  active: 'accent',
  outbid: 'muted',
  accepted: 'default',
  rejected: 'muted',
};

export function BidList({
  bids,
  isOwner,
  onAccept,
}: {
  bids: BidWithDriver[];
  isOwner: boolean;
  onAccept?: (bidId: string) => void;
}) {
  if (bids.length === 0) {
    return <Text style={styles.empty}>No bids yet — be the first to bid lower.</Text>;
  }

  return (
    <View style={{ gap: 8 }}>
      {bids.map((bid) => (
        <View key={bid.id} style={styles.row}>
          <View style={styles.top}>
            <Text style={styles.amount}>${bid.amount.toFixed(2)}</Text>
            <Badge tone={statusTone[bid.status]}>{bid.status}</Badge>
          </View>
          {bid.driver && (
            <Pressable onPress={() => router.push(`/(app)/profile/${bid.driver!.id}`)}>
              <DriverBadge driver={bid.driver} />
            </Pressable>
          )}
          {isOwner && bid.status === 'active' && onAccept && (
            <Button variant="secondary" onPress={() => onAccept(bid.id)}>
              Accept this bid
            </Button>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: colors.muted },
  row: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
