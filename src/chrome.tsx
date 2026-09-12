import { useEffect, useState, type MouseEvent } from "react";
import { formatClock } from "./time";

export function Clock({ onReset }: { onReset: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      className="clock-line"
      onClick={onReset}
      title={`Сейчас ${formatClock(now)}. Вернуть три окна`}
    >
      {formatClock(now)}
    </button>
  );
}

export function TitleBar({
  expanded,
  onToggle,
  onReset,
}: {
  expanded: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  return (
    <header className="titlebar">
      <Clock onReset={onReset} />
      <button
        className="fs-btn"
        onClick={onToggle}
        title={expanded ? "Вернуть три окна" : "Окно на весь экран"}
      >
        {expanded ? (
          <svg viewBox="0 0 18 18" width="14" height="14">
            <path
              d="M5 3H3v2M13 3h2v2M5 15H3v-2M13 15h2v-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 18 18" width="14" height="14">
            <rect x="3" y="3" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 3v2H5M11 3v2h2M7 15v-2H5M11 15v-2h2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </header>
  );
}

export function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path
        d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function setPanelTilt(el: HTMLElement, lift: string, tiltX: string, tiltY: string) {
  el.style.setProperty("--lift", lift);
  el.style.setProperty("--tilt-x", tiltX);
  el.style.setProperty("--tilt-y", tiltY);
}

export function panelFloatProps(solo: boolean, liftPx = 18) {
  const lift = `${liftPx}px`;
  const tilt = liftPx > 0;
  return {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      if (solo) return;
      setPanelTilt(e.currentTarget, lift, "0deg", "0deg");
    },
    onMouseMove: (e: MouseEvent<HTMLElement>) => {
      if (solo) return;
      const el = e.currentTarget;
      if (!tilt) {
        setPanelTilt(el, lift, "0deg", "0deg");
        return;
      }
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setPanelTilt(el, lift, `${(-py * 6).toFixed(2)}deg`, `${(px * 8).toFixed(2)}deg`);
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      setPanelTilt(e.currentTarget, "0px", "0deg", "0deg");
    },
  };
}
