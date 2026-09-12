export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO() {
  return iso(new Date());
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number) {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function startOfWeek(s: string) {
  const d = parseISO(s);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return iso(d);
}

export function weekDays(s: string) {
  const start = startOfWeek(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function minutesToLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function snapMin(min: number) {
  const clamped = Math.max(0, Math.min(24 * 60 - 30, min));
  return Math.round(clamped / 30) * 30;
}

export function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
export const WEEKDAYS_FULL = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
];
export const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function prettyDate(s: string) {
  const d = parseISO(s);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function carryLabel(date: string) {
  const today = todayISO();
  if (date === addDays(today, -1)) return "вчера";
  if (date === addDays(today, -2)) return "позавчера";
  return prettyDate(date);
}

export function prettyMonth(s: string) {
  const d = parseISO(s);
  const month = MONTHS_GEN[d.getMonth()];
  const year = new Date().getFullYear();
  return d.getFullYear() === year ? month : `${month} ${d.getFullYear()}`;
}

export function uid() {
  return crypto.randomUUID();
}

export function formatClock(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatStamp(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
