import { ExpandIcon, panelFloatProps } from "./chrome";
import { useStore } from "./store";
import { resolvePriority } from "./tags";
import { formatStamp } from "./time";

export function DoneTray() {
  const { tasks, completeTask, restoreTask, deleteTask, focus, setFocus, moveTask } = useStore();
  const done = [...tasks]
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  return (
    <section
      className={`panel done ${focus === "done" ? "is-solo" : ""}`}
      data-panel="done"
      {...panelFloatProps(focus === "done")}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/task-id");
        if (id) completeTask(id);
      }}
    >
      <header className="panel-head">
        <div>
          <p className="kicker">сделано</p>
          <h2>прилетает сюда</h2>
        </div>
        <button
          className="icon-btn"
          title="На весь экран"
          onClick={() => setFocus(focus === "done" ? "all" : "done")}
        >
          <ExpandIcon />
        </button>
      </header>
      <div className="done-list">
        {done.length === 0 && (
          <p className="empty">Пока тихо. Отметь дело слева — и оно мягко переедет сюда.</p>
        )}
        {done.map((t) => (
          <article key={t.id} className={`done-card prio-${resolvePriority(t.title, t.priority)}`}>
            <div>
              <h4>{t.title}</h4>
              <p>{t.completedAt ? formatStamp(t.completedAt) : ""}</p>
            </div>
            <div className="done-actions">
              <button
                className="sm-link"
                onClick={() => {
                  restoreTask(t.id);
                  moveTask(t.id, t.date, t.startMin);
                }}
              >
                вернуть
              </button>
              <button className="tiny" onClick={() => deleteTask(t.id)}>
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
