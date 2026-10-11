# VetSync

Monorepo for the VetSync clinic workspace.

- `apps/api` — NestJS + Prisma
- `apps/web` — Next.js App Router (Ukrainian and English)
- `packages/shared` — types shared by the API and the web app

## Run locally

1. Copy `.env.example` to `apps/api/.env`.
2. `docker compose up -d`
3. `npm install`
4. `npm run db:generate`
5. `npm run db:migrate`
6. `npm run dev`

API: http://localhost:4000/health  
Web: http://localhost:3000 (redirects to `/uk`)

PostgreSQL row-level security is on for `Tenant` and `User`. The API logs in as `vetsync_app` and reads tenant tables through `PrismaService.withTenant`.
