# SacredOps

SacredOps is an all-in-one construction operations platform that connects contractors, unions, workers, and trainers. Manage staffing, certifications, training, inspections, permits, safety compliance, incident reporting, and jobsite documentation through a single digital system.

This repository contains two mobile-first portals — a **Supervisor Portal** and a **Worker Portal** — built with Next.js, backed by a PostgreSQL persistence layer via Prisma.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for the shell (the portals themselves use inline styles for their dark industrial theme)
- **Prisma** ORM with **PostgreSQL**

## Routes

| Route | Description |
| --- | --- |
| `/` | Role chooser — pick Supervisor or Worker |
| `/supervisor` | Supervisor Portal |
| `/worker` | Worker Portal |
| `/api/state` | `GET` all persisted portal state |
| `/api/state/[key]` | `GET` / `PUT` / `DELETE` a single state document |

## The portals

### Supervisor Portal (`components/SupervisorPortal.tsx`)
A field-supervisor app: **Projects** (active jobsites with compliance %, crew counts,
weather, reminders), **Sign-Ins** (crew sign-in with digital signatures), **Talks**
(toolbox talks + safety topic library), **Inspect** (inspections & checklists),
**Schedule** (6-week look-ahead & subcontractors), and **Forms & Permits** (hot work,
confined space, heavy equipment, damage reports, competent person designation, site
safety orientation, JSA/JHA builder, SDS library, PDF export).

### Worker Portal (`components/WorkerPortal.tsx`)
A worker-facing app: **Home** (assigned projects, training status, quick access to
daily briefing, toolbox talks, incident reporting, forms), **Schedule**, **Alerts**,
and **Profile**.

The two portals **share data** — e.g. a worker's form submissions (`sacredops_submissions`),
pay (`sacredops_pay`), and safety locations (`sacredops_safety_locations`) are visible
to the supervisor — because both sync against the same server-side store.

## How persistence works

Both portals were authored as client-only apps that read/write `localStorage`
synchronously (all keys are prefixed `sacredops_`). Rather than rewrite their state
management, a thin **sync layer** (`lib/portalSync.ts`) backs `localStorage` with
Postgres:

1. **Hydrate** — before a portal mounts, `PortalGate` fetches all server state
   (`GET /api/state`) and writes it into `localStorage`, then reconciles any
   local-only keys back up to the server.
2. **Write-through** — it wraps `localStorage.setItem` so every subsequent write to a
   `sacredops_*` key is debounced and mirrored to the server (`PUT /api/state/[key]`).

State documents are stored as JSONB in the `AppState` table. This gives real,
cross-device, shared persistence with no changes to the portal components themselves.

> The normalized relational models (`Worker`, `Jobsite`, `Certification`, `Incident`,
> `Permit`, …) in `prisma/schema.prisma` are the domain model for future server-side
> features and reporting; the portals currently persist through the `AppState`
> document store described above.

## Getting started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure the database
```bash
cp .env.example .env
# edit DATABASE_URL to point at your Postgres instance
```

### 3. Set up the database
```bash
pnpm db:migrate   # apply migrations
pnpm db:seed      # load demo data (relational models)
```

### 4. Run the app
```bash
pnpm dev          # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:deploy` | Apply migrations in production |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:reset` | Drop, re-migrate, and re-seed |

## Project structure

```
app/
  layout.tsx              Root layout + metadata/viewport
  page.tsx                Role chooser (Supervisor / Worker)
  supervisor/page.tsx     Mounts the Supervisor Portal (client-only, gated)
  worker/page.tsx         Mounts the Worker Portal (client-only, gated)
  api/state/…             State read/write endpoints (Prisma-backed)
  globals.css             Tailwind + base styles
components/
  SupervisorPortal.tsx    Supervisor Portal UI
  WorkerPortal.tsx        Worker Portal UI
  PortalGate.tsx          Hydration gate shown before a portal mounts
lib/
  prisma.ts               Prisma client singleton
  portalSync.ts           localStorage <-> server sync layer
prisma/
  schema.prisma           Data model (AppState + relational domain models)
  seed.ts                 Demo data seed
  migrations/             SQL migrations
```
