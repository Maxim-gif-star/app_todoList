import { useEffect } from "react";
import { Board } from "./Board";
import { TitleBar } from "./chrome";
import { DoneTray } from "./DoneTray";
import { Planner } from "./Planner";
import { StoreProvider, useStore } from "./store";
import type { PanelFocus } from "./types";

function Shell() {
  const { focus, setFocus } = useStore();

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
  }, [setFocus]);

  return (
    <div className={`app focus-${focus}`}>
      <TitleBar
        expanded={focus !== "all"}
        onToggle={() => setFocus(focus === "all" ? "board" : "all")}
        onReset={() => setFocus("all")}
      />
      <main className="layout">
        <Board />
        <Planner />
        <DoneTray />
      </main>
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
