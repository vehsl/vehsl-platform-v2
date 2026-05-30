// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router";
import {
  Package, Truck, Users, Briefcase, Search, Filter,
  CheckCircle2, Clock, AlertTriangle, ArrowRight,
  MapPin, Phone, Eye, Star, Hash, DollarSign,
  Building2, Globe, FileText, TrendingUp, BarChart3,
  UserCheck, Calendar, Shield, Mail, ChevronRight,
  ArrowUpRight, MoreHorizontal, Box, Layers,
} from "lucide-react";
import { fetchJsonAuthed } from "@/lib/api";
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

const orderStatusMap: Record<string, { status: "pending" | "info" | "warning" | "success" | "error" | "neutral"; label: string }> = {
  created: { status: "pending", label: "Created" },
  accepted: { status: "info", label: "Accepted" },
  shipped: { status: "info", label: "Shipped" },
  delivered: { status: "success", label: "Delivered" },
  completed: { status: "success", label: "Completed" },
  disputed: { status: "warning", label: "Disputed" },
  cancelled: { status: "neutral", label: "Cancelled" },
  rejected: { status: "error", label: "Rejected" },
};

const orderProgress: Record<string, number> = {
  created: 20,
  accepted: 40,
  shipped: 70,
  delivered: 95,
  completed: 100,
  disputed: 60,
  cancelled: 100,
  rejected: 100,
};

