# Architecture

Turborepo npm workspaces.

- `packages/shared` compiles to `dist` and is a dependency of both apps. Turbo builds it before the apps.
- `apps/api` owns the Prisma schema. Clinic rows are `Tenant`. Staff rows are `User` with a required `tenantId`.
- RLS is forced on tenant tables. A policy allows a row when `app.tenant_id` equals the tenant key, or when `app.bypass_rls` is `on`. The API sets only `app.tenant_id`, and only inside `PrismaService.withTenant` (registration sets it in the same transaction as the insert).
- The API connects as `vetsync_app` (`DATABASE_URL`). Migrations connect as the database owner (`DIRECT_URL`). The owner is a superuser in local Compose and bypasses RLS, so application queries must not use that login.
- `apps/web` is the clinic workspace (PWA manifest, locales `uk` and `en`). It is not a marketing site. `/` redirects to `/uk`. The browser calls the API through the Next rewrite `/v1/*`. Locale middleware does not rewrite `/v1`.

## Identity

Sign-in is email and password. `User.email` is unique. The session cookie is `vetsync_session` (httpOnly, 14 days). Login looks up the account with `auth_find_user_by_email`, a `SECURITY DEFINER` function, because the clinic id is not known yet. Registration generates the tenant id and slug, sets `app.tenant_id`, then inserts `Tenant` and the owner `User`. A new clinic is on the `trial` plan for 14 days.

Staff roles are `owner`, `veterinarian`, and `assistant`. `GET /staff` lists the clinic. `POST /staff` and `DELETE /staff/:id` are owner-only. The signed-in owner cannot delete their own row, and the last owner cannot be removed.

When the trial end is in the past and the plan is still `trial`, clinical writes return `subscription_inactive`. Billing stays available.

## Thirteen modules

| Module | Routes |
| --- | --- |
| Identity and staff | `/auth/*`, `/staff` |
| CRM | `/clients`, `/patients` |
| Medical records | `POST /patients/:id/records` |
| Vaccinations | `POST /patients/:id/vaccinations`, `GET /vaccinations/due` |
| Calendar | `/appointments` |
| Inventory | `/inventory`, `POST /inventory/:id/movements` |
| Subscription billing | `/billing/subscription` |
| Payments | `POST /invoices`, `POST /invoices/:id/pay`, `POST /invoices/:id/void` |
| PRRO | `POST /invoices/:id/fiscal` |
| Notifications | `/notifications`, `POST /notifications/:id/dispatch` |
| Diagnostics | `POST /patients/:id/studies` |
| BI | `GET /bi/overview` |
| Public booking | `GET /public/clinics/:slug`, `POST /public/clinics/:slug/appointments` |

`GET /plugins` lists the adapter ids. Prices are fixed per clinic: trial 0, basic 500 UAH, pro 1000 UAH (`PLAN_PRICE_KOP` in kopiykas).

Payment adapters are `stripe`, `liqpay`, and `monobank`. Fiscal adapters are `checkbox` and `prro_ua`. Notification channels are `telegram`, `sms` (TurboSMS-shaped payload), `email`, and `push`. Diagnostic sources are `manual` (DICOM or image file name) and `generic_analyzer`.

Adapters build the provider payload and a signature from `STRIPE_SECRET`, `LIQPAY_PRIVATE_KEY`, or `MONOBANK_TOKEN` when those variables exist. Otherwise they sign with the local development key. They do not call the provider network. A paid subscription invoice updates `Tenant.plan`.

Public booking resolves the clinic with `public_clinic_by_slug`, then creates the client, patient, and appointment inside `withTenant`. The web page is `/[locale]/book/[slug]`.

Workspace pages live under `/[locale]/app`.
