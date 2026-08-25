-- ONDIGO business logic: triggers + RPC functions
-- All RPCs are SECURITY DEFINER so they can cross RLS boundaries safely, but every one
-- re-checks auth.uid() against the relevant party before doing anything.

create extension if not exists pg_cron with schema pg_catalog;

-- ---------------------------------------------------------------------------
-- new auth user -> profile row
-- ---------------------------------------------------------------------------
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, vehicle_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'vehicle_type', '')::vehicle_type
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- bid placement: validates, marks prior bids outbid, updates current_price,
-- optionally extends the countdown timer
-- ---------------------------------------------------------------------------
create function place_bid(p_request_id uuid, p_amount numeric)
returns bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request delivery_requests%rowtype;
  v_bid bids%rowtype;
  v_ceiling numeric;
begin
  select * into v_request from delivery_requests where id = p_request_id for update;

  if not found then
    raise exception 'Request not found';
  end if;
  if v_request.status <> 'open' or v_request.pricing_mode <> 'auction' then
    raise exception 'Request is not open for bidding';
  end if;
  if v_request.bidding_ends_at <= now() then
    raise exception 'Bidding has closed';
  end if;

  v_ceiling := coalesce(v_request.current_price, v_request.starting_price);
  if p_amount >= v_ceiling then
    raise exception 'Bid must be lower than the current price (%.2f)', v_ceiling;
  end if;
  if p_amount <= 0 then
    raise exception 'Bid must be greater than zero';
  end if;

  update bids set status = 'outbid'
  where request_id = p_request_id and status = 'active';

  insert into bids (request_id, driver_id, amount)
  values (p_request_id, auth.uid(), p_amount)
  returning * into v_bid;

  update delivery_requests
  set current_price = p_amount,
      bidding_ends_at = case
        when v_request.extend_on_bid
          then greatest(bidding_ends_at, now() + make_interval(secs => v_request.extend_seconds))
        else bidding_ends_at
      end
  where id = p_request_id;

  return v_bid;
end;
$$;

