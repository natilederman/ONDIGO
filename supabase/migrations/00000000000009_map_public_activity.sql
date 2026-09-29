-- Public, address-free view of open activity for the homepage map.
-- Visitors are not allowed to read delivery_requests or trips (RLS), but the
-- map needs to show where things are moving. This returns only what the map
-- draws: coordinates rounded to one decimal (about 11 km), the pricing mode
-- and the clock. No text, no prices, no people.
create or replace function public.map_public_activity()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'plat', round(r.pickup_lat::numeric, 1), 'plng', round(r.pickup_lng::numeric, 1),
        'dlat', round(r.dropoff_lat::numeric, 1), 'dlng', round(r.dropoff_lng::numeric, 1),
        'mode', r.pricing_mode, 'ends_at', r.bidding_ends_at))
      from delivery_requests r where r.status = 'open'), '[]'::jsonb),
    'trips', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'olat', round(t.origin_lat::numeric, 1), 'olng', round(t.origin_lng::numeric, 1),
        'dlat', round(t.destination_lat::numeric, 1), 'dlng', round(t.destination_lng::numeric, 1),
        'depart_at', t.depart_at, 'vehicle', t.vehicle_type))
      from trips t where t.status = 'active' and t.depart_at > now() - interval '1 day'), '[]'::jsonb)
  );
$$;

revoke all on function public.map_public_activity() from public;
grant execute on function public.map_public_activity() to anon, authenticated;
