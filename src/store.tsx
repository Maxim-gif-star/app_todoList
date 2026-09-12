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
import type { ThemeId } from "./themes";
import { nowMinutes, snapMin, todayISO, uid } from "./time";

const KEY = "noctis-board-v1";

export interface State {
  tasks: Task[];
  selectedDate: string;
  followToday: boolean;
  plannerView: PlannerView;
  plannerCursor: string;
  focus: PanelFocus;
  mutedDays: string[];
  pinnedDays: string[];
  muteStamp: string;
  theme: ThemeId;
  plannerFollow: boolean;
}

interface Store extends State {
  setSelectedDate: (date: string) => void;
  goToday: () => void;
  setPlannerView: (view: PlannerView) => void;
  setPlannerCursor: (date: string) => void;
  setFocus: (focus: PanelFocus) => void;
  setTheme: (theme: ThemeId) => void;
  muteDay: (date: string) => void;
  saveTask: (draft: Draft) => void;
  completeTask: (id: string) => void;
  startTask: (id: string) => void;
  restoreTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, date: string, startMin?: number) => void;
  toggleImportant: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

function pinActiveTime(task: Task): Task {
  if (task.status !== "active" || task.startMin != null) return task;
  const startMin = snapMin(9 * 60);
  return { ...task, startMin, endMin: startMin + 60 };
}

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
        tasks: seed().map(pinActiveTime),
        selectedDate: today,
        followToday: true,
        plannerView: "week",
        plannerCursor: today,
        focus: "all",
        mutedDays: [],
        pinnedDays: [],
        muteStamp: today,
        theme: "violet",
        plannerFollow: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<State>;
    const muteStamp = parsed.muteStamp === today ? parsed.muteStamp : today;
    const mutedDays = parsed.muteStamp === today ? parsed.mutedDays ?? [] : [];
    const pinnedDays = parsed.muteStamp === today ? parsed.pinnedDays ?? [] : [];
    const plannerFollow = parsed.plannerFollow !== false;
    return {
      tasks: (parsed.tasks ?? seed()).map(pinActiveTime),
      selectedDate: parsed.followToday === false ? parsed.selectedDate ?? today : today,
      followToday: parsed.followToday !== false,
      plannerView: parsed.plannerView ?? "week",
      plannerCursor: plannerFollow ? today : parsed.plannerCursor ?? today,
      plannerFollow,
      focus: "all",
      mutedDays,
      pinnedDays,
      muteStamp,
      theme: "violet",
    };
  } catch {
    return {
      tasks: seed().map(pinActiveTime),
      selectedDate: today,
      followToday: true,
      plannerView: "week",
      plannerCursor: today,
      plannerFollow: true,
      focus: "all",
      mutedDays: [],
      pinnedDays: [],
      muteStamp: today,
      theme: "violet",
    };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    const initial = load();
    document.documentElement.dataset.theme = "violet";
    return initial;
  });

  useEffect(() => {
    const persist = {
      tasks: state.tasks,
      selectedDate: state.selectedDate,
      followToday: state.followToday,
      plannerView: state.plannerView,
      plannerCursor: state.plannerCursor,
      plannerFollow: state.plannerFollow,
      mutedDays: state.mutedDays,
      pinnedDays: state.pinnedDays,
      muteStamp: state.muteStamp,
      theme: state.theme,
    };
    localStorage.setItem(KEY, JSON.stringify(persist));
    document.documentElement.dataset.theme = "violet";
  }, [state]);

  useEffect(() => {
    const tick = () => {
      const today = todayISO();
      setState((s) => {
        let next = s;
        if (s.muteStamp !== today) {
          next = { ...next, mutedDays: [], pinnedDays: [], muteStamp: today };
        }
        if (next.followToday && next.selectedDate !== today) {
          next = { ...next, selectedDate: today };
        }
        if (next.plannerFollow && next.plannerCursor !== today) {
          next = { ...next, plannerCursor: today };
        }
        return next === s ? s : next;
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
          plannerCursor: todayISO(),
          plannerFollow: true,
        })),
      setPlannerView: (plannerView) => setState((s) => ({ ...s, plannerView })),
      setPlannerCursor: (plannerCursor) =>
        setState((s) => ({ ...s, plannerCursor, plannerFollow: false })),
      setFocus: (focus) => setState((s) => ({ ...s, focus })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      muteDay: (date) =>
        setState((s) => {
          if (date < todayISO()) return s;
          const showing = dayShowsMark(s.tasks, date, s.mutedDays, s.pinnedDays);
          if (showing) {
            return {
              ...s,
              muteStamp: todayISO(),
              pinnedDays: s.pinnedDays.filter((d) => d !== date),
              mutedDays: s.mutedDays.includes(date) ? s.mutedDays : [...s.mutedDays, date],
            };
          }
          return {
            ...s,
            muteStamp: todayISO(),
            mutedDays: s.mutedDays.filter((d) => d !== date),
            pinnedDays: s.pinnedDays.includes(date) ? s.pinnedDays : [...s.pinnedDays, date],
          };
        }),
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
        setState((s) => {
          const startMin = snapMin(nowMinutes());
          return {
            ...s,
            selectedDate: todayISO(),
            followToday: true,
            plannerCursor: todayISO(),
            plannerFollow: true,
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: "active",
                    date: todayISO(),
                    startMin,
                    endMin: Math.min(24 * 60, startMin + 60),
                    startedAt: Date.now(),
                  }
                : t,
            ),
          };
        }),
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

export function dayShowsMark(
  tasks: Task[],
  date: string,
  mutedDays: string[],
  pinnedDays: string[] = [],
) {
  if (date < todayISO()) return false;
  if (mutedDays.includes(date)) return false;
  if (pinnedDays.includes(date)) return true;
  return dayHasOpen(tasks, date);
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
