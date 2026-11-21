"use client";

import { useEffect, useRef, useState } from "react";
import type { SidebarNavItem } from "@/components/ui/DynamicNav";
import { subscribeLiveUpdates } from "@/lib/hooks/useLiveUpdates";

export type SidebarSectionName =
  | "navbar"
  | "footer"
  | "footer_service"
  | "products_sidebar"
  | "admin";

const EMPTY_FALLBACK: SidebarNavItem[] = [];

export interface SidebarFallbackItem {
  id?: number;
  label: string;
  href: string;
  children?: readonly SidebarFallbackItem[];
}

function normalizeFallbackItems(
  items: readonly SidebarFallbackItem[],
  depthSeed = 0
): SidebarNavItem[] {
  return items.map((item, index) => {
    const generatedId = -(depthSeed * 100 + index + 1);
    return {
      id: item.id ?? generatedId,
      label: item.label,
      href: item.href,
      ...(item.children
        ? {
            children: normalizeFallbackItems(
              item.children,
              Math.abs(generatedId)
            ),
          }
        : {}),
    };
  });
}

type CacheEntry = {
  data?: SidebarNavItem[];
  promise?: Promise<SidebarNavItem[]>;
};

const sidebarCache = new Map<SidebarSectionName, CacheEntry>();
const cacheListeners = new Set<() => void>();
let unsubscribeLiveSidebar: (() => void) | null = null;

function ensureLiveSidebarSubscription() {
  if (!unsubscribeLiveSidebar && cacheListeners.size > 0) {
    unsubscribeLiveSidebar = subscribeLiveUpdates(["sidebar"], () => {
      invalidateSidebarCache();
    });
  }
}

function cleanupLiveSidebarSubscription() {
  if (cacheListeners.size === 0 && unsubscribeLiveSidebar) {
    unsubscribeLiveSidebar();
    unsubscribeLiveSidebar = null;
  }
}

export function invalidateSidebarCache(section?: SidebarSectionName) {
  if (section) {
    sidebarCache.delete(section);
  } else {
    sidebarCache.clear();
  }
  cacheListeners.forEach((listener) => listener());
}

function fetchSidebarSection(
  section: SidebarSectionName
): Promise<SidebarNavItem[]> {
  const existing = sidebarCache.get(section);
  if (existing?.data) {
    return Promise.resolve(existing.data);
  }
  if (existing?.promise) {
    return existing.promise;
  }

  const promise = fetch(`/api/sidebar?section=${section}&tree=true`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      const items = Array.isArray(data) ? data : [];
      sidebarCache.set(section, { data: items });
      return items;
    })
    .catch(() => {
      sidebarCache.delete(section);
      return [];
    });

  sidebarCache.set(section, { promise });
  return promise;
}

export function useSidebarItems(
  section: SidebarSectionName,
  fallback: readonly SidebarFallbackItem[] = EMPTY_FALLBACK
) {
  const fallbackRef = useRef(fallback);
  const [items, setItems] = useState<SidebarNavItem[]>(() => {
    const cached = sidebarCache.get(section);
    return cached?.data && cached.data.length > 0
      ? cached.data
      : normalizeFallbackItems(fallback);
  });
  const [loading, setLoading] = useState(
    () => !sidebarCache.get(section)?.data
  );
  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  useEffect(() => {
    const listener = () => setCacheTick((tick) => tick + 1);
    cacheListeners.add(listener);
    ensureLiveSidebarSubscription();
    return () => {
      cacheListeners.delete(listener);
      cleanupLiveSidebarSubscription();
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchSidebarSection(section).then((data) => {
      if (!active) return;
      setItems(
        data.length > 0 ? data : normalizeFallbackItems(fallbackRef.current)
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [section, cacheTick]);

  return { items, loading };
}
