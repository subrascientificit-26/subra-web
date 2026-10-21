"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ThemeMode,
} from "@/lib/theme";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { persistThemeSetting } from "@/lib/persistThemeSetting";

type ThemeToggleProps = {
  syncToSettings?: boolean;
};

export default function ThemeToggle({ syncToSettings = false }: ThemeToggleProps) {
  const { settings } = useSiteSettings();
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    const active = stored ?? resolveTheme(settings.themeMode);
    setTheme(active);
    applyTheme(active);
  }, [settings.themeMode]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === "light" || detail === "dark") {
        setTheme(detail);
      }
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setStoredTheme(mode);
    setTheme(mode);
    if (syncToSettings) {
      void persistThemeSetting(mode);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className="flex h-10 items-center rounded-lg border border-border bg-surface-elevated p-1"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setThemeMode("light")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
          !isDark
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
        aria-label="Light mode"
        title="Light mode"
        aria-pressed={!isDark}
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        onClick={() => setThemeMode("dark")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
          isDark
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
        aria-label="Dark mode"
        title="Dark mode"
        aria-pressed={isDark}
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
