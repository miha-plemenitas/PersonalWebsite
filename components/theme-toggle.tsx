"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import blackSmall from "@/components/icons/Website logo — Small — 120 × 80@2x.png";
import whiteSmall from "@/components/icons/Website logo — White — Small — 120 × 81@2x.png";

type Theme = "light" | "dark";
const THEME_SETTING_KEY = "theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const savedSetting = window.localStorage.getItem("theme-setting");
    const savedTheme = window.localStorage.getItem(THEME_SETTING_KEY);
    const storedTheme = savedSetting === "light" || savedSetting === "dark"
      ? savedSetting
      : savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : null;
    if (storedTheme === null) window.localStorage.removeItem("theme-setting");

    function applyTheme(nextTheme: Theme, followsSystem = false) {
      setTheme(nextTheme);
      if (followsSystem) {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.dataset.theme = nextTheme;
      }
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((icon) => {
        icon.href = nextTheme === "dark" ? whiteSmall.src : blackSmall.src;
      });
    }

    applyTheme(storedTheme ?? (media.matches ? "dark" : "light"), storedTheme === null);
    function handleSystemChange(event: MediaQueryListEvent) {
      if (!window.localStorage.getItem("theme-setting") && !window.localStorage.getItem(THEME_SETTING_KEY)) {
        applyTheme(event.matches ? "dark" : "light", true);
      }
    }
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_SETTING_KEY, nextTheme);
    window.localStorage.removeItem("theme-setting");
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((icon) => {
      icon.href = nextTheme === "dark" ? whiteSmall.src : blackSmall.src;
    });
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <Sun size={13} />
        <Moon size={13} />
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
