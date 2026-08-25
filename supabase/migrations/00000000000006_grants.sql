-- Table-level privileges for the API roles. RLS policies (00000000000003_rls.sql)
-- still gate row visibility/mutability on top of these.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  profiles, connections, trips, delivery_requests, bids, deliveries,
  transactions, messages, location_pings, reviews, panic_alerts
  to authenticated;

grant select on
  profiles, trips, delivery_requests, reviews
  to anon;

grant usage, select on all sequences in schema public to authenticated;
