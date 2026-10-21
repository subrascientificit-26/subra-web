export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "site-theme-preference";

export function resolveTheme(
  mode: ThemeMode | string | null | undefined
): ThemeMode {
  return mode === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(mode === "light" ? "theme-light" : "theme-dark");
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function setStoredTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: mode }));
}

export function getActiveTheme(fallback: ThemeMode = "dark"): ThemeMode {
  return getStoredTheme() ?? fallback;
}
