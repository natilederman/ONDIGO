import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../lib/theme';

type Tone = 'default' | 'accent' | 'muted';

export function Badge({ children, tone = 'default' }: { children: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={[styles.text, toneText[tone]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});

const toneStyles = StyleSheet.create({
  default: { backgroundColor: colors.ink },
  accent: { backgroundColor: colors.accentLight },
  muted: { backgroundColor: colors.line },
});

const toneText = StyleSheet.create({
  default: { color: colors.paper },
  accent: { color: colors.accentDark },
  muted: { color: colors.muted },
});
