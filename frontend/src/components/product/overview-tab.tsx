"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  Leaf,
  Truck,
  Headphones,
  RefreshCw,
  Monitor,
  Laptop,
  Smartphone,
  Gamepad2,
  TabletSmartphone,
  HardDrive,
  Check,
} from "lucide-react";

/* ───────────────────────────────────────────────────── *
 *  Scannable text: <K> = key phrase (black),
 *  everything else renders as warm light gray.
 *  Users scan only the dark words and still get the idea.
 * ───────────────────────────────────────────────────── */

const MUTED = "#c4c4c7";
const KEY = "#1d1d1f";

function K({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: KEY, fontWeight: 600 }}>{children}</span>
  );
}

/* ───── Real-life scenario cards ─────────────────────── */

/* ── Micro-animation: Charging pulse ───────────────── */
function ChargingVisual() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Battery bar with traveling shimmer */}
      <div className="relative h-7 rounded-full overflow-hidden" style={{ backgroundColor: "#f0f0f3" }}>
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: "50%", backgroundColor: "#34c75920" }}
        />
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-y-0 w-16 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #34c75930, transparent)",
          }}
          animate={{ left: ["-10%", "55%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
        />
        {/* Segment markers */}
        <div className="absolute inset-0 flex items-center px-1 gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-3.5 rounded-full overflow-hidden">
              {i <= 2 ? (
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#34c759" }}
                  animate={{ opacity: [0.6, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.2,
                  }}
                />
              ) : (
                <div className="h-full rounded-full" style={{ backgroundColor: "#e8e8ed" }} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, color: "#86868b" }}>0%</span>
        <motion.span
          style={{ fontSize: 13, fontWeight: 700, color: "#34c759" }}
          animate={{ opacity: [0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        >
          50% in 28 min
        </motion.span>
        <span style={{ fontSize: 11, color: "#c4c4c7" }}>100%</span>
      </div>
    </div>
  );
}

/* ── Micro-animation: Data transfer packets ────────── */
function TransferVisual() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Track with flying packets */}
      <div className="relative h-8 rounded-full overflow-hidden" style={{ backgroundColor: "#f0f0f3" }}>
        {/* Track line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-3 right-3 h-px"
          style={{ backgroundColor: "#0071e320" }}
        />
        {/* Packets */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 6 + (i % 2) * 3,
              height: 6 + (i % 2) * 3,
              backgroundColor: "#0071e3",
              opacity: 0.4 + (i % 3) * 0.2,
            }}
            animate={{ left: ["-4%", "104%"] }}
            transition={{
              duration: 1.6 + i * 0.15,
              repeat: Infinity,
              delay: i * 0.35,
              ease: "linear",
            }}
          />
        ))}
        {/* Source & destination icons */}
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "#0071e318" }}
          >
            <HardDrive size={10} style={{ color: "#0071e3" }} />
          </div>
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "#0071e318" }}
          >
            <Laptop size={10} style={{ color: "#0071e3" }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "#0071e314", color: "#0071e3", fontSize: 12, fontWeight: 600 }}
          animate={{ scale: [1, 1.04] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          <Zap size={12} /> 80 Gbps
        </motion.div>
        <ArrowRight size={14} style={{ color: "#c4c4c7" }} />
        <span style={{ fontSize: 12, color: "#86868b" }}>25× faster than USB 3.0</span>
      </div>
    </div>
  );
}

