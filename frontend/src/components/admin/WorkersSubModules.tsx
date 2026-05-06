// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardCheck, Truck, Shield, Package, MapPin, Clock,
  CheckCircle2, AlertTriangle, Star, Timer, Phone, Navigation,
  Route, Eye, Play, Camera, ArrowRight, ChevronRight,
  Circle, CircleDot, Hash, Zap, ArrowUpRight, Search,
  Anchor, Plane, Beaker, ShoppingBag, User, Calendar,
  ThermometerSun, Box, Ruler, Weight, FileText, BarChart3, Layers,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { ProgressRing } from "./ProgressRing";

/*
 * ════════════════════════════════════════════════════════════
 *  WORKERS SUB-MODULES — PLATONIC DESIGN
 *
 *    Tasks       → "What do I need to do?"
 *    Routes      → "Where am I going?"
 *    Inspections → "What do I need to check?"
 *    Packaging   → "What do I need to pack?"
 * ════════════════════════════════════════════════════════════
 */

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } },
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 ${className}`}>{children}</div>;
}

// ════════════════════════════════════════════════════════════
//  WORKERS → TASKS (All task types in one view)
// ════════════════════════════════════════════════════════════

interface Task {
  id: number;
  type: "sample" | "order" | "delivery" | "inspection" | "packaging";
  title: string;
  subtitle: string;
  time: string;
  priority: "urgent" | "normal" | "low";
  status: "active" | "upcoming" | "completed";
  location: string;
}

const allTasks: Task[] = [
  { id: 1, type: "delivery", title: "Deliver to Meridian Corp", subtitle: "Container from Mumbai Port — HS 8518.30", time: "9:00 AM", priority: "urgent", status: "active", location: "145 Commerce St, Chicago" },
  { id: 2, type: "sample", title: "Pickup Samples — GreenLeaf", subtitle: "Herbal Tea batch #284 — QC testing", time: "11:00 AM", priority: "urgent", status: "upcoming", location: "78 Market Ave, Evanston" },
  { id: 3, type: "order", title: "Pickup Order — BrightStar", subtitle: "LED Panel Light — 50 units", time: "1:00 PM", priority: "normal", status: "upcoming", location: "2201 Tech Blvd, Naperville" },
  { id: 4, type: "delivery", title: "Deliver to FreshPack HQ", subtitle: "Air freight from Narita — Supplements", time: "3:00 PM", priority: "low", status: "upcoming", location: "900 Industrial Pkwy, Aurora" },
  { id: 5, type: "sample", title: "Pickup Samples — Atlas", subtitle: "Composite Sheet — Lab analysis", time: "4:30 PM", priority: "low", status: "upcoming", location: "1500 Research Dr, Schaumburg" },
];

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sample: { label: "Sample", color: "#D97706", icon: <Beaker size={16} /> },
  order: { label: "Order", color: "#0171E3", icon: <ShoppingBag size={16} /> },
  delivery: { label: "Delivery", color: "#30A46C", icon: <Truck size={16} /> },
  inspection: { label: "Inspect", color: "#3B82F6", icon: <ClipboardCheck size={16} /> },
  packaging: { label: "Pack", color: "#8B5CF6", icon: <Package size={16} /> },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "#E5484D", label: "Urgent" },
  normal: { color: "#FFB224", label: "Normal" },
  low: { color: "#30A46C", label: "Low" },
};

export function WorkersTasks() {
  const [tasks, setTasks] = useState(allTasks);
  const [filterType, setFilterType] = useState("all");

  const activeTasks = tasks.filter(t => t.status === "active");
  const upcomingTasks = tasks.filter(t => t.status === "upcoming");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const filtered = filterType === "all" ? tasks : tasks.filter(t => t.type === filterType);

  const completeTask = (id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status: "completed" as const } : t);
      const hasActive = updated.some(t => t.status === "active");
      if (!hasActive) {
        const nextIdx = updated.findIndex(t => t.status === "upcoming");
        if (nextIdx >= 0) updated[nextIdx] = { ...updated[nextIdx], status: "active" };
      }
      return updated;
    });
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">My Tasks</h1>
        <p className="text-muted-foreground text-[0.875rem]">Everything assigned to you today. Complete them in order.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="col-span-2">
          <StatCard label="Progress" value={`${completedTasks.length} / ${tasks.length}`} icon={<Route size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={0} accentColor="#3B82F6" subtitle={`${upcomingTasks.length + activeTasks.length} remaining`} />
        </div>
        <StatCard label="Urgent" value={`${tasks.filter(t => t.priority === "urgent" && t.status !== "completed").length}`} icon={<Zap size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={1} accentColor="#E5484D" />
        <StatCard label="Completed" value={`${completedTasks.length}`} icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} accentColor="#30A46C" />
      </motion.div>

      {/* Type filters */}
      <motion.div variants={stagger.item} className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType("all")}
          className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] transition-all cursor-pointer ${filterType === "all" ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"}`}
        >All ({tasks.length})</button>
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = tasks.filter(t => t.type === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setFilterType(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[0.8125rem] transition-all cursor-pointer ${filterType === key ? "text-white" : "bg-muted/20 text-muted-foreground hover:text-foreground"}`}
              style={filterType === key ? { backgroundColor: cfg.color } : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: filterType === key ? "white" : cfg.color }} />
              {cfg.label} ({count})
            </button>
          );
        })}
      </motion.div>

      {/* Active Task — hero */}
      {activeTasks.length > 0 && (
        <motion.div variants={stagger.item}>
          {activeTasks.map(task => {
            const cfg = typeConfig[task.type];
            return (
              <SectionCard key={task.id} className="border-2" >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[0.6875rem] tracking-wider uppercase" style={{ color: cfg.color }}>Active Now</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-foreground text-[1.0625rem] mb-1">{task.title}</h3>
                    <p className="text-muted-foreground/50 text-[0.8125rem] mb-3">{task.subtitle}</p>
                    <div className="flex items-center gap-4 text-[0.75rem] text-muted-foreground/40">
                      <span className="flex items-center gap-1"><Clock size={12} />{task.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} />{task.location}</span>
                    </div>
                  </div>
                  <BounceButton variant="success" size="md" icon={<CheckCircle2 size={16} />} onClick={() => completeTask(task.id)} energyWeight={3}>
                    Complete
                  </BounceButton>
                </div>
              </SectionCard>
            );
          })}
        </motion.div>
      )}

      {/* Upcoming */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Queue</h2>
          <div className="space-y-2">
            {filtered.filter(t => t.status === "upcoming").map((task, i) => {
              const cfg = typeConfig[task.type];
              const pri = priorityConfig[task.priority];
              return (
                <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cfg.color}10` }}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.875rem] text-foreground block truncate">{task.title}</span>
                    <span className="text-[0.75rem] text-muted-foreground/50">{task.subtitle}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-[0.75rem] text-muted-foreground/50">
                    <span>{task.time}</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pri.color }} />
                  <StatusPill status={cfg.color === "#D97706" ? "warning" : cfg.color === "#0171E3" ? "info" : "success"} label={cfg.label} />
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <motion.div variants={stagger.item}>
          <SectionCard>
            <h2 className="text-foreground/50 text-[0.9375rem] mb-4">Completed</h2>
            <div className="space-y-1">
              {filtered.filter(t => t.status === "completed").map(task => (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3 rounded-2xl opacity-50">
                  <CheckCircle2 size={18} className="text-[#30A46C]" />
                  <span className="text-[0.8125rem] text-foreground/50 line-through">{task.title}</span>
                  <span className="text-[0.75rem] text-muted-foreground/30 ml-auto">{task.time}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  WORKERS → ROUTES (Map-centric route planning)
// ════════════════════════════════════════════════════════════

const routeStops = [
  { id: 1, name: "Meridian Corp", address: "145 Commerce St, Chicago", type: "delivery" as const, eta: "9:00 AM", distance: "4.2 mi", status: "active" as const, duration: "12 min" },
  { id: 2, name: "GreenLeaf Organics", address: "78 Market Ave, Evanston", type: "sample" as const, eta: "11:00 AM", distance: "18.5 mi", status: "upcoming" as const, duration: "28 min" },
  { id: 3, name: "BrightStar Electronics", address: "2201 Tech Blvd, Naperville", type: "order" as const, eta: "1:00 PM", distance: "32.1 mi", status: "upcoming" as const, duration: "42 min" },
  { id: 4, name: "FreshPack HQ", address: "900 Industrial Pkwy, Aurora", type: "delivery" as const, eta: "3:00 PM", distance: "12.8 mi", status: "upcoming" as const, duration: "18 min" },
  { id: 5, name: "Atlas Materials", address: "1500 Research Dr, Schaumburg", type: "sample" as const, eta: "4:30 PM", distance: "24.3 mi", status: "upcoming" as const, duration: "35 min" },
];

const stopTypeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  delivery: { color: "#30A46C", icon: <Truck size={14} />, label: "Deliver" },
  sample: { color: "#D97706", icon: <Beaker size={14} />, label: "Pickup" },
  order: { color: "#0171E3", icon: <ShoppingBag size={14} />, label: "Pickup" },
};

export function WorkersRoutes() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">My Route</h1>
        <p className="text-muted-foreground text-[0.875rem]">Your optimized route for today. 5 stops, 91.9 miles total.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Total Stops" value="5" icon={<MapPin size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={0} accentColor="#3B82F6" />
        <StatCard label="Total Distance" value="91.9 mi" icon={<Route size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={1} accentColor="#0171E3" />
        <StatCard label="Est. Drive Time" value="2h 15m" icon={<Timer size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} accentColor="#30A46C" />
        <StatCard label="Finish By" value="5:00 PM" icon={<Clock size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={3} accentColor="#FFB224" />
      </motion.div>

      {/* Route map placeholder */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="h-52 rounded-2xl bg-gradient-to-br from-[#0171E3]/4 via-[#30A46C]/3 to-[#D97706]/4 flex items-center justify-center border border-border/20 mb-6">
            <div className="text-center">
              <Navigation size={32} className="text-primary/30 mx-auto mb-2" />
              <p className="text-muted-foreground/40 text-[0.8125rem]">Route map — 5 stops optimized</p>
              <p className="text-muted-foreground/30 text-[0.75rem]">Chicago → Evanston → Naperville → Aurora → Schaumburg</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <BounceButton variant="primary" size="md" icon={<Navigation size={16} />}>Start Navigation</BounceButton>
          </div>
        </SectionCard>
      </motion.div>

      {/* Route timeline */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Stop Sequence</h2>
          <div className="space-y-1">
            {routeStops.map((stop, i) => {
              const cfg = stopTypeConfig[stop.type];
              return (
                <div key={stop.id} className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-4 px-5 py-5 rounded-2xl transition-colors ${stop.status === "active" ? "bg-primary/4 border border-primary/10" : "hover:bg-muted/20"}`}
                  >
                    {/* Stop number */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[0.75rem] text-white" style={{ backgroundColor: cfg.color }}>
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[0.875rem] text-foreground">{stop.name}</span>
                        <span className="text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}10`, color: cfg.color }}>{cfg.label}</span>
                        {stop.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/50">{stop.address}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-[0.75rem] text-muted-foreground/50">
                      <span>{stop.distance}</span>
                      <span>{stop.duration}</span>
                      <span className="text-foreground/60">{stop.eta}</span>
                    </div>

                    {stop.status === "active" && (
                      <BounceButton variant="primary" size="sm" icon={<Navigation size={14} />}>Navigate</BounceButton>
                    )}
                  </motion.div>

                  {/* Connector line */}
                  {i < routeStops.length - 1 && (
                    <div className="ml-9 h-4 border-l-2 border-dashed border-border/30" />
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  WORKERS → INSPECTIONS (QC checkpoint view)
// ════════════════════════════════════════════════════════════

interface Inspection {
  id: number;
  product: string;
  seller: string;
  batch: string;
  status: "active" | "upcoming" | "completed";
  priority: "urgent" | "normal" | "low";
  checkpoints: { label: string; done: boolean }[];
  time: string;
  category: string;
}

const inspections: Inspection[] = [
  {
    id: 1, product: "Herbal Tea Batch #284", seller: "GreenLeaf Organics", batch: "B-284",
    status: "active", priority: "urgent", time: "9:00 AM", category: "Food & Beverage",
    checkpoints: [
      { label: "Visual appearance check", done: true },
      { label: "Aroma & freshness test", done: true },
      { label: "Packaging integrity", done: true },
      { label: "Weight verification (±2%)", done: true },
      { label: "Label accuracy", done: true },
      { label: "Contaminant screening", done: false },
      { label: "Moisture content analysis", done: false },
      { label: "Final QC sign-off", done: false },
    ],
  },
  {
    id: 2, product: "LED Panel Light 60W", seller: "BrightStar Electronics", batch: "E-1142",
    status: "upcoming", priority: "urgent", time: "10:30 AM", category: "Electronics",
    checkpoints: [
      { label: "Visual inspection — housing", done: false },
      { label: "Power-on test (all modes)", done: false },
      { label: "Lumen output measurement", done: false },
      { label: "Color temperature verification", done: false },
      { label: "Heat dissipation check", done: false },
      { label: "Electrical safety (grounding)", done: false },
      { label: "Packaging & labeling", done: false },
      { label: "CE/UL marking verification", done: false },
      { label: "Drop test (30cm)", done: false },
      { label: "Waterproof rating test", done: false },
      { label: "Serial number logging", done: false },
      { label: "Final QC sign-off", done: false },
    ],
  },
  {
    id: 3, product: "Protein Energy Bar (Box/24)", seller: "FreshPack Foods", batch: "F-892",
    status: "upcoming", priority: "normal", time: "1:00 PM", category: "Food & Beverage",
    checkpoints: [
      { label: "Packaging seal integrity", done: false },
      { label: "Expiry date verification", done: false },
      { label: "Nutritional label accuracy", done: false },
      { label: "Allergen declaration check", done: false },
      { label: "Weight per unit (±3%)", done: false },
      { label: "Visual inspection — bars", done: false },
      { label: "Taste test (optional)", done: false },
      { label: "Batch code verification", done: false },
      { label: "Storage condition check", done: false },
      { label: "Final QC sign-off", done: false },
    ],
  },
  {
    id: 4, product: "Composite Sheet Material", seller: "Atlas Materials", batch: "A-447",
    status: "upcoming", priority: "low", time: "3:00 PM", category: "Industrial",
    checkpoints: [
      { label: "Thickness measurement", done: false },
      { label: "Surface finish inspection", done: false },
      { label: "Tensile strength sample", done: false },
      { label: "Edge quality check", done: false },
      { label: "Dimension verification", done: false },
      { label: "Final QC sign-off", done: false },
    ],
  },
];

export function WorkersInspections() {
  const [inspectionData, setInspectionData] = useState(inspections);
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleCheckpoint = (inspId: number, cpIdx: number) => {
    setInspectionData(prev => prev.map(insp => {
      if (insp.id !== inspId) return insp;
      const updated = { ...insp, checkpoints: insp.checkpoints.map((cp, i) => i === cpIdx ? { ...cp, done: !cp.done } : cp) };
      return updated;
    }));
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Inspections</h1>
        <p className="text-muted-foreground text-[0.875rem]">Quality checkpoints for each product. Be thorough.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Today's Queue" value={`${inspectionData.length}`} icon={<ClipboardCheck size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="Active" value="1" icon={<Eye size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={1} accentColor="#3B82F6" />
        <StatCard label="Checkpoints Done" value={`${inspectionData.reduce((a, b) => a + b.checkpoints.filter(c => c.done).length, 0)}`} icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} accentColor="#30A46C" />
        <StatCard label="Total Checkpoints" value={`${inspectionData.reduce((a, b) => a + b.checkpoints.length, 0)}`} icon={<Hash size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={3} accentColor="#FFB224" />
      </motion.div>

      {/* Inspection cards */}
      <div className="space-y-4">
        {inspectionData.map((insp, i) => {
          const done = insp.checkpoints.filter(c => c.done).length;
          const total = insp.checkpoints.length;
          const pct = Math.round((done / total) * 100);
          const isExpanded = expandedId === insp.id;
          const pri = priorityConfig[insp.priority];

          return (
            <motion.div key={insp.id} variants={stagger.item}>
              <SectionCard className={insp.status === "active" ? "border-2 border-primary/15" : ""}>
                {/* Header */}
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : insp.id)}
                >
                  <ProgressRing percentage={pct} size={48} strokeWidth={3} color={pct === 100 ? "#30A46C" : "#0171E3"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] text-foreground">{insp.product}</span>
                      {insp.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pri.color }} />
                    </div>
                    <span className="text-[0.75rem] text-muted-foreground/50">{insp.seller} · {insp.batch} · {insp.time}</span>
                  </div>
                  <span className="text-[0.8125rem] text-muted-foreground/40">{done}/{total}</span>
                  <ChevronRight size={16} className={`text-muted-foreground/30 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                {/* Checklist */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-5 border-t border-border/20 space-y-1">
                        {insp.checkpoints.map((cp, cpIdx) => (
                          <motion.button
                            key={cpIdx}
                            onClick={(e) => { e.stopPropagation(); toggleCheckpoint(insp.id, cpIdx); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${cp.done ? "bg-[#30A46C]/4" : "hover:bg-muted/20"}`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                              cp.done ? "bg-[#30A46C] text-white" : "border-2 border-border/40"
                            }`}>
                              {cp.done && <CheckCircle2 size={12} />}
                            </div>
                            <span className={`text-[0.8125rem] ${cp.done ? "text-[#30A46C]/70 line-through" : "text-foreground/70"}`}>
                              {cp.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                      {pct === 100 && (
                        <div className="mt-4 flex justify-end">
                          <BounceButton variant="success" size="md" icon={<CheckCircle2 size={16} />}>Submit Report</BounceButton>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SectionCard>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  WORKERS → PACKAGING (Packing station)
// ════════════════════════════════════════════════════════════

interface PackJob {
  id: number;
  product: string;
  order: string;
  buyer: string;
  packType: "custom" | "standard" | "fragile" | "temperature";
  status: "active" | "upcoming" | "completed";
  priority: "urgent" | "normal" | "low";
  totalUnits: number;
  packedUnits: number;
  steps: { label: string; done: boolean }[];
  materials: string[];
  specialInstructions?: string;
  weight: string;
  dimensions: string;
}

const packTypeStyle: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  custom: { label: "Custom Box", color: "#D97706", icon: <Star size={14} /> },
  standard: { label: "Standard", color: "#3B82F6", icon: <Box size={14} /> },
  fragile: { label: "Fragile", color: "#E5484D", icon: <AlertTriangle size={14} /> },
  temperature: { label: "Temp Control", color: "#8B5CF6", icon: <ThermometerSun size={14} /> },
};

const packJobs: PackJob[] = [
  {
    id: 1, product: "Premium Tea Gift Set", order: "ORD-4821", buyer: "Meridian Corp",
    packType: "custom", status: "active", priority: "urgent", totalUnits: 24, packedUnits: 9,
    steps: [
      { label: "Inspect items for damage", done: true },
      { label: "Wrap each unit in tissue paper", done: true },
      { label: "Place in branded gift box", done: true },
      { label: "Add thank-you card & ribbon", done: false },
      { label: "Seal with holographic sticker", done: false },
      { label: "Apply shipping label & QR", done: false },
      { label: "Photo verification", done: false },
    ],
    materials: ["Tissue paper (white)", "Gift box 30x20x12 cm", "Satin ribbon (gold)", "Thank-you cards", "Holographic seal stickers"],
    specialInstructions: "Buyer requested handwritten note: 'Thank you for your partnership.'",
    weight: "1.2 kg/unit", dimensions: "30 x 20 x 12 cm",
  },
  {
    id: 2, product: "Borosilicate Glass Vials", order: "ORD-4824", buyer: "BioLab Solutions",
    packType: "fragile", status: "upcoming", priority: "urgent", totalUnits: 15, packedUnits: 0,
    steps: [
      { label: "Inspect each vial for micro-cracks", done: false },
      { label: "Wrap individually in foam sleeve", done: false },
      { label: "Place in molded tray insert", done: false },
      { label: "Fill gaps with anti-static peanuts", done: false },
      { label: "Seal inner box with tamper tape", done: false },
      { label: "Apply FRAGILE labels (4 sides)", done: false },
      { label: "Orientation arrows (all sides)", done: false },
      { label: "Photo verification", done: false },
    ],
    materials: ["Foam sleeves", "Molded tray insert", "Anti-static peanuts", "FRAGILE stickers (red)", "Tamper tape"],
    specialInstructions: "FRAGILE — Lab-grade glass. Zero tolerance for breakage. Double-box required.",
    weight: "0.3 kg/unit", dimensions: "40 x 30 x 20 cm (outer)",
  },
  {
    id: 3, product: "Frozen Supplement Capsules", order: "ORD-4830", buyer: "Nordic Health",
    packType: "temperature", status: "upcoming", priority: "normal", totalUnits: 48, packedUnits: 0,
    steps: [
      { label: "Verify cold chain temperature", done: false },
      { label: "Place gel packs in insulated liner", done: false },
      { label: "Arrange capsule bottles in grid", done: false },
      { label: "Seal insulated liner", done: false },
      { label: "Insert into outer carton", done: false },
      { label: "Apply 'Keep Refrigerated' labels", done: false },
      { label: "Photo verification", done: false },
    ],
    materials: ["Insulated liner", "Gel packs (frozen)", "Outer carton", "'Keep Refrigerated' labels"],
    specialInstructions: "Must stay below 8°C. Gel packs must be pre-frozen 24h. Ship same day.",
    weight: "0.5 kg/unit", dimensions: "50 x 35 x 25 cm",
  },
];

export function WorkersPackaging() {
  const [jobs, setJobs] = useState(packJobs);
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleStep = (jobId: number, stepIdx: number) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      const updated = { ...j, steps: j.steps.map((s, i) => i === stepIdx ? { ...s, done: !s.done } : s) };
      return updated;
    }));
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Packaging Station</h1>
        <p className="text-muted-foreground text-[0.875rem]">Pack orders step-by-step. Follow each checklist carefully.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Jobs Today" value={`${jobs.length}`} icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="Units Packed" value={`${jobs.reduce((a, b) => a + b.packedUnits, 0)}`} icon={<Box size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        <StatCard label="Total Units" value={`${jobs.reduce((a, b) => a + b.totalUnits, 0)}`} icon={<Layers size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Fragile" value={`${jobs.filter(j => j.packType === "fragile").length}`} icon={<AlertTriangle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
      </motion.div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const pType = packTypeStyle[job.packType];
          const done = job.steps.filter(s => s.done).length;
          const total = job.steps.length;
          const pct = Math.round((done / total) * 100);
          const isExpanded = expandedId === job.id;
          const pri = priorityConfig[job.priority];

          return (
            <motion.div key={job.id} variants={stagger.item}>
              <SectionCard className={job.status === "active" ? "border-2 border-primary/15" : ""}>
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                >
                  <ProgressRing percentage={pct} size={48} strokeWidth={3} color={pType.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] text-foreground">{job.product}</span>
                      <span className="text-[0.6875rem] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: `${pType.color}10`, color: pType.color }}>
                        {pType.icon}{pType.label}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pri.color }} />
                    </div>
                    <span className="text-[0.75rem] text-muted-foreground/50">{job.buyer} · {job.order} · {job.totalUnits} units</span>
                  </div>
                  <span className="text-[0.8125rem] text-muted-foreground/40">{done}/{total}</span>
                  <ChevronRight size={16} className={`text-muted-foreground/30 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-5 border-t border-border/20">
                        {/* Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          <div className="bg-muted/15 rounded-xl px-4 py-3">
                            <span className="text-[0.6875rem] text-muted-foreground/40 block">Weight</span>
                            <span className="text-[0.8125rem] text-foreground/70">{job.weight}</span>
                          </div>
                          <div className="bg-muted/15 rounded-xl px-4 py-3">
                            <span className="text-[0.6875rem] text-muted-foreground/40 block">Dimensions</span>
                            <span className="text-[0.8125rem] text-foreground/70">{job.dimensions}</span>
                          </div>
                          <div className="bg-muted/15 rounded-xl px-4 py-3 col-span-2">
                            <span className="text-[0.6875rem] text-muted-foreground/40 block">Materials</span>
                            <span className="text-[0.8125rem] text-foreground/70">{job.materials.join(", ")}</span>
                          </div>
                        </div>

                        {/* Special instructions */}
                        {job.specialInstructions && (
                          <div className="rounded-xl px-4 py-3 mb-5" style={{ backgroundColor: `${pType.color}06`, border: `1px solid ${pType.color}15` }}>
                            <span className="text-[0.6875rem] block mb-1" style={{ color: pType.color }}>Special Instructions</span>
                            <p className="text-[0.8125rem] text-foreground/60">{job.specialInstructions}</p>
                          </div>
                        )}

                        {/* Steps checklist */}
                        <div className="space-y-1">
                          {job.steps.map((step, sIdx) => (
                            <motion.button
                              key={sIdx}
                              onClick={(e) => { e.stopPropagation(); toggleStep(job.id, sIdx); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${step.done ? "bg-[#30A46C]/4" : "hover:bg-muted/20"}`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                step.done ? "bg-[#30A46C] text-white" : "border-2 border-border/40"
                              }`}>
                                {step.done && <CheckCircle2 size={12} />}
                              </div>
                              <span className={`text-[0.8125rem] ${step.done ? "text-[#30A46C]/70 line-through" : "text-foreground/70"}`}>
                                {step.label}
                              </span>
                            </motion.button>
                          ))}
                        </div>

                        {pct === 100 && (
                          <div className="mt-4 flex justify-end">
                            <BounceButton variant="success" size="md" icon={<Camera size={16} />}>Photo & Complete</BounceButton>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SectionCard>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
