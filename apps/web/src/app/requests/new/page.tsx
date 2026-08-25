'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestQueries, postRequestSchema, type PricingMode } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { LocationInput } from '@/components/LocationInput';
import { LegalDeclaration } from '@/components/LegalDeclaration';
import type { PlaceResult } from '@/lib/geocode';

export default function NewRequestPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const router = useRouter();

  const [itemDescription, setItemDescription] = useState('');
  const [itemSize, setItemSize] = useState('small box');
  const [itemWeightKg, setItemWeightKg] = useState('5');
  const [pickup, setPickup] = useState<PlaceResult | null>(null);
  const [dropoff, setDropoff] = useState<PlaceResult | null>(null);
  const [neededBy, setNeededBy] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('fixed');
  const [fixedPrice, setFixedPrice] = useState('40');
  const [startingPrice, setStartingPrice] = useState('80');
  const [biddingHours, setBiddingHours] = useState('2');
  const [extendOnBid, setExtendOnBid] = useState(true);
  const [extendSeconds, setExtendSeconds] = useState('60');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (authLoading || !user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setError('Pick both a pickup and drop-off location from the suggestions.');
      return;
    }
    const biddingEndsAt =
      pricingMode === 'auction'
        ? new Date(Date.now() + Number(biddingHours) * 3600_000).toISOString()
        : undefined;

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
      neededBy,
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
      router.push(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Post a delivery request</h1>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Item description"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Size" value={itemSize} onChange={(e) => setItemSize(e.target.value)} required />
            <Input
              label="Weight (kg)"
              type="number"
              min={0.1}
              step={0.1}
              value={itemWeightKg}
              onChange={(e) => setItemWeightKg(e.target.value)}
              required
            />
          </div>
          <LocationInput label="Pickup location" onSelect={setPickup} />
          <LocationInput label="Drop-off location" onSelect={setDropoff} />
          <Input label="Needed by" type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} required />

          <div>
            <span className="mb-1.5 block text-sm font-medium">Pricing</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPricingMode('fixed')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  pricingMode === 'fixed' ? 'border-ink bg-ink text-paper' : 'border-line'
                }`}
              >
                Fixed price
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('auction')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  pricingMode === 'auction' ? 'border-ink bg-ink text-paper' : 'border-line'
                }`}
              >
                Bidding / auction
              </button>
            </div>
          </div>

          {pricingMode === 'fixed' ? (
            <Input
              label="Price ($)"
              type="number"
              min={1}
              step={0.5}
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              required
            />
          ) : (
            <div className="space-y-4 rounded-lg border border-line p-4">
              <Input
                label="Starting / maximum price ($)"
                type="number"
                min={1}
                step={0.5}
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                required
              />
              <Input
                label="Bidding stays open for (hours)"
                type="number"
                min={0.1}
                step={0.1}
                value={biddingHours}
                onChange={(e) => setBiddingHours(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={extendOnBid}
                  onChange={(e) => setExtendOnBid(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Extend the timer when a new lower bid comes in
              </label>
              {extendOnBid && (
                <Input
                  label="Extend by (seconds)"
                  type="number"
                  min={10}
                  value={extendSeconds}
                  onChange={(e) => setExtendSeconds(e.target.value)}
                />
              )}
              <p className="text-xs text-muted">
                You can accept any bid at any time, or let the timer run out — the lowest bid is accepted
                automatically.
              </p>
            </div>
          )}

          <LegalDeclaration checked={legalAccepted} onChange={setLegalAccepted} />

          {error && <p className="text-sm text-accent-dark">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Post request
          </Button>
        </form>
      </Card>
    </div>
  );
}
