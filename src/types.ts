export type Priority = "iu" | "in" | "nu" | "nn" | "chaos";
export type Status = "planned" | "active" | "done";
export type PlannerView = "week" | "month" | "year";
export type PanelFocus = "all" | "board" | "planner" | "done";

export interface Task {
  id: string;
  title: string;
  date: string;
  startMin?: number;
  endMin?: number;
  priority: Priority;
  status: Status;
  important: boolean;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface Draft {
  id?: string;
  title: string;
  date: string;
  startMin?: number;
  endMin?: number;
  priority: Priority;
  status: Status;
  important: boolean;
}

export const PRIORITIES: { id: Priority; label: string; short: string }[] = [
  { id: "iu", label: "Важно и срочно", short: "срочно" },
  { id: "in", label: "Важно", short: "важно" },
  { id: "nu", label: "Срочно", short: "к сроку" },
  { id: "nn", label: "Спокойно", short: "потом" },
  { id: "chaos", label: "Часы хаоса", short: "хаос" },
];

export const HOUR_H = 52;
export const SNAP = 30;
