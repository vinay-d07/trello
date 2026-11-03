`# Day 01: Solution

> Read this only after your timer ended. Compare it with your journal: what did you miss, and why?
> Line numbers are from the baseline commit. If they drift later, search for the function name.

## Summary

| Ticket | Key takeaway                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| T1     | Setup failures are information. Say what broke and why.                                                               |
| T2     | The worker is a separate process. If it's down, notifications queue up and are delivered when it comes back.          |
| T3     | One status change = 1 HTTP request, about 5–6 SQL queries, 1 Redis publish, then **every** viewer refetches the list. |
| T4     | 4 processes and 4 transports: HTTP → BullMQ (Redis) → worker → Redis pub/sub → API socket → WebSocket → browser.      |
| T5     | Redis does 5 different jobs. That makes it the single point of failure.                                               |
| T6     | The best critiques are about failure modes and fan-out, not style.                                                    |

---

## D01-T1: Get it running

### Commands (PowerShell 5.1)

Windows PowerShell 5.1 has **no `&&`**, so the Guide's `git init && git add -A && …` line fails
with a parser error. Use `;` or separate lines:

```powershell
git init; git add -A; git commit -m "baseline"
npm install
npm run infra:up                 # docker compose up -d
docker compose ps                # wait until both say "healthy"
npm run db:migrate -- --name init
npm run db:seed
npm run dev
curl.exe http://localhost:4000/health/ready   # use curl.exe; plain `curl` is an alias for Invoke-WebRequest
npm run check
```

`apps/api/.env` and `apps/web/.env.local` already exist, so skip the `cp` steps.

### Setup issues you may have hit

| Symptom                                                   | Cause                                                                                  | Fix                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `error during connect … docker_engine`                    | Docker Desktop isn't running                                                           | Start it and wait for "Engine running"                                        |
| `port 5432 / 6379 already allocated`                      | A local Postgres or Redis is already installed                                         | Stop that service, or change the host port in `docker-compose.yml` and `.env` |
| API exits right away with `Invalid environment variables` | `config/env.ts` validates with Zod and calls `process.exit(1)` (fail fast, on purpose) | Fix the field it names                                                        |
| Two "Launch v1" projects after seeding again              | `seed.ts` upserts users but always `create`s the project (it isn't idempotent)         | `npm run db:reset -w @taskflow/api`                                           |
| Comment works but no bell                                 | The worker process isn't running (look for the magenta `worker` prefix)                | `npm run dev` runs all three; check the worker's logs                         |
| `/health/ready` returns 503 `{ redis: false }`            | Redis container isn't healthy yet                                                      | `docker compose ps`, wait, retry                                              |
| `taskflow_test` database missing later (Day 3)            | `docker/postgres/init.sql` only runs when the volume is **first** created              | `docker compose down -v` then `up` (this deletes data)                        |

### What to say

> "Before changing anything I want it running and the tests green, so I know the baseline. The
> API validates its env at boot and exits on bad config, which is why it died the first time. That
> was a missing variable, not a code bug."

---

## D01-T2: Realtime smoke test

- Card moves for Alice: `task:updated` socket event → React Query invalidation → refetch (details in T3).
- Bell for Alice on Bob's comment: in the seed, **Alice created every task**, so she's always a
  recipient (see T4, Q1).
- **Worker stopped:** the comment still saves and appears live for Alice (that event comes from the
  API, not the worker), but **no bell**. The job sits in the BullMQ queue in Redis.
- **Worker restarted:** it picks up the waiting job, writes the row, emits, and the bell turns red
  a few seconds late. Nothing is lost. **This is the reason the queue exists:** the request path
  doesn't depend on the consumer being alive.

---

## D01-T3: "Change task status" trace

| #   | Hop                 | file:line                                                                 | What happens                                                                                                                                                                                                                                                                 |
| --- | ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Select change       | `apps/web/src/features/tasks/task-panel.tsx:54` → `:29`                   | `update({ status })` calls `updateTask.mutate({ taskId, version: task.version, status })`. It sends the **version it rendered**.                                                                                                                                             |
| 2   | Mutation            | `apps/web/src/features/tasks/api.ts:39-46`                                | `useUpdateTask` PATCHes `/projects/:id/tasks/:taskId`. `onSettled` invalidates `['projects', id, 'tasks']` on success **and** on error (a 409 means our copy is stale).                                                                                                      |
| 3   | Fetch wrapper       | `apps/web/src/lib/api.ts:40-69`                                           | Calls `fetch('/api' + path)` with `credentials: 'include'`. On a 401 it runs one **single-flight** `/auth/refresh` (`:23`), retries once, otherwise redirects to `/login`. Errors become `ApiError` with the server's `{ error: { code, message } }`.                        |
| 4   | Next proxy          | `apps/web/next.config.ts:12-14`                                           | The rewrite `/api/:path*` → `http://localhost:4000/api/:path*`. The browser sees one origin, so cookies are first-party and there's no CORS preflight.                                                                                                                       |
| 5   | Global middleware   | `apps/api/src/app.ts:18-22`                                               | In order: `requestLogger` (pino, `x-request-id`) → `helmet` → `cors` → `express.json({ limit: '100kb' })` → `cookieParser`.                                                                                                                                                  |
| 6   | Rate limit          | `apps/api/src/routes.ts:10`, `middleware/rate-limit.ts`                   | 300 requests/min, keyed by IP, counters in **Redis** (`rl:api:*`), so the limit holds across replicas.                                                                                                                                                                       |
| 7   | Auth                | `apps/api/src/routes.ts:13` → `middleware/auth.ts:7-16`                   | Reads the `access_token` cookie (or a Bearer header), verifies the JWT, sets `req.user.id`. An expired token is a 401, which triggers the client refresh in hop 3.                                                                                                           |
| 8   | Routing             | `projects/project.routes.ts:32` → `tasks/task.routes.ts:14, 31`           | `/projects/:projectId/tasks` mounts `taskRouter` with `mergeParams: true`, so `:projectId` is visible inside it. That's the `PATCH /:taskId` handler.                                                                                                                        |
| 9   | Validation          | `tasks/task.routes.ts:32-33`, `packages/shared/src/schemas/task.ts:26-38` | Zod parses params and body. Every field is optional except `version`. A `ZodError` becomes a **400** in `error-handler.ts:24`. The **same schema** is used on the client.                                                                                                    |
| 10  | Authorisation       | `tasks/task.service.ts:129` → `projects/project.service.ts:22-33`         | `assertMember` looks up `ProjectMember` by composite key. A non-member gets a **404, not a 403**.                                                                                                                                                                            |
| 11  | Write + concurrency | `tasks/task.service.ts:130-155`                                           | `assertAssignable` (skipped when there's no `assigneeId`) → `findFirst` for the "before" assignee → `updateMany where { id, projectId, version }` with `version: { increment: 1 }`. If `count === 0` → **409**. Then `findUniqueOrThrow` re-reads the row with its assignee. |
| 12  | Publish             | `tasks/task.service.ts:157` → `realtime/emitter.ts:20-28`                 | `emitToProject` uses `@socket.io/redis-emitter`: a Redis **PUBLISH**, fire-and-forget (not awaited). Any process can emit, not only the one holding the socket.                                                                                                              |
| 13  | Fan-out             | `realtime/socket-server.ts:37, 59-64`                                     | Every API replica's **Redis adapter** receives the message and sends it to its local sockets in room `project:<id>`. Sockets joined that room through `project:join`, which also runs `assertMember`.                                                                        |
| 14  | Client listener     | `apps/web/src/features/tasks/use-project-realtime.ts:34, 25-26`           | `task:updated` → `refreshTasks` → `invalidateQueries(['projects', id, 'tasks'])`. The payload is **ignored**.                                                                                                                                                                |
| 15  | Re-render           | `apps/web/src/features/tasks/project-board.tsx:18, 22-29`                 | `useTasks` refetches `GET /tasks?limit=100`, `columns` is recomputed in `useMemo`, and the card moves to its new column.                                                                                                                                                     |

### Answers

**1. SQL queries per status change: 5 (6 when the assignee changes).**
`assertMember` (1) + `assertAssignable` (0 or 1) + `findFirst` before (1) + `updateMany` (1) +
`findUniqueOrThrow` with `include: assignee` (2: Prisma's default relation strategy runs a separate
query for the include). Then **every open board** refetches `GET /tasks`: `assertMember` + `findMany`

- the assignee include = 3 more queries **per viewer**. Check with `LOG_LEVEL=debug`.

**2. `version`: optimistic concurrency control.** The UPDATE only matches if the row still has the
version the client saw. If Alice and Bob both edit version 7, the first one wins (it becomes 8),
and the second matches 0 rows and gets a **409** "This task was changed by someone else". Their
error shows under the selects (`task-panel.tsx:80`), and `onSettled` refetches so they see the
latest data. Without this you get a **lost update**: the last write silently overwrites the first.
Trade-off versus `SELECT … FOR UPDATE`: no locks held, and it's cheap when conflicts are rare.

**3. Bob's tab updates twice.** `onSettled` invalidates the list, **and** Bob is in the project room,
so his own `task:updated` event invalidates it again. That's up to 2 refetches for 1 click (React
Query may cancel and restart the first). Also, the select is controlled by `task.status`, so it
**snaps back to the old value** until the refetch lands. There's no optimistic update (Day 12).

