import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LEGAL_DECLARATION_TEXT } from '@ondigo/shared';
import { colors } from '../lib/theme';

export function LegalDeclaration({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable style={styles.wrap} onPress={() => onChange(!checked)}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.text}>{LEGAL_DECLARATION_TEXT}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F7F5F3',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'flex-start',
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.paper, fontSize: 12, fontWeight: '700' },
  text: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
});
