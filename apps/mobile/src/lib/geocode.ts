import { blockLabel } from '@ondigo/shared';

export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
  /** House number and street, when the match has one. Kept private. */
  line1?: string;
  city?: string;
  state?: string;
}

/** What other members see: "1200 block of Valencia St, San Francisco, CA", never the door. */
export const publicPlace = (p: PlaceResult) => (p.city ? blockLabel(p.line1 ?? '', p.city, p.state) : p.label);

// Free OpenStreetMap Nominatim geocoder — fine for dev/demo traffic. For production
// volume, swap in a paid geocoding provider behind this same function signature.
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data: Array<{ display_name: string; lat: string; lon: string; address?: Record<string, string> }> = await res.json();
  return data.map((d) => {
    const a = d.address ?? {};
    return {
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      line1: [a.house_number, a.road].filter(Boolean).join(' ') || undefined,
      city: a.city ?? a.town ?? a.village ?? a.suburb,
      state: a['ISO3166-2-lvl4']?.replace(/^US-/, ''),
    };
  });
}
