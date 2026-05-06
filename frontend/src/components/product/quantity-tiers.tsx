"use client";

import { motion } from "motion/react";
import { useBounce } from "./bounce-context";

export interface Tier {
  id: string;
  price: number;
  units: number;
  minUnits: number;
  label: string;
  isLowest?: boolean;
}

const tiers: Tier[] = [
  { id: "single", price: 17.9, units: 10, minUnits: 1, label: "10 units" },
  { id: "carton", price: 17.5, units: 80, minUnits: 80, label: "4 Cartons (80 units)" },
  { id: "pallet", price: 16.9, units: 240, minUnits: 240, label: "Full pallet (12 cartons)" },
  { id: "container20", price: 16.4, units: 1440, minUnits: 1440, label: "Full container load (20ft)" },
  { id: "container40", price: 16.1, units: 2880, minUnits: 2880, label: "Full container load (HC 40ft)", isLowest: true },
];

/** Find the tier that matches a given quantity */
export function getTierForQuantity(qty: number): Tier {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (qty >= tiers[i].minUnits) return tiers[i];
  }
  return tiers[0];
}

interface QuantityTiersProps {
  selectedTierId: string;
  onSelectTier: (tier: Tier) => void;
}

export function QuantityTiers({ selectedTierId, onSelectTier }: QuantityTiersProps) {
  const { triggerBounce } = useBounce();

  return (
    <div
      className="flex flex-col gap-0 overflow-hidden"
      style={{
        backgroundColor: "rgba(254, 217, 251, 0.55)",
        borderRadius: 25,
        padding: "22px 22px",
        boxShadow: "0px 4px 15px rgba(254, 217, 251, 0.35)",
      }}
    >
      <div className="flex flex-col gap-3.5">
        {tiers.map((tier) => {
          const isSelected = selectedTierId === tier.id;

          return (
            <motion.button
              key={tier.id}
              onClick={() => {
                onSelectTier(tier);
                triggerBounce("tier");
              }}
              className="flex items-center gap-3 text-left cursor-pointer group"
              whileTap={{ scale: 0.98 }}
            >
              {/* Radio indicator */}
              <div
                className="shrink-0 transition-all duration-200"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: isSelected ? 30 : 5,
                  backgroundColor: isSelected
                    ? "rgba(0, 0, 0, 0.9)"
                    : "rgba(229, 195, 227, 0.9)",
                }}
              />

              {/* Label */}
              <div
                className="flex items-baseline gap-1.5 min-w-0"
                style={{ fontFamily: "'Urbanist', sans-serif" }}
              >
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#000",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${tier.price.toFixed(1)}
                </span>
                <span
                  className="truncate"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#000",
                  }}
                >
                  – {tier.isLowest ? "Lowest price per unit" : tier.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export { tiers };
