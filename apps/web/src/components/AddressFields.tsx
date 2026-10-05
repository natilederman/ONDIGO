'use client';

import { useEffect, useRef, useState } from 'react';
import { blockLabel } from '@ondigo/shared';
import { searchPlaces, type PlaceResult } from '@/lib/geocode';
import { Input, Textarea } from './Input';

export interface AddressValue {
  /** Geocoder match. Supplies the coordinates, which the database requires. */
  place: PlaceResult | null;
  /** House number and street. Prefilled from the match but always editable, so a
   *  building OpenStreetMap has never heard of can still be entered by hand. */
  line1: string;
  line2: string;
  postcode: string;
  contactName: string;
  contactPhone: string;
  instructions: string;
  /** How this end is handled: handed to a person, or left at a door and photographed. */
  handoff: 'in_person' | 'leave_at_door';
}

export const emptyAddress: AddressValue = {
  place: null,
  line1: '',
  line2: '',
  postcode: '',
  contactName: '',
  contactPhone: '',
  instructions: '',
  handoff: 'in_person',
};

const HANDOFF_COPY = {
  pickup: {
    title: 'How the driver collects it',
    in_person: { label: 'Someone hands it over', note: 'The driver photographs the item at collection.' },
    leave_at_door: { label: 'Left out for collection', note: 'The driver photographs it where it was left before loading it.' },
  },
  dropoff: {
    title: 'How it is delivered',
    in_person: { label: 'Hand to the recipient', note: 'The driver photographs the handover with the named person.' },
    leave_at_door: { label: 'Leave at the door', note: 'The driver leaves it where your notes say and photographs it in place. That photo is what releases the payment.' },
  },
} as const;

/**
 * What gets written to the public request row: the block, the city and the
 * state, e.g. "1200 block of Valencia St, San Francisco, CA". Enough to judge
 * and price the job. The exact street line is saved privately for the driver.
 */
export function formatAddressLine(v: AddressValue): string {
  return blockLabel(v.line1, v.place?.city, v.place?.state) || (v.place?.label ?? '');
}

export function AddressFields({
  legend,
  value,
  onChange,
  contactLabel,
  idPrefix,
  end,
}: {
  legend: string;
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  contactLabel: string;
  idPrefix: string;
  end: 'pickup' | 'dropoff';
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abort = useRef<AbortController | undefined>(undefined);

  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });

  useEffect(() => {
    clearTimeout(debounce.current);
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      const r = await searchPlaces(query, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setResults(r);
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [query]);

  useEffect(() => () => abort.current?.abort(), []);

  const choose = (p: PlaceResult) => {
    setQuery(p.label);
    setOpen(false);
    set({
      place: p,
      // Prefill what the geocoder knew; the user can correct any of it.
      line1: p.line1 ?? value.line1,
      postcode: p.postcode ?? value.postcode,
    });
  };

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 block w-full border-b border-ink pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
        {legend}
      </legend>

      <div className="space-y-4">
        <div className="relative">
          <label
            htmlFor={`${idPrefix}-search`}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel"
          >
            Find the location on the map
          </label>
          <input
            id={`${idPrefix}-search`}
            value={query}
            placeholder="Street, area or postcode"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-steel focus:border-ink focus:outline-none"
          />

          <p className="mt-1.5 text-xs text-steel">
            {value.place
              ? 'Location set. Correct the street line below if it is not exact.'
              : 'This sets the map pin. You can refine the exact address afterwards.'}
          </p>

          {open && (searching || results.length > 0) && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-ink bg-paper">
              {searching && <li className="px-3.5 py-2.5 text-sm text-steel">Searching…</li>}
              {!searching &&
                results.map((r, i) => (
                  <li key={`${r.lat}-${r.lng}-${i}`}>
                    <button
                      type="button"
                      onClick={() => choose(r)}
                      className="block w-full border-b border-line px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-ash"
                    >
                      <span className="block">{r.label}</span>
                      {!r.precise && (
                        <span className="mt-0.5 block text-[11px] uppercase tracking-[0.1em] text-steel">
                          Area only, add the street below
                        </span>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <Input
          id={`${idPrefix}-line1`}
          label="Street address"
          placeholder="e.g. 128 Valencia Street"
          value={value.line1}
          onChange={(e) => set({ line1: e.target.value })}
        />

        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Input
            id={`${idPrefix}-line2`}
            label="Apartment, floor, building"
            placeholder="e.g. Apt 4B, third floor"
            value={value.line2}
            onChange={(e) => set({ line2: e.target.value })}
          />
          <Input
            id={`${idPrefix}-postcode`}
            label="Postcode"
            value={value.postcode}
            onChange={(e) => set({ postcode: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${idPrefix}-contact-name`}
            label={contactLabel}
            placeholder="Who the driver should ask for"
            value={value.contactName}
            onChange={(e) => set({ contactName: e.target.value })}
          />
          <Input
            id={`${idPrefix}-contact-phone`}
            label="Contact phone"
            type="tel"
            inputMode="tel"
            placeholder="Reachable on the day"
            value={value.contactPhone}
            onChange={(e) => set({ contactPhone: e.target.value })}
          />
        </div>

        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
            {HANDOFF_COPY[end].title}
          </span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={HANDOFF_COPY[end].title}>
            {(['in_person', 'leave_at_door'] as const).map((mode) => {
              const on = value.handoff === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ handoff: mode })}
                  className={`border px-3 py-2.5 text-left text-sm font-medium transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.98] ${
                    on ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink'
                  }`}
                >
                  {HANDOFF_COPY[end][mode].label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-steel">{HANDOFF_COPY[end][value.handoff].note}</p>
        </div>

        <Textarea
          id={`${idPrefix}-instructions`}
          label={value.handoff === 'leave_at_door' ? 'Where exactly to leave it, and access notes' : 'Access notes'}
          rows={2}
          placeholder={
            value.handoff === 'leave_at_door'
              ? 'e.g. Behind the planter to the left of the door. Gate code 4471.'
              : 'Buzzer code, gate, parking, where to wait'
          }
          hint="Shared with the driver only after they win the job."
          value={value.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
        />
      </div>
    </fieldset>
  );
}
