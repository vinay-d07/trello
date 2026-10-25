# Day 01: Setup and orientation 🧹

> **Total timebox:** 90 min · **Branch:** `main` (no code changes today) · **Solution:** `SOLUTION.md` (don't open until the timer ends)

## Context

> "Welcome. This is TaskFlow, our project-tracking app. Before we give you any tickets, get it
> running on your machine, then walk me through how it works. I'll ask you to trace a couple of
> flows and tell me what you'd change."

Real rounds give you 10 to 15 minutes for this. Today you get 90, because you'll reuse this map
for the next 29 days. Go slowly and write things down.

Before you start: read Guide.md Part 1 and Part 2 once.

## Tickets

### D01-T1: Get it running · 🧹 · ~20 min

**Report:** "New laptop. Get the full stack running and prove it works."

**Acceptance criteria**

- [ ] Docker Desktop is running and `docker compose ps` shows `postgres` and `redis` as healthy.
- [ ] A git baseline exists: one commit called `baseline` on `main`, and `git status` is clean.
- [ ] The DB is migrated and seeded.
- [ ] `npm run dev` shows three processes (`api`, `worker`, `web`) without errors.
- [ ] `http://localhost:4000/health/ready` returns `200` with both checks `true`.
- [ ] `npm run check` (lint + typecheck + tests) is green.
- [ ] You wrote down every setup problem you hit and how you fixed it. Interviewers like hearing
      "here's what broke during setup and why".

---

### D01-T2: Realtime smoke test · ✨ · ~10 min

**Report:** "Product says two people can work on the same board live. Show me."

**Acceptance criteria**

- [ ] Alice is logged in in one browser and Bob in another (or an incognito window).
- [ ] Both have the **Launch v1** project open.
- [ ] Bob changes a task's status. Alice's board moves the card **without a refresh**.
- [ ] Bob comments on a task. Alice's bell 🔔 shows a red unread count **without a refresh**.
- [ ] Stop **only the worker** and repeat the comment. Write down what changes, then restart it
      and write down what happens next.

---

### D01-T3: Trace "change task status" end to end · 🧹 · ~25 min

**Report:** "Walk me through what happens, hop by hop, when Bob changes a task's status from the
side panel, until Alice's screen updates."

Copy this table into `journal/day-01.md` and fill in every row with `file:line` and one sentence.
Use search (`Ctrl+Shift+F`) and "Go to definition". Don't read files top to bottom.

| #   | Hop                                            | file:line | What happens here |
| --- | ---------------------------------------------- | --------- | ----------------- |
| 1   | Status `<Select>` change handler               |           |                   |
| 2   | React Query mutation                           |           |                   |
| 3   | Browser fetch wrapper                          |           |                   |
| 4   | Next.js proxy to the API                       |           |                   |
| 5   | Global Express middleware (list them in order) |           |                   |
| 6   | Rate limiter                                   |           |                   |
| 7   | Auth check                                     |           |                   |
| 8   | Router that matches `PATCH …/tasks/:taskId`    |           |                   |
| 9   | Input validation                               |           |                   |
| 10  | Service: authorisation                         |           |                   |
| 11  | Service: the write and the concurrency check   |           |                   |
| 12  | Realtime publish                               |           |                   |
| 13  | Socket server delivering to the right clients  |           |                   |
| 14  | Client listener that reacts to the event       |           |                   |
| 15  | What actually re-renders Alice's board         |           |                   |

**Answer these too**

1. How many SQL queries does one status change run? Guess first, then check by setting
   `LOG_LEVEL=debug` in `apps/api/.env` and restarting the API.
2. Why does the client send `version`? What does the user see if two people change the same task
   at the same time?
3. Bob's own tab: does it update because of the HTTP response, the socket event, or both? Is
   anything wasted?
4. Alice's tab gets the event. Does it use the task in the event payload? What does it do instead,
   and what does that cost with 50 people on the board?
5. A user who isn't a member of the project sends this exact PATCH with a valid task id. What
   status code do they get, and why that one?

---

### D01-T4: Trace a notification · 🧹 · ~15 min

**Report:** "Explain how a notification gets from 'Bob comments' to 'Alice's bell turns red'."

**Acceptance criteria**

- [ ] You can name every process the data passes through (there are more than two) and the
      transport between each pair (HTTP, Redis queue, Redis pub/sub, WebSocket).
- [ ] You can answer:
  1. Who gets notified when someone comments? If Alice comments on a task, does Bob always get
     notified?
  2. Which process writes the `Notification` row?
  3. What happens to the notification if the worker is down? If Redis is down?
  4. What stops the same notification being created twice if the API retries the enqueue?
  5. How does Alice's socket end up in the room the worker emits to? She never sent a "join".

---

### D01-T5: Architecture diagram · 📈 · ~10 min

**Report:** "Draw the system on the whiteboard."

**Acceptance criteria**

- [ ] On paper: Browser, Next.js (:3000), API (:4000), Worker, Postgres (:5432), Redis (:6379).
- [ ] Every arrow is labelled with its protocol and what flows over it.
- [ ] Redis is drawn with **each of its jobs** marked separately. There are at least five.
- [ ] One sentence under the diagram: which boxes can you run 3 copies of today, and which one
      breaks first?

---

### D01-T6: Read the API, then critique it · 🧹 · ~20 min

**Report:** "You've seen the code. What would you do differently?"

- [ ] Skim every file in `apps/api/src` (about 1,600 lines; don't go deep).
- [ ] Write **3 things you'd change**. For each one: the file, the problem, its impact at scale or
      under failure, and the fix. Rank them by severity.
- [ ] At least one of them must be about **what happens when something fails** (Redis, the
      worker, a crash halfway through).

---

## Done when

You can explain the notification flow **out loud in under 2 minutes, with no notes**. Record it
on your phone and listen back once.

## Wrap-up (5 min)

- [ ] `journal/day-01.md`: setup issues, both traces, diagram photo, your 3 critiques.
- [ ] Then open `SOLUTION.md` and compare.
