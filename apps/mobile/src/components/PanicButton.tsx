import { useState } from 'react';
import { View, Text, Pressable, Modal, Linking, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { panicQueries, EMERGENCY_CONTACT } from '@ondigo/shared';
import { getSupabaseClient } from '../lib/supabaseClient';
import { Button } from './Button';
import { colors, radius } from '../lib/theme';

export function PanicButton({ deliveryId }: { deliveryId: string | null }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const client = getSupabaseClient();

  const trigger = async () => {
    setOpen(true);
    setSending(true);
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch {
      // fall through with null coords
    }
    await panicQueries.triggerPanicAlert(client, deliveryId, lat, lng);
    setSending(false);
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={trigger}>
        <Text style={styles.triggerText}>Panic button</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{sending ? 'Sending your location…' : 'Alert logged'}</Text>
            <Text style={styles.note}>{EMERGENCY_CONTACT.note}</Text>
            <Pressable
              style={styles.callButton}
              onPress={() => Linking.openURL(`tel:${EMERGENCY_CONTACT.phone}`)}
            >
              <Text style={styles.callText}>Call {EMERGENCY_CONTACT.label}</Text>
            </Pressable>
            <View style={{ marginTop: 12, width: '100%' }}>
              <Button variant="ghost" onPress={() => setOpen(false)}>
                Close
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  triggerText: { color: colors.accentDark, fontWeight: '600', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: colors.paper, borderRadius: radius.card, padding: 24, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  note: { marginTop: 8, fontSize: 13, color: colors.muted, textAlign: 'center' },
  callButton: {
    marginTop: 16,
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callText: { color: colors.paper, fontWeight: '600', fontSize: 14 },
});
