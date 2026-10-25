# Codebase Interview Prep: 30-Day Guide

> Goal: by Day 30 you can open an unfamiliar repo and, within 60 to 90 minutes, get it running,
> find and fix bugs, speed it up, add a feature cleanly, and explain the scaling trade-offs out loud.

**How to use this guide**

1. Read Part 1 (the round) and Part 2 (the playbook) once, on Day 1.
2. Each day, open Part 4, do that day's tasks, and tick the boxes.
3. When a day says **🧰 Ask Claude**, paste that prompt into Claude Code in this folder. I'll create a
   _task pack_ (bugs, slow code, or a feature ticket) in the codebase for you to work on.
4. After each session, write 5 minutes of notes in `journal/` (template in `journal/TEMPLATE.md`).

---

## Part 1: What this round is

### 1.1 The format

Companies are moving away from pure DSA rounds toward "work on a real codebase" rounds, partly
because AI tools have made LeetCode-style questions less useful as a signal. The round goes by
different names:

| Name you may hear                                                               | What it usually means                                                                                                      |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Bug bash / bug squash / debugging round**                                     | Repo with failing tests or reported bugs. Find the root causes, fix them, explain why.                                     |
| **Code review round**                                                           | You get a PR or diff and review it like a senior engineer: bugs, security, performance, readability.                       |
| **Practical / pair-programming / "work sample"**                                | Add a small feature to an existing app while the interviewer watches and asks questions.                                   |
| **Refactoring / code-quality round**                                            | Messy but working code. Make it clean and testable without breaking it.                                                    |
| **AI-assisted coding round**                                                    | Same as above, but you're allowed or expected to use an AI assistant. They grade how well you _steer and verify_ it.       |
| **Machine coding (common in India: Flipkart, Swiggy, Razorpay, PhonePe, etc.)** | Build a small working app or module from scratch in 90 to 120 minutes, then extend it live. A close sibling of this round. |

Candidates commonly report these formats at Stripe (bug-squash / integration rounds), Shopify
(pair programming), Meta (AI-assisted coding round), Canva (AI-assisted), and many growth-stage
startups. **Formats change often, so ask your recruiter:** _"What language and stack will the
codebase be in? Can I use my own IDE or AI tools? Is it bugs, features, or both?"_ Recruiters
usually tell you.

### 1.2 A typical session (60 to 90 minutes)

| Time         | What happens                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 to 5 min   | Intro. You get a repo (zip, GitHub link, CoderPad/CodeSandbox, or screen share of their IDE).                                                       |
| 5 to 15 min  | **Setup and orientation.** Install, run it, run the tests, read the README and folder layout.                                                       |
| 15 to 60 min | **2 to 5 tasks, in increasing difficulty**: e.g. "test X fails", "users report Y is slow", "add filter Z", "this breaks when 2 users do W at once". |
| 60 to 75 min | **Discussion.** "How would this scale to 10M users?", "What would you change with more time?", "How would you test this?"                           |
| Last 5 min   | Your questions.                                                                                                                                     |

You usually **won't finish everything**. Interviewers care more about how you work than how many
tasks you complete.

### 1.3 Tech stacks you'll see

- **Most common for full-stack and web roles:** TypeScript/JavaScript with **Node/Express** (sometimes NestJS or Fastify) plus **React/Next.js**, using Postgres (Prisma, TypeORM, Knex, or raw SQL), MongoDB (Mongoose), and Redis.
- **Backend roles:** Python (FastAPI/Django/Flask), Go, Java/Kotlin (Spring Boot). It's worth being able to _read_ one of these (Day 26).
- The repo is typically **500 to 5,000 lines**: small enough to understand, big enough that you can't read all of it.
- Often a **deliberately planted** mix of bugs: an off-by-one, a missing `await`, an N+1 query, a race condition, a missing auth check, a React stale closure.

### 1.4 What they grade (the rubric behind the scenes)

