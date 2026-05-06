"use client";

import { motion } from "motion/react";
import { Leaf } from "lucide-react";
import { useBounce } from "./bounce-context";
import { useProductSelection } from "./product-selection-context";

const deliveryOptions = [
  {
    id: "sea",
    title: "Sea Freight",
    time: "30–40 days",
    description: "Best value for large orders",
    extraCost: null,
    extraCostPerUnit: 0,
    co2PerUnit: 0.012, // kg CO2 per unit
    co2Label: "12g",
    co2Level: "low" as const,
  },
  {
    id: "air",
    title: "Air Freight",
    time: "7–12 days",
    description: "Fast delivery worldwide",
    extraCost: "+$2.10",
    extraCostPerUnit: 2.10,
    co2PerUnit: 0.602,
    co2Label: "602g",
    co2Level: "medium" as const,
  },
  {
    id: "express",
    title: "Express Air",
    time: "3–5 days",
    description: "Fastest possible",
    extraCost: "+$3.85",
    extraCostPerUnit: 3.85,
    co2PerUnit: 1.105,
    co2Label: "1.1kg",
    co2Level: "high" as const,
  },
];

const co2Accent = {
  low: "#34c759",
  medium: "#f5a623",
  high: "#e8503a",
};

export function DeliverySection() {
  const { selectedDelivery, setSelectedDelivery } = useProductSelection();
  const { triggerBounce } = useBounce();

  return (
    <div className="flex flex-col gap-4">
      <h3
        style={{
          fontFamily: "'Urbanist', sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: "#2c2c2e",
          letterSpacing: "-0.4px",
        }}
      >
        Select Delivery Solution
      </h3>

      <div className="flex flex-col gap-2.5">
        {deliveryOptions.map((option) => {
          const isSelected = selectedDelivery?.id === option.id;
          const accent = co2Accent[option.co2Level];

          return (
            <motion.button
              key={option.id}
              onClick={() => {
                setSelectedDelivery({ id: option.id, extraCostPerUnit: option.extraCostPerUnit });
                triggerBounce("delivery");
                triggerBounce("price");
              }}
              className="cursor-pointer flex items-center gap-4 text-left w-full transition-all duration-200 overflow-hidden relative"
              style={{
                padding: "16px 20px",
                borderRadius: 22,
                backgroundColor: isSelected ? "rgba(211, 227, 253, 0.3)" : "#f9f8f5",
                border: isSelected
                  ? "1.6px solid #0171e3"
                  : "1.6px solid #eff1f2",
              }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Subtle left accent bar for emission level */}
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: 3,
                  backgroundColor: accent,
                  borderRadius: "22px 0 0 22px",
                  opacity: 0.8,
                }}
              />

              {/* Radio circle */}
              <div
                className="shrink-0 rounded-[9px]"
                style={{
                  width: 18,
                  height: 18,
                  border: isSelected
                    ? "4.8px solid #0171e3"
                    : "1.6px solid #c7c7cc",
                  borderRadius: 9,
                }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#202425",
                    }}
                  >
                    {option.title}
                  </span>
                  <span
                    className="shrink-0"
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8e8e93",
                    }}
                  >
                    {option.time}
                  </span>
                </div>
                <div className="flex items-center gap-1.5" style={{ marginTop: 3 }}>
                  <p
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#aeaeb2",
                    }}
                  >
                    {option.description}
                  </p>
                  <span style={{ color: "#d1d1d6", fontSize: 10 }}>·</span>
                  <Leaf size={10} strokeWidth={2} style={{ color: accent, opacity: 0.9 }} />
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: accent,
                      opacity: 0.85,
                    }}
                  >
                    {option.co2Label}
                  </span>
                </div>
              </div>

              {/* Extra cost */}
              {option.extraCost && (
                <span
                  className="shrink-0"
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#c0695a",
                  }}
                >
                  {option.extraCost}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
