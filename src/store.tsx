import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Draft, PanelFocus, PlannerView, Task } from "./types";
import { todayISO, uid } from "./time";

const KEY = "noctis-board-v1";

export interface State {
  tasks: Task[];
  selectedDate: string;
  followToday: boolean;
  plannerView: PlannerView;
  plannerCursor: string;
  focus: PanelFocus;
}

interface Store extends State {
  setSelectedDate: (date: string) => void;
  goToday: () => void;
  setPlannerView: (view: PlannerView) => void;
  setPlannerCursor: (date: string) => void;
  setFocus: (focus: PanelFocus) => void;
  saveTask: (draft: Draft) => void;
  completeTask: (id: string) => void;
  startTask: (id: string) => void;
  restoreTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, date: string, startMin?: number) => void;
  toggleImportant: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

function seed(): Task[] {
  const d = todayISO();
  return [
    {
      id: uid(),
      title: "Собрать мысли на неделю",
      date: d,
      startMin: 9 * 60,
      endMin: 10 * 60,
      priority: "in",
      status: "active",
      important: true,
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Час хаоса — без плана",
      date: d,
      startMin: 22 * 60,
      endMin: 23 * 60,
      priority: "chaos",
      status: "active",
      important: false,
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Открыть Noctis и просто подышать",
      date: d,
      priority: "nn",
      status: "done",
      important: false,
      createdAt: Date.now() - 3600_000,
      completedAt: Date.now() - 60_000,
    },
    {
      id: uid(),
      title: "Большой кусок, который нельзя забыть",
      date: d,
      priority: "iu",
      status: "planned",
      important: true,
      createdAt: Date.now(),
    },
  ];
}

function load(): State {
  const today = todayISO();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        tasks: seed(),
        selectedDate: today,
        followToday: true,
        plannerView: "week",
        plannerCursor: today,
        focus: "all",
      };
    }
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      tasks: parsed.tasks ?? seed(),
      selectedDate: parsed.followToday === false ? parsed.selectedDate ?? today : today,
      followToday: parsed.followToday !== false,
      plannerView: parsed.plannerView ?? "week",
      plannerCursor: parsed.plannerCursor ?? today,
      focus: "all",
    };
  } catch {
    return {
      tasks: seed(),
      selectedDate: today,
      followToday: true,
      plannerView: "week",
      plannerCursor: today,
      focus: "all",
    };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => load());

  useEffect(() => {
    const persist = {
      tasks: state.tasks,
      selectedDate: state.selectedDate,
      followToday: state.followToday,
      plannerView: state.plannerView,
      plannerCursor: state.plannerCursor,
    };
    localStorage.setItem(KEY, JSON.stringify(persist));
  }, [state]);

  useEffect(() => {
    const tick = () => {
      const today = todayISO();
      setState((s) => {
        if (!s.followToday && s.selectedDate === today) return s;
        if (s.followToday && s.selectedDate !== today) {
          return { ...s, selectedDate: today };
        }
        return s;
      });
    };
    const id = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const api = useMemo<Store>(
    () => ({
      ...state,
      setSelectedDate: (date) =>
        setState((s) => ({
          ...s,
          selectedDate: date,
          followToday: date === todayISO(),
        })),
      goToday: () =>
        setState((s) => ({
          ...s,
          selectedDate: todayISO(),
          followToday: true,
        })),
      setPlannerView: (plannerView) => setState((s) => ({ ...s, plannerView })),
      setPlannerCursor: (plannerCursor) => setState((s) => ({ ...s, plannerCursor })),
      setFocus: (focus) => setState((s) => ({ ...s, focus })),
      saveTask: (draft) =>
        setState((s) => {
          if (draft.id) {
            return {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === draft.id
                  ? {
                      ...t,
                      title: draft.title.trim(),
                      date: draft.date,
                      startMin: draft.startMin,
                      endMin: draft.endMin,
                      priority: draft.priority,
                      status: draft.status,
                      important: draft.important,
                    }
                  : t,
              ),
            };
          }
          const task: Task = {
            id: uid(),
            title: draft.title.trim(),
            date: draft.date,
            startMin: draft.startMin,
            endMin: draft.endMin,
            priority: draft.priority,
            status: draft.status,
            important: draft.important,
            createdAt: Date.now(),
            startedAt: draft.status === "active" ? Date.now() : undefined,
          };
          return { ...s, tasks: [...s.tasks, task] };
        }),
      completeTask: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "done", completedAt: Date.now() }
              : t,
          ),
        })),
      startTask: (id) =>
        setState((s) => ({
          ...s,
          selectedDate: todayISO(),
          followToday: true,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "active",
                  date: todayISO(),
                  startMin: undefined,
                  endMin: undefined,
                  startedAt: Date.now(),
                }
              : t,
          ),
        })),
      restoreTask: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "active", completedAt: undefined }
              : t,
          ),
        })),
      deleteTask: (id) =>
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, date, startMin) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const dur =
              t.startMin != null && t.endMin != null
                ? t.endMin - t.startMin
                : 60;
            const nextStart = startMin;
            const nextEnd =
              nextStart != null ? Math.min(24 * 60, nextStart + Math.max(dur, 30)) : undefined;
            return { ...t, date, startMin: nextStart, endMin: nextEnd };
          }),
        })),
      toggleImportant: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, important: !t.important } : t,
          ),
        })),
    }),
    [state],
  );

  return createElement(Ctx.Provider, { value: api }, children);
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("store missing");
  return ctx;
}

export function dayHasOpen(tasks: Task[], date: string) {
  return tasks.some((t) => t.date === date && t.status !== "done");
}

export function dayHasImportant(tasks: Task[], date: string) {
  return tasks.some((t) => t.date === date && t.important && t.status !== "done");
}

export function monthHasImportant(tasks: Task[], year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return tasks.some(
    (t) => t.important && t.status !== "done" && t.date.startsWith(prefix),
  );
}
