"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { fetchJsonAuthed } from "@/lib/api";

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_title: string;
  seller_id: number;
  seller_name: string;
  image_url: string;
  variation: number | null;
  quantity: number;
  unit_price_snapshot: string;
  currency: string;
}

type CartResponse = {
  id: number;
  buyer_id: number;
  created_at: string;
  updated_at: string;
  items: CartItem[];
};

interface CartContextValue {
  items: CartItem[];
  refresh: () => Promise<void>;
  addToCart: (productId: number, quantity?: number, variationId?: number | null) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalQuantity: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const hasAccessToken = useCallback(() => {
    try {
      return Boolean(window.localStorage.getItem("vehsl.access") || "");
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!hasAccessToken()) {
      setItems([]);
      return;
    }
    try {
      const data = (await fetchJsonAuthed("/api/v1/cart")) as CartResponse;
      const rows = Array.isArray(data?.items) ? (data.items as CartItem[]) : [];
      setItems(rows);
    } catch {
      setItems([]);
    }
  }, [hasAccessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: number, quantity: number = 1, variationId: number | null = null) => {
      const existing = items.find((it) => it.product_id === productId && (it.variation || null) === (variationId || null));
      const nextQty = (existing?.quantity || 0) + Math.max(1, quantity);
      await fetchJsonAuthed("/api/v1/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ product_id: productId, variation_id: variationId, quantity: nextQty }] }),
      });
      await refresh();
    },
    [items, refresh],
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      await fetchJsonAuthed(`/api/v1/cart/items/${cartItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await fetchJsonAuthed(`/api/v1/cart/items/${cartItemId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const clearCart = useCallback(async () => {
    await fetchJsonAuthed("/api/v1/cart", { method: "DELETE" });
    setItems([]);
  }, []);

  const totalQuantity = useMemo(() => items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0), [items]);
  const totalPrice = useMemo(() => {
    return items.reduce((sum, it) => {
      const unit = Number(it.unit_price_snapshot);
      const qty = Number(it.quantity) || 0;
      return sum + (Number.isFinite(unit) ? unit : 0) * qty;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        refresh,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalQuantity,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [] as CartItem[],
      refresh: async () => {},
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeItem: async () => {},
      clearCart: async () => {},
      totalQuantity: 0,
      totalPrice: 0,
    } as CartContextValue;
  }
  return ctx;
}
