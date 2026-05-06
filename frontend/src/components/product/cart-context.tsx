"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* ───── Types ──────────────────────────────────────────── */

export interface CartItem {
  id: string;
  productName: string;
  colorIndex: number;
  colorName: string;
  colorHex: string;
  sizeLabel: string;
  speedLabel: string;
  quantity: number;
  pricePerUnit: number;
  deliveryMethod: string | null;
  deliverySurcharge: number;
  imageUrl: string;
  addedAt: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "id" | "addedAt">) => string;
  removeItem: (id: string) => CartItem | undefined;
  restoreItem: (item: CartItem) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  checkoutItemIds: string[];
  setCheckoutItemIds: (ids: string[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/* ───── Color → Image mapping ──────────────────────────── */

const colorImageMap: Record<string, string> = {
  Silver:
    "https://images.unsplash.com/photo-1751846545116-838fe2e7e815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBDJTIwY2FibGUlMjB3aGl0ZSUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3Mzc0NzQzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Space Blue":
    "https://images.unsplash.com/photo-1663559147223-6b0d012a4d0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwYnJhaWRlZCUyMFVTQiUyMGNhYmxlJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzM3NDc0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Forest:
    "https://images.unsplash.com/photo-1674401223616-b4629a516aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGNhYmxlJTIwd2lyZSUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3MzYwMzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Sunshine:
    "https://images.unsplash.com/photo-1772911141560-9663e1d814f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3clMjBjYWJsZSUyMHdpcmUlMjB0ZWNoJTIwYWNjZXNzb3J5fGVufDF8fHx8MTc3MzYwMzkyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Rose:
    "https://images.unsplash.com/photo-1647109196516-fdecf92826f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcm9zZSUyMGdvbGQlMjBjYWJsZSUyMGFjY2Vzc29yeXxlbnwxfHx8fDE3NzM2MDM5Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Midnight:
    "https://images.unsplash.com/photo-1687038520693-e528c10e450a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMFVTQiUyMGNhYmxlJTIwY29pbGVkJTIwbWluaW1hbHxlbnwxfHx8fDE3NzM3NDc0MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  White:
    "https://images.unsplash.com/photo-1751846545116-838fe2e7e815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBDJTIwY2FibGUlMjB3aGl0ZSUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3Mzc0NzQzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

export function getImageForColor(colorName: string): string {
  return colorImageMap[colorName] ?? colorImageMap.Silver;
}

/* ───── Mock data ──────────────────────────────────────── */

const mockItems: CartItem[] = [
  {
    id: "mock-1",
    productName: "USB-C to USB-C Cable",
    colorIndex: 1,
    colorName: "Space Blue",
    colorHex: "#2997ff",
    sizeLabel: "2M",
    speedLabel: "40 Gbps",
    quantity: 80,
    pricePerUnit: 17.5,
    deliveryMethod: "Air Freight",
    deliverySurcharge: 2.1,
    imageUrl: colorImageMap["Space Blue"],
    addedAt: Date.now() - 180000, // 3 min ago
  },
  {
    id: "mock-2",
    productName: "USB-C to USB-C Cable",
    colorIndex: 5,
    colorName: "Midnight",
    colorHex: "#09090b",
    sizeLabel: "1M",
    speedLabel: "80 Gbps",
    quantity: 240,
    pricePerUnit: 16.9,
    deliveryMethod: "Sea Freight",
    deliverySurcharge: 0,
    imageUrl: colorImageMap.Midnight,
    addedAt: Date.now() - 600000, // 10 min ago
  },
  {
    id: "mock-3",
    productName: "USB-C to USB-C Cable",
    colorIndex: 4,
    colorName: "Rose",
    colorHex: "#fed7d2",
    sizeLabel: "3M",
    speedLabel: "40 Gbps",
    quantity: 10,
    pricePerUnit: 17.9,
    deliveryMethod: "Express Air",
    deliverySurcharge: 3.85,
    imageUrl: colorImageMap.Rose,
    addedAt: Date.now() - 1200000, // 20 min ago
  },
  {
    id: "mock-4",
    productName: "USB-C to USB-C Cable",
    colorIndex: 2,
    colorName: "Forest",
    colorHex: "#34a853",
    sizeLabel: "5M",
    speedLabel: "80 Gbps",
    quantity: 1440,
    pricePerUnit: 16.4,
    deliveryMethod: "Sea Freight",
    deliverySurcharge: 0,
    imageUrl: colorImageMap.Forest,
    addedAt: Date.now() - 2400000, // 40 min ago
  },
  {
    id: "mock-5",
    productName: "USB-C to USB-C Cable",
    colorIndex: 0,
    colorName: "Silver",
    colorHex: "#e8e8ed",
    sizeLabel: "1M",
    speedLabel: "40 Gbps",
    quantity: 80,
    pricePerUnit: 17.5,
    deliveryMethod: "Air Freight",
    deliverySurcharge: 2.1,
    imageUrl: colorImageMap.Silver,
    addedAt: Date.now() - 3600000, // 1 hr ago
  },
];

/* ───── Provider ───────────────────────────────────────── */

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(mockItems);
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutItemIds, setCheckoutItemIds] = useState<string[]>([]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o), []);

  const addItem = useCallback((item: Omit<CartItem, "id" | "addedAt">): string => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      addedAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
    return newItem.id;
  }, []);

  const removeItem = useCallback((id: string): CartItem | undefined => {
    let removed: CartItem | undefined;
    setItems((prev) => {
      removed = prev.find((item) => item.id === id);
      return prev.filter((item) => item.id !== id);
    });
    return removed;
  }, []);

  const restoreItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Insert back in correct chronological position
      const newItems = [...prev, item].sort((a, b) => b.addedAt - a.addedAt);
      return newItems;
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.pricePerUnit + item.deliverySurcharge) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        restoreItem,
        clearCart,
        totalItems,
        totalPrice,
        checkoutItemIds,
        setCheckoutItemIds,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Return a safe default during hot-reload or when rendered outside provider
    return {
      items: [] as CartItem[],
      isOpen: false,
      openCart: () => {},
      closeCart: () => {},
      toggleCart: () => {},
      addItem: () => "",
      removeItem: () => undefined as CartItem | undefined,
      restoreItem: () => {},
      clearCart: () => {},
      totalItems: 0,
      totalPrice: 0,
      checkoutItemIds: [] as string[],
      setCheckoutItemIds: () => {},
    } as CartContextValue;
  }
  return ctx;
}