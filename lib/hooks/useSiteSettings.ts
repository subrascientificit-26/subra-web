"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_PUBLIC_SETTINGS,
  type PublicSiteSettings,
} from "@/lib/settings";

let cachedSettings: PublicSiteSettings | null = null;
let fetchPromise: Promise<PublicSiteSettings> | null = null;
const listeners = new Set<() => void>();

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
  fetchPromise = null;
  listeners.forEach((listener) => listener());
}

function fetchPublicSettings(): Promise<PublicSiteSettings> {
  if (cachedSettings) {
    return Promise.resolve(cachedSettings);
  }
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = fetch("/api/settings/public", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : EMPTY_PUBLIC_SETTINGS))
    .then((data: PublicSiteSettings) => {
      cachedSettings = data;
      return cachedSettings;
    })
    .catch(() => {
      cachedSettings = EMPTY_PUBLIC_SETTINGS;
      return cachedSettings;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(
    cachedSettings ?? EMPTY_PUBLIC_SETTINGS
  );
  const [loading, setLoading] = useState(!cachedSettings);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPublicSettings().then((data) => {
      if (!active) return;
      setSettings(data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [tick]);

  return { settings, loading };
}
