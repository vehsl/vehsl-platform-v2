// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

/*
 * BOUNCE SYSTEM — Organic Physics
 * 
 * The platform should feel ALIVE. When you click, nearby elements
 * respond like ripples in water. The more you interact, the more
 * the system "wakes up" — but always gently, never intrusively.
 * 
 * Energy builds logarithmically: the first clicks barely register,
 * but sustained interaction creates a warm, responsive environment.
 * Energy decays smoothly over time, like a pendulum finding rest.
 */

interface BounceState {
  energy: number;
  lastBounceTime: number;
  clickCount: number;
  addEnergy: (amount?: number) => void;
  getIntensity: () => number;
  getClickCount: () => number;
}

const BounceContext = createContext<BounceState>({
  energy: 0,
  lastBounceTime: 0,
  clickCount: 0,
  addEnergy: () => {},
  getIntensity: () => 1,
  getClickCount: () => 0,
});

export function BounceProvider({ children }: { children: React.ReactNode }) {
  const [energy, setEnergy] = useState(0);
  const [lastBounceTime, setLastBounceTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const energyRef = useRef(0);
  const clickRef = useRef(0);
  const decayTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const addEnergy = useCallback((amount: number = 1) => {
    // Accumulate energy
    energyRef.current = Math.min(energyRef.current + amount, 10);
    clickRef.current += 1;
    setEnergy(energyRef.current);
    setClickCount(clickRef.current);
    setLastBounceTime(Date.now());

    // Clear existing decay timer
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);

    // Smooth decay — energy fades like a heartbeat slowing
    const decay = () => {
      energyRef.current = Math.max(0, energyRef.current * 0.7 - 0.05);
      setEnergy(energyRef.current);
      if (energyRef.current > 0.01) {
        decayTimerRef.current = setTimeout(decay, 800);
      } else {
        energyRef.current = 0;
        setEnergy(0);
      }
    };
    decayTimerRef.current = setTimeout(decay, 2500);
  }, []);

  const getIntensity = useCallback(() => {
    // Logarithmic scaling: subtle at first, grows meaningfully
    // Range: ~1.0 (no energy) to ~1.6 (max sustained interaction)
    return Math.min(1 + Math.log(energyRef.current + 1) * 0.15, 1.6);
  }, []);

  const getClickCount = useCallback(() => {
    return clickRef.current;
  }, []);

  return (
    <BounceContext.Provider
      value={{ energy, lastBounceTime, clickCount, addEnergy, getIntensity, getClickCount }}
    >
      {children}
    </BounceContext.Provider>
  );
}

export function useBounce() {
  return useContext(BounceContext);
}
