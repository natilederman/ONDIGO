-- Enable Supabase Realtime (postgres_changes) on the tables the apps subscribe to:
-- live bidding, live chat, live tracking, and live request/status updates.

alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table delivery_requests;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table location_pings;
alter publication supabase_realtime add table deliveries;
