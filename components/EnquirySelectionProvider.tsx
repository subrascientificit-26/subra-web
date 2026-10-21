"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/components/CartProvider";

export type EnquirySelection = CartItem;

interface EnquirySelectionContextValue {
  items: EnquirySelection[];
  count: number;
  subtotal: number;
  addItem: (item: EnquirySelection) => void;
  removeItem: (id: number, packSize: string) => void;
  updateQuantity: (id: number, packSize: string, quantity: number) => void;
  clearItems: () => void;
}

const STORAGE_KEY = "site-enquiry-selections";
const EnquirySelectionContext =
  createContext<EnquirySelectionContextValue | null>(null);

function sameLine(item: EnquirySelection, id: number, packSize: string) {
  return item.id === id && item.packSize === packSize;
}

export default function EnquirySelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<EnquirySelection[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // Ignore malformed storage.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors.
    }
  }, [hydrated, items]);

  const addItem = useCallback((item: EnquirySelection) => {
    setItems((current) => {
      const existing = current.find((line) => sameLine(line, item.id, item.packSize));
      if (!existing) return [...current, item];

      return current.map((line) =>
        sameLine(line, item.id, item.packSize)
          ? { ...line, quantity: line.quantity + item.quantity }
          : line
      );
    });
  }, []);

  const removeItem = useCallback((id: number, packSize: string) => {
    setItems((current) => current.filter((item) => !sameLine(item, id, packSize)));
  }, []);

  const updateQuantity = useCallback(
    (id: number, packSize: string, quantity: number) => {
      const nextQuantity = Math.max(1, Math.floor(quantity) || 1);
      setItems((current) =>
        current.map((item) =>
          sameLine(item, id, packSize) ? { ...item, quantity: nextQuantity } : item
        )
      );
    },
    []
  );

  const clearItems = useCallback(() => setItems([]), []);

  const value = useMemo<EnquirySelectionContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    return { items, count, subtotal, addItem, removeItem, updateQuantity, clearItems };
  }, [addItem, clearItems, items, removeItem, updateQuantity]);

  return (
    <EnquirySelectionContext.Provider value={value}>
      {children}
    </EnquirySelectionContext.Provider>
  );
}

export function useEnquirySelection() {
  const context = useContext(EnquirySelectionContext);
  if (!context) {
    throw new Error("useEnquirySelection must be used within an EnquirySelectionProvider");
  }
  return context;
}
