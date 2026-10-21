"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  packSize: string;
  price: number;
  quantity: number;
  casNo?: string;
  category?: string;
  subCategory?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: number, packSize: string) => void;
  updateQuantity: (id: number, packSize: string, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "site-cart-items";

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartItem, id: number, packSize: string) {
  return a.id === id && a.packSize === packSize;
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((line) =>
        sameLine(line, item.id, item.packSize)
      );

      if (existing) {
        return current.map((line) =>
          sameLine(line, item.id, item.packSize)
            ? { ...line, quantity: line.quantity + item.quantity }
            : line
        );
      }

      return [...current, item];
    });
  }, []);

  const removeItem = useCallback((id: number, packSize: string) => {
    setItems((current) =>
      current.filter((line) => !sameLine(line, id, packSize))
    );
  }, []);

  const updateQuantity = useCallback(
    (id: number, packSize: string, quantity: number) => {
      const next = Math.max(1, Math.floor(quantity) || 1);
      setItems((current) =>
        current.map((line) =>
          sameLine(line, id, packSize) ? { ...line, quantity: next } : line
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, line) => total + line.quantity, 0);
    const subtotal = items.reduce(
      (total, line) => total + line.price * line.quantity,
      0
    );

    return {
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
