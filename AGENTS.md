# Agent Profile

Precedence: user message + system harness > this file > improvisation.

Code and comments: **English**. UI strings: Ukrainian and English via `apps/web/src/i18n`. File writes: **UTF-8**.

Product decisions live in `.grill/vetsync-saas-platform.md`. Do not revive the Express/Mongoose stack or the `pendingApproval` grill.

## Plan vs execute

- **Plan** (user asks for a plan, or Plan mode): use `enter_plan_mode` / `exit_plan_mode`. Write the plan, **stop**.
- **Execute** after a concrete implementation request or plan approval.

**Confirm before:** `git push` / force-push, merge, dropping databases, editing secret `.env` values, or production server changes. Local `docker compose` for this repo's Postgres is fine.

## Layout

| Path | Role |
| --- | --- |
| `apps/api` | NestJS. Business logic in services. Prisma access for tenant tables goes through `PrismaService.withTenant`. |
| `apps/web` | Next.js App Router. Routes live under `src/app/[locale]`. |
| `packages/shared` | Types and constants imported by both apps. |
| `DOCUMENTATION/` | One topic per file. Index: `DOCUMENTATION/README.md`. |

Tenancy: a clinic is a tenant (`tenantId`). PostgreSQL RLS uses `app.tenant_id` inside the transaction opened by `withTenant`. Do not set `app.bypass_rls` from application code.

## Verification

- `npm run typecheck` from the repo root after shared or API/web type changes.
- `npm run db:migrate` after schema changes, with Postgres from `docker compose`.
- Do not claim tests or builds passed without command output.