export function ManagementOrders() {
  const fetchJson = fetchJsonAuthed;
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [overdueDeadline, setOverdueDeadline] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [orders, setOrders] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statuses = ["all", "created", "accepted", "shipped", "delivered", "disputed", "completed", "cancelled", "rejected"];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = (params.get("status") || "").trim().toLowerCase();
    const qIn = (params.get("q") || "").trim();
    const overdue = (params.get("overdue_deadline") || "").trim().toLowerCase();
    const pageIn = Number(params.get("page") || "1");

    setQ(qIn);
    if (s && statuses.includes(s)) setStatusFilter(s);
    else setStatusFilter("all");

    const od = overdue === "1" || overdue === "true" || overdue === "yes";
    setOverdueDeadline(od);

    if (Number.isFinite(pageIn) && pageIn >= 1) setPage(Math.floor(pageIn));
    else setPage(1);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        if (q.trim()) params.set("q", q.trim());
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (overdueDeadline) params.set("overdue_deadline", "1");
        const resp = await fetchJson(`/api/v1/admin/orders/?${params.toString()}`);
        if (cancelled) return;
        const rows = Array.isArray(resp?.results) ? resp.results : [];
        const cnt = Number(resp?.count || 0);
        setOrders(rows);
        setCount(Number.isFinite(cnt) ? cnt : 0);
        setTotalPages(Math.max(1, Math.ceil((Number.isFinite(cnt) ? cnt : 0) / pageSize)));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, q, overdueDeadline, page]);

  const totalAmount = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o?.total_amount || 0) || 0), 0);
  }, [orders]);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Order Pipeline</h1>
          <p className="text-muted-foreground text-[0.875rem]">Admin order stream (real data).</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<Package size={16} />} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Refresh
        </BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Matching Orders" value={count.toLocaleString()} icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="Page Total" value={`$${Math.round(totalAmount).toLocaleString()}`} icon={<DollarSign size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        <StatCard label="Page" value={`${page}/${totalPages}`} icon={<Hash size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Filter" value={statusFilter === "all" ? "All" : (orderStatusMap[statusFilter]?.label || statusFilter)} icon={<Filter size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order id, buyer, seller, product..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-[0.875rem] bg-muted/20 border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOverdueDeadline(false);
            setPage(1);
          }}
          className="px-4 py-3 rounded-2xl text-[0.875rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : (orderStatusMap[s]?.label || s)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setOverdueDeadline((v) => !v);
            setPage(1);
          }}
          className={`px-4 py-3 rounded-2xl text-[0.875rem] border border-border/30 transition-all ${
            overdueDeadline ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          Overdue
        </button>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          {error && <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem] mb-4">{error}</div>}
          {loading ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              No orders match this filter.
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o, i) => {
                const rawStatus = (o?.status || "").toString().toLowerCase();
                const pct = orderProgress[rawStatus] ?? 0;
                return (
                  <motion.div
                    key={o?.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/6 flex flex-col items-center justify-center">
                      <span className="text-[0.6875rem] text-primary/70">{String(o?.id || "").slice(-4) || "—"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.875rem] text-foreground truncate">{o?.buyer || "—"}</span>
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/50 block truncate">
                        {o?.seller || "—"} · {(Number(o?.item_count || 0) || 0).toLocaleString()} items
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                      <span className="text-[0.875rem] text-foreground/70">
                        {o?.total_amount ? `$${Math.round(Number(o.total_amount) || 0).toLocaleString()}` : "—"}
                      </span>
                      <div className="w-20">
                        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary/50"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                    </div>
                    <StatusPill status={orderStatusMap[rawStatus]?.status || "neutral"} label={orderStatusMap[rawStatus]?.label || rawStatus || "—"} />
                  </motion.div>
                );
              })}
            </div>
          )}
          {!loading && totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between">
              <div className="text-[0.75rem] text-muted-foreground/60">Page {page} / {totalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → DELIVERIES
// ════════════════════════════════════════════════════════════

const deliveryStatusMap: Record<string, { status: "pending" | "info" | "warning" | "success" | "neutral"; label: string }> = {
  "label_created": { status: "warning", label: "Label Created" },
  "picked_up": { status: "info", label: "Picked Up" },
  "in_transit": { status: "info", label: "In Transit" },
  "customs": { status: "warning", label: "Customs" },
  "out_for_delivery": { status: "pending", label: "Out for Delivery" },
  "delivered": { status: "success", label: "Delivered" },
};

export function ManagementDeliveries() {
  const fetchJson = fetchJsonAuthed;
  const [days, setDays] = useState(7);
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipCount, setShipCount] = useState(0);
  const [shipPage, setShipPage] = useState(1);
  const pageSize = 10;
  const [shipTotalPages, setShipTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(shipPage));
        params.set("page_size", String(pageSize));
        const [s, listResp] = await Promise.all([
          fetchJson(`/api/v1/admin/logistics/stats/?days=${days}`),
          fetchJson(`/api/v1/admin/logistics/shipments/?${params.toString()}`),
        ]);
        if (cancelled) return;
        setStats(s);
        const rows = Array.isArray(listResp?.results) ? listResp.results : [];
        const cnt = Number(listResp?.count || 0);
        setShipments(rows);
        setShipCount(Number.isFinite(cnt) ? cnt : 0);
        setShipTotalPages(Math.max(1, Math.ceil((Number.isFinite(cnt) ? cnt : 0) / pageSize)));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load deliveries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, shipPage]);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Deliveries</h1>
          <p className="text-muted-foreground text-[0.875rem]">Real shipment list from logistics.</p>
        </div>
        <select
          value={String(days)}
          onChange={(e) => {
            setDays(Number(e.target.value) || 7);
            setShipPage(1);
          }}
          className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="In Transit" value={typeof stats?.in_transit === "number" ? stats.in_transit : "—"} icon={<Truck size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={0} accentColor="#3B82F6" />
        <StatCard label="Active Vehicles" value={typeof stats?.active_vehicles === "number" ? `${stats.active_vehicles}/${stats.total_vehicles}` : "—"} icon={<MapPin size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        <StatCard label="On-Time Rate" value={typeof stats?.on_time_rate === "number" ? `${Number(stats.on_time_rate).toFixed(1)}%` : "—"} icon={<Clock size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={2} accentColor="#0171E3" />
        <StatCard label="Shipments" value={shipCount.toLocaleString()} icon={<Hash size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">All Deliveries</h2>
          {error && <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem] mb-4">{error}</div>}
          {loading ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              Loading shipments…
            </div>
          ) : shipments.length === 0 ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              No shipments yet.
            </div>
          ) : (
            <div className="space-y-2">
              {shipments.map((d: any, i: number) => {
                const st = (d?.status || "").toString().toLowerCase();
                return (
                  <motion.div
                    key={d?.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/8 flex items-center justify-center">
                      <Truck size={18} className="text-[#3B82F6]/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.875rem] text-foreground truncate">{d?.destination || "—"}</span>
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/50 block truncate">
                        {(d?.seller || "—")} · ORD-{d?.order_id ?? "—"} · {d?.tracking_number ? `#${d.tracking_number}` : "no tracking"}
                      </span>
                    </div>
                    <StatusPill status={deliveryStatusMap[st]?.status || "neutral"} label={deliveryStatusMap[st]?.label || st || "—"} pulse={st === "in_transit" || st === "out_for_delivery"} />
                  </motion.div>
                );
              })}
            </div>
          )}
          {!loading && shipTotalPages > 1 && (
            <div className="pt-4 flex items-center justify-between">
              <div className="text-[0.75rem] text-muted-foreground/60">Page {shipPage} / {shipTotalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setShipPage((p) => Math.max(1, p - 1))}
                  disabled={shipPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setShipPage((p) => Math.min(shipTotalPages, p + 1))}
                  disabled={shipPage >= shipTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → WORKFORCE
// ════════════════════════════════════════════════════════════

export function ManagementWorkforce() {
  const fetchJson = fetchJsonAuthed;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logistics, setLogistics] = useState<any>(null);
  const [inspectors, setInspectors] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = (adminRole: string) => {
          const p = new URLSearchParams();
          p.set("role", "admin");
          p.set("admin_role", adminRole);
          p.set("page", "1");
          p.set("page_size", "25");
          return p;
        };
        const [l, i] = await Promise.all([
          fetchJson(`/api/v1/admin/users/?${params("logistics").toString()}`),
          fetchJson(`/api/v1/admin/users/?${params("inspector").toString()}`),
        ]);
        if (cancelled) return;
        setLogistics(l);
        setInspectors(i);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load workforce.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logisticsCount = Number(logistics?.count || 0) || 0;
  const inspectorCount = Number(inspectors?.count || 0) || 0;
  const staffCount = logisticsCount + inspectorCount;
  const staffRows = [
    ...((Array.isArray(logistics?.results) ? logistics.results : []).map((u: any) => ({ ...u, team: "Logistics" }))),
    ...((Array.isArray(inspectors?.results) ? inspectors.results : []).map((u: any) => ({ ...u, team: "Inspection" }))),
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Workforce</h1>
          <p className="text-muted-foreground text-[0.875rem]">Admin teams (Logistics + Inspectors) from real users.</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<UserCheck size={16} />}>Invite Member</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Staff" value={staffCount.toLocaleString()} icon={<Users size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={0} accentColor="#30A46C" />
        <StatCard label="Logistics" value={logisticsCount.toLocaleString()} icon={<Truck size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={1} accentColor="#0171E3" />
        <StatCard label="Inspectors" value={inspectorCount.toLocaleString()} icon={<Shield size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Status" value={loading ? "Loading" : error ? "Error" : "OK"} icon={<Clock size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Team Members</h2>
          {error && <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem] mb-4">{error}</div>}
          {loading ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              Loading staff…
            </div>
          ) : staffRows.length === 0 ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              No staff found.
            </div>
          ) : (
            <div className="space-y-2">
              {staffRows.map((u: any, i: number) => (
                <div key={u?.id || i} className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors">
                  <span className="text-[0.75rem] text-muted-foreground/30 w-5">{i + 1}</span>
                  <div className="w-10 h-10 rounded-2xl bg-primary/8 text-primary text-[0.75rem] flex items-center justify-center">
                    {((u?.first_name || "U")[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.875rem] text-foreground block truncate">{(u?.email || u?.phone || `User #${u?.id}`) || "—"}</span>
                    <span className="text-[0.75rem] text-muted-foreground/50 block truncate">{u?.team || "Admin"}</span>
                  </div>
                  <StatusPill status="info" label="active" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  MANAGEMENT → B2B ACCOUNTS
// ════════════════════════════════════════════════════════════

export function ManagementB2B() {
  const fetchJson = fetchJsonAuthed;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await fetchJson("/api/v1/admin/overview?period=30d");
        if (cancelled) return;
        setOverview(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load B2B overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = Array.isArray(overview?.regions) ? overview.regions : [];
  const channels = Array.isArray(overview?.channels) ? overview.channels : [];
  const revenue = overview?.hero?.total_revenue?.total ?? 0;

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">B2B Accounts</h1>
          <p className="text-muted-foreground text-[0.875rem]">Revenue mix and regions (real overview data).</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<Building2 size={16} />}>Add Account</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Revenue (30d)" value={`$${Math.round(Number(revenue) || 0).toLocaleString()}`} icon={<DollarSign size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={0} accentColor="#30A46C" />
        <StatCard label="Top Regions" value={regions.length ? String(regions.length) : "—"} icon={<Globe size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={1} accentColor="#0171E3" />
        <StatCard label="Channels" value={channels.length ? String(channels.length) : "—"} icon={<BarChart3 size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        <StatCard label="Status" value={loading ? "Loading" : error ? "Error" : "OK"} icon={<Clock size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Top Regions</h2>
          {error && <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem] mb-4">{error}</div>}
          {loading ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              Loading…
            </div>
          ) : regions.length === 0 ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              No payments/regions yet.
            </div>
          ) : (
            <div className="space-y-2">
              {regions.map((r: any, i: number) => (
                <motion.div
                  key={`${r?.label}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
                >
                  <span className="text-[0.875rem] text-foreground">{r?.label || "Unknown"}</span>
                  <span className="text-[0.8125rem] text-muted-foreground/60">${Math.round(Number(r?.value || 0) || 0).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
