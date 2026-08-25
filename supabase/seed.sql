-- Demo data for local development. All demo accounts use password: ondigo123

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'alice@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Rivera","vehicle_type":"car"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'ben@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ben Cho","vehicle_type":"bike"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'carla@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Nguyen"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
   'drew@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Drew Patel","vehicle_type":"truck"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated',
   'frank@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Frank Ito","vehicle_type":"car"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated',
   'grace@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Kim","vehicle_type":"truck"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated',
   'hana@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Hana Osei","vehicle_type":"car"}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated',
   'ivan@ondigo.test', crypt('ondigo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ivan Petrov"}', now(), now(),
   '', '', '', '', '', '', '');

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@ondigo.test"}', 'email', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"ben@ondigo.test"}', 'email', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"carla@ondigo.test"}', 'email', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"drew@ondigo.test"}', 'email', now(), now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"sub":"55555555-5555-5555-5555-555555555555","email":"frank@ondigo.test"}', 'email', now(), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '{"sub":"66666666-6666-6666-6666-666666666666","email":"grace@ondigo.test"}', 'email', now(), now(), now()),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '{"sub":"77777777-7777-7777-7777-777777777777","email":"hana@ondigo.test"}', 'email', now(), now(), now()),
  ('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '{"sub":"88888888-8888-8888-8888-888888888888","email":"ivan@ondigo.test"}', 'email', now(), now(), now());

update profiles set bio = 'Driving between SF and LA most weekends. Happy to carry small-to-medium items.'
  where id = '11111111-1111-1111-1111-111111111111';
update profiles set bio = 'Bike courier around downtown Austin. Fast and careful with fragile stuff.'
  where id = '22222222-2222-2222-2222-222222222222';
update profiles set bio = 'Shipping things around often for my small business.'
  where id = '33333333-3333-3333-3333-333333333333';
update profiles set bio = 'Truck owner, long-haul routes up and down the I-5.'
  where id = '44444444-4444-4444-4444-444444444444';
update profiles set bio = 'Drive Columbus to New Orleans a couple times a month for work. Trunk and back seat usually have room.'
  where id = '55555555-5555-5555-5555-555555555555';
update profiles set bio = 'Own a box truck, mostly runs empty on the way back down to LA. Can take big stuff — furniture, appliances, whatever fits.'
  where id = '66666666-6666-6666-6666-666666666666';
update profiles set bio = 'New to ONDIGO — commute NYC to Boston most Fridays, happy to carry a few things along the way.'
  where id = '77777777-7777-7777-7777-777777777777';
update profiles set bio = 'Small business owner, ship stuff pretty regularly.'
  where id = '88888888-8888-8888-8888-888888888888';

-- ---------------------------------------------------------------------------
-- Open trips
-- ---------------------------------------------------------------------------
insert into trips (driver_id, origin_text, origin_lat, origin_lng, destination_text, destination_lat, destination_lng, depart_at, vehicle_type, capacity_weight_kg, capacity_size, notes)
values
  ('11111111-1111-1111-1111-111111111111', 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, now() + interval '2 days', 'car', 20, 'medium box', 'Leaving Saturday morning, back Sunday night.'),
  ('44444444-4444-4444-4444-444444444444', 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, now() + interval '3 days', 'truck', 200, 'large / furniture', 'Empty truck bed heading south, plenty of room.'),
  ('22222222-2222-2222-2222-222222222222', 'Austin, TX', 30.2672, -97.7431, 'Austin, TX (downtown)', 30.2711, -97.7437, now() + interval '1 day', 'bike', 5, 'small parcel', 'Local downtown run, can do multiple stops.'),
  ('66666666-6666-6666-6666-666666666666', 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, now() + interval '4 days', 'truck', 400, 'large / furniture, up to a full pallet', 'Driving down Friday with a completely empty truck — put whatever you want on me, depends on size. Big items totally fine, the more the better.'),
  ('55555555-5555-5555-5555-555555555555', 'Columbus, OH', 39.9612, -82.9988, 'New Orleans, LA', 29.9511, -90.0715, now() + interval '5 days', 'car', 25, 'a few boxes, trunk + back seat', 'Driving down to New Orleans, car is mostly empty — can take a few boxes if they fit in the trunk or back seat.'),
  ('77777777-7777-7777-7777-777777777777', 'New York, NY', 40.7128, -74.0060, 'Boston, MA', 42.3601, -71.0589, now() + interval '6 days', 'car', 15, 'small-medium', 'Regular Friday commute, happy to carry a few things.');

-- ---------------------------------------------------------------------------
-- Open delivery requests
-- ---------------------------------------------------------------------------

-- Fixed price, unclaimed
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted)
values
  ('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Sealed box of handmade candles', 'small box', 3, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date + 4, 'fixed', 45.00, true),
  ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Surfboard', 'large / awkward shape', 8, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date + 6, 'fixed', 60.00, true);

