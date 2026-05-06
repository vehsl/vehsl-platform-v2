// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Package, Truck, Users, Briefcase, Search, Filter,
  CheckCircle2, Clock, AlertTriangle, ArrowRight,
  MapPin, Phone, Eye, Star, Hash, DollarSign,
  Building2, Globe, FileText, TrendingUp, BarChart3,
  UserCheck, Calendar, Shield, Mail, ChevronRight,
  ArrowUpRight, MoreHorizontal, Box, Layers,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { ProgressRing } from "./ProgressRing";
import { CustomAreaChart, HorizontalBarList, CustomDonutChart } from "./CustomCharts";

/*
 * ════════════════════════════════════════════════════════════
 *  MANAGEMENT SUB-MODULES — PLATONIC DESIGN
 *
 *    Orders     → "What's the pipeline?"
 *    Deliveries → "Where is everything?"
 *    Workforce  → "How is the team doing?"
 *    B2B        → "Who are our partners?"
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
//  MANAGEMENT → ORDER PIPELINE
// ════════════════════════════════════════════════════════════

const orders = [
  { id: "ORD-4852", buyer: "Meridian Corp", items: 24, total: "$4,680", status: "processing" as const, date: "Mar 18", priority: "urgent" as const, seller: "GreenLeaf Organics", progress: 65 },
  { id: "ORD-4851", buyer: "BioLab Solutions", items: 15, total: "$2,250", status: "confirmed" as const, date: "Mar 18", priority: "normal" as const, seller: "Atlas Materials", progress: 30 },
  { id: "ORD-4850", buyer: "TechStar Inc", items: 50, total: "$3,600", status: "packing" as const, date: "Mar 17", priority: "normal" as const, seller: "BrightStar Electronics", progress: 80 },
  { id: "ORD-4849", buyer: "FreshMart", items: 100, total: "$8,400", status: "quality-check" as const, date: "Mar 17", priority: "urgent" as const, seller: "FreshPack Foods", progress: 45 },
  { id: "ORD-4848", buyer: "Nordic Health", items: 200, total: "$12,000", status: "shipped" as const, date: "Mar 16", priority: "low" as const, seller: "FreshPack Foods", progress: 95 },
  { id: "ORD-4847", buyer: "Atlas Corp HQ", items: 8, total: "$1,512", status: "delivered" as const, date: "Mar 15", priority: "low" as const, seller: "Atlas Materials", progress: 100 },
];

const orderStatusMap: Record<string, { status: "pending" | "info" | "warning" | "success" | "error" | "neutral"; label: string }> = {
  "confirmed": { status: "info", label: "Confirmed" },
  "processing": { status: "pending", label: "Processing" },
  "packing": { status: "warning", label: "Packing" },
  "quality-check": { status: "warning", label: "QC Check" },
  "shipped": { status: "info", label: "Shipped" },
  "delivered": { status: "success", label: "Delivered" },
};

const orderVolume = [
  { day: "Mon", orders: 18 }, { day: "Tue", orders: 24 }, { day: "Wed", orders: 31 },
  { day: "Thu", orders: 28 }, { day: "Fri", orders: 42 }, { day: "Sat", orders: 15 }, { day: "Sun", orders: 8 },
];

export function ManagementOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const statuses = ["all", "confirmed", "processing", "packing", "quality-check", "shipped", "delivered"];
  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Order Pipeline</h1>
          <p className="text-muted-foreground text-[0.875rem]">Track every order from confirmation to delivery.</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<Package size={16} />}>Create Order</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Active Orders" value="24" icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="This Week" value="$48.2K" icon={<DollarSign size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" change="+12%" changeType="positive" />
        <StatCard label="Awaiting QC" value="6" icon={<Shield size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Avg Fulfillment" value="1.8d" icon={<Clock size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" subtitle="Target: 2 days" />
      </motion.div>

      {/* Pipeline stages */}
      <motion.div variants={stagger.item} className="flex gap-3 overflow-x-auto pb-1">
        {statuses.map(s => {
          const count = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === s ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
              }`}
            >{s === "all" ? "All" : (orderStatusMap[s]?.label || s)} ({count})</button>
          );
        })}
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="space-y-2">
            {filtered.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/6 flex flex-col items-center justify-center">
                  <span className="text-[0.6875rem] text-primary/70">{o.id.split("-")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground">{o.buyer}</span>
                    {o.priority === "urgent" && <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-pulse" />}
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{o.seller} · {o.items} items</span>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-[0.875rem] text-foreground/70">{o.total}</span>
                  <div className="w-20">
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-primary/50" initial={{ width: 0 }} animate={{ width: `${o.progress}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} />
                    </div>
                  </div>
                </div>
                <StatusPill status={orderStatusMap[o.status]?.status || "neutral"} label={orderStatusMap[o.status]?.label || o.status} pulse={o.status === "processing"} />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → DELIVERIES
// ════════════════════════════════════════════════════════════

const deliveries = [
  { id: "DLV-291", order: "ORD-4848", destination: "Nordic Health, Minneapolis", driver: "Mike Torres", status: "in-transit" as const, eta: "2h 15m", distance: "128 mi", items: 200 },
  { id: "DLV-290", order: "ORD-4845", destination: "TechStar Inc, Detroit", driver: "Sam Wilson", status: "out-for-delivery" as const, eta: "45 min", distance: "32 mi", items: 30 },
  { id: "DLV-289", order: "ORD-4842", destination: "Meridian Corp, Chicago", driver: "Nina Patel", status: "delivered" as const, eta: "—", distance: "12 mi", items: 24 },
  { id: "DLV-288", order: "ORD-4840", destination: "FreshPack HQ, Aurora", driver: "Tony Ruiz", status: "pending-pickup" as const, eta: "3h", distance: "45 mi", items: 8 },
  { id: "DLV-287", order: "ORD-4838", destination: "BioLab Solutions, Evanston", driver: "Aisha Khan", status: "delivered" as const, eta: "—", distance: "18 mi", items: 15 },
];

const deliveryStatusMap: Record<string, { status: "pending" | "info" | "warning" | "success" | "neutral"; label: string }> = {
  "pending-pickup": { status: "warning", label: "Pending Pickup" },
  "in-transit": { status: "info", label: "In Transit" },
  "out-for-delivery": { status: "pending", label: "Out for Delivery" },
  "delivered": { status: "success", label: "Delivered" },
};

export function ManagementDeliveries() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Deliveries</h1>
        <p className="text-muted-foreground text-[0.875rem]">Real-time tracking of all outgoing deliveries.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="In Transit" value="8" icon={<Truck size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={0} accentColor="#3B82F6" />
        <StatCard label="Delivered Today" value="14" icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        <StatCard label="On-Time Rate" value="96%" icon={<Clock size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={2} accentColor="#0171E3" />
        <StatCard label="Delayed" value="1" icon={<AlertTriangle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
      </motion.div>

      {/* Delivery Map placeholder */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground text-[0.9375rem]">Live Deliveries</h2>
            <StatusPill status="info" label="3 active" pulse />
          </div>
          <div className="h-48 rounded-2xl bg-gradient-to-br from-[#0171E3]/4 to-[#30A46C]/4 flex items-center justify-center border border-border/20">
            <div className="text-center">
              <MapPin size={32} className="text-primary/30 mx-auto mb-2" />
              <p className="text-muted-foreground/40 text-[0.8125rem]">Live map view — 3 vehicles active</p>
              <p className="text-muted-foreground/30 text-[0.75rem]">Tap a delivery below for route details</p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">All Deliveries</h2>
          <div className="space-y-2">
            {deliveries.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/8 flex items-center justify-center">
                  <Truck size={18} className="text-[#3B82F6]/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground truncate">{d.destination}</span>
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{d.driver} · {d.order} · {d.items} items</span>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[0.75rem] text-muted-foreground/50">
                  <span>{d.distance}</span>
                  {d.eta !== "—" && <span className="text-primary/70">ETA {d.eta}</span>}
                </div>
                <StatusPill
                  status={deliveryStatusMap[d.status]?.status || "neutral"}
                  label={deliveryStatusMap[d.status]?.label || d.status}
                  pulse={d.status === "in-transit" || d.status === "out-for-delivery"}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → WORKFORCE
// ════════════════════════════════════════════════════════════

const employees = [
  { id: 1, name: "Mike Torres", role: "Driver", status: "active" as const, performance: 4.9, tasksToday: 5, completed: 3, shift: "8:00 AM - 4:00 PM", avatar: "MT" },
  { id: 2, name: "Sam Wilson", role: "Driver", status: "active" as const, performance: 4.7, tasksToday: 4, completed: 2, shift: "8:00 AM - 4:00 PM", avatar: "SW" },
  { id: 3, name: "Nina Patel", role: "Driver", status: "break" as const, performance: 4.8, tasksToday: 6, completed: 4, shift: "6:00 AM - 2:00 PM", avatar: "NP" },
  { id: 4, name: "Dr. Amara Johnson", role: "Inspector", status: "active" as const, performance: 4.9, tasksToday: 3, completed: 1, shift: "9:00 AM - 5:00 PM", avatar: "AJ" },
  { id: 5, name: "Marcus Lee", role: "Inspector", status: "active" as const, performance: 4.6, tasksToday: 4, completed: 2, shift: "9:00 AM - 5:00 PM", avatar: "ML" },
  { id: 6, name: "Tony Ruiz", role: "Packaging", status: "active" as const, performance: 4.5, tasksToday: 8, completed: 5, shift: "7:00 AM - 3:00 PM", avatar: "TR" },
  { id: 7, name: "Aisha Khan", role: "Driver", status: "off-duty" as const, performance: 4.4, tasksToday: 0, completed: 0, shift: "Off today", avatar: "AK" },
];

const roleColor: Record<string, string> = { Driver: "#3B82F6", Inspector: "#0171E3", Packaging: "#D97706" };

export function ManagementWorkforce() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Workforce</h1>
          <p className="text-muted-foreground text-[0.875rem]">Team performance, schedules, and availability at a glance.</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<UserCheck size={16} />}>Add Team Member</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="On Duty" value="6/7" icon={<Users size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={0} accentColor="#30A46C" />
        <StatCard label="Avg Performance" value="4.7" icon={<Star size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={1} accentColor="#FFB224" sparklineData={[4.3, 4.4, 4.5, 4.6, 4.7, 4.7]} sparklineColor="#FFB224" />
        <StatCard label="Tasks Completed" value="17/30" icon={<CheckCircle2 size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={2} accentColor="#0171E3" subtitle="57% done today" />
        <StatCard label="On Break" value="1" icon={<Clock size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      {/* Role distribution */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(["Driver", "Inspector", "Packaging"] as const).map(role => {
          const members = employees.filter(e => e.role === role);
          const active = members.filter(e => e.status === "active" || e.status === "break").length;
          return (
            <SectionCard key={role}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${roleColor[role]}10` }}>
                  {role === "Driver" ? <Truck size={16} style={{ color: roleColor[role] }} /> :
                   role === "Inspector" ? <Shield size={16} style={{ color: roleColor[role] }} /> :
                   <Package size={16} style={{ color: roleColor[role] }} />}
                </div>
                <div>
                  <span className="text-[0.875rem] text-foreground">{role}s</span>
                  <span className="text-[0.75rem] text-muted-foreground/50 ml-2">{active}/{members.length} active</span>
                </div>
              </div>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-xl text-white text-[0.6875rem] flex items-center justify-center" style={{ backgroundColor: roleColor[role] }}>{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.8125rem] text-foreground block truncate">{m.name}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/40">{m.shift}</span>
                  </div>
                  <StatusPill
                    status={m.status === "active" ? "success" : m.status === "break" ? "warning" : "neutral"}
                    label={m.status === "off-duty" ? "Off" : m.status}
                  />
                </div>
              ))}
            </SectionCard>
          );
        })}
      </motion.div>

      {/* Full team list */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Performance Board</h2>
          <div className="space-y-2">
            {employees.sort((a, b) => b.performance - a.performance).map((e, i) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors">
                <span className="text-[0.75rem] text-muted-foreground/30 w-5">{i + 1}</span>
                <div className="w-10 h-10 rounded-2xl text-white text-[0.75rem] flex items-center justify-center" style={{ backgroundColor: roleColor[e.role] }}>{e.avatar}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.875rem] text-foreground">{e.name}</span>
                  <span className="text-[0.75rem] text-muted-foreground/50 block">{e.role} · {e.completed}/{e.tasksToday} tasks done</span>
                </div>
                <div className="flex items-center gap-1 text-[#FFB224]">
                  <Star size={14} fill="#FFB224" />
                  <span className="text-[0.875rem]">{e.performance}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → B2B ACCOUNTS
// ════════════════════════════════════════════════════════════

const b2bAccounts = [
  { id: 1, name: "Meridian Corp", industry: "Manufacturing", country: "us", value: "$245K", orders: 142, status: "active" as const, since: "Jan 2024", contact: "James Rodriguez", tier: "Enterprise" },
  { id: 2, name: "Nordic Health", industry: "Healthcare", country: "no", value: "$180K", orders: 87, status: "active" as const, since: "Mar 2024", contact: "Erik Svensson", tier: "Growth" },
  { id: 3, name: "TechStar Inc", industry: "Technology", country: "us", value: "$520K", orders: 234, status: "active" as const, since: "Nov 2023", contact: "David Chen", tier: "Enterprise" },
  { id: 4, name: "BioLab Solutions", industry: "Biotech", country: "de", value: "$92K", orders: 45, status: "active" as const, since: "Jun 2024", contact: "Dr. Sarah Kim", tier: "Growth" },
  { id: 5, name: "Atlas Corp HQ", industry: "Industrial", country: "jp", value: "$310K", orders: 178, status: "active" as const, since: "Aug 2023", contact: "Yuki Tanaka", tier: "Enterprise" },
  { id: 6, name: "FreshMart", industry: "Retail", country: "ca", value: "$156K", orders: 91, status: "pending" as const, since: "Feb 2026", contact: "Lisa Tremblay", tier: "Starter" },
];

const tierColor: Record<string, string> = { Enterprise: "#0171E3", Growth: "#30A46C", Starter: "#FFB224" };

export function ManagementB2B() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">B2B Accounts</h1>
          <p className="text-muted-foreground text-[0.875rem]">Enterprise partners and wholesale relationships.</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<Building2 size={16} />}>Add Account</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Active Accounts" value="5" icon={<Building2 size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="Total Revenue" value="$1.5M" icon={<DollarSign size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" change="+18%" changeType="positive" />
        <StatCard label="Avg Order Value" value="$2,180" icon={<TrendingUp size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Countries" value="5" icon={<Globe size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Partner Accounts</h2>
          <div className="space-y-2">
            {b2bAccounts.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-5 rounded-2xl hover:bg-muted/20 transition-colors group"
              >
                <img
                  src={`https://flagcdn.com/40x30/${a.country}.png`}
                  alt={a.country}
                  className="w-10 h-8 rounded-lg object-cover shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground">{a.name}</span>
                    <span className="text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tierColor[a.tier]}10`, color: tierColor[a.tier] }}>{a.tier}</span>
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{a.industry} · {a.contact} · Since {a.since}</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-[0.8125rem]">
                  <span className="text-foreground/70">{a.value}</span>
                  <span className="text-muted-foreground/50">{a.orders} orders</span>
                </div>
                <StatusPill status={a.status === "active" ? "success" : "pending"} label={a.status} />
                <ChevronRight size={16} className="text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