| Signal                    | What strong looks like                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Navigation**            | You find the relevant code fast (search, follow the request path, read tests) instead of reading files top to bottom.  |
| **Debugging method**      | Reproduce → hypothesise → verify (logs/debugger/test) → fix the _root cause_ → prove it with a test. No random edits.  |
| **Correctness**           | You handle edge cases (null, empty, concurrency, auth) and don't break anything else.                                  |
| **Code quality**          | Small, readable diffs that match the codebase's existing style. Good names. No over-engineering.                       |
| **Testing**               | You write or adjust a test that would have caught the bug.                                                             |
| **Performance sense**     | You _measure_ before and after, and know the usual suspects (N+1, missing index, re-renders, blocking the event loop). |
| **System thinking**       | You can explain caching, queues, horizontal scaling, and consistency trade-offs **with reference to this code**.       |
| **Communication**         | You think out loud, state assumptions, prioritise, and ask clarifying questions.                                       |
| **AI usage (if allowed)** | You use it for speed but read, question, and test everything it produces.                                              |

---

## Part 2: The interview playbook (memorise this)

### 2.1 First 10 minutes on any codebase

```
1. README / package.json scripts     → how do I run, test, lint?
2. Run it + run the tests            → what is already broken? (failing tests = free hints)
3. Folder map (tree -L 2)            → where do routes, services, models, components live?
4. Trace ONE request end to end      → route → middleware → handler → service → DB → response → UI
5. Read the schema / models          → the data model explains most of the app
6. git log --oneline | head          → recent changes are where bugs hide
```

Say it out loud: _"Before changing anything I want to get it running and see what the tests say."_

### 2.2 The bug-fixing loop

1. **Reproduce.** Get a failing test, a curl command, or exact UI steps. _"I can see it: the
   second page repeats the last item of page one."_
2. **Localise.** Binary-search the request path. Use logs, breakpoints, `git bisect`, and Prisma query logs (`LOG_LEVEL=debug`).
3. **Explain the root cause** in one sentence _before_ you fix it.
4. **Fix minimally.** Smallest correct change, in the codebase's own style.
5. **Prove it.** Add a regression test, re-run everything.
6. **Look for siblings.** _"The same pattern exists in comments, so let me check there too."_ Interviewers love this.

### 2.3 Triage when there are many tasks

Do this order unless told otherwise: **(1) crashes, data loss, security** → **(2) wrong results** →
**(3) performance** → **(4) code style**. Say so: _"I'll fix the auth hole first because it
leaks data. The slow query is next."_

### 2.4 Talk tracks to rehearse

- _"My hypothesis is X. I'll confirm it by Y."_
- _"This works, but it's O(n) queries. With 1,000 tasks that's 1,000 round trips. I'll batch it."_
- _"I'm choosing to not refactor this now; I'd flag it as follow-up because it's out of scope."_
- _"Trade-off: caching this makes reads fast but adds staleness. Invalidation happens on write here."_

---

## Part 3: The codebase (TaskFlow)

A Trello/Jira-lite app: **users → projects (with roles) → tasks → comments → notifications**. It
deliberately includes the features production apps have, so every interview topic has a place to
practise.

| Concern        | Where it lives                                                                                       | Notes                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Env validation | `apps/api/src/config/env.ts`                                                                         | Zod; the process exits on bad config                                   |
| Auth           | `modules/auth/*`, `middleware/auth.ts`                                                               | JWT access cookie + opaque rotating refresh token with reuse detection |
| Authorisation  | `project.service.ts → assertMember`                                                                  | Returns 404 to non-members; a classic place to plant IDOR bugs         |
| Validation     | `packages/shared/src/schemas/*`                                                                      | Same Zod schemas on client and server                                  |
| Errors         | `middleware/error-handler.ts`, `utils/app-error.ts`                                                  | One error shape: `{ error: { code, message, details } }`               |
| Caching        | `lib/cache.ts`, used in `project.service.ts`                                                         | Cache-aside, fail-open, explicit invalidation                          |
| Rate limiting  | `middleware/rate-limit.ts`                                                                           | Redis store, so it works across instances                              |
| Pagination     | `utils/pagination.ts`                                                                                | Keyset/cursor pagination                                               |
| Concurrency    | `task.service.ts → update`                                                                           | Optimistic locking with `version`, 409 on conflict                     |
| Realtime       | `realtime/socket-server.ts`, `realtime/emitter.ts`, `web/src/features/tasks/use-project-realtime.ts` | Rooms per project/user, auth on handshake, Redis adapter               |
| Queues         | `queues/notification.queue.ts`, `workers/notification.worker.ts`, `src/worker.ts`                    | BullMQ, retries + backoff, dedupe via jobId, separate process          |
| Logging        | `lib/logger.ts`, `middleware/request-logger.ts`                                                      | pino, request IDs, secret redaction                                    |
| Lifecycle      | `src/index.ts`, `src/worker.ts`, `health.routes.ts`                                                  | Graceful shutdown, liveness vs readiness                               |
| Frontend data  | `web/src/lib/api.ts`, `features/*/api.ts`                                                            | React Query; single-flight token refresh                               |

