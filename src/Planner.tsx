import { useMemo, useState } from "react";
import { ExpandIcon } from "./chrome";
import { dayHasImportant, dayShowsMark, monthHasImportant, useStore } from "./store";
import { TaskEditor } from "./TaskEditor";
import type { Draft, PlannerView } from "./types";
import {
  MONTHS,
  WEEKDAYS,
  addDays,
  iso,
  monthCells,
  parseISO,
  prettyDate,
  startOfWeek,
  weekDays,
} from "./time";

const VIEWS: { id: PlannerView; label: string }[] = [
  { id: "week", label: "неделя" },
  { id: "month", label: "месяц" },
  { id: "year", label: "год" },
];

export function Planner() {
  const {
    tasks,
    plannerView,
    plannerCursor,
    setPlannerView,
    setPlannerCursor,
    setSelectedDate,
    saveTask,
    startTask,
    toggleImportant,
    deleteTask,
    focus,
    setFocus,
    mutedDays,
    muteDay,
  } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const cursor = parseISO(plannerCursor);
  const days = weekDays(plannerCursor);

  const shift = (n: number) => {
    if (plannerView === "week") setPlannerCursor(addDays(startOfWeek(plannerCursor), n * 7));
    if (plannerView === "month") {
      const d = parseISO(plannerCursor);
      d.setMonth(d.getMonth() + n);
      setPlannerCursor(iso(d));
    }
    if (plannerView === "year") {
      const d = parseISO(plannerCursor);
      d.setFullYear(d.getFullYear() + n);
      setPlannerCursor(iso(d));
    }
  };

  const cells = useMemo(
    () => monthCells(cursor.getFullYear(), cursor.getMonth()),
    [plannerCursor],
  );

  const plannedOn = (date: string) =>
    tasks.filter((t) => t.date === date && t.status === "planned");

  return (
    <section className={`panel planner ${focus === "planner" ? "is-solo" : ""}`} data-panel="planner">
      <header className="panel-head">
        <div>
          <p className="kicker">план</p>
          <h2>
            {plannerView === "year"
              ? cursor.getFullYear()
              : plannerView === "month"
                ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
                : prettyDate(days[0]) + " — " + prettyDate(days[6])}
          </h2>
        </div>
        <div className="head-actions">
          <button className="ghost sm" onClick={() => shift(-1)}>
            ‹
          </button>
          <button className="ghost sm" onClick={() => shift(1)}>
            ›
          </button>
          <label className="select-wrap">
            <select
              value={plannerView}
              onChange={(e) => setPlannerView(e.target.value as PlannerView)}
            >
              {VIEWS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-btn"
            title="На весь экран"
            onClick={() => setFocus(focus === "planner" ? "all" : "planner")}
          >
            <ExpandIcon />
          </button>
        </div>
      </header>

      {plannerView === "week" && (
        <div className="plan-week">
          {days.map((d, i) => (
            <div
              key={d}
              className={`plan-day ${dayShowsMark(tasks, d, mutedDays) ? "open" : ""} ${dayHasImportant(tasks, d) ? "marked" : ""}`}
              onClick={() =>
                setDraft({
                  title: "",
                  date: d,
                  priority: "in",
                  status: "planned",
                  important: false,
                })
              }
              onContextMenu={(e) => {
                e.preventDefault();
                muteDay(d);
              }}
            >
              <div className="plan-day-head">
                <span>{WEEKDAYS[i]}</span>
                <b>{parseISO(d).getDate()}</b>
                {dayHasImportant(tasks, d) && <i className="halo-dot" />}
              </div>
              <div className="plan-list">
                {plannedOn(d).map((t) => (
                  <div
                    key={t.id}
                    className={`plan-item prio-${t.priority}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`circle ${t.important ? "on" : ""}`}
                      title="Важный кружок"
                      onClick={() => toggleImportant(t.id)}
                    />
                    <span>{t.title}</span>
                    <button className="sm-link" onClick={() => startTask(t.id)}>
                      начать
                    </button>
                    <button className="tiny" onClick={() => deleteTask(t.id)}>
                      ×
                    </button>
                  </div>
                ))}
                {plannedOn(d).length === 0 && <span className="ghost-add">запланировать</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {plannerView === "month" && (
        <div className="plan-month">
          <div className="rail-weekdays month-wd">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="month-grid">
            {cells.map((d) => {
              const key = iso(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button
                  key={key + inMonth}
                  className={[
                    "month-cell",
                    inMonth ? "" : "dim",
                    dayShowsMark(tasks, key, mutedDays) ? "open" : "",
                    dayHasImportant(tasks, key) ? "marked" : "",
                  ].join(" ")}
                  onClick={() => {
                    setSelectedDate(key);
                    setDraft({
                      title: "",
                      date: key,
                      priority: "in",
                      status: "planned",
                      important: false,
                    });
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    muteDay(key);
                  }}
                >
                  <span>{d.getDate()}</span>
                  {dayHasImportant(tasks, key) && <i className="halo-dot" />}
                  <em>
                    {tasks.filter((t) => t.date === key && t.status !== "done").length || ""}
                  </em>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {plannerView === "year" && (
        <div className="plan-year">
          {MONTHS.map((name, i) => {
            const marked = monthHasImportant(tasks, cursor.getFullYear(), i);
            const d = iso(new Date(cursor.getFullYear(), i, 1));
            return (
              <button
                key={name}
                className={`year-cell ${marked ? "marked" : ""}`}
                title={name}
                onClick={() => {
                  setPlannerCursor(d);
                  setPlannerView("month");
                }}
              >
                {marked && <i className="halo-dot" />}
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {draft && (
        <TaskEditor
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={(next) => {
            saveTask({ ...next, status: "planned" });
            setDraft(null);
          }}
        />
      )}
    </section>
  );
}
