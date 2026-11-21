"use client";

import { useEffect, useState } from "react";
import { subscribeLiveUpdates } from "@/lib/hooks/useLiveUpdates";

export interface AdminDashboardPayload {
  stats: {
    totalProducts: number;
    totalCustomers: number;
    totalEnquiries: number;
    totalCustomRequirements: number;
    enquiriesThisMonth: number;
    enquiriesLastMonth: number;
  };
  enquiryTrend: Array<{ label: string; count: number }>;
  productStatus: {
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
  productDetails: {
    total: number;
    featured: number;
    bestSeller: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
  recentEnquiries: Array<{
    id: string;
    title: string;
    name: string;
    email: string;
    fileUrl?: string | null;
    date: string;
  }>;
}

let cachedDashboard: AdminDashboardPayload | null = null;
let inFlightPromise: Promise<AdminDashboardPayload | null> | null = null;
const dashboardListeners = new Set<(data: AdminDashboardPayload | null) => void>();
let unsubscribeLiveDashboard: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function notifyDashboardListeners(data: AdminDashboardPayload | null) {
  for (const listener of dashboardListeners) {
    listener(data);
  }
}

function fetchDashboard(force = false): Promise<AdminDashboardPayload | null> {
  if (!force && cachedDashboard) {
    return Promise.resolve(cachedDashboard);
  }
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = fetch("/api/admin/dashboard", {
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => (res.ok ? (res.json() as Promise<AdminDashboardPayload>) : null))
    .then((data) => {
      if (data) {
        cachedDashboard = data;
        notifyDashboardListeners(data);
      }
      return data;
    })
    .catch(() => cachedDashboard)
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
}

function ensureLiveDashboardSubscription() {
  if (!unsubscribeLiveDashboard && dashboardListeners.size > 0) {
    unsubscribeLiveDashboard = subscribeLiveUpdates(
      ["dashboard", "products", "users", "enquiries", "custom-requirements"],
      () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          void fetchDashboard(true);
        }, 150);
      }
    );
  }
}

function cleanupLiveDashboardSubscription() {
  if (dashboardListeners.size === 0) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (unsubscribeLiveDashboard) {
      unsubscribeLiveDashboard();
      unsubscribeLiveDashboard = null;
    }
    cachedDashboard = null;
  }
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardPayload | null>(cachedDashboard);
  const [loading, setLoading] = useState(!cachedDashboard);

  useEffect(() => {
    let active = true;

    const listener = (nextData: AdminDashboardPayload | null) => {
      if (!active) return;
      setData(nextData);
      setLoading(false);
    };

    dashboardListeners.add(listener);
    ensureLiveDashboardSubscription();

    void fetchDashboard(false).then((loaded) => {
      if (!active) return;
      setData(loaded);
      setLoading(false);
    });

    return () => {
      active = false;
      dashboardListeners.delete(listener);
      cleanupLiveDashboardSubscription();
    };
  }, []);

  return { data, loading };
}