**Run it:** see `README.md` → Quick start. Two seeded users: `alice@example.com` / `bob@example.com`, password `password123`.

**Extension points** (where new things go):

- New API domain → `apps/api/src/modules/<name>/{<name>.routes.ts, <name>.service.ts}` and mount it in `src/routes.ts`.
- New shared contract → `packages/shared/src/schemas/<name>.ts` and export it from `index.ts`.
- New background job → `queues/<name>.queue.ts` (producer) + `workers/<name>.worker.ts` (consumer), registered in `src/worker.ts`.
- New realtime event → add it to `ServerToClientEvents` in `packages/shared/src/realtime.ts`, emit it with `emitToProject` / `emitToUser`, and listen in a hook (always `off` in cleanup).
- New page → `apps/web/src/app/(app)/<route>/page.tsx` + `features/<name>/`.

---

## Part 4: The 30-day plan

**Daily time: about 2 to 2.5 hours.** The same loop every day:

| Block     | Time         | What                                                                      |
| --------- | ------------ | ------------------------------------------------------------------------- |
| Warm-up   | 15 min       | Re-read the Part 2 playbook and today's checklist from Part 5             |
| Main task | 75 to 90 min | **Timeboxed.** Set a timer. Talk out loud (record yourself on mock days). |
| Review    | 20 min       | Compare with `tasks/day-XX/SOLUTION.md`. What did you miss, and why?      |
| Journal   | 5 min        | `journal/day-XX.md`: bugs found, time taken, patterns learned             |

**Tags:** 🐞 Bugs · ⚡ Performance · ✨ Feature · 📈 Scalability · 🧹 Code style and best practices

**Git workflow for task packs**

```bash
git checkout main && git pull        # clean baseline
# ask Claude for the pack → it lands on branch pack/day-XX with tasks/day-XX/TASK.md
git checkout pack/day-XX
# ...work, commit as you go...
git checkout main                    # back to clean code; the pack branch stays for reference
```

---

### Week 1: Foundations: navigation, debugging, testing

#### Day 1: Setup and orientation 🧹

- [ ] Start Docker Desktop. Run `git init && git add -A && git commit -m "baseline"`.
- [ ] Follow README Quick start. Log in as Alice and Bob in two browsers and watch a task move in realtime.
- [ ] Trace **one request end to end**: "change task status" from `task-panel.tsx` → `api.ts` → Next rewrite → `task.routes.ts` → `task.service.ts` → Prisma → emitter → socket → `use-project-realtime.ts`. Write the path in `journal/day-01.md`.
- [ ] Draw the architecture (browser, Next, API, worker, Postgres, Redis) on paper.
- [ ] Read every file in `apps/api/src` once. Note 3 things you'd do differently.
- **Done when:** you can explain to an imaginary interviewer how a notification gets from "Bob comments" to "Alice's bell turns red".

#### Day 2: Debugging toolkit 🐞

- [ ] Attach the VS Code debugger to the API (`tsx --inspect`) and to Next (server + browser). Hit a breakpoint in `task.service.ts`.
- [ ] Turn on `LOG_LEVEL=debug` and read the SQL Prisma generates for `GET /tasks`.
- [ ] Use `redis-cli MONITOR` to watch cache, rate-limit and BullMQ traffic.
- [ ] Practise `git bisect` on a toy history (make 6 commits, break something in commit 4).
- [ ] 🧰 **Ask Claude:** `Generate Day 2 task pack: 3 easy backend bugs`
- **Done when:** all 3 bugs are fixed, each with a one-line root-cause note.

#### Day 3: Tests as a debugging weapon 🐞 🧹

