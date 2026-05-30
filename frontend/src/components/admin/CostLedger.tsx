"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router";
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock,
  ChevronRight, Receipt, Truck, ClipboardCheck, Camera,
  Package, Calculator, CreditCard, ArrowRight, Eye,
  FileText, Download, Filter, X, ChevronDown
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { StatCard } from "./StatCard";

// ─── Types ──────────────────────────────────────────────

export interface CostBreakdown {
  logistics: number;
  testing: number;
  platform: number;
  photography: number;
  total: number;
}

export interface SellerLedgerEntry {
  id: string;
  listingId: string;
  productName: string;
  seller: string;
  status: "pending" | "deducted" | "refunded" | "waived";
  costs: CostBreakdown;
  triggeredAt: string;
  triggeredBy: string;
  note?: string;
}

// ─── Mock Ledger Data ───────────────────────────────────

const mockLedger: SellerLedgerEntry[] = [
  {
    id: "TXN-3001",
    listingId: "LST-1001",
    productName: "Organic Herbal Tea Blend",
    seller: "GreenLeaf Organics",
    status: "pending",
    costs: { logistics: 85, testing: 120, platform: 50, photography: 40, total: 295 },
    triggeredAt: "Mar 13, 2026 · 10:30 AM",
    triggeredBy: "System (on sample pickup acceptance)",
    note: "Costs applied upon acceptance of sample pickup request",
  },
  {
    id: "TXN-3002",
    listingId: "LST-1005",
    productName: "Carbon Fiber Composite Sheets",
    seller: "Atlas Materials",
    status: "pending",
    costs: { logistics: 220, testing: 350, platform: 75, photography: 40, total: 685 },
    triggeredAt: "Mar 12, 2026 · 3:15 PM",
    triggeredBy: "System (on sample pickup acceptance)",
    note: "Higher logistics cost due to specialized handling for composite materials",
  },
  {
    id: "TXN-3003",
    listingId: "LST-1002",
    productName: "Industrial HEPA Filters",
    seller: "Meridian Corp",
    status: "deducted",
    costs: { logistics: 95, testing: 180, platform: 50, photography: 40, total: 365 },
    triggeredAt: "Mar 8, 2026 · 9:00 AM",
    triggeredBy: "System (on sample pickup acceptance)",
  },
  {
    id: "TXN-3004",
    listingId: "LST-1003",
    productName: "LED Panel B200",
    seller: "BrightStar Electronics",
    status: "deducted",
    costs: { logistics: 65, testing: 150, platform: 50, photography: 40, total: 305 },
    triggeredAt: "Mar 5, 2026 · 11:45 AM",
    triggeredBy: "System (on sample pickup acceptance)",
  },
  {
    id: "TXN-3005",
    listingId: "LST-1004",
    productName: "Protein Energy Bars (Variety 24-Pack)",
    seller: "FreshPack Foods",
    status: "deducted",
    costs: { logistics: 45, testing: 200, platform: 50, photography: 40, total: 335 },
    triggeredAt: "Mar 1, 2026 · 8:30 AM",
    triggeredBy: "System (on sample pickup acceptance)",
  },
];

// ─── Cost Breakdown Inline ──────────────────────────────

export function CostBreakdownInline({ costs, compact = false }: { costs: CostBreakdown; compact?: boolean }) {
  const items = [
    { label: "Logistics", value: costs.logistics, icon: <Truck size={12} />, color: "#3B82F6" },
    { label: "Testing", value: costs.testing, icon: <ClipboardCheck size={12} />, color: "#0171E3" },
    { label: "Platform", value: costs.platform, icon: <Package size={12} />, color: "#D97706" },
    { label: "Photography", value: costs.photography, icon: <Camera size={12} />, color: "#EC4899" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
        <Receipt size={11} />
        <span>${costs.total}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: item.color }}>{item.icon}</span>
            <span className="text-[0.8125rem] text-muted-foreground">{item.label}</span>
          </div>
          <span className="text-[0.8125rem] text-foreground">${item.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-[0.8125rem] text-foreground">Total</span>
        <span className="text-[0.9375rem] text-foreground">${costs.total}</span>
      </div>
    </div>
  );
}

// ─── Cost Ledger Page ───────────────────────────────────

