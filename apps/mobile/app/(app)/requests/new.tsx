import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestQueries, postRequestSchema, type PricingMode } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { LocationInput } from '../../../src/components/LocationInput';
import { LegalDeclaration } from '../../../src/components/LegalDeclaration';
import type { PlaceResult } from '../../../src/lib/geocode';
import { colors, radius } from '../../../src/lib/theme';

export default function NewRequestScreen() {
  const client = getSupabaseClient();
  const { user } = useAuth();

  const [itemDescription, setItemDescription] = useState('');
  const [itemSize, setItemSize] = useState('small box');
  const [itemWeightKg, setItemWeightKg] = useState('5');
  const [pickup, setPickup] = useState<PlaceResult | null>(null);
  const [dropoff, setDropoff] = useState<PlaceResult | null>(null);
  const [neededBy, setNeededBy] = useState(new Date(Date.now() + 5 * 24 * 3600_000));
  const [showPicker, setShowPicker] = useState(false);
  const [pricingMode, setPricingMode] = useState<PricingMode>('fixed');
  const [fixedPrice, setFixedPrice] = useState('40');
  const [startingPrice, setStartingPrice] = useState('80');
  const [biddingHours, setBiddingHours] = useState('2');
  const [extendOnBid, setExtendOnBid] = useState(true);
  const [extendSeconds, setExtendSeconds] = useState('60');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!pickup || !dropoff) {
      setError('Pick both a pickup and drop-off location from the suggestions.');
      return;
    }
    const biddingEndsAt =
      pricingMode === 'auction' ? new Date(Date.now() + Number(biddingHours) * 3600_000).toISOString() : undefined;

    const input = {
      itemDescription,
      itemSize,
      itemWeightKg: Number(itemWeightKg),
      pickupText: pickup.label,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffText: dropoff.label,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      neededBy: neededBy.toISOString().slice(0, 10),
      pricingMode,
      fixedPrice: pricingMode === 'fixed' ? Number(fixedPrice) : undefined,
      startingPrice: pricingMode === 'auction' ? Number(startingPrice) : undefined,
      biddingEndsAt,
      extendOnBid,
      extendSeconds: Number(extendSeconds),
      legalDeclarationAccepted: legalAccepted as true,
    };
    const parsed = postRequestSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await requestQueries.createRequest(client, user.id, {
        item_description: parsed.data.itemDescription,
        item_size: parsed.data.itemSize,
        item_weight_kg: parsed.data.itemWeightKg,
        pickup_text: parsed.data.pickupText,
        pickup_lat: parsed.data.pickupLat,
        pickup_lng: parsed.data.pickupLng,
        dropoff_text: parsed.data.dropoffText,
        dropoff_lat: parsed.data.dropoffLat,
        dropoff_lng: parsed.data.dropoffLng,
        needed_by: parsed.data.neededBy,
        pricing_mode: parsed.data.pricingMode,
        fixed_price: parsed.data.fixedPrice ?? null,
        starting_price: parsed.data.startingPrice ?? null,
        bidding_ends_at: parsed.data.biddingEndsAt ?? null,
        extend_on_bid: parsed.data.extendOnBid,
        extend_seconds: parsed.data.extendSeconds,
        legal_declaration_accepted: parsed.data.legalDeclarationAccepted,
      });
      router.replace(`/(app)/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Input label="Item description" value={itemDescription} onChangeText={setItemDescription} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input label="Size" value={itemSize} onChangeText={setItemSize} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Weight (kg)" keyboardType="numeric" value={itemWeightKg} onChangeText={setItemWeightKg} />
        </View>
      </View>

      <LocationInput label="Pickup location" onSelect={setPickup} />
      <LocationInput label="Drop-off location" onSelect={setDropoff} />

      <View>
        <Text style={styles.label}>Needed by</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{neededBy.toLocaleDateString()}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={neededBy}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setNeededBy(date);
            }}
          />
        )}
      </View>

      <View>
        <Text style={styles.label}>Pricing</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, pricingMode === 'fixed' && styles.toggleActive]}
            onPress={() => setPricingMode('fixed')}
          >
            <Text style={[styles.toggleText, pricingMode === 'fixed' && styles.toggleTextActive]}>Fixed price</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, pricingMode === 'auction' && styles.toggleActive]}
            onPress={() => setPricingMode('auction')}
          >
            <Text style={[styles.toggleText, pricingMode === 'auction' && styles.toggleTextActive]}>
              Bidding / auction
            </Text>
          </Pressable>
        </View>
      </View>

      {pricingMode === 'fixed' ? (
        <Input label="Price ($)" keyboardType="numeric" value={fixedPrice} onChangeText={setFixedPrice} />
      ) : (
        <View style={styles.auctionBox}>
          <Input
            label="Starting / maximum price ($)"
            keyboardType="numeric"
            value={startingPrice}
            onChangeText={setStartingPrice}
          />
          <Input
            label="Bidding stays open for (hours)"
            keyboardType="numeric"
            value={biddingHours}
            onChangeText={setBiddingHours}
          />
          <Pressable style={styles.checkboxRow} onPress={() => setExtendOnBid(!extendOnBid)}>
            <View style={[styles.checkbox, extendOnBid && styles.checkboxChecked]}>
              {extendOnBid && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Extend the timer when a new lower bid comes in</Text>
          </Pressable>
          {extendOnBid && (
            <Input label="Extend by (seconds)" keyboardType="numeric" value={extendSeconds} onChangeText={setExtendSeconds} />
          )}
          <Text style={styles.hint}>
            You can accept any bid at any time, or let the timer run out — the lowest bid is accepted automatically.
          </Text>
        </View>
      )}

      <LegalDeclaration checked={legalAccepted} onChange={setLegalAccepted} />

      {error && <Text style={styles.error}>{error}</Text>}
      <Button loading={loading} onPress={submit}>
        Post request
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16, backgroundColor: colors.paper },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '500', color: colors.ink, marginBottom: 8 },
  dateButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  dateText: { fontSize: 14, color: colors.ink },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  toggleTextActive: { color: colors.paper },
  auctionBox: { gap: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxMark: { color: colors.paper, fontSize: 12, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 13, color: colors.ink },
  hint: { fontSize: 12, color: colors.muted },
  error: { color: colors.accentDark, fontSize: 13 },
});
