import type { ViewKey } from "@/lib/types";

/** Mobile tab order + icons. First 4 are the primary bar; last 4 live in "More". */
export const MOBILE_TABS: { key: ViewKey; icon: string }[] = [
  { key: "dashboard", icon: "layout-dashboard" },
  { key: "list", icon: "list-checks" },
  { key: "kanban", icon: "columns-3" },
  { key: "calendar", icon: "calendar-days" },
  { key: "timeline", icon: "gantt-chart" },
  { key: "time", icon: "clock" },
  { key: "matrix", icon: "grid-2x2" },
  { key: "team", icon: "users" },
];

export const PRIMARY_TABS = MOBILE_TABS.slice(0, 4);
export const MORE_TABS = MOBILE_TABS.slice(4);
export const MORE_KEYS: ViewKey[] = MORE_TABS.map((t) => t.key);
