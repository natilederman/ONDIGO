-- ---------------------------------------------------------------------------
-- Phase A of the driver verification plan (approved 30 Sep 2026).
--
-- The gate sits at the bid. A person may browse with an account, post once
-- they are contactable, and take custody of someone's property only once
-- their identity has been checked. Vehicle jobs need a licence, insurance and
-- the vehicle on file; jobs above a value threshold need a records check.
--
-- Everything here is modelled so a paid vendor later replaces `provider =
-- 'manual'` with `stripe_identity` or `checkr` without a schema change: a
-- check is a kind, a status, a reference and a timestamp.
-- ---------------------------------------------------------------------------

-- ---------- types ----------
create type verification_tier as enum ('none', 'contactable', 'identified', 'road_ready', 'screened', 'payable');
create type verification_kind as enum (
  'phone', 'identity_document', 'liveness', 'driving_licence', 'insurance', 'vehicle',
  'criminal_records', 'motor_vehicle_record', 'payout_account'
);
create type verification_status as enum ('submitted', 'in_review', 'approved', 'rejected', 'pre_adverse_hold', 'expired', 'withdrawn');
create type item_category as enum (
  'boxes_parcels', 'furniture', 'appliances', 'electronics', 'sports_outdoor', 'instruments',
  'art_fragile', 'documents', 'vehicle_parts', 'plants_garden', 'other', 'household_move'
);

-- ---------- settings the functions read ----------
create table platform_settings (
  key text primary key,
  value jsonb not null,
  note text
);
insert into platform_settings (key, value, note) values
  ('value_threshold_screened', '1000', 'Declared value above which the driver must be screened and the sender identified (USD)'),
  ('max_declared_value', '10000', 'Requests above this cannot be posted (USD)'),
  ('protection_cap', '250', 'What ONDIGO stands behind per job before an insurer is involved (USD)'),
  ('min_age_courier', '18', 'Minimum age for bike and on-foot couriers'),
  ('min_age_driver', '21', 'Minimum age for car and truck drivers'),
  ('platform_fee_rate', '0.10', 'Share of the agreed price kept by the platform');

create function setting_num(p_key text) returns numeric
language sql stable security definer set search_path = public as $$
  select (value)::text::numeric from platform_settings where key = p_key
$$;

-- ---------- private profile fields ----------
-- profiles is readable by every authenticated user, so nothing sensitive goes there.
create table profile_private (
  user_id uuid primary key references profiles (id) on delete cascade,
  phone text,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  updated_at timestamptz not null default now()
);

alter table profiles
  add column verification_tier verification_tier not null default 'none',
  add column tier_updated_at timestamptz,
  add column is_admin boolean not null default false,
  add column suspended_at timestamptz,
  add column suspension_reason text;

-- the public phone column from migration 7 moves to the private table
insert into profile_private (user_id, phone) select id, phone from profiles where phone is not null;
alter table profiles drop column phone;

-- ---------- checks ----------
create table verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kind verification_kind not null,
  status verification_status not null default 'submitted',
  provider text not null default 'manual',       -- manual | supabase_auth | demo | stripe_identity | checkr
  provider_ref text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  reviewed_by uuid references profiles (id),
  decision_reason text,                          -- platform-authored, shown to the person; never a vendor code
  expires_at timestamptz,
  -- a non-sensitive summary only: document type, last 4, expiry, plate. Never numbers, never images.
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index verifications_user_kind_idx on verifications (user_id, kind, status);
create index verifications_queue_idx on verifications (status, submitted_at) where status in ('submitted', 'in_review');

-- images live in a private bucket and are deleted on a clock; only the outcome stays
create table verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references verifications (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  label text not null,                          -- front | back | selfie | insurance_card | registration | vehicle_photo | licence_front | licence_back
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  delete_after timestamptz not null default now() + interval '90 days'
);
create index verification_documents_purge_idx on verification_documents (delete_after);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  verification_id uuid references verifications (id) on delete set null,
  vehicle_type vehicle_type not null,
  make text, model text, model_year integer, colour text,
  plate text not null, plate_state text,
  vin_last6 text,
  insurance_named_insured text,
  insurance_expires_on date,
  licence_expires_on date,
  created_at timestamptz not null default now()
);
create index vehicles_user_idx on vehicles (user_id);