/* ── Micro-animation: Durability flex ──────────────── */
function DurabilityVisual() {
  const materialLayers = [
    { name: "Braided nylon", color: "#1d1d1f" },
    { name: "Kevlar core", color: "#fbbc04" },
    { name: "24AWG copper", color: "#ff9500" },
  ];

  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Cable cross-section with breathing rings */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 flex items-center justify-center">
          {materialLayers.map((layer, i) => (
            <motion.div
              key={layer.name}
              className="absolute rounded-full border-2"
              style={{
                borderColor: layer.color + "60",
                width: 54 - i * 14,
                height: 54 - i * 14,
              }}
              animate={{ scale: [1, 1.08] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.3,
              }}
            />
          ))}
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#ff9500" }}
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {materialLayers.map((layer) => (
            <div key={layer.name} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              <span style={{ fontSize: 11.5, fontWeight: 500, color: "#6e6e73" }}>
                {layer.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Bend counter */}
      <div className="flex items-center gap-2">
        <motion.div
          className="h-1 rounded-full"
          style={{ width: 40, backgroundColor: "#34c759" }}
          animate={{ scaleX: [0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        />
        <span style={{ fontSize: 11, color: "#86868b" }}>
          Tested to 20,000+ flex cycles
        </span>
      </div>
    </div>
  );
}

const scenarios = [
  {
    emoji: "⚡",
    headline: "MacBook Pro, 0 → 50% in 28 min",
    body: "240W of power delivery means even the hungriest laptops charge at full speed. One cable for everything you own.",
    Visual: ChargingVisual,
  },
  {
    emoji: "🎬",
    headline: "A 4K movie. ~6 seconds.",
    body: "80 Gbps is fast enough that you'll wonder if it actually copied. Thunderbolt 4/5 compatible — no adapters needed.",
    Visual: TransferVisual,
  },
  {
    emoji: "🧬",
    headline: "20,000 bends. Still perfect.",
    body: "Kevlar-reinforced core wrapped in braided nylon. This cable will outlast the devices you plug it into.",
    Visual: DurabilityVisual,
  },
];

/* ───── Compatibility ────────────────────────────────── */

const devices = [
  { icon: <Laptop size={18} />, name: "MacBook" },
  { icon: <TabletSmartphone size={18} />, name: "iPad" },
  { icon: <Smartphone size={18} />, name: "iPhone 15+" },
  { icon: <Smartphone size={18} />, name: "Samsung" },
  { icon: <Gamepad2 size={18} />, name: "Switch" },
  { icon: <Gamepad2 size={18} />, name: "Steam Deck" },
  { icon: <Monitor size={18} />, name: "Displays" },
  { icon: <HardDrive size={18} />, name: "Hubs & docks" },
];

/* ───── "What's inside" layers ───────────────────────── */

const layers = [
  { name: "Outer braid", detail: "Braided nylon resists tangling and abrasion", pct: 100, color: "#1d1d1f" },
  { name: "Kevlar reinforcement", detail: "Military-grade tensile strength", pct: 78, color: "#fbbc04" },
  { name: "Shielding", detail: "Triple-layer EMI protection", pct: 56, color: "#86868b" },
  { name: "Copper conductors", detail: "24 AWG high-purity for low resistance", pct: 34, color: "#ff9500" },
];

/* ───── Trust strip ──────────────────────────────────── */

const trust = [
  { icon: <ShieldCheck size={15} />, label: "Verified seller" },
  { icon: <Award size={15} />, label: "USB-IF certified" },
  { icon: <Leaf size={15} />, label: "RoHS compliant" },
  { icon: <Truck size={15} />, label: "Ships in 2-3 days" },
  { icon: <Headphones size={15} />, label: "24/7 support" },
  { icon: <RefreshCw size={15} />, label: "30-day returns" },
];

/* ═══════════════════════════════════════════════════════ */

export function OverviewTab() {
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-20">
      {/* ── 1. The scannable pitch ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[760px]"
      >
        <p style={{ fontSize: 22, lineHeight: 1.75, color: MUTED, letterSpacing: "-0.01em" }}>
          This is a <K>USB-C cable</K> that can <K>charge anything at 240W</K>,{" "}
          <K>transfer data at 80 Gbps</K>, and{" "}
          <K>survive 20,000+ bends</K>. It{"'"}s built with{" "}
          <K>Kevlar-reinforced braided nylon</K> and certified by the{" "}
          <K>USB Implementers Forum</K>. In plain English:{" "}
          <K>plug it in and forget about it.</K>
        </p>
      </motion.div>

      {/* ── 2. "In real life, that means…" ────────────── */}
      <div className="flex flex-col gap-5">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ fontSize: 13, fontWeight: 600, color: "#86868b", letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          In real life, that means
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s, i) => {
            const isOpen = expandedScenario === i;
            return (
              <motion.div
                key={s.headline}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => setExpandedScenario(isOpen ? null : i)}
                className="relative flex flex-col p-6 rounded-[24px] cursor-pointer transition-colors duration-300 self-start"
                style={{
                  backgroundColor: isOpen ? "#fafafa" : "#f8f8fa",
                  border: isOpen ? "1px solid #e8e8ed" : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: 32, lineHeight: 1 }}>{s.emoji}</span>
                <p
                  className="mt-4"
                  style={{ fontSize: 17, fontWeight: 600, color: "#1d1d1f", lineHeight: 1.35 }}
                >
                  {s.headline}
                </p>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p
                        className="mt-3"
                        style={{ fontSize: 14, lineHeight: 1.6, color: "#6e6e73" }}
                      >
                        {s.body}
                      </p>
                      <s.Visual />
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isOpen && (
                  <p className="mt-2" style={{ fontSize: 12, color: "#aeaeb2" }}>
                    Tap to learn more
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 3. "What's inside" — cross-section ────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-5"
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#86868b",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          What{"'"}s inside
        </p>

        <div className="flex flex-col gap-3">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              {/* Bar */}
              <div className="relative h-8 rounded-full overflow-hidden" style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${layer.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                  style={{ backgroundColor: layer.color + "18" }}
                />
                <div className="absolute inset-0 flex items-center px-4 justify-between">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
                    {layer.name}
                  </span>
                  <span style={{ fontSize: 12, color: "#86868b" }}>
                    {layer.detail}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 4. Compatibility — "Works with everything" ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-8"
      >
        {/* Device icon river — no cards, just icons and names breathing in space */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13.5,
              fontWeight: 500,
              color: "#aeaeb2",
              lineHeight: 1.5,
              marginRight: 4,
            }}
          >
            Works with
          </p>
          {devices.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-2"
            >
              <span className="text-[#c7c7cc]">{d.icon}</span>
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 13.5,
                  fontWeight: 550,
                  color: "#6e6e73",
                }}
              >
                {d.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 6. Trust strip — minimal horizontal ───────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "#f5f4f1",
          padding: "14px 20px",
        }}
      >
        <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar">
          {trust.map((t, i) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 shrink-0"
            >
              <span style={{ color: "#b0b0b5", display: "flex" }}>{t.icon}</span>
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 550,
                  color: "#8e8e93",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </span>
              {i < trust.length - 1 && (
                <span style={{ color: "#d8d8dc", marginLeft: 8, marginRight: 2, fontSize: 14 }}>|</span>
              )}
            </span>
          ))}
        </div>
      </motion.div>

    </div>
  );
}