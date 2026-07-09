# SacredOps — from prototype to paid product

This is the roadmap from what exists today to something customers can **buy**.
Read `DEPLOY.md` first to get it live at sacredops.app; this doc covers the
product work on top of that.

## Where it is today

- ✅ Two working portals (Supervisor + Worker) and a reports dashboard.
- ✅ Data persists to Postgres and is queryable/exportable.
- ⚠️ **One shared dataset** — everyone sees the same data. No logins.
- ⚠️ No billing, no accounts, no per-company separation.

So today it's a great **demo**, not yet a **product you can sell**.

## The gap to "purchasable" (in priority order)

### 1. Accounts + multi-tenancy — the #1 blocker
Every company (tenant) must have its own isolated data; users log in.
- Add an `Organization` and `User` model; tag every record with `orgId`.
- Gate the portals and reports behind login; sign-up creates an Organization.
- Two build options:
  - **Managed auth (recommended, fastest):** Clerk / Auth0 / Supabase Auth —
    handles login, password reset, social login, and sessions for you.
  - **Roll your own:** email/password with hashed passwords + sessions. No
    extra service, but more code and you own security/reset flows.

### 2. Billing
Take recurring payment.
- **Stripe** (works anywhere): Products + Prices, Checkout, a customer portal,
  and webhooks to flip an org's plan on payment. Start in **test mode**; go
  live when ready (needs your bank details).
- **Or Wix Pricing Plans** if you'd rather sell/manage subscriptions inside
  Wix and keep billing in one place.
- Decide a model: flat per-company/month, or per-active-worker.

### 3. Roles & permissions
Admin vs. supervisor vs. worker — who can see/do what within a company.

### 4. Legal & compliance
- Terms of Service + Privacy Policy (templates exist; have them reviewed).
- You store worker PII and injury/incident data — some regions treat that as
  sensitive. Add a data-retention/export/delete story.

### 5. Operational basics
- Transactional email (Resend/Postmark) for invites, password reset, alerts.
- Error monitoring (Sentry) and uptime monitoring (hit `/api/health`).
- Backups (Neon does automatic backups; confirm the retention you want).

## Suggested sequence

1. **Deploy** to sacredops.app (see `DEPLOY.md`). — *live, but a demo*
2. **Accounts + multi-tenancy.** — *now it's a real, separable product*
3. **Stripe (test mode).** — *the money machinery works end-to-end*
4. **Legal pages + roles + email.** — *safe to onboard real customers*
5. **Go live on Stripe, invite first paying customer.**

Steps 2–4 are mostly code and can be built against test/dev credentials — the
only things that truly require you are: the domain (done: sacredops.app), live
Stripe + bank details, and picking the auth approach.

## Native-app note

The portals are already phone-shaped and work in a mobile browser. Before
building separate iOS/Android store apps (slower: developer accounts + review),
consider shipping as an **installable PWA** ("Add to Home Screen") — same code,
feels like an app, no store required.
