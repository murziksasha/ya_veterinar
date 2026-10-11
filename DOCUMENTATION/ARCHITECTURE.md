# Architecture

Turborepo npm workspaces.

- `packages/shared` compiles to `dist` and is a dependency of both apps. Turbo builds it before the apps.
- `apps/api` owns the Prisma schema. Clinic rows are `Tenant`. Staff rows are `User` with a required `tenantId`.
- RLS is forced on both tables. A policy allows a row when `app.tenant_id` equals the tenant key, or when `app.bypass_rls` is `on`. The API sets only `app.tenant_id`, and only inside `PrismaService.withTenant`.
- The API connects as `vetsync_app` (`DATABASE_URL`). Migrations connect as the database owner (`DIRECT_URL`). The owner is a superuser in local Compose and bypasses RLS, so application queries must not use that login.
- `apps/web` is the clinic workspace (PWA manifest, locales `uk` and `en`). It is not a marketing site. `/` redirects to `/uk`.

Phase 1 modules (auth, CRM, medical records, vaccinations, calendar, basic inventory) are not implemented yet.
