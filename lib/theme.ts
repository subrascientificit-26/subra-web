export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "site-theme-preference";

export function resolveTheme(
  mode: ThemeMode | string | null | undefined
): ThemeMode {
  return mode === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;

  const resolved = mode === "light" ? "light" : "dark";
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(resolved === "light" ? "theme-light" : "theme-dark");
  root.style.colorScheme = resolved;
}

export function getThemeModeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light")
    ? "light"
    : "dark";
}

export function getThemeAppearanceSnapshot(): string {
  if (typeof document === "undefined") return "dark|#0b5ed7";
  const root = document.documentElement;
  const mode: ThemeMode = root.classList.contains("theme-light")
    ? "light"
    : "dark";
  const primary = root.style.getPropertyValue("--primary").trim() || "#0b5ed7";
  return `${mode}|${primary}`;
}

export function subscribeToTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const handleThemeChange = () => onStoreChange();
  window.addEventListener("theme-change", handleThemeChange);

  const observer = new MutationObserver(() => {
    onStoreChange();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });

  return () => {
    window.removeEventListener("theme-change", handleThemeChange);
    observer.disconnect();
  };
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