-- Auction: Bookshelf, Seattle -> Portland — active bidding war between two drivers
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, starting_price, current_price, bidding_ends_at, extend_on_bid, extend_seconds, legal_declaration_accepted)
values
  ('a0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Bookshelf (flat-packed)', 'large', 25, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, current_date + 5, 'auction', 80.00, 55.00, now() + interval '2 hours', true, 60, true);

insert into bids (request_id, driver_id, amount, status, created_at)
values
  ('a0000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 70.00, 'outbid', now() - interval '40 minutes'),
  ('a0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 65.00, 'outbid', now() - interval '25 minutes'),
  ('a0000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 55.00, 'active', now() - interval '10 minutes');

-- Auction: Mini fridge, Columbus OH -> New Orleans LA — three drivers competing
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, starting_price, current_price, bidding_ends_at, extend_on_bid, extend_seconds, legal_declaration_accepted)
values
  ('a0000000-0000-0000-0000-000000000004', '88888888-8888-8888-8888-888888888888', 'Mini fridge', 'medium', 15, 'Columbus, OH', 39.9612, -82.9988, 'New Orleans, LA', 29.9511, -90.0715, current_date + 7, 'auction', 120.00, 85.00, now() + interval '3 hours', true, 90, true);

insert into bids (request_id, driver_id, amount, status, created_at)
values
  ('a0000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 100.00, 'outbid', now() - interval '50 minutes'),
  ('a0000000-0000-0000-0000-000000000004', '77777777-7777-7777-7777-777777777777', 95.00, 'outbid', now() - interval '30 minutes'),
  ('a0000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 85.00, 'active', now() - interval '5 minutes');

-- Auction: Queen mattress + bed frame, SF -> LA — big item, two truck drivers competing
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, starting_price, current_price, bidding_ends_at, extend_on_bid, extend_seconds, legal_declaration_accepted)
values
  ('a0000000-0000-0000-0000-000000000005', '88888888-8888-8888-8888-888888888888', 'Queen mattress + bed frame', 'large / bulky', 60, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date + 4, 'auction', 300.00, 265.00, now() + interval '90 minutes', true, 120, true);

insert into bids (request_id, driver_id, amount, status, created_at)
values
  ('a0000000-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666', 280.00, 'outbid', now() - interval '35 minutes'),
  ('a0000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 265.00, 'active', now() - interval '8 minutes');

-- ---------------------------------------------------------------------------
-- Rating history: past completed deliveries + reviews, so drivers have a real
-- track record to compare when choosing who to send with.
-- ---------------------------------------------------------------------------

-- Alice Rivera: 3 reviews (5, 5, 4) -> avg 4.67
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted, status, matched_driver_id)
values
  ('b0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Framed print', 'small', 2, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date - 20, 'fixed', 35.00, true, 'matched', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'Guitar case', 'medium', 6, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date - 40, 'fixed', 50.00, true, 'matched', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Box of books', 'medium', 10, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date - 60, 'fixed', 40.00, true, 'matched', '11111111-1111-1111-1111-111111111111');

insert into deliveries (id, request_id, driver_id, sender_id, agreed_price, status, completed_at, created_at)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 35.00, 'completed', current_date - 18, current_date - 20),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 50.00, 'completed', current_date - 38, current_date - 40),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 40.00, 'completed', current_date - 58, current_date - 60);

insert into reviews (delivery_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('c0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 5, 'Super easy, item arrived in perfect condition.', current_date - 18),
  ('c0000000-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 5, 'Great communication the whole way down.', current_date - 38),
  ('c0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 4, 'A day later than planned but all good.', current_date - 58);

-- Ben Cho: 2 reviews (5, 4) -> avg 4.5
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted, status, matched_driver_id)
values
  ('b0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Small parcel', 'small', 2, 'Austin, TX', 30.2672, -97.7431, 'Austin, TX (downtown)', 30.2711, -97.7437, current_date - 10, 'fixed', 12.00, true, 'matched', '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000005', '88888888-8888-8888-8888-888888888888', 'Envelope of documents', 'small', 1, 'Austin, TX', 30.2672, -97.7431, 'Austin, TX (downtown)', 30.2711, -97.7437, current_date - 25, 'fixed', 10.00, true, 'matched', '22222222-2222-2222-2222-222222222222');

insert into deliveries (id, request_id, driver_id, sender_id, agreed_price, status, completed_at, created_at)
values
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 12.00, 'completed', current_date - 10, current_date - 10),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 10.00, 'completed', current_date - 25, current_date - 25);

insert into reviews (delivery_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('c0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 5, 'Fast! Delivered within the hour.', current_date - 10),
  ('c0000000-0000-0000-0000-000000000005', '88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 4, 'Good, a little late but kept me posted.', current_date - 25);

-- Drew Patel: 4 reviews (5, 5, 5, 4) -> avg 4.75, top-rated long-haul driver
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted, status, matched_driver_id)
values
  ('b0000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'Dining chairs (pair)', 'large', 20, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, current_date - 15, 'fixed', 70.00, true, 'matched', '44444444-4444-4444-4444-444444444444'),
  ('b0000000-0000-0000-0000-000000000007', '88888888-8888-8888-8888-888888888888', 'Moving boxes (5)', 'large', 40, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, current_date - 30, 'fixed', 90.00, true, 'matched', '44444444-4444-4444-4444-444444444444'),
  ('b0000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 'Bike (boxed)', 'large', 15, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, current_date - 45, 'fixed', 55.00, true, 'matched', '44444444-4444-4444-4444-444444444444'),
  ('b0000000-0000-0000-0000-000000000009', '88888888-8888-8888-8888-888888888888', 'Office chair', 'large', 18, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784, current_date - 70, 'fixed', 65.00, true, 'matched', '44444444-4444-4444-4444-444444444444');

insert into deliveries (id, request_id, driver_id, sender_id, agreed_price, status, completed_at, created_at)
values
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 70.00, 'completed', current_date - 14, current_date - 15),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 90.00, 'completed', current_date - 29, current_date - 30),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 55.00, 'completed', current_date - 44, current_date - 45),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 65.00, 'completed', current_date - 69, current_date - 70);

insert into reviews (delivery_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('c0000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 5, 'Handled the chairs carefully, no scratches.', current_date - 14),
  ('c0000000-0000-0000-0000-000000000007', '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 5, 'Very reliable, exactly on schedule.', current_date - 29),
  ('c0000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 5, 'Great with a bulky item, would use again.', current_date - 44),
  ('c0000000-0000-0000-0000-000000000009', '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 4, 'Solid, minor delay picking up.', current_date - 69);

-- Frank Ito: 1 review (5) — newer driver, perfect but small sample
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted, status, matched_driver_id)
values
  ('b0000000-0000-0000-0000-000000000010', '88888888-8888-8888-8888-888888888888', 'Box of tools', 'medium', 12, 'Columbus, OH', 39.9612, -82.9988, 'New Orleans, LA', 29.9511, -90.0715, current_date - 12, 'fixed', 55.00, true, 'matched', '55555555-5555-5555-5555-555555555555');

insert into deliveries (id, request_id, driver_id, sender_id, agreed_price, status, completed_at, created_at)
values
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', '55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888', 55.00, 'completed', current_date - 11, current_date - 12);

insert into reviews (delivery_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('c0000000-0000-0000-0000-000000000010', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 5, 'Great first experience, very communicative.', current_date - 11);

-- Grace Kim: 2 reviews (4, 3) — decent but mixed track record
insert into delivery_requests (id, sender_id, item_description, item_size, item_weight_kg, pickup_text, pickup_lat, pickup_lng, dropoff_text, dropoff_lat, dropoff_lng, needed_by, pricing_mode, fixed_price, legal_declaration_accepted, status, matched_driver_id)
values
  ('b0000000-0000-0000-0000-000000000011', '33333333-3333-3333-3333-333333333333', 'Couch (loveseat)', 'large / bulky', 55, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date - 18, 'fixed', 220.00, true, 'matched', '66666666-6666-6666-6666-666666666666'),
  ('b0000000-0000-0000-0000-000000000012', '88888888-8888-8888-8888-888888888888', 'Washer/dryer set', 'large / bulky', 90, 'San Francisco, CA', 37.7749, -122.4194, 'Los Angeles, CA', 34.0522, -118.2437, current_date - 33, 'fixed', 260.00, true, 'matched', '66666666-6666-6666-6666-666666666666');

insert into deliveries (id, request_id, driver_id, sender_id, agreed_price, status, completed_at, created_at)
values
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 220.00, 'completed', current_date - 17, current_date - 18),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', '66666666-6666-6666-6666-666666666666', '88888888-8888-8888-8888-888888888888', 260.00, 'completed', current_date - 32, current_date - 33);

insert into reviews (delivery_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('c0000000-0000-0000-0000-000000000011', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 4, 'Got it there safe, a bit of a wait to schedule pickup.', current_date - 17),
  ('c0000000-0000-0000-0000-000000000012', '88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 3, 'Item arrived fine but communication was slow.', current_date - 32);