- [ ] Set up DB-backed integration tests: `npm run db:test:prepare -w @taskflow/api`, plus a test helper that truncates tables between tests.
- [ ] Write integration tests for the tasks API: create, list with filters, pagination (no duplicates across pages), 404 for non-members, 409 on a stale `version`.
- [ ] Rule for the rest of the month: **reproduce every bug with a failing test before fixing it.**
- **Done when:** about 10 integration tests run green in under 10 seconds.

#### Day 4: Backend bug patterns 🐞

- [ ] Study Part 5.1 (backend bug catalogue).
- [ ] 🧰 **Ask Claude:** `Generate Day 4 task pack: 5 backend bugs (async, validation, auth/IDOR, error handling, pagination)`
- [ ] Timebox: 75 minutes. Write a regression test for each one.
- **Done when:** all fixed, and you found at least one _sibling_ of a planted bug on your own.

#### Day 5: React / Next.js bug patterns 🐞

- [ ] Study Part 5.2 (frontend bug catalogue).
- [ ] 🧰 **Ask Claude:** `Generate Day 5 task pack: 5 frontend bugs (stale closure, effect deps, list keys, socket listener leak, hydration mismatch)`
- [ ] Use React DevTools (Profiler and "highlight updates") to confirm each fix.
- **Done when:** all fixed, and you can explain _why_ each bug happens in React's model.

#### Day 6: Clean code and refactoring 🧹

- [ ] 🧰 **Ask Claude:** `Generate Day 6 task pack: a smelly module to refactor`. Expect a god function, duplication, magic numbers, poor names, and mixed concerns.
- [ ] Refactor in **small, test-protected steps**. Commit after each step.
- [ ] Read the Part 5.5 review checklist and apply it to your own diff.
- **Done when:** behaviour is unchanged (tests are green) and the diff reads well commit by commit.

#### Day 7: Mock #1 (60 min, mixed) 🐞 ✨

- [ ] 🧰 **Ask Claude:** `Generate Day 7 mock interview: 60 minutes, 3 bugs + 1 small feature, don't tell me where the bugs are`
- [ ] Record your screen and voice. Follow the Part 2 playbook strictly.
- [ ] Watch 10 minutes of the recording. Where did you go silent? Where did you guess instead of verifying?
- **Done when:** your journal has a "what I'll do differently" list.

---

### Week 2: Performance and databases

#### Day 8: Measure first ⚡

- [ ] `SEED_TASKS=50000 npm run db:seed` for a big dataset.
- [ ] Load test with `npx autocannon -c 50 -d 20 http://localhost:4000/api/projects/<id>/tasks` (pass the cookie as a header). Record p50, p99 and requests/sec.
- [ ] CPU profile the API: `node --cpu-prof` or `npx clinic flame`. Open it in Chrome DevTools.
- [ ] Run `EXPLAIN ANALYZE` on the task list query in `psql`.
- **Done when:** `journal/day-08.md` has a baseline table you'll compare against all week.

#### Day 9: N+1 queries and over-fetching ⚡

- [ ] 🧰 **Ask Claude:** `Generate Day 9 task pack: N+1 and over-fetching performance problems`
- [ ] Count queries per request with `LOG_LEVEL=debug`. Fix them with `include`/`select`, batching (`where: { id: { in } }`), or a DataLoader-style pattern.
- **Done when:** query count per request is constant (not O(n)) and you have before/after numbers.

#### Day 10: Indexes, pagination, search ⚡ 📈

- [ ] 🧰 **Ask Claude:** `Generate Day 10 task pack: missing indexes and offset pagination at scale`
- [ ] Learn: composite index column order, covering indexes, why `OFFSET 40000` is slow, keyset pagination, `ILIKE '%x%'` vs `pg_trgm` GIN index.
- [ ] Add a Prisma migration for a trigram index on `Task.title` (raw SQL in the migration).
- **Done when:** `EXPLAIN` shows index scans and p99 is down by at least 5×.

#### Day 11: Caching done right ⚡ 🐞

