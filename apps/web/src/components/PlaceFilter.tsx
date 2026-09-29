'use client';

/**
 * Narrow a long list by place: pick a state, then a city inside it, and choose
 * whether that place is where the job leaves, where it arrives, or either.
 * Each end of a row is snapped to the nearest known city, the same way the
 * homepage map does it, so the names here match the names on the map.
 * The choice is kept in the address bar, so a filtered list can be shared.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadMapData, snap } from '@/lib/map/data';

export type PlaceEnds = { from: { state: string; city: string }; to: { state: string; city: string } };
export type PlaceDir = 'any' | 'from' | 'to';
export type PlaceFilterValue = { state: string | null; city: string | null; dir: PlaceDir };

const LABEL = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';

/** Snap both ends of every row to a known state and city. */
export function usePlaceEnds<T>(items: T[], coords: (t: T) => [number, number, number, number], key: (t: T) => string) {
  const [ends, setEnds] = useState<Record<string, PlaceEnds>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadMapData().then((d) => {
      if (!alive) return;
      setNames(Object.fromEntries(d.states.features.map((f) => [f.properties.abbr, f.properties.name])));
      const out: Record<string, PlaceEnds> = {};
      for (const t of items) {
        const [a, b, c, e] = coords(t);
        const f = snap(d.cities, a, b);
        const to = snap(d.cities, c, e);
        out[key(t)] = { from: { state: f.state, city: f.city }, to: { state: to.state, city: to.city } };
      }
      setEnds(out);
      setReady(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  return { ends, names, ready };
}

export function placeMatches(e: PlaceEnds | undefined, v: PlaceFilterValue): boolean {
  if (!v.state) return true;
  if (!e) return false;
  const hit = (p: { state: string; city: string }) => p.state === v.state && (!v.city || p.city === v.city);
  return v.dir === 'from' ? hit(e.from) : v.dir === 'to' ? hit(e.to) : hit(e.from) || hit(e.to);
}

/** Filter state mirrored into ?state=&city=&dir= */
export function usePlaceFilter(): [PlaceFilterValue, (v: PlaceFilterValue) => void] {
  const [v, setV] = useState<PlaceFilterValue>({ state: null, city: null, dir: 'any' });
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const dir = q.get('dir');
    setV({ state: q.get('state'), city: q.get('city'), dir: dir === 'from' || dir === 'to' ? dir : 'any' });
  }, []);
  const set = (next: PlaceFilterValue) => {
    setV(next);
    const q = new URLSearchParams(window.location.search);
    for (const [k, val] of [['state', next.state], ['city', next.city], ['dir', next.dir === 'any' ? null : next.dir]] as const) {
      if (val) q.set(k, val);
      else q.delete(k);
    }
    const s = q.toString();
    window.history.replaceState(null, '', window.location.pathname + (s ? `?${s}` : ''));
  };
  return [v, set];
}

type Option = { key: string; label: string; sub?: string; n: number };

function Combo({
  id,
  label,
  placeholder,
  options,
  value,
  onPick,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onPick: (key: string | null) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.key === value);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? options.filter((o) => o.label.toLowerCase().includes(t) || o.key.toLowerCase() === t) : options;
    return list.slice(0, 14);
  }, [q, options]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (o: Option) => {
    onPick(o.key);
    setQ('');
    setOpen(false);
  };

  return (
    <div ref={box}>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="dm-search">
        <svg className="ico" viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={selected ? selected.label : placeholder}
          value={open ? q : selected?.label ?? ''}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQ('');
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && open && hits[active]) {
              e.preventDefault();
              pick(hits[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
          className="disabled:cursor-not-allowed disabled:bg-ash"
          style={{ paddingRight: value ? 36 : undefined }}
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => onPick(null)}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[18px] leading-none text-steel hover:text-ink"
          >
            &times;
          </button>
        )}
        {open && !disabled && (
          <div className="dm-results" role="listbox">
            {hits.map((o, i) => (
              <button key={o.key} type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}>
                <span className="nm">
                  {o.label}
                  {o.sub && <small>{o.sub}</small>}
                </span>
                <span className="ct tnum">{o.n}</span>
              </button>
            ))}
            {hits.length === 0 && <div className="px-3.5 py-2.5 text-[13.5px] text-steel">Nothing here matches.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlaceFilter({
  ends,
  names,
  ready,
  value,
  onChange,
  total,
  shown,
  noun,
  dirLabels = { from: 'Leaving', to: 'Arriving' },
}: {
  ends: Record<string, PlaceEnds>;
  names: Record<string, string>;
  ready: boolean;
  value: PlaceFilterValue;
  onChange: (v: PlaceFilterValue) => void;
  total: number;
  shown: number;
  noun: [string, string];
  dirLabels?: { from: string; to: string };
}) {
  const rows = Object.values(ends);

  // how many rows touch each state and each city, respecting the direction toggle
  const stateOptions = useMemo<Option[]>(() => {
    const n: Record<string, number> = {};
    for (const e of rows) {
      const set = new Set<string>();
      if (value.dir !== 'to') set.add(e.from.state);
      if (value.dir !== 'from') set.add(e.to.state);
      set.forEach((s) => (n[s] = (n[s] || 0) + 1));
    }
    return Object.entries(n)
      .map(([k, c]) => ({ key: k, label: names[k] ?? k, sub: k, n: c }))
      .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ends, names, value.dir]);

  const cityOptions = useMemo<Option[]>(() => {
    if (!value.state) return [];
    const n: Record<string, number> = {};
    for (const e of rows) {
      const set = new Set<string>();
      if (value.dir !== 'to' && e.from.state === value.state) set.add(e.from.city);
      if (value.dir !== 'from' && e.to.state === value.state) set.add(e.to.city);
      set.forEach((c) => (n[c] = (n[c] || 0) + 1));
    }
    return Object.entries(n)
      .map(([k, c]) => ({ key: k, label: k, n: c }))
      .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ends, value.state, value.dir]);

  const filtered = !!value.state;
  const dirs: [PlaceDir, string][] = [['any', 'Either end'], ['from', dirLabels.from], ['to', dirLabels.to]];

  return (
    <div className="mb-6 border-b border-line pb-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Combo
          id="filter-state"
          label="State"
          placeholder={ready ? 'Any state' : 'Loading places'}
          options={stateOptions}
          value={value.state}
          disabled={!ready}
          onPick={(k) => onChange({ ...value, state: k, city: null })}
        />
        <Combo
          id="filter-city"
          label="City"
          placeholder={value.state ? `Any city in ${names[value.state] ?? value.state}` : 'Pick a state first'}
          options={cityOptions}
          value={value.city}
          disabled={!value.state}
          onPick={(k) => onChange({ ...value, city: k })}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex border border-line-strong" role="group" aria-label="Which end">
          {dirs.map(([d, l]) => (
            <button
              key={d}
              type="button"
              aria-pressed={value.dir === d}
              onClick={() => onChange({ ...value, dir: d })}
              className={`px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ${value.dir === d ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="text-[13px] text-steel">
          {filtered ? (
            <>
              Showing <b className="tnum font-semibold text-ink">{shown}</b> of {total} {total === 1 ? noun[0] : noun[1]}
              <button type="button" onClick={() => onChange({ state: null, city: null, dir: 'any' })} className="ml-3 font-medium text-ink underline">
                Clear
              </button>
            </>
          ) : (
            <>
              {total} {total === 1 ? noun[0] : noun[1]}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
