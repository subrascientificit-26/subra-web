"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface WishlistContextValue {
  ids: string[];
  count: number;
  isFavorite: (id: string | number) => boolean;
  toggle: (id: string | number) => void;
  add: (id: string | number) => void;
  remove: (id: string | number) => void;
  clear: () => void;
}

const STORAGE_KEY = "site-wishlist-items";

const WishlistContext = createContext<WishlistContextValue | null>(null);

export default function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIds(parsed.map((value) => String(value)));
        }
      }
    } catch {
      // Ignore malformed storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore quota errors
    }
  }, [ids, hydrated]);

  const isFavorite = useCallback(
    (id: string | number) => ids.includes(String(id)),
    [ids]
  );

  const add = useCallback((id: string | number) => {
    const key = String(id);
    setIds((current) =>
      current.includes(key) ? current : [...current, key]
    );
  }, []);

  const remove = useCallback((id: string | number) => {
    const key = String(id);
    setIds((current) => current.filter((value) => value !== key));
  }, []);

  const toggle = useCallback((id: string | number) => {
    const key = String(id);
    setIds((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key]
    );
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      isFavorite,
      toggle,
      add,
      remove,
      clear,
    }),
    [ids, isFavorite, toggle, add, remove, clear]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
