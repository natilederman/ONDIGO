-- Row Level Security: every table locked down to its owning/participating users.
-- Mutations that need cross-cutting logic (bids, matching, escrow) go through the
-- SECURITY DEFINER functions in 00000000000002_functions.sql instead of raw client writes.

alter table profiles enable row level security;
alter table connections enable row level security;
alter table trips enable row level security;
alter table delivery_requests enable row level security;
alter table bids enable row level security;
alter table deliveries enable row level security;
alter table transactions enable row level security;
alter table messages enable row level security;
alter table location_pings enable row level security;
alter table reviews enable row level security;
alter table panic_alerts enable row level security;

-- profiles: public read, self write
create policy "profiles are publicly readable" on profiles for select to authenticated using (true);
create policy "users update own profile" on profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- connections: visible to and manageable by the follower
create policy "connections visible to participants" on connections for select to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);
create policy "users create own connections" on connections for insert to authenticated
  with check (auth.uid() = follower_id);
create policy "users remove own connections" on connections for delete to authenticated
  using (auth.uid() = follower_id);

-- trips: open trips are public, owners see/manage all of their own
create policy "trips are publicly readable" on trips for select to authenticated
  using (status = 'active' or auth.uid() = driver_id);
create policy "drivers create own trips" on trips for insert to authenticated
  with check (auth.uid() = driver_id);
create policy "drivers update own trips" on trips for update to authenticated
  using (auth.uid() = driver_id);

-- delivery_requests: open requests are public, sender/matched driver see their own always
create policy "requests are publicly readable" on delivery_requests for select to authenticated
  using (status = 'open' or auth.uid() = sender_id or auth.uid() = matched_driver_id);
create policy "senders create own requests" on delivery_requests for insert to authenticated
  with check (auth.uid() = sender_id);
create policy "senders update own requests" on delivery_requests for update to authenticated
  using (auth.uid() = sender_id);

-- bids: driver sees own bids, sender sees all bids on their request. No direct client
-- writes -- use the place_bid() / accept_bid() RPCs.
create policy "bids visible to driver and request owner" on bids for select to authenticated
  using (
    auth.uid() = driver_id
    or auth.uid() = (select sender_id from delivery_requests where id = bids.request_id)
  );

-- deliveries: visible and updatable (for photo urls / status progress) by participants only
create policy "deliveries visible to participants" on deliveries for select to authenticated
  using (auth.uid() = driver_id or auth.uid() = sender_id);
create policy "delivery participants update progress" on deliveries for update to authenticated
  using (auth.uid() = driver_id or auth.uid() = sender_id);

-- transactions: visible to the delivery's participants only. Writes via RPCs only.
create policy "transactions visible to participants" on transactions for select to authenticated
  using (
    auth.uid() in (
      select sender_id from deliveries where id = transactions.delivery_id
      union
      select driver_id from deliveries where id = transactions.delivery_id
    )
  );

-- messages: chat scoped to the two delivery participants
create policy "messages visible to participants" on messages for select to authenticated
  using (
    auth.uid() in (
      select sender_id from deliveries where id = messages.delivery_id
      union
      select driver_id from deliveries where id = messages.delivery_id
    )
  );
create policy "participants send messages" on messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select sender_id from deliveries where id = messages.delivery_id
      union
      select driver_id from deliveries where id = messages.delivery_id
    )
  );

-- location_pings: tracking scoped to the two delivery participants
create policy "pings visible to participants" on location_pings for select to authenticated
  using (
    auth.uid() in (
      select sender_id from deliveries where id = location_pings.delivery_id
      union
      select driver_id from deliveries where id = location_pings.delivery_id
    )
  );
create policy "participants record pings" on location_pings for insert to authenticated
  with check (
    auth.uid() in (
      select sender_id from deliveries where id = location_pings.delivery_id
      union
      select driver_id from deliveries where id = location_pings.delivery_id
    )
  );

-- reviews: public read (profile pages), only a real delivery participant can review, once each
create policy "reviews are publicly readable" on reviews for select to authenticated using (true);
create policy "completed delivery participants can review" on reviews for insert to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from deliveries d
      where d.id = reviews.delivery_id
        and d.status = 'completed'
        and (d.sender_id = auth.uid() or d.driver_id = auth.uid())
        and reviewee_id in (d.sender_id, d.driver_id)
        and reviewee_id <> auth.uid()
    )
  );

-- panic_alerts: private to the user who triggered them. Writes via trigger_panic_alert() RPC.
create policy "users see own panic alerts" on panic_alerts for select to authenticated
  using (auth.uid() = user_id);
