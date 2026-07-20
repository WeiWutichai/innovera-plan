// ─────────────────────────────────────────────────────────────────────────
// Seed data — ported verbatim from the Claude Design prototype.
// This is the initial dataset the in-memory repository loads on boot;
// swap the repository implementation for a real DB without touching this shape.
// ─────────────────────────────────────────────────────────────────────────

import type { Activity, Project, Tag, Task, User } from "./types";

export const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Payment Gateway v2",
    dot: "var(--color-accent)",
    start: "2026-05-01",
    due: "2026-09-30",
    stack: ["React 18", "TypeScript", "Node / Express", "PostgreSQL 15", "Stripe API", "Docker"],
    arch: "Microservice — API gateway + payment-service + webhook-worker แยกกัน คุยผ่าน REST/queue, deploy บน AWS ECS (Fargate) เบื้องหลัง ALB",
    repo: "git@github.com:acme/pay-gateway.git",
    notes: "ใช้ idempotency-key กันคิดเงินซ้ำ · เก็บ audit log ทุก transaction · webhook verify signature ก่อน process",
  },
  {
    id: "p2",
    name: "Loyalty Mobile App",
    dot: "var(--color-neutral-800)",
    start: "2026-06-15",
    due: "2026-10-31",
    stack: ["Flutter 3", "Dart", "Firebase Auth", "Firestore", "Cloud Functions", "Riverpod"],
    arch: "Clean architecture 3 ชั้น presentation / domain / data, state ด้วย Riverpod, ออฟไลน์-เฟิร์สต์ด้วย Firestore cache",
    repo: "git@github.com:acme/loyalty-app.git",
    notes: "points ledger เก็บเป็น append-only เพื่อ audit · sync แต้มผ่าน Cloud Function trigger",
  },
  {
    id: "p3",
    name: "Reporting Data Pipeline",
    dot: "var(--color-neutral-500)",
    start: "2026-04-01",
    due: "2026-08-15",
    stack: ["Python 3.12", "Apache Airflow", "dbt", "BigQuery", "Metabase"],
    arch: "ELT — ingest → staging → mart, orchestrate ด้วย Airflow schedule รายวัน 02:00, transform ด้วย dbt, dashboard บน Metabase",
    repo: "git@github.com:acme/data-pipeline.git",
    notes: "partition ตาราง mart ตามวันที่เพื่อลดค่า scan BigQuery · dbt test ทุก model ก่อน deploy",
  },
  {
    id: "p4",
    name: "CRM Migration",
    dot: "var(--color-accent-2-500)",
    start: "2026-07-01",
    due: "2026-12-15",
    stack: ["Next.js 14", "tRPC", "Prisma", "PostgreSQL", ".NET (legacy)"],
    arch: "Strangler-fig — reverse proxy ค่อยๆ ย้าย module จาก .NET เดิมมาที่ Next.js ทีละส่วน จนกว่าจะปิดของเก่าได้",
    repo: "git@github.com:acme/crm-next.git",
    notes: "proxy route ที่ยังไม่ย้ายให้วิ่งกลับ .NET · แชร์ session ผ่าน JWT ร่วมกันระหว่างสองระบบ",
  },
];

const SEED_TAG_MAP: Record<string, string[]> = {
  t1: ["infra", "feature"],
  t2: ["feature"],
  t3: ["test"],
  t4: ["bug"],
  t5: ["feature"],
  t6: ["feature"],
  t7: ["feature", "research"],
  t8: ["refactor", "feature"],
  t9: ["infra"],
  t10: ["bug", "infra"],
  t11: ["infra"],
  t12: ["infra", "feature"],
  t13: ["meeting"],
  t14: ["review"],
  t15: ["research"],
  t16: [],
};

const SEED_ASSIGNEE_MAP: Record<string, string> = {
  t1: "u1", t2: "u1", t3: "u2", t4: "u1", t5: "u3", t6: "u3", t7: "u2", t8: "u2",
  t9: "u1", t10: "u3", t11: "u1", t12: "u3", t13: "u1", t14: "u2", t15: "u1", t16: "u1",
};

type SeedTask = Omit<Task, "tags" | "assignee">;

