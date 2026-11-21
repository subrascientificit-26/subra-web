"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";
import {
  getThemeModeSnapshot,
  subscribeToTheme,
  type ThemeMode,
} from "@/lib/theme";

export default function ThemedToaster() {
  const themeMode = useSyncExternalStore<ThemeMode>(
    subscribeToTheme,
    getThemeModeSnapshot,
    () => "dark"
  );

  return (
    <Toaster
      theme={themeMode}
      position="top-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast: "border border-border shadow-xl",
        },
      }}
    />
  );
}
