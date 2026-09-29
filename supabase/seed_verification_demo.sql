-- Demo accounts get checks *recorded*, not performed. provider = 'demo' is
-- what the badge reads to say exactly that. alice@ondigo.test is the reviewer.
update profiles set is_admin = true where id = '11111111-1111-1111-1111-111111111111';

insert into profile_private (user_id, phone, phone_verified_at, date_of_birth, emergency_contact_name, emergency_contact_phone)
values
  ('11111111-1111-1111-1111-111111111111', '+14155550101', now(), '1991-04-12', 'Marco Rivera', '+14155550102'),
  ('22222222-2222-2222-2222-222222222222', '+15125550103', now(), '1998-09-03', 'Jin Cho', '+15125550104'),
  ('44444444-4444-4444-4444-444444444444', '+12065550105', now(), '1985-01-22', 'Priya Patel', '+12065550106'),
  ('55555555-5555-5555-5555-555555555555', '+16145550107', now(), '1990-07-30', 'Kenji Ito', '+16145550108'),
  ('66666666-6666-6666-6666-666666666666', '+13235550109', now(), '1987-11-15', 'Soo-ah Kim', '+13235550110'),
  ('77777777-7777-7777-7777-777777777777', '+12125550111', now(), '1994-02-08', 'Kofi Osei', '+12125550112'),
  ('33333333-3333-3333-3333-333333333333', '+14155550113', now(), '1989-06-19', 'Linh Nguyen', '+14155550114'),
  ('88888888-8888-8888-8888-888888888888', '+17185550115', now(), '1982-12-01', 'Olga Petrova', '+17185550116')
on conflict (user_id) do update set
  phone = excluded.phone, phone_verified_at = excluded.phone_verified_at, date_of_birth = excluded.date_of_birth,
  emergency_contact_name = excluded.emergency_contact_name, emergency_contact_phone = excluded.emergency_contact_phone;

-- consents for everyone
insert into consents (user_id, policy_key, policy_version)
select p.id, k.key, 1 from profiles p cross join (values ('prohibited_items'), ('driver_terms'), ('biometric_notice')) as k(key)
on conflict do nothing;

-- identity for everyone (senders included: Carla and Ivan can then post high-value items)
insert into verifications (user_id, kind, status, provider, provider_ref, submitted_at, decided_at, decision_reason, expires_at, details)
select p.id, k.kind::verification_kind, 'approved', 'demo', 'seed', now() - interval '3 days', now() - interval '3 days',
       'Recorded by the demo seed. No document was checked.', now() + interval '1 year', '{"note":"demo"}'::jsonb
from profiles p cross join (values ('identity_document'), ('liveness')) as k(kind)
where not exists (select 1 from verifications v where v.user_id = p.id and v.kind = k.kind::verification_kind and v.status = 'approved');

-- drivers: licence + insurance + a vehicle
with drivers(id, vt, make, model, yr, plate, st) as (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'car'::vehicle_type,   'Toyota',  'Prius',      2019, '8ABC123', 'CA'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'truck'::vehicle_type, 'Ford',    'Transit 250', 2021, 'C41 9KL', 'WA'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'car'::vehicle_type,   'Honda',   'CR-V',       2018, 'HJK 4471', 'OH'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'truck'::vehicle_type, 'Isuzu',   'NPR box truck', 2017, '5TRK882', 'CA'),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'car'::vehicle_type,   'Subaru',  'Outback',    2020, 'KLM 2209', 'NY')
),
lic as (
  insert into verifications (user_id, kind, status, provider, provider_ref, submitted_at, decided_at, decision_reason, expires_at, details)
  select d.id, k.kind::verification_kind, 'approved', 'demo', 'seed', now() - interval '3 days', now() - interval '3 days',
         'Recorded by the demo seed. No document was checked.', now() + interval '1 year', '{"note":"demo"}'::jsonb
  from drivers d cross join (values ('driving_licence'), ('insurance')) as k(kind)
  where not exists (select 1 from verifications v where v.user_id = d.id and v.kind = k.kind::verification_kind and v.status = 'approved')
  returning 1
),
veh as (
  insert into verifications (user_id, kind, status, provider, provider_ref, submitted_at, decided_at, decision_reason, expires_at, details)
  select d.id, 'vehicle', 'approved', 'demo', 'seed', now() - interval '3 days', now() - interval '3 days',
         'Recorded by the demo seed. No document was checked.', now() + interval '1 year', jsonb_build_object('note', 'demo', 'plate', d.plate)
  from drivers d
  where not exists (select 1 from verifications v where v.user_id = d.id and v.kind = 'vehicle' and v.status = 'approved')
  returning id, user_id
)
insert into vehicles (user_id, verification_id, vehicle_type, make, model, model_year, plate, plate_state, insurance_named_insured, insurance_expires_on, licence_expires_on)
select d.id, veh.id, d.vt, d.make, d.model, d.yr, d.plate, d.st, p.full_name, current_date + 300, current_date + 900
from drivers d join veh on veh.user_id = d.id join profiles p on p.id = d.id;

select recompute_verification_tier(id) from profiles;
select p.full_name, p.verification_tier, p.is_admin from profiles p order by p.full_name;

-- demo requests declare what they are worth and what they are, so the gate has something to key on
update delivery_requests r set
  declared_category = case
    when item_description ~* 'guitar|cello|drum' then 'instruments'
    when item_description ~* 'painting|sculpture|clock|art' then 'art_fragile'
    when item_description ~* 'bike|kayak|ski|telescope|surfboard|tyre|helmet' then case when item_description ~* 'tyre|helmet' then 'vehicle_parts' else 'sports_outdoor' end
    when item_description ~* 'chair|crib|bookshelf|mattress|rug|bed' then 'furniture'
    when item_description ~* 'tv|monitor|espresso|aquarium|sewing|treadmill|fridge' then case when item_description ~* 'tv|monitor' then 'electronics' else 'appliances' end
    when item_description ~* 'textbook|document|records' then 'boxes_parcels'
    else 'other' end::item_category,
  declared_value = case
    when item_description ~* 'sculpture' then 2400
    when item_description ~* 'grandfather clock' then 1800
    when item_description ~* 'cello' then 1500
    when item_description ~* 'mattress' then 900
    when item_description ~* 'tv|treadmill|drum|espresso|electric bike' then 650
    else greatest(60, round(coalesce(fixed_price, starting_price) * 3)) end,
  contents = coalesce(contents, item_description)
where status = 'open' and declared_value is null;
