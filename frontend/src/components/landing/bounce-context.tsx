"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface BounceState {
  clickCount: number;
  lastClickTime: number;
  triggerBounce: () => void;
  bounceIntensity: number;
}

const BounceContext = createContext<BounceState>({
  clickCount: 0,
  lastClickTime: 0,
  triggerBounce: () => {},
  bounceIntensity: 0,
});

export function BounceProvider({ children }: { children: ReactNode }) {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const triggerBounce = useCallback(() => {
    setClickCount((prev) => prev + 1);
    setLastClickTime(Date.now());
  }, []);

  // Intensity grows logarithmically - subtle at first, more alive with use
  const bounceIntensity = Math.min(Math.log2(clickCount + 1) * 0.3, 2);

  return (
    <BounceContext.Provider
      value={{ clickCount, lastClickTime, triggerBounce, bounceIntensity }}
    >
      {children}
    </BounceContext.Provider>
  );
}

export function useBounce() {
  return useContext(BounceContext);
}
