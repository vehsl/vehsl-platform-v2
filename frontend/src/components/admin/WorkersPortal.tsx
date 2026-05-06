"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, Clock, MapPin, Package, Shield, Truck,
  AlertTriangle, Camera, ChevronRight, Star, Zap, Timer,
  ThumbsUp, ArrowRight, ClipboardCheck, CircleDot, Circle,
  Route, Eye, Play, Pause, Phone, Navigation, Anchor,
  Plane, ShoppingBag, Beaker, ArrowUpRight, ArrowDownRight,
  User, Check, ChevronDown, X, MoreHorizontal, Hash
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { ProgressRing } from "./ProgressRing";
import { BounceButton } from "./BounceButton";

/* ════════════════════════════════════════════════════════════
 *  WORKERS PORTAL — PLATONIC WORKDAY
 *
 *  The driver's day is a journey — not a list.
 *
 *  Three flows, three colors, one glance:
 *    🟡 SAMPLES — Pick up from sellers for QC
 *    🔵 ORDERS  — Pick up fulfilled orders from sellers
 *    🟢 DELIVERIES — Deliver port/airport arrivals to buyers
 *
 *  The most urgent task is UNMISSABLE.
 *  The next task is CLEAR.
 *  Everything else is CALM.
 *
 *  A child should look at this and know what to do next.
 * ═══════════════════════════════════════════════════════════ */

type WorkerRole = "driver" | "inspector" | "packaging";

// ─── TASK TYPES ────────────────────────────────────────────

interface DriverTask {
  id: number;
  flow: "sample" | "order" | "delivery";
  title: string;
  subtitle: string;
  address: string;
  time: string;
  priority: "urgent" | "normal" | "low";
  status: "active" | "upcoming" | "completed";
  items: number;
  contact: { name: string; phone: string };
  notes?: string;
  eta?: string;
  origin?: string; // port/airport name
  orderRef?: string;
  verificationCode?: string; // buyer release code
}

const flowConfig = {
  sample: {
    label: "Sample Pickup",
    description: "Collect from seller for quality check",
    color: "#D97706",
    bg: "bg-[#D97706]",
    bgSoft: "bg-[#D97706]/6",
    icon: <Beaker size={16} />,
    iconLg: <Beaker size={20} />,
  },
  order: {
    label: "Order Pickup",
    description: "Collect fulfilled orders from seller",
    color: "#0171E3",
    bg: "bg-[#0171E3]",
    bgSoft: "bg-[#0171E3]/6",
    icon: <ShoppingBag size={16} />,
    iconLg: <ShoppingBag size={20} />,
  },
  delivery: {
    label: "Buyer Delivery",
    description: "Deliver port/airport arrivals to buyer",
    color: "#30A46C",
    bg: "bg-[#30A46C]",
    bgSoft: "bg-[#30A46C]/6",
    icon: <Truck size={16} />,
    iconLg: <Truck size={20} />,
  },
};

const priorityConfig = {
  urgent: { color: "#E5484D", bg: "bg-[#E5484D]/6", label: "Urgent", textColor: "text-[#E5484D]/80" },
  normal: { color: "#FFB224", bg: "bg-[#FFB224]/6", label: "Normal", textColor: "text-[#D97706]/80" },
  low: { color: "#30A46C", bg: "bg-[#30A46C]/6", label: "Low", textColor: "text-[#30A46C]/80" },
};

// ─── DRIVER TASKS DATA ─────────────────────────────────────

const driverTasks: DriverTask[] = [
  {
    id: 1, flow: "delivery", title: "Deliver to Meridian Corp (Buyer)",
    subtitle: "Container from Mumbai Port — HS 8518.30",
    address: "145 Commerce St, Chicago, IL",
    time: "9:00 AM", priority: "urgent", status: "active", items: 12,
    contact: { name: "James Rodriguez", phone: "+1 312-555-0148" },
    origin: "Mumbai Port — Vessel: MSC Harmony",
    orderRef: "ORD-4821",
    eta: "12 min away",
    notes: "Fragile electronics — handle with care. Buyer expects before 10:30 AM.",
    verificationCode: "ABC123",
  },
  {
    id: 2, flow: "sample", title: "Pickup Samples from GreenLeaf Organics",
    subtitle: "Herbal Tea batch #284 — QC testing required",
    address: "78 Market Ave, Evanston, IL",
    time: "11:00 AM", priority: "urgent", status: "upcoming", items: 3,
    contact: { name: "Priya Sharma", phone: "+1 847-555-0237" },
    orderRef: "SMP-1042",
    notes: "Collect 3 sample packets (250g each). Temperature-controlled — keep below 25°C.",
  },
  {
    id: 3, flow: "order", title: "Pickup Order from BrightStar Electronics",
    subtitle: "LED Panel Light shipment — 50 units confirmed",
    address: "2201 Tech Blvd, Naperville, IL",
    time: "1:00 PM", priority: "normal", status: "upcoming", items: 50,
    contact: { name: "David Chen", phone: "+1 630-555-0192" },
    orderRef: "ORD-4835",
    notes: "Seller has packed and labeled. Verify count before signing.",
  },
  {
    id: 4, flow: "delivery", title: "Deliver to FreshPack HQ (Buyer)",
    subtitle: "Air freight from Narita Airport — Supplements",
    address: "900 Industrial Pkwy, Aurora, IL",
    time: "3:00 PM", priority: "low", status: "upcoming", items: 8,
    contact: { name: "Lisa Park", phone: "+1 630-555-0384" },
    origin: "Narita Airport — Flight: NH812",
    orderRef: "ORD-4840",
    verificationCode: "XR7-491",
  },
  {
    id: 5, flow: "sample", title: "Pickup Samples from Atlas Materials",
    subtitle: "Composite Sheet material test — Lab analysis",
    address: "1500 Research Dr, Schaumburg, IL",
    time: "4:30 PM", priority: "low", status: "upcoming", items: 2,
    contact: { name: "Robert Kim", phone: "+1 847-555-0461" },
    orderRef: "SMP-1058",
  },
];

