import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

export function StarRating({
  value,
  onChange,
  size = 22,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} disabled={readOnly} onPress={() => onChange?.(star)} hitSlop={4}>
          <Text style={{ fontSize: size, color: star <= value ? colors.accent : colors.line }}>
            {star <= value ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
