import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Options = {
  openPalette: () => void;
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function useGlobalShortcuts({ openPalette }: Options) {
  const navigate = useNavigate();

  useEffect(() => {
    let chord: string | null = null;
    let chordTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
        return;
      }

      if (isEditable(e.target)) return;

      if (chord) {
        const second = e.key.toLowerCase();
        const combo = `${chord} ${second}`;
        const map: Record<string, string> = {
          "g d": "/",
          "g a": "/apps",
          "g c": "/companies",
          "g p": "/contacts",
          "g n": "/analytics",
          "g r": "/reminders",
          "g o": "/offers/compare",
          "g h": "/archive",
          "g s": "/settings",
        };
        if (map[combo]) navigate(map[combo]);
        chord = null;
        if (chordTimer) clearTimeout(chordTimer);
        return;
      }

      if (e.key === "g") {
        chord = "g";
        chordTimer = setTimeout(() => (chord = null), 800);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        openPalette();
      }

      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        navigate("/apps?new=1");
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (chordTimer) clearTimeout(chordTimer);
    };
  }, [navigate, openPalette]);
}
