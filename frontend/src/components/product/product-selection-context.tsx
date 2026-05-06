"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { tiers, getTierForQuantity, type Tier } from "./quantity-tiers";

export interface ProductSelection {
  color: number | null;
  size: number | null;
  speed: number | null;
}

export interface DeliveryOption {
  id: string;
  extraCostPerUnit: number; // 0 for sea, 2.10 for air, 3.85 for express
  label?: string;
}

export interface DeliveryLocation {
  type: "address" | "warehouse";
  warehouseId?: string;
  warehouseName?: string;
  warehousePrice?: number; // per week
  distanceFromPort: number; // miles from nearest port
  locationSurcharge: number; // $/unit based on distance
}

interface ProductSelectionContextValue {
  selection: ProductSelection;
  setColor: (i: number) => void;
  setSize: (i: number) => void;
  setSpeed: (i: number) => void;
  // Quantity / tier state (shared so left column can read it)
  selectedTier: Tier | null;
  setSelectedTier: (tier: Tier | null) => void;
  manualQty: string;
  setManualQty: (v: string) => void;
  // Delivery state (shared so left column gauge can reflect delivery cost)
  selectedDelivery: DeliveryOption | null;
  setSelectedDelivery: (d: DeliveryOption | null) => void;
  // Delivery location
  selectedLocation: DeliveryLocation | null;
  setSelectedLocation: (l: DeliveryLocation | null) => void;
  // Mid-order samples
  midOrderSamples: number;
  setMidOrderSamples: (n: number) => void;
}

const Ctx = createContext<ProductSelectionContextValue | null>(null);

export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ProductSelection>({
    color: null,
    size: null,
    speed: null,
  });
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [manualQty, setManualQty] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [midOrderSamples, setMidOrderSamples] = useState<number>(2);

  return (
    <Ctx.Provider
      value={{
        selection,
        setColor: (i) => setSelection((s) => ({ ...s, color: i })),
        setSize: (i) => setSelection((s) => ({ ...s, size: i })),
        setSpeed: (i) => setSelection((s) => ({ ...s, speed: i })),
        selectedTier,
        setSelectedTier,
        manualQty,
        setManualQty,
        selectedDelivery,
        setSelectedDelivery,
        selectedLocation,
        setSelectedLocation,
        midOrderSamples,
        setMidOrderSamples,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProductSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProductSelection must be used within ProductSelectionProvider");
  return ctx;
}