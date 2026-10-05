/**
 * Which open requests suit a trip, by geography.
 *
 * The trip is treated as a straight segment from origin to destination. A
 * request is "on the way" when its pickup and drop-off both lie within a
 * detour of that segment and the pickup comes before the drop-off. Anything
 * else that starts near the trip's origin is offered separately, so a driver
 * crossing San Francisco only ever sees San Francisco work.
 */
import type { DeliveryRequest } from '@ondigo/shared';

type Pt = { lat: number; lng: number };

/** Ends closer than this count as the same city, as on the map. */
export const NEAR_KM = 25;

/** Flat projection around a latitude: plenty accurate at city and state scale. */
function project(p: Pt, lat0: number) {
  return { x: p.lng * 111.32 * Math.cos((lat0 * Math.PI) / 180), y: p.lat * 110.57 };
}

export function km(a: Pt, b: Pt): number {
  const lat0 = (a.lat + b.lat) / 2;
  const p = project(a, lat0), q = project(b, lat0);
  return Math.hypot(p.x - q.x, p.y - q.y);
}

/** Distance from p to the segment a→b, and how far along it p falls (0 at a, 1 at b). */
function toSegment(p: Pt, a: Pt, b: Pt) {
  const lat0 = (a.lat + b.lat) / 2;
  const P = project(p, lat0), A = project(a, lat0), B = project(b, lat0);
  const dx = B.x - A.x, dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2)) : 0;
  return { off: Math.hypot(P.x - (A.x + t * dx), P.y - (A.y + t * dy)), t };
}

/** How far off the line a driver would reasonably go: 2 km across town, more on a long run. */
export function detourKm(tripKm: number): number {
  return tripKm < NEAR_KM ? 2 : Math.min(40, Math.max(15, tripKm * 0.08));
}

export interface TripMatch {
  request: DeliveryRequest;
  /** km off the route at pickup and drop-off; only set for on-the-way matches */
  pickupOff?: number;
  dropoffOff?: number;
}

export function matchRequests(trip: { origin: Pt; destination: Pt }, requests: DeliveryRequest[]) {
  const tripKm = km(trip.origin, trip.destination);
  const limit = detourKm(tripKm);
  const onTheWay: TripMatch[] = [];
  const nearby: TripMatch[] = [];
  for (const r of requests) {
    const pick = { lat: r.pickup_lat, lng: r.pickup_lng };
    const drop = { lat: r.dropoff_lat, lng: r.dropoff_lng };
    const a = toSegment(pick, trip.origin, trip.destination);
    const b = toSegment(drop, trip.origin, trip.destination);
    if (a.off <= limit && b.off <= limit && a.t <= b.t) {
      onTheWay.push({ request: r, pickupOff: a.off, dropoffOff: b.off });
    } else if (km(pick, trip.origin) <= NEAR_KM) {
      nearby.push({ request: r });
    }
  }
  onTheWay.sort((x, y) => x.pickupOff! + x.dropoffOff! - (y.pickupOff! + y.dropoffOff!));
  // nearby: closest pickup first
  const startKm = (m: TripMatch) => km({ lat: m.request.pickup_lat, lng: m.request.pickup_lng }, trip.origin);
  nearby.sort((x, y) => startKm(x) - startKm(y));
  return { onTheWay, nearby, tripKm, limit };
}
