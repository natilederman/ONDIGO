-- Postgres grants EXECUTE on new functions to PUBLIC by default, and every one
-- of ours is SECURITY DEFINER. Internal helpers and trigger bodies must not be
-- callable over the API; user-facing RPCs are for signed-in users only; the
-- public map feed stays open to anon by design.

revoke execute on function create_delivery_for_request(delivery_requests, uuid, numeric) from public, anon, authenticated;
revoke execute on function assert_can_take(uuid, delivery_requests) from public, anon, authenticated;
revoke execute on function why_cannot_take(uuid, delivery_requests) from public, anon, authenticated;
revoke execute on function has_check(uuid, verification_kind) from public, anon, authenticated;
revoke execute on function has_consent(uuid, text) from public, anon, authenticated;
revoke execute on function vehicle_rank(uuid) from public, anon, authenticated;
revoke execute on function recompute_verification_tier(uuid) from public, anon, authenticated;
revoke execute on function setting_num(text) from public, anon, authenticated;
revoke execute on function trg_recompute_tier() from public, anon, authenticated;
revoke execute on function trg_request_declaration() from public, anon, authenticated;
revoke execute on function sync_auth_confirmations() from public, anon, authenticated;
revoke execute on function purge_expired_verification_documents() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function handle_review_insert() from public, anon, authenticated;
revoke execute on function handle_delivery_completed() from public, anon, authenticated;
revoke execute on function close_expired_auctions() from public, anon, authenticated;

revoke execute on function place_bid(uuid, numeric) from public, anon;
revoke execute on function accept_bid(uuid) from public, anon;
revoke execute on function accept_fixed_price_request(uuid) from public, anon;
revoke execute on function confirm_delivery(uuid) from public, anon;
revoke execute on function fund_escrow(uuid) from public, anon;
revoke execute on function refund_escrow(uuid) from public, anon;
revoke execute on function trigger_panic_alert(uuid, double precision, double precision) from public, anon;
revoke execute on function submit_verification(verification_kind, jsonb) from public, anon;
revoke execute on function decide_verification(uuid, verification_status, text, timestamptz) from public, anon;
revoke execute on function set_suspension(uuid, text) from public, anon;
revoke execute on function accept_policy(text, jsonb) from public, anon;
revoke execute on function log_onboarding_event(text, jsonb) from public, anon;
revoke execute on function why_cannot_take_request(uuid) from public, anon;
revoke execute on function request_requires(delivery_requests) from public, anon;
revoke execute on function is_admin() from public, anon;

alter function age_years(date) set search_path = public;
alter function vehicle_class_for_weight(numeric) set search_path = public;

-- the public trust summary as a function rather than a definer view
drop view if exists driver_public_trust;
create function get_public_trust(p_ids uuid[])
returns table (
  user_id uuid, verification_tier verification_tier, suspended boolean,
  identity_checked_at timestamptz, liveness_checked_at timestamptz, licence_checked_at timestamptz,
  insurance_checked_at timestamptz, vehicle_checked_at timestamptz, records_checked_at timestamptz,
  driving_record_checked_at timestamptz, providers text, vehicle_classes text
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.verification_tier, p.suspended_at is not null,
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'identity_document' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'liveness' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'driving_licence' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'insurance' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'vehicle' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'criminal_records' and v.status = 'approved'),
    (select max(decided_at) from verifications v where v.user_id = p.id and v.kind = 'motor_vehicle_record' and v.status = 'approved'),
    (select string_agg(distinct provider, ',') from verifications v where v.user_id = p.id and v.status = 'approved'),
    (select string_agg(distinct vh.vehicle_type::text, ',') from vehicles vh join verifications v on v.id = vh.verification_id and v.status = 'approved' where vh.user_id = p.id)
  from profiles p where p.id = any(p_ids)
$$;
revoke execute on function get_public_trust(uuid[]) from public;
grant execute on function get_public_trust(uuid[]) to anon, authenticated;
