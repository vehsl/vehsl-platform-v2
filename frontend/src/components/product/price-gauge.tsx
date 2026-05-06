"use client";

import { motion } from "motion/react";
import svgPaths from "./imports/svg-0nwbbbsmcr";

interface PriceGaugeProps {
  price: number;
  totalUnits: number;
  /** 0–1 progress toward best price (1 = lowest price tier) */
  progress?: number;
}

export function PriceGauge({ price, totalUnits, progress = 0 }: PriceGaugeProps) {
  // Rotate the ring based on progress — 0° at worst price, 270° at best
  const ringRotation = progress * 270;

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: 220, height: 220 }}>
        {/* Background ring — faint */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 366 366"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: 0.18 }}
        >
          <path d={svgPaths.pfe70180} fill="#d4d4d4" />
        </svg>

        {/* Active gradient ring with clip based on progress */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: ringRotation }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          style={{ originX: "50%", originY: "50%" }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 366 366"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="gaugeGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fdc3bf" />
                <stop offset="30%" stopColor="#56d7ea" />
                <stop offset="70%" stopColor="#ccefa8" />
                <stop offset="85%" stopColor="#e8ecf8" />
                <stop offset="100%" stopColor="#f4f6fc" />
              </linearGradient>
            </defs>
            <path d={svgPaths.pfe70180} fill="url(#gaugeGrad1)" />
          </svg>
        </motion.div>

        {/* Center content — stays static */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={`${price}-${totalUnits}`}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center"
          >
            <span
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: 44,
                fontWeight: 600,
                color: "#1a1a1a",
                letterSpacing: "0.12px",
                lineHeight: 1,
              }}
            >
              ${price.toFixed(1)}
            </span>
            <motion.span
              key={totalUnits}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#4d4d4d",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {totalUnits > 0 ? `per unit · ${totalUnits.toLocaleString()} pcs` : "per unit"}
            </motion.span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
