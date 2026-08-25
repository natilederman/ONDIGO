import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { signInSchema } from '@ondigo/shared';
import { useAuth } from '../src/lib/AuthProvider';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { colors } from '../src/lib/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/(app)/(tabs)/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>ONDIGO</Text>
      <Text style={styles.title}>Log in</Text>

      <View style={{ gap: 14, width: '100%' }}>
        <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button loading={loading} onPress={submit}>
          Log in
        </Button>
      </View>

      <Link href="/signup" style={styles.link}>
        No account? Sign up
      </Link>

      <Text style={styles.demo}>
        Demo accounts: alice@ondigo.test / ben@ondigo.test / carla@ondigo.test / drew@ondigo.test — password
        ondigo123
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.paper },
  brand: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 8, alignSelf: 'flex-start' },
  error: { color: colors.accentDark, fontSize: 13 },
  link: { marginTop: 20, color: colors.ink, fontWeight: '600', fontSize: 14 },
  demo: { marginTop: 24, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
