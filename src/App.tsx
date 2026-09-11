import { useCallback, useEffect, useState } from "react";
import { Board } from "./Board";
import { Clock, TitleBar } from "./chrome";
import { DoneTray } from "./DoneTray";
import { Planner } from "./Planner";
import { StoreProvider, useStore } from "./store";
import type { PanelFocus } from "./types";

function Shell() {
  const { focus, setFocus } = useStore();
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFs = useCallback(async () => {
    if (window.noctis?.toggleFullscreen) {
      const next = await window.noctis.toggleFullscreen();
      setFullscreen(next);
      return;
    }
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    const hit = (x: number, y: number): PanelFocus => {
      const el = document.elementFromPoint(x, y);
      const panel = el?.closest("[data-panel]") as HTMLElement | null;
      return (panel?.dataset.panel as PanelFocus) || "all";
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const panel = hit(e.clientX, e.clientY);
        if (e.deltaY < 0 && panel !== "all") setFocus(panel);
        else setFocus("all");
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select");
      if (e.key === "Escape") setFocus("all");
      if (e.key === "F11") {
        e.preventDefault();
        void toggleFs();
      }
      if (typing) return;
      if (e.key === "1") setFocus("board");
      if (e.key === "2") setFocus("planner");
      if (e.key === "3") setFocus("done");
      if (e.key === "0") setFocus("all");
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [setFocus, toggleFs]);

  return (
    <div className={`app focus-${focus}`}>
      <div className="vignette" />
      <div className="mesh" />
      <TitleBar fullscreen={fullscreen} onToggle={() => void toggleFs()} />
      <main className="layout">
        <Board />
        <Planner />
        <DoneTray />
        <div className="clock-slot" data-swipe-zone="1">
          <Clock onReset={() => setFocus("all")} />
        </div>
      </main>
      <p className="hint">
        щипок / Ctrl+колесо — раскрыть окно под курсором · клик по часам — три окна · F11 — весь экран
      </p>
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
