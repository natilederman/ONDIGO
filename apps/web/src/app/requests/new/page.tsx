'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestQueries, postRequestSchema, type PricingMode } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Card } from '@/components/Card';
import { Input, Textarea } from '@/components/Input';
import { Button } from '@/components/Button';
import { LegalDeclaration } from '@/components/LegalDeclaration';
import { AddressFields, emptyAddress, formatAddressLine, type AddressValue } from '@/components/AddressFields';

export default function NewRequestPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const router = useRouter();

  const [itemDescription, setItemDescription] = useState('');
  const [itemSize, setItemSize] = useState('small box');
  const [itemWeightKg, setItemWeightKg] = useState('5');
  const [pickup, setPickup] = useState<AddressValue>(emptyAddress);
  const [dropoff, setDropoff] = useState<AddressValue>(emptyAddress);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupFromTime, setPickupFromTime] = useState('09:00');
  const [pickupUntilTime, setPickupUntilTime] = useState('12:00');
  const [deliverDate, setDeliverDate] = useState('');
  const [deliverTime, setDeliverTime] = useState('18:00');
  const [fragile, setFragile] = useState(false);
  const [handlingNotes, setHandlingNotes] = useState('');
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
    if (!pickup.place || !dropoff.place) {
      setError('Search for both the pickup and the drop-off location so the map pin can be set.');
      return;
    }
    if (!pickup.line1.trim() || !dropoff.line1.trim()) {
      setError('Enter the street address for both the pickup and the drop-off.');
      return;
    }
    if (!pickupDate || !deliverDate) {
      setError('Set the collection window and the delivery deadline.');
      return;
    }
    const at = (d: string, t: string) => new Date(`${d}T${t}`).toISOString();
    const pickupFrom = at(pickupDate, pickupFromTime);
    const pickupUntil = at(pickupDate, pickupUntilTime);
    const deliverBy = at(deliverDate, deliverTime);
    const neededBy = deliverDate;

    const biddingEndsAt =
      pricingMode === 'auction'
        ? new Date(Date.now() + Number(biddingHours) * 3600_000).toISOString()
        : undefined;

    const input = {
      itemDescription,
      itemSize,
      itemWeightKg: Number(itemWeightKg),
      pickupText: formatAddressLine(pickup),
      pickupLat: pickup.place.lat,
      pickupLng: pickup.place.lng,
      dropoffText: formatAddressLine(dropoff),
      dropoffLat: dropoff.place.lat,
      dropoffLng: dropoff.place.lng,
      neededBy,
      pickupFrom,
      pickupUntil,
      deliverBy,
      pickupHandoff: pickup.handoff,
      dropoffHandoff: dropoff.handoff,
      fragile,
      handlingNotes: handlingNotes.trim() || undefined,
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
        pickup_from: parsed.data.pickupFrom,
        pickup_until: parsed.data.pickupUntil,
        deliver_by: parsed.data.deliverBy,
        pickup_handoff: parsed.data.pickupHandoff,
        dropoff_handoff: parsed.data.dropoffHandoff,
        fragile: parsed.data.fragile,
        handling_notes: parsed.data.handlingNotes ?? null,
        pricing_mode: parsed.data.pricingMode,
        fixed_price: parsed.data.fixedPrice ?? null,
        starting_price: parsed.data.startingPrice ?? null,
        bidding_ends_at: parsed.data.biddingEndsAt ?? null,
        extend_on_bid: parsed.data.extendOnBid,
        extend_seconds: parsed.data.extendSeconds,
        legal_declaration_accepted: parsed.data.legalDeclarationAccepted,
      });

      // The precise parts go to the private table, never onto the public request.
      await requestQueries.saveContactDetails(client, created.id, {
        pickup_line2: pickup.line2 || null,
        pickup_postcode: pickup.postcode || null,
        pickup_contact_name: pickup.contactName || null,
        pickup_contact_phone: pickup.contactPhone || null,
        pickup_instructions: pickup.instructions || null,
        dropoff_line2: dropoff.line2 || null,
        dropoff_postcode: dropoff.postcode || null,
        dropoff_contact_name: dropoff.contactName || null,
        dropoff_contact_phone: dropoff.contactPhone || null,
        dropoff_instructions: dropoff.instructions || null,
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

          <label className="flex items-start gap-3 border-t border-line pt-4">
            <input
              id="fragile"
              type="checkbox"
              checked={fragile}
              onChange={(e) => setFragile(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--ink)]"
            />
            <span>
              <span className="block text-sm font-medium">Fragile, handle with care</span>
              <span className="block text-xs text-steel">Shown to drivers before they bid.</span>
            </span>
          </label>
          <Textarea
            id="handling-notes"
            label="Handling notes"
            rows={2}
            placeholder="Keep upright, two people to lift, do not stack anything on it"
            value={handlingNotes}
            onChange={(e) => setHandlingNotes(e.target.value)}
          />
          <AddressFields
            legend="Pickup"
            idPrefix="pickup"
            end="pickup"
            contactLabel="Contact at pickup"
            value={pickup}
            onChange={setPickup}
          />
          <AddressFields
            legend="Drop-off"
            idPrefix="dropoff"
            end="dropoff"
            contactLabel="Who receives it"
            value={dropoff}
            onChange={setDropoff}
          />
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-3 block w-full border-b border-ink pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
              When
            </legend>
            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
              <Input id="pickup-date" label="Collection day" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
              <Input id="pickup-from" label="From" type="time" value={pickupFromTime} onChange={(e) => setPickupFromTime(e.target.value)} required />
              <Input id="pickup-until" label="Until" type="time" value={pickupUntilTime} onChange={(e) => setPickupUntilTime(e.target.value)} required />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <Input id="deliver-date" label="Deliver by" type="date" value={deliverDate} onChange={(e) => setDeliverDate(e.target.value)} required />
              <Input id="deliver-time" label="Latest time" type="time" value={deliverTime} onChange={(e) => setDeliverTime(e.target.value)} required />
            </div>
          </fieldset>

          <div>
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">Pricing</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPricingMode('fixed')}
                className={`flex-1 border px-4 py-2 text-sm font-medium ${
                  pricingMode === 'fixed' ? 'border-ink bg-ink text-paper' : 'border-line'
                }`}
              >
                Fixed price
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('auction')}
                className={`flex-1 border px-4 py-2 text-sm font-medium ${
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
            <div className="space-y-4 border border-line p-4">
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
                You can accept any bid at any time, or let the timer run out. The lowest bid is accepted
                automatically.
              </p>
            </div>
          )}

          <LegalDeclaration checked={legalAccepted} onChange={setLegalAccepted} />

          {error && <p className="text-sm text-signal">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Post request
          </Button>
        </form>
      </Card>
    </div>
  );
}
