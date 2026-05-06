"use client";

import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useBounce } from "./BounceContext";
import { TrendingUp, AlertCircle, CheckCircle2, Clock, Truck, Zap } from "lucide-react";

/*
 * ════════════════════════════════════════════════════════════
 *  QUALITY + DELIVERY — PLATONIC DESIGN
 *
 *  Jony Ive: "Simplicity is not the absence of clutter.
 *  It is the result of ruthless focus on what matters."
 *
 *  Quality Card:
 *    THE FORM: A near-complete ring = near-perfect quality.
 *    Even a child sees "almost full circle = almost perfect."
 *    The week's health is a pulse — 7 living dots, each one
 *    breathing with the rhythm of that day's inspections.
 *
 *  Delivery Card:
 *    THE FORM: A river of color flowing left to right.
 *    Green = arrived. Yellow = coming. Red = trouble.
 *    The proportion IS the message. No labels needed to
 *    understand at a glance — "mostly green = mostly good."
 *
 *  Both cards CARE about the user. They talk. They breathe.
 *  They bounce when touched. They feel alive.
 * ════════════════════════════════════════════════════════════
 */

interface QualityDay {
  name: string;
  passed: number;
  failed: number;
}

interface DeliveryStatus {
  name: string;
  value: number;
  color: string;
}

interface Props {
  qualityData: QualityDay[];
  deliveryStatusData: DeliveryStatus[];
}