const RAW_TASKS: SeedTask[] = [
  { id: "t1", p: "p1", title: "ออกแบบ schema ตาราง transaction", status: "Done", imp: true, urg: false, due: "2026-05-20", est: 6, spent: 7, desc: "", subs: [] },
  { id: "t2", p: "p1", title: "เชื่อม Stripe webhook + verify signature", status: "In Progress", imp: true, urg: true, due: "2026-07-13", est: 10, spent: 6, desc: "รับ event จาก Stripe แล้ว verify signature ก่อน process ต้องรองรับ retry และกันซ้ำด้วย idempotency", subs: [{ t: "รับ event endpoint", d: true }, { t: "verify signature", d: true }, { t: "idempotency handling", d: false }, { t: "retry queue", d: false }] },
  { id: "t3", p: "p1", title: "เขียน unit test payment-service", status: "To Do", imp: true, urg: false, due: "2026-07-24", est: 8, spent: 0, desc: "ครอบคลุม charge / refund / partial-refund และ edge case", subs: [] },
  { id: "t4", p: "p1", title: "แก้บั๊ก double-charge บน sandbox", status: "In Progress", imp: true, urg: true, due: "2026-07-11", est: 4, spent: 2, desc: "พบว่าเมื่อ network timeout ระบบ retry แล้วคิดเงินซ้ำ ต้องใช้ idempotency-key", subs: [] },
  { id: "t5", p: "p2", title: "ทำหน้า onboarding + login Firebase", status: "In Progress", imp: true, urg: true, due: "2026-07-15", est: 12, spent: 5, desc: "", subs: [{ t: "UI 3 หน้า onboarding", d: true }, { t: "Google / Apple sign-in", d: false }, { t: "จัดการ error state", d: false }] },
  { id: "t6", p: "p2", title: "ระบบสะสมแต้ม (points ledger)", status: "Backlog", imp: true, urg: false, due: "2026-08-05", est: 16, spent: 0, desc: "append-only ledger บน Firestore, คำนวณยอดคงเหลือแบบ realtime", subs: [] },
  { id: "t7", p: "p2", title: "ดีไซน์ push notification flow", status: "To Do", imp: false, urg: false, due: "2026-07-28", est: 5, spent: 0, desc: "", subs: [] },
  { id: "t8", p: "p3", title: "Migrate dbt models mart_sales", status: "Review", imp: true, urg: false, due: "2026-07-14", est: 6, spent: 5, desc: "ย้าย logic รายงานยอดขายจาก SQL เดิมมาเป็น dbt model + test", subs: [{ t: "staging model", d: true }, { t: "mart model", d: true }, { t: "dbt test", d: false }] },
  { id: "t9", p: "p3", title: "ตั้ง Airflow DAG รายวัน", status: "Done", imp: true, urg: false, due: "2026-06-30", est: 4, spent: 4, desc: "", subs: [] },
  { id: "t10", p: "p3", title: "แก้ query BigQuery ช้า (scan สูง)", status: "To Do", imp: false, urg: true, due: "2026-07-13", est: 3, spent: 0, desc: "partition + cluster ตารางเพื่อลด bytes scanned", subs: [] },
  { id: "t11", p: "p4", title: "Setup Next.js 14 + tRPC skeleton", status: "In Progress", imp: true, urg: false, due: "2026-07-18", est: 8, spent: 3, desc: "", subs: [{ t: "init repo + CI", d: true }, { t: "tRPC router base", d: false }, { t: "Prisma schema แรก", d: false }] },
  { id: "t12", p: "p4", title: "เขียน proxy strangler-fig", status: "Backlog", imp: true, urg: false, due: "2026-08-01", est: 20, spent: 0, desc: "reverse proxy ที่ route ไป .NET เดิมสำหรับ path ที่ยังไม่ย้าย", subs: [] },
  { id: "t13", p: "p4", title: "ประชุม kickoff กับทีม legacy", status: "To Do", imp: true, urg: true, due: "2026-07-12", est: 1, spent: 0, desc: "สรุปขอบเขต module ที่จะย้ายก่อน และ dependency ต่อกัน", subs: [] },
  { id: "t14", p: "p1", title: "รีวิว PR ของทีม", status: "To Do", imp: false, urg: true, due: "2026-07-12", est: 1, spent: 0, desc: "", subs: [] },
  { id: "t15", p: "p2", title: "เรียน course Kubernetes", status: "Backlog", imp: true, urg: false, due: null, est: 20, spent: 2, desc: "พัฒนาตัวเองสำหรับ deploy microservice", subs: [] },
  { id: "t16", p: "p4", title: "อัปเดต portfolio + resume", status: "Backlog", imp: false, urg: false, due: null, est: 4, spent: 0, desc: "", subs: [] },
];

export const SEED_TASKS: Task[] = RAW_TASKS.map((t) => ({
  ...t,
  tags: SEED_TAG_MAP[t.id] ?? [],
  assignee: SEED_ASSIGNEE_MAP[t.id] ?? "u1",
}));

export const SEED_TAGS: Tag[] = [
  { id: "bug", label: "บั๊ก" },
  { id: "feature", label: "ฟีเจอร์" },
  { id: "infra", label: "โครงสร้าง" },
  { id: "test", label: "เทสต์" },
  { id: "meeting", label: "ประชุม" },
  { id: "research", label: "ศึกษา" },
  { id: "refactor", label: "รีแฟกเตอร์" },
  { id: "review", label: "รีวิวโค้ด" },
];

export const SEED_USERS: User[] = [
  { id: "u1", name: "ธนกร ศ.", email: "thanakorn@acme.co", role: "admin", status: "active", me: true },
  { id: "u2", name: "ปรียา ว.", email: "preeya@acme.co", role: "member", status: "active" },
  { id: "u3", name: "วิศรุต ก.", email: "wisarut@acme.co", role: "member", status: "active" },
  { id: "u4", name: "มินตรา พ.", email: "mintra@acme.co", role: "viewer", status: "invited" },
];

/**
 * Seed activity, relative to the moment the repository initialises so the
 * "x minutes ago" labels read naturally on first load.
 */
export function seedActivity(now: number): Activity[] {
  return [
    { actor: "u1", type: "add", title: "ประชุม kickoff กับทีม legacy", ts: now - 5 * 60000 },
    { actor: "u2", type: "status", title: "Migrate dbt models mart_sales", status: "Review", ts: now - 42 * 60000 },
    { actor: "u1", type: "time", title: "เชื่อม Stripe webhook + verify signature", amount: "2h", ts: now - 3 * 3600000 },
    { actor: "u1", type: "assign", title: "ทำหน้า onboarding + login Firebase", name: "วิศรุต ก.", ts: now - 26 * 3600000 },
    { actor: "u1", type: "invite", name: "มินตรา พ.", ts: now - 2 * 24 * 3600000 },
  ];
}
