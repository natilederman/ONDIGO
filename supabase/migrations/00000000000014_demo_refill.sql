-- ---------------------------------------------------------------------------
-- Keep the demo alive. Every ten minutes the map is topped up so there are
-- always at least `demo_target_requests` open requests and
-- `demo_target_trips` upcoming driver trips. Each new one picks a route at
-- random from the pool below, repeats allowed, so some states end up busy and
-- others empty, the way real demand looks. Only the seeded demo accounts post,
-- and only their stale rows are retired. Turn it off by setting
-- `demo_refill_enabled` to 0.
-- ---------------------------------------------------------------------------

insert into platform_settings (key, value, note) values
  ('demo_target_requests', '36', 'Open requests the demo keeps on the map'),
  ('demo_target_trips', '36', 'Upcoming driver trips the demo keeps on the map'),
  ('demo_refill_enabled', '1', '1 keeps the demo topped up every ten minutes; 0 stops it')
on conflict (key) do nothing;

create table demo_routes (
  id serial primary key,
  from_city text not null, from_state text not null, from_lat double precision not null, from_lng double precision not null,
  to_city text not null, to_state text not null, to_lat double precision not null, to_lng double precision not null
);
insert into demo_routes (from_city, from_state, from_lat, from_lng, to_city, to_state, to_lat, to_lng) values
  ('Seattle', 'WA', 47.6, -122.315, 'Portland', 'OR', 45.522, -122.682),
  ('Seattle', 'WA', 47.6, -122.315, 'Spokane', 'WA', 47.67, -117.42),
  ('Portland', 'OR', 45.522, -122.682, 'Boise', 'ID', 43.609, -116.227),
  ('Boise', 'ID', 43.609, -116.227, 'Salt Lake City', 'UT', 40.777, -111.932),
  ('Spokane', 'WA', 47.67, -117.42, 'Missoula', 'MT', 46.872, -113.993),
  ('Billings', 'MT', 45.788, -108.54, 'Casper', 'WY', 42.847, -106.323),
  ('Salt Lake City', 'UT', 40.777, -111.932, 'Las Vegas', 'NV', 36.165, -115.151),
  ('Las Vegas', 'NV', 36.165, -115.151, 'Phoenix', 'AZ', 33.448, -112.067),
  ('Phoenix', 'AZ', 33.448, -112.067, 'Tucson', 'AZ', 32.207, -110.892),
  ('Tucson', 'AZ', 32.207, -110.892, 'Albuquerque', 'NM', 35.105, -106.641),
  ('Albuquerque', 'NM', 35.105, -106.641, 'Denver', 'CO', 39.741, -104.986),
  ('Denver', 'CO', 39.741, -104.986, 'Cheyenne', 'WY', 41.14, -104.82),
  ('Reno', 'NV', 39.53, -119.82, 'Sacramento', 'CA', 38.577, -121.472),
  ('San Francisco', 'CA', 37.784, -122.4, 'Reno', 'NV', 39.53, -119.82),
  ('Los Angeles', 'CA', 34.049, -118.232, 'Phoenix', 'AZ', 33.448, -112.067),
  ('San Diego', 'CA', 32.719, -117.151, 'Las Vegas', 'NV', 36.165, -115.151),
  ('Fresno', 'CA', 36.748, -119.773, 'San Jose', 'CA', 37.331, -121.888),
  ('Bismarck', 'ND', 46.808, -100.783, 'Fargo', 'ND', 46.877, -96.789),
  ('Fargo', 'ND', 46.877, -96.789, 'Sioux Falls', 'SD', 43.55, -96.73),
  ('Sioux Falls', 'SD', 43.55, -96.73, 'Omaha', 'NE', 41.24, -96.01),
  ('Omaha', 'NE', 41.24, -96.01, 'Kansas City', 'MO', 39.109, -94.606),
  ('Lincoln', 'NE', 40.82, -96.68, 'Wichita', 'KS', 37.676, -97.328),
  ('Wichita', 'KS', 37.676, -97.328, 'Oklahoma City', 'OK', 35.472, -97.521),
  ('Oklahoma City', 'OK', 35.472, -97.521, 'Dallas', 'TX', 32.772, -96.795),
  ('Tulsa', 'OK', 36.12, -95.93, 'Little Rock', 'AR', 34.736, -92.331),
  ('Dallas', 'TX', 32.772, -96.795, 'Shreveport', 'LA', 32.5, -93.77),
  ('Houston', 'TX', 29.741, -95.348, 'New Orleans', 'LA', 29.969, -90.088),
  ('San Antonio', 'TX', 29.42, -98.493, 'Corpus Christi', 'TX', 27.743, -97.402),
  ('El Paso', 'TX', 31.782, -106.512, 'Albuquerque', 'NM', 35.105, -106.641),
  ('Austin', 'TX', 30.269, -97.745, 'Waco', 'TX', 31.549, -97.146),
  ('Minneapolis', 'MN', 44.982, -93.254, 'Duluth', 'MN', 46.783, -92.106),
  ('Minneapolis', 'MN', 44.982, -93.254, 'Madison', 'WI', 43.073, -89.401),
  ('Des Moines', 'IA', 41.58, -93.62, 'Kansas City', 'MO', 39.109, -94.606),
  ('Cedar Rapids', 'IA', 41.97, -91.66, 'Chicago', 'IL', 41.848, -87.635),
  ('Milwaukee', 'WI', 43.03, -87.917, 'Green Bay', 'WI', 44.53, -88),
  ('Chicago', 'IL', 41.848, -87.635, 'Indianapolis', 'IN', 39.752, -86.172),
  ('St. Louis', 'MO', 38.637, -90.242, 'Springfield', 'IL', 39.788, -89.637),
  ('Kansas City', 'MO', 39.109, -94.606, 'St. Louis', 'MO', 38.637, -90.242),
  ('Memphis', 'TN', 35.145, -90.029, 'Little Rock', 'AR', 34.736, -92.331),
  ('Memphis', 'TN', 35.145, -90.029, 'Jackson', 'MS', 32.299, -90.185),
  ('Nashville', 'TN', 36.172, -86.782, 'Knoxville', 'TN', 35.97, -83.92),
  ('Louisville', 'KY', 38.227, -85.751, 'Lexington', 'KY', 38.05, -84.5),
  ('Jackson', 'MS', 32.299, -90.185, 'New Orleans', 'LA', 29.969, -90.088),
  ('Birmingham', 'AL', 33.53, -86.825, 'Montgomery', 'AL', 32.362, -86.279),
  ('Mobile', 'AL', 30.68, -88.05, 'Pensacola', 'FL', 30.421, -87.217),
  ('Atlanta', 'GA', 33.739, -84.368, 'Savannah', 'GA', 32.021, -81.11),
  ('Atlanta', 'GA', 33.739, -84.368, 'Chattanooga', 'TN', 35.07, -85.25),
  ('Jacksonville', 'FL', 30.332, -81.672, 'Tallahassee', 'FL', 30.45, -84.28),
  ('Orlando', 'FL', 28.512, -81.382, 'Tampa', 'FL', 27.949, -82.461),
  ('Miami', 'FL', 25.79, -80.226, 'Fort Myers', 'FL', 26.64, -81.86),
  ('Charlotte', 'NC', 35.207, -80.832, 'Raleigh', 'NC', 35.773, -78.647),
  ('Raleigh', 'NC', 35.773, -78.647, 'Richmond', 'VA', 37.552, -77.452),
  ('Columbia', 'SC', 33.997, -81.031, 'Charleston', 'SC', 32.792, -79.992),
  ('Greenville', 'SC', 34.853, -82.394, 'Asheville', 'NC', 35.601, -82.554),
  ('Norfolk', 'VA', 36.85, -76.28, 'Richmond', 'VA', 37.552, -77.452),
  ('Washington', 'DC', 38.901, -77.011, 'Baltimore', 'MD', 39.282, -76.615),
  ('Baltimore', 'MD', 39.282, -76.615, 'Philadelphia', 'PA', 39.946, -75.18),
  ('Pittsburgh', 'PA', 40.432, -80.002, 'Columbus', 'OH', 39.982, -82.992),
  ('Cleveland', 'OH', 41.472, -81.697, 'Detroit', 'MI', 42.334, -83.051),
  ('Detroit', 'MI', 42.334, -83.051, 'Grand Rapids', 'MI', 42.964, -85.67),
  ('Columbus', 'OH', 39.982, -82.992, 'Cincinnati', 'OH', 39.164, -84.459),
  ('Indianapolis', 'IN', 39.752, -86.172, 'Fort Wayne', 'IN', 41.08, -85.13),
  ('Charleston', 'WV', 38.35, -81.633, 'Pittsburgh', 'PA', 40.432, -80.002),
  ('New York', 'NY', 40.722, -73.996, 'Hartford', 'CT', 41.772, -72.682),
  ('Hartford', 'CT', 41.772, -72.682, 'Providence', 'RI', 41.823, -71.417),
  ('Boston', 'MA', 42.332, -71.072, 'Manchester', 'NH', 42.996, -71.455),
  ('Portland', 'ME', 43.672, -70.246, 'Boston', 'MA', 42.332, -71.072),
  ('Burlington', 'VT', 44.476, -73.212, 'Albany', 'NY', 42.654, -73.758),
  ('Newark', 'NJ', 40.7, -74.17, 'Trenton', 'NJ', 40.217, -74.743),
  ('Wilmington', 'DE', 39.746, -75.547, 'Philadelphia', 'PA', 39.946, -75.18),
  ('Syracuse', 'NY', 43.05, -76.15, 'Rochester', 'NY', 43.172, -77.622),
  ('Anchorage', 'AK', 61.214, -149.887, 'Fairbanks', 'AK', 64.837, -147.711),
  ('Honolulu', 'HI', 21.303, -157.858, 'Hilo', 'HI', 19.706, -155.082);

