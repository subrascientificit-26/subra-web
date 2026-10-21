"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { applyTheme, getStoredTheme, resolveTheme } from "@/lib/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", settings.themePrimaryColor);
    root.style.setProperty("--theme-accent", settings.themeAccentColor);
    root.style.setProperty("--primary", settings.themePrimaryColor);
    root.style.setProperty("--accent", settings.themeAccentColor);
    applyTheme(getStoredTheme() ?? resolveTheme(settings.themeMode));

    if (settings.favicon) {
      let link = document.querySelector<HTMLLinkElement>("link[data-dynamic-favicon]");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.setAttribute("data-dynamic-favicon", "true");
        document.head.appendChild(link);
      }
      link.href = settings.favicon;
    }
  }, [settings]);

  return <>{children}</>;
}
