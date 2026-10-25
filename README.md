# TaskFlow

A production-style **Next.js + Express** monorepo, built to practise codebase interview rounds
(find and fix bugs, speed things up, add features, scale it). The study plan is in **[Guide.md](./Guide.md)**.

## Stack

| Layer    | Tech                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| Web      | Next.js 15 (App Router), React 19, TanStack Query, Tailwind v4, Socket.IO client     |
| API      | Express 5, TypeScript, Zod, Prisma (PostgreSQL), pino                                |
| Realtime | Socket.IO + Redis adapter (multi-instance), Redis emitter (publish from any process) |
| Jobs     | BullMQ on Redis, separate worker process                                             |
| Cache    | Redis cache-aside (`apps/api/src/lib/cache.ts`)                                      |
| Security | httpOnly cookie JWT + rotating refresh tokens, helmet, CORS, Redis rate limiting     |
| Tooling  | npm workspaces, ESLint 9 (flat), Prettier, Vitest + Supertest, GitHub Actions        |

## Quick start

```bash
# Prereqs: Node 20+ and Docker Desktop (running)
npm install
cp apps/api/.env.example apps/api/.env          # already done if you used the generator
cp apps/web/.env.example apps/web/.env.local
npm run infra:up                                 # postgres + redis
npm run db:migrate -- --name init                # create tables
npm run db:seed                                  # alice@example.com / password123
npm run dev                                      # api :4000, worker, web :3000
```

Open http://localhost:3000 and log in as `alice@example.com` in one browser and `bob@example.com` in
another (or an incognito window) to watch realtime updates and notifications.

## Layout

```
apps/
  api/                      Express API + worker
    prisma/                 schema.prisma, seed.ts, migrations/
    src/
      config/env.ts         validated env (fails fast)
      lib/                  prisma, redis, cache, logger singletons
      middleware/           auth, error handler, rate limit, request logger
      modules/<domain>/     *.routes.ts (HTTP + validation) -> *.service.ts (business logic)
      queues/               BullMQ queue definitions + enqueue helpers (producer side)
      workers/              BullMQ processors (consumer side)
      realtime/             socket server (API process) + redis emitter (any process)
      app.ts                express app factory (used by tests)
      index.ts              HTTP + socket server, graceful shutdown
      worker.ts             worker process entrypoint
    tests/
  web/                      Next.js app
    src/
      app/                  routes: (auth)/login, (auth)/register, (app)/projects/...
      features/<domain>/    api.ts (React Query hooks) + components
      components/           shared UI
      lib/                  api client, socket, query keys, formatting
      middleware.ts         route guard
packages/
  shared/                   Zod schemas, DTO types, socket event contracts (used by both apps)
```

## Scripts (from the repo root)

| Command              | What it does                                       |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | API, worker and web in watch mode                  |
| `npm run check`      | lint + typecheck + tests (run before every commit) |
| `npm run db:migrate` | create/apply a Prisma migration                    |
| `npm run db:seed`    | seed data (`SEED_TASKS=50000` for perf work)       |
| `npm run db:studio`  | browse the DB                                      |
| `npm run build`      | production builds                                  |

## API overview

```
POST   /api/auth/register | /login | /refresh | /logout      GET /api/auth/me
GET    /api/projects                 POST /api/projects
GET    /api/projects/:id             POST /api/projects/:id/members
GET    /api/projects/:id/tasks?status=&assigneeId=&q=&cursor=&limit=
POST   /api/projects/:id/tasks       PATCH|DELETE /api/projects/:id/tasks/:taskId   (PATCH needs `version`)
GET    /api/projects/:id/tasks/:taskId/comments     POST same
GET    /api/notifications            POST /api/notifications/:id/read | /read-all
GET    /health/live                  GET /health/ready
```

Socket events: see `packages/shared/src/realtime.ts`.
