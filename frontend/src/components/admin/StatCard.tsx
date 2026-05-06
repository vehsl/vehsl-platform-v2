"use client";

import React, { useEffect } from "react";
import { motion, useSpring } from "motion/react";
import { useBounce } from "./BounceContext";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Ambient Sparkline ──────────────────────────────────
// Lives behind the number as a gentle "history whisper"

function AmbientSparkline({
  data,
  color = "#0171E3",
  width = 120,
  height = 48,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height * 0.8 - height * 0.1,
  }));

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `amb-${color.replace("#", "")}`;

  return (
    <svg
      width={width}
      height={height}
      className="absolute bottom-0 right-0 opacity-[0.07]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}

// ─── Mini Inline Sparkline (for visible context) ────────

function InlineSparkline({
  data,
  color = "#0171E3",
}: {
  data: number[];
  color?: string;
}) {
  if (!data || data.length < 2) return null;
  const w = 64;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h * 0.7 - h * 0.15,
  }));

  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      />
    </svg>
  );
}

// ─── Stat Card ──────────────────────────────────────────
// PLATONIC: The number IS the message. Everything else whispers.

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconBg?: string;
  index?: number;
  subtitle?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBg = "bg-secondary",
  index = 0,
  subtitle,
  sparklineData,
  sparklineColor,
  accentColor,
}: StatCardProps) {
  const { lastBounceTime, getIntensity } = useBounce();
  const color = accentColor || sparklineColor || "#0171E3";

  const springScale = useSpring(1, {
    stiffness: 280,
    damping: 22,
    mass: 0.5,
  });

  useEffect(() => {
    if (lastBounceTime > 0) {
      const delay = index * 50;
      const intensity = getIntensity();
      const timeout = setTimeout(() => {
        springScale.set(1 - 0.012 * intensity);
        setTimeout(() => springScale.set(1 + 0.006 * intensity), 120);
        setTimeout(() => springScale.set(1), 280);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [lastBounceTime]);

  const changeIcon = {
    positive: <TrendingUp size={11} />,
    negative: <TrendingDown size={11} />,
    neutral: <Minus size={11} />,
  };

  const changeColors = {
    positive: "text-[#30A46C] bg-[#30A46C]/6",
    negative: "text-[#E5484D] bg-[#E5484D]/6",
    neutral: "text-muted-foreground bg-muted/30",
  };

  return (
    <motion.div
      style={{ scale: springScale }}
      className="relative overflow-hidden rounded-[1.25rem] bg-card p-7 pb-6
        shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]
        hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.05)]
        transition-shadow duration-700 ease-out group"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Ambient sparkline background */}
      {sparklineData && (
        <AmbientSparkline data={sparklineData} color={color} width={140} height={64} />
      )}

      {/* Tiny colored accent dot — not a line, just a hint of identity */}
      <div
        className="w-1.5 h-1.5 rounded-full mb-5 opacity-60"
        style={{ background: color }}
      />

      {/* Label whispers */}
      <p className="text-muted-foreground text-[0.6875rem] tracking-[0.05em] uppercase mb-2">
        {label}
      </p>

      {/* THE NUMBER — this is the entire point */}
      <div className="flex items-baseline gap-3 mb-1.5">
        <motion.p
          className="text-[2.25rem] text-foreground tracking-[-0.02em] leading-none tabular-nums"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {value}
        </motion.p>

        {/* Change badge — flows naturally from the number */}
        {change && (
          <motion.span
            className={`inline-flex items-center gap-1 text-[0.6875rem] px-2 py-0.5 rounded-full ${changeColors[changeType]}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.08 }}
          >
            {changeIcon[changeType]}
            {change}
          </motion.span>
        )}
      </div>

      {/* Subtitle — quiet context */}
      {subtitle && (
        <p className="text-muted-foreground/70 text-[0.6875rem] mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Inline sparkline — tiny, honest, bottom-right */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <InlineSparkline data={sparklineData} color={color} />
        </div>
      )}
    </motion.div>
  );
}

export { AmbientSparkline as Sparkline, InlineSparkline };
