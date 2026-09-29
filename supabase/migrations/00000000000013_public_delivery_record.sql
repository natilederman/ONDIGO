-- A person's completed deliveries, as anyone viewing their profile may see
-- them: which role they played, when it finished, roughly where from and to,
-- and the rating they received for it. Deliveries themselves are readable only
-- by the two participants, so this goes through a definer function that
-- returns nothing more than that: coordinates rounded to one decimal (about
-- 11 km, the same rule as the public map), no street text, no item, no price.
create function public_delivery_record(p_user uuid)
returns table (
  delivery_id uuid,
  role text,
  completed_at timestamptz,
  plat numeric, plng numeric, dlat numeric, dlng numeric,
  category item_category,
  rating integer
)
language sql stable security definer set search_path = public as $$
  select
    d.id,
    case when d.driver_id = p_user then 'carried' else 'sent' end,
    d.completed_at,
    round(r.pickup_lat::numeric, 1), round(r.pickup_lng::numeric, 1),
    round(r.dropoff_lat::numeric, 1), round(r.dropoff_lng::numeric, 1),
    r.declared_category,
    (select rv.rating from reviews rv where rv.delivery_id = d.id and rv.reviewee_id = p_user limit 1)
  from deliveries d
  join delivery_requests r on r.id = d.request_id
  where (d.driver_id = p_user or d.sender_id = p_user) and d.status = 'completed'
  order by d.completed_at desc nulls last
  limit 50
$$;
revoke execute on function public_delivery_record(uuid) from public, anon;
grant execute on function public_delivery_record(uuid) to authenticated;
