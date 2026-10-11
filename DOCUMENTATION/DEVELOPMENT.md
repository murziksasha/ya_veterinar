# Development

Requirements: Node.js 22+, npm, Docker.

```
copy .env.example apps\api\.env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

`apps/api/.env` needs the values from `.env.example`. `DATABASE_URL` is the non-superuser `vetsync_app` login. `DIRECT_URL` is the owner login used by Prisma migrations. Both passwords are the local Compose default. `SESSION_SECRET` signs the session cookie.

API listens on `API_PORT` (4000). Web listens on 3000 and calls the API through `/v1`. `GET /health` checks that Prisma can run `SELECT 1`.

```
npm test
```

API tests use Jest against Compose Postgres. The coverage gate is 99% statements, branches, functions, and lines for `apps/api/src`, except `main.ts` (process entry that only listens). Restart `npm run dev` after a schema change so both processes load the new build.
