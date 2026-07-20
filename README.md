# INNOVERA PLAN — Work Planner (ระบบแผนและจัดการงาน)

A bilingual (ไทย / English) project & task-management app, built with **Next.js (App Router) + TypeScript**. It is a faithful implementation of the Claude Design handoff in [`project/`](project/) — both the **desktop** (`Work Planner.dc.html`) and the **mobile** (`Work Planner Mobile.dc.html`) designs — on top of a real backend/API data layer.

> The original design prototypes and the Modernist design system live in [`project/`](project/) (the Claude Design handoff bundle) and are the source of truth for the look and behaviour.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
npm run typecheck
```

Sign in with the pre-filled credentials (any value works — auth is mocked). The app is calibrated to a fixed "today" of **2026-07-12** so the seeded due dates, calendar and timeline read exactly as designed.

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
src/
  app/
    layout.tsx            next/font (Archivo + Noto Sans Thai), PlannerProvider
    page.tsx              responsive shell switch (desktop vs mobile)
    modernist.css         the Modernist design system (ported from the handoff)
    globals.css           app chrome (scrollbars, sheet/drawer animations)
    api/                  backend route handlers (the "backend" — swap for a real DB)
      bootstrap/          GET  full dataset
      tasks/              POST create · PATCH (action) · DELETE
      users/              POST invite · PATCH (action) · DELETE
  lib/
    types.ts              domain types
    seed.ts               seed data (ported from the prototype)
    dates.ts domain.ts    date helpers, quad()/dueInfo()/decorate()
    selectors.ts          pure view-model selectors for every view
    i18n.ts               merged TH/EN dictionary
    api.ts                typed client for /api
  server/
    store.ts              in-memory repository singleton (source of truth)
  store/
    planner.tsx           React context + reducer + async actions (optimistic + reconcile)
    hooks.ts              useCtx() — builds selector context from the store
    useIsMobile.ts        viewport hook
  components/
    ui.tsx forms.tsx      shared primitives + form bodies
    TaskDetailBody.tsx    shared task-detail body (drawer + sheet)
    desktop/  mobile/     the two shells and their views/overlays
```

### Data layer (backend-ready)

The UI never talks to the store directly — it goes through `src/lib/api.ts` → `/api/*` route handlers → `src/server/store.ts`. Today `store.ts` is an in-memory singleton seeded from `src/lib/seed.ts`; **to connect a real backend, reimplement `store.ts` against your database** and the API contract (and the entire client) stays unchanged. Mutations return the authoritative entity plus any activity-log entry, and the client applies optimistic updates then reconciles.

## Design system

Styling follows **Modernist** (see `project/_ds/…/readme.md`): flat, Archivo type, a single red accent (`#ec3013`), zero corner radius, 2px dividers, flush-left labels. All colour/space/shadow values come from CSS tokens in `src/app/modernist.css`. The only change from the original stylesheet is the font tokens, which add a Thai fallback (`Noto Sans Thai`) since Archivo has no Thai glyphs.

## Notes

- Auth, and the mobile "Time summary" week log, are mocked/demo state.
- The `project/` folder is the original Claude Design export, kept for reference.
