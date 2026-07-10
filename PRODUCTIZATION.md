# SacredOps — from prototype to paid product

This is the roadmap from what exists today to something customers can **buy**.
Read `DEPLOY.md` first to get it live at sacredops.app; this doc covers the
product work on top of that.

## Where it is today

- ✅ Two working portals (Supervisor + Worker) and a reports dashboard.
- ✅ Data persists to Postgres and is queryable/exportable.
- ✅ **Accounts + per-company isolation** — everyone logs in; each company's data is
  separate (join code for workers, email/password for supervisors).
- ⚠️ No billing yet.

So today it's a real, multi-tenant app — the main thing left before selling is **billing**.

## The gap to "purchasable" (in priority order)

### 1. Accounts + multi-tenancy — ✅ DONE
Every company is an isolated tenant with a join code; everyone logs in.
- `Company` / `User` / `Session` models; every portal record tagged with `companyId`
  and a composite `(companyId, id)` primary key so ids can't collide across tenants.
- Portals and reports are gated behind login; server scopes every request to the
  caller's company.
- Supervisors/admins use email + password; workers use company code + name + PIN.
- Built in-house with scrypt hashing + httpOnly session cookies (`lib/auth.ts`) — no
  external auth service required. (Could later swap to Clerk/Auth0 if you want social
  login / SSO / password-reset emails out of the box.)
- **Remaining polish:** password-reset email, admin screen to view/rotate the join code
  and remove workers, and roles/permissions beyond the current admin/supervisor/worker.

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
