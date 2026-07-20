// ─────────────────────────────────────────────────────────────────────────
// Bilingual (TH / EN) dictionary. Merges the desktop prototype's strings
// (nav / sub / table headers …) with the mobile prototype's (tab / title /
// time-summary …) and adds keys for strings the prototypes hard-coded, so the
// Next.js port reaches full TH/EN parity.
// ─────────────────────────────────────────────────────────────────────────

import type { Lang, QuadKey, Role, Status, UserStatus, ViewKey } from "./types";

type MatrixText = { t: string; tag: string; hint: string };

export interface Dict {
  mon: string[];
  weekdays: string[];
  status: Record<Status, string>;
  role: Record<Role, string>;
  ustatus: Record<UserStatus, string>;

  q_do: string;
  q_plan: string;
  q_quick: string;
  q_later: string;
  matrix: Record<QuadKey, MatrixText>;

  d_done: string;
  d_none: string;
  d_today: string;
  d_tomorrow: string;
  d_over: (n: number) => string;
  d_in: (n: number) => string;

  b_overdue: string;
  b_today: string;
  b_week: string;
  b_later: string;
  b_none: string;
  b_done: string;

  ut_accept: string;
  ut_disable: string;
  ut_enable: string;

  s_open: string;
  s_over: string;
  s_due7: string;
  s_done: string;

  nav: Record<ViewKey, string>;
  sub: Record<ViewKey, string>;
  tab: Record<ViewKey, string>;
  title: Record<ViewKey, string>;

  all_tasks: string;
  projects_h: string;
  upcoming_h: string;

  th_task: string;
  th_project: string;
  th_priority: string;
  th_due: string;
  th_member: string;
  th_role: string;
  th_status: string;
  th_assigned: string;

  filter_tag: string;
  filter_assignee: string;
  clear_filters: string;
  clear: string;

  legend_done: string;
  legend_left: string;
  legend_today: string;
  matrix_axis: string;
  matrix_empty: string;

  today_full: string;
  brand_sub: string;
  members_pre: string;
  members_post: string;

  focus_today: string;
  proj_progress: string;
  no_focus: string;
  overdue_title: string;
  unit_task: string;
  deliver: string;
  done_of: string;

  assign_to: string;
  unassigned: string;
  change: string;
  status_h: string;
  detail: string;
  time_used: string;
  subtasks: string;
  proj_info: string;
  arch_h: string;
  notes_h: string;
  tags_h: string;

  status_prev: string;
  status_next: string;
  log_15: string;
  log_60: string;
  log_120: string;
  cal_empty: string;

  add_task: string;
  add_task_new: string;
  f_title: string;
  f_project: string;
  f_due: string;
  f_priority: string;
  urgent: string;
  important: string;
  cancel: string;
  save: string;
  edit: string;
  del: string;

  invite: string;
  invite_new: string;
  f_name: string;
  f_email: string;
  f_role: string;
  send_invite: string;
  reset_pw: string;

  // time-summary (mobile)
  time_7d: string;
  time_by_proj: string;
  unit_note: string;
  total_week: string;
  avg_day: string;
  top_day: string;
  time_tip: string;

  ph_task: string;
  ph_name: string;

  lg_title: string;
  lg_sub: string;
  lg_email: string;
  lg_pass: string;
  lg_signin: string;
  lg_tagline: string;
  lg_error: string;
  logout: string;

  cp_title: string;
  cp_current: string;
  cp_new: string;
  cp_confirm: string;
  cp_submit: string;
  cp_success: string;
  cp_err_current: string;
  cp_err_short: string;
  cp_err_mismatch: string;

  activity_h: string;
  activity_sub: string;
}

const TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const th: Dict = {
  mon: TH_MON,
  weekdays: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
  status: { Backlog: "ค้างไว้", "To Do": "รอทำ", "In Progress": "กำลังทำ", Review: "รีวิว", Done: "เสร็จ" },
  role: { admin: "แอดมิน", member: "สมาชิก", viewer: "ผู้ชม" },
  ustatus: { active: "ใช้งาน", invited: "รอตอบรับ", disabled: "ปิดใช้งาน" },

  q_do: "ทำเลย",
  q_plan: "วางแผน",
  q_quick: "รีบเคลียร์",
  q_later: "ไว้ทีหลัง",
  matrix: {
    do: { t: "ทำก่อนเลย", tag: "ด่วน + สำคัญ", hint: "จัดการทันที" },
    plan: { t: "วางแผนทำ", tag: "สำคัญ ไม่ด่วน", hint: "กำหนดเวลาไว้ล่วงหน้า" },
    quick: { t: "รีบเคลียร์", tag: "ด่วน ไม่สำคัญ", hint: "ทำให้เสร็จเร็วๆ หรือมอบหมาย" },
    later: { t: "ไว้ทีหลัง", tag: "ไม่ด่วน ไม่สำคัญ", hint: "พิจารณาตัดทิ้งหรือเลื่อน" },
  },

  d_done: "เสร็จ",
  d_none: "ไม่มีกำหนด",
  d_today: "วันนี้",
  d_tomorrow: "พรุ่งนี้",
  d_over: (n) => "เกิน " + n + " วัน",
  d_in: (n) => "อีก " + n + " วัน",

  b_overdue: "เกินกำหนด",
  b_today: "วันนี้",
  b_week: "สัปดาห์นี้",
  b_later: "ภายหลัง",
  b_none: "ไม่มีกำหนด",
  b_done: "เสร็จแล้ว",

  ut_accept: "ยอมรับ",
  ut_disable: "ปิดใช้",
  ut_enable: "เปิดใช้",

  s_open: "งานที่ต้องทำ",
  s_over: "เกินกำหนด",
  s_due7: "ครบกำหนดใน 7 วัน",
  s_done: "เสร็จแล้ว",

  nav: {
    dashboard: "ภาพรวม",
    list: "รายการงาน",
    kanban: "บอร์ด",
    calendar: "ปฏิทิน",
    timeline: "ไทม์ไลน์",
    matrix: "จัดลำดับ",
    team: "ทีม / ผู้ใช้",
    activity: "บันทึกกิจกรรม",
    time: "สรุปเวลา",
  },
  sub: {
    dashboard: "สรุปงานและความคืบหน้าทั้งหมด",
    list: "จัดกลุ่มตามช่วงเวลาที่ต้องเสร็จ",
    kanban: "ติดตามสถานะแต่ละงาน",
    calendar: "กรกฎาคม 2026 — ตามวันครบกำหนด",
    timeline: "งานระยะยาวและกำหนดส่ง",
    matrix: "Eisenhower Matrix — ด่วน × สำคัญ",
    team: "จัดการสมาชิกและสิทธิ์",
    activity: "กิจกรรมล่าสุดทั้งหมด",
    time: "สรุปเวลาที่ใช้ไป",
  },
  tab: {
    dashboard: "ภาพรวม",
    list: "งาน",
    kanban: "บอร์ด",
    calendar: "ปฏิทิน",
    timeline: "เส้นเวลา",
    time: "เวลา",
    matrix: "ลำดับ",
    team: "ทีม",
    activity: "กิจกรรม",
  },
  title: {
    dashboard: "ภาพรวม",
    list: "รายการงาน",
    kanban: "บอร์ดงาน",
    calendar: "ปฏิทิน",
    timeline: "เส้นเวลา",
    time: "สรุปเวลา",
    matrix: "จัดลำดับ",
    team: "ทีม / ผู้ใช้",
    activity: "บันทึกกิจกรรม",
  },

  all_tasks: "งานทั้งหมด",
  projects_h: "โปรเจกต์",
  upcoming_h: "ใกล้ครบกำหนด",

  th_task: "งาน",
  th_project: "โปรเจกต์",
  th_priority: "ความสำคัญ",
  th_due: "กำหนดส่ง",
  th_member: "สมาชิก",
  th_role: "บทบาท",
  th_status: "สถานะ",
  th_assigned: "งานที่รับผิดชอบ",

  filter_tag: "แท็ก",
  filter_assignee: "ผู้รับผิดชอบ",
  clear_filters: "ล้างตัวกรอง",
  clear: "ล้าง",

  legend_done: "เสร็จแล้ว",
  legend_left: "คงเหลือ",
  legend_today: "วันนี้",
  matrix_axis: "แกนนอน = ความด่วน · แกนตั้ง = ความสำคัญ · Eisenhower Matrix",
  matrix_empty: "— ไม่มีงาน —",

  today_full: "อาทิตย์ 12 ก.ค. 2026",
  brand_sub: "Work Planner",
  members_pre: "สมาชิกทั้งหมด ",
  members_post: " คน",

  focus_today: "โฟกัสวันนี้",
  proj_progress: "ความคืบหน้าโปรเจกต์",
  no_focus: "ไม่มีงานด่วนวันนี้ 🎯",
  overdue_title: "งานเกินกำหนด",
  unit_task: " งาน",
  deliver: "ส่ง",
  done_of: " งานเสร็จ",

  assign_to: "มอบหมายให้",
  unassigned: "ยังไม่มอบหมาย",
  change: "เปลี่ยน",
  status_h: "สถานะ",
  detail: "รายละเอียด",
  time_used: "เวลาที่ใช้",
  subtasks: "งานย่อย",
  proj_info: "ข้อมูลโปรเจกต์",
  arch_h: "โครงสร้าง / สถาปัตยกรรม",
  notes_h: "โน้ตทางเทคนิค",
  tags_h: "ป้ายกำกับ",

  status_prev: "ย้อนสถานะ",
  status_next: "เลื่อนสถานะ",
  log_15: "+15น",
  log_60: "+1ชม",
  log_120: "+2ชม",
  cal_empty: "ไม่มีงานครบกำหนดวันนี้",

  add_task: "เพิ่มงาน",
  add_task_new: "เพิ่มงานใหม่",
  f_title: "ชื่องาน",
  f_project: "โปรเจกต์",
  f_due: "กำหนดส่ง",
  f_priority: "ความสำคัญ",
  urgent: "ด่วน",
  important: "สำคัญ",
  cancel: "ยกเลิก",
  save: "บันทึก",
  edit: "แก้ไข",
  del: "ลบ",

  invite: "เชิญผู้ใช้",
  invite_new: "เชิญผู้ใช้ใหม่",
  f_name: "ชื่อ",
  f_email: "อีเมล",
  f_role: "บทบาท",
  send_invite: "ส่งคำเชิญ",
  reset_pw: "รีเซ็ตรหัสผ่าน",

  time_7d: "ชั่วโมงที่ลง 7 วันล่าสุด",
  time_by_proj: "เวลาสะสมตามโปรเจกต์",
  unit_note: "หน่วย: ชั่วโมง · แดง = วันนี้",
  total_week: "รวมสัปดาห์นี้",
  avg_day: "เฉลี่ย/วัน",
  top_day: "วันที่ลงมากสุด",
  time_tip: "💡 บันทึกเวลาได้จากหน้ารายละเอียดงาน (+15น / +1ชม / +2ชม) — เวลาที่ลงจะเพิ่มเข้าวันนี้",

  ph_task: "เช่น เขียน API /orders",
  ph_name: "เช่น สมชาย ใจดี",

  lg_title: "เข้าสู่ระบบ",
  lg_sub: "จัดการงานและโปรเจกต์ของคุณ",
  lg_email: "อีเมล",
  lg_pass: "รหัสผ่าน",
  lg_signin: "เข้าสู่ระบบ",
  lg_tagline: "วางแผน · ติดตาม · ส่งมอบ",
  lg_error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  logout: "ออกจากระบบ",

  cp_title: "เปลี่ยนรหัสผ่าน",
  cp_current: "รหัสผ่านปัจจุบัน",
  cp_new: "รหัสผ่านใหม่",
  cp_confirm: "ยืนยันรหัสผ่านใหม่",
  cp_submit: "เปลี่ยนรหัสผ่าน",
  cp_success: "เปลี่ยนรหัสผ่านเรียบร้อย",
  cp_err_current: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
  cp_err_short: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
  cp_err_mismatch: "รหัสผ่านใหม่ไม่ตรงกัน",

  activity_h: "บันทึกกิจกรรม",
  activity_sub: "กิจกรรมล่าสุดทั้งหมด",
};

