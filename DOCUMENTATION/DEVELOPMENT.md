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

`apps/api/.env` needs both URLs from `.env.example`. `DATABASE_URL` is the non-superuser `vetsync_app` login. `DIRECT_URL` is the owner login used by Prisma migrations. Both passwords are the local Compose default.

API listens on `API_PORT` (4000). Web listens on 3000 and calls no API yet. `GET /health` checks that Prisma can run `SELECT 1`.