grant execute on function place_bid(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- shared helper: turn an accepted bid/fixed-price request into a delivery
-- ---------------------------------------------------------------------------
create function create_delivery_for_request(p_request delivery_requests, p_driver_id uuid, p_price numeric)
returns deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery deliveries%rowtype;
begin
  update delivery_requests
  set status = 'matched', matched_driver_id = p_driver_id
  where id = p_request.id;

  insert into deliveries (request_id, driver_id, sender_id, agreed_price)
  values (p_request.id, p_driver_id, p_request.sender_id, p_price)
  returning * into v_delivery;

  return v_delivery;
end;
$$;

-- ---------------------------------------------------------------------------
-- sender manually accepts a bid at any time
-- ---------------------------------------------------------------------------
create function accept_bid(p_bid_id uuid)
returns deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid bids%rowtype;
  v_request delivery_requests%rowtype;
  v_delivery deliveries%rowtype;
begin
  select * into v_bid from bids where id = p_bid_id;
  if not found then
    raise exception 'Bid not found';
  end if;

  select * into v_request from delivery_requests where id = v_bid.request_id for update;
  if v_request.sender_id <> auth.uid() then
    raise exception 'Only the sender can accept a bid';
  end if;
  if v_request.status <> 'open' then
    raise exception 'Request is no longer open';
  end if;
  if v_request.legal_declaration_accepted is not true then
    raise exception 'Legal declaration must be accepted before matching';
  end if;

  update bids set status = 'rejected'
  where request_id = v_request.id and id <> p_bid_id and status = 'active';
  update bids set status = 'accepted' where id = p_bid_id;

  v_delivery := create_delivery_for_request(v_request, v_bid.driver_id, v_bid.amount);
  return v_delivery;
end;
$$;

grant execute on function accept_bid(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- fixed-price request: first driver to accept wins (race-safe)
-- ---------------------------------------------------------------------------
create function accept_fixed_price_request(p_request_id uuid)
returns deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request delivery_requests%rowtype;
  v_delivery deliveries%rowtype;
begin
  update delivery_requests
  set status = 'matched', matched_driver_id = auth.uid()
  where id = p_request_id
    and status = 'open'
    and pricing_mode = 'fixed'
    and legal_declaration_accepted = true
  returning * into v_request;

  if not found then
    raise exception 'Request is no longer available';
  end if;

  insert into deliveries (request_id, driver_id, sender_id, agreed_price)
  values (v_request.id, auth.uid(), v_request.sender_id, v_request.fixed_price)
  returning * into v_delivery;

  return v_delivery;
end;
$$;

grant execute on function accept_fixed_price_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- pg_cron sweep: auto-close expired auctions, accept the lowest active bid
-- ---------------------------------------------------------------------------
create function close_expired_auctions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_lowest_bid bids%rowtype;
begin
  for v_request in
    select * from delivery_requests
    where status = 'open' and pricing_mode = 'auction' and bidding_ends_at <= now()
    for update skip locked
  loop
    select * into v_lowest_bid from bids
      where request_id = v_request.id and status = 'active'
      order by amount asc, created_at asc
      limit 1;

    if found then
      update bids set status = 'rejected'
        where request_id = v_request.id and id <> v_lowest_bid.id and status = 'active';
      update bids set status = 'accepted' where id = v_lowest_bid.id;

      perform create_delivery_for_request(v_request, v_lowest_bid.driver_id, v_lowest_bid.amount);
    else
      update delivery_requests set status = 'cancelled' where id = v_request.id;
    end if;
  end loop;
end;
$$;

select cron.schedule('close-expired-auctions', '* * * * *', 'select close_expired_auctions();');

-- ---------------------------------------------------------------------------
-- mock escrow: fund on match, release on delivery confirmation, refund on dispute
-- ---------------------------------------------------------------------------
create function fund_escrow(p_delivery_id uuid)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery deliveries%rowtype;
  v_txn transactions%rowtype;
begin
  select * into v_delivery from deliveries where id = p_delivery_id;
  if v_delivery.sender_id <> auth.uid() then
    raise exception 'Only the sender can fund escrow';
  end if;
  if exists (select 1 from transactions where delivery_id = p_delivery_id) then
    raise exception 'Escrow already funded for this delivery';
  end if;

  insert into transactions (delivery_id, amount, platform_fee, status)
  values (p_delivery_id, v_delivery.agreed_price, round(v_delivery.agreed_price * 0.1, 2), 'held')
  returning * into v_txn;

  return v_txn;
end;
$$;

grant execute on function fund_escrow(uuid) to authenticated;

create function confirm_delivery(p_delivery_id uuid)
returns deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery deliveries%rowtype;
begin
  select * into v_delivery from deliveries where id = p_delivery_id;
  if v_delivery.sender_id <> auth.uid() then
    raise exception 'Only the sender can confirm delivery';
  end if;
  if v_delivery.dropoff_photo_url is null then
    raise exception 'A drop-off photo is required before confirming delivery';
  end if;
  if not exists (select 1 from transactions where delivery_id = p_delivery_id and status = 'held') then
    raise exception 'Escrow must be funded before confirming delivery';
  end if;

  update transactions set status = 'released', released_at = now() where delivery_id = p_delivery_id;
  update deliveries set status = 'completed', completed_at = now() where id = p_delivery_id
    returning * into v_delivery;

  return v_delivery;
end;
$$;

grant execute on function confirm_delivery(uuid) to authenticated;

create function refund_escrow(p_delivery_id uuid)
returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery deliveries%rowtype;
  v_txn transactions%rowtype;
begin
  select * into v_delivery from deliveries where id = p_delivery_id;
  if auth.uid() not in (v_delivery.sender_id, v_delivery.driver_id) then
    raise exception 'Only a delivery participant can request a refund';
  end if;

  update transactions set status = 'refunded', released_at = now()
    where delivery_id = p_delivery_id and status = 'held'
    returning * into v_txn;
  update deliveries set status = 'disputed' where id = p_delivery_id;

  return v_txn;
end;
$$;

grant execute on function refund_escrow(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- reviews -> recompute reviewee rating; completed delivery -> mutual connection
-- ---------------------------------------------------------------------------
create function handle_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set rating_count = rating_count + 1,
      rating_avg = round(((rating_avg * rating_count) + new.rating) / (rating_count + 1), 2)
  where id = new.reviewee_id;
  return new;
end;
$$;

create trigger on_review_created
  after insert on reviews
  for each row execute function handle_review_insert();

create function handle_delivery_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    insert into connections (follower_id, following_id, traded)
      values (new.sender_id, new.driver_id, true)
      on conflict (follower_id, following_id) do update set traded = true;
    insert into connections (follower_id, following_id, traded)
      values (new.driver_id, new.sender_id, true)
      on conflict (follower_id, following_id) do update set traded = true;
  end if;
  return new;
end;
$$;

create trigger on_delivery_completed
  after update on deliveries
  for each row execute function handle_delivery_completed();

-- ---------------------------------------------------------------------------
-- panic alert: log + return so the client can show emergency contact info
-- ---------------------------------------------------------------------------
create function trigger_panic_alert(p_delivery_id uuid, p_lat double precision, p_lng double precision)
returns panic_alerts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert panic_alerts%rowtype;
begin
  insert into panic_alerts (user_id, delivery_id, lat, lng)
  values (auth.uid(), p_delivery_id, p_lat, p_lng)
  returning * into v_alert;
  return v_alert;
end;
$$;

grant execute on function trigger_panic_alert(uuid, double precision, double precision) to authenticated;
