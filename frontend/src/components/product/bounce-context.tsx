"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BounceContextType {
  interactionCount: number;
  cartCount: number;
  triggerBounce: (target?: string) => void;
  addToCart: () => void;
  removeFromCart: () => void;
  setCartCount: (count: number) => void;
  bounceTargets: Record<string, number>;
}

const BounceContext = createContext<BounceContextType>({
  interactionCount: 0,
  cartCount: 0,
  triggerBounce: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  setCartCount: () => {},
  bounceTargets: {},
});

export function BounceProvider({ children }: { children: ReactNode }) {
  const [interactionCount, setInteractionCount] = useState(0);
  const [cartCount, setCartCount] = useState(1);
  const [bounceTargets, setBounceTargets] = useState<Record<string, number>>({});

  const triggerBounce = useCallback((target?: string) => {
    setInteractionCount((prev) => prev + 1);
    if (target) {
      setBounceTargets((prev) => ({
        ...prev,
        [target]: Date.now(),
      }));
    }
  }, []);

  const addToCart = useCallback(() => {
    setCartCount((prev) => prev + 1);
    setInteractionCount((prev) => prev + 1);
    setBounceTargets((prev) => ({
      ...prev,
      cart: Date.now(),
      continue: Date.now(),
    }));
  }, []);

  const removeFromCart = useCallback(() => {
    setCartCount((prev) => Math.max(1, prev - 1));
    setInteractionCount((prev) => prev + 1);
    setBounceTargets((prev) => ({
      ...prev,
      cart: Date.now(),
    }));
  }, []);

  const setCartCountDirect = useCallback((count: number) => {
    setCartCount(Math.max(1, count));
    setInteractionCount((prev) => prev + 1);
    setBounceTargets((prev) => ({
      ...prev,
      cart: Date.now(),
      continue: Date.now(),
    }));
  }, []);

  return (
    <BounceContext.Provider
      value={{ interactionCount, cartCount, triggerBounce, addToCart, removeFromCart, setCartCount: setCartCountDirect, bounceTargets }}
    >
      {children}
    </BounceContext.Provider>
  );
}

export function useBounce() {
  return useContext(BounceContext);
}