import { useEffect, useState } from "react";
import { formatClock } from "./time";

export function Clock({ onReset }: { onReset: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hDeg = h * 30 + m * 0.5;
  const mDeg = m * 6 + s * 0.1;
  const sDeg = s * 6;

  return (
    <button className="clock" onClick={onReset} title={`Сейчас ${formatClock(now)}. Вернуть три окна`} data-swipe-zone="1">
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <radialGradient id="clockGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(168,120,255,0.35)" />
            <stop offset="100%" stopColor="rgba(20,12,32,0.95)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="url(#clockGlow)" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(186,150,255,0.45)" strokeWidth="1.4" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const x1 = 50 + Math.cos(a) * 40;
          const y1 = 50 + Math.sin(a) * 40;
          const x2 = 50 + Math.cos(a) * 44;
          const y2 = 50 + Math.sin(a) * 44;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(236,220,255,0.55)" strokeWidth={i % 3 === 0 ? 1.8 : 0.8} />;
        })}
        <line x1="50" y1="50" x2="50" y2="32" stroke="#efe6ff" strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${hDeg} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="22" stroke="#d4b8ff" strokeWidth="2" strokeLinecap="round" transform={`rotate(${mDeg} 50 50)`} />
        <line x1="50" y1="52" x2="50" y2="20" stroke="#c45b7a" strokeWidth="1" strokeLinecap="round" transform={`rotate(${sDeg} 50 50)`} />
        <circle cx="50" cy="50" r="2.6" fill="#f4ecff" />
        <text x="50" y="86" textAnchor="middle" fill="rgba(243,236,251,0.88)" fontSize="9" fontFamily="Cormorant Garamond, serif">
          {formatClock(now)}
        </text>
      </svg>
    </button>
  );
}

export function TitleBar({
  fullscreen,
  onToggle,
}: {
  fullscreen: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="titlebar">
      <span className="brand">noctis</span>
      <button
        className="fs-btn"
        onClick={onToggle}
        title={fullscreen ? "Оконный режим" : "На весь экран"}
      >
        {fullscreen ? (
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
