"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Users,
  Package,
  Truck,
  ShieldCheck,
  TrendingUp,
  Activity,
  Search,
  UserPlus,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ArrowUp,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { fetchJsonAuthed } from "@/lib/api";
import {
  CustomAreaChart,
  GaugeChart,
  HorizontalBarList,
  CustomDonutChart,
} from "./CustomCharts";

/*
 * ════════════════════════════════════════════════════════════
 *  ADMIN DASHBOARD — PLATONIC DESIGN
 *
 *  Philosophy: A child should understand what's happening
 *  at TradeFlow in under 3 seconds of looking at this page.
 *
 *  Visual hierarchy:
 *  1. The 4 hero numbers (stats) — immediate comprehension
 *  2. Revenue trend — the story of growth
 *  3. Health/Alerts — anything needing attention
 *  4. Details — for those who want to go deeper
 *
 *  Everything breathes. Nothing shouts. The important speaks.
 * ════════════════════════════════════════════════════════════
 */

// ─── Card wrapper — consistent, breathing container ─────
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card rounded-[1.25rem] p-7 
        shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]
        ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [overview, setOverview] = useState<any>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const go = (path: string) => {
    const raw = (path || "").toString();
    if (!raw) return;
    const normalized = raw === "/admin" ? "/" : raw.startsWith("/admin/") ? raw.slice("/admin".length) : raw;
    navigate(normalized);
  };

  const formatCompact = (n: any) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "—";
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toFixed(0);
  };

  const fmtPct = (v: any, digits = 1) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0.0%";
    return `${n.toFixed(digits)}%`;
  };

  const relativeTime = (iso: any) => {
    const d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) return "—";
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} days ago`;
  };

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchJsonAuthed(`/api/v1/admin/overview?period=${encodeURIComponent(selectedPeriod)}`, {
          signal: ctrl.signal,
        } as any);
        setOverview(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Network error.");
        setOverview(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [selectedPeriod, refreshNonce]);

  const hero = overview?.hero || {};
  const totalRevenue = hero?.total_revenue || {};
  const activeOrders = hero?.active_orders || {};
  const usersOnline = hero?.users_online || {};
  const qualityScore = hero?.quality_score || {};

  const revenueFlow = overview?.revenue_flow || {};
  const revenuePoints = revenueFlow?.points?.length ? revenueFlow.points : [{ label: "", b2b: 0, b2c: 0 }];

  const health = overview?.health || {};
  const healthScore = Number(health?.score);
  const healthColor = Number.isFinite(healthScore) && healthScore >= 97 ? "#30A46C" : "#FFB224";

  const regionPalette = ["#0171E3", "#3B82F6", "#30A46C", "#D97706", "#EC4899"];
  const regions = (overview?.regions || []).map((r: any, i: number) => ({
    label: r?.label || "Unknown",
    value: Number(r?.value) || 0,
    color: regionPalette[i % regionPalette.length],
  }));

  const channelColors: Record<string, string> = {
    "B2B Direct": "#0171E3",
    "B2C Marketplace": "#30A46C",
    Wholesale: "#FFB224",
    Referral: "#3B82F6",
  };
  const channels = (overview?.channels || []).map((c: any) => ({
    name: c?.name || "Unknown",
    value: Number(c?.value) || 0,
    color: channelColors[c?.name] || "#A0A0A8",
  }));

  const alerts = overview?.alerts || [];
  const setupGuidance = overview?.setup_guidance || [];
  const activities = overview?.activity || [];
  const pipelines = overview?.pipelines || {};
  const ordersPipeline = pipelines?.orders || {};
  const sellersPipeline = pipelines?.sellers || {};
  const listingsPipeline = pipelines?.listings || {};
  const logisticsPipeline = pipelines?.logistics || {};
  const paymentsPipeline = pipelines?.payments || {};
  const [alertsQuery, setAlertsQuery] = useState("");
  const [alertsType, setAlertsType] = useState<"all" | "warning" | "info">("all");
  const [alertsPage, setAlertsPage] = useState(1);
  const alertsPageSize = 5;

  const [activityQuery, setActivityQuery] = useState("");
  const [activityGroup, setActivityGroup] = useState<"all" | "users" | "verification" | "quality" | "logistics" | "other">("all");
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;

  useEffect(() => {
    setAlertsPage(1);
    setActivityPage(1);
    setAlertsQuery("");
    setAlertsType("all");
    setActivityQuery("");
    setActivityGroup("all");
  }, [selectedPeriod, refreshNonce]);

  const filteredAlerts = useMemo(() => {
    const q = alertsQuery.trim().toLowerCase();
    return (alerts || []).filter((a: any) => {
      const t = (a?.type || "").toString().toLowerCase();
      if (alertsType !== "all" && t !== alertsType) return false;
      if (!q) return true;
      const hay = `${a?.message || ""} ${a?.action || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [alerts, alertsQuery, alertsType]);

  const filteredActivities = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    return (activities || []).filter((a: any) => {
      const path = (a?.path || "").toString();
      const group =
        path.includes("/admin/users") ? "users" :
        path.includes("/admin/verification") ? "verification" :
        path.includes("/admin/quality") ? "quality" :
        path.includes("/admin/logistics") ? "logistics" :
        "other";
      if (activityGroup !== "all" && group !== activityGroup) return false;
      if (!q) return true;
      const hay = `${a?.user || ""} ${a?.action || ""} ${a?.target || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activities, activityQuery, activityGroup]);

  const alertsTotalPages = Math.max(1, Math.ceil(filteredAlerts.length / alertsPageSize));
  const activityTotalPages = Math.max(1, Math.ceil(filteredActivities.length / activityPageSize));
  const pagedAlerts = filteredAlerts.slice((alertsPage - 1) * alertsPageSize, alertsPage * alertsPageSize);
  const pagedActivities = filteredActivities.slice((activityPage - 1) * activityPageSize, activityPage * activityPageSize);

  return (
    <div className="space-y-7">
      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <motion.h1
            className="text-foreground tracking-tight mb-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Platform Overview
          </motion.h1>
          <motion.p
            className="text-muted-foreground/70 text-[0.875rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Everything happening across TradeFlow, at a glance.
          </motion.p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshNonce((n) => n + 1)}
            className="px-4 py-2 rounded-xl text-[0.75rem] bg-black/[0.025] hover:bg-black/[0.04] text-muted-foreground hover:text-foreground transition-all duration-300 disabled:opacity-50"
            disabled={loading}
          >
            Retry
          </button>
          <div className="flex items-center gap-1.5 bg-black/[0.025] rounded-2xl p-1.5">
            {["24h", "7d", "30d", "90d"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl text-[0.75rem] transition-all duration-400 cursor-pointer ${
                  selectedPeriod === period
                    ? "bg-card text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(loading || error) && (
        <div className="px-4 py-3 rounded-2xl bg-black/[0.012] border border-black/[0.03] text-[0.8125rem]">
          <span className={error ? "text-[#E5484D]" : "text-muted-foreground/70"}>{error || "Loading…"}</span>
        </div>
      )}

      {/* ─── Hero Stats — THE most important numbers ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading && !overview ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-[1.25rem] p-7 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]"
            >
              <div className="h-3 w-24 bg-black/[0.06] rounded animate-pulse" />
              <div className="mt-4 h-8 w-32 bg-black/[0.06] rounded animate-pulse" />
              <div className="mt-3 h-3 w-40 bg-black/[0.06] rounded animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <button
              type="button"
              onClick={() => totalRevenue?.path && go(totalRevenue.path)}
              className="text-left rounded-[1.25rem] ring-2 ring-transparent hover:ring-primary/15 focus:outline-none focus:ring-primary/25 transition-all"
            >
              <StatCard
                label="Total Revenue"
                value={`$${formatCompact(totalRevenue?.total)}`}
                change={`${Number(totalRevenue?.change_pct || 0) >= 0 ? "+" : ""}${fmtPct(totalRevenue?.change_pct)}`}
                changeType={Number(totalRevenue?.change_pct || 0) > 0 ? "positive" : Number(totalRevenue?.change_pct || 0) < 0 ? "negative" : "neutral"}
                icon={<TrendingUp size={20} className="text-primary" />}
                iconBg="bg-primary/8"
                index={0}
                subtitle={`B2B $${formatCompact(totalRevenue?.b2b)} · B2C $${formatCompact(totalRevenue?.b2c)}`}
                sparklineData={totalRevenue?.sparkline || []}
                sparklineColor="#0171E3"
                accentColor="#0171E3"
              />
            </button>
            <button
              type="button"
              onClick={() => activeOrders?.path && go(activeOrders.path)}
              className="text-left rounded-[1.25rem] ring-2 ring-transparent hover:ring-[#3B82F6]/20 focus:outline-none focus:ring-[#3B82F6]/25 transition-all"
            >
              <StatCard
                label="Active Orders"
                value={(Number(activeOrders?.total) || 0).toLocaleString()}
                change={`${Number(activeOrders?.change_pct || 0) >= 0 ? "+" : ""}${fmtPct(activeOrders?.change_pct)}`}
                changeType={Number(activeOrders?.change_pct || 0) > 0 ? "positive" : Number(activeOrders?.change_pct || 0) < 0 ? "negative" : "neutral"}
                icon={<Package size={20} className="text-[#3B82F6]" />}
                iconBg="bg-[#3B82F6]/8"
                index={1}
                subtitle={`Now ${Number(activeOrders?.snapshot_total || 0).toLocaleString()} open · ${selectedPeriod}`}
                sparklineData={activeOrders?.sparkline || []}
                sparklineColor="#3B82F6"
                accentColor="#3B82F6"
              />
            </button>
            <button
              type="button"
              onClick={() => usersOnline?.path && go(usersOnline.path)}
              className="text-left rounded-[1.25rem] ring-2 ring-transparent hover:ring-[#30A46C]/20 focus:outline-none focus:ring-[#30A46C]/25 transition-all"
            >
              <StatCard
                label="Active Users"
                value={(Number(usersOnline?.total) || 0).toLocaleString()}
                change={`${Number(usersOnline?.change_abs || 0) >= 0 ? "+" : ""}${Number(usersOnline?.change_abs || 0).toLocaleString()}`}
                changeType={Number(usersOnline?.change_abs || 0) > 0 ? "positive" : Number(usersOnline?.change_abs || 0) < 0 ? "negative" : "neutral"}
                icon={<Users size={20} className="text-[#30A46C]" />}
                iconBg="bg-[#30A46C]/8"
                index={2}
                subtitle={`Online now ${Number(usersOnline?.snapshot_total || 0).toLocaleString()} · ${Number(usersOnline?.sellers || 0)} sellers · ${Number(usersOnline?.workers || 0)} workers · ${Number(usersOnline?.buyers || 0)} buyers · ${selectedPeriod}`}
                sparklineData={usersOnline?.sparkline || []}
                sparklineColor="#30A46C"
                accentColor="#30A46C"
              />
            </button>
            <button
              type="button"
              onClick={() => qualityScore?.path && go(qualityScore.path)}
              className="text-left rounded-[1.25rem] ring-2 ring-transparent hover:ring-[#D97706]/20 focus:outline-none focus:ring-[#D97706]/25 transition-all"
            >
              <StatCard
                label="Quality Score"
                value={`${(Number(qualityScore?.value) || 0).toFixed(1)}%`}
                change={`${Number(qualityScore?.change_pct || 0) >= 0 ? "+" : ""}${fmtPct(qualityScore?.change_pct)}`}
                changeType={Number(qualityScore?.change_pct || 0) > 0 ? "positive" : Number(qualityScore?.change_pct || 0) < 0 ? "negative" : "neutral"}
                icon={<ShieldCheck size={20} className="text-[#D97706]" />}
                iconBg="bg-[#D97706]/8"
                index={3}
                subtitle={`Based on ${(Number(qualityScore?.inspections) || 0).toLocaleString()} inspections`}
                sparklineData={qualityScore?.sparkline || []}
                sparklineColor="#D97706"
                accentColor="#D97706"
              />
            </button>
          </>
        )}
      </div>

      {/* ─── Revenue Story + Platform Health ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue — Lead with the answer */}
        <Section className="lg:col-span-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Revenue Flow
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                B2B vs B2C performance over time
              </p>
            </div>
            <div className="flex items-center gap-5 text-[0.6875rem] text-muted-foreground/60">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary opacity-70" />
                B2B
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#30A46C] opacity-70" />
                B2C
              </span>
            </div>
          </div>

          {/* THE ANSWER — biggest element */}
          <div className="flex items-baseline gap-3 mb-6 mt-3">
            <span className="text-[2.75rem] text-foreground tracking-[-0.03em] leading-none tabular-nums">
              ${formatCompact(revenueFlow?.total)}
            </span>
            <span
              className={`flex items-center gap-1 text-[0.75rem] mb-1 ${
                Number(revenueFlow?.change_pct || 0) >= 0 ? "text-[#30A46C]" : "text-[#E5484D]"
              }`}
            >
              <ArrowUp size={12} />
              {`${Number(revenueFlow?.change_pct || 0) >= 0 ? "+" : ""}${fmtPct(revenueFlow?.change_pct)} vs last period`}
            </span>
          </div>

          <CustomAreaChart
            data={revenuePoints}
            xKey="label"
            series={[
              { dataKey: "b2b", color: "#0171E3", label: "B2B" },
              { dataKey: "b2c", color: "#30A46C", label: "B2C" },
            ]}
            height={220}
            yFormatter={(v) => `$${Math.round(v / 1000)}k`}
          />
        </Section>

        {/* Platform Health — Clean, honest status */}
        <Section>
          <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase mb-1">
            Platform Health
          </p>
          <p className="text-muted-foreground/50 text-[0.6875rem] mb-6">
            All systems operational
          </p>

          <div className="flex justify-center mb-6">
            <GaugeChart
              value={Number.isFinite(healthScore) ? Math.round(healthScore) : 0}
              color={healthColor}
              label={health?.label || "Healthy"}
              sublabel={health?.sublabel || ""}
            />
          </div>

          <div className="space-y-1.5 mt-4">
            {(health?.systems || []).map((item: any) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.015] transition-colors duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-[5px] h-[5px] rounded-full ${
                      item.status === "success"
                        ? "bg-[#30A46C]"
                        : "bg-[#FFB224]"
                    }`}
                  />
                  <span className="text-[0.8125rem] text-foreground/80">
                    {item.label}
                  </span>
                </div>
                <span className="text-[0.6875rem] text-muted-foreground/60 tabular-nums">
                  {(Number(item.uptime) || 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── Revenue by Region + Channel Mix ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Revenue by Region
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                Top performing markets
              </p>
            </div>
            <span className="text-[0.6875rem] text-muted-foreground/40">
              Last 30 days
            </span>
          </div>
          <HorizontalBarList
            data={regions}
            valueFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
          />
        </Section>

        <Section>
          <div className="mb-6">
            <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
              Sales Channels
            </p>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
              Revenue distribution
            </p>
          </div>
          <div className="flex items-center gap-10">
            <CustomDonutChart
              data={channels}
              size={150}
              centerValue={`$${formatCompact(totalRevenue?.total)}`}
              centerLabel="Total"
              thickness={24}
            />
            <div className="flex-1 space-y-3.5">
              {channels.map((item: any) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-[3px]"
                      style={{ background: item.color, opacity: 0.75 }}
                    />
                    <span className="text-[0.8125rem] text-foreground/80">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[0.8125rem] text-muted-foreground/60 tabular-nums">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Orders Pipeline
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                Status + aging
              </p>
            </div>
            <button
              type="button"
              onClick={() => go("/admin/management/orders")}
              className="text-[0.75rem] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              View <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { k: "created", label: "Created" },
              { k: "accepted", label: "Accepted" },
              { k: "shipped", label: "Shipped" },
              { k: "delivered", label: "Delivered" },
              { k: "disputed", label: "Disputed" },
              { k: "cancelled", label: "Cancelled" },
            ].map((row) => (
              <button
                key={row.k}
                type="button"
                onClick={() => go(`/admin/management/orders?status=${encodeURIComponent(row.k)}`)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.8125rem] text-foreground/80">{row.label}</span>
                  <span className="text-[0.6875rem] text-muted-foreground/50 tabular-nums">
                    {Number(ordersPipeline?.oldest_days_by_status?.[row.k] || 0) > 0 ? `oldest ${Number(ordersPipeline?.oldest_days_by_status?.[row.k]).toFixed(1)}d` : ""}
                  </span>
                </div>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {Number(ordersPipeline?.counts?.[row.k] || 0).toLocaleString()}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => go("/admin/management/orders?overdue_deadline=1")}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
            >
              <span className="text-[0.8125rem] text-foreground/80">Overdue deadlines</span>
              <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                {Number(ordersPipeline?.overdue_deadline || 0).toLocaleString()}
              </span>
            </button>
          </div>
        </Section>

        <Section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Listings Pipeline
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                Review + compliance
              </p>
            </div>
            <button
              type="button"
              onClick={() => go("/admin/products")}
              className="text-[0.75rem] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              View <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { key: "pending_products", label: "Pending products", path: "/admin/products?status=pending" },
              { key: "rejected_products", label: "Rejected products", path: "/admin/products?status=rejected" },
              { key: "rejected_with_reason", label: "Rejected w/ reason", path: "/admin/products?status=rejected&rejected_with_reason=1" },
              { key: "missing_hs_code", label: "Missing HS code", path: "/admin/products?missing_hs_code=1" },
              { key: "missing_images", label: "Missing images", path: "/admin/products?missing_media=1" },
              { key: "missing_documents", label: "Missing documents", path: "/admin/products?missing_documents=1" },
            ].map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => go(row.path)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">{row.label}</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {Number(listingsPipeline?.[row.key] || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Sellers & KYC
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                Verification workload
              </p>
            </div>
            <button
              type="button"
              onClick={() => go("/admin/verification")}
              className="text-[0.75rem] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              View <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { key: "pending_verifications", label: "Pending sellers", path: "/admin/verification" },
              { key: "rejected_verifications", label: "Rejected sellers", path: "/admin/verification" },
              { key: "pending_kyc_docs", label: "Pending KYC docs", path: "/admin/verification" },
              { key: "expiring_docs_30d", label: "Expiring docs (30d)", path: "/admin/verification" },
            ].map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => go(row.path)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">{row.label}</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {Number(sellersPipeline?.[row.key] || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
                Logistics & Payments
              </p>
              <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
                Shipping issues, disputes, and money flow
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go("/admin/logistics")}
                className="text-[0.75rem] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                Logistics <ArrowUpRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => go(`/admin/management/costs?period=${encodeURIComponent(selectedPeriod)}`)}
                className="text-[0.75rem] text-muted-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                Finance <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2.5">
              {[
                { key: "in_transit", label: "Shipments in transit", path: "/admin/logistics?status=in_transit" },
                { key: "late_deliveries", label: "Late deliveries", path: "/admin/logistics" },
                { key: "no_tracking_number", label: "No tracking #", path: "/admin/logistics" },
                { key: "stuck_7d", label: "Stuck > 7d", path: "/admin/logistics" },
              ].map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => go(row.path)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
                >
                  <span className="text-[0.8125rem] text-foreground/80">{row.label}</span>
                  <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                    {Number(logisticsPipeline?.[row.key] || 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => go(`/admin/management/costs?period=${encodeURIComponent(selectedPeriod)}`)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Payments available</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {paymentsPipeline?.available ? "Yes" : "No"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => go(`/admin/management/costs?period=${encodeURIComponent(selectedPeriod)}`)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Held amount</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  ${formatCompact(paymentsPipeline?.held_amount || 0)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => go(`/admin/management/costs?period=${encodeURIComponent(selectedPeriod)}`)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Released amount</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  ${formatCompact(paymentsPipeline?.released_amount || 0)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => go("/admin/legal/disputes")}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Open disputes</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {Number(paymentsPipeline?.open_disputes || 0).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => go("/admin/legal/disputes")}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Disputed amount</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  ${formatCompact(paymentsPipeline?.disputed_amount || 0)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => go("/admin/verification")}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.012] border border-black/[0.03] hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[0.8125rem] text-foreground/80">Release conditions pending</span>
                <span className="text-[0.8125rem] text-muted-foreground/70 tabular-nums">
                  {Number(paymentsPipeline?.release_conditions_pending || 0).toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        </Section>
      </div>

      {setupGuidance.length > 0 && (
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/6 flex items-center justify-center">
              <BarChart3 size={15} className="text-primary/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Setup Guidance</p>
              <p className="text-[0.6875rem] text-muted-foreground/50">
                {setupGuidance.length} quick fixes to make the dashboard feel alive
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {setupGuidance.map((g: any, i: number) => (
              <motion.div
                key={g?.key || `${g?.title}-${i}`}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-black/[0.012] hover:bg-black/[0.025] transition-all duration-400 cursor-pointer group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => go(g.path || "/admin/settings")}
              >
                <div className="w-[6px] h-[6px] rounded-full mt-2 flex-shrink-0 bg-primary/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/85 leading-relaxed">
                    {g.title || g.message || "Setup"}
                  </p>
                  {g.message && g.title && (
                    <p className="text-[0.6875rem] text-muted-foreground/55 mt-1 leading-relaxed">
                      {g.message}
                    </p>
                  )}
                  {g.occurred_at && (
                    <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5">
                      {relativeTime(g.occurred_at)}
                    </p>
                  )}
                </div>
                <button
                  className="text-[0.75rem] text-primary/60 hover:text-primary whitespace-nowrap cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(g.path || "/admin/settings");
                  }}
                >
                  {g.action || "Open"} <ArrowUpRight size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Alerts & Activity ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attention Needed */}
        <Section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#E5484D]/6 flex items-center justify-center">
              <AlertCircle size={15} className="text-[#E5484D]/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">
                Attention Needed
              </p>
              <p className="text-[0.6875rem] text-muted-foreground/50">
                {filteredAlerts.length} items require action
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex items-center gap-2 bg-black/[0.012] border border-black/[0.03] rounded-2xl px-4 py-2.5 flex-1">
              <Search size={14} className="text-muted-foreground/50" />
              <input
                value={alertsQuery}
                onChange={(e) => {
                  setAlertsQuery(e.target.value);
                  setAlertsPage(1);
                }}
                placeholder="Search alerts..."
                className="bg-transparent border-none outline-none text-[0.8125rem] text-foreground/80 placeholder:text-muted-foreground/40 w-full"
              />
            </div>
            <select
              value={alertsType}
              onChange={(e) => {
                setAlertsType(e.target.value as any);
                setAlertsPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl text-[0.8125rem] bg-black/[0.012] border border-black/[0.03] text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <option value="all">All</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
            {loading && !overview ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-black/[0.012]">
                  <div className="h-3 w-3/4 bg-black/[0.06] rounded animate-pulse" />
                  <div className="mt-2 h-2 w-24 bg-black/[0.06] rounded animate-pulse" />
                </div>
              ))
            ) : filteredAlerts.length === 0 ? (
              <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
                No alerts right now.
              </div>
            ) : (
              pagedAlerts.map((alert: any, i: number) => (
                <motion.div
                  key={`${alert.type}-${alert.message}-${i}`}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-black/[0.012] hover:bg-black/[0.025] transition-all duration-400 cursor-pointer group"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => go(alert.path || "/admin")}
                >
                  <div
                    className={`w-[6px] h-[6px] rounded-full mt-2 flex-shrink-0 ${
                      alert.type === "warning" ? "bg-[#FFB224]" : "bg-[#3B82F6]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] text-foreground/80 leading-relaxed">{alert.message}</p>
                    <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5">{relativeTime(alert.occurred_at)}</p>
                  </div>
                  <button
                    className="text-[0.75rem] text-primary/60 hover:text-primary whitespace-nowrap cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(alert.path || "/admin");
                    }}
                  >
                    {alert.action}
                  </button>
                </motion.div>
              ))
            )}
          </div>
          {!loading && filteredAlerts.length > 0 && (
            <div className="pt-3 flex items-center justify-between gap-3">
              <div className="text-[0.75rem] text-muted-foreground/60">
                Page {alertsPage} / {alertsTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setAlertsPage((p) => Math.max(1, p - 1))}
                  disabled={alertsPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setAlertsPage((p) => Math.min(alertsTotalPages, p + 1))}
                  disabled={alertsPage >= alertsTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Live Activity */}
        <Section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/6 flex items-center justify-center">
                <Activity size={15} className="text-primary/70" />
              </div>
              <div>
                <p className="text-[0.875rem] text-foreground/90">
                  Live Activity
                </p>
                <p className="text-[0.6875rem] text-muted-foreground/50">
                  Real-time platform events
                </p>
              </div>
            </div>
            <StatusPill status="success" label="Live" pulse />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex items-center gap-2 bg-black/[0.012] border border-black/[0.03] rounded-2xl px-4 py-2.5 flex-1">
              <Search size={14} className="text-muted-foreground/50" />
              <input
                value={activityQuery}
                onChange={(e) => {
                  setActivityQuery(e.target.value);
                  setActivityPage(1);
                }}
                placeholder="Search logs..."
                className="bg-transparent border-none outline-none text-[0.8125rem] text-foreground/80 placeholder:text-muted-foreground/40 w-full"
              />
            </div>
            <select
              value={activityGroup}
              onChange={(e) => {
                setActivityGroup(e.target.value as any);
                setActivityPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl text-[0.8125rem] bg-black/[0.012] border border-black/[0.03] text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <option value="all">All</option>
              <option value="users">Users</option>
              <option value="verification">Verification</option>
              <option value="quality">Quality</option>
              <option value="logistics">Logistics</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1 max-h-[46vh] overflow-y-auto pr-1">
            {loading && !overview ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-2xl bg-black/[0.012]">
                  <div className="w-9 h-9 rounded-full bg-black/[0.06] animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-3/4 bg-black/[0.06] rounded animate-pulse" />
                    <div className="mt-2 h-2 w-24 bg-black/[0.06] rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : filteredActivities.length === 0 ? (
              <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
                No activity yet.
              </div>
            ) : (
              pagedActivities.map((activity: any, i: number) => (
                <motion.div
                  key={activity?.id || `${activity.user}-${activity.action}-${activity.target}-${i}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-black/[0.015] transition-all duration-400 cursor-pointer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => go(activity.path || "/admin")}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-white text-[0.625rem] flex-shrink-0">
                    {activity.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] text-foreground/80">
                      <span>{activity.user}</span>{" "}
                      <span className="text-muted-foreground/60">{activity.action}</span>{" "}
                      <span className="text-primary/70">{activity.target}</span>
                    </p>
                    <p className="text-[0.625rem] text-muted-foreground/40 mt-0.5">{relativeTime(activity.occurred_at)}</p>
                  </div>
                  <ArrowUpRight size={13} className="text-muted-foreground/20" />
                </motion.div>
              ))
            )}
          </div>
          {!loading && filteredActivities.length > 0 && (
            <div className="pt-3 flex items-center justify-between gap-3">
              <div className="text-[0.75rem] text-muted-foreground/60">
                Page {activityPage} / {activityTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={activityPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70 disabled:opacity-50"
                  onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                  disabled={activityPage >= activityTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ─── Quick Actions — Inviting, not cluttered ── */}
      <Section>
        <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase mb-5">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              icon: <UserPlus size={20} />,
              label: "Add User",
              color: "#0171E3",
              desc: "Invite team member",
              path: "/users",
            },
            {
              icon: <Package size={20} />,
              label: "New Product",
              color: "#3B82F6",
              desc: "Create listing",
              path: "/products",
            },
            {
              icon: <Truck size={20} />,
              label: "Track Delivery",
              color: "#30A46C",
              desc: "Live tracking",
              path: "/logistics",
            },
            {
              icon: <BarChart3 size={20} />,
              label: "View Reports",
              color: "#D97706",
              desc: "Analytics & insights",
              path: "/",
            },
          ].map((action) => (
            <motion.button
              key={action.label}
              className="flex flex-col items-center gap-3 py-7 px-5 rounded-2xl bg-black/[0.01] hover:bg-black/[0.025] 
                border border-black/[0.03] hover:border-black/[0.06]
                transition-all duration-500 cursor-pointer group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => go(action.path)}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `${action.color}08`,
                  color: action.color,
                }}
              >
                {action.icon}
              </div>
              <div className="text-center">
                <p className="text-[0.8125rem] text-foreground/80">
                  {action.label}
                </p>
                <p className="text-[0.625rem] text-muted-foreground/50 mt-0.5">
                  {action.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </Section>
    </div>
  );
}
