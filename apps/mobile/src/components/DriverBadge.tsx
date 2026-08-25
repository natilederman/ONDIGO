import { View, Text, StyleSheet } from 'react-native';
import type { DriverSummary } from '@ondigo/shared';
import { StarRating } from './StarRating';
import { colors } from '../lib/theme';

export function DriverBadge({ driver, size = 14 }: { driver: DriverSummary | null | undefined; size?: number }) {
  if (!driver) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{driver.full_name}</Text>
      <StarRating value={Math.round(driver.rating_avg)} readOnly size={size} />
      <Text style={styles.ratingText}>
        {driver.rating_count > 0 ? `${driver.rating_avg.toFixed(1)} (${driver.rating_count})` : 'No reviews yet'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 13, fontWeight: '600', color: colors.ink },
  ratingText: { fontSize: 12, color: colors.muted },
});