create table demo_items (
  id serial primary key,
  item text not null, size text not null, weight_kg numeric not null, value numeric not null,
  category item_category not null, fragile boolean not null default false
);
insert into demo_items (item, size, weight_kg, value, category, fragile) values
  ('Acoustic guitar in hard case', 'medium', 6, 450, 'instruments', true),
  ('Road bike, boxed', 'large', 12, 700, 'sports_outdoor', false),
  ('Set of four dining chairs', 'large', 22, 380, 'furniture', false),
  ('Wedding dress, boxed', 'medium', 3, 900, 'other', true),
  ('55 inch TV in original box', 'large', 18, 520, 'electronics', true),
  ('Crate of vinyl records', 'medium', 25, 300, 'boxes_parcels', false),
  ('Espresso machine', 'medium', 12, 650, 'appliances', true),
  ('Two framed paintings', 'medium', 8, 800, 'art_fragile', true),
  ('Dog crate, folded', 'medium', 11, 90, 'other', false),
  ('Box of children''s books', 'small', 7, 60, 'boxes_parcels', false),
  ('Office chair, assembled', 'large', 17, 220, 'furniture', false),
  ('Mini fridge', 'medium', 15, 180, 'appliances', false),
  ('Sewing machine', 'medium', 13, 260, 'appliances', false),
  ('Telescope and tripod', 'medium', 16, 540, 'sports_outdoor', true),
  ('Four winter tyres', 'large', 40, 480, 'vehicle_parts', false),
  ('Camping gear, two duffels', 'medium', 14, 200, 'sports_outdoor', false),
  ('Flat-packed bookshelf', 'large', 25, 140, 'furniture', false),
  ('Laptop and monitor, boxed', 'small', 6, 1100, 'electronics', true),
  ('Potted fiddle-leaf fig', 'medium', 9, 70, 'plants_garden', true),
  ('Keyboard (piano), 88 keys', 'large', 19, 600, 'instruments', true),
  ('Crib, flat-packed', 'large', 21, 240, 'furniture', false),
  ('Box of documents', 'small', 4, 40, 'documents', false),
  ('Electric scooter', 'medium', 14, 520, 'sports_outdoor', false),
  ('Antique mantel clock', 'small', 5, 1400, 'art_fragile', true),
  ('Folding treadmill', 'large', 60, 700, 'appliances', false),
  ('Rolled rug, 3 by 4 m', 'large', 18, 350, 'furniture', false),
  ('Baby stroller', 'medium', 10, 280, 'other', false),
  ('Toolbox and drill set', 'medium', 16, 320, 'other', false);

