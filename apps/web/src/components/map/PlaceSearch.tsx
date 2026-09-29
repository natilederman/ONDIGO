'use client';

/**
 * Type a state or a town; pick one; the map goes there. Every one of the 769
 * known places is searchable, including the ones the map has no room to
 * label at the current zoom.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { City } from '@/lib/map/data';

type Hit = { kind: 'state'; abbr: string; name: string; n: number } | { kind: 'city'; abbr: string; key: string; name: string; state: string; pop: number };

export function PlaceSearch({
  cities,
  states,
  counts,
  onPick,
}: {
  cities: City[];
  states: { abbr: string; name: string }[];
  counts: Record<string, number>;
  onPick: (abbr: string, cityKey?: string) => void;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const starts = (name: string) => name.toLowerCase().startsWith(t) || name.toLowerCase().split(/[\s.]+/).some((w) => w.startsWith(t));
    const st: Hit[] = states
      .filter((s) => starts(s.name) || s.abbr.toLowerCase() === t)
      .map((s) => ({ kind: 'state', abbr: s.abbr, name: s.name, n: counts[s.abbr] || 0 }));
    const ct: Hit[] = cities
      .filter((c) => starts(c.name))
      .sort((a, b) => b.pop - a.pop)
      .slice(0, 8)
      .map((c) => ({ kind: 'city', abbr: c.state, key: c.key, name: c.name, state: c.state, pop: c.pop }));
    return [...st, ...ct].slice(0, 10);
  }, [q, cities, states, counts]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (h: Hit) => {
    onPick(h.abbr, h.kind === 'city' ? h.key : undefined);
    setQ('');
    setOpen(false);
  };

  return (
    <div ref={box} className="dm-search">
      <svg className="ico" viewBox="0 0 24 24" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        placeholder="Find a state, city or town"
        aria-label="Find a state, city or town"
        autoComplete="off"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!hits.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(hits[active]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && hits.length > 0 && (
        <div className="dm-results" role="listbox">
          {hits.map((h, i) => (
            <button
              key={h.kind === 'state' ? 'st-' + h.abbr : h.key}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(h)}
            >
              <span className="nm">
                {h.name}
                <small>{h.kind === 'state' ? 'State' : h.state}</small>
              </span>
              <span className="ct tnum">
                {h.kind === 'state' ? (h.n ? `${h.n} leaving` : 'No open requests') : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
