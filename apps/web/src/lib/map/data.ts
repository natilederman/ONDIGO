/**
 * Data behind the departures map.
 *
 * Geography is static and served from /public/map: state shapes (us-atlas,
 * Census) and 769 populated places with population (Natural Earth). Activity
 * comes from Supabase in one of two shapes: full rows for members, or the
 * address-free `map_public_activity` RPC for visitors. Both are normalised to
 * MapItem, whose endpoints are snapped to the nearest known place so the map
 * only ever labels a city, never a street.
 */
import { geoDistance } from 'd3';
import type { DeliveryRequest } from '@ondigo/shared';
import type { TripWithDriver } from '@ondigo/shared/src/queries/trips';

export type StateProps = { name: string; abbr: string };
export type StateFeature = GeoJSON.Feature<GeoJSON.Geometry, StateProps>;
export type StatesFC = GeoJSON.FeatureCollection<GeoJSON.Geometry, StateProps>;

export interface City {
  state: string;
  name: string;
  lat: number;
  lng: number;
  pop: number;
  key: string;
}

export interface Endpoint {
  lat: number;
  lng: number;
  city: string;
  state: string;
  key: string;
}

export interface MapItem {
  id: string;
  kind: 'request' | 'trip';
  from: Endpoint;
  to: Endpoint;
  /** requests */
  mode?: 'fixed' | 'auction';
  price?: number | null;
  item?: string;
  endsAt?: string | null;
  weightKg?: number;
  /** trips */
  driver?: string;
  vehicle?: string;
  departAt?: string;
}

export interface MapData {
  states: StatesFC;
  cities: City[];
}

export const cityKey = (state: string, name: string) => `${state}|${name.toLowerCase()}`;

let cache: Promise<MapData> | null = null;

export function loadMapData(): Promise<MapData> {
  if (!cache) {
    cache = Promise.all([
      fetch('/map/us-states.json').then((r) => r.json() as Promise<StatesFC>),
      fetch('/map/us-cities.json').then((r) => r.json() as Promise<[string, string, number, number, number][]>),
    ]).then(([states, rows]) => ({
      states,
      cities: rows.map(([state, name, lat, lng, pop]) => ({ state, name, lat, lng, pop, key: cityKey(state, name) })),
    }));
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

/** The nearest known place. A pickup in a suburb lights the city it belongs to. */
export function snap(cities: City[], lat: number, lng: number): Endpoint {
  let best: City | null = null;
  let bestD = Infinity;
  const p: [number, number] = [lng, lat];
  for (const c of cities) {
    // cheap reject before the spherical distance
    if (Math.abs(c.lat - lat) > 3 || Math.abs(c.lng - lng) > 4) continue;
    const d = geoDistance(p, [c.lng, c.lat]);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  if (!best) {
    for (const c of cities) {
      const d = geoDistance(p, [c.lng, c.lat]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
  }
  const c = best as City;
  return { lat: c.lat, lng: c.lng, city: c.name, state: c.state, key: c.key };
}

type PublicRequest = { id: string; plat: number; plng: number; dlat: number; dlng: number; mode: 'fixed' | 'auction'; ends_at: string | null };
type PublicTrip = { id: string; olat: number; olng: number; dlat: number; dlng: number; depart_at: string; vehicle: string };
export type PublicActivity = { requests: PublicRequest[]; trips: PublicTrip[] };

export function itemsFromPublic(a: PublicActivity, cities: City[]): MapItem[] {
  const reqs: MapItem[] = (a.requests ?? []).map((r) => ({
    id: r.id,
    kind: 'request',
    from: snap(cities, r.plat, r.plng),
    to: snap(cities, r.dlat, r.dlng),
    mode: r.mode,
    endsAt: r.ends_at,
  }));
  const trips: MapItem[] = (a.trips ?? []).map((t) => ({
    id: t.id,
    kind: 'trip',
    from: snap(cities, t.olat, t.olng),
    to: snap(cities, t.dlat, t.dlng),
    vehicle: t.vehicle,
    departAt: t.depart_at,
  }));
  return [...reqs, ...trips];
}

export function itemsFromRows(requests: DeliveryRequest[], trips: TripWithDriver[], cities: City[]): MapItem[] {
  const reqs: MapItem[] = requests.map((r) => ({
    id: r.id,
    kind: 'request',
    from: snap(cities, r.pickup_lat, r.pickup_lng),
    to: snap(cities, r.dropoff_lat, r.dropoff_lng),
    mode: r.pricing_mode,
    price: r.pricing_mode === 'auction' ? r.current_price : r.fixed_price,
    item: r.item_description,
    endsAt: r.bidding_ends_at,
    weightKg: Number(r.item_weight_kg),
  }));
  const trs: MapItem[] = trips.map((t) => ({
    id: t.id,
    kind: 'trip',
    from: snap(cities, t.origin_lat, t.origin_lng),
    to: snap(cities, t.destination_lat, t.destination_lng),
    driver: t.driver?.full_name ?? 'Driver',
    vehicle: t.vehicle_type,
    departAt: t.depart_at,
  }));
  return [...reqs, ...trs];
}

/** "in 2 days", "in 5 hours", "today" */
export function departsIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return 'now';
  const h = Math.round(ms / 3600000);
  if (h < 1) return 'within the hour';
  if (h < 36) return `in ${h} ${h === 1 ? 'hour' : 'hours'}`;
  const d = Math.round(h / 24);
  return `in ${d} days`;
}
