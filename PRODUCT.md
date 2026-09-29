# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Scope note: this record sits at the monorepo root because product truth is shared by
`apps/web` (Next.js) and `apps/mobile` (Expo). Visual systems are per-app.

## Users

**Primary — Senders.** People with something to move between cities that is awkward for
normal shipping: a mattress, a bookshelf, a mini fridge, a surfboard, a box of documents.
They are price-sensitive, comparing against courier and freight quotes, and often working
on a short timeline. The landing page converts this audience first.

**Secondary — Drivers.** People already making a drive (car, bike, or truck) with unused
capacity, willing to carry someone else's item for a fee. They are supply, not the primary
conversion target, and need a clearly visible secondary path.

## Product Purpose

ONDIGO matches senders with drivers who are *already* making the trip, so the marginal cost
of carrying an item is low. Cheaper than standard shipping, faster than waiting for a
freight truck. Success is a completed, verified handoff where both sides felt covered.

## Positioning

The mechanism a neighboring product cannot truthfully copy: capacity that already exists
and is otherwise wasted. ONDIGO does not run a fleet and does not schedule routes — it
prices and brokers empty space in trips that were happening anyway. The auction mechanic
(senders can open a request for bids rather than posting a fixed price) is what makes it
feel like a marketplace rather than a shipping form.

## Operating Context

- Drivers post a **trip**: route, dates, free capacity, vehicle type.
- Senders post a **request**: item, origin → destination, and either a fixed price or an
  open **auction** with a countdown.
- Drivers **bid**; auctions close automatically (pg_cron) and match.
- Escrow is funded, then held until delivery is confirmed.
- Handoff is verified with timestamped photos at pickup and drop-off.
- In-app chat, live map tracking, star ratings, and a panic button with emergency contact
  info run alongside the delivery.

## Capabilities and Constraints

- All business logic lives in Postgres functions/triggers (`supabase/migrations/`) so web
  and mobile behave identically. Design must not assume web-only affordances for core flows.
- **Payments are simulated.** Escrow hold/release/refund is real ledger logic, but funding
  it is a labelled "simulated" button. No card fields exist anywhere and none may be designed.
- **Panic button** logs an alert and surfaces emergency contact info plus a `tel:` link. It
  is not connected to real emergency dispatch and must never be presented as if it were.
- Maps are OpenStreetMap/Leaflet (web). No Google Maps/Mapbox key.
- Auth is email/password only. Google/Apple sign-in is not wired up.
- Terminology to preserve: **trip** (driver's journey), **request** (sender's item),
  **bid**, **auction**, **escrow**, **handoff**, **delivery**.

## Brand Commitments

- Name: **ONDIGO**, set as a wordmark, uppercase.
- No logo asset exists yet; the wordmark is the identity.
- Voice: plain and concrete. The product explains a mechanism, not a lifestyle.

## Evidence on Hand

- **No real proof exists.** The testimonials in `apps/web/src/components/Testimonials.tsx`
  (Priya S., Marcus T., Wei L., and others) are invented demo content, as are the seeded
  requests, trips, and the four demo accounts in `supabase/seed.sql`.
- This is a **demo / portfolio build**, so invented content may remain as clearly
  illustrative material. It must never be escalated into specific factual claims —
  no user counts, no delivery volumes, no funding, press, or partner logos, no savings
  percentages presented as measured results.
- Real product surfaces available to show instead of fake proof: live seeded requests with
  real countdowns, the bidding mechanic, and the verification flow.

## Product Principles

1. **Lead with the mechanism.** The idea — someone is already driving there — is the most
   persuasive asset. Explain it before asking for anything.
2. **Earned trust, shown not claimed.** Escrow, photo verification, and ratings are the
   answer to "why would I hand a stranger my stuff." Make the safety architecture visible
   rather than asserting that it is safe.
3. **Marketplace, not a form.** The auction and live bidding are the difference; the
   interface should feel like a live market, with real time and real state.
4. **Two sides, one page, no mush.** Senders convert first; drivers get an unmistakable
   but subordinate path. Never average the two messages into one vague sentence.
5. **Honest about what is simulated.** Payments and the panic button are labelled demos.
   Design must keep those labels legible rather than hiding them for a cleaner look.

## Accessibility & Inclusion

No product-specific standard has been established. Baseline expectation: full keyboard
operation, visible focus, and text contrast that holds at the low-chroma end of the
palette this project uses.
