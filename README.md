# SacredOps

SacredOps is an all-in-one construction operations platform that connects contractors, unions, workers, and trainers. Manage staffing, certifications, training, inspections, permits, safety compliance, incident reporting, and jobsite documentation through a single digital system.

This repository contains the **Supervisor Portal** — a mobile-first web app built with Next.js — plus a Postgres/Prisma data layer for server-side persistence.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for utility styling (the Supervisor Portal itself uses inline styles for its dark industrial theme)
- **Prisma** ORM with **PostgreSQL**

## What's built

### Supervisor Portal (`components/SupervisorPortal.tsx`)
A rich, mobile-style field app rendered at `/`. It is a client-only experience and
persists its data in the browser's `localStorage`. Features include:

- **Projects** — active jobsites with compliance %, crew counts, weather, and reminders
- **Sign-Ins** — daily crew sign-in with digital signature capture
- **Talks** — toolbox talks and a safety topic library
- **Inspect** — safety inspections and checklists
- **Schedule** — 6-week look-ahead and subcontractor scheduling
- **Forms & Permits** — hot work / confined space / heavy equipment permits, damage
  reports, competent person designations, site safety orientation, a JSA/JHA builder,
  SDS library, and PDF export

> Because the portal reads/writes `localStorage` during render, it is mounted with
> server-side rendering disabled (`app/page.tsx` uses `next/dynamic` with `ssr: false`).

### Data layer (`prisma/schema.prisma`)
A Postgres schema modeling all four domains, ready to back the portal with real
server-side persistence:

- **Staffing** — `Worker`, `Jobsite`, `Assignment`, `Union`
- **Certifications & Training** — `Certification`, `TrainingCourse`, `Enrollment`
- **Safety & Incidents** — `Incident`, `Inspection`, `ChecklistItem`
- **Permits & Docs** — `Permit`, `Document`

A `lib/prisma.ts` client singleton and a `prisma/seed.ts` seed (demo unions, workers,
jobsites, certs, an inspection, an incident, a permit, and a document) are included.

> **Current state:** the UI runs entirely on `localStorage`. The Postgres/Prisma layer
> is scaffolded, migrated, and seedable, but the portal is not yet wired to it. Wiring
> the portal's stores to API routes backed by Prisma is the natural next step.

## Getting started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure the database
Copy the example env file and point it at your Postgres instance:
```bash
cp .env.example .env
# edit DATABASE_URL if needed
```

### 3. Set up the database
```bash
pnpm db:migrate   # apply migrations
pnpm db:seed      # load demo data
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
  layout.tsx          Root layout + metadata/viewport
  page.tsx            Mounts the Supervisor Portal (client-only)
  globals.css         Tailwind + base styles
components/
  SupervisorPortal.tsx  The full Supervisor Portal UI
lib/
  prisma.ts           Prisma client singleton
prisma/
  schema.prisma       Data model for all four domains
  seed.ts             Demo data seed
  migrations/         SQL migrations
```
