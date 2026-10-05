'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripQueries, postTripSchema, VEHICLE_TYPES, blockLabel, roundCoord, type VehicleType } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Input, Select, Textarea } from '@/components/Input';
import { Button } from '@/components/Button';
import { LocationInput } from '@/components/LocationInput';
import type { PlaceResult } from '@/lib/geocode';

/** A trip is listed by block and city, like a request: "300 block of King St, San Francisco, CA". */
const publicPlace = (p: PlaceResult) => (p.city ? blockLabel(p.line1 ?? '', p.city, p.state) : p.label);

export default function NewTripPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const router = useRouter();

  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [departAt, setDepartAt] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [capacityWeightKg, setCapacityWeightKg] = useState('20');
  const [capacitySize, setCapacitySize] = useState('medium box');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (authLoading || !user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      departAt,
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
        depart_at: new Date(parsed.data.departAt).toISOString(),
        vehicle_type: parsed.data.vehicleType,
        capacity_weight_kg: parsed.data.capacityWeightKg,
        capacity_size: parsed.data.capacitySize,
        notes: parsed.data.notes ?? null,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Post a trip</h1>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <LocationInput label="Origin" placeholder="San Francisco, CA" onSelect={setOrigin} />
          <LocationInput label="Destination" placeholder="Los Angeles, CA" onSelect={setDestination} />
          <Input
            label="Departure date & time"
            type="datetime-local"
            value={departAt}
            onChange={(e) => setDepartAt(e.target.value)}
            required
          />
          <Select
            label="Vehicle"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType)}
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label} (up to {v.maxWeightKg}kg)
              </option>
            ))}
          </Select>
          <Input
            label="Available capacity (kg)"
            type="number"
            min={1}
            value={capacityWeightKg}
            onChange={(e) => setCapacityWeightKg(e.target.value)}
            required
          />
          <Input
            label="Capacity size description"
            value={capacitySize}
            onChange={(e) => setCapacitySize(e.target.value)}
            required
          />
          <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          {error && <p className="text-sm text-signal">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Post trip
          </Button>
        </form>
      </Card>
    </div>
  );
}
