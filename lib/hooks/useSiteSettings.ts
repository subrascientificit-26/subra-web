"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_PUBLIC_SETTINGS,
  type PublicSiteSettings,
} from "@/lib/settings";
import { subscribeLiveUpdates } from "@/lib/hooks/useLiveUpdates";

let cachedSettings: PublicSiteSettings | null = null;
let fetchPromise: Promise<PublicSiteSettings> | null = null;
const listeners = new Set<() => void>();
let unsubscribeLiveSettings: (() => void) | null = null;

function ensureLiveSubscription() {
  if (!unsubscribeLiveSettings && listeners.size > 0) {
    unsubscribeLiveSettings = subscribeLiveUpdates(["settings"], () => {
      invalidateSiteSettingsCache();
    });
  }
}

function cleanupLiveSubscription() {
  if (listeners.size === 0 && unsubscribeLiveSettings) {
    unsubscribeLiveSettings();
    unsubscribeLiveSettings = null;
  }
}

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
    ensureLiveSubscription();
    return () => {
      listeners.delete(listener);
      cleanupLiveSubscription();
    };
  }, []);

  useEffect(() => {
    let active = true;

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