**4. Alice ignores the payload and refetches the whole list (100 tasks).** With N viewers, one click
causes N `GET /tasks` calls at the same moment, about 3N queries and N × 100 rows serialised. That
is a **thundering herd** made by a correct-looking design. The better fix:
`queryClient.setQueryData` to patch the one task from the event payload (it's a full `TaskDTO`),
and refetch only on reconnect or a version gap.

**5. 404 `NOT_FOUND "Project not found"`.** `assertMember` deliberately returns 404 rather than 403
so outsiders can't tell whether a project id exists (`project.service.ts:19-21`). Also note the
update `where` includes `projectId` (`task.service.ts:133, 140`). Without it, a member of
project A could edit a task in project B by sending B's task id under A's URL. That's an **IDOR**,
and it's a favourite planted bug.

---

## D01-T4: Notification trace

```
Bob's browser ──HTTP POST /api/projects/:p/tasks/:t/comments──▶ Next :3000 (rewrite) ──▶ API :4000
  comment.routes.ts:17  → createCommentSchema (trim, 1..5000)
  comment.service.ts:58 → assertMember → findTaskInProject (task must be in this project)
                        → prisma.comment.create
                    :72 → emitToProject('comment:created')       ─ Redis PUBLISH ─▶ open boards refetch comments
                 :74-94 → recipients = {assignee, creator} − author
                        → enqueueNotification(data, jobId `comment-<commentId>-<recipientId>`)
  notification.queue.ts:44 → BullMQ Queue.add ── Redis (list/stream) ──┐
  ◀── 201 to Bob (no waiting for the notification)                    │
                                                                      ▼
Worker process (src/worker.ts:13, separate Node process)
  notification.worker.ts:16 → prisma.notification.create   (the only place the row is written)
                         :19 → emitToUser(user:<aliceId>, 'notification:created') ─ Redis PUBLISH ─┐
                                                                                                   ▼
API process: Redis adapter (socket-server.ts:37) → Alice's socket, which is in room user:<aliceId>
                                                   because of socket-server.ts:57 on connect
                                                                                                   ▼
Alice's browser: notifications/api.ts:31-32 → invalidate ['notifications']
  → GET /api/notifications?limit=20 → notification.service.ts:29 counts unread
  → notification-bell.tsx:38 renders the red badge
```

**Q1. Recipients are the task's assignee and creator, minus the author** (`comment.service.ts:74-76`).
It isn't "everyone in the project" and it isn't "everyone in the thread". If Alice comments on a task
she created that's assigned to herself, **Bob gets nothing**, even if he commented on it before.
Interviewers like asking "is this the right product behaviour?" A watchers/subscribers table is the
usual answer.

**Q2. The worker writes the row** (`notification.worker.ts:16`), not the API. The API only enqueues.

**Q3. Failure modes:**

- **Worker down:** jobs wait in Redis. They're processed on restart and delivered late, not lost.
- **Redis down at enqueue time:** `enqueueNotification` catches the error and logs
  `failed to enqueue notification` (`notification.queue.ts:45-47`). The comment is saved, but **the
  notification is lost for good**. The code documents this on purpose: it's "best-effort", and the
  real fix is the **transactional outbox** (Day 19).
- **Job fails in the worker** (e.g. DB blip): 5 attempts with exponential backoff from 1 s
  (`notification.queue.ts:21-22`), then it's kept as failed for 7 days.

**Q4. `jobId` dedupe.** BullMQ ignores `add` when a job with the same id already exists, so
`comment-<commentId>-<recipientId>` makes the enqueue idempotent. The catch: this only dedupes the
**enqueue**. If the worker crashes **after** `notification.create` but before the job is marked
complete, BullMQ retries it (stalled job) and you get a **duplicate row**. The consumer isn't
idempotent (Day 18).

**Q5.** On every connection the server joins the socket to `user:<userId>`, taken from the verified
JWT (`socket-server.ts:42-57`). The client never asks for it, so it can't ask for **someone else's**
room. Project rooms are different: they need an explicit `project:join` that is
membership-checked (`:59-64`).

**2-minute version (what you should be able to say):**

> "Bob's POST hits the API through the Next rewrite. After the membership check, the API saves the
> comment, publishes `comment:created` to the project room through Redis, and enqueues one BullMQ
> job per recipient, which is the assignee and creator minus Bob, with a deterministic jobId for
> dedupe. It returns 201 right away, without waiting on the notification. A separate worker process
> takes the job, inserts the Notification row, and publishes `notification:created` to Alice's user
> room via the Redis emitter. The API's Socket.IO Redis adapter receives that and pushes it down
> Alice's websocket. Every socket joins its user room at handshake. Alice's client invalidates the
> notifications query, refetches, gets `unreadCount`, and the badge turns red. Weak spots: if Redis
> is down at enqueue time the notification is lost (an outbox would fix that), and the worker isn't
> idempotent if it's retried after the insert."

---

## D01-T5: Architecture

```
                      ┌─────────────────────────── Browser ───────────────────────────┐
                      │  React + React Query            Socket.IO client (websocket)  │
                      └──────┬───────────────────────────────────────┬────────────────┘
          HTTP (pages + /api/*, │ cookies)                            │ WS  :4000 directly
                             ▼                                        │ (cookie auth at handshake)
                    ┌──────────────────┐   HTTP rewrite /api/*        │
                    │  Next.js  :3000  │─────────────────────┐        │
                    │ SSR, middleware  │                     ▼        ▼
                    │ route guard      │              ┌────────────────────────┐
                    └──────────────────┘              │  API (Express) :4000   │
                                                      │  REST + Socket.IO      │
                                                      └──┬──────────┬──────┬───┘
                                               Prisma SQL │   ioredis│      │ BullMQ add
                                                         ▼          ▼      ▼
                                              ┌───────────────┐  ┌──────────────────────────────┐
                                              │ Postgres:5432 │  │ Redis :6379                  │
                                              │ source of     │  │ 1. cache (cache:user:*)      │
                                              │ truth         │  │ 2. rate-limit counters (rl:*)│
                                              └───────▲───────┘  │ 3. BullMQ queue (bull:*)     │
                                                      │          │ 4. Socket.IO adapter pub/sub │
                                               Prisma │          │ 5. emitter publish channel   │
                                                      │          └──────────────▲───────────────┘
                                              ┌───────┴──────────┐  consume jobs │ + PUBLISH events
                                              │ Worker (Node)    │───────────────┘
                                              │ BullMQ consumers │
                                              └──────────────────┘
```

Things the diagram must show:

- **REST goes through Next (rewrite); the websocket goes straight to :4000**
  (`lib/socket.ts:13`, `NEXT_PUBLIC_SOCKET_URL`). So the API's CORS and the socket CORS both have
  to allow `:3000`.
- **The worker never talks to browsers.** It reaches them only through Redis pub/sub → an API replica.
- Refresh tokens live in **Postgres** (hashed), not Redis.

**3 copies of each:**

- **API: yes.** It's stateless (JWT plus shared Redis/Postgres). Sockets are websocket-only, so no
  sticky sessions are needed, and the Redis adapter fans out across replicas.
- **Worker: yes.** BullMQ hands each job to exactly one consumer.
- **Next: yes.**
- **What breaks first:**
  - **Redis** is a single point of failure for five features.
  - **Postgres connections:** each Prisma client opens `num_cpus × 2 + 1` connections by default,
    so 3 API + 3 worker processes on 8-core hosts is about 100 connections, which is Postgres's
    default `max_connections`. You'd need PgBouncer (Day 22).

---

## D01-T6: "What would I do differently?" Model answers

Any 3 with a clear file, impact and fix get full marks. These are ranked roughly by severity.

| #   | Where                                                             | Problem                                                                                                                                                                                                                                | Impact                                                                                     | Fix                                                                                                                  | Day |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | `middleware/rate-limit.ts`                                        | **Fails closed.** `express-rate-limit` defaults to `passOnStoreError: false`, so a Redis error is thrown and becomes a **500 on every `/api` request**. The cache, by contrast, deliberately fails open. The two policies don't match. | A Redis blip takes down the whole API, auth included.                                      | `passOnStoreError: true` for the general limiter (maybe keep it strict on `/auth`), plus an alert.                   | 22  |
| 2   | `comment.service.ts:67-94`, `task.service.ts:155-158`             | **Dual write.** The DB commit, the socket emit and the enqueue are separate steps. Redis down → notification lost. A crash between the steps → partial side effects.                                                                   | Silent data loss for notifications.                                                        | Transactional outbox: write an `OutboxEvent` in the same transaction, and have a relay enqueue it.                   | 19  |
| 3   | `use-project-realtime.ts:25-36`                                   | **Refetch storm.** Every event invalidates the whole list and ignores the payload. N viewers × every edit = N full list queries.                                                                                                       | The DB load grows with viewers × edit rate. This is what falls over first on a busy board. | `setQueryData` patch from the payload, with a version check; full refetch only on reconnect.                         | 12  |
| 4   | `socket-server.ts:42-64`                                          | **Auth only at handshake.** A user removed from a project keeps getting its events. An expired JWT keeps a live socket open forever.                                                                                                   | Data leak after access is revoked.                                                         | On membership removal, `io.in(user room).socketsLeave(project room)`; check token expiry periodically or disconnect. | 17  |
| 5   | `notification.worker.ts:16-19`                                    | **Consumer isn't idempotent.** A retry after the insert creates a duplicate row.                                                                                                                                                       | Duplicate notifications (or duplicate emails once there's a digest).                       | Unique `dedupeKey` on `Notification` (the jobId) plus `upsert`/`createMany skipDuplicates`.                          | 18  |
| 6   | `task.service.ts:129-155`                                         | **5–6 sequential round trips** for one update, and `assertMember` + `assertAssignable` could run in parallel. The `before` read exists only to detect an assignee change.                                                              | Latency, not correctness (the version check keeps it safe).                                | `Promise.all` the two checks. Use `update … RETURNING` (via `$transaction` or raw SQL) to avoid the re-read.         | 9   |
| 7   | `lib/cache.ts:13-33`                                              | **No stampede protection.** When a hot key expires, every concurrent miss runs the loader.                                                                                                                                             | A load spike every TTL.                                                                    | Single-flight per key plus TTL jitter.                                                                               | 11  |
| 8   | `routes.ts:10`, `config/env.ts:23`                                | **Rate limit is keyed by IP**, and `TRUST_PROXY=0`. Behind a load balancer every user shares the LB's IP, so the whole company gets one 300/min bucket. In an office behind NAT, everyone shares one.                                  | False 429s in production.                                                                  | Set `TRUST_PROXY` correctly; key authenticated routes by `req.user.id`.                                              | 20  |
| 9   | `prisma/schema.prisma` `Notification.type String`, `payload Json` | **Untyped columns.** The DB doesn't stop an invalid `type`, and the payload shape is only enforced by convention (`notification-bell.tsx` uses `String(p.title)`).                                                                     | Drift between producer and UI, and runtime "undefined" text.                               | A Prisma enum for `type`; a Zod discriminated union for the payload, shared across API, worker and web.              | 6   |
| 10  | `prisma/seed.ts:28`                                               | **Not idempotent.** Every run adds another project.                                                                                                                                                                                    | Confusing local data, and flaky perf baselines.                                            | Upsert on a fixed id, or truncate first.                                                                             | 3   |

