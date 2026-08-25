# ONDIGO 2

Peer-to-peer delivery: people already driving between cities carry items for others, for a fee —
cheaper than standard shipping. This repo contains the web app, the mobile app, and the shared
Supabase backend they both talk to.

> Forked from the original ONDIGO v1 project as a starting point for the next iteration.

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
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running (for local Supabase)
- For the mobile app: Expo Go on your phone, or Xcode/Android Studio for a simulator

## Setup

```bash
npm install
npm run db:start      # starts local Supabase (Postgres, Auth, Realtime, Storage, Studio)
```

`db:start` prints an `API_URL` and `ANON_KEY`. The web app's `.env.local` and the mobile app's
`.env` already point at the default local values (`http://127.0.0.1:54321` and the default demo
anon key) — only update them if you switch to a hosted Supabase project later.

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
