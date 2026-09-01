# 🏡 Village — moms helping moms

A friendly local marketplace where stay-at-home moms **post small tasks** (a
school pickup, a home-cooked meal, an afternoon of childcare) and other moms
nearby **pick them up for a little money**.

Built with **Next.js 15 · Prisma · SQLite (local) · Tailwind CSS**. Zero
database setup for local dev — everything runs off a single `dev.db` file.

## What it does (MVP)

- **Sign up / log in** — simple email + password accounts (moms).
- **Post a task** — title, details, category, pay, neighborhood, "needed by".
- **Browse & search** — filter open tasks by category or keyword.
- **Claim a task** — offer to help; both moms then see each other's contact info.
- **Complete / cancel** — the poster marks a task done (or cancels it).
- **My tasks dashboard** — everything you've posted and everything you're helping with.

Payments are **off-platform for now** (cash / Venmo / etc.) — the app shows the
price and connects the two moms. The data model stores pay in cents so adding
Stripe payouts later is straightforward.

## Run it locally

```bash
cd momtasks
cp .env.example .env      # already created for you in dev
npm install               # or pnpm install
npm run setup             # creates the SQLite db + loads demo tasks
npm run dev               # http://localhost:3000
```

**Demo logins** (created by the seed): `maria@example.com`, `priya@example.com`,
`hana@example.com` — password `password123` for all.

## Moving this into its own GitHub repo

This app is fully self-contained in the `momtasks/` folder. To give it its own
repo:

```bash
# from inside momtasks/
git init
git add .
git commit -m "Initial commit: Village marketplace"
# create an empty repo on GitHub (e.g. "village"), then:
git remote add origin https://github.com/<you>/village.git
git push -u origin main
```

## Going to production

1. Switch `prisma/schema.prisma` datasource `provider` from `sqlite` to
   `postgresql` and point `DATABASE_URL` at a hosted Postgres (Neon, Supabase,
   Railway, Vercel Postgres…).
2. Run `prisma migrate dev` to create real migrations.
3. Set a strong `SESSION_SECRET`.
4. Deploy to Vercel (or any Node host). `npm run build` runs `prisma generate`.

## Ideas for next

- In-app messaging between the two moms.
- Ratings / reviews to build trust.
- Stripe Connect for in-app payments and payouts.
- Photo uploads on tasks, and email/SMS notifications when a task is claimed.