- [ ] 🧰 **Ask Claude:** `Generate Day 11 task pack: caching bugs (stale data, missing invalidation, cache stampede)`
- [ ] Implement single-flight (request coalescing) in `getOrSet`, plus TTL jitter.
- [ ] Add an `ETag` / `304` response to one GET endpoint.
- [ ] Be able to explain cache-aside vs write-through vs write-behind, and what to do with cache keys on deploy.
- **Done when:** a test proves 100 concurrent cache misses produce **one** DB query.

#### Day 12: Frontend performance ⚡

- [ ] 🧰 **Ask Claude:** `Generate Day 12 task pack: slow React board (re-renders, huge list, heavy bundle)`
- [ ] Tools: React Profiler, `why-did-you-render` (optional), `@next/bundle-analyzer`, Lighthouse.
- [ ] Fixes to know: `memo`/`useMemo`/`useCallback` (only where measured), list virtualization (`@tanstack/react-virtual`), `next/dynamic`, debounced search, React Query `select` and `staleTime`, optimistic updates.
- **Done when:** the board with 5,000 tasks scrolls smoothly and commits are under 16 ms in the Profiler.

#### Day 13: Event loop and memory leaks ⚡ 🐞

- [ ] 🧰 **Ask Claude:** `Generate Day 13 task pack: event-loop blocking and memory leaks in the API`
- [ ] Topics: sync crypto or JSON on hot paths, unbounded in-memory Maps, listeners added per request, `setInterval` without cleanup, unclosed DB/Redis clients.
- [ ] Take two heap snapshots (`--inspect`) and diff them in DevTools to find the leak.
- **Done when:** memory stays flat under a 5-minute load test.

#### Day 14: Mock #2 (75 min, performance-focused) ⚡ 🐞

- [ ] 🧰 **Ask Claude:** `Generate Day 14 mock interview: 75 minutes, performance focused, with a vague user complaint as the only hint`
- [ ] Practise saying _"Let me measure first"_ and showing numbers.
- **Done when:** your journal compares this mock with Mock #1. Were you faster to the root cause?

---

### Week 3: Features, realtime, queues, consistency, security

#### Day 15: Feature: task labels (end to end) ✨

- [ ] 🧰 **Ask Claude:** `Generate Day 15 feature ticket: task labels` (ticket only; you write all the code)
- [ ] Work in this order: schema (many-to-many) → migration → shared Zod schema → service → routes → tests → UI → realtime event.
- [ ] Keep it reviewable: one commit per layer.
- **Done when:** labels can be created, assigned and filtered by, with tests, and nothing else in the app changed.

#### Day 16: Feature: search and filters with URL state ✨ ⚡

- [ ] Filters (status, assignee, label, text) stored in the URL (`useSearchParams`), so they are shareable and survive refresh.
- [ ] Debounce typing. Cancel stale requests (React Query does this when the query key changes; verify it).
- [ ] Infinite scroll with `useInfiniteQuery` + `nextCursor`.
- **Done when:** refresh keeps your filters, and fast typing never shows results for an old query.

#### Day 17: Realtime deep dive ✨ 📈

- [ ] Add **presence** ("Bob is viewing this project") and a **"typing…"** indicator on comments.
- [ ] Run **2 API instances** (ports 4000 and 4001) and confirm events cross instances via the Redis adapter.
- [ ] Think through: token expiry on long-lived sockets, re-joining rooms after reconnect, missed events while offline (refetch on reconnect), throttling high-frequency events.
- **Done when:** presence is correct across two instances and goes away when a tab closes.

#### Day 18: Queues and background jobs ✨ 📈

- [ ] Add a **daily digest email** job: a repeatable BullMQ job (cron) that fans out per-user jobs. Use a fake mailer that logs.
- [ ] Add **Bull Board** (`@bull-board/express`) at `/admin/queues`, behind auth.
- [ ] Make the worker **idempotent** (running a job twice must not send twice) and add a dead-letter path for jobs that exhaust retries.
- **Done when:** you kill the worker mid-job, restart it, and nothing is duplicated or lost.

#### Day 19: Concurrency and consistency 🐞 📈

