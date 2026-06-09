"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUIStore } from "@/lib/store";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const storeTheme = useUIStore((s) => s.theme);
  const [resolved, setResolved] = useState<Theme>("light");

  useEffect(() => {
    setMounted(true);
    if (storeTheme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setResolved(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      setResolved(storeTheme);
    }
  }, [storeTheme]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved, mounted]);

  const toggle = () => {
    useUIStore.getState().setTheme(resolved === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme: resolved, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
