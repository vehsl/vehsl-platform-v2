"use client";

import React from "react";
import { motion } from "motion/react";

/*
 * PLATONIC ProgressRing
 * Clean. Honest. The percentage IS the information.
 * No glow filters, no gradients fighting for attention.
 * Just a ring, a number, and meaning through color.
 */

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
  showGradient?: boolean;
}

export function ProgressRing({
  value,
  max = 100,
  size = 140,
  strokeWidth = 8,
  color = "#0171E3",
  bgColor = "#f0f0f0",
  label,
  sublabel,
  showGradient = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / max, 1);
  const offset = circumference * (1 - percent);
  const gradientId = `ring-g-${color.replace("#", "")}`;

  // Semantic color — the ring color carries meaning
  const getSemanticColor = () => {
    if (percent >= 0.8) return "#30A46C";
    if (percent >= 0.5) return color;
    if (percent >= 0.3) return "#FFB224";
    return "#E5484D";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={1} />
              </linearGradient>
            </defs>
          )}

          {/* Background ring — whisper thin */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.5}
          />

          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={showGradient ? `url(#${gradientId})` : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.4,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2,
            }}
          />
        </svg>

        {/* Center number — THE ANSWER */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-[1.75rem] tracking-tight leading-none tabular-nums"
            style={{ color: getSemanticColor() }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.4,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            {Math.round(percent * 100)}%
          </motion.span>
        </div>
      </div>
      {label && <p className="text-[0.8125rem] text-foreground">{label}</p>}
      {sublabel && (
        <p className="text-[0.625rem] text-muted-foreground -mt-1.5">
          {sublabel}
        </p>
      )}
    </div>
  );
}
