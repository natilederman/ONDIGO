# ONDIGO 2

Peer-to-peer delivery: people already driving between cities carry items for others, for a fee —
cheaper than standard shipping. This repo contains the web app, the mobile app, and the shared
Supabase backend they both talk to.

> Forked from the original ONDIGO v1 project as a starting point for the next iteration.

## Web stack

The web app runs Next 15 on React 19.1.0, the same React the Expo app uses, so the workspace hoists a single copy. Root `package.json` pins that with `overrides`; do not add a second React version to either app. Dynamic pages read `params` with React's `use()`, as Next 15 requires. `npm run build:web` passes.

## Trust ladder (Phase A)

Sign-up stays a one-minute act; the expensive check happens at the bid. `profiles.verification_tier` moves none → contactable → identified → road_ready → screened → payable and is recomputed from evidence by triggers (migration 11). `place_bid()`, `accept_fixed_price_request()`, `accept_bid()` and the auction sweep all call `assert_can_take()`; the request page asks `why_cannot_take_request()` and shows the sentence with a link to `/verify`.

- `/verify` is the person's page: phone code (needs an SMS provider configured in Supabase Auth), emergency contact and date of birth, the three policies to accept, ID + selfie upload, licence + insurance + vehicle upload. Everything uploads to the private `verification-documents` bucket and is purged after 90 days by pg_cron; only the outcome and date stay.
- `/admin/verifications` is the reviewer queue (`profiles.is_admin`). `alice@ondigo.test` is the reviewer on the hosted project. Rejections require a reason the person reads.
- Requests now carry `declared_value`, `declared_category`, `contents`, `open_box_required` and `vehicle_type_required` (weight → bike ≤ 10 kg, car ≤ 50 kg, truck). `platform_settings` holds the $1,000 threshold, the $10,000 ceiling, the $250 cap and the ages (18 courier, 21 driver). Whole-household moves are refused at insert.
- The prohibited-items list and the policy texts live in `prohibited_item_rules` and `policy_documents`; acceptances in `consents`, versioned.
- Demo accounts carry `provider = 'demo'` records (`supabase/seed_verification_demo.sql`); the badge says so in words. The mobile app is not yet updated for Phase A: its bids hit the same gate and see the server's sentence.
- Phase B (Stripe Identity, Checkr with the FCRA hold, Stripe Connect) and Phase C (custody attribution, PIN, disputes, appeals, double-blind reviews) follow the approved plan in `reports/ONDIGO driver sign-up and verification plan.pdf`.

## Homepage map

The homepage is a map of the United States with the number of open requests leaving each state. Open a state, press a city, and the list underneath shows what leaves and arrives there.

- Geography is static: `apps/web/public/map/us-states.json` (us-atlas, Census) and `us-cities.json` (Natural Earth populated places, public domain).
- Activity comes from Supabase. Members read `delivery_requests` and `trips` directly (RLS). Visitors get `map_public_activity()`, a security-definer RPC (migration 9) that returns only rounded coordinates, pricing mode and clocks: no addresses, prices or people.
- The drawing is d3 in `apps/web/src/lib/map/engine.ts`; the React shell is `apps/web/src/components/map/DeparturesMap.tsx`; styles in `apps/web/src/app/map.css`.
- `design/prototype/` is the standalone prototype the design was approved on, with sample data. Open `index.html` from any static server; it is not part of the app.
- `supabase/seed_map_demo.sql` adds 30 demo requests and 6 trips around a few hubs so the map has something to show. Run it after `seed.sql`.

## Stack

- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Realtime + Storage), running
  locally via the Supabase CLI + Docker. All business logic (bidding, matching, escrow, auto-closing
  auctions) lives in Postgres functions/triggers in `supabase/migrations/`, so both apps get
  identical behavior for free.
- **Web**: Next.js (App Router) + TypeScript + Tailwind, in `apps/web`.
- **Mobile**: Expo (React Native) + TypeScript, in `apps/mobile`.
- **Shared**: `packages/shared` — TypeScript types, zod validation, and Supabase query helpers used
  verbatim by both apps.
- **Maps**: OpenStreetMap/Leaflet (web) and `react-native-maps` default provider (mobile) — free,
  no API key needed.
- **Payments**: simulated escrow only (no Stripe, no real card entry anywhere) — see
  [Known limitations](#known-limitations).

## Prerequisites

- Node.js 20+
- For the mobile app: Expo Go on your phone, or Xcode/Android Studio for a simulator

Docker is **not** required. The backend runs on a hosted Supabase project (see below).

## Setup

```bash
npm install
npm run dev:web       # that's it
```

### Where the backend lives

The apps point at a hosted Supabase project: **`ondigo`**, ref `sbbcufpmnhcljkimelpy`,
region `eu-central-1` (Frankfurt), free tier. `apps/web/.env.local` and `apps/mobile/.env`
already carry its URL and anon key. Because it is on the public internet, a phone on any
network reaches it directly; no tunnels.

Schema and demo data were applied to it on 2026-09-28 as a single baseline covering local
migrations `00000000000001` through `00000000000007`. If you later want to manage it with
the Supabase CLI, link once and mark those seven as already applied:

```bash
npx supabase link --project-ref sbbcufpmnhcljkimelpy
npx supabase migration repair --status applied 00000000000001 00000000000002 00000000000003 00000000000004 00000000000005 00000000000006 00000000000007
```

### Optional: fully local backend with Docker

The original local setup still works if you want to develop offline:

```bash
npm run db:start      # local Supabase in Docker (Postgres, Auth, Realtime, Storage, Studio)
```

Then swap the two commented-out local lines back in inside `apps/web/.env.local` (and the
equivalent in `apps/mobile/.env`). Local Studio is at http://127.0.0.1:54323.

Demo accounts (seeded automatically), all with password `ondigo123`:

| Email | Role |
|---|---|
| alice@ondigo.test | Driver (car) |
| ben@ondigo.test | Driver (bike) |
| drew@ondigo.test | Driver (truck) |
| carla@ondigo.test | Sender |

Supabase Studio (browse/edit the database directly) is at http://127.0.0.1:54323 once `db:start`
is running.

## Run

```bash
npm run dev:web       # http://localhost:3000
npm run dev:mobile    # Expo dev server — scan the QR code with Expo Go
```

## Repo layout

```
supabase/migrations/   schema, RLS policies, triggers, pg_cron auction closer
supabase/seed.sql       demo users/trips/requests
packages/shared/        types, zod schemas, Supabase query helpers (used by both apps)
apps/web/                Next.js website
apps/mobile/              Expo React Native app
```

## Known limitations

- **Payments are simulated.** Escrow hold/release/refund is real *logic* (a ledger in the
  `transactions` table, gated by delivery status), but funding it is a labelled "simulated" button
  with no card fields — no real money ever moves. Swapping in real Stripe Connect later is a
  contained change behind the existing `fund_escrow` / `confirm_delivery` / `refund_escrow`
  functions in `supabase/migrations/00000000000002_functions.sql`.
- **Panic button** logs an alert (`panic_alerts` table) and surfaces emergency contact info / a
  `tel:` link — it is not integrated with a real emergency dispatch service.
- **Google/Apple sign-in** isn't wired up yet — email/password auth ships now (per the original
  spec, this was flagged as "add later").
- **Maps** use free OpenStreetMap tiles rather than Google Maps/Mapbox.
- Local Supabase is the default dev setup (no account needed). For a "production" deployment,
  create a hosted Supabase project and point `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
  (and anon keys) at it instead — everything else is unchanged.
