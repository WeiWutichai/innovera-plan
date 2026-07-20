"use client";

// ─────────────────────────────────────────────────────────────────────────
// Planner store — server data + UI state in one reducer, with async actions
// that call the /api backend and reconcile with its authoritative response.
// A single `usePlanner()` hook exposes state, the active dictionary, and every
// action the UI needs. Both the desktop and mobile shells consume this.
// ─────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { dict, type Dict } from "@/lib/i18n";
import {
  Activity,
  InviteForm,
  Lang,
  Role,
  Status,
  STATUS_ORDER,
  Task,
  TaskForm,
  User,
  UserStatus,
  ViewKey,
} from "@/lib/types";

interface State {
  loading: boolean;
  error: string | null;

  // server data
  projects: import("@/lib/types").Project[];
  tasks: Task[];
  users: User[];
  tags: import("@/lib/types").Tag[];
  activity: Activity[];

  // ui
  view: ViewKey;
  filter: string;
  selId: string | null;
  showAdd: boolean;
  editId: string | null;
  showInvite: boolean;
  lang: Lang;
  authed: boolean;
  tagFilter: string | null;
  assigneeFilter: string | null;
  showNotif: boolean;
  dragCol: Status | null;
  toast: string;
  calSel: string;
  showMore: boolean;
  weekLog: number[];
  form: TaskForm;
  invite: InviteForm;
}

function freshForm(filter: string, status: Status = "Backlog"): TaskForm {
  return {
    title: "",
    projectId: filter !== "all" ? filter : "p1",
    due: "",
    status,
    urgent: false,
    important: true,
    tags: [],
  };
}

const initialState: State = {
  loading: true,
  error: null,
  projects: [],
  tasks: [],
  users: [],
  tags: [],
  activity: [],
  view: "dashboard",
  filter: "all",
  selId: null,
  showAdd: false,
  editId: null,
  showInvite: false,
  lang: "th",
  authed: false,
  tagFilter: null,
  assigneeFilter: null,
  showNotif: false,
  dragCol: null,
  toast: "",
  calSel: "2026-07-12",
  showMore: false,
  weekLog: [6, 5.5, 7, 4.5, 6, 3, 2],
  form: freshForm("all"),
  invite: { name: "", email: "", role: "member" },
};

type Action =
  | { type: "HYDRATE"; data: Pick<State, "projects" | "tasks" | "users" | "tags" | "activity"> }
  | { type: "ERROR"; error: string }
  | { type: "SET_UI"; patch: Partial<State> }
  | { type: "SET_FORM"; patch: Partial<TaskForm> }
  | { type: "SET_INVITE"; patch: Partial<InviteForm> }
  | { type: "UPSERT_TASK"; task: Task }
  | { type: "PATCH_TASK"; id: string; patch: Partial<Task> }
  | { type: "REMOVE_TASK"; id: string }
  | { type: "UPSERT_TASKS"; tasks: Task[] }
  | { type: "UPSERT_USER"; user: User }
  | { type: "REMOVE_USER"; id: string }
  | { type: "PREPEND_ACTIVITY"; entry?: Activity }
  | { type: "SET_WEEKLOG"; weekLog: number[] };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.data, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
    case "SET_UI":
      return { ...state, ...action.patch };
    case "SET_FORM":
      return { ...state, form: { ...state.form, ...action.patch } };
    case "SET_INVITE":
      return { ...state, invite: { ...state.invite, ...action.patch } };
    case "UPSERT_TASK":
      return { ...state, tasks: upsert(state.tasks, action.task) };
    case "PATCH_TASK":
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };
    case "REMOVE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "UPSERT_TASKS": {
      let tasks = state.tasks;
      for (const t of action.tasks) tasks = upsert(tasks, t);
      return { ...state, tasks };
    }
    case "UPSERT_USER":
      return { ...state, users: upsert(state.users, action.user) };
    case "REMOVE_USER":
      return { ...state, users: state.users.filter((u) => u.id !== action.id) };
    case "PREPEND_ACTIVITY":
      return action.entry ? { ...state, activity: [action.entry, ...state.activity].slice(0, 60) } : state;
    case "SET_WEEKLOG":
      return { ...state, weekLog: action.weekLog };
    default:
      return state;
  }
}

