-- ---------------------------------------------------------------------------
-- Talking to a driver about a trip.
--
-- A member who sees a trip can write to its driver before anything is booked.
-- Each member gets one private thread per trip; the driver sees one thread per
-- person who wrote. Besides plain messages a thread carries offers ("my bike,
-- $50"), which the other side accepts, declines or counters. Counters are new
-- offers, so a negotiation reads top to bottom.
--
-- The demo drivers are seeded accounts nobody is logged into, so while this is
-- a demo they answer on their own: demo_driver_reply() is called by the page a
-- few seconds after a member writes, and answers like a driver would (accepts a
-- fair price, counters a low one, answers questions about time, size, pickup).
-- Real drivers answer for themselves.
-- ---------------------------------------------------------------------------

create table trip_threads (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  member_id uuid not null references profiles (id),
  driver_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default clock_timestamp(),
  unique (trip_id, member_id),
  check (member_id <> driver_id)
);
create index trip_threads_driver_idx on trip_threads (driver_id, last_message_at desc);
create index trip_threads_member_idx on trip_threads (member_id, last_message_at desc);

create type offer_status as enum ('open', 'accepted', 'declined', 'countered', 'withdrawn');

create table trip_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references trip_threads (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body text not null default '' check (char_length(body) <= 2000),
  -- an offer: what, for how much, and where it stands
  offer_item text check (char_length(offer_item) <= 120),
  offer_amount numeric(10, 2) check (offer_amount is null or offer_amount between 1 and 10000),
  offer_status offer_status,
  -- a reply to an offer (accepted or declined) points at it
  answers uuid references trip_messages (id),
  -- the wall clock, not the transaction's: a reply written in the same call still sorts after
  created_at timestamptz not null default clock_timestamp(),
  read_at timestamptz,
  check ((offer_amount is null) = (offer_status is null)),
  check (body <> '' or offer_amount is not null or answers is not null)
);
create index trip_messages_thread_idx on trip_messages (thread_id, created_at);

alter table trip_threads enable row level security;
alter table trip_messages enable row level security;

create function is_thread_party(p_thread uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_threads t where t.id = p_thread and auth.uid() in (t.member_id, t.driver_id))
$$;

create policy "parties read their threads" on trip_threads
  for select to authenticated using (auth.uid() in (member_id, driver_id));
create policy "parties read their messages" on trip_messages
  for select to authenticated using (is_thread_party(thread_id));
-- members and drivers write messages and new offers themselves; answering an
-- offer goes through respond_to_offer() so nobody can accept their own
create policy "parties write messages" on trip_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and is_thread_party(thread_id) and answers is null
              and (offer_status is null or offer_status = 'open') and read_at is null);

grant select on trip_threads to authenticated;
grant select, insert on trip_messages to authenticated;

-- keep the thread's clock current; a new offer replaces the sender's earlier open one
-- and counts as a counter to the other side's
create function trip_message_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update trip_threads set last_message_at = new.created_at where id = new.thread_id;
  if new.offer_status = 'open' then
    update trip_messages
    set offer_status = case when sender_id = new.sender_id then 'withdrawn' else 'countered' end::offer_status
    where thread_id = new.thread_id and offer_status = 'open' and id <> new.id;
  end if;
  return new;
end;
$$;
create trigger trip_message_after_insert after insert on trip_messages
  for each row execute function trip_message_after_insert();

