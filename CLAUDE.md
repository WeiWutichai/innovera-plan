# CLAUDE.md

Guidance for Claude Code when working in this repository.

## ⚠️ กฎเหล็กอันดับ 1 — พัฒนาให้ตรงตาม Design เท่านั้น (Golden rule)

**ทุกการพัฒนาต้องยึดตาม Claude Design ต้นฉบับใน `project/` อย่างเคร่งครัด — ห้ามเพิ่ม ลด หรือออกแบบใหม่นอกเหนือจากดีไซน์**

- `project/Work Planner.dc.html` (desktop) และ `project/Work Planner Mobile.dc.html` (mobile) คือ **source of truth** ทั้งหน้าตาและพฤติกรรม (logic อยู่ในบล็อก `<script type="text/x-dc">`, markup ใช้ `sc-for` / `sc-if` / `{{ }}`).
- ก่อนแก้หรือเพิ่ม view / component ใดๆ **ต้องเปิดส่วนที่ตรงกันใน `.dc.html` แล้วทำให้ตรง** — โครงสร้าง, สี/tokens, ไอคอน (ชื่อ lucide), layout, ข้อความ, และการโต้ตอบทุกอย่าง.
- **ห้ามคิดฟีเจอร์ / องค์ประกอบ / สไตล์ใหม่เองที่ไม่มีในดีไซน์** — ถ้าดีไซน์ไม่มี อย่าใส่; ถ้าดีไซน์มี ต้องมีให้ครบ.
- ถ้าดีไซน์กำกวม หรือขัดกับความถูกต้องทางเทคนิค **ให้ถามผู้ใช้ก่อน** — อย่าเดาแล้วออกแบบเอง.
- ปรับได้เฉพาะสิ่งที่จำเป็นทางเทคนิคล้วนๆ เท่านั้น (เช่น ฟอนต์ไทย fallback, ไอคอน lucide ที่ถูก rename) และต้อง **เขียนคอมเมนต์กำกับเหตุผลไว้เสมอ**.
- หลังแก้ UI ให้เทียบกับดีไซน์อีกครั้ง (เปิด `.dc.html` เทียบ หรือเรียก agent `design-fidelity-reviewer`).

> **In English:** every change must match the Claude Design prototypes in `project/` exactly. Do **not** invent, add, remove, or redesign anything the design does not specify. When unsure, open the matching `.dc.html` section and mirror it — or ask the user. The only allowed deviations are strictly-technical necessities (e.g. the Thai font fallback, renamed lucide icons), each documented with a code comment.

## Project

**INNOVERA PLAN — Work Planner** (ระบบแผนและจัดการงาน) — a bilingual (ไทย/English) project & task-management app. It is a faithful implementation of a **Claude Design handoff** (in `project/`), covering both the desktop (`Work Planner.dc.html`) and mobile (`Work Planner Mobile.dc.html`) designs, built with **Next.js (App Router) + TypeScript** on a swappable backend/API data layer.

The maintainer (wei) communicates in **Thai** — reply in Thai.

## Commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build — run before declaring UI work done
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit — run after any .ts/.tsx change
npm run lint       # next lint
npm run db:push    # apply prisma/schema.prisma to the SQLite dev DB
npm run db:seed    # wipe + reload demo data (prisma/seed.ts)
npm run db:studio  # browse the DB
npm test           # vitest (unit + integration; uses its own prisma/test.db)
```

First-time setup: `npm install` (auto-runs `prisma generate`) → `npm run db:push` → `npm run db:seed`.

Verify changes with `npm run typecheck` + `npm test` + `npm run build`, and (when asked) by loading the app in a browser. Tests live in `tests/` (unit = pure logic; integration = store/auth/routes against a throwaway SQLite DB provisioned in `tests/global-setup.ts`); the shared seed logic is `src/server/seed-db.ts`.

## Architecture

```
prisma/           schema.prisma (SQLite dev → Postgres prod), seed.ts
src/
  app/            layout (next/font: Archivo + Noto Sans Thai), page (responsive shell switch),
                  modernist.css (design system), globals.css, api/ (route handlers, incl. api/auth/*)
  proxy.ts        Edge middleware — 401s every /api/* except /api/auth/* without a session
  lib/            types, seed, dates, domain (quad/dueInfo/decorate), selectors, i18n, api (client)
  server/         db.ts (Prisma singleton), store.ts (repository), auth.ts (bcrypt), session.ts (jose/JWS)
  store/          planner.tsx (context + reducer + async actions), hooks, useIsMobile, useLoginForm
  components/     ui, forms, TaskDetailBody (shared); desktop/ and mobile/ (the two shells)
```

Data flow (one direction): **UI → `store/planner.tsx` action → `lib/api.ts` → `app/api/**/route.ts` → `server/store.ts` → Prisma → DB**. View data comes from pure selectors: **view → `lib/selectors.ts` → `lib/domain.ts`**.

Desktop and mobile are **separate shells** chosen by viewport (breakpoint 900px in `store/useIsMobile.ts`). They share one store, one data layer, one dictionary. Desktop has an Activity view; mobile has a Time-summary view instead.

## Conventions — read before editing

- **`project/` is read-only.** It is the original Claude Design handoff and the source of truth for look + behaviour. Never edit it — implement under `src/`. A hook enforces this (see below). When changing a view, open the matching section of the `.dc.html` and match it.
- **Design tokens only.** Colours/spacing/shadows come from CSS variables (`var(--color-*)`, `var(--space-*)`, …) defined in `src/app/modernist.css`. Never hard-code a hex or a font name the tokens already carry. Modernist style = Archivo type, red `#ec3013` accent, **zero border-radius**, 2px dividers, flush-left labels.
- **All visible strings go through i18n.** Add a key to `src/lib/i18n.ts` (both `th` and `en`) and read it via `L.*`. Do not hard-code Thai/English text in a component.
- **Fixed clock.** The app is calibrated to `TODAY = 2026-07-12` (`src/lib/dates.ts`). The seeded due dates, calendar (July 2026), and timeline depend on it — don't change it casually.
- **Keep the storage engine swappable.** The UI must not import `src/server/store.ts` or `src/server/db.ts` directly — only through `src/lib/api.ts`. `store.ts` is a Prisma-backed repository; its method signatures + return DTOs are the contract. Prisma stays server-only (never import it in a `"use client"` file). To move to Postgres: switch the `datasource` provider in `prisma/schema.prisma` and point `DATABASE_URL` at Postgres.
- Mutations return the authoritative entity (+ any activity entry); the client applies an optimistic update then reconciles with the response.
- **Auth.** Every `/api/*` route is guarded by `src/proxy.ts` (valid session cookie required; `/api/auth/*` excluded). Route handlers derive the actor with `getSessionUserId(req)` and pass it to the repository — the actor/`me` come from the session, **never** the request body. `session.ts` is jose-only (Edge-safe, imported by the proxy); `auth.ts` (bcrypt) is Node-only — never import it from the proxy. Never return the password hash in a DTO (`toUser` omits it). `AUTH_SECRET` (≥16 chars) is required at runtime.

## Claude Code extensions in this repo

- **Skills** — installed under `.claude/skills/` from [thananon/9arm-skills](https://github.com/thananon/9arm-skills): `debug-mantra`, `post-mortem`, `scrutinize`, `qwen-agent`, `management-talk`, `qwenchance`. Claude auto-loads the relevant one by task (e.g. `scrutinize` before reviews, `debug-mantra` when a bug is reported, `qwenchance` on long/looping tasks). See `.claude/skills/README.md`. Note: `qwen-agent` needs an external `claude-9arm` gateway that is not configured here.
- **Agent** — `.claude/agents/design-fidelity-reviewer.md`: a read-only subagent that reviews changes for prototype fidelity + TS/Next correctness. Delegate to it after implementing a view or route.
- **Hook** — `.claude/settings.json` runs `.claude/hooks/guard-design-source.sh` on `Edit|Write|MultiEdit` and **blocks writes to `project/` and `.design-source/`** (reference material).
- **Loop** — for long/multi-step work use `/loop`, and the `qwenchance` skill for staying on-track (break loops, watch context, hand off before the window fills).