-- ---------- policies people accept ----------
create table policy_documents (
  key text not null,        -- prohibited_items | driver_terms | biometric_notice | fcra_disclosure
  version integer not null,
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  primary key (key, version)
);

create table prohibited_item_rules (
  id serial primary key,
  grp text not null check (grp in ('legal', 'insurer', 'handling')),
  label text not null,
  note text,
  sort integer not null default 0
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  policy_key text not null,
  policy_version integer not null,
  accepted_at timestamptz not null default now(),
  context jsonb not null default '{}'::jsonb,
  unique (user_id, policy_key, policy_version),
  foreign key (policy_key, policy_version) references policy_documents (key, version)
);

-- ---------- what a request declares ----------
alter table delivery_requests
  add column declared_value numeric(10, 2),
  add column declared_category item_category,
  add column contents text,
  add column open_box_required boolean not null default true,
  add column vehicle_type_required vehicle_type,
  add column prohibited_items_version integer,
  add column legal_declaration_accepted_at timestamptz;

-- ---------- funnel ----------
create table onboarding_events (
  id bigserial primary key,
  user_id uuid references profiles (id) on delete cascade,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index onboarding_events_user_idx on onboarding_events (user_id, created_at);

-- ---------- seed content ----------
insert into prohibited_item_rules (grp, label, note, sort) values
  ('legal', 'Hazardous materials', 'fuel, gas cylinders, paints and solvents, chemicals, aerosols in bulk', 1),
  ('legal', 'Loose lithium batteries and damaged battery devices', 'installed batteries in a working device are fine', 2),
  ('legal', 'Fireworks and explosives', null, 3),
  ('legal', 'Firearms, ammunition and weapons', null, 4),
  ('legal', 'Drugs and controlled substances', 'prescription medicine only with the pharmacy label and the recipient named', 5),
  ('legal', 'Alcohol and tobacco', 'licensed carriage is a separate regime ONDIGO does not run', 6),
  ('legal', 'Cash, securities, gift cards', null, 7),
  ('legal', 'Human remains, body parts, biological samples', null, 8),
  ('legal', 'Live animals', null, 9),
  ('legal', 'People', null, 10),
  ('insurer', 'Fine art, antiques and collectibles', null, 20),
  ('insurer', 'Jewellery, watches and precious metals', null, 21),
  ('insurer', 'Anything worth more than the declared-value ceiling', 'the ceiling is shown when you post', 22),
  ('insurer', 'Fragile goods that are not packed', 'glass, ceramics and screens must be boxed and padded', 23),
  ('handling', 'Whole-household moves', 'moving a home is licensed work in most states; ONDIGO carries items, not households', 30),
  ('handling', 'Pianos, hot tubs, billiard tables, safes over 45 kg', null, 31),
  ('handling', 'Items heavier than the vehicle class can carry', 'weight decides which drivers may bid', 32),
  ('handling', 'Items that need two people and the sender provides none', null, 33);

insert into policy_documents (key, version, title, body) values
  ('prohibited_items', 1, 'What ONDIGO does not carry',
   'I confirm the item is not on the prohibited list shown above, that I have described its contents truthfully, and that packaging will be left open for the driver to inspect at pickup. I understand the driver may refuse and report any item that does not match, without penalty.'),
  ('driver_terms', 1, 'Carrying for ONDIGO',
   'I am an independent contractor. I choose my own routes and times and may decline any job. I will carry only what the request describes, photograph the item at pickup and at drop-off from my own device, and hand it to the named person or leave it exactly where the sender asked. I understand my personal auto policy may not cover carrying goods for payment and that ONDIGO does not insure my vehicle. I will not share my account. Decisions to suspend an account state their basis and can be appealed.'),
  ('biometric_notice', 1, 'Notice before the selfie',
   'To confirm the person holding the ID is the person on it, ONDIGO asks for a live photo of your face and compares it to the photo on your document. The comparison is made by a verification provider. ONDIGO keeps the result and the date, not the images. Images are deleted on the schedule published in the privacy notice (at most 90 days for manual review). You may decline, in which case you can still send items but cannot carry them.'),
  ('fcra_disclosure', 1, 'Disclosure regarding background reports',
   'ONDIGO may obtain a consumer report about you from a consumer reporting agency for the purpose of deciding whether you may carry jobs above the value threshold. The report may include criminal records and, for drivers, your motor vehicle record. You have the right to receive a copy of the report and a summary of your rights under the Fair Credit Reporting Act before any adverse decision, and to dispute inaccurate information with the agency.');

-- ---------- helpers ----------
create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create function has_check(p_user uuid, p_kind verification_kind) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from verifications
    where user_id = p_user and kind = p_kind and status = 'approved'
      and (expires_at is null or expires_at > now())
  )
