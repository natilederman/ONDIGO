export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
  /** House number and street, when the match is precise enough to have one. */
  line1?: string;
  postcode?: string;
  city?: string;
  /** True when the match resolves to a building, not just a town or region. */
  precise: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  addresstype?: string;
  address?: Record<string, string>;
}

const PRECISE_TYPES = new Set(['house', 'building', 'residential', 'address', 'amenity', 'shop', 'office']);

function toPlace(d: NominatimResult): PlaceResult {
  const a = d.address ?? {};
  const houseNumber = a.house_number;
  const road = a.road ?? a.pedestrian ?? a.footway;
  const line1 = [houseNumber, road].filter(Boolean).join(' ') || undefined;
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.municipality;

  return {
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    line1,
    postcode: a.postcode,
    city,
    // A street-level result is one that carries a road; a bare town does not.
    precise: Boolean(road) || PRECISE_TYPES.has(d.addresstype ?? d.type ?? ''),
  };
}

/**
 * Free OpenStreetMap Nominatim geocoder, fine for demo traffic. For production
 * volume swap in a paid provider behind this same signature.
 *
 * `addressdetails=1` is what lets us pull out street, postcode and city instead
 * of only getting back one long display string.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8` +
    `&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
    if (!res.ok) return [];
    const data: NominatimResult[] = await res.json();
    return data.map(toPlace);
  } catch {
    // An aborted or failed lookup must not break the form: the caller can still
    // fall back to the address the user typed.
    return [];
  }
}
