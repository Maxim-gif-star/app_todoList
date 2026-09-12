import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { ExpandIcon, panelFloatProps } from "./chrome";
import { dayShowsMark, useStore } from "./store";
import { TaskEditor } from "./TaskEditor";
import { resolvePriority } from "./tags";
import type { Draft, Task } from "./types";
import { HOUR_H } from "./types";
import {
  MONTHS,
  WEEKDAYS,
  carryLabel,
  iso,
  minutesToLabel,
  monthCells,
  nowMinutes,
  parseISO,
  prettyMonth,
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
  const carried =
    task.originDate && task.originDate !== task.date ? task.originDate : undefined;

  const onGripDrag = (e: DragEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/task-id", task.id);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    const card = e.currentTarget.closest("article");
    if (card instanceof HTMLElement) {
      e.dataTransfer.setDragImage(card, Math.min(36, card.offsetWidth / 2), 14);
    }
  };

  return (
    <article
      className={`task prio-${resolvePriority(task.title, task.priority)} ${compact ? "compact" : ""} ${task.important ? "starred" : ""}`}
      style={compact ? undefined : { height }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className="task-grip"
        title="Перенести на другой день"
        draggable
        onDragStart={onGripDrag}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <i />
        <i />
      </span>
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
      {carried && (
        <p className="task-carry" title={`Перенесено с ${carryLabel(carried)}`}>
          с {carryLabel(carried)}
        </p>
      )}
    </article>
  );
}

function DateChip() {
  const { selectedDate, setSelectedDate, tasks, mutedDays, pinnedDays, muteDay } = useStore();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const selected = parseISO(selectedDate);
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const today = todayISO();
  const marked = dayShowsMark(tasks, selectedDate, mutedDays, pinnedDays);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = 308;
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    setPos({ top: r.bottom + 8, left });
    setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = monthCells(view.getFullYear(), view.getMonth());

  return (
    <span className="date-chip">
      <button
        ref={btnRef}
        type="button"
        className={`date-sq mini ${selectedDate === today ? "today" : ""} ${marked ? "open" : ""} ${open ? "on" : ""}`}
        title="Открыть месяц. ПКМ — снять пометку дня"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          muteDay(selectedDate);
        }}
      >
        {selected.getDate()}
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            className="cal-pop"
            role="dialog"
            aria-label="Календарь"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="cal-head">
              <button
                type="button"
                className="cal-nav"
                aria-label="Предыдущий месяц"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <strong>
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </strong>
              <button
                type="button"
                className="cal-nav"
                aria-label="Следующий месяц"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
            <div className="cal-wd">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((d) => {
                const key = iso(d);
                const inMonth = d.getMonth() === view.getMonth();
                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "cal-day",
                      inMonth ? "" : "dim",
                      key === today ? "today" : "",
                      key === selectedDate ? "sel" : "",
                      dayShowsMark(tasks, key, mutedDays, pinnedDays) ? "open" : "",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedDate(key);
                      setOpen(false);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      muteDay(key);
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </span>
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
    mutedDays,
    pinnedDays,
    muteDay,
  } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [now, setNow] = useState(nowMinutes);
  const [dropDay, setDropDay] = useState<string | null>(null);
  const today = todayISO();
  const days = weekDays(selectedDate);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const clear = () => setDropDay(null);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, []);

  const openDraft = (partial: Partial<Draft>) => {
    const startMin = selectedDate === today ? snapMin(now) : 9 * 60;
    setDraft({
      title: "",
      date: selectedDate,
      priority: "in",
      status: "active",
      important: false,
      startMin,
      endMin: Math.min(24 * 60, startMin + 60),
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
    tasks.filter((t) => t.date === date && t.status === "active");

  return (
    <section
      className={`panel board ${focus === "board" ? "is-solo" : ""}`}
      data-panel="board"
      {...panelFloatProps(focus === "board", 0)}
    >
      <header className="panel-head">
        <div>
          <p className="kicker">доска дня</p>
          <h2 className="board-date-title">
            <DateChip />
            <span>{prettyMonth(selectedDate)}</span>
          </h2>
        </div>
        <div className="head-actions">
          <button className="ghost sm" onClick={() => openDraft({ date: selectedDate })}>
            + дело
          </button>
          <button className="ghost sm" onClick={goToday}>
            сегодня
          </button>
          <button
            className="icon-btn"
            title="На весь экран"
            onClick={() => setFocus(focus === "board" ? "all" : "board")}
          >
            <ExpandIcon />
          </button>
        </div>
      </header>

      <div className="board-body">
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
            {days.map((d, i) => (
              <button
                key={d}
                className={`day-head ${d === today ? "today" : ""} ${d === selectedDate ? "sel" : ""} ${dayShowsMark(tasks, d, mutedDays, pinnedDays) ? "open" : ""}`}
                onClick={() => setSelectedDate(d)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  muteDay(d);
                }}
                title="ПКМ — снять пометку дня"
              >
                <em>{WEEKDAYS[i]}</em>
                <strong>{parseISO(d).getDate()}</strong>
              </button>
            ))}
          </div>

          <div className="grid-scroll">
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
                  className={`day-col ${d === today ? "today" : ""} ${dropDay === d ? "drop-on" : ""}`}
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropDay(d);
                  }}
                  onDrop={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    onDropDay(d, snapMin((y / HOUR_H) * 60))(e);
                    setDropDay(null);
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
                      style={{ top: ((t.startMin ?? 9 * 60) / 60) * HOUR_H + 2 }}
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
