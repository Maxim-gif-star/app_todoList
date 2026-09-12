import { useEffect, useState } from "react";
import type { Draft, Priority } from "./types";
import { PRIORITIES } from "./types";
import { priorityFromHashtags } from "./tags";
import { minutesToLabel } from "./time";

export function TaskEditor({
  draft,
  onClose,
  onSave,
}: {
  draft: Draft;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [form, setForm] = useState(draft);

  useEffect(() => setForm(draft), [draft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const autoPrio = priorityFromHashtags(form.title);
  const shownPrio = autoPrio ?? form.priority;

  const timeValue = (min?: number) => (min == null ? "" : minutesToLabel(min));

  const parseTime = (value: string) => {
    if (!value) return undefined;
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
    return h * 60 + m;
  };

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <form
        className="editor"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSave(form);
        }}
      >
        <p className="editor-kicker">дело</p>
        <input
          autoFocus
          className="editor-title"
          placeholder="Что нужно сделать…"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            const auto = priorityFromHashtags(title);
            setForm({ ...form, title, priority: auto ?? form.priority });
          }}
        />
        <div className="editor-row">
          <label>
            день
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label>
            с
            <input
              type="time"
              value={timeValue(form.startMin)}
              onChange={(e) =>
                setForm({ ...form, startMin: parseTime(e.target.value) })
              }
            />
          </label>
          <label>
            до
            <input
              type="time"
              value={timeValue(form.endMin)}
              onChange={(e) =>
                setForm({ ...form, endMin: parseTime(e.target.value) })
              }
            />
          </label>
        </div>
        <div className="prio-row">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`prio-pill prio-${p.id} ${shownPrio === p.id ? "on" : ""}`}
              onClick={() => {
                if (autoPrio) return;
                setForm({ ...form, priority: p.id as Priority });
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.important}
            onChange={(e) => setForm({ ...form, important: e.target.checked })}
          />
          пометить кружком как важное в плане
        </label>
        <div className="editor-actions">
          <button type="button" className="ghost" onClick={onClose}>
            отмена
          </button>
          <button type="submit" className="solid">
            сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
