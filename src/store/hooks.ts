"use client";

import { useMemo } from "react";
import { usePlanner } from "./planner";
import type { SelectCtx } from "@/lib/selectors";

/** Build the pure-selector context from the live store + active dictionary. */
export function useCtx(): SelectCtx {
  const { state, L } = usePlanner();
  const { projects, tasks, users, tags, lang, filter, tagFilter, assigneeFilter } = state;
  return useMemo(
    () => ({ projects, tasks, users, tags, L, lang, filter, tagFilter, assigneeFilter }),
    [projects, tasks, users, tags, L, lang, filter, tagFilter, assigneeFilter],
  );
}
