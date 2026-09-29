-- ---------------------------------------------------------------------------
-- Timing and handoff instructions.
--
-- needed_by (a bare date) was never enough to actually do a delivery. A driver
-- needs to know when the item can be collected, by when it must arrive, whether
-- each end is handed to a person or left at a door, and how to treat it on the
-- way. None of this is sensitive, so it lives on delivery_requests where a
-- driver can read it before deciding to bid. The person to ask for and the door
-- code stay in request_contact_details.
-- ---------------------------------------------------------------------------

alter table delivery_requests
  add column if not exists pickup_from timestamptz,
  add column if not exists pickup_until timestamptz,
  add column if not exists deliver_by timestamptz,
  add column if not exists pickup_handoff text not null default 'in_person'
    check (pickup_handoff in ('in_person', 'leave_at_door')),
  add column if not exists dropoff_handoff text not null default 'in_person'
    check (dropoff_handoff in ('in_person', 'leave_at_door')),
  add column if not exists fragile boolean not null default false,
  add column if not exists handling_notes text;

comment on column delivery_requests.pickup_from is 'Earliest the item can be collected.';
comment on column delivery_requests.pickup_until is 'Latest the item can be collected.';
comment on column delivery_requests.deliver_by is 'Hard deadline for arrival. needed_by keeps the date for older clients.';
comment on column delivery_requests.pickup_handoff is 'in_person: someone hands it over. leave_at_door: driver collects an item left out, and must photograph it.';
comment on column delivery_requests.dropoff_handoff is 'in_person: hand to the recipient. leave_at_door: leave as instructed and photograph where it was left.';
