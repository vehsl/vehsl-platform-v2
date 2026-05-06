"use client";

import { useState } from "react";
import { motion } from "motion/react";

/*
 * ════════════════════════════════════════════════════════════
 *  PLATONIC CHARTS
 *  Philosophy: The ANSWER comes first. The chart is support.
 *  Every chart should be understandable from across the room.
 * ════════════════════════════════════════════════════════════
 */

// ─── Custom Area Chart ───────────────────────────────────

interface AreaChartSeries {
  dataKey: string;
  color: string;
  label?: string;
}

interface CustomAreaChartProps {
  data: Record<string, any>[];
  xKey: string;
  series: AreaChartSeries[];
  height?: number;
  yFormatter?: (v: number) => string;
  yDomain?: [number, number];
  showDots?: boolean;
  smoothness?: number;
}

export function CustomAreaChart({
  data,
  xKey,
  series,
  height = 220,
  yFormatter,
  yDomain,
  showDots = false,
  smoothness = 0.35,
}: CustomAreaChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const allValues = data.flatMap((d) =>
    series.map((s) => d[s.dataKey] as number)
  );
  const minVal = yDomain ? yDomain[0] : 0;
  const maxVal = yDomain ? yDomain[1] : Math.max(...allValues) * 1.15;
  const range = maxVal - minVal || 1;

  const padLeft = 52;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 36;
  const chartW = 600;
  const chartH = height;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const getX = (i: number) => padLeft + i * xStep;
  const getY = (val: number) =>
    padTop + innerH - ((val - minVal) / range) * innerH;

  const buildSmoothPath = (key: string) => {
    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(d[key] as number),
    }));
    if (points.length < 2) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * smoothness;
      const cpx2 = curr.x - (curr.x - prev.x) * smoothness;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const buildSmoothAreaPath = (key: string) => {
    const line = buildSmoothPath(key);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottom = padTop + innerH;
    return `${line} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
  };

  const yTicks = 4;
  const yTickValues = Array.from(
    { length: yTicks },
    (_, i) => minVal + (range * i) / (yTicks - 1)
  );
  const formatY = yFormatter || ((v: number) => String(Math.round(v)));

  return (
    <div
      className="w-full relative"
      style={{ aspectRatio: `${chartW}/${chartH}` }}
    >
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        {/* Soft horizontal grid */}
        {yTickValues.map((v, i) => (
          <line
            key={`grid-${i}`}
            x1={padLeft}
            y1={getY(v)}
            x2={chartW - padRight}
            y2={getY(v)}
            stroke="rgba(0,0,0,0.035)"
            strokeWidth={1}
          />
        ))}

        {/* Gradient defs — gentler, wider fade */}
        {series.map((s) => (
          <defs key={`def-${s.dataKey}`}>
            <linearGradient id={`grad-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
              <stop offset="50%" stopColor={s.color} stopOpacity={0.05} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          </defs>
        ))}

        {/* Area fills */}
        {series.map((s, si) => (
          <motion.path
            key={`area-${s.dataKey}`}
            d={buildSmoothAreaPath(s.dataKey)}
            fill={`url(#grad-${s.dataKey})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: si * 0.2 }}
          />
        ))}

        {/* Lines — thinner, more elegant */}
        {series.map((s, si) => (
          <motion.path
            key={`line-${s.dataKey}`}
            d={buildSmoothPath(s.dataKey)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1.4,
              delay: si * 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}

        {/* Dots at data points (always visible, very subtle) */}
        {showDots &&
          series.map((s) =>
            data.map((d, i) => (
              <circle
                key={`pdot-${s.dataKey}-${i}`}
                cx={getX(i)}
                cy={getY(d[s.dataKey] as number)}
                r={2.5}
                fill="white"
                stroke={s.color}
                strokeWidth={1.5}
                opacity={0.6}
              />
            ))
          )}

        {/* Hover detection zones */}
        {data.map((d, i) => (
          <rect
            key={`hover-${i}`}
            x={getX(i) - xStep / 2}
            y={padTop}
            width={xStep}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {/* Hover indicator — soft vertical line */}
        {hover !== null && (
          <line
            x1={getX(hover)}
            y1={padTop}
            x2={getX(hover)}
            y2={padTop + innerH}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={1}
          />
        )}

        {/* Hover dots */}
        {hover !== null &&
          series.map((s) => (
            <g key={`hoverdot-${s.dataKey}`}>
              <circle
                cx={getX(hover)}
                cy={getY(data[hover][s.dataKey] as number)}
                r={7}
                fill={s.color}
                opacity={0.08}
              />
              <circle
                cx={getX(hover)}
                cy={getY(data[hover][s.dataKey] as number)}
                r={4}
                fill="white"
                stroke={s.color}
                strokeWidth={2}
              />
            </g>
          ))}

        {/* Y-axis labels */}
        {yTickValues.map((v, i) => (
          <text
            key={`y-${i}`}
            x={padLeft - 12}
            y={getY(v) + 4}
            textAnchor="end"
            fill="#A0A0A8"
            fontSize={10}
            fontFamily="Urbanist, sans-serif"
          >
            {formatY(v)}
          </text>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`x-${i}`}
            x={getX(i)}
            y={chartH - 10}
            textAnchor="middle"
            fill={hover === i ? "#333" : "#A0A0A8"}
            fontSize={10}
            fontFamily="Urbanist, sans-serif"
            className="transition-colors"
          >
            {d[xKey]}
          </text>
        ))}
      </svg>

      {/* Floating tooltip */}
      {hover !== null && (
        <motion.div
          className="absolute bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] px-4 py-3 text-[0.75rem] whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${(getX(hover) / chartW) * 100}%`,
            top: `${(padTop / chartH) * 100}%`,
            transform: "translate(-50%, -115%)",
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-foreground/70 mb-1.5 text-[0.6875rem]">
            {data[hover][xKey]}
          </div>
          {series.map((s) => (
            <div key={s.dataKey} className="flex items-center gap-2.5 py-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-muted-foreground">
                {s.label || s.dataKey}
              </span>
              <span className="text-foreground ml-auto tabular-nums">
                {formatY(data[hover][s.dataKey] as number)}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Custom Bar Chart ───────────────────────────────────

interface BarSeries {
  dataKey: string;
  color: string;
  label?: string;
}

interface CustomBarChartProps {
  data: Record<string, any>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  stacked?: boolean;
  yFormatter?: (v: number) => string;
}

export function CustomBarChart({
  data,
  xKey,
  series,
  height = 180,
  stacked = false,
  yFormatter,
}: CustomBarChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  let maxVal: number;
  if (stacked) {
    maxVal =
      Math.max(
        ...data.map((d) =>
          series.reduce((sum, s) => sum + (d[s.dataKey] as number), 0)
        )
      ) * 1.1;
  } else {
    const allValues = data.flatMap((d) =>
      series.map((s) => d[s.dataKey] as number)
    );
    maxVal = Math.max(...allValues) * 1.1;
  }

  const barW = stacked ? 32 : 16;
  const chartH = height;
  const formatY = yFormatter || ((v: number) => String(Math.round(v)));

  return (
    <div className="relative" style={{ height: chartH + 40 }}>
      {/* Soft grid */}
      <div className="absolute left-0 right-0 top-0 bottom-[40px] flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-black/[0.03] w-full" />
        ))}
      </div>

      {/* Bars */}
      <div
        className="flex items-end justify-around px-2"
        style={{ height: chartH }}
      >
        {data.map((d, i) => (
          <div
            key={d[xKey]}
            className="flex flex-col items-center relative cursor-pointer"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {/* Tooltip */}
            {hover === i && (
              <motion.div
                className="absolute -top-[52px] left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] px-3 py-2 text-[0.6875rem] whitespace-nowrap z-10"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                {series.map((s) => (
                  <div key={s.dataKey} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="text-muted-foreground">
                      {s.label || s.dataKey}:
                    </span>
                    <span className="text-foreground tabular-nums">
                      {formatY(d[s.dataKey])}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {stacked ? (
              <div
                className="flex flex-col-reverse items-center"
                style={{ width: barW }}
              >
                {series.map((s, si) => {
                  const h =
                    ((d[s.dataKey] as number) / maxVal) * (chartH - 16);
                  return (
                    <motion.div
                      key={s.dataKey}
                      style={{
                        width: barW,
                        background: s.color,
                        borderRadius:
                          si === series.length - 1 ? "8px 8px 0 0" : "0",
                        opacity: hover !== null && hover !== i ? 0.5 : 0.85,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: h }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.04 + si * 0.08,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-end gap-[3px]">
                {series.map((s, si) => {
                  const h =
                    ((d[s.dataKey] as number) / maxVal) * (chartH - 16);
                  return (
                    <motion.div
                      key={s.dataKey}
                      className="rounded-t-[8px]"
                      style={{
                        width: barW,
                        background: s.color,
                        opacity: hover !== null && hover !== i ? 0.45 : 0.8,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: h }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.04 + si * 0.08,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-around mt-4 px-2">
        {data.map((d, i) => (
          <span
            key={d[xKey]}
            className={`text-[0.6875rem] text-center transition-colors duration-300 ${
              hover === i ? "text-foreground" : "text-muted-foreground/50"
            }`}
          >
            {d[xKey]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Donut Chart ──────────────────────────────────
// PLATONIC: The center number IS the answer.

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface CustomDonutChartProps {
  data: DonutData[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  thickness?: number;
}

export function CustomDonutChart({
  data,
  size = 160,
  centerLabel,
  centerValue,
  thickness,
}: CustomDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = thickness ? outerR - thickness : size * 0.3;
  let cumulative = 0;

  const arcs = data.map((item, idx) => {
    const startAngle = (cumulative / total) * 360 - 90;
    cumulative += item.value;
    const endAngle = (cumulative / total) * 360 - 90;
    const gap = 3; // bigger gaps = cleaner segments
    const adjustedStart = startAngle + gap / 2;
    const adjustedEnd = endAngle - gap / 2;

    const startRad = (adjustedStart * Math.PI) / 180;
    const endRad = (adjustedEnd * Math.PI) / 180;

    const scale = hoveredIndex === idx ? 1.03 : 1;
    const effectiveOuterR = outerR * scale;

    const x1 = cx + effectiveOuterR * Math.cos(startRad);
    const y1 = cy + effectiveOuterR * Math.sin(startRad);
    const x2 = cx + effectiveOuterR * Math.cos(endRad);
    const y2 = cy + effectiveOuterR * Math.sin(endRad);
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArc = adjustedEnd - adjustedStart > 180 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${effectiveOuterR} ${effectiveOuterR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      `Z`,
    ].join(" ");

    return { ...item, d, idx };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <motion.path
            key={arc.name}
            d={arc.d}
            fill={arc.color}
            opacity={
              hoveredIndex !== null && hoveredIndex !== arc.idx ? 0.35 : 0.85
            }
            onMouseEnter={() => setHoveredIndex(arc.idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer transition-opacity duration-300"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity:
                hoveredIndex !== null && hoveredIndex !== arc.idx ? 0.35 : 0.85,
            }}
            transition={{
              duration: 0.7,
              delay: arc.idx * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </svg>
      {/* Center — THE ANSWER */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredIndex !== null ? (
            <>
              <span className="text-[1.5rem] text-foreground tracking-tight leading-none tabular-nums">
                {Math.round((data[hoveredIndex].value / total) * 100)}%
              </span>
              <span className="text-[0.625rem] text-muted-foreground mt-1">
                {data[hoveredIndex].name}
              </span>
            </>
          ) : (
            <>
              {centerValue && (
                <span className="text-[1.5rem] text-foreground tracking-tight leading-none">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-[0.625rem] text-muted-foreground mt-1">
                  {centerLabel}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Custom Gauge Chart ─────────────────────────────────

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  segments?: { color: string; value: number }[];
}

export function GaugeChart({
  value,
  max = 100,
  size = 160,
  color = "#0171E3",
  label,
  sublabel,
}: GaugeChartProps) {
  const cx = size / 2;
  const cy = size * 0.55;
  const radius = size * 0.42;
  const strokeW = size * 0.07;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const percent = Math.min(value / max, 1);

  const polarToCart = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, r: number) => {
    const s = polarToCart(start, r);
    const e = polarToCart(end, r);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const gradientId = `gauge-g-${color.replace("#", "")}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg width={size} height={size * 0.65} overflow="visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.9} />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle, radius)}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* Value arc */}
          <motion.path
            d={describeArc(
              startAngle,
              startAngle + totalArc * percent,
              radius
            )}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            className="text-[2rem] text-foreground tracking-tight leading-none tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
            <span className="text-[0.875rem] text-muted-foreground">%</span>
          </motion.span>
        </div>
      </div>
      {label && (
        <p className="text-[0.8125rem] text-foreground mt-1">{label}</p>
      )}
      {sublabel && (
        <p className="text-[0.625rem] text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

// ─── Horizontal Bar List ─────────────────────────────────
// PLATONIC: Each bar tells its own story at a glance

interface HBarData {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}

export function HorizontalBarList({
  data,
  maxValue,
  valueFormatter,
}: {
  data: HBarData[];
  maxValue?: number;
  valueFormatter?: (v: number) => string;
}) {
  // Safety check for undefined data
  if (!data || data.length === 0) {
    return null;
  }
  
  const max = maxValue || Math.max(...data.map((d) => d.value));
  const fmt = valueFormatter || ((v: number) => String(v));

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              {item.icon}
              <span className="text-[0.8125rem] text-foreground">
                {item.label}
              </span>
            </div>
            <span className="text-[0.8125rem] text-foreground tabular-nums">
              {fmt(item.value)}
            </span>
          </div>
          <div className="h-[6px] bg-black/[0.03] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: item.color, opacity: 0.75 }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{
                duration: 0.9,
                delay: i * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Mini Metric Card ───────────────────────────────────
// Simple, honest. The number speaks.

export function MiniMetric({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}) {
  const changeColors = {
    positive: "text-[#30A46C]",
    negative: "text-[#E5484D]",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="p-5 rounded-2xl bg-black/[0.015] border border-black/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.6875rem] text-muted-foreground/70 uppercase tracking-[0.04em]">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/40">{icon}</span>}
      </div>
      <p className="text-[1.5rem] text-foreground tracking-tight leading-none tabular-nums">
        {value}
      </p>
      {change && (
        <p className={`text-[0.6875rem] mt-2 ${changeColors[changeType]}`}>
          {change}
        </p>
      )}
    </div>
  );
}