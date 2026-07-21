# INNOVERA PLAN — Work Planner (ระบบแผนและจัดการงาน)

[![CI](https://github.com/WeiWutichai/innovera-plan/actions/workflows/ci.yml/badge.svg)](https://github.com/WeiWutichai/innovera-plan/actions/workflows/ci.yml)

A bilingual (ไทย / English) project & task-management app, built with **Next.js (App Router) + TypeScript**. It is a faithful implementation of the Claude Design handoff in [`project/`](project/) — both the **desktop** (`Work Planner.dc.html`) and the **mobile** (`Work Planner Mobile.dc.html`) designs — on top of a real backend/API data layer.

> The original design prototypes and the Modernist design system live in [`project/`](project/) (the Claude Design handoff bundle) and are the source of truth for the look and behaviour.

## Getting started

```bash
cp .env.example .env   # then set AUTH_SECRET (e.g. `openssl rand -hex 32`)
npm install            # also runs `prisma generate`
npm run db:push        # create the SQLite schema (prisma/dev.db)
npm run db:seed        # load the seed data
npm run dev            # http://localhost:3000
```

Sign in with a seeded account — e.g. **`thanakorn@acme.co` / `password`** (all demo users share the password `password`).

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck
npm test           # vitest — unit + integration (spins up its own test DB)
npm run db:seed    # re-seed (wipes + reloads the demo data)
npm run db:studio  # browse the DB in Prisma Studio
```

## Tests

`npm test` runs [Vitest](https://vitest.dev): **unit** tests for the pure logic (dates, `quad`/`dueInfo`/`decorate`, selectors, i18n key-parity) and **integration** tests that exercise the Prisma-backed store, the auth logic (credentials, session-version revocation, change-password, invite/accept), and the route handlers' authz (admin-only, 401/403) against a throwaway SQLite DB (`prisma/test.db`, provisioned fresh in `tests/global-setup.ts`). ~56 tests.

The app is calibrated to a fixed "today" of **2026-07-12** so the seeded due dates, calendar and timeline read exactly as designed.

### Authentication

Real credential auth: bcrypt-hashed passwords, a signed (JWS/HS256) httpOnly session cookie via [jose](https://github.com/panva/jose), and Edge middleware (`src/proxy.ts`) that 401s every `/api/*` request without a valid session — so the backend is genuinely protected, not just the UI. The activity **actor** and the "me" highlight come from the verified session, never the request body, so whoever signs in becomes the current user. Set a strong `AUTH_SECRET` (≥16 chars) in production.

Tokens carry a `sessionVersion`, so **logout, password reset, and disabling an account revoke already-issued tokens immediately** (not only on expiry). Signed-in users can **change their own password** (revokes their other sessions but keeps the current one). User-management actions (roles, disable, invite, reset) are **admin-only**, enforced server-side.

Inviting a user creates a **one-time invite link** (`/accept-invite?token=…`, sha256-hashed + 7-day expiry). The invitee opens it, sets their own password, and is activated and signed in — so invited accounts have no shared/guessable password. Without email delivery the admin copies the link from the dialog shown after inviting.

## What's inside

Eight views, fully bilingual, backed by a REST-ish API:

| View | Desktop | Mobile |
| --- | :---: | :---: |
| Dashboard (KPIs · today's focus · project progress · upcoming) | ✓ | ✓ |
| List (grouped by due window) | ✓ | ✓ |
| Kanban board (drag-and-drop + prev/next) | ✓ | ✓ (h-scroll) |
| Calendar (July 2026) | ✓ | ✓ (+ day agenda) |
| Timeline / Gantt | ✓ | ✓ (stacked tracks) |
| Eisenhower matrix | ✓ | ✓ (stacked) |
| Team / users (roles, status, invite, reset) | ✓ | ✓ |
| Activity feed | ✓ (desktop only) | — |
| Time summary (7-day chart) | — | ✓ (mobile only) |

Plus: task detail drawer/sheet (assignee cycle, status, tags, time logging, subtasks, project info), add/edit task, invite user, overdue notifications, tag + assignee filters, TH/EN toggle, and a login screen.

Desktop and mobile are **separate shells** chosen by viewport width (breakpoint 900px) — both share one store, one data layer, and one i18n dictionary.

## Architecture

```
prisma/
  schema.prisma           data model (SQLite dev → Postgres prod)
  seed.ts                 seeds the DB from src/lib/seed.ts
src/
  app/
    layout.tsx            next/font (Archivo + Noto Sans Thai), PlannerProvider
    page.tsx              responsive shell switch (desktop vs mobile)
    modernist.css         the Modernist design system (ported from the handoff)
    globals.css           app chrome (scrollbars, sheet/drawer animations)
    api/                  backend route handlers
      bootstrap/          GET  full dataset
      tasks/              POST create · PATCH (action) · DELETE
      users/              POST invite · PATCH (action) · DELETE
  lib/
    types.ts              domain types + API input payloads
    seed.ts               seed data (ported from the prototype)
    dates.ts domain.ts    date helpers, quad()/dueInfo()/decorate()
    selectors.ts          pure view-model selectors for every view
    i18n.ts               merged TH/EN dictionary
    api.ts                typed client for /api
  server/
    db.ts                 Prisma client singleton
    store.ts              Prisma-backed repository (source of truth)
  store/
    planner.tsx           React context + reducer + async actions (optimistic + reconcile)
    hooks.ts              useCtx() — builds selector context from the store
    useIsMobile.ts        viewport hook
  components/
    ui.tsx forms.tsx      shared primitives + form bodies
    TaskDetailBody.tsx    shared task-detail body (drawer + sheet)
    desktop/  mobile/     the two shells and their views/overlays
```

### Data layer

The UI never talks to the database directly — it goes through `src/lib/api.ts` → `/api/*` route handlers → `src/server/store.ts` (a **Prisma-backed repository**). Every mutation returns the authoritative entity plus any activity-log entry, and the client applies an optimistic update then reconciles.

- **Dev** uses SQLite (`prisma/dev.db`). **Production**: change the `datasource` provider in `prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at Postgres — the models are portable (`stack` / `subs` / `tags` are stored as JSON strings). Then `npx prisma migrate deploy` + `npm run db:seed`.
- The repository's method signatures and return DTOs are the API contract; the entire client is written against them, so the storage engine can change underneath without touching anything above `store.ts`.

## Docker

The image is self-contained — it bakes a seeded SQLite database in as a template and restores it into a data volume on first boot, so it runs with zero setup:

```bash
echo "AUTH_SECRET=$(openssl rand -hex 32)" > .env   # required — the app fails closed without it
docker compose up --build                            # → http://localhost:3000  (data persists in a volume)
# or without compose:
docker build -t innovera-plan .
docker run -p 3000:3000 -e AUTH_SECRET=$(openssl rand -hex 32) innovera-plan
```

Built as a Next.js **standalone** server (multi-stage build, non-root user, ~640 MB). To run against **Postgres** instead of the baked SQLite, switch the datasource provider in `prisma/schema.prisma`, point `DATABASE_URL` at Postgres, and run `prisma migrate deploy` + `npm run db:seed` in your pipeline — see the commented service in `docker-compose.yml`.

## Design system

Styling follows **Modernist** (see `project/_ds/…/readme.md`): flat, Archivo type, a single red accent (`#ec3013`), zero corner radius, 2px dividers, flush-left labels. All colour/space/shadow values come from CSS tokens in `src/app/modernist.css`. The only change from the original stylesheet is the font tokens, which add a Thai fallback (`Noto Sans Thai`) since Archivo has no Thai glyphs.

## Notes

- The mobile "Time summary" week log is demo state (client-side aggregate).
- The `project/` folder is the original Claude Design export, kept for reference.
