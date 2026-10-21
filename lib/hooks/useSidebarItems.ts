"use client";

import { useEffect, useState } from "react";
import type { SidebarNavItem } from "@/components/ui/DynamicNav";

export type SidebarSectionName =
  | "navbar"
  | "footer"
  | "footer_service"
  | "products_sidebar"
  | "admin";

const EMPTY_FALLBACK: SidebarNavItem[] = [];

type CacheEntry = {
  data?: SidebarNavItem[];
  promise?: Promise<SidebarNavItem[]>;
};

const sidebarCache = new Map<SidebarSectionName, CacheEntry>();
const cacheListeners = new Set<() => void>();

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

  const promise = fetch(`/api/sidebar?section=${section}&tree=true`)
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
  fallback: SidebarNavItem[] = EMPTY_FALLBACK
) {
  const [items, setItems] = useState<SidebarNavItem[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [cacheTick, setCacheTick] = useState(0);

  useEffect(() => {
    const listener = () => setCacheTick((tick) => tick + 1);
    cacheListeners.add(listener);
    return () => {
      cacheListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const cached = sidebarCache.get(section);
    if (cached?.data) {
      setItems(cached.data.length > 0 ? cached.data : fallback);
      setLoading(false);
      return;
    }

    fetchSidebarSection(section).then((data) => {
      if (!active) return;
      setItems(data.length > 0 ? data : fallback);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [section, cacheTick]);

  return { items, loading };
}
