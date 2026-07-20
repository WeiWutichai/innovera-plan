"use client";

import type { ComponentType } from "react";
import { usePlanner } from "@/store/planner";
import type { ViewKey } from "@/lib/types";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { MoreSheet } from "./MoreSheet";
import { MobileFilterBar } from "./MobileFilterBar";
import { Fab } from "./Fab";
import { TaskSheet } from "./TaskSheet";
import { AddSheet, InviteSheet } from "./AddSheet";
import { NotifSheet } from "./NotifSheet";
import { MobileLogin } from "./MobileLogin";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Toast } from "@/components/Toast";
import {
  MCalendar,
  MDashboard,
  MKanban,
  MList,
  MMatrix,
  MTeam,
  MTime,
  MTimeline,
} from "./MobileViews";

const VIEWS: Partial<Record<ViewKey, ComponentType>> = {
  dashboard: MDashboard,
  list: MList,
  kanban: MKanban,
  calendar: MCalendar,
  timeline: MTimeline,
  time: MTime,
  matrix: MMatrix,
  team: MTeam,
};

export function MobileShell() {
  const { state } = usePlanner();
  const View = VIEWS[state.view] ?? MDashboard;
  const showTagBar = state.view === "list" || state.view === "kanban" || state.view === "matrix";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--color-bg)", fontFamily: "var(--font-body)", color: "var(--color-text)", position: "relative", overflow: "hidden" }}>
      <MobileHeader />
      <main style={{ flex: 1, overflow: "auto", padding: "16px 16px 96px" }} className="no-scrollbar">
        {showTagBar && <MobileFilterBar />}
        <View />
      </main>
      <BottomNav />

      <Fab />
      <MoreSheet />
      <NotifSheet />
      {state.selId && <TaskSheet />}
      <AddSheet />
      <InviteSheet />
      <ChangePasswordDialog />
      {!state.authed && <MobileLogin />}
      <Toast />
    </div>
  );
}