- [ ] 🧰 **Ask Claude:** `Generate Day 19 task pack: race conditions (lost update, double submit, check-then-act, non-atomic counters)`
- [ ] Tools: DB transactions, unique constraints, conditional updates (`updateMany where version`), `SELECT … FOR UPDATE`, idempotency keys, Redis locks (and their limits).
- [ ] Implement the **transactional outbox** for notifications (write an `OutboxEvent` row in the same transaction; a poller enqueues it). This fixes the trade-off documented in `notification.queue.ts`.
- **Done when:** a test fires 20 concurrent requests and proves the invariant holds.

#### Day 20: Security review 🐞 🧹

- [ ] 🧰 **Ask Claude:** `Generate Day 20 task pack: security vulnerabilities (IDOR, mass assignment, XSS, missing rate limit, secret leak, open redirect)`
- [ ] Go through the Part 5.4 checklist. Also check `npm audit` and dependency hygiene.
- **Done when:** each vulnerability has a test proving it's closed.

#### Day 21: Mock #3 (90 min, feature-focused) ✨ 🧹

- [ ] 🧰 **Ask Claude:** `Generate Day 21 mock interview: 90 minutes, implement an activity log / audit trail feature with a hidden bug in the existing code`
- [ ] Ask clarifying questions _first_ (write them down), then plan, then code.
- **Done when:** the feature works, is tested, and you can describe your design choices in 2 minutes.

---

### Week 4: Scale, production readiness, interview simulation

#### Day 22: Designing for scale 📈

- [ ] Write an ADR (`docs/adr/001-scaling.md`): "TaskFlow at 1M users / 10k concurrent sockets". Cover stateless API, load balancer, Postgres connection pooling (PgBouncer, Prisma `connection_limit`), read replicas, Redis roles, worker autoscaling, CDN, and where the bottlenecks are.
- [ ] Find everything in the code that would break with 3 replicas (hint: anything in process memory).
- **Done when:** you can whiteboard this in 10 minutes and answer "what fails first?".

#### Day 23: Feature: file attachments ✨ 📈

- [ ] Add MinIO to `docker-compose.yml`. Upload with **presigned URLs** (the browser sends to S3 directly, not through the API).
- [ ] A queue job generates thumbnails and scans metadata. Validate type and size.
- **Done when:** a 50 MB upload never touches API memory.

#### Day 24: Observability and incident debugging 📈 🐞

- [ ] Add `prom-client` metrics at `/metrics` (request duration histogram, queue depth) and pass request IDs through to jobs.
- [ ] 🧰 **Ask Claude:** `Generate Day 24 incident drill: a production bug I must find from logs and metrics only`
- **Done when:** you found the bug from logs and metrics before opening the suspect code.

#### Day 25: Docker and CI 🧹 📈

- [ ] Multi-stage `Dockerfile` for the API and worker (small image, non-root user, `npm ci --omit=dev`, `prisma migrate deploy` on release).
- [ ] Dockerfile for web using Next `output: 'standalone'`.
- [ ] Full stack in `docker compose`. Push to GitHub and get `.github/workflows/ci.yml` green.
- **Done when:** `docker compose up` on a fresh machine gives a working app.

#### Day 26: Unfamiliar-codebase drill 🧹 🐞

- [ ] Clone a mid-size open-source Node/Next/Express repo you've never seen. Time yourself: get it running and explain its architecture in **20 minutes**.
- [ ] Pick a "good first issue" and fix it.
- [ ] Spend 30 minutes _reading_ a small FastAPI or Go service so other stacks don't throw you.
- **Done when:** your journal has your "first 20 minutes" checklist, refined from experience.

#### Day 27: Mock #4 (full simulation, 90 min) 🐞 ⚡ ✨ 📈

- [ ] 🧰 **Ask Claude:** `Generate Day 27 full mock: 3 bugs, 1 perf issue, 1 feature, then ask me 3 scaling questions at the end`
- [ ] Do it in a fresh clone with the README as your only orientation. Record it.
- **Done when:** you finished at least 70% and the recording shows continuous narration.

#### Day 28: Code review and AI-assisted round 🧹

- [ ] 🧰 **Ask Claude:** `Generate Day 28 PR review exercise: a realistic PR diff with 8 issues of mixed severity`. Review it as a senior engineer would, with comments ranked by severity.
- [ ] Do a 45-minute mini-mock **using an AI assistant**. Practise: give it precise context, review every line it writes, and say when you reject its suggestions and why.
- **Done when:** you caught at least 6 of the 8 issues, and caught the AI being wrong at least once.