// ─── The Quality Health Ring ─────────────────────────────
// A near-complete ring. The Platonic FORM of "almost perfect."
function QualityRing({
  percent,
  size = 156,
  strokeWidth = 10,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const passOffset = circumference * (1 - percent / 100);
  const gradientId = "quality-ring-grad";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Soft ambient glow behind the ring — warmth */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(48,164,108,0.06) 0%, rgba(48,164,108,0.02) 50%, transparent 70%)`,
          transform: "scale(1.3)",
        }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30A46C" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#30A46C" stopOpacity={0.9} />
          </linearGradient>
        </defs>

        {/* Background ring — barely-there whisper */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.03)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Failed arc — the tiny red gap, visible but not alarming */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5484D"
          strokeWidth={strokeWidth - 2}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * percent / 100}
          opacity={0.25}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * percent / 100 }}
          transition={{ duration: 1.6, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Pass arc — the beautiful green sweep */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: passOffset }}
          transition={{
            duration: 1.4,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.3,
          }}
        />
      </svg>

      {/* Center content — THE ANSWER */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-[2rem] text-[#30A46C] tracking-[-0.03em] leading-none tabular-nums"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.5,
            type: "spring",
            stiffness: 180,
            damping: 20,
          }}
        >
          {percent.toFixed(1)}%
        </motion.span>
        <motion.span
          className="text-[0.625rem] text-muted-foreground/40 mt-1 tracking-[0.02em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          pass rate
        </motion.span>
      </div>
    </div>
  );
}

// ─── Week Pulse Dot ─────────────────────────────────────
// Each dot is a day. Its size = volume. Its color = health.
// When touched, it springs — and so do its neighbors.
function PulseDot({
  day,
  index,
  isHovered,
  isToday,
  bounceAmplitude,
  onHover,
  onClick,
}: {
  day: QualityDay;
  index: number;
  isHovered: boolean;
  isToday: boolean;
  bounceAmplitude: number;
  onHover: (i: number | null) => void;
  onClick: (i: number) => void;
}) {
  const total = day.passed + day.failed;
  const rate = total > 0 ? (day.passed / total) * 100 : 100;

  // Size proportional to volume — more inspections = bigger presence
  const maxTotal = 48;
  const minSize = 28;
  const maxSize = 44;
  const dotSize = minSize + ((total / maxTotal) * (maxSize - minSize));

  // Color communicates health instantly
  const getColor = () => {
    if (rate >= 98) return "#30A46C";
    if (rate >= 95) return "#4EB882";
    if (rate >= 90) return "#7CC9A0";
    if (rate >= 85) return "#FFB224";
    return "#E5484D";
  };

  const getOpacity = () => {
    if (rate >= 98) return 0.85;
    if (rate >= 95) return 0.7;
    if (rate >= 90) return 0.6;
    return 0.75;
  };

  const color = getColor();

  return (
    <motion.div
      className="flex flex-col items-center gap-2.5 cursor-pointer relative"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(index)}
      animate={{
        y: bounceAmplitude > 0 ? [0, -bounceAmplitude, 0] : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 12,
        mass: 0.5,
      }}
    >
      {/* The dot itself */}
      <motion.div
        className="rounded-full relative flex items-center justify-center"
        style={{
          width: dotSize,
          height: dotSize,
          background: color,
          opacity: getOpacity(),
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 15,
        }}
      >
        {/* Inner number — only on hover or if large enough */}
        <motion.span
          className="text-white tabular-nums"
          style={{ fontSize: dotSize > 36 ? "0.625rem" : "0.5rem" }}
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
        >
          {total}
        </motion.span>

        {/* Today's pulse ring */}
        {isToday && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: color }}
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {/* Day label */}
      <motion.span
        className="text-[0.625rem] tabular-nums"
        animate={{
          color: isHovered ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)",
        }}
        transition={{ duration: 0.2 }}
      >
        {day.name}
      </motion.span>

      {/* Hover tooltip — warm, conversational */}
      {isHovered && (
        <motion.div
          className="absolute -top-[72px] left-1/2 bg-white rounded-2xl
            shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)]
            px-4 py-3 z-20 pointer-events-none"
          style={{ transform: "translateX(-50%)" }}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full bg-[#30A46C]" />
              <span className="text-[0.6875rem] text-foreground/70 tabular-nums">{day.passed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[6px] h-[6px] rounded-full bg-[#E5484D]" />
              <span className="text-[0.6875rem] text-foreground/70 tabular-nums">{day.failed}</span>
            </div>
            <span className="text-[0.625rem] text-muted-foreground/40 ml-1">
              {Math.round(rate)}%
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Delivery River ─────────────────────────────────────
// A flowing horizontal bar. Green → Yellow → Red → Blue.
// The proportion IS the message.
function DeliveryRiver({
  data,
  hoveredIndex,
  onHover,
}: {
  data: DeliveryStatus[];
  hoveredIndex: number | null;
  onHover: (i: number | null) => void;
}) {
  return (
    <div className="relative">
      {/* The river bar */}
      <div className="flex h-[16px] rounded-full overflow-hidden bg-black/[0.02]">
        {data.map((item, i) => (
          <motion.div
            key={item.name}
            className="h-full relative cursor-pointer"
            style={{
              background: item.color,
              borderRight: i < data.length - 1 ? "1.5px solid rgba(255,255,255,0.6)" : "none",
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: `${item.value}%`,
              opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 0.75,
            }}
            transition={{
              width: {
                duration: 1,
                delay: i * 0.12,
                ease: [0.25, 0.46, 0.45, 0.94],
              },
              opacity: { duration: 0.3 },
            }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </div>

      {/* Labels beneath each segment */}
      <div className="flex mt-3.5">
        {data.map((item, i) => (
          <motion.div
            key={item.name}
            className="flex flex-col items-center"
            style={{ width: `${item.value}%` }}
            animate={{
              opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.3 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-[0.8125rem] text-foreground/70 tabular-nums leading-none">
              {item.value}%
            </span>
            <span className="text-[0.5625rem] text-muted-foreground/40 mt-1 truncate max-w-full px-0.5 text-center">
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Section ───────────────────────────────────────
export function QualityDeliverySection({ qualityData, deliveryStatusData }: Props) {
  const { addEnergy } = useBounce();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [bounceAmplitudes, setBounceAmplitudes] = useState<number[]>(
    new Array(7).fill(0)
  );
  const [hoveredDelivery, setHoveredDelivery] = useState<number | null>(null);

  // Compute aggregate stats
  const totalPassed = qualityData.reduce((s, d) => s + d.passed, 0);
  const totalFailed = qualityData.reduce((s, d) => s + d.failed, 0);
  const totalInspected = totalPassed + totalFailed;
  const passRate = totalInspected > 0
    ? (totalPassed / totalInspected) * 100
    : 0;

  // Find the best day — the platform celebrates wins
  const bestDay = qualityData.reduce((best, day) => {
    const rate = (day.passed / (day.passed + day.failed)) * 100;
    const bestRate = (best.passed / (best.passed + best.failed)) * 100;
    return rate > bestRate ? day : best;
  }, qualityData[0]);

  const bestDayRate = Math.round(
    (bestDay.passed / (bestDay.passed + bestDay.failed)) * 100
  );

  // Today is Friday (index 4 in Mon-Sun)
  const todayIndex = 4;

  // Bounce ripple — when clicking a dot, neighbors spring
  const handleDotClick = useCallback(
    (index: number) => {
      addEnergy(0.8);

      const newAmplitudes = qualityData.map((_, i) => {
        const distance = Math.abs(i - index);
        if (distance === 0) return 8;
        if (distance === 1) return 5;
        if (distance === 2) return 2.5;
        return 0;
      });

      setBounceAmplitudes(newAmplitudes);

      // Reset after animation
      setTimeout(() => {
        setBounceAmplitudes(new Array(7).fill(0));
      }, 500);
    },
    [addEnergy, qualityData]
  );

  // Delivery hero number
  const onTimePercent = deliveryStatusData.find(d => d.name === "On Time")?.value || 78;
  const delayedCount = deliveryStatusData.find(d => d.name === "Delayed")?.value || 5;

  // Conversational insight for quality
  const getQualityInsight = () => {
    if (passRate >= 95) return "Exceptional quality this week";
    if (passRate >= 90) return "Quality is strong this week";
    if (passRate >= 85) return "Quality is steady — room to improve";
    return "Quality needs attention this week";
  };

  // Conversational insight for delivery
  const getDeliveryInsight = () => {
    if (onTimePercent >= 90) return "Deliveries are flowing smoothly";
    if (onTimePercent >= 75) return "Most deliveries on schedule";
    return "Delivery timing needs attention";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══ Quality Health Card ═══ */}
      <motion.div
        className="bg-card rounded-[1.5rem] p-8 sm:p-9
          shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.03)]
          relative overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Warm green ambient tint at top-right */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(48,164,108,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Header whisper */}
        <motion.p
          className="text-muted-foreground/45 text-[0.6875rem] tracking-[0.05em] uppercase mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Quality Inspections
        </motion.p>

        {/* Hero: Ring + Summary side by side */}
        <div className="flex items-center gap-8 mb-9">
          <QualityRing percent={passRate} />

          <div className="flex-1 min-w-0">
            {/* Human-readable summary */}
            <motion.p
              className="text-[1rem] text-foreground/80 leading-relaxed"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-[#30A46C] tabular-nums">{totalPassed}</span>
              <span className="text-muted-foreground/50"> of </span>
              <span className="text-foreground/60 tabular-nums">{totalInspected}</span>
              <span className="text-muted-foreground/50"> passed</span>
            </motion.p>

            <motion.p
              className="text-[0.75rem] text-muted-foreground/35 mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {totalFailed} need{totalFailed === 1 ? "s" : ""} review this week
            </motion.p>

            {/* Conversational insight — the platform cares */}
            <motion.div
              className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-xl bg-[#30A46C]/[0.04]"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <TrendingUp size={12} className="text-[#30A46C]/50" />
              <span className="text-[0.6875rem] text-[#30A46C]/60">
                {getQualityInsight()}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Week Pulse — 7 living dots */}
        <div>
          <motion.p
            className="text-[0.625rem] text-muted-foreground/30 tracking-[0.04em] uppercase mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            This week's rhythm
          </motion.p>

          <div className="flex items-end justify-between px-2">
            {qualityData.map((day, i) => (
              <PulseDot
                key={day.name}
                day={day}
                index={i}
                isHovered={hoveredDay === i}
                isToday={i === todayIndex}
                bounceAmplitude={bounceAmplitudes[i]}
                onHover={setHoveredDay}
                onClick={handleDotClick}
              />
            ))}
          </div>
        </div>

        {/* Best day celebration — warmth */}
        <motion.div
          className="flex items-center gap-2 mt-7 pt-5 border-t border-black/[0.03]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <CheckCircle2 size={11} className="text-[#30A46C]/40" />
          <span className="text-[0.6875rem] text-muted-foreground/35">
            Best day: <span className="text-foreground/50">{bestDay.name}</span> — {bestDay.passed}/{bestDay.passed + bestDay.failed} passed ({bestDayRate}%)
          </span>
        </motion.div>
      </motion.div>

      {/* ═══ Delivery Performance Card ═══ */}
      <motion.div
        className="bg-card rounded-[1.5rem] p-8 sm:p-9
          shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.03)]
          relative overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Warm blue ambient tint */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(1,113,227,0.03) 0%, transparent 70%)",
          }}
        />

        {/* Header whisper */}
        <motion.p
          className="text-muted-foreground/45 text-[0.6875rem] tracking-[0.05em] uppercase mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Delivery Performance
        </motion.p>

        {/* THE ANSWER — the on-time number dominates */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <motion.span
              className="text-[3.25rem] tracking-[-0.03em] leading-none tabular-nums"
              style={{ color: onTimePercent >= 80 ? "#30A46C" : onTimePercent >= 60 ? "#FFB224" : "#E5484D" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 150,
                damping: 20,
              }}
            >
              {onTimePercent}%
            </motion.span>
            <motion.span
              className="text-[0.875rem] text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              on time today
            </motion.span>
          </div>

          {/* Conversational insight */}
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Truck size={12} className="text-muted-foreground/30" />
            <span className="text-[0.75rem] text-muted-foreground/40">
              {getDeliveryInsight()}
            </span>
          </motion.div>
        </div>

        {/* The River — proportional flow bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <DeliveryRiver
            data={deliveryStatusData}
            hoveredIndex={hoveredDelivery}
            onHover={setHoveredDelivery}
          />
        </motion.div>

        {/* Status breakdown — warm, approachable rows */}
        <div className="mt-8 space-y-1">
          {deliveryStatusData.map((item, i) => {
            const icon = item.name === "On Time"
              ? <CheckCircle2 size={13} />
              : item.name === "Early"
              ? <Zap size={13} />
              : item.name === "Slight Delay"
              ? <Clock size={13} />
              : <AlertCircle size={13} />;

            return (
              <motion.div
                key={item.name}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl
                  hover:bg-black/[0.015] transition-all duration-300 cursor-default"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                onMouseEnter={() => setHoveredDelivery(i)}
                onMouseLeave={() => setHoveredDelivery(null)}
              >
                <span style={{ color: item.color, opacity: 0.5 }}>{icon}</span>
                <span className="flex-1 text-[0.8125rem] text-foreground/65">
                  {item.name}
                </span>
                <span className="text-[0.875rem] text-foreground/70 tabular-nums">
                  {item.value}%
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Attention callout — if there are delays, the platform speaks up */}
        {delayedCount > 0 && (
          <motion.div
            className="flex items-center gap-2.5 mt-5 pt-5 border-t border-black/[0.03]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#E5484D]/[0.06]">
              <AlertCircle size={12} className="text-[#E5484D]/50" />
            </div>
            <span className="text-[0.75rem] text-muted-foreground/45">
              <span className="text-[#E5484D]/60">{delayedCount} deliveries</span> running behind schedule
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}