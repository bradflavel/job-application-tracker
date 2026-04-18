import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "dark" | "light";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "jat.theme";

function applyTheme(theme: Theme): "dark" | "light" {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const resolved =
    theme === "system" ? (media.matches ? "dark" : "light") : theme;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system",
  );
  const [resolved, setResolved] = useState<"dark" | "light">(() =>
    applyTheme(theme),
  );

  useEffect(() => {
    setResolved(applyTheme(theme));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") setResolved(applyTheme("system"));
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