#### Day 29: Weak-spot day

- [ ] Re-read all journals. List your 3 weakest areas.
- [ ] Redo the 2 packs you did worst on, _without_ looking at the solutions.
- [ ] 🧰 **Ask Claude:** `Generate a targeted task pack for my weak areas: <list them>`

#### Day 30: Final mock and rest

- [ ] 🧰 **Ask Claude:** `Generate Day 30 final mock: 75 minutes, surprise me`
- [ ] Prepare your interview-day kit (Part 6). Then stop. Rest matters.

---

## Part 5: Checklists (your cheat sheets)

### 5.1 Backend bug catalogue (Node / Express / Prisma)

- [ ] **Missing `await`**: a promise is returned unhandled, so errors are swallowed or the response goes out before the write finishes.
- [ ] **`forEach(async …)`**: doesn't wait. Use `for…of` or `Promise.all`.
- [ ] **Errors swallowed**: an empty `catch {}`, or `catch` that logs and returns 200.
- [ ] **Unvalidated input**: `req.body` used directly, numbers that arrive as strings from query params, missing `max` limits.
- [ ] **IDOR**: fetching a resource by id without checking that the user is allowed to see it (`where: { id }` instead of `where: { id, projectId }` plus a membership check).
- [ ] **Mass assignment**: `data: req.body` lets a user set `role`, `ownerId` or `version`.
- [ ] **Pagination**: off-by-one, unstable sort (no tiebreaker), using offset on a live feed (duplicates or skipped rows).
- [ ] **Timezones and dates**: `new Date('2024-01-01')` is UTC midnight; comparing ISO strings against `Date` objects.
- [ ] **Money as floats**: use integer cents or `Decimal`.
- [ ] **Check-then-act races**: `findFirst` then `create` instead of a unique constraint or upsert.
- [ ] **Missing transaction**: multi-step writes that can half-apply.
- [ ] **Wrong status codes**: 200 on error, 500 on validation errors, 403 vs 404 leaking existence.
- [ ] **Resource leaks**: a new `PrismaClient()` or Redis client per request, listeners added per request.
- [ ] **Cache not invalidated** on update or delete, or the wrong key invalidated.
- [ ] **Env/config**: a default secret in production, `CORS: *` with credentials.

### 5.2 Frontend bug catalogue (React / Next.js)

- [ ] **Stale closure**: a callback or interval captures an old state value. Fix with functional `setState` or a ref.
- [ ] **`useEffect` deps**: missing (stale data) or unstable (infinite loop: objects or functions created during render).
- [ ] **No cleanup**: socket listeners, intervals, subscriptions, or AbortController missing in the effect cleanup.
- [ ] **Race in fetches**: an old response overwrites a newer one. Fix with abort, an ignore flag, or React Query.
- [ ] **List keys**: using the index as key with reorderable or deletable lists means state attaches to the wrong item.
- [ ] **Derived state copied into `useState`**: it gets out of sync with props.
- [ ] **Mutating state** (`arr.push`, `obj.x = …`) means no re-render.
- [ ] **Hydration mismatch**: `Date.now()`, `Math.random()` or `window` during server render.
- [ ] **Server vs client components**: hooks in a server component, secrets leaked into a `'use client'` bundle, `NEXT_PUBLIC_` misuse.
- [ ] **Cache keys**: the React Query key doesn't include a filter, so it shows the wrong data.
- [ ] **Double submit**: the button isn't disabled while pending, or there's no idempotency.
- [ ] **XSS**: `dangerouslySetInnerHTML` with user content, or `href={userInput}` (`javascript:` URLs).

### 5.3 Performance checklist

