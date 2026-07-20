"use client";

import { usePlanner } from "@/store/planner";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { TaskDrawer } from "./TaskDrawer";
import { AddTaskDialog } from "./AddTaskDialog";
import { InviteDialog } from "./InviteDialog";
import { LoginScreen } from "./LoginScreen";
import { Toast } from "@/components/Toast";
import {
  ActivityView,
  CalendarView,
  DashboardView,
  KanbanView,
  ListView,
  MatrixView,
  TeamView,
  TimelineView,
} from "./DesktopViews";
import type { ViewKey } from "@/lib/types";
import type { ComponentType } from "react";

const VIEWS: Partial<Record<ViewKey, ComponentType>> = {
  dashboard: DashboardView,
  list: ListView,
  kanban: KanbanView,
  calendar: CalendarView,
  timeline: TimelineView,
  matrix: MatrixView,
  team: TeamView,
  activity: ActivityView,
};

export function DesktopShell() {
  const { state } = usePlanner();
  const View = VIEWS[state.view] ?? DashboardView;
  const showTagBar = state.view === "list" || state.view === "kanban" || state.view === "matrix";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-body)", color: "var(--color-text)", background: "var(--color-bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", minWidth: 0 }}>
        <Header />
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", minHeight: 0 }}>
          {showTagBar && <FilterBar />}
          <View />
        </div>
      </main>

      {state.selId && <TaskDrawer />}
      <AddTaskDialog />
      <InviteDialog />
      {!state.authed && <LoginScreen />}
      <Toast />
    </div>
  );
}
