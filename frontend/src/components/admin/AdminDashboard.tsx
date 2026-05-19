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
  UserPlus,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ArrowUp,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
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

  const apiBase = useMemo(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const normalize = (u: string) => u.replace(/\/$/, "");
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
      return normalize(fromEnv);
    }
    if (typeof window !== "undefined") {
      return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
    }
    return "http://localhost:8000";
  }, []);

  const access = useMemo(() => {
    try {
      return window.localStorage.getItem("vehsl.access") || "";
    } catch {
      return "";
    }
  }, []);

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
    if (!access) {
      setError("Not signed in.");
      setOverview(null);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${apiBase}/api/v1/admin/overview?period=${encodeURIComponent(selectedPeriod)}`, {
          headers: { Authorization: `Bearer ${access}` },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setError("Failed to load overview.");
          setOverview(null);
          return;
        }
        const data = await res.json();
        setOverview(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError("Network error.");
        setOverview(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [access, apiBase, selectedPeriod]);

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
  const activities = overview?.activity || [];

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

      {(loading || error) && (
        <div className="px-4 py-3 rounded-2xl bg-black/[0.012] border border-black/[0.03] text-[0.8125rem]">
          <span className={error ? "text-[#E5484D]" : "text-muted-foreground/70"}>{error || "Loading…"}</span>
        </div>
      )}

      {/* ─── Hero Stats — THE most important numbers ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
        <StatCard
          label="Active Orders"
          value={(Number(activeOrders?.total) || 0).toLocaleString()}
          change={`${Number(activeOrders?.change_pct || 0) >= 0 ? "+" : ""}${fmtPct(activeOrders?.change_pct)}`}
          changeType={Number(activeOrders?.change_pct || 0) > 0 ? "positive" : Number(activeOrders?.change_pct || 0) < 0 ? "negative" : "neutral"}
          icon={<Package size={20} className="text-[#3B82F6]" />}
          iconBg="bg-[#3B82F6]/8"
          index={1}
          subtitle={`${Number(activeOrders?.b2b || 0).toLocaleString()} B2B · ${Number(activeOrders?.b2c || 0).toLocaleString()} B2C`}
          sparklineData={activeOrders?.sparkline || []}
          sparklineColor="#3B82F6"
          accentColor="#3B82F6"
        />
        <StatCard
          label="Users Online"
          value={(Number(usersOnline?.total) || 0).toLocaleString()}
          change={`${Number(usersOnline?.change_abs || 0) >= 0 ? "+" : ""}${Number(usersOnline?.change_abs || 0).toLocaleString()}`}
          changeType={Number(usersOnline?.change_abs || 0) > 0 ? "positive" : Number(usersOnline?.change_abs || 0) < 0 ? "negative" : "neutral"}
          icon={<Users size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={2}
          subtitle={`${Number(usersOnline?.sellers || 0)} sellers · ${Number(usersOnline?.workers || 0)} workers · ${Number(usersOnline?.buyers || 0)} buyers`}
          sparklineData={usersOnline?.sparkline || []}
          sparklineColor="#30A46C"
          accentColor="#30A46C"
        />
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
                {alerts.length} items require action
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {alerts.map((alert: any, i: number) => (
              <motion.div
                key={`${alert.type}-${alert.message}-${i}`}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-black/[0.012] hover:bg-black/[0.025] transition-all duration-400 cursor-pointer group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(alert.path || "/admin")}
              >
                <div
                  className={`w-[6px] h-[6px] rounded-full mt-2 flex-shrink-0 ${
                    alert.type === "warning"
                      ? "bg-[#FFB224]"
                      : "bg-[#3B82F6]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/80 leading-relaxed">
                    {alert.message}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5">
                    {relativeTime(alert.occurred_at)}
                  </p>
                </div>
                <button
                  className="text-[0.75rem] text-primary/60 hover:text-primary whitespace-nowrap cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(alert.path || "/admin");
                  }}
                >
                  {alert.action}
                </button>
              </motion.div>
            ))}
          </div>
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

          <div className="space-y-1">
            {activities.map((activity: any, i: number) => (
              <motion.div
                key={`${activity.user}-${activity.action}-${activity.target}-${i}`}
                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-black/[0.015] transition-all duration-400 cursor-pointer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(activity.path || "/admin")}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-white text-[0.625rem] flex-shrink-0">
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/80">
                    <span>{activity.user}</span>{" "}
                    <span className="text-muted-foreground/60">
                      {activity.action}
                    </span>{" "}
                    <span className="text-primary/70">{activity.target}</span>
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground/40 mt-0.5">
                    {relativeTime(activity.occurred_at)}
                  </p>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-muted-foreground/20"
                />
              </motion.div>
            ))}
          </div>
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
              onClick={() => navigate(action.path)}
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