export const en: Dict = {
  mon: EN_MON,
  weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  status: { Backlog: "Backlog", "To Do": "To Do", "In Progress": "In Progress", Review: "Review", Done: "Done" },
  role: { admin: "Admin", member: "Member", viewer: "Viewer" },
  ustatus: { active: "Active", invited: "Invited", disabled: "Disabled" },

  q_do: "Do now",
  q_plan: "Plan",
  q_quick: "Quick",
  q_later: "Later",
  matrix: {
    do: { t: "Do first", tag: "Urgent + Important", hint: "Handle immediately" },
    plan: { t: "Schedule", tag: "Important, not urgent", hint: "Plan ahead" },
    quick: { t: "Clear fast", tag: "Urgent, not important", hint: "Finish quickly or delegate" },
    later: { t: "Later", tag: "Not urgent/important", hint: "Consider dropping or deferring" },
  },

  d_done: "Done",
  d_none: "No date",
  d_today: "Today",
  d_tomorrow: "Tomorrow",
  d_over: (n) => n + "d overdue",
  d_in: (n) => "in " + n + "d",

  b_overdue: "Overdue",
  b_today: "Today",
  b_week: "This week",
  b_later: "Later",
  b_none: "No date",
  b_done: "Completed",

  ut_accept: "Accept",
  ut_disable: "Disable",
  ut_enable: "Enable",

  s_open: "Open tasks",
  s_over: "Overdue",
  s_due7: "Due in 7 days",
  s_done: "Completed",

  nav: {
    dashboard: "Overview",
    list: "Tasks",
    kanban: "Board",
    calendar: "Calendar",
    timeline: "Timeline",
    matrix: "Prioritize",
    team: "Team / Users",
    activity: "Activity",
    time: "Time summary",
  },
  sub: {
    dashboard: "Summary of tasks and progress",
    list: "Grouped by due window",
    kanban: "Track status of each task",
    calendar: "July 2026 — by due date",
    timeline: "Long-running work and deadlines",
    matrix: "Eisenhower Matrix — urgent × important",
    team: "Manage members and access",
    activity: "Recent activity across the workspace",
    time: "Time spent, summarised",
  },
  tab: {
    dashboard: "Home",
    list: "Tasks",
    kanban: "Board",
    calendar: "Calendar",
    timeline: "Timeline",
    time: "Time",
    matrix: "Priority",
    team: "Team",
    activity: "Activity",
  },
  title: {
    dashboard: "Overview",
    list: "Tasks",
    kanban: "Board",
    calendar: "Calendar",
    timeline: "Timeline",
    time: "Time summary",
    matrix: "Prioritize",
    team: "Team / Users",
    activity: "Activity",
  },

  all_tasks: "All tasks",
  projects_h: "Projects",
  upcoming_h: "Upcoming",

  th_task: "Task",
  th_project: "Project",
  th_priority: "Priority",
  th_due: "Due",
  th_member: "Member",
  th_role: "Role",
  th_status: "Status",
  th_assigned: "Assigned",

  filter_tag: "Tags",
  filter_assignee: "Assignee",
  clear_filters: "Clear filters",
  clear: "Clear",

  legend_done: "Done",
  legend_left: "Remaining",
  legend_today: "Today",
  matrix_axis: "Horizontal = urgency · Vertical = importance · Eisenhower Matrix",
  matrix_empty: "— No tasks —",

  today_full: "Sun 12 Jul 2026",
  brand_sub: "Work Planner",
  members_pre: "",
  members_post: " members",

  focus_today: "Today’s focus",
  proj_progress: "Project progress",
  no_focus: "Nothing urgent today 🎯",
  overdue_title: "Overdue tasks",
  unit_task: " tasks",
  deliver: "due",
  done_of: " done",

  assign_to: "Assigned to",
  unassigned: "Unassigned",
  change: "Change",
  status_h: "Status",
  detail: "Details",
  time_used: "Time spent",
  subtasks: "Subtasks",
  proj_info: "Project info",
  arch_h: "Structure / Architecture",
  notes_h: "Technical notes",
  tags_h: "Tags",

  status_prev: "Previous status",
  status_next: "Next status",
  log_15: "+15m",
  log_60: "+1h",
  log_120: "+2h",
  cal_empty: "No tasks due this day",

  add_task: "Add task",
  add_task_new: "New task",
  f_title: "Task name",
  f_project: "Project",
  f_due: "Due date",
  f_priority: "Priority",
  urgent: "Urgent",
  important: "Important",
  cancel: "Cancel",
  save: "Save",
  edit: "Edit",
  del: "Delete",

  invite: "Invite user",
  invite_new: "Invite new user",
  f_name: "Name",
  f_email: "Email",
  f_role: "Role",
  send_invite: "Send invite",
  reset_pw: "Reset password",

  time_7d: "Hours logged – last 7 days",
  time_by_proj: "Time by project",
  unit_note: "Unit: hours · red = today",
  total_week: "This week",
  avg_day: "Avg / day",
  top_day: "Most active",
  time_tip: "💡 Log time from the task detail (+15m / +1h / +2h) — it adds to today",

  ph_task: "e.g. write API /orders",
  ph_name: "e.g. John Doe",

  lg_title: "Sign in",
  lg_sub: "Manage your work and projects",
  lg_email: "Email",
  lg_pass: "Password",
  lg_signin: "Sign in",
  lg_tagline: "Plan · Track · Ship",
  lg_error: "Invalid email or password",
  logout: "Sign out",

  cp_title: "Change password",
  cp_current: "Current password",
  cp_new: "New password",
  cp_confirm: "Confirm new password",
  cp_submit: "Change password",
  cp_success: "Password changed",
  cp_err_current: "Current password is incorrect",
  cp_err_short: "New password must be at least 8 characters",
  cp_err_mismatch: "New passwords don't match",

  activity_h: "Activity",
  activity_sub: "Recent activity across the workspace",
};

export const DICTS: Record<Lang, Dict> = { th, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}
