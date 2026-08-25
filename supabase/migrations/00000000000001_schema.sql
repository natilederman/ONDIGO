-- ONDIGO core schema

create extension if not exists "pgcrypto";

create type vehicle_type as enum ('car', 'truck', 'bike', 'scooter');
create type trip_status as enum ('active', 'completed', 'cancelled');
create type pricing_mode as enum ('fixed', 'auction');
create type request_status as enum ('open', 'matched', 'cancelled');
create type bid_status as enum ('active', 'outbid', 'accepted', 'rejected');
create type delivery_status as enum ('pending_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'disputed');
create type transaction_status as enum ('held', 'released', 'refunded');

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  bio text,
  vehicle_type vehicle_type,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- connections (follow system)
-- ---------------------------------------------------------------------------
create table connections (
  follower_id uuid not null references profiles (id) on delete cascade,
  following_id uuid not null references profiles (id) on delete cascade,
  traded boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- trips (driver side)
-- ---------------------------------------------------------------------------
create table trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references profiles (id) on delete cascade,
  origin_text text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_text text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  depart_at timestamptz not null,
  vehicle_type vehicle_type not null,
  capacity_weight_kg numeric(6, 2) not null,
  capacity_size text not null,
  notes text,
  status trip_status not null default 'active',
  created_at timestamptz not null default now()
);

create index trips_status_depart_idx on trips (status, depart_at);
create index trips_driver_idx on trips (driver_id);

-- ---------------------------------------------------------------------------
-- delivery_requests (sender side)
-- ---------------------------------------------------------------------------
create table delivery_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  item_description text not null,
  item_size text not null,
  item_weight_kg numeric(6, 2) not null,
  pickup_text text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_text text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  needed_by date not null,
  pricing_mode pricing_mode not null,
  fixed_price numeric(8, 2),
  starting_price numeric(8, 2),
  current_price numeric(8, 2),
  bidding_ends_at timestamptz,
  extend_on_bid boolean not null default false,
  extend_seconds integer not null default 60,
  legal_declaration_accepted boolean not null default false,
  status request_status not null default 'open',
  matched_trip_id uuid references trips (id),
  matched_driver_id uuid references profiles (id),
  created_at timestamptz not null default now(),
  constraint pricing_fields_valid check (
    (pricing_mode = 'fixed' and fixed_price is not null)
    or
    (pricing_mode = 'auction' and starting_price is not null and bidding_ends_at is not null)
  )
);

create index requests_status_idx on delivery_requests (status);
create index requests_sender_idx on delivery_requests (sender_id);
create index requests_bidding_ends_idx on delivery_requests (bidding_ends_at) where status = 'open';

-- ---------------------------------------------------------------------------
-- bids (auction mode)
-- ---------------------------------------------------------------------------
create table bids (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references delivery_requests (id) on delete cascade,
  driver_id uuid not null references profiles (id) on delete cascade,
  amount numeric(8, 2) not null,
  status bid_status not null default 'active',
  created_at timestamptz not null default now()
);

create index bids_request_idx on bids (request_id, status);
create index bids_driver_idx on bids (driver_id);

-- ---------------------------------------------------------------------------
-- deliveries (the matched job)
-- ---------------------------------------------------------------------------
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references delivery_requests (id),
  trip_id uuid references trips (id),
  driver_id uuid not null references profiles (id),
  sender_id uuid not null references profiles (id),
  agreed_price numeric(8, 2) not null,
  status delivery_status not null default 'pending_pickup',
  pickup_photo_url text,
  pickup_photo_at timestamptz,
  dropoff_photo_url text,
  dropoff_photo_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index deliveries_driver_idx on deliveries (driver_id);
create index deliveries_sender_idx on deliveries (sender_id);

-- ---------------------------------------------------------------------------
-- transactions (mock escrow ledger)
-- ---------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries (id) on delete cascade,
  amount numeric(8, 2) not null,
  platform_fee numeric(8, 2) not null default 0,
  status transaction_status not null default 'held',
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create index transactions_delivery_idx on transactions (delivery_id);

-- ---------------------------------------------------------------------------
-- messages (chat, scoped per delivery)
-- ---------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_delivery_idx on messages (delivery_id, created_at);

-- ---------------------------------------------------------------------------
-- location_pings (live tracking trail)
-- ---------------------------------------------------------------------------
create table location_pings (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);

create index location_pings_delivery_idx on location_pings (delivery_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries (id) on delete cascade,
  reviewer_id uuid not null references profiles (id),
  reviewee_id uuid not null references profiles (id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (delivery_id, reviewer_id)
);

create index reviews_reviewee_idx on reviews (reviewee_id);

-- ---------------------------------------------------------------------------
-- panic_alerts
-- ---------------------------------------------------------------------------
create table panic_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  delivery_id uuid references deliveries (id),
  lat double precision,
  lng double precision,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index panic_alerts_user_idx on panic_alerts (user_id);