-- the member's thread for a trip, made on first use
create function open_trip_thread(p_trip uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_driver uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Log in to message a driver'; end if;
  select driver_id into v_driver from trips where id = p_trip and status = 'active';
  if v_driver is null then raise exception 'This trip is no longer open'; end if;
  if v_driver = auth.uid() then raise exception 'This is your own trip'; end if;
  insert into trip_threads (trip_id, member_id, driver_id) values (p_trip, auth.uid(), v_driver)
  on conflict (trip_id, member_id) do nothing;
  select id into v_id from trip_threads where trip_id = p_trip and member_id = auth.uid();
  return v_id;
end;
$$;

-- accept, decline or counter the other side's open offer
create function respond_to_offer(p_message uuid, p_action text, p_amount numeric default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare m trip_messages%rowtype; v_new uuid;
begin
  select * into m from trip_messages where id = p_message for update;
  if m.id is null or not is_thread_party(m.thread_id) then raise exception 'Offer not found'; end if;
  if m.sender_id = auth.uid() then raise exception 'You cannot answer your own offer'; end if;
  if m.offer_status is distinct from 'open' then raise exception 'This offer is no longer open'; end if;

  if p_action = 'accept' then
    update trip_messages set offer_status = 'accepted' where id = m.id;
    insert into trip_messages (thread_id, sender_id, answers) values (m.thread_id, auth.uid(), m.id) returning id into v_new;
  elsif p_action = 'decline' then
    update trip_messages set offer_status = 'declined' where id = m.id;
    insert into trip_messages (thread_id, sender_id, answers) values (m.thread_id, auth.uid(), m.id) returning id into v_new;
  elsif p_action = 'counter' then
    if p_amount is null or p_amount < 1 or p_amount > 10000 then raise exception 'Enter an amount for the counter offer'; end if;
    update trip_messages set offer_status = 'countered' where id = m.id;
    insert into trip_messages (thread_id, sender_id, offer_item, offer_amount, offer_status)
    values (m.thread_id, auth.uid(), m.offer_item, round(p_amount, 2), 'open') returning id into v_new;
  else
    raise exception 'Unknown action';
  end if;
  return v_new;
end;
$$;

create function mark_thread_read(p_thread uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_thread_party(p_thread) then return; end if;
  update trip_messages set read_at = now()
  where thread_id = p_thread and sender_id <> auth.uid() and read_at is null;
end;
$$;

create function my_unread_count() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from trip_messages m join trip_threads t on t.id = m.thread_id
  where auth.uid() in (t.member_id, t.driver_id) and m.sender_id <> auth.uid() and m.read_at is null
$$;

-- every thread I am in, newest first, with what the list needs
create function my_threads() returns table (
  id uuid, trip_id uuid, role text, other_id uuid, other_name text,
  origin_text text, destination_text text, depart_at timestamptz,
  last_body text, last_offer numeric, last_at timestamptz, unread integer
)
language sql stable security definer set search_path = public as $$
  select t.id, t.trip_id,
    case when t.driver_id = auth.uid() then 'driver' else 'member' end,
    o.id, o.full_name, tr.origin_text, tr.destination_text, tr.depart_at,
    l.body, l.offer_amount, t.last_message_at,
    (select count(*)::integer from trip_messages u where u.thread_id = t.id and u.sender_id <> auth.uid() and u.read_at is null)
  from trip_threads t
  join trips tr on tr.id = t.trip_id
  join profiles o on o.id = case when t.driver_id = auth.uid() then t.member_id else t.driver_id end
  left join lateral (select body, offer_amount from trip_messages x where x.thread_id = t.id order by created_at desc limit 1) l on true
  where auth.uid() in (t.member_id, t.driver_id)
  order by t.last_message_at desc
$$;

-- ---------------------------------------------------------------------------
-- The demo drivers' side of the conversation.
-- ---------------------------------------------------------------------------
create function demo_driver_reply(p_thread uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t trip_threads%rowtype; tr trips%rowtype; v_last trip_messages%rowtype; ans trip_messages%rowtype;
  v_km numeric; v_ask numeric; v_amt numeric; v_txt text; v_new uuid; v_when text; v_from text;
  pick text[];
begin
  select * into t from trip_threads where id = p_thread for update;  -- one reply at a time
  if t.id is null or t.member_id <> auth.uid() then return null; end if;
  if not exists (select 1 from demo_drivers where driver_id = t.driver_id) then return null; end if;
  select * into v_last from trip_messages where thread_id = p_thread order by created_at desc limit 1;
  -- only answer the member, and only once
  if v_last.id is null or v_last.sender_id <> t.member_id then return null; end if;

  select * into tr from trips where id = t.trip_id;
  v_km := demo_km(tr.origin_lat, tr.origin_lng, tr.destination_lat, tr.destination_lng);
  -- what this run is worth to the driver, by the same bands as requests
  v_ask := case
    when v_km < 25 then 25
    when split_part(tr.origin_text, ', ', 3) = split_part(tr.destination_text, ', ', 3) then greatest(70, round((60 + 0.17 * v_km) / 5) * 5)
    else least(600, greatest(160, round((150 + 0.13 * v_km) / 5) * 5)) end;
  v_when := trim(to_char(tr.depart_at at time zone 'America/New_York', 'Dy FMDD Mon'));
  v_from := split_part(tr.origin_text, ', ', 1);

  if v_last.answers is not null then
    -- the member answered my counter
    select * into ans from trip_messages where id = v_last.answers;
    if ans.offer_status = 'accepted' then
      v_txt := format('Great, $%s it is. I''ll message you the day before with a pickup time.', trim(to_char(ans.offer_amount, 'FM999999990')));
    else
      v_txt := 'No problem. If your plans change, write here and we''ll sort something out.';
    end if;
    insert into trip_messages (thread_id, sender_id, body) values (p_thread, t.driver_id, v_txt) returning id into v_new;

  elsif v_last.offer_status = 'open' then
    v_amt := v_last.offer_amount;
    if v_amt >= v_ask * 0.9 then
      update trip_messages set offer_status = 'accepted' where id = v_last.id;
      insert into trip_messages (thread_id, sender_id, answers, body)
      values (p_thread, t.driver_id, v_last.id,
        (array['Deal. I''ll confirm the pickup time the day before I leave.',
               'That works. Have it ready near the ' || lower(left(v_from, 1)) || substr(v_from, 2) || ' and we''re set.',
               'Sounds fair, it''s a deal. I''ll message you on the day.'])[1 + floor(random() * 3)::integer])
      returning id into v_new;
    else
      update trip_messages set offer_status = 'countered' where id = v_last.id;
      v_amt := case when v_amt >= v_ask * 0.55 then round(((v_amt + v_ask) / 2) / 5) * 5 else v_ask end;
      insert into trip_messages (thread_id, sender_id, offer_item, offer_amount, offer_status, body)
      values (p_thread, t.driver_id, v_last.offer_item, v_amt, 'open',
        case when v_last.offer_amount >= v_ask * 0.55
          then 'A bit low for this run. Meet me in the middle?'
          else 'That wouldn''t cover the fuel on this one, sorry. This is the best I can do.' end)
      returning id into v_new;
    end if;

  else
    -- a plain message: answer what it asks about
    v_txt := lower(v_last.body);
    v_amt := nullif(substring(v_txt from '\$\s?(\d{1,5})'), '')::numeric;
    if v_amt is null and v_txt ~ '(dollar|bucks|usd)' then v_amt := nullif(substring(v_txt from '(\d{1,5})'), '')::numeric; end if;
    if v_amt is not null then
      v_txt := case when v_amt >= v_ask * 0.9
        then format('$%s works for me. Send it as an offer with the button below and I''ll accept it.', trim(to_char(v_amt, 'FM999990')))
        else format('For this run I''d need about $%s. Send an offer and we can settle it.', trim(to_char(case when v_amt >= v_ask * 0.55 then round(((v_amt + v_ask) / 2) / 5) * 5 else v_ask end, 'FM999990'))) end;
    elsif v_txt ~ '(bike|bicycle|scooter)' then
      v_txt := case when tr.vehicle_type = 'truck' then 'A bike is easy in the truck bed. I''ll strap it down.'
                    when tr.vehicle_type in ('bike', 'scooter') then 'I''m on two wheels myself, so a bike won''t work, sorry. Small parcels only.'
                    else 'A bike fits if the front wheel comes off. Is it quick release?' end;
    elsif v_txt ~ '(couch|sofa|fridge|wardrobe|mattress|dresser|table|desk)' then
      v_txt := case when tr.vehicle_type = 'truck' then 'Should fit in the back. Is it heavy? I''d want a second pair of hands at pickup.'
                    else 'That''s too big for my ' || tr.vehicle_type::text || ', sorry. Look for a truck going this way.' end;
    elsif v_txt ~ '(when|time|leav|depart|what day|tomorrow|tonight)' then
      v_txt := format('I''m leaving %s. I can pick up anywhere near the %s on the way out.', v_when, lower(left(v_from, 1)) || substr(v_from, 2));
    elsif v_txt ~ '(where|pick ?up|address|drop)' then
      v_txt := format('Anywhere near the %s is easy for pickup. We share exact addresses once we agree.', lower(left(v_from, 1)) || substr(v_from, 2));
    elsif v_txt ~ '(size|big|heavy|weight|kg|fit|room|space)' then
      v_txt := format('I have room for about %s kg, %s. What is it?', trim(to_char(tr.capacity_weight_kg, 'FM99990')), tr.capacity_size);
    elsif v_txt ~ '^\s*(hi|hey|hello|good (morning|afternoon|evening))' then
      v_txt := 'Hi! What do you need taken, and roughly how big is it?';
    else
      pick := array['Happy to help. What is it, and roughly how big?',
                    'Sure. What would you like me to take, and what were you thinking of paying?',
                    'Could work. Send me an offer with the item and a price and I''ll take a look.'];
      v_txt := pick[1 + floor(random() * 3)::integer];
    end if;
    insert into trip_messages (thread_id, sender_id, body) values (p_thread, t.driver_id, v_txt) returning id into v_new;
  end if;
  return v_new;
end;
$$;

-- lets the page show "typing" only when a reply is actually coming
create function is_demo_driver(p_driver uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from demo_drivers where driver_id = p_driver)
$$;

revoke execute on function is_demo_driver(uuid) from public, anon;
grant execute on function is_demo_driver(uuid) to authenticated;
revoke execute on function is_thread_party(uuid), open_trip_thread(uuid), respond_to_offer(uuid, text, numeric),
  mark_thread_read(uuid), my_unread_count(), my_threads(), demo_driver_reply(uuid) from public, anon;
grant execute on function is_thread_party(uuid), open_trip_thread(uuid), respond_to_offer(uuid, text, numeric),
  mark_thread_read(uuid), my_unread_count(), my_threads(), demo_driver_reply(uuid) to authenticated;
revoke execute on function trip_message_after_insert() from public, anon, authenticated;

alter publication supabase_realtime add table trip_messages;