export interface PlannerActions {
  reload: () => Promise<void>;
  // ui
  setView: (v: ViewKey) => void;
  setFilter: (id: string) => void;
  selectTask: (id: string) => void;
  closeTask: () => void;
  openAdd: (defaultStatus?: Status) => void;
  openEdit: (id: string) => void;
  closeAdd: () => void;
  openInvite: () => void;
  closeInvite: () => void;
  setLang: (l: Lang) => void;
  login: () => void;
  setTagFilter: (id: string | null) => void;
  setAssigneeFilter: (id: string | null) => void;
  clearFilters: () => void;
  toggleNotif: () => void;
  closeNotif: () => void;
  setDragCol: (s: Status | null) => void;
  setCalSel: (iso: string) => void;
  openMore: () => void;
  closeMore: () => void;
  setForm: (patch: Partial<TaskForm>) => void;
  setInvite: (patch: Partial<InviteForm>) => void;
  clearToast: () => void;
  // task mutations
  submitAdd: () => Promise<void>;
  setStatus: (id: string, status: Status) => Promise<void>;
  cycleStatus: (id: string, dir: number) => Promise<void>;
  toggleDone: (id: string, done: boolean) => Promise<void>;
  setAssignee: (id: string, userId: string) => Promise<void>;
  cycleAssignee: (id: string) => Promise<void>;
  logTime: (id: string, minutes: number) => Promise<void>;
  toggleSub: (id: string, index: number) => Promise<void>;
  toggleTag: (id: string, tagId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // user mutations
  submitInvite: () => Promise<void>;
  cycleRole: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, next: UserStatus) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

interface PlannerContextValue {
  state: State;
  L: Dict;
  actions: PlannerActions;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // keep a ref to the latest state for async actions that read it
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.bootstrap();
      dispatch({ type: "HYDRATE", data });
    } catch (e) {
      dispatch({ type: "ERROR", error: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // reconcile helper: replace task + prepend activity from a server response
  const reconcile = useCallback((res: { task?: Task; activity?: Activity }) => {
    if (res.task) dispatch({ type: "UPSERT_TASK", task: res.task });
    if (res.activity) dispatch({ type: "PREPEND_ACTIVITY", entry: res.activity });
  }, []);

  const rollback = useCallback(() => {
    load();
  }, [load]);

  const actions = useMemo<PlannerActions>(() => {
    const ui = (patch: Partial<State>) => dispatch({ type: "SET_UI", patch });

    return {
      reload: load,

      setView: (v) => ui({ view: v, selId: null, showNotif: false, showMore: false }),
      setFilter: (id) => ui({ filter: id }),
      selectTask: (id) => ui({ selId: id }),
      closeTask: () => ui({ selId: null }),
      openAdd: (defaultStatus: Status = "Backlog") =>
        ui({ showAdd: true, editId: null, form: freshForm(stateRef.current.filter, defaultStatus) }),
      openEdit: (id) => {
        const t = stateRef.current.tasks.find((x) => x.id === id);
        if (!t) return;
        ui({
          showAdd: true,
          editId: id,
          form: {
            title: t.title,
            projectId: t.p,
            due: t.due || "",
            status: t.status,
            urgent: t.urg,
            important: t.imp,
            tags: (t.tags || []).slice(),
          },
        });
      },
      closeAdd: () => ui({ showAdd: false, editId: null }),
      openInvite: () => ui({ showInvite: true }),
      closeInvite: () => ui({ showInvite: false }),
      setLang: (l) => ui({ lang: l }),
      login: () => ui({ authed: true }),
      setTagFilter: (id) => ui({ tagFilter: id }),
      setAssigneeFilter: (id) => ui({ assigneeFilter: id }),
      clearFilters: () => ui({ tagFilter: null, assigneeFilter: null }),
      toggleNotif: () => ui({ showNotif: !stateRef.current.showNotif }),
      closeNotif: () => ui({ showNotif: false }),
      setDragCol: (s) => ui({ dragCol: s }),
      setCalSel: (iso) => ui({ calSel: iso }),
      openMore: () => ui({ showMore: true }),
      closeMore: () => ui({ showMore: false }),
      setForm: (patch) => dispatch({ type: "SET_FORM", patch }),
      setInvite: (patch) => dispatch({ type: "SET_INVITE", patch }),
      clearToast: () => ui({ toast: "" }),

      submitAdd: async () => {
        const s = stateRef.current;
        const f = s.form;
        if (!f.title.trim()) return;
        const input = {
          title: f.title,
          projectId: f.projectId,
          due: f.due || null,
          status: f.status,
          urgent: f.urgent,
          important: f.important,
          tags: f.tags,
        };
        try {
          if (s.editId) {
            const res = await api.editTask(s.editId, input);
            reconcile(res);
            ui({ showAdd: false, editId: null });
          } else {
            const res = await api.createTask(input);
            reconcile(res);
            ui({ showAdd: false, form: freshForm(f.projectId), selId: res.task.id });
          }
        } catch {
          rollback();
        }
      },

      setStatus: async (id, status) => {
        dispatch({ type: "PATCH_TASK", id, patch: { status } });
        try {
          reconcile(await api.setStatus(id, status));
        } catch {
          rollback();
        }
      },
      cycleStatus: async (id, dir) => {
        const t = stateRef.current.tasks.find((x) => x.id === id);
        if (t) {
          let i = STATUS_ORDER.indexOf(t.status) + dir;
          i = Math.max(0, Math.min(STATUS_ORDER.length - 1, i));
          dispatch({ type: "PATCH_TASK", id, patch: { status: STATUS_ORDER[i] } });
        }
        try {
          reconcile(await api.cycleStatus(id, dir));
        } catch {
          rollback();
        }
      },
      toggleDone: async (id, done) => {
        const next: Status = done ? "To Do" : "Done";
        dispatch({ type: "PATCH_TASK", id, patch: { status: next } });
        try {
          reconcile(await api.setStatus(id, next));
        } catch {
          rollback();
        }
      },
      setAssignee: async (id, userId) => {
        dispatch({ type: "PATCH_TASK", id, patch: { assignee: userId } });
        try {
          reconcile(await api.setAssignee(id, userId));
        } catch {
          rollback();
        }
      },
      cycleAssignee: async (id) => {
        const s = stateRef.current;
        const t = s.tasks.find((x) => x.id === id);
        if (!t) return;
        const ids = s.users.map((u) => u.id);
        const next = ids[(ids.indexOf(t.assignee) + 1) % ids.length];
        dispatch({ type: "PATCH_TASK", id, patch: { assignee: next } });
        try {
          reconcile(await api.setAssignee(id, next));
        } catch {
          rollback();
        }
      },
      logTime: async (id, minutes) => {
        const s = stateRef.current;
        const t = s.tasks.find((x) => x.id === id);
        if (t) {
          dispatch({ type: "PATCH_TASK", id, patch: { spent: Math.round((t.spent + minutes / 60) * 100) / 100 } });
        }
        // weekLog is a client-side demo aggregate (today = last bar)
        const wl = s.weekLog.slice();
        wl[6] = Math.round((wl[6] + minutes / 60) * 100) / 100;
        dispatch({ type: "SET_WEEKLOG", weekLog: wl });
        try {
          reconcile(await api.logTime(id, minutes));
        } catch {
          rollback();
        }
      },
      toggleSub: async (id, index) => {
        const t = stateRef.current.tasks.find((x) => x.id === id);
        if (t) {
          dispatch({ type: "PATCH_TASK", id, patch: { subs: t.subs.map((x, i) => (i === index ? { ...x, d: !x.d } : x)) } });
        }
        try {
          reconcile(await api.toggleSub(id, index));
        } catch {
          rollback();
        }
      },
      toggleTag: async (id, tagId) => {
        const t = stateRef.current.tasks.find((x) => x.id === id);
        if (t) {
          const has = (t.tags || []).includes(tagId);
          dispatch({ type: "PATCH_TASK", id, patch: { tags: has ? t.tags.filter((x) => x !== tagId) : [...(t.tags || []), tagId] } });
        }
        try {
          reconcile(await api.toggleTag(id, tagId));
        } catch {
          rollback();
        }
      },
      deleteTask: async (id) => {
        dispatch({ type: "REMOVE_TASK", id });
        ui({ selId: null });
        try {
          const res = await api.deleteTask(id);
          dispatch({ type: "PREPEND_ACTIVITY", entry: res.activity });
        } catch {
          rollback();
        }
      },

      submitInvite: async () => {
        const iv = stateRef.current.invite;
        if (!iv.name.trim()) return;
        try {
          const res = await api.inviteUser(iv);
          dispatch({ type: "UPSERT_USER", user: res.user });
          dispatch({ type: "PREPEND_ACTIVITY", entry: res.activity });
          ui({ showInvite: false, invite: { name: "", email: "", role: "member" } });
        } catch {
          rollback();
        }
      },
      cycleRole: async (id) => {
        const u = stateRef.current.users.find((x) => x.id === id);
        if (!u) return;
        const order: Role[] = ["admin", "member", "viewer"];
        const next = order[(order.indexOf(u.role) + 1) % order.length];
        dispatch({ type: "UPSERT_USER", user: { ...u, role: next } });
        try {
          const res = await api.setRole(id, next);
          dispatch({ type: "UPSERT_USER", user: res.user });
          dispatch({ type: "PREPEND_ACTIVITY", entry: res.activity });
        } catch {
          rollback();
        }
      },
      toggleUserStatus: async (id, next) => {
        const u = stateRef.current.users.find((x) => x.id === id);
        if (u) dispatch({ type: "UPSERT_USER", user: { ...u, status: next } });
        try {
          const res = await api.setUserStatus(id, next);
          if (res.user) dispatch({ type: "UPSERT_USER", user: res.user });
        } catch {
          rollback();
        }
      },
      resetPassword: async (id) => {
        const s = stateRef.current;
        const u = s.users.find((x) => x.id === id);
        try {
          const res = await api.resetPassword(id);
          dispatch({ type: "PREPEND_ACTIVITY", entry: res.activity });
        } catch {
          rollback();
          return;
        }
        const msg =
          s.lang === "en"
            ? "Password reset link sent to " + (u ? u.email : "")
            : "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ " + (u ? u.email : "");
        ui({ toast: msg });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => ui({ toast: "" }), 2800);
      },
      removeUser: async (id) => {
        dispatch({ type: "REMOVE_USER", id });
        try {
          const res = await api.removeUser(id);
          if (res.reassigned?.length) dispatch({ type: "UPSERT_TASKS", tasks: res.reassigned });
        } catch {
          rollback();
        }
      },
    };
  }, [load, reconcile, rollback]);

  const value = useMemo<PlannerContextValue>(
    () => ({ state, L: dict(state.lang), actions }),
    [state, actions],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
