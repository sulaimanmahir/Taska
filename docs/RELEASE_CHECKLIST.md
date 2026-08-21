# Release Checklist — Core Sales-to-Inventory Workflow

Tracked in [WORKPLAN_2026-08.md](WORKPLAN_2026-08.md) Milestone 4 ("prepare a
concise release checklist for the core workflow"). This is written for
whoever deploys Taska next — it lists what genuinely needs attention before
a real (non-demo) launch, verified against the actual codebase rather than
assumed. Everything here was checked directly: `.env.example`, migration
status, the scheduler config, and the payment/push/mail integration points.

## 1. Environment variables that must be set for real (not left as `.env.example` defaults)

| Variable | Why | Where |
|---|---|---|
| `APP_ENV=production`, `APP_DEBUG=false` | Debug mode leaks stack traces and env values in error responses | `backend/.env` |
| `APP_URL` / `FRONTEND_URL` | Used to build password-reset and team-invite links (`AppServiceProvider`, `BusinessTeamService::sendInviteEmail`) — wrong values silently send broken links | `backend/.env` |
| `DB_CONNECTION` + credentials | `.env.example` defaults to `mysql` with empty credentials; local dev commonly overrides to `sqlite` — confirm the real target database before first deploy | `backend/.env` |
| `MAIL_MAILER` and SMTP credentials | Defaults to `log` (writes to `storage/logs/laravel.log`, sends nothing) — team invites and password resets silently "work" but no email ever arrives until this is a real transactional mailer | `backend/.env` |
| `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` (+ public keys) and their `_ENV` flipped from `staging` to `live`/`production` | Billing checkout (`BillingController`) won't process real payments otherwise | `backend/.env` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | The committed dev pair (generated via Node's `crypto.createECDH`, documented inline in `.env.example`) works for local testing only — push notifications need a real production pair and `PushNotificationService::isConfigured()` returns false until both are set | `backend/.env` |
| `QUEUE_CONNECTION` | Defaults to `database` — fine for low volume, but confirm a queue worker is actually running (`php artisan queue:work`) wherever this deploys, or nothing on the `database` queue driver ever processes | hosting config |

Double-check your real `.env` doesn't still have leftover local-dev values
(e.g. `APP_NAME=Laravel` instead of `Taska`, or a `DB_CONNECTION` your local
machine used) — `.env.example` itself is correct, but a copied-and-edited
`.env` can drift from it silently.

## 2. One-time post-deploy steps

- **Grant platform admin access.** No user has `is_platform_admin = true` by
  default (see ROADMAP.md Platform Hardening) — the `/api/admin/*` platform
  dashboard is unreachable until you run:
  ```
  php artisan taska:grant-platform-admin you@example.com
  ```
- **Wire the cron entry.** `bootstrap/app.php`'s `withSchedule()` registers
  `taska:compute-gamification-snapshots` (daily) and
  `taska:send-critical-alerts` (every 15 minutes), but registering a
  schedule does nothing by itself — it only fires once something runs
  `php artisan schedule:run` every minute. Add that as a real cron entry (or
  hosting-platform equivalent) or neither job ever executes.
- **Run migrations.** `php artisan migrate --force` (the `composer setup`
  script already does this for a fresh install). Confirmed zero pending
  migrations as of this checklist being written.

## 3. Pre-flight smoke test

Before calling a deploy done, actually run through
[CORE_SALES_WORKFLOW_DEMO.md](CORE_SALES_WORKFLOW_DEMO.md) once against the
real deployed environment (not just `migrate:fresh --seed` locally) — log
in, complete a sale, issue a return, check the numbers land in Reports. That
walkthrough is backed by real automated tests (listed at the bottom of that
doc), but a live click-through against the actual deployed database/queue/
mail configuration is the only way to catch an environment problem the test
suite can't see (wrong `FRONTEND_URL`, mailer not actually delivering,
payment gateway keys pointed at the wrong environment).

## 4. Known, already-documented limitations (not blocking, but real)

These are tracked in ROADMAP.md's Platform Hardening section — listed here
so they're not rediscovered mid-launch:

- `AdminController` is rebuilt on real models as of 2026-08-20 (`stats`,
  `users`, `businesses`, `plans`, `transactions`, `referrals` all return
  real data now). `supportTickets`/`resolveTicket` are real too as of
  2026-08-21 — see `SupportTicket`/`SupportTicketController` and the
  Settings > Support tab.
- Approval thresholds (Settings → Approvals) are business-wide by default,
  with optional per-branch overrides as of 2026-08-20 (a branch left
  unconfigured just inherits the business-wide setting).
- Automatic branch-aware warehouse routing only engages once a business
  actually assigns warehouses to branches (Settings → Warehouses) — a
  business that hasn't done this keeps using the single business-wide
  default warehouse, exactly as before that feature existed.

## 5. What does NOT need re-checking

The core sales/inventory/approval/branch-routing logic this checklist sits
next to is already covered by the automated suite (326+ backend feature
tests as of this writing, `php artisan test`) and was live-verified via
Playwright walkthroughs during development, not just unit-tested. Frontend
has its own suites (`npm test`, `npm run test:render`). Re-running both
before a deploy is good practice, but the logic itself doesn't need manual
re-verification beyond the smoke test in section 3.
