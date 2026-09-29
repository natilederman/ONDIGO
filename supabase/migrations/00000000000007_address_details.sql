-- ---------------------------------------------------------------------------
-- Full address capture.
--
-- delivery_requests.pickup_text / dropoff_text hold the geocoded street address
-- and stay publicly readable, because a driver needs them to judge and price the
-- job before bidding.
--
-- The precise parts (apartment number, door code, who to call) must NOT sit on
-- delivery_requests: that table is readable by every authenticated user while a
-- request is open, so storing a phone number there would publish the sender's
-- home address and number to the whole platform. They live here instead and are
-- released only to the driver who actually won the job.
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists phone text;

create table if not exists request_contact_details (
  request_id uuid primary key references delivery_requests (id) on delete cascade,

  -- pickup end
  pickup_line2 text,            -- apartment, unit, floor, building
  pickup_postcode text,
  pickup_contact_name text,
  pickup_contact_phone text,
  pickup_instructions text,     -- buzzer code, gate, "ring the side door"

  -- drop-off end (often a different person entirely)
  dropoff_line2 text,
  dropoff_postcode text,
  dropoff_contact_name text,
  dropoff_contact_phone text,
  dropoff_instructions text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table request_contact_details enable row level security;

-- The sender owns these details and can always see and edit them.
create policy "senders read own contact details" on request_contact_details
  for select to authenticated
  using (
    auth.uid() = (select sender_id from delivery_requests r where r.id = request_id)
  );

create policy "senders write own contact details" on request_contact_details
  for insert to authenticated
  with check (
    auth.uid() = (select sender_id from delivery_requests r where r.id = request_id)
  );

create policy "senders update own contact details" on request_contact_details
  for update to authenticated
  using (
    auth.uid() = (select sender_id from delivery_requests r where r.id = request_id)
  );

-- The winning driver sees them only once a delivery exists, and only until it is
-- finished. Bidding drivers see nothing.
create policy "matched driver reads contact details" on request_contact_details
  for select to authenticated
  using (
    exists (
      select 1
      from deliveries d
      where d.request_id = request_contact_details.request_id
        and d.driver_id = auth.uid()
        and d.status in ('pending_pickup', 'picked_up', 'in_transit', 'delivered')
    )
  );

create index if not exists request_contact_details_request_idx
  on request_contact_details (request_id);

grant select, insert, update on request_contact_details to authenticated;