export function CostLedger() {
  const location = useLocation();
  const [selectedEntry, setSelectedEntry] = useState<SellerLedgerEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "deducted" | "refunded">("all");
  const [period, setPeriod] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    setPeriod((params.get("period") || "").trim().toLowerCase());
  }, [location.search]);

  const parseTriggeredAt = (raw: string): Date | null => {
    const s = (raw || "").replace("·", " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  };

  const windowedLedger = useMemo(() => {
    const p = (period || "").toLowerCase();
    const days =
      p === "24h" ? 1 :
      p === "7d" ? 7 :
      p === "30d" ? 30 :
      p === "90d" ? 90 :
      0;
    if (!days) return mockLedger;
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    return mockLedger.filter((e) => {
      const dt = parseTriggeredAt(e.triggeredAt);
      if (!dt) return true;
      return dt.getTime() >= start;
    });
  }, [period]);

  const filtered = useMemo(() => {
    const base = windowedLedger;
    return filterStatus === "all" ? base : base.filter((e) => e.status === filterStatus);
  }, [filterStatus, windowedLedger]);

  const totalPending = windowedLedger.filter(e => e.status === "pending").reduce((s, e) => s + e.costs.total, 0);
  const totalDeducted = windowedLedger.filter(e => e.status === "deducted").reduce((s, e) => s + e.costs.total, 0);
  const totalRevenue = totalPending + totalDeducted;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Cost Ledger</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Track service costs deducted from sellers upon sample pickup acceptance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="secondary" size="sm" icon={<Download size={15} />}>Export</BounceButton>
          <BounceButton variant="secondary" size="sm" icon={<Calculator size={15} />}>Simulate</BounceButton>
        </div>
      </div>

      {/* Testing Banner */}
      <motion.div
        className="p-4 rounded-2xl bg-[#FFB224]/6 border border-[#FFB224]/15 flex items-start gap-3"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertCircle size={18} className="text-[#D97706] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[0.8125rem] text-foreground">Testing Mode Active</p>
          <p className="text-[0.75rem] text-muted-foreground mt-0.5">
            This cost deduction system is currently in testing. No real charges are being processed. Data is being collected to validate sustainability of the pricing model.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="Testing mode"
          changeType="neutral"
          icon={<DollarSign size={20} className="text-primary" />}
          iconBg="bg-primary/8"
          index={0}
          subtitle={`${windowedLedger.length} transactions`}
          sparklineData={[1200, 1450, 1380, 1620, 1800, 1750, totalRevenue / 10]}
          sparklineColor="#0171E3"
          accentColor="#0171E3"
        />
        <StatCard
          label="Pending"
          value={`$${totalPending.toLocaleString()}`}
          change={`${windowedLedger.filter(e => e.status === "pending").length} entries`}
          changeType="neutral"
          icon={<Clock size={20} className="text-[#FFB224]" />}
          iconBg="bg-[#FFB224]/8"
          index={1}
          subtitle="Awaiting processing"
          accentColor="#FFB224"
        />
        <StatCard
          label="Collected"
          value={`$${totalDeducted.toLocaleString()}`}
          change={`${windowedLedger.filter(e => e.status === "deducted").length} entries`}
          changeType="positive"
          icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={2}
          subtitle="Successfully deducted"
          sparklineData={[800, 950, 1100, 1200, 1350, 1400, totalDeducted / 10]}
          sparklineColor="#30A46C"
          accentColor="#30A46C"
        />
        <StatCard
          label="Avg. Cost/Listing"
          value={`$${Math.round(totalRevenue / Math.max(1, windowedLedger.length))}`}
          icon={<Receipt size={20} className="text-[#3B82F6]" />}
          iconBg="bg-[#3B82F6]/8"
          index={3}
          subtitle="Across all categories"
          accentColor="#3B82F6"
        />
      </div>

      {/* Cost Breakdown Visual */}
      <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
        <h3 className="text-foreground tracking-tight mb-2">Revenue by Service</h3>
        <p className="text-muted-foreground text-[0.75rem] mb-6">How costs are distributed across services</p>

        <div className="space-y-4">
          {[
            { label: "Quality Testing", total: windowedLedger.reduce((s, e) => s + e.costs.testing, 0), color: "#0171E3", icon: <ClipboardCheck size={16} /> },
            { label: "Logistics & Pickup", total: windowedLedger.reduce((s, e) => s + e.costs.logistics, 0), color: "#3B82F6", icon: <Truck size={16} /> },
            { label: "Platform Fee", total: windowedLedger.reduce((s, e) => s + e.costs.platform, 0), color: "#D97706", icon: <Package size={16} /> },
            { label: "Photography", total: windowedLedger.reduce((s, e) => s + e.costs.photography, 0), color: "#EC4899", icon: <Camera size={16} /> },
          ].map((service) => {
            const pct = Math.round((service.total / totalRevenue) * 100);
            return (
              <div key={service.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: service.color }}>{service.icon}</span>
                    <span className="text-[0.8125rem] text-foreground">{service.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-foreground">${service.total}</span>
                    <span className="text-[0.6875rem] text-muted-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: service.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "deducted", "refunded"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-[0.8125rem] transition-all cursor-pointer capitalize ${
              filterStatus === status
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {status === "all" ? "All Entries" : status}
          </button>
        ))}
      </div>

      {/* Ledger Entries */}
      <div className="space-y-3">
        {filtered.map((entry, i) => (
          <motion.div
            key={entry.id}
            className="bg-card rounded-2xl p-5 border border-border/30 hover:shadow-md transition-all cursor-pointer group"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 sm:w-[100px]">
                <span className="text-[0.8125rem] text-primary">{entry.id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.875rem] text-foreground truncate">{entry.productName}</p>
                <p className="text-[0.6875rem] text-muted-foreground">{entry.seller} · {entry.listingId}</p>
              </div>
              <div className="sm:w-[100px] text-right">
                <p className="text-[0.9375rem] text-foreground">${entry.costs.total}</p>
              </div>
              <div className="sm:w-[120px] flex justify-end">
                <StatusPill
                  status={
                    entry.status === "deducted" ? "success" :
                    entry.status === "pending" ? "warning" :
                    entry.status === "refunded" ? "info" : "neutral"
                  }
                  label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                />
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-foreground/30 transition-transform ${selectedEntry?.id === entry.id ? "rotate-180" : ""}`}
              />
            </div>

            <AnimatePresence>
              {selectedEntry?.id === entry.id && (
                <motion.div
                  className="mt-4 pt-4 border-t border-border/20 space-y-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CostBreakdownInline costs={entry.costs} />
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/15 text-[0.75rem]">
                    <Clock size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">{entry.triggeredAt}</p>
                      <p className="text-muted-foreground/70">{entry.triggeredBy}</p>
                      {entry.note && <p className="text-muted-foreground mt-1">{entry.note}</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
