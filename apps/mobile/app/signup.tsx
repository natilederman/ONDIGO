import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { signUpSchema, VEHICLE_TYPES, type VehicleType } from '@ondigo/shared';
import { useAuth } from '../src/lib/AuthProvider';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { colors, radius } from '../src/lib/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsed = signUpSchema.safeParse({ fullName, email, password, vehicleType: vehicleType || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password, fullName, vehicleType || undefined);
      router.replace('/(app)/(tabs)/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create your account</Text>

      <View style={{ gap: 14, width: '100%' }}>
        <Input label="Full name" value={fullName} onChangeText={setFullName} />
        <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <View>
          <Text style={styles.label}>Vehicle (optional — set this if you plan to drive)</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, vehicleType === '' && styles.chipActive]}
              onPress={() => setVehicleType('')}
            >
              <Text style={[styles.chipText, vehicleType === '' && styles.chipTextActive]}>Sender only</Text>
            </Pressable>
            {VEHICLE_TYPES.map((v) => (
              <Pressable
                key={v.value}
                style={[styles.chip, vehicleType === v.value && styles.chipActive]}
                onPress={() => setVehicleType(v.value)}
              >
                <Text style={[styles.chipText, vehicleType === v.value && styles.chipTextActive]}>{v.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        <Button loading={loading} onPress={submit}>
          Sign up
        </Button>
      </View>

      <Link href="/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.paper },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 8, alignSelf: 'flex-start' },
  label: { fontSize: 14, fontWeight: '500', color: colors.ink, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.paper },
  error: { color: colors.accentDark, fontSize: 13 },
  link: { marginTop: 20, color: colors.ink, fontWeight: '600', fontSize: 14 },
});
