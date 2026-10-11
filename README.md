# VetSync

Monorepo for the VetSync clinic workspace.

- `apps/api` — NestJS + Prisma
- `apps/web` — Next.js App Router (Ukrainian and English)
- `packages/shared` — types shared by the API and the web app

## Run locally

1. `npm run docker:up` builds and starts Postgres, the API, and the web app.
2. For a local Node process instead, copy `.env.example` to `apps/api/.env`, start only Postgres, then `npm install`, `npm run db:generate`, `npm run db:migrate`, and `npm run dev`.

API: http://localhost:4000/health  
Web: http://localhost:3000 (redirects to `/uk`)

PostgreSQL row-level security is on for clinic tables. The API logs in as `vetsync_app` and reads tenant tables through `PrismaService.withTenant`.

The workspace covers staff sign-in, clients and patients, medical records, vaccinations, a visit board (scheduled, done, cancelled) with print, inventory, subscription billing (trial, basic 500 UAH, pro 1000 UAH), Stripe, LiqPay, and Monobank payment payloads, Checkbox and pRRO.ua fiscal payloads, Telegram, SMS, email, and push notifications, manual and analyzer diagnostics, a clinic report, and public booking at `/uk/book/{slug}`.

`npm test` runs the API suite. Coverage for `apps/api/src` is gated at 99%.
