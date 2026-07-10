# 🦋 Flutterby

A phone-first butterfly logging app for UK field recorders. Stand where you saw
the butterfly, and Flutterby captures the species, a count, and an **Ordnance
Survey grid reference** derived automatically from your GPS position — in a
couple of taps. Built to fix the "Painted Lady in my garden, but _where was the
garden?_" problem: every record carries a real location.

## What it does

- **Automatic OS grid reference** from the device's location (WGS84 → OSGB36 →
  National Grid), with precision that adapts to GPS accuracy.
- **Tap to log** a butterfly, or use the stepper to log several at once.
- **Every British butterfly** (60 species) is searchable by common or
  scientific name.
- A **starter grid** of common, garden-friendly species on first use, which is
  replaced over time by **the recorder's own most-logged species**.
- Species photos from **Wikimedia Commons** (fetched at seed time).
- **Recent sightings** list with one-tap undo.

## Stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Frontend   | React 19 + TypeScript, Vite, CSS Modules          |
| Backend    | Fastify 5 (serverless function on Vercel)         |
| Database   | Neon Postgres via Drizzle ORM                     |
| Deployment | Vercel                                            |

The React app talks to the same relative `/api/*` paths in development (via a
Vite proxy) and in production (via a Vercel rewrite to the Fastify function), so
nothing changes between the two.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Provision a database (Neon)

Create a Postgres database at [neon.tech](https://neon.tech) (or via the Vercel
Marketplace) and copy the connection string.

```bash
cp .env.example .env
# then edit .env and paste your DATABASE_URL
```

### 3. Create the tables and seed the species

```bash
npm run db:push    # creates the butterflies + sightings tables
npm run db:seed    # inserts the 60 species and fetches their images
```

### 4. Run it

```bash
npm run dev        # Vite on :5173, Fastify API on :3001
```

Open <http://localhost:5173>. On a phone you'll be prompted for location access;
on a desktop you can still log sightings (the grid reference will just be
blank/approximate).

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel (framework preset: **Vite**
   — the `api/` function and rewrites come from `vercel.json`).
2. Add `DATABASE_URL` as a Vercel environment variable (or install a Neon
   integration from the Marketplace, which sets it for you).
3. Deploy. Run `npm run db:push` / `npm run db:seed` once against the same
   database (locally with the production `DATABASE_URL`, or `vercel env pull`).

## Optional sign-in (multi-device sync)

**Login is never required.** By default a recorder is anonymous — an id kept in
the browser groups their own sightings on that device. Signing in exists only so
a recorder can **sync across devices** (e.g. log on a phone, review on a laptop).

- Auth is **[Better Auth](https://better-auth.com)**, self-hosted in the same
  Neon database (no third-party service, no user limits). Its tables
  (`user`, `session`, `account`, `verification`) are created by `npm run db:push`.
- Providers activate only when their (free) OAuth credentials are set:
  **Google** and **Facebook**. See `.env.example` for the variables and the
  redirect URIs to register. Set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`)
  and `BETTER_AUTH_URL` (your app origin) too.
- **Apple is deliberately left off** — "Sign in with Apple" for a website needs a
  paid Apple Developer account ($99/yr). Fill in `APPLE_CLIENT_ID` /
  `APPLE_CLIENT_SECRET` if you ever get one and the button appears automatically.

When a recorder signs in, the sightings already captured anonymously on that
device are **claimed for their account** (`POST /api/link`), and from then on
their records are queried by account rather than by device. With no providers
configured the app simply shows no sign-in button and stays fully anonymous.

## Project structure

```
api/
  index.ts           the ONLY Vercel serverless entry (everything in api/ becomes
                     a function, so all other server code lives in server/)
server/              the Fastify application
  app.ts             app factory — registers routes
  dev.ts             local :3001 listener
  db.ts              Drizzle + Neon client
  auth.ts            Better Auth config (Google/Facebook/Apple, Drizzle adapter)
  session.ts         reads the signed-in user from a request
  routes/            butterflies, sightings, auth mount, account linking
db/
  schema.ts          Drizzle tables (butterflies, sightings)
  auth-schema.ts     Better Auth tables (user, session, account, verification)
  butterflies.ts     the British butterfly reference list
  seed.ts            upserts species + pulls Wikimedia images
src/
  lib/osgrid.ts      WGS84 → OS National Grid conversion (self-contained)
  hooks/             geolocation, butterflies, sightings
  components/        LocationBar, ButterflyGrid, SpeciesSearch, …
  App.tsx            composition
```

## Data model

- **butterflies** — the reference species list (name, family, image, sort order).
- **sightings** — one observation: species, count, `grid_ref` **plus** raw
  `latitude`/`longitude`/`accuracy_m` (nothing is lost), an anonymous
  per-device `recorder_id`, optional recorder name, notes, and a timestamp.

## TODO

- **Record export.** Dad currently adds records to the county recorder's system
  one at a time. Once we have the exact spreadsheet/return format, add an export
  endpoint (e.g. `GET /api/export.csv`) that emits sightings in that layout.
- Offline capture / queueing for patchy signal in the field.
- Optional map view of a recorder's sightings.

## A note on location precision

The grid reference precision follows GPS accuracy: ~1 m fix → 10-figure ref,
~10 m → 8-figure, ~100 m → 6-figure, and so on. The raw coordinates are always
stored alongside, so precision can be re-derived later if needed.
