import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Closed';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = new Date(endsAt).getTime() - now;
  const closed = remaining <= 0;

  return (
    <Text style={[styles.text, { color: closed ? colors.muted : colors.accentDark }]}>
      {closed ? 'Bidding closed' : `${formatRemaining(remaining)} left`}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, fontWeight: '600' },
});
