import { SETTING_KEYS } from "@/lib/settings";
import { invalidateSiteSettingsCache } from "@/lib/hooks/useSiteSettings";
import type { ThemeMode } from "@/lib/theme";

export async function persistThemeSetting(mode: ThemeMode) {
  try {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: { [SETTING_KEYS.themeMode]: mode },
      }),
    });

    if (res.ok) {
      invalidateSiteSettingsCache();
    }
  } catch {
    // Theme still applies locally; server sync is best-effort.
  }
}
