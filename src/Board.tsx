import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { ExpandIcon } from "./chrome";
import { dayHasOpen, useStore } from "./store";
import { TaskEditor } from "./TaskEditor";
import type { Draft, Task } from "./types";
import { HOUR_H } from "./types";
import {
  MONTHS,
  WEEKDAYS,
  iso,
  minutesToLabel,
  monthCells,
  nowMinutes,
  parseISO,
  prettyDate,
  snapMin,
  todayISO,
  weekDays,
} from "./time";

function TaskCard({
  task,
  compact,
  onEdit,
}: {
  task: Task;
  compact?: boolean;
  onEdit: (task: Task) => void;
}) {
  const { completeTask, deleteTask } = useStore();
  const dur =
    task.startMin != null && task.endMin != null
      ? Math.max(30, task.endMin - task.startMin)
      : 60;
  const height = compact ? undefined : Math.max(28, (dur / 60) * HOUR_H - 6);

  return (
    <article
      className={`task prio-${task.priority} ${compact ? "compact" : ""} ${task.important ? "starred" : ""}`}
      style={compact ? undefined : { height }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="task-top">
        <button
          className="done-dot"
          title="Сделано"
          onClick={() => completeTask(task.id)}
        />
        <h4 title={task.title}>{task.title}</h4>
        <button className="tiny" title="Удалить" onClick={() => deleteTask(task.id)}>
          ×
        </button>
      </div>
      {task.startMin != null && (
        <p className="task-time">
          {minutesToLabel(task.startMin)}
          {task.endMin != null ? ` – ${minutesToLabel(task.endMin)}` : ""}
        </p>
      )}
    </article>
  );
}

export function Board() {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    goToday,
    saveTask,
    moveTask,
    focus,
    setFocus,
  } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [now, setNow] = useState(nowMinutes);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const days = weekDays(selectedDate);
  const selected = parseISO(selectedDate);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const line = scrollRef.current?.querySelector(".now-line");
      line?.scrollIntoView({ block: "center", inline: "nearest" });
    }, 80);
    return () => window.clearTimeout(id);
  }, []);

  const monthDays = useMemo(
    () => monthCells(selected.getFullYear(), selected.getMonth()),
    [selectedDate],
  );

  const openDraft = (partial: Partial<Draft>) => {
    setDraft({
      title: "",
      date: selectedDate,
      priority: "in",
      status: "active",
      important: false,
      ...partial,
    });
  };

  const onDropDay = (date: string, startMin?: number) => (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    moveTask(id, date, startMin);
  };

  const timed = (date: string) =>
    tasks.filter((t) => t.date === date && t.status === "active" && t.startMin != null);
  const floating = (date: string) =>
    tasks.filter((t) => t.date === date && t.status === "active" && t.startMin == null);

  return (
    <section className="panel board" data-panel="board">
      <header className="panel-head">
        <div>
          <p className="kicker">доска дня</p>
          <h2>{prettyDate(selectedDate)}</h2>
        </div>
        <div className="head-actions">
          <button
            className="ghost sm"
            onClick={() => openDraft({ date: selectedDate, status: "active" })}
          >
            + дело
          </button>
          <button className="ghost sm" onClick={goToday}>
            сегодня
          </button>
          <button
            className="icon-btn"
            title="Развернуть окно"
            onClick={() => setFocus(focus === "board" ? "all" : "board")}
          >
            <ExpandIcon />
          </button>
        </div>
      </header>

      <div className="board-body">
        <aside className="date-rail">
          <p className="rail-month">
            {MONTHS[selected.getMonth()]} {selected.getFullYear()}
          </p>
          <div className="rail-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="rail-grid">
            {monthDays.map((d) => {
              const key = iso(d);
              const inMonth = d.getMonth() === selected.getMonth();
              const open = dayHasOpen(tasks, key);
              return (
                <button
                  key={key}
                  className={[
                    "date-sq",
                    inMonth ? "" : "dim",
                    key === today ? "today" : "",
                    key === selectedDate ? "sel" : "",
                    open ? "open" : "",
                  ].join(" ")}
                  onClick={() => setSelectedDate(key)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <p className="rail-hint">бордовый контур — незакрытый день</p>
        </aside>

        <div className="board-main">
          <div className="legend">
            <span className="prio-iu">важно срочно</span>
            <span className="prio-in">важно</span>
            <span className="prio-nu">срочно</span>
            <span className="prio-nn">спокойно</span>
            <span className="prio-chaos">хаос</span>
          </div>

          <div className="day-heads">
            <div className="hour-gutter-head" />
            {days.map((d) => (
              <button
                key={d}
                className={`day-head ${d === today ? "today" : ""} ${d === selectedDate ? "sel" : ""} ${dayHasOpen(tasks, d) ? "open" : ""}`}
                onClick={() => setSelectedDate(d)}
              >
                <em>{WEEKDAYS[days.indexOf(d)]}</em>
                <strong>{parseISO(d).getDate()}</strong>
              </button>
            ))}
          </div>

          <div className="now-strip">
            <div className="hour-gutter-head">сейчас</div>
            {days.map((d) => (
              <div
                key={d}
                className="now-cell"
                onClick={() => openDraft({ date: d, status: "active" })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropDay(d, undefined)}
              >
                {floating(d).map((t) => (
                  <TaskCard key={t.id} task={t} compact onEdit={(task) => openDraft(task)} />
                ))}
                {floating(d).length === 0 && <span className="ghost-add">+ первая ячейка</span>}
              </div>
            ))}
          </div>

          <div className="grid-scroll" ref={scrollRef}>
            <div className="hours">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="hour-label" style={{ height: HOUR_H }}>
                  {`${String(h).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            <div className="day-cols">
              {days.map((d) => (
                <div
                  key={d}
                  className={`day-col ${d === today ? "today" : ""}`}
                  style={{ height: 24 * HOUR_H }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const startMin = snapMin((y / HOUR_H) * 60);
                    openDraft({
                      date: d,
                      startMin,
                      endMin: Math.min(24 * 60, startMin + 60),
                      status: "active",
                    });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    onDropDay(d, snapMin((y / HOUR_H) * 60))(e);
                  }}
                >
                  {Array.from({ length: 48 }, (_, i) => (
                    <div
                      key={i}
                      className={`slot ${i % 2 === 0 ? "hour" : "half"}`}
                      style={{ height: HOUR_H / 2 }}
                    />
                  ))}
                  {d === today && (
                    <div className="now-line" style={{ top: (now / 60) * HOUR_H }} />
                  )}
                  {timed(d).map((t) => (
                    <div
                      key={t.id}
                      className="task-abs"
                      style={{ top: ((t.startMin ?? 0) / 60) * HOUR_H + 2 }}
                    >
                      <TaskCard task={t} onEdit={(task) => openDraft(task)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {draft && (
        <TaskEditor
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={(next) => {
            saveTask(next);
            setDraft(null);
          }}
        />
      )}
    </section>
  );
}