// Inspector & packaging tasks (kept simpler)
const inspectorTasks = [
  { id: 1, type: "inspection", title: "Inspect Herbal Tea Batch #284", seller: "GreenLeaf Organics", time: "9:00 AM", priority: "urgent" as const, status: "active" as const, checkpoints: 8, completed: 5 },
  { id: 2, type: "sample", title: "Review LED Panel Samples", seller: "BrightStar Electronics", time: "10:30 AM", priority: "urgent" as const, status: "upcoming" as const, checkpoints: 12, completed: 0 },
  { id: 3, type: "inspection", title: "Quality Audit — Protein Bars", seller: "FreshPack Foods", time: "1:00 PM", priority: "normal" as const, status: "upcoming" as const, checkpoints: 10, completed: 0 },
  { id: 4, type: "sample", title: "Material Test — Composite Sheet", seller: "Atlas Materials", time: "3:00 PM", priority: "low" as const, status: "upcoming" as const, checkpoints: 6, completed: 0 },
];

interface PackagingTask {
  id: number;
  packType: "custom" | "standard" | "fragile" | "temperature";
  title: string;
  order: string;
  buyer: string;
  time: string;
  priority: "urgent" | "normal" | "low";
  status: "active" | "upcoming" | "completed";
  totalUnits: number;
  packedUnits: number;
  steps: { id: number; label: string; done: boolean }[];
  materials: string[];
  specialInstructions?: string;
  destination: string;
  weight: string;
  dimensions: string;
}

const packTypeConfig = {
  custom: { label: "Custom Box", color: "#D97706", icon: <Star size={14} /> },
  standard: { label: "Standard", color: "#3B82F6", icon: <Package size={14} /> },
  fragile: { label: "Fragile", color: "#E5484D", icon: <AlertTriangle size={14} /> },
  temperature: { label: "Temp Control", color: "#8B5CF6", icon: <Beaker size={14} /> },
};

const packagingTasks: PackagingTask[] = [
  {
    id: 1, packType: "custom", title: "Premium Tea Gift Set",
    order: "ORD-4821", buyer: "Meridian Corp · James Rodriguez",
    time: "9:00 AM", priority: "urgent", status: "active",
    totalUnits: 24, packedUnits: 9,
    steps: [
      { id: 1, label: "Inspect items for damage", done: true },
      { id: 2, label: "Wrap each unit in tissue paper", done: true },
      { id: 3, label: "Place in branded gift box", done: true },
      { id: 4, label: "Add thank-you card & ribbon", done: false },
      { id: 5, label: "Seal with holographic sticker", done: false },
      { id: 6, label: "Apply shipping label & QR", done: false },
      { id: 7, label: "Photo verification", done: false },
    ],
    materials: ["Tissue paper (white)", "Gift box 30×20×12 cm", "Satin ribbon (gold)", "Thank-you cards", "Holographic seal stickers", "Shipping labels"],
    specialInstructions: "Buyer requested handwritten note in each box: 'Thank you for your partnership.' Use the calligraphy pen.",
    destination: "Chicago, IL → Meridian Corp HQ",
    weight: "1.2 kg/unit",
    dimensions: "30 × 20 × 12 cm",
  },
  {
    id: 2, packType: "fragile", title: "Borosilicate Glass Vials",
    order: "ORD-4824", buyer: "BioLab Solutions · Dr. Sarah Kim",
    time: "10:30 AM", priority: "urgent", status: "upcoming",
    totalUnits: 15, packedUnits: 0,
    steps: [
      { id: 1, label: "Inspect each vial for micro-cracks", done: false },
      { id: 2, label: "Wrap individually in foam sleeve", done: false },
      { id: 3, label: "Place in molded tray insert", done: false },
      { id: 4, label: "Fill gaps with anti-static peanuts", done: false },
      { id: 5, label: "Seal inner box with tamper tape", done: false },
      { id: 6, label: "Place in outer carton with FRAGILE labels (4 sides)", done: false },
      { id: 7, label: "Apply orientation arrows ↑ (all sides)", done: false },
      { id: 8, label: "Photo verification", done: false },
    ],
    materials: ["Foam sleeves (small)", "Molded tray insert 15-slot", "Anti-static peanuts", "Tamper-evident tape", "FRAGILE stickers (red)", "Orientation arrows ↑", "Outer carton 40×30×20 cm"],
    specialInstructions: "FRAGILE — Lab-grade glass. Zero tolerance for breakage. Double-box required. Do NOT stack. Apply orientation arrows to ALL 4 sides.",
    destination: "Aurora, IL → BioLab Solutions",
    weight: "0.3 kg/unit",
    dimensions: "40 × 30 × 20 cm (outer)",
  },
  {
    id: 3, packType: "standard", title: "LED Panel Lights",
    order: "ORD-4822", buyer: "BrightStar Electronics · David Chen",
    time: "12:00 PM", priority: "normal", status: "upcoming",
    totalUnits: 50, packedUnits: 0,
    steps: [
      { id: 1, label: "Verify count: 50 units", done: false },
      { id: 2, label: "Stack in standard carton (10/box)", done: false },
      { id: 3, label: "Seal and label each carton", done: false },
      { id: 4, label: "Palletize — 5 cartons per pallet", done: false },
      { id: 5, label: "Stretch wrap pallet", done: false },
      { id: 6, label: "Photo verification", done: false },
    ],
    materials: ["Standard carton 60×40×30 cm (×5)", "Packing tape", "Shipping labels", "Stretch wrap"],
    destination: "Naperville, IL → BrightStar HQ",
    weight: "2.4 kg/unit",
    dimensions: "60 × 40 × 30 cm per carton",
  },
  {
    id: 4, packType: "temperature", title: "Organic Matcha Powder",
    order: "ORD-4825", buyer: "FreshPack Foods · Lisa Park",
    time: "2:00 PM", priority: "normal", status: "upcoming",
    totalUnits: 80, packedUnits: 0,
    steps: [
      { id: 1, label: "Check cold-chain temp log (≤ 18°C)", done: false },
      { id: 2, label: "Place units in insulated liner", done: false },
      { id: 3, label: "Add gel ice packs (2 per box)", done: false },
      { id: 4, label: "Seal insulated liner", done: false },
      { id: 5, label: "Place in outer carton", done: false },
      { id: 6, label: "Apply TEMP-SENSITIVE labels", done: false },
      { id: 7, label: "Photo verification", done: false },
    ],
    materials: ["Insulated liners (×8)", "Gel ice packs (×16)", "Outer carton 50×35×25 cm (×8)", "TEMP SENSITIVE labels", "Temp logger device"],
    specialInstructions: "Must stay below 18°C. Attach temp logger to first carton. Coordinate with driver for immediate cold-chain pickup.",
    destination: "Evanston, IL → FreshPack Cold Storage",
    weight: "0.5 kg/unit",
    dimensions: "50 × 35 × 25 cm per carton",
  },
];

