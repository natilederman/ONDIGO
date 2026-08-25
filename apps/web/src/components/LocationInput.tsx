'use client';

import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type PlaceResult } from '@/lib/geocode';

export function LocationInput({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await searchPlaces(query);
      setResults(r);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-paper shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setQuery(r.label);
                  setOpen(false);
                  onSelect(r);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm hover:bg-line/50"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
