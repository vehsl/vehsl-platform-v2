"use client";

import { motion } from "motion/react";
import { TrendingDown, Package, Truck, Shield } from "lucide-react";
import { useBounce } from "./bounce-context";

const tiers = [
  { min: 1, max: 49, price: 18.5, label: "1-49 pcs" },
  { min: 50, max: 199, price: 16.2, label: "50-199 pcs" },
  { min: 200, max: 999, price: 14.8, label: "200-999 pcs" },
  { min: 1000, max: null, price: 12.5, label: "1000+ pcs" },
];

export function PricingSection() {
  const { cartCount } = useBounce();

  const currentTier = tiers.find(
    (t) => cartCount >= t.min && (t.max === null || cartCount <= t.max)
  ) || tiers[0];

  const maxPrice = tiers[0].price;
  const savingsPercent = Math.round(((maxPrice - currentTier.price) / maxPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-[28px] bg-gradient-to-br from-[#f8f8fa] to-[#f0f0f3] p-8 md:p-10"
    >
      <div className="flex flex-col gap-8">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            Volume Pricing
          </h2>
          <p className="text-[#86868b] mt-1" style={{ fontSize: 15 }}>
            Better prices as you order more
          </p>
        </div>

        {/* Price Tiers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiers.map((tier, i) => {
            const isActive = currentTier === tier;
            return (
              <motion.div
                key={tier.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`flex flex-col items-center py-6 px-4 rounded-[20px] transition-all duration-300 ${
                  isActive
                    ? "bg-[#0071e3] text-white shadow-[0_8px_24px_rgba(0,113,227,0.25)]"
                    : "bg-white"
                }`}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: isActive ? "white" : "#1d1d1f",
                  }}
                >
                  ${tier.price}
                </span>
                <span
                  className="mt-1"
                  style={{
                    fontSize: 13,
                    color: isActive ? "rgba(255,255,255,0.7)" : "#86868b",
                  }}
                >
                  {tier.label}
                </span>
                {i > 0 && (
                  <span
                    className="mt-2 px-2.5 py-0.5 rounded-full"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#34c759" + "15",
                      color: isActive ? "white" : "#34c759",
                    }}
                  >
                    Save {Math.round(((maxPrice - tier.price) / maxPrice) * 100)}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current Summary */}
        {savingsPercent > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#34c759]/8 w-fit"
          >
            <TrendingDown size={16} className="text-[#34c759]" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#34c759" }}>
              You're saving {savingsPercent}% with {cartCount} pieces
            </span>
          </motion.div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Package size={18} />, text: "Custom packaging available" },
            { icon: <Truck size={18} />, text: "Free shipping over 100 pcs" },
            { icon: <Shield size={18} />, text: "Quality guaranteed" },
          ].map((benefit) => (
            <div key={benefit.text} className="flex items-center gap-3">
              <span className="text-[#86868b]">{benefit.icon}</span>
              <span className="text-[#424245]" style={{ fontSize: 13 }}>{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
