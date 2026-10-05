import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { tripQueries, postTripSchema, VEHICLE_TYPES, roundCoord, type VehicleType } from '@ondigo/shared';
import { getSupabaseClient } from '../../../src/lib/supabaseClient';
import { useAuth } from '../../../src/lib/AuthProvider';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { LocationInput } from '../../../src/components/LocationInput';
import { publicPlace, type PlaceResult } from '../../../src/lib/geocode';
import { colors, radius } from '../../../src/lib/theme';

export default function NewTripScreen() {
  const client = getSupabaseClient();
  const { user } = useAuth();

  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [departAt, setDepartAt] = useState(new Date(Date.now() + 24 * 3600_000));
  const [showPicker, setShowPicker] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [capacityWeightKg, setCapacityWeightKg] = useState('20');
  const [capacitySize, setCapacitySize] = useState('medium box');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!origin || !destination) {
      setError('Pick both an origin and destination from the suggestions.');
      return;
    }
    const input = {
      originText: publicPlace(origin),
      originLat: roundCoord(origin.lat),
      originLng: roundCoord(origin.lng),
      destinationText: publicPlace(destination),
      destinationLat: roundCoord(destination.lat),
      destinationLng: roundCoord(destination.lng),
      departAt: departAt.toISOString(),
      vehicleType,
      capacityWeightKg: Number(capacityWeightKg),
      capacitySize,
      notes: notes || undefined,
    };
    const parsed = postTripSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const trip = await tripQueries.createTrip(client, user.id, {
        origin_text: parsed.data.originText,
        origin_lat: parsed.data.originLat,
        origin_lng: parsed.data.originLng,
        destination_text: parsed.data.destinationText,
        destination_lat: parsed.data.destinationLat,
        destination_lng: parsed.data.destinationLng,
        depart_at: parsed.data.departAt,
        vehicle_type: parsed.data.vehicleType,
        capacity_weight_kg: parsed.data.capacityWeightKg,
        capacity_size: parsed.data.capacitySize,
        notes: parsed.data.notes ?? null,
      });
      router.replace(`/(app)/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <LocationInput label="Origin" placeholder="San Francisco, CA" onSelect={setOrigin} />
      <LocationInput label="Destination" placeholder="Los Angeles, CA" onSelect={setDestination} />

      <View>
        <Text style={styles.label}>Departure date &amp; time</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{departAt.toLocaleString()}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={departAt}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setDepartAt(date);
            }}
          />
        )}
      </View>

      <View>
        <Text style={styles.label}>Vehicle</Text>
        <View style={styles.chipRow}>
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

      <Input
        label="Available capacity (kg)"
        keyboardType="numeric"
        value={capacityWeightKg}
        onChangeText={setCapacityWeightKg}
      />
      <Input label="Capacity size description" value={capacitySize} onChangeText={setCapacitySize} />
      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      {error && <Text style={styles.error}>{error}</Text>}
      <Button loading={loading} onPress={submit}>
        Post trip
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16, backgroundColor: colors.paper },
  label: { fontSize: 14, fontWeight: '500', color: colors.ink, marginBottom: 8 },
  dateButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  dateText: { fontSize: 14, color: colors.ink },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.paper },
  error: { color: colors.accentDark, fontSize: 13 },
});