-- drivers the demo posts trips for, with what each one drives
create table demo_drivers (driver_id uuid primary key references profiles (id), vehicle vehicle_type not null, capacity_kg numeric not null, capacity_size text not null);
insert into demo_drivers values
  ('11111111-1111-1111-1111-111111111111', 'car', 25, 'trunk and back seat'),
  ('44444444-4444-4444-4444-444444444444', 'truck', 300, 'large / furniture'),
  ('55555555-5555-5555-5555-555555555555', 'car', 25, 'a few boxes'),
  ('66666666-6666-6666-6666-666666666666', 'truck', 400, 'large, up to a pallet'),
  ('77777777-7777-7777-7777-777777777777', 'car', 20, 'small to medium'),
  ('22222222-2222-2222-2222-222222222222', 'bike', 8, 'small parcel')
on conflict do nothing;

create function demo_refill() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_senders uuid[] := array[
    '33333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111'
  ]::uuid[];
  v_demo uuid[] := v_senders || array['22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666']::uuid[];
  v_need_r integer; v_need_t integer; v_added_r integer := 0; v_added_t integer := 0;
  v_retired_r integer := 0; v_retired_t integer := 0;
  r demo_routes%rowtype; it demo_items%rowtype; d demo_drivers%rowtype;
  v_km numeric; v_price numeric; v_auction boolean; v_rev boolean;
  i integer;