// ─── COMPONENT ─────────────────────────────────────────────

export function WorkersPortal() {
  const [activeRole, setActiveRole] = useState<WorkerRole>("driver");
  const [checkedIn, setCheckedIn] = useState(true);
  const [tasks, setTasks] = useState(driverTasks);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filterFlow, setFilterFlow] = useState<"all" | "sample" | "order" | "delivery">("all");

  const activeTask = tasks.find(t => t.status === "active");
  const upcomingTasks = tasks.filter(t => t.status === "upcoming");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const filteredUpcoming = filterFlow === "all" ? upcomingTasks : upcomingTasks.filter(t => t.flow === filterFlow);

  const completeTask = (id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status: "completed" as const } : t);
      // Auto-promote next upcoming to active
      const hasActive = updated.some(t => t.status === "active");
      if (!hasActive) {
        const nextIdx = updated.findIndex(t => t.status === "upcoming");
        if (nextIdx >= 0) updated[nextIdx] = { ...updated[nextIdx], status: "active" };
      }
      return updated;
    });
  };

  const roleConfig = {
    driver: { label: "Driver", icon: <Truck size={18} />, color: "#3B82F6", iconBg: "bg-[#3B82F6]/8", greeting: "Your journey is planned. Here's what matters most." },
    inspector: { label: "Inspector", icon: <ClipboardCheck size={18} />, color: "#0171E3", iconBg: "bg-[#0171E3]/8", greeting: "Inspections and quality checks are queued." },
    packaging: { label: "Packaging", icon: <Package size={18} />, color: "#D97706", iconBg: "bg-[#D97706]/8", greeting: "Items are queued for packaging." },
  };

  const currentConfig = roleConfig[activeRole];
  const totalTasks = tasks.length;
  const doneTasks = completedTasks.length;

  return (
    <div className="space-y-8 max-w-[1100px]">
      {/* ═══ PERSONAL HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">My Workday</h1>
          <p className="text-muted-foreground text-[0.875rem]">{currentConfig.greeting}</p>
        </div>
        <BounceButton
          variant={checkedIn ? "success" : "primary"}
          size="md"
          onClick={() => setCheckedIn(!checkedIn)}
          icon={checkedIn ? <CheckCircle2 size={16} /> : <Play size={16} />}
          energyWeight={3}
        >
          {checkedIn ? "Checked In" : "Check In"}
        </BounceButton>
      </motion.div>

      {/* ═══ ROLE SWITCHER ═══ */}
      <div className="bg-card rounded-3xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 inline-flex gap-1.5">
        {(Object.keys(roleConfig) as WorkerRole[]).map((role) => {
          const config = roleConfig[role];
          return (
            <motion.button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[0.8125rem] transition-all duration-300 cursor-pointer ${
                activeRole === role
                  ? "bg-card shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={{ scale: 0.97 }}
              style={activeRole === role ? { color: config.color } : {}}
            >
              {config.icon}
              <span>{config.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══ DRIVER VIEW ═══ */}
      {activeRole === "driver" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="driver"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats — What matters at a glance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {/* HERO stat — the driver's #1 question: "How far along am I?" */}
              <div className="col-span-2">
                <StatCard
                  label="Today's Journey"
                  value={`${doneTasks} / ${totalTasks}`}
                  icon={<Route size={20} className="text-[#3B82F6]" />}
                  iconBg="bg-[#3B82F6]/8"
                  index={0}
                  subtitle={`${totalTasks - doneTasks} stops remaining`}
                  accentColor="#3B82F6"
                />
              </div>
              {/* Supporting context — useful but not the primary focus */}
              <StatCard
                label="Shift Time"
                value="3h 24m"
                icon={<Timer size={20} className="text-[#30A46C]" />}
                iconBg="bg-[#30A46C]/8"
                index={1}
                subtitle="Started at 8:00 AM"
                accentColor="#30A46C"
              />
              <StatCard
                label="Performance"
                value="4.8"
                change="Top 10%"
                changeType="positive"
                icon={<Star size={20} className="text-[#FFB224]" />}
                iconBg="bg-[#FFB224]/8"
                index={2}
                subtitle="Based on last 30 days"
                sparklineData={[4.2, 4.3, 4.5, 4.6, 4.7, 4.7, 4.8]}
                sparklineColor="#FFB224"
                accentColor="#FFB224"
              />
            </div>

            {/* Flow Legend — Understand task types instantly */}
            <div className="flex items-center gap-4 px-2">
              {(["sample", "order", "delivery"] as const).map(flow => {
                const cfg = flowConfig[flow];
                const count = tasks.filter(t => t.flow === flow && t.status !== "completed").length;
                return (
                  <div key={flow} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[0.75rem] text-muted-foreground/50">{cfg.label}</span>
                    {count > 0 && (
                      <span className="text-[0.625rem] tabular-nums px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}12`, color: `${cfg.color}99` }}>{count}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ═══ ACTIVE TASK — THE HERO ═══ */}
            {activeTask && (
              <motion.div
                className="relative bg-card rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-2"
                style={{ borderColor: `${flowConfig[activeTask.flow].color}30` }}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Flow color bar — instant visual identification */}
                <div className="h-1.5 w-full" style={{ backgroundColor: flowConfig[activeTask.flow].color }} />

                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${flowConfig[activeTask.flow].color}10` }}>
                        <span style={{ color: flowConfig[activeTask.flow].color }}>{flowConfig[activeTask.flow].icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <StatusPill status="info" label="Active" pulse />
                          <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${flowConfig[activeTask.flow].color}10`, color: `${flowConfig[activeTask.flow].color}bb` }}>
                            {flowConfig[activeTask.flow].label}
                          </span>
                        </div>
                        <p className="text-[0.6875rem] text-muted-foreground/35 mt-0.5">{activeTask.orderRef}</p>
                      </div>
                    </div>
                    {activeTask.eta && (
                      <motion.div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#30A46C]/8 text-[#30A46C]"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Navigation size={11} />
                        <span className="text-[0.75rem] tabular-nums">{activeTask.eta}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Title & subtitle */}
                  <h2 className="text-foreground tracking-tight text-[1.125rem] mb-1">{activeTask.title}</h2>
                  <p className="text-muted-foreground text-[0.8125rem] mb-4">{activeTask.subtitle}</p>

                  {/* Info grid — compact 2-column layout */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/12 text-[0.75rem]">
                      <MapPin size={12} className="text-muted-foreground/40 flex-shrink-0" />
                      <span className="text-foreground/55 truncate">{activeTask.address}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/12 text-[0.75rem]">
                      <Clock size={12} className="text-muted-foreground/40 flex-shrink-0" />
                      <span className="text-foreground/55">{activeTask.time}</span>
                      <span className="text-muted-foreground/25 mx-1">·</span>
                      <Package size={12} className="text-muted-foreground/40 flex-shrink-0" />
                      <span className="text-foreground/55">{activeTask.items}</span>
                    </div>
                    {activeTask.origin && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/8 text-[0.75rem]">
                        {activeTask.origin.toLowerCase().includes("port") ? (
                          <Anchor size={12} className="text-[#30A46C]/45 flex-shrink-0" />
                        ) : (
                          <Plane size={12} className="text-[#30A46C]/45 flex-shrink-0" />
                        )}
                        <span className="text-foreground/50 truncate">{activeTask.origin}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${priorityConfig[activeTask.priority].bg}`}>
                      <AlertTriangle size={11} style={{ color: priorityConfig[activeTask.priority].color }} />
                      <span className="text-[0.75rem]" style={{ color: priorityConfig[activeTask.priority].color }}>{priorityConfig[activeTask.priority].label} Priority</span>
                    </div>
                  </div>

                  {/* Notes — subtle inline */}
                  {activeTask.notes && (
                    <div className="px-3 py-2.5 rounded-lg bg-[#FFB224]/[0.03] border border-[#FFB224]/8 mb-4">
                      <p className="text-[0.75rem] text-foreground/50 leading-relaxed">{activeTask.notes}</p>
                    </div>
                  )}

                  {/* Verification Code + Contact — side by side */}
                  <div className={`grid ${activeTask.verificationCode && activeTask.flow === "delivery" ? "grid-cols-2" : "grid-cols-1"} gap-2.5 mb-5`}>
                    {/* Buyer Verification Code */}
                    {activeTask.verificationCode && activeTask.flow === "delivery" && (
                      <motion.div
                        className="relative px-3.5 py-3 rounded-xl overflow-hidden"
                        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(139,92,246,0.08) 100%)" }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <div className="absolute inset-0 rounded-xl border border-[#8B5CF6]/12" />
                        <div className="relative">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Shield size={11} className="text-[#8B5CF6]/50" />
                            <span className="text-[0.5625rem] text-[#8B5CF6]/50 uppercase tracking-widest">Release Code</span>
                          </div>
                          <div className="flex items-center gap-[3px]">
                            {activeTask.verificationCode.split("").map((char, i) => (
                              <motion.span
                                key={i}
                                className="w-[26px] h-[30px] rounded-md bg-[#8B5CF6]/[0.08] flex items-center justify-center text-[0.875rem] text-[#8B5CF6]"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 + i * 0.04, type: "spring", stiffness: 500, damping: 22 }}
                                style={{ fontFamily: "monospace", fontWeight: 600 }}
                              >
                                {char}
                              </motion.span>
                            ))}
                          </div>
                          <p className="text-[0.5625rem] text-muted-foreground/30 mt-1.5">Ask buyer before release</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Contact */}
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-muted/8">
                      <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-primary/45" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.75rem] text-foreground/55 truncate">{activeTask.contact.name}</p>
                        <p className="text-[0.625rem] text-muted-foreground/30">{activeTask.contact.phone}</p>
                      </div>
                      <BounceButton variant="secondary" size="sm" icon={<Phone size={11} />}>Call</BounceButton>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5">
                    <BounceButton variant="primary" size="lg" icon={<Route size={16} />} energyWeight={2} className="flex-1">
                      Navigate
                    </BounceButton>
                    <BounceButton variant="success" size="lg" icon={<CheckCircle2 size={16} />} energyWeight={5} onClick={() => completeTask(activeTask.id)} className="flex-1">
                      Complete
                    </BounceButton>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No active task state */}
            {!activeTask && tasks.every(t => t.status === "completed") && (
              <motion.div
                className="bg-card rounded-3xl p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 text-center"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#30A46C]/8 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-[#30A46C]" />
                </div>
                <h3 className="text-foreground/70 tracking-tight mb-2">All tasks completed!</h3>
                <p className="text-muted-foreground/50 text-[0.875rem]">Great work today. Head back to base.</p>
              </motion.div>
            )}

            {/* ═══ UPCOMING TASKS ═══ */}
            {filteredUpcoming.length > 0 && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-foreground tracking-tight">Coming Up</h3>
                    <span className="text-[0.75rem] text-muted-foreground/40">{filteredUpcoming.length} stops</span>
                  </div>
                  {/* Flow filter chips */}
                  <div className="flex gap-1.5">
                    {(["all", "sample", "order", "delivery"] as const).map(f => (
                      <motion.button
                        key={f}
                        onClick={() => setFilterFlow(f)}
                        className={`px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer transition-all ${
                          filterFlow === f
                            ? f === "all" ? "bg-primary/8 text-primary" : `text-white`
                            : "text-muted-foreground/40 hover:text-foreground/50 hover:bg-muted/15"
                        }`}
                        style={filterFlow === f && f !== "all" ? { backgroundColor: flowConfig[f].color } : {}}
                        whileTap={{ scale: 0.95 }}
                      >
                        {f === "all" ? "All" : flowConfig[f].label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Journey progress — where am I? */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/[0.03] border border-primary/8 mb-5">
                  <div className="flex items-center gap-1">
                    {tasks.map((t, idx) => {
                      const isCompleted = t.status === "completed";
                      const isActive = t.status === "active";
                      const tCfg = flowConfig[t.flow];
                      return (
                        <React.Fragment key={t.id}>
                          {idx > 0 && (
                            <div className={`w-4 h-[2px] rounded-full ${isCompleted || isActive ? "bg-primary/25" : "bg-muted-foreground/10"}`} />
                          )}
                          <motion.div
                            className={`flex items-center justify-center rounded-full flex-shrink-0 ${isActive ? "w-7 h-7" : "w-5 h-5"}`}
                            style={{
                              backgroundColor: isCompleted ? `${tCfg.color}15` : isActive ? `${tCfg.color}10` : "transparent",
                              border: isActive ? `2px solid ${tCfg.color}` : !isCompleted ? "1.5px solid rgba(0,0,0,0.06)" : "none",
                            }}
                            animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                            transition={isActive ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : {}}
                            title={t.title}
                          >
                            {isCompleted ? (
                              <Check size={10} style={{ color: tCfg.color }} />
                            ) : isActive ? (
                              <CircleDot size={12} style={{ color: tCfg.color }} />
                            ) : (
                              <Circle size={8} className="text-muted-foreground/20" />
                            )}
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[0.6875rem] text-primary/50">Stop</span>
                    <span className="text-[0.8125rem] text-primary tabular-nums">{completedTasks.length + 1}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/30">of {tasks.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredUpcoming.map((task, i) => {
                    const cfg = flowConfig[task.flow];
                    const isExpanded = expandedTask === task.id;
                    const taskIndex = tasks.findIndex(t => t.id === task.id);
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-2xl border border-border/30 overflow-hidden hover:border-border/60 transition-all"
                      >
                        <motion.button
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer group"
                          whileTap={{ scale: 0.995 }}
                        >
                          {/* Flow indicator + stop number */}
                          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}10` }}>
                            <span style={{ color: cfg.color }}>{cfg.icon}</span>
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-card border border-border/40 flex items-center justify-center text-[0.5625rem] text-muted-foreground/50 tabular-nums shadow-sm">
                              {taskIndex + 1}
                            </span>
                          </div>

                          {/* Time */}
                          <div className="w-[70px] flex-shrink-0">
                            <p className="text-[0.875rem] text-foreground/60 tabular-nums">{task.time}</p>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.875rem] text-foreground/65 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[0.6875rem]" style={{ color: `${cfg.color}99` }}>{cfg.label}</span>
                              <span className="text-[0.5rem] text-muted-foreground/20">|</span>
                              <span className="text-[0.6875rem] text-muted-foreground/35">{task.items} items</span>
                              {task.orderRef && (
                                <>
                                  <span className="text-[0.5rem] text-muted-foreground/20">|</span>
                                  <span className="text-[0.6875rem] text-muted-foreground/30 tabular-nums">{task.orderRef}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Priority */}
                          <StatusPill
                            status={task.priority === "urgent" ? "error" : task.priority === "normal" ? "warning" : "success"}
                            label={priorityConfig[task.priority].label}
                          />

                          <ChevronDown size={14} className={`text-muted-foreground/25 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </motion.button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/20 mt-0">
                                <p className="text-[0.8125rem] text-muted-foreground/45 pt-3">{task.subtitle}</p>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/12 text-[0.75rem]">
                                    <MapPin size={12} className="text-muted-foreground/40" />
                                    <span className="text-foreground/55 truncate">{task.address}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/12 text-[0.75rem]">
                                    <Clock size={12} className="text-muted-foreground/40" />
                                    <span className="text-foreground/55">{task.time}</span>
                                    <span className="text-muted-foreground/20 mx-0.5">·</span>
                                    <Package size={12} className="text-muted-foreground/40" />
                                    <span className="text-foreground/55">{task.items} items</span>
                                  </div>
                                  {task.origin && (
                                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl col-span-2" style={{ backgroundColor: `${cfg.color}06`, border: `1px solid ${cfg.color}15` }}>
                                      {task.origin.toLowerCase().includes("port") ? <Anchor size={12} style={{ color: `${cfg.color}80` }} /> : <Plane size={12} style={{ color: `${cfg.color}80` }} />}
                                      <span className="text-[0.75rem]" style={{ color: `${cfg.color}99` }}>{task.origin}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Verification code for deliveries */}
                                {task.verificationCode && task.flow === "delivery" && (
                                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#8B5CF6]/[0.04] border border-[#8B5CF6]/10">
                                    <Shield size={12} className="text-[#8B5CF6]/45" />
                                    <span className="text-[0.6875rem] text-muted-foreground/35">Release Code</span>
                                    <span className="text-[0.8125rem] text-[#8B5CF6] tabular-nums tracking-[0.1em] ml-auto" style={{ fontFamily: "monospace" }}>{task.verificationCode}</span>
                                  </div>
                                )}

                                {task.notes && (
                                  <div className="px-3 py-2.5 rounded-xl bg-[#FFB224]/[0.04] border border-[#FFB224]/10">
                                    <p className="text-[0.8125rem] text-foreground/50">{task.notes}</p>
                                  </div>
                                )}

                                {/* Contact */}
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/8">
                                  <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center">
                                    <User size={12} className="text-primary/50" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[0.8125rem] text-foreground/55">{task.contact.name}</p>
                                    <p className="text-[0.625rem] text-muted-foreground/30">{task.contact.phone}</p>
                                  </div>
                                  <BounceButton variant="secondary" size="sm" icon={<Phone size={11} />}>Call</BounceButton>
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <BounceButton variant="primary" size="sm" icon={<Route size={13} />}>Navigate</BounceButton>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed today */}
            {completedTasks.length > 0 && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
                <div className="flex items-center gap-2.5 mb-4">
                  <CheckCircle2 size={16} className="text-[#30A46C]/50" />
                  <h3 className="text-foreground/50 tracking-tight">Completed</h3>
                  <span className="text-[0.75rem] text-muted-foreground/30">{completedTasks.length}</span>
                </div>
                <div className="space-y-1.5">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/8 opacity-60">
                      <CheckCircle2 size={14} className="text-[#30A46C]/50 flex-shrink-0" />
                      <span className="text-[0.8125rem] text-muted-foreground/50 flex-1 line-through">{task.title}</span>
                      <span className="text-[0.6875rem] text-muted-foreground/25">{task.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5">
              {/* Primary — most used */}
              <BounceButton
                variant="secondary"
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl flex-1 sm:flex-none"
                icon={<span style={{ color: "#3B82F6" }}><Camera size={18} /></span>}
              >
                <span className="text-[0.8125rem]">Take Photo</span>
              </BounceButton>
              <BounceButton
                variant="secondary"
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl flex-1 sm:flex-none"
                icon={<span style={{ color: "#30A46C" }}><Phone size={18} /></span>}
              >
                <span className="text-[0.8125rem]">Call Support</span>
              </BounceButton>
              {/* Secondary — less frequent */}
              <BounceButton
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl opacity-70 hover:opacity-100 transition-opacity"
                icon={<span style={{ color: "#D97706" }}><Pause size={15} /></span>}
              >
                <span className="text-[0.75rem]">Break</span>
              </BounceButton>
              {/* Tertiary — rare / emergency */}
              <BounceButton
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl opacity-50 hover:opacity-100 transition-opacity"
                icon={<span style={{ color: "#E5484D" }}><AlertTriangle size={15} /></span>}
                energyWeight={3}
              >
                <span className="text-[0.75rem]">Report Issue</span>
              </BounceButton>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ═══ INSPECTOR VIEW ═══ */}
      {activeRole === "inspector" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="inspector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard label="Inspections" value={`0 / ${inspectorTasks.length}`} icon={<ClipboardCheck size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} subtitle={`${inspectorTasks.length} remaining`} accentColor="#0171E3" />
              <StatCard label="Performance" value="4.8" change="Top 10%" changeType="positive" icon={<Star size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={1} subtitle="Last 30 days" sparklineData={[4.2, 4.3, 4.5, 4.6, 4.7, 4.7, 4.8]} sparklineColor="#FFB224" accentColor="#FFB224" />
              <StatCard label="Shift Time" value="3h 24m" icon={<Timer size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} subtitle="Started at 8:00 AM" accentColor="#30A46C" />
            </div>

            {/* Active inspection */}
            <motion.div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-2 border-[#0171E3]/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0171E3]" />
              <StatusPill status="info" label="Currently Active" pulse />
              <div className="mt-4 space-y-4">
                <h3 className="text-foreground tracking-tight">{inspectorTasks[0].title}</h3>
                <p className="text-muted-foreground text-[0.8125rem]">{inspectorTasks[0].seller}</p>
                <div className="flex items-center gap-6">
                  <ProgressRing value={inspectorTasks[0].completed} max={inspectorTasks[0].checkpoints} size={80} strokeWidth={6} color="#0171E3" />
                  <div>
                    <p className="text-[0.875rem] text-foreground/60">{inspectorTasks[0].completed} of {inspectorTasks[0].checkpoints} checkpoints</p>
                    <p className="text-[0.75rem] text-muted-foreground/40 mt-1">{inspectorTasks[0].checkpoints - inspectorTasks[0].completed} remaining</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <BounceButton variant="primary" size="md" icon={<ClipboardCheck size={16} />} energyWeight={2}>Continue</BounceButton>
                  <BounceButton variant="secondary" size="md" icon={<Camera size={16} />}>Photo</BounceButton>
                  <BounceButton variant="warning" size="md" icon={<AlertTriangle size={16} />} energyWeight={3}>Flag Issue</BounceButton>
                </div>
              </div>
            </motion.div>

            {/* Upcoming */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
              <h3 className="text-foreground tracking-tight mb-5">Coming Up</h3>
              <div className="space-y-2">
                {inspectorTasks.slice(1).map((task, i) => (
                  <motion.div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/15 transition-all cursor-pointer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="w-[70px] flex-shrink-0"><p className="text-[0.8125rem] text-foreground/60">{task.time}</p></div>
                    <Circle size={10} className="text-muted-foreground/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.875rem] text-foreground/65 truncate">{task.title}</p>
                      <p className="text-[0.75rem] text-muted-foreground/35 mt-0.5">{task.seller}</p>
                    </div>
                    <StatusPill status={task.priority === "urgent" ? "error" : task.priority === "normal" ? "warning" : "success"} label={priorityConfig[task.priority].label} />
                    <ChevronRight size={14} className="text-muted-foreground/25" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ═══ PACKAGING VIEW ═══ */}
      {activeRole === "packaging" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="packaging"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard label="Today's Queue" value={`${packagingTasks[0].packedUnits} / ${packagingTasks.reduce((s, t) => s + t.totalUnits, 0)}`} icon={<Package size={20} className="text-[#D97706]" />} iconBg="bg-[#D97706]/8" index={0} subtitle={`${packagingTasks.length} orders to pack`} accentColor="#D97706" />
              <StatCard label="Performance" value="4.8" change="Top 10%" changeType="positive" icon={<Star size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={1} subtitle="Last 30 days" sparklineData={[4.2, 4.3, 4.5, 4.6, 4.7, 4.7, 4.8]} sparklineColor="#FFB224" accentColor="#FFB224" />
              <StatCard label="Shift Time" value="3h 24m" icon={<Timer size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} subtitle="Started at 8:00 AM" accentColor="#30A46C" />
            </div>

            {/* Packaging type legend */}
            <div className="flex items-center gap-4 px-2">
              {(Object.keys(packTypeConfig) as (keyof typeof packTypeConfig)[]).map(pt => {
                const cfg = packTypeConfig[pt];
                const count = packagingTasks.filter(t => t.packType === pt && t.status !== "completed").length;
                return (
                  <div key={pt} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[0.75rem] text-muted-foreground/50">{cfg.label}</span>
                    {count > 0 && (
                      <span className="text-[0.625rem] tabular-nums px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}12`, color: `${cfg.color}99` }}>{count}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ═══ ACTIVE PACKAGING — THE HERO ═══ */}
            {(() => {
              const active = packagingTasks.find(t => t.status === "active");
              if (!active) return null;
              const ptCfg = packTypeConfig[active.packType];
              const stepsComplete = active.steps.filter(s => s.done).length;
              const stepsTotal = active.steps.length;
              const unitPercent = Math.round((active.packedUnits / active.totalUnits) * 100);

              return (
                <motion.div
                  className="relative bg-card rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-2"
                  style={{ borderColor: `${ptCfg.color}30` }}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: ptCfg.color }} />
                  <div className="p-7">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ptCfg.color}10` }}>
                          <span style={{ color: ptCfg.color }}>{ptCfg.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <StatusPill status="warning" label="Currently Packaging" pulse />
                            <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ptCfg.color}10`, color: `${ptCfg.color}bb` }}>{ptCfg.label}</span>
                          </div>
                          <p className="text-[0.6875rem] text-muted-foreground/35 mt-0.5">{active.order}</p>
                        </div>
                      </div>
                      <StatusPill status={active.priority === "urgent" ? "error" : "warning"} label={priorityConfig[active.priority].label} />
                    </div>

                    <h2 className="text-foreground tracking-tight text-[1.125rem] mb-1">{active.title}</h2>
                    <p className="text-muted-foreground text-[0.8125rem] mb-5">{active.buyer}</p>

                    {/* Progress: Units + Steps */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="p-4 rounded-2xl bg-muted/[0.05] border border-border/15">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[0.6875rem] text-muted-foreground/35">Units Packed</span>
                          <span className="text-[0.6875rem] tabular-nums" style={{ color: ptCfg.color }}>{unitPercent}%</span>
                        </div>
                        <div className="flex items-end gap-3">
                          <ProgressRing value={active.packedUnits} max={active.totalUnits} size={56} strokeWidth={5} color={ptCfg.color} />
                          <div>
                            <p className="text-[1.25rem] text-foreground/60 tabular-nums">{active.packedUnits}<span className="text-[0.75rem] text-muted-foreground/25"> / {active.totalUnits}</span></p>
                            <p className="text-[0.625rem] text-muted-foreground/25">{active.totalUnits - active.packedUnits} remaining</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/[0.05] border border-border/15">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[0.6875rem] text-muted-foreground/35">Steps</span>
                          <span className="text-[0.6875rem] tabular-nums text-primary/50">{stepsComplete}/{stepsTotal}</span>
                        </div>
                        <div className="flex items-end gap-3">
                          <ProgressRing value={stepsComplete} max={stepsTotal} size={56} strokeWidth={5} color="#0171E3" />
                          <div>
                            <p className="text-[1.25rem] text-foreground/60 tabular-nums">{stepsComplete}<span className="text-[0.75rem] text-muted-foreground/25"> / {stepsTotal}</span></p>
                            <p className="text-[0.625rem] text-muted-foreground/25">{stepsTotal - stepsComplete} to go</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-step checklist */}
                    <div className="mb-5">
                      <p className="text-[0.6875rem] text-muted-foreground/25 uppercase tracking-wider mb-3">Packaging Steps</p>
                      <div className="space-y-1.5">
                        {active.steps.map((step, i) => {
                          const isNext = !step.done && (i === 0 || active.steps[i - 1].done);
                          return (
                            <motion.div
                              key={step.id}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                                step.done ? "bg-[#30A46C]/[0.03] opacity-60"
                                  : isNext ? "bg-primary/[0.04] border border-primary/12 shadow-[0_1px_4px_rgba(1,113,227,0.06)]"
                                  : "bg-muted/[0.04]"
                              }`}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              {step.done ? (
                                <motion.div className="w-5 h-5 rounded-full bg-[#30A46C]/15 flex items-center justify-center flex-shrink-0" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                                  <Check size={10} className="text-[#30A46C]" />
                                </motion.div>
                              ) : isNext ? (
                                <motion.div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                                  <CircleDot size={8} className="text-primary" />
                                </motion.div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-border/25 flex-shrink-0" />
                              )}
                              <span className={`text-[0.8125rem] flex-1 ${step.done ? "text-muted-foreground/40 line-through" : isNext ? "text-foreground/70" : "text-muted-foreground/35"}`}>
                                {step.label}
                              </span>
                              {isNext && <span className="text-[0.5625rem] text-primary/50 px-2 py-0.5 rounded-full bg-primary/6">Next</span>}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {active.specialInstructions && (
                      <motion.div
                        className={`px-4 py-3.5 rounded-2xl mb-5 border ${
                          active.packType === "fragile" ? "bg-[#E5484D]/[0.03] border-[#E5484D]/10"
                          : active.packType === "temperature" ? "bg-[#8B5CF6]/[0.03] border-[#8B5CF6]/10"
                          : "bg-[#FFB224]/[0.03] border-[#FFB224]/8"
                        }`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={13} className={`flex-shrink-0 mt-0.5 ${
                            active.packType === "fragile" ? "text-[#E5484D]/50" : active.packType === "temperature" ? "text-[#8B5CF6]/50" : "text-[#D97706]/50"
                          }`} />
                          <div>
                            <p className="text-[0.625rem] text-muted-foreground/30 uppercase tracking-wider mb-1">Special Instructions</p>
                            <p className="text-[0.8125rem] text-foreground/55 leading-relaxed">{active.specialInstructions}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Specs & Materials */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3.5 rounded-xl bg-muted/[0.04] border border-border/10">
                        <p className="text-[0.5625rem] text-muted-foreground/25 uppercase tracking-wider mb-2.5">Specs</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[0.6875rem] text-muted-foreground/30">Destination</span>
                            <span className="text-[0.6875rem] text-foreground/45">{active.destination.split(" → ")[1]}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[0.6875rem] text-muted-foreground/30">Weight</span>
                            <span className="text-[0.6875rem] text-foreground/45">{active.weight}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[0.6875rem] text-muted-foreground/30">Box Size</span>
                            <span className="text-[0.6875rem] text-foreground/45">{active.dimensions}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-muted/[0.04] border border-border/10">
                        <p className="text-[0.5625rem] text-muted-foreground/25 uppercase tracking-wider mb-2.5">Materials Needed</p>
                        <div className="space-y-1.5">
                          {active.materials.map((mat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-muted-foreground/15 flex-shrink-0" />
                              <span className="text-[0.6875rem] text-foreground/40">{mat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5">
                      <BounceButton variant="primary" size="lg" icon={<Play size={16} />} energyWeight={2} className="flex-1">Next Step</BounceButton>
                      <BounceButton variant="secondary" size="lg" icon={<Camera size={16} />}>Photo</BounceButton>
                      <BounceButton variant="success" size="lg" icon={<CheckCircle2 size={16} />} energyWeight={5} className="flex-1">Complete Order</BounceButton>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* ═══ QUEUE ═══ */}
            {packagingTasks.filter(t => t.status === "upcoming").length > 0 && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
                <div className="flex items-center gap-2.5 mb-5">
                  <h3 className="text-foreground tracking-tight">Coming Up</h3>
                  <span className="text-[0.75rem] text-muted-foreground/40">{packagingTasks.filter(t => t.status === "upcoming").length} orders</span>
                </div>

                {/* Queue progress */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#D97706]/[0.03] border border-[#D97706]/8 mb-5">
                  <div className="flex items-center gap-1">
                    {packagingTasks.map((t, idx) => {
                      const isCompleted = t.status === "completed";
                      const isActive = t.status === "active";
                      const cfg = packTypeConfig[t.packType];
                      return (
                        <React.Fragment key={t.id}>
                          {idx > 0 && <div className={`w-4 h-[2px] rounded-full ${isCompleted || isActive ? "bg-[#D97706]/25" : "bg-muted-foreground/10"}`} />}
                          <motion.div
                            className={`flex items-center justify-center rounded-full flex-shrink-0 ${isActive ? "w-7 h-7" : "w-5 h-5"}`}
                            style={{
                              backgroundColor: isCompleted ? `${cfg.color}15` : isActive ? `${cfg.color}10` : "transparent",
                              border: isActive ? `2px solid ${cfg.color}` : !isCompleted ? "1.5px solid rgba(0,0,0,0.06)" : "none",
                            }}
                            animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                            transition={isActive ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : {}}
                          >
                            {isCompleted ? <Check size={10} style={{ color: cfg.color }} /> : isActive ? <CircleDot size={12} style={{ color: cfg.color }} /> : <Circle size={8} className="text-muted-foreground/20" />}
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[0.6875rem] text-[#D97706]/50">Order</span>
                    <span className="text-[0.8125rem] text-[#D97706] tabular-nums">1</span>
                    <span className="text-[0.6875rem] text-muted-foreground/30">of {packagingTasks.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {packagingTasks.filter(t => t.status === "upcoming").map((task, i) => {
                    const cfg = packTypeConfig[task.packType];
                    return (
                      <motion.div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border/20 hover:border-border/50 transition-all cursor-pointer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -1 }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}10` }}>
                          <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        </div>
                        <div className="w-[65px] flex-shrink-0"><p className="text-[0.875rem] text-foreground/60 tabular-nums">{task.time}</p></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.875rem] text-foreground/65 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[0.6875rem]" style={{ color: `${cfg.color}99` }}>{cfg.label}</span>
                            <span className="text-[0.5rem] text-muted-foreground/20">|</span>
                            <span className="text-[0.6875rem] text-muted-foreground/35">{task.totalUnits} units</span>
                            <span className="text-[0.5rem] text-muted-foreground/20">|</span>
                            <span className="text-[0.6875rem] text-muted-foreground/30 tabular-nums">{task.order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground/25 flex-shrink-0"><ClipboardCheck size={10} /><span>{task.steps.length} steps</span></div>
                        <StatusPill status={task.priority === "urgent" ? "error" : task.priority === "normal" ? "warning" : "success"} label={priorityConfig[task.priority].label} />
                        <ChevronRight size={14} className="text-muted-foreground/20 flex-shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5">
              <BounceButton variant="secondary" className="flex items-center gap-2.5 px-5 py-3 rounded-2xl flex-1 sm:flex-none" icon={<span style={{ color: "#3B82F6" }}><Camera size={18} /></span>}>
                <span className="text-[0.8125rem]">Take Photo</span>
              </BounceButton>
              <BounceButton variant="secondary" className="flex items-center gap-2.5 px-5 py-3 rounded-2xl flex-1 sm:flex-none" icon={<span style={{ color: "#30A46C" }}><Phone size={18} /></span>}>
                <span className="text-[0.8125rem]">Call Support</span>
              </BounceButton>
              <BounceButton variant="secondary" className="flex items-center gap-2 px-4 py-2.5 rounded-xl opacity-70 hover:opacity-100 transition-opacity" icon={<span style={{ color: "#D97706" }}><Pause size={15} /></span>}>
                <span className="text-[0.75rem]">Break</span>
              </BounceButton>
              <BounceButton variant="secondary" className="flex items-center gap-2 px-4 py-2.5 rounded-xl opacity-50 hover:opacity-100 transition-opacity" icon={<span style={{ color: "#E5484D" }}><AlertTriangle size={15} /></span>} energyWeight={3}>
                <span className="text-[0.75rem]">Report Issue</span>
              </BounceButton>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}