$$;

create function has_consent(p_user uuid, p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from consents c
    where c.user_id = p_user and c.policy_key = p_key
      and c.policy_version = (select max(version) from policy_documents where key = p_key)
  )
$$;

create function age_years(p_dob date) returns integer
language sql immutable as $$
  select case when p_dob is null then null else date_part('year', age(current_date, p_dob))::integer end
$$;

-- the highest approved vehicle class a person has: 0 none, 1 car, 2 truck
create function vehicle_rank(p_user uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(max(case v.vehicle_type when 'truck' then 2 when 'car' then 1 else 0 end), 0)
  from vehicles v join verifications ver on ver.id = v.verification_id
  where v.user_id = p_user and ver.status = 'approved' and (ver.expires_at is null or ver.expires_at > now())
    and has_check(p_user, 'driving_licence') and has_check(p_user, 'insurance')
$$;

-- what the weight of an item demands: up to 10 kg any courier, up to 50 kg a car, beyond that a truck
create function vehicle_class_for_weight(p_kg numeric) returns vehicle_type
language sql immutable as $$
  select case when p_kg <= 10 then 'bike'::vehicle_type when p_kg <= 50 then 'car'::vehicle_type else 'truck'::vehicle_type end
$$;

-- ---------- the tier, recomputed from evidence ----------
create function recompute_verification_tier(p_user uuid) returns verification_tier
language plpgsql security definer set search_path = public as $$
declare
  v_priv profile_private%rowtype;
  v_tier verification_tier := 'none';
  v_age integer;
begin
  select * into v_priv from profile_private where user_id = p_user;
  v_age := age_years(v_priv.date_of_birth);

  if v_priv.email_verified_at is not null and v_priv.phone_verified_at is not null
     and coalesce(v_priv.emergency_contact_phone, '') <> '' then
    v_tier := 'contactable';
  end if;

  if v_tier = 'contactable'
     and has_check(p_user, 'identity_document') and has_check(p_user, 'liveness')
     and v_age >= setting_num('min_age_courier')
     and has_consent(p_user, 'prohibited_items') and has_consent(p_user, 'driver_terms') then
    v_tier := 'identified';
  end if;

  if v_tier = 'identified' and vehicle_rank(p_user) >= 1 and v_age >= setting_num('min_age_driver') then
    v_tier := 'road_ready';
  end if;

  if v_tier in ('identified', 'road_ready') and has_check(p_user, 'criminal_records')
     and (vehicle_rank(p_user) = 0 or has_check(p_user, 'motor_vehicle_record')) then
    v_tier := 'screened';
  end if;

  if v_tier = 'screened' and has_check(p_user, 'payout_account') then
    v_tier := 'payable';
  end if;

  update profiles set verification_tier = v_tier, tier_updated_at = now()
  where id = p_user and verification_tier is distinct from v_tier;
  return v_tier;
end;
$$;

create function trg_recompute_tier() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recompute_verification_tier(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;
create trigger verifications_recompute after insert or update or delete on verifications for each row execute function trg_recompute_tier();
create trigger consents_recompute after insert or delete on consents for each row execute function trg_recompute_tier();
create trigger profile_private_recompute after insert or update on profile_private for each row execute function trg_recompute_tier();
create trigger vehicles_recompute after insert or update or delete on vehicles for each row execute function trg_recompute_tier();

-- email and phone confirmations arrive from auth.users; mirror them, never expose auth.users
create function sync_auth_confirmations() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profile_private (user_id, phone, phone_verified_at, email_verified_at)
  values (new.id, new.phone, new.phone_confirmed_at, new.email_confirmed_at)
  on conflict (user_id) do update
    set phone = coalesce(excluded.phone, profile_private.phone),
        phone_verified_at = coalesce(excluded.phone_verified_at, profile_private.phone_verified_at),
        email_verified_at = coalesce(excluded.email_verified_at, profile_private.email_verified_at),
        updated_at = now();
  return new;
end;
$$;
create trigger on_auth_user_confirmed after insert or update of email_confirmed_at, phone_confirmed_at, phone on auth.users
  for each row execute function sync_auth_confirmations();

-- backfill from what auth already knows
insert into profile_private (user_id, email_verified_at, phone, phone_verified_at)
select id, email_confirmed_at, phone, phone_confirmed_at from auth.users
on conflict (user_id) do update set email_verified_at = excluded.email_verified_at;

-- ---------- what a request requires, and whether a person may take it ----------
create function request_requires(p_request delivery_requests) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'vehicle_class', coalesce(p_request.vehicle_type_required, vehicle_class_for_weight(p_request.item_weight_kg)),
    'screened', coalesce(p_request.declared_value, 0) > setting_num('value_threshold_screened')
                or p_request.declared_category in ('art_fragile', 'electronics') and coalesce(p_request.declared_value, 0) > setting_num('value_threshold_screened') / 2
  )
$$;

-- null when allowed; otherwise a sentence the app can show
create function why_cannot_take(p_user uuid, p_request delivery_requests) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_prof profiles%rowtype;
  v_req jsonb;
  v_need integer;
begin
  select * into v_prof from profiles where id = p_user;
  if v_prof.suspended_at is not null then
    return 'This account is suspended: ' || coalesce(v_prof.suspension_reason, 'see your account page') || '.';
  end if;
  if v_prof.verification_tier < 'identified' then
    return 'Verify your identity before bidding. It takes a few minutes on your account page.';
  end if;
  v_req := request_requires(p_request);
  v_need := case v_req ->> 'vehicle_class' when 'truck' then 2 when 'car' then 1 else 0 end;
  if v_need > vehicle_rank(p_user) then
    return case when v_need = 2 then 'This job needs a truck on file with a licence and insurance.'
                else 'This job needs a car or truck on file with a licence and insurance.' end;
  end if;
  if (v_req ->> 'screened')::boolean and v_prof.verification_tier < 'screened' then
    return 'This job is above the value threshold and needs a completed records check.';
  end if;
  return null;
end;
$$;
grant execute on function why_cannot_take(uuid, delivery_requests) to authenticated;
grant execute on function request_requires(delivery_requests) to authenticated;

create function assert_can_take(p_user uuid, p_request delivery_requests) returns void
language plpgsql stable security definer set search_path = public as $$
declare v_reason text;
begin
  v_reason := why_cannot_take(p_user, p_request);
  if v_reason is not null then
    raise exception '%', v_reason using errcode = 'P0001';
  end if;
end;
$$;

-- convenience for the request page: reason for the caller, by request id
create function why_cannot_take_request(p_request_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select why_cannot_take(auth.uid(), r) from delivery_requests r where r.id = p_request_id
$$;
grant execute on function why_cannot_take_request(uuid) to authenticated;

-- ---------- the gate ----------
create or replace function place_bid(p_request_id uuid, p_amount numeric)
returns bids
language plpgsql security definer set search_path = public as $$
declare
  v_request delivery_requests%rowtype;
  v_bid bids%rowtype;
  v_ceiling numeric;
begin
  select * into v_request from delivery_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_request.status <> 'open' or v_request.pricing_mode <> 'auction' then raise exception 'Request is not open for bidding'; end if;
  if v_request.bidding_ends_at <= now() then raise exception 'Bidding has closed'; end if;
  if v_request.sender_id = auth.uid() then raise exception 'You cannot bid on your own request'; end if;

  perform assert_can_take(auth.uid(), v_request);

  v_ceiling := coalesce(v_request.current_price, v_request.starting_price);
  if p_amount >= v_ceiling then raise exception 'Bid must be lower than the current price (%.2f)', v_ceiling; end if;
  if p_amount <= 0 then raise exception 'Bid must be greater than zero'; end if;

  update bids set status = 'outbid' where request_id = p_request_id and status = 'active';
  insert into bids (request_id, driver_id, amount) values (p_request_id, auth.uid(), p_amount) returning * into v_bid;
  update delivery_requests
  set current_price = p_amount,
      bidding_ends_at = case when v_request.extend_on_bid
        then greatest(bidding_ends_at, now() + make_interval(secs => v_request.extend_seconds)) else bidding_ends_at end
  where id = p_request_id;
  insert into onboarding_events (user_id, event, meta) values (auth.uid(), 'bid_placed', jsonb_build_object('request_id', p_request_id));
  return v_bid;
end;
$$;

create or replace function accept_fixed_price_request(p_request_id uuid)
returns deliveries
language plpgsql security definer set search_path = public as $$
declare
  v_request delivery_requests%rowtype;
  v_delivery deliveries%rowtype;
begin
  select * into v_request from delivery_requests where id = p_request_id for update;
  if not found or v_request.status <> 'open' or v_request.pricing_mode <> 'fixed' or v_request.legal_declaration_accepted is not true then
    raise exception 'Request is no longer available';
  end if;
  if v_request.sender_id = auth.uid() then raise exception 'You cannot accept your own request'; end if;
  perform assert_can_take(auth.uid(), v_request);

  update delivery_requests set status = 'matched', matched_driver_id = auth.uid() where id = p_request_id;
  insert into deliveries (request_id, driver_id, sender_id, agreed_price)
  values (v_request.id, auth.uid(), v_request.sender_id, v_request.fixed_price)
  returning * into v_delivery;
  return v_delivery;
end;
$$;

-- the sender's manual accept re-checks the bidder, who may have been suspended since
create or replace function accept_bid(p_bid_id uuid)
returns deliveries
language plpgsql security definer set search_path = public as $$
declare
  v_bid bids%rowtype;
  v_request delivery_requests%rowtype;
  v_delivery deliveries%rowtype;
begin
  select * into v_bid from bids where id = p_bid_id;
  if not found then raise exception 'Bid not found'; end if;
  select * into v_request from delivery_requests where id = v_bid.request_id for update;
  if v_request.sender_id <> auth.uid() then raise exception 'Only the sender can accept a bid'; end if;
  if v_request.status <> 'open' then raise exception 'Request is no longer open'; end if;
  if v_request.legal_declaration_accepted is not true then raise exception 'Legal declaration must be accepted before matching'; end if;
  perform assert_can_take(v_bid.driver_id, v_request);

  update bids set status = 'rejected' where request_id = v_request.id and id <> p_bid_id and status = 'active';
  update bids set status = 'accepted' where id = p_bid_id;
  v_delivery := create_delivery_for_request(v_request, v_bid.driver_id, v_bid.amount);
  return v_delivery;
end;
$$;

-- the sweep awards the lowest bid from a driver who still qualifies
create or replace function close_expired_auctions()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_request delivery_requests%rowtype;
  v_bid bids%rowtype;
begin
  for v_request in
    select * from delivery_requests
    where status = 'open' and pricing_mode = 'auction' and bidding_ends_at <= now()
    for update skip locked
  loop
    select b.* into v_bid from bids b
      where b.request_id = v_request.id and b.status = 'active'
        and why_cannot_take(b.driver_id, v_request) is null
      order by b.amount asc, b.created_at asc
      limit 1;
    if found then
      update bids set status = 'rejected' where request_id = v_request.id and id <> v_bid.id and status = 'active';
      update bids set status = 'accepted' where id = v_bid.id;
      perform create_delivery_for_request(v_request, v_bid.driver_id, v_bid.amount);
    else
      update delivery_requests set status = 'cancelled' where id = v_request.id;
    end if;
  end loop;
end;
$$;

-- ---------- what a sender may post ----------
create function trg_request_declaration() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tier verification_tier;
begin
  if new.declared_category = 'household_move' then
    raise exception 'ONDIGO carries items, not whole-household moves. Moving a home is licensed work in most states.';
  end if;
  if new.declared_value is not null and new.declared_value > setting_num('max_declared_value') then
    raise exception 'Items worth more than $% cannot be posted on ONDIGO.', setting_num('max_declared_value')::integer;
  end if;
  if new.vehicle_type_required is null then
    new.vehicle_type_required := vehicle_class_for_weight(new.item_weight_kg);
  end if;
  if new.declared_value is not null and new.declared_value > setting_num('value_threshold_screened') then
    select verification_tier into v_tier from profiles where id = new.sender_id;
    if v_tier < 'identified' then
      raise exception 'Verify your identity before posting an item worth more than $%.', setting_num('value_threshold_screened')::integer;
    end if;
  end if;
  if new.legal_declaration_accepted and new.legal_declaration_accepted_at is null then
    new.legal_declaration_accepted_at := now();
  end if;
  if new.prohibited_items_version is null then
    new.prohibited_items_version := (select max(version) from policy_documents where key = 'prohibited_items');
  end if;
  return new;
end;
$$;
create trigger delivery_requests_declaration before insert on delivery_requests for each row execute function trg_request_declaration();

-- ---------- submitting and deciding checks ----------
-- a person opens a check; any older open one of the same kind is withdrawn
create function submit_verification(p_kind verification_kind, p_details jsonb default '{}'::jsonb)
returns verifications
language plpgsql security definer set search_path = public as $$
declare v verifications%rowtype;
begin
  if p_kind in ('criminal_records', 'motor_vehicle_record', 'payout_account') then
    raise exception 'This check is opened by ONDIGO, not submitted.';
  end if;
  update verifications set status = 'withdrawn'
  where user_id = auth.uid() and kind = p_kind and status in ('submitted', 'in_review');
  insert into verifications (user_id, kind, provider, details)
  values (auth.uid(), p_kind, 'manual', coalesce(p_details, '{}'::jsonb))
  returning * into v;
  insert into onboarding_events (user_id, event, meta) values (auth.uid(), 'verification_submitted', jsonb_build_object('kind', p_kind));
  return v;
end;
$$;
grant execute on function submit_verification(verification_kind, jsonb) to authenticated;

create function decide_verification(p_id uuid, p_status verification_status, p_reason text, p_expires_at timestamptz default null)
returns verifications
language plpgsql security definer set search_path = public as $$
declare v verifications%rowtype;
begin
  if not is_admin() then raise exception 'Only a reviewer can decide a check'; end if;
  if p_status not in ('approved', 'rejected', 'in_review') then raise exception 'Decision must be approved, rejected or in_review'; end if;
  if p_status = 'rejected' and coalesce(trim(p_reason), '') = '' then raise exception 'A rejection needs a reason the person can read'; end if;
  update verifications
  set status = p_status, decision_reason = p_reason, reviewed_by = auth.uid(),
      decided_at = case when p_status = 'in_review' then null else now() end,
      expires_at = coalesce(p_expires_at, expires_at)
  where id = p_id returning * into v;
  if not found then raise exception 'Check not found'; end if;
  return v;
end;
$$;
grant execute on function decide_verification(uuid, verification_status, text, timestamptz) to authenticated;

create function set_suspension(p_user uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only a reviewer can suspend'; end if;
  if p_reason is null then
    update profiles set suspended_at = null, suspension_reason = null where id = p_user;
  else
    update profiles set suspended_at = now(), suspension_reason = p_reason where id = p_user;
  end if;
end;
$$;
grant execute on function set_suspension(uuid, text) to authenticated;

create function accept_policy(p_key text, p_context jsonb default '{}'::jsonb)
returns consents
language plpgsql security definer set search_path = public as $$
declare v consents%rowtype; v_version integer;
begin
  select max(version) into v_version from policy_documents where key = p_key;
  if v_version is null then raise exception 'Unknown policy %', p_key; end if;
  insert into consents (user_id, policy_key, policy_version, context)
  values (auth.uid(), p_key, v_version, coalesce(p_context, '{}'::jsonb))
  on conflict (user_id, policy_key, policy_version) do update set accepted_at = now()
  returning * into v;
  return v;
end;
$$;
grant execute on function accept_policy(text, jsonb) to authenticated;

create function log_onboarding_event(p_event text, p_meta jsonb default '{}'::jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into onboarding_events (user_id, event, meta) values (auth.uid(), p_event, coalesce(p_meta, '{}'::jsonb))
$$;
grant execute on function log_onboarding_event(text, jsonb) to authenticated;

-- ---------- what the public may know: the badge ----------
create view driver_public_trust as
select
  p.id as user_id,
  p.verification_tier,
  p.suspended_at is not null as suspended,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'identity_document' and v.status = 'approved') as identity_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'liveness' and v.status = 'approved') as liveness_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'driving_licence' and v.status = 'approved') as licence_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'insurance' and v.status = 'approved') as insurance_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'vehicle' and v.status = 'approved') as vehicle_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'criminal_records' and v.status = 'approved') as records_checked_at,
  (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'motor_vehicle_record' and v.status = 'approved') as driving_record_checked_at,
  (select string_agg(distinct provider, ',') from verifications v where v.user_id = p.id and v.status = 'approved') as providers,
  (select string_agg(distinct vh.vehicle_type::text, ',') from vehicles vh join verifications v on v.id = vh.verification_id and v.status = 'approved' where vh.user_id = p.id) as vehicle_classes