begin
  if coalesce(setting_num('demo_refill_enabled'), 1) = 0 then return jsonb_build_object('skipped', true); end if;

  -- retire stale demo rows: fixed-price requests past their date, trips that left over a day ago
  update delivery_requests set status = 'cancelled'
  where status = 'open' and sender_id = any(v_demo) and needed_by < current_date;
  get diagnostics v_retired_r = row_count;
  update trips set status = 'completed'
  where status = 'active' and driver_id = any(v_demo) and depart_at < now() - interval '1 day';
  get diagnostics v_retired_t = row_count;

  v_need_r := greatest(0, setting_num('demo_target_requests')::integer - (select count(*) from delivery_requests where status = 'open'));
  v_need_t := greatest(0, setting_num('demo_target_trips')::integer
    - (select count(*) from trips where status = 'active' and depart_at > now() - interval '1 day'));

  for i in 1 .. v_need_r loop
    -- any route, any direction, repeats allowed: busy states and empty states fall out on their own
    select * into r from demo_routes order by random() limit 1;
    v_rev := random() < 0.5;
    select * into it from demo_items order by random() limit 1;
    v_km := 6371 * acos(least(1, cos(radians(r.from_lat)) * cos(radians(r.to_lat)) * cos(radians(r.to_lng - r.from_lng)) + sin(radians(r.from_lat)) * sin(radians(r.to_lat))));
    v_price := round((22 + v_km * 0.085 * (1 + it.weight_kg / 45)) / 5) * 5;
    v_auction := random() < 0.6;
    insert into delivery_requests (
      sender_id, item_description, item_size, item_weight_kg,
      pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng,
      needed_by, pricing_mode, fixed_price, starting_price, current_price, bidding_ends_at,
      extend_on_bid, extend_seconds, fragile, legal_declaration_accepted,
      declared_value, declared_category, contents, open_box_required
    ) values (
      v_senders[1 + floor(random() * array_length(v_senders, 1))::integer], it.item, it.size, it.weight_kg,
      case when v_rev then r.to_city || ', ' || r.to_state else r.from_city || ', ' || r.from_state end,
      case when v_rev then r.to_lat else r.from_lat end, case when v_rev then r.to_lng else r.from_lng end,
      case when v_rev then r.from_city || ', ' || r.from_state else r.to_city || ', ' || r.to_state end,
      case when v_rev then r.from_lat else r.to_lat end, case when v_rev then r.from_lng else r.to_lng end,
      current_date + 3 + floor(random() * 8)::integer,
      case when v_auction then 'auction' else 'fixed' end::pricing_mode,
      case when v_auction then null else v_price end,
      case when v_auction then round(v_price * 1.3) else null end,
      case when v_auction then v_price else null end,
      case when v_auction then now() + make_interval(hours => 6 + floor(random() * 90)::integer) else null end,
      v_auction, 90, it.fragile, true,
      it.value, it.category, it.item, true
    );
    v_added_r := v_added_r + 1;
  end loop;

  for i in 1 .. v_need_t loop
    select * into r from demo_routes order by random() limit 1;
    v_rev := random() < 0.5;
    select * into d from demo_drivers order by random() limit 1;
    insert into trips (driver_id, origin_text, origin_lat, origin_lng, destination_text, destination_lat, destination_lng,
                       depart_at, vehicle_type, capacity_weight_kg, capacity_size, notes)
    values (
      d.driver_id,
      case when v_rev then r.to_city || ', ' || r.to_state else r.from_city || ', ' || r.from_state end,
      case when v_rev then r.to_lat else r.from_lat end, case when v_rev then r.to_lng else r.from_lng end,
      case when v_rev then r.from_city || ', ' || r.from_state else r.to_city || ', ' || r.to_state end,
      case when v_rev then r.from_lat else r.to_lat end, case when v_rev then r.from_lng else r.to_lng end,
      now() + make_interval(hours => 6 + floor(random() * 160)::integer),
      d.vehicle, d.capacity_kg, d.capacity_size,
      (array['Leaving early, back the next day.', 'Room in the back, happy to carry.', 'Regular run, can take a few things.', 'Driving down for the weekend.'])[1 + floor(random() * 4)::integer]
    );
    v_added_t := v_added_t + 1;
  end loop;

  return jsonb_build_object('requests_added', v_added_r, 'trips_added', v_added_t, 'requests_retired', v_retired_r, 'trips_retired', v_retired_t);
end;
$$;
revoke execute on function demo_refill() from public, anon, authenticated;

alter table demo_routes enable row level security;
alter table demo_items enable row level security;
alter table demo_drivers enable row level security;

select cron.schedule('demo-refill', '*/10 * * * *', 'select demo_refill();');
select demo_refill();
