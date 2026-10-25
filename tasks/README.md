# Task packs

One folder per practice day. Every pack has the same two files:

| File          | What it is                                                                            | When to open                   |
| ------------- | ------------------------------------------------------------------------------------- | ------------------------------ |
| `TASK.md`     | Tickets written like an interview prompt: symptoms, timebox, acceptance criteria      | At the start of the session    |
| `SOLUTION.md` | Root causes, model answers, file:line references, and what an interviewer listens for | **Only after your timer ends** |

Some packs also have a `fixtures/` folder (sample requests, load-test scripts, seed tweaks).

## Where packs live

- **Days with no code changes** (orientation, design, review-only days such as Day 1, 22, 26) live
  on `main`.
- **Days that inject bugs, slow code or a ticket** live on branch `pack/day-XX`, so `main` always
  stays clean. See Guide.md → "Git workflow for task packs".

```
tasks/
  README.md          ← this index
  _template/         ← skeleton every new pack is generated from
    TASK.md
    SOLUTION.md
  day-01/            ← on main
    TASK.md
    SOLUTION.md
  day-02/            ← on branch pack/day-02
    ...
```

## Index

| Day | Topic                          | Tags  | Location    | Status |
| --- | ------------------------------ | ----- | ----------- | ------ |
| 01  | Setup and orientation          | 🧹    | `main`      | ready  |
| 02  | Debugging toolkit, 3 easy bugs | 🐞    | pack/day-02 | —      |
| 03  | Tests as a debugging weapon    | 🐞 🧹 | pack/day-03 | —      |
| 04  | Backend bug patterns           | 🐞    | pack/day-04 | —      |
| 05  | React / Next.js bug patterns   | 🐞    | pack/day-05 | —      |
| 06  | Clean code and refactoring     | 🧹    | pack/day-06 | —      |
| 07  | Mock #1                        | 🐞 ✨ | pack/day-07 | —      |

Rows for later days are added as the packs are generated. Ask for one with the prompt from that
day in Guide.md, e.g. `Generate Day 4 task pack: 5 backend bugs`.

## Ticket conventions (all packs)

- Ticket IDs are `D<day>-T<n>` (e.g. `D04-T3`) so journal entries and commits can reference them.
- Each ticket has: **Report** (what a user or teammate says), **Timebox**, **Acceptance criteria**.
  Tickets never say which file the problem is in.
- Commit messages on a pack branch: `D04-T3: <what you fixed>`.
- After the session, fill in `journal/day-XX.md` from `journal/TEMPLATE.md`.
