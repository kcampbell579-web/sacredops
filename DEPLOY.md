# Deploying SacredOps to sacredops.app

This guide takes the SacredOps app live at **https://sacredops.app**, hosted on
Vercel with a managed Postgres database (Neon). Your Wix site stays your
marketing page — you'll add a "Launch App" button that points to sacredops.app.

Everything below is click-by-click. Total time: ~30–45 minutes. All services
used have a free tier to start.

---

## Step 1 — Create the database (Neon), ~5 min

1. Go to <https://neon.tech> and sign up (free).
2. Click **Create project**. Name it `sacredops`. Pick the region closest to
   your users.
3. On the project dashboard, find **Connection string** and copy it. It looks
   like:
   `postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Keep this tab open — you'll paste this string into Vercel in Step 3.

## Step 2 — Put the code on GitHub (already done)

The code is on the `claude/sacredops-app-ij5ldx` branch. Merge it to `main`
(or deploy the branch directly in Step 3). Nothing to do here if it's already
pushed.

## Step 3 — Deploy on Vercel, ~10 min

1. Go to <https://vercel.com> and sign up **with GitHub** (free).
2. Click **Add New… → Project**, and **Import** the `sacredops` repository.
3. Vercel auto-detects Next.js — leave the framework settings as-is.
   - The project already defines a `vercel-build` script that runs database
     migrations automatically on every deploy, so you don't need to change the
     build command.
4. Expand **Environment Variables** and add one:
   - **Name:** `DATABASE_URL`
   - **Value:** the Neon connection string you copied in Step 1.
5. Click **Deploy**. Wait for the build to finish (~2 min).
6. When it's done, open the temporary `*.vercel.app` URL it gives you and
   confirm the app loads and `/<that-url>/api/health` returns `{"status":"ok"}`.

## Step 4 — Load starter/demo data (optional), ~2 min

If you want the demo domain data (workers, jobsites, etc.) present:
- In Vercel, open the project → **Deployments → … → Redeploy** is not needed;
  instead run the seed once from your computer with the same `DATABASE_URL`:
  ```bash
  DATABASE_URL="<your Neon string>" pnpm db:seed
  ```
- The portals themselves start empty and fill as people use them — seeding is
  only for the relational demo tables.

## Step 5 — Point sacredops.app at it, ~10 min (+ DNS wait)

1. In Vercel, open the project → **Settings → Domains**.
2. Type `sacredops.app` and click **Add**. Also add `www.sacredops.app` if you
   want it.
3. Vercel shows you DNS records to set. Go to wherever **sacredops.app** is
   registered (e.g. your domain registrar or Wix if you bought it through Wix):
   - If you can set a **nameserver** or **A/CNAME** record, follow Vercel's
     exact instructions (usually an `A` record to `76.76.21.21` and a `CNAME`
     for `www` to `cname.vercel-dns.com`).
4. DNS can take a few minutes to a few hours. When it's ready, Vercel issues an
   HTTPS certificate automatically (required for `.app` domains) and
   **https://sacredops.app** goes live.

> **Note on `.app` domains:** `.app` is HTTPS-only. Vercel handles the
> certificate for you, so there's nothing extra to do — just don't try to use
> plain `http://`.

## Step 6 — Link it from your Wix site, ~5 min

1. In the Wix Editor for your **SacredOps** site, add a **Button** to your
   header or homepage.
2. Set the button text to **"Launch App"** (or "Log in").
3. Set the link to an **external web address**: `https://sacredops.app`, open in
   a **new tab**.
4. Publish. Visitors now go from your Wix marketing page straight into the app.

---

## What's still needed before you can charge money

Deploying makes the app **public**. To actually **sell** it you still need:

- **Accounts + per-company data isolation** — right now all data is shared.
  This is the top priority before real customers (see `PRODUCTIZATION.md`).
- **Billing** — Stripe (or Wix Pricing Plans) to take subscriptions.
- **Terms of Service + Privacy Policy** — you store worker/injury data.

See **`PRODUCTIZATION.md`** for the full path from "live" to "paid product."

## Updating the app later

Every time changes are pushed to the deployed branch, Vercel rebuilds and
redeploys automatically (running migrations via `vercel-build`). You don't
redeploy by hand.

## Health check

`https://sacredops.app/api/health` returns `{"status":"ok","db":"up"}` when the
app and database are healthy — useful for uptime monitors (e.g. UptimeRobot).
