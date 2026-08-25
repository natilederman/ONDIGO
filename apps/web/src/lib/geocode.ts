export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

// Free OpenStreetMap Nominatim geocoder — fine for dev/demo traffic. For production
// volume, swap in a paid geocoding provider behind this same function signature.
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
}