**What makes a critique score well:** _file → concrete failure scenario → impact → smallest
fix → what you'd defer._ For example:

> "The rate limiter fails closed on Redis errors while the cache fails open. I'd make them
> consistent, because right now a Redis restart is a full API outage."

That beats "I'd add more comments" every time.

Also worth saying, because it shows judgement: some things here are **good choices you should keep**.

- `assertMember` returns 404 for non-members.
- Fields are listed explicitly to avoid mass assignment (`task.service.ts:102`).
- Keyset pagination has an `id` tiebreaker.
- Liveness and readiness are separate checks.
- The refresh token is hashed and rotated, with reuse detection.
- The dummy bcrypt hash equalises login timing.
- The access cookie deliberately outlives its JWT (`auth.cookies.ts:19-21`).

Naming these in an interview shows you can tell deliberate design from accident.

---

## Common mistakes on Day 1

- Reading files top to bottom instead of following one request with "Go to definition".
- Assuming the worker runs inside the API process. It doesn't, and that's the whole point.
- Missing that the realtime handler **ignores the payload** and refetches.
- Saying "403" for non-members. This codebase returns 404 on purpose.
- Listing only style nits in T6. Interviewers want failure modes and scale.

## Follow-up questions you may get

- "Why is the socket connection made to :4000 directly but REST goes through Next?"
- "Your board shows only the newest 100 tasks (`project-board.tsx:14`). What happens at 5,000?"
- "If we ran the worker on 3 machines, could a notification be delivered twice? Why?"
- "Why does the access cookie live 7 days when the JWT inside it lives 15 minutes?"
`