from profiles p;
grant select on driver_public_trust to authenticated, anon;

-- ---------- retention ----------
create function purge_expired_verification_documents() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from storage.objects
  where bucket_id = 'verification-documents'
    and name in (select storage_path from verification_documents where delete_after <= now());
  delete from verification_documents where delete_after <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;
select cron.schedule('purge-verification-documents', '15 3 * * *', 'select purge_expired_verification_documents();');

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit) values ('verification-documents', 'verification-documents', false, 10485760);
create policy "owner uploads verification documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner and reviewers read verification documents" on storage.objects for select to authenticated
  using (bucket_id = 'verification-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- ---------- row-level security ----------
alter table platform_settings enable row level security;
alter table profile_private enable row level security;
alter table verifications enable row level security;
alter table verification_documents enable row level security;
alter table vehicles enable row level security;
alter table policy_documents enable row level security;
alter table prohibited_item_rules enable row level security;
alter table consents enable row level security;
alter table onboarding_events enable row level security;

create policy "settings are readable" on platform_settings for select to anon, authenticated using (true);
create policy "policies are readable" on policy_documents for select to anon, authenticated using (true);
create policy "prohibited rules are readable" on prohibited_item_rules for select to anon, authenticated using (true);

create policy "own private profile" on profile_private for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "insert own private profile" on profile_private for insert to authenticated with check (user_id = auth.uid());
create policy "update own private profile" on profile_private for update to authenticated using (user_id = auth.uid());

create policy "own or reviewer reads checks" on verifications for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "own or reviewer reads documents" on verification_documents for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "own documents insert" on verification_documents for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from verifications v where v.id = verification_id and v.user_id = auth.uid()));

create policy "own or reviewer reads vehicles" on vehicles for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "own vehicles insert" on vehicles for insert to authenticated with check (user_id = auth.uid());
create policy "own vehicles update" on vehicles for update to authenticated using (user_id = auth.uid());

create policy "own consents" on consents for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "own events" on onboarding_events for select to authenticated using (user_id = auth.uid() or is_admin());

grant select, insert, update on profile_private, vehicles to authenticated;
grant select on platform_settings, policy_documents, prohibited_item_rules, verifications, verification_documents, consents, onboarding_events to authenticated;
grant insert on verification_documents to authenticated;
grant select on platform_settings, policy_documents, prohibited_item_rules to anon;
grant usage, select on all sequences in schema public to authenticated;

-- ---------- recompute everyone once ----------
select recompute_verification_tier(id) from profiles;
