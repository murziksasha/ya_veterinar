# Architecture

Turborepo npm workspaces.

- `packages/shared` compiles to `dist` and is a dependency of both apps. Turbo builds it before the apps.
- `apps/api` owns the Prisma schema. Clinic rows are `Tenant`. Staff rows are `User` with a required `tenantId`.
- RLS is forced on both tables. A policy allows a row when `app.tenant_id` equals the tenant key, or when `app.bypass_rls` is `on`. The API sets only `app.tenant_id`, and only inside `PrismaService.withTenant`.
- The API connects as `vetsync_app` (`DATABASE_URL`). Migrations connect as the database owner (`DIRECT_URL`). The owner is a superuser in local Compose and bypasses RLS, so application queries must not use that login.
- `apps/web` is the clinic workspace (PWA manifest, locales `uk` and `en`). It is not a marketing site. `/` redirects to `/uk`.

Sign-in is email and password. `User.email` is unique. The session cookie is `vetsync_session` (httpOnly). The browser calls the API through the Next rewrite `/v1/*`. Login looks up the account with `auth_find_user_by_email`, a `SECURITY DEFINER` function, because the clinic id is not known yet. Registration generates the tenant id, sets `app.tenant_id` in a transaction, then inserts `Tenant` and the owner `User`.

Staff roles are `owner`, `veterinarian`, and `assistant`. `GET /staff` lists the clinic. `POST /staff` and `DELETE /staff/:id` are owner-only. The signed-in owner cannot delete their own row, and the last owner cannot be removed.

Workspace routes live under `/[locale]/app`. CRM, medical records, vaccinations, calendar, and inventory are still placeholders.
