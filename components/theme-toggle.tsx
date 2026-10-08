"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import blackSmall from "@/components/icons/Website logo — Small — 120 × 80@2x.png";
import whiteSmall from "@/components/icons/Website logo — White — Small — 120 × 81@2x.png";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const initial: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((icon) => {
      icon.href = isDark ? whiteSmall.src : blackSmall.src;
    });
  }, [isDark, ready, theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <Sun size={13} />
        <Moon size={13} />
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
