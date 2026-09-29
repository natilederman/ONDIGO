-- The pg_cron sweep has been failing on every run: the loop variable was a
-- plain `record`, which cannot be passed to
-- create_delivery_for_request(delivery_requests, ...). Expired auctions
-- therefore stayed open forever. Same body, typed row variable.
create or replace function close_expired_auctions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request delivery_requests%rowtype;
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