| Layer    | Look for                                                                                        | Fix                                                                      |
| -------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| DB       | N+1, `SELECT *`, missing/wrong index, `OFFSET` deep pages, `LIKE '%x%'`                         | `include`/batching, `select`, composite index, keyset, trigram/full-text |
| API      | Sequential awaits that could run in parallel, sync CPU work, huge JSON payloads, no compression | `Promise.all`, worker threads or a queue, pagination, gzip at the proxy  |
| Cache    | Hot read path hitting the DB, stampede, unbounded memory cache                                  | Redis cache-aside, single-flight, LRU with a max size                    |
| Network  | Chatty client (10 requests per page), no HTTP caching                                           | Aggregate endpoints, ETag/Cache-Control                                  |
| React    | Re-rendering the whole tree, giant lists, heavy initial bundle                                  | Memoize at the right boundary, virtualization, code splitting            |
| Realtime | Broadcasting to everyone, high-frequency events                                                 | Rooms, throttle/debounce, send diffs not full objects                    |

**Always:** measure → change one thing → measure again → state the numbers.

### 5.4 Security checklist

AuthN on every route · AuthZ on every resource (ownership/membership) · validate and limit all input ·
no mass assignment · parameterised queries only (watch for `$queryRawUnsafe`) · output encoding (no raw
HTML) · httpOnly + Secure + SameSite cookies · CSRF thinking for cookie auth · rate limits on auth and
expensive endpoints · no secrets in code, logs or client bundles · safe redirects · security headers
(helmet) · dependency audit · least-privilege DB user.

### 5.5 Code review checklist (use on your own diffs too)

1. Is it **correct**, including edge cases (empty, null, huge, concurrent, unauthorised)?
2. Is it **secure**?
3. Is it **tested**? Would the test fail without the fix?
4. Does it **match the codebase's conventions** (naming, structure, error handling)?
5. Is the diff **minimal**? No drive-by refactors mixed with fixes.
6. Names that say _what_ and _why_, no magic numbers, and functions that do one thing.
7. Performance: any new query inside a loop? Any unbounded list?
8. Observability: is the failure path logged with context?

### 5.6 Scalability talking points (tie each one to TaskFlow)

- **Stateless API**: sessions are in cookies/JWT and shared state is in Redis/Postgres, so any replica can serve any request.
- **WebSockets at scale**: the Redis adapter fans out across replicas. Websocket-only transport means no sticky sessions are needed. Remember the per-node connection limits.
- **Queues**: move slow or unreliable work (email, notifications, thumbnails) out of the request path. Scale workers separately. Use retries with backoff, idempotency and dead-letter queues.
- **DB**: indexes first, then caching, then read replicas, then partitioning/sharding. Use connection pooling (PgBouncer) once you have many replicas.
- **Consistency**: optimistic locking (`version`), unique constraints, transactions, the outbox pattern, at-least-once delivery plus idempotent consumers.
- **Rate limiting**: centralised (Redis) so the limit holds across replicas. Per user and per IP.
- **Failure modes**: what happens when Redis or the DB is down? (The cache fails open, notifications are best-effort, and readiness returns 503.)

---

## Part 6: Interview-day kit

- [ ] Ask the recruiter: language/stack, IDE or browser, AI allowed?, bugs vs features, how long.
- [ ] Environment ready: Node LTS, Docker, Git, your editor with TS/ESLint/Prettier, REST client (curl/HTTPie/Bruno), DB client.
- [ ] Have Parts 2 and 5 open in your head (or on paper if allowed).
- [ ] Opening line: _"I'll start by getting it running and running the tests, then I'll tell you what I see."_
- [ ] Every 10 minutes: summarise where you are and what's next.
- [ ] If stuck for more than 5 minutes: say what you've ruled out and ask for a nudge. That counts as a positive signal, not a failure.
- [ ] Final 5 minutes: _"Here's what I fixed, here's what I'd do next and why."_

---

## Appendix: How to ask Claude for practice material

Run Claude Code in this folder and use prompts like the ones in each day. What you'll get:

- A branch `pack/day-XX` with the changes applied (bugs injected, slow code, or a new ticket).
- `tasks/day-XX/TASK.md`: interview-style tickets (symptoms only, no locations), a timebox, and acceptance criteria.
- `tasks/day-XX/SOLUTION.md`: root causes, fixes, and what an interviewer would want to hear. **Don't open it until your timer ends.**

Other useful prompts:

- `Review my diff on pack/day-09 like a strict interviewer`
- `Act as the interviewer: ask me 3 follow-up scaling questions about what I just built`
- `Give me a hint for ticket 2 of day 13 without revealing the answer`
- `Make the Day 4 pack harder: same patterns, better hidden`
