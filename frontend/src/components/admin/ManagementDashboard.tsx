"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Package,
  Truck,
  ClipboardCheck,
  Users,
  CheckCircle2,
  Search,
  AlertTriangle,
  Layers,
  Eye,
  RotateCcw,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";

import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import {
  CommandCenterPeriod,
  CommandCenterPipelineItem,
  useAdminCommandCenter,
} from "./useAdminCommandCenter";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-[1.25rem] p-7 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/[0.04] ${className}`} />;
}

function CardSkeletons() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[1.25rem] border border-black/[0.03] p-5 bg-card">
          <SkeletonBlock className="h-3 w-20 mb-5" />
          <SkeletonBlock className="h-8 w-14 mb-3" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

const LISTING_VISUALS: Record<string, { color: string; icon: React.ReactNode }> = {
  samples: { color: "#3B82F6", icon: <Package size={14} /> },
  compliance: { color: "#8B5CF6", icon: <ShieldCheck size={14} /> },
  inspection: { color: "#0171E3", icon: <Search size={14} /> },
  live: { color: "#30A46C", icon: <CheckCircle2 size={14} /> },
  rejected: { color: "#E5484D", icon: <AlertTriangle size={14} /> },
};

const ORDER_VISUALS: Record<string, { color: string; icon: React.ReactNode }> = {
  created: { color: "#3B82F6", icon: <Package size={16} /> },
  accepted: { color: "#0171E3", icon: <ClipboardCheck size={16} /> },
  shipped: { color: "#D97706", icon: <Truck size={16} /> },
  delivered: { color: "#30A46C", icon: <CheckCircle2 size={16} /> },
  disputed: { color: "#FFB224", icon: <AlertTriangle size={16} /> },
};

function formatRelativeUpdate(iso: string) {
  if (!iso) return "Waiting for first sync";
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Waiting for first sync";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `Updated ${hours}h ago`;
}

function getSyncPill({
  summaryLoading,
  shipmentsLoading,
  summaryError,
  lastUpdated,
  cacheTtlSeconds,
  generatedFromCache,
}: {
  summaryLoading: boolean;
  shipmentsLoading: boolean;
  summaryError: string;
  lastUpdated: string;
  cacheTtlSeconds: number;
  generatedFromCache: boolean;
}) {
  if (summaryError) return { status: "error" as const, label: "Failed sync", pulse: false };
  if (summaryLoading || shipmentsLoading) return { status: "pending" as const, label: "Refreshing", pulse: true };
  const updatedAt = new Date(lastUpdated).getTime();
  const ageMs = Number.isFinite(updatedAt) ? Date.now() - updatedAt : Number.POSITIVE_INFINITY;
  const staleAfterMs = Math.max(cacheTtlSeconds || 60, 60) * 2000;
  if (!Number.isFinite(updatedAt) || ageMs > staleAfterMs) return { status: "warning" as const, label: "Stale", pulse: false };
  if (generatedFromCache) return { status: "info" as const, label: "Cached", pulse: false };
  return { status: "success" as const, label: "Live", pulse: true };
}

function shipmentStatusTone(status: string) {
  switch ((status || "").toLowerCase()) {
    case "delivered":
      return "success" as const;
    case "customs":
      return "warning" as const;
    case "out_for_delivery":
      return "pending" as const;
    case "label_created":
    case "picked_up":
    case "in_transit":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function ManagementDashboard() {
  const navigate = useNavigate();
  const {
    period,
    setPeriod,
    refresh,
    summary,
    shipments,
    summaryLoading,
    shipmentsLoading,
    summaryError,
    shipmentsError,
    lastUpdated,
    initialLoading,
    refreshing,
  } = useAdminCommandCenter();

  const listingItems = summary?.pipelines.listings.items || [];
  const orderItems = summary?.pipelines.orders.items || [];
  const listingTotal = summary?.pipelines.listings.total || 0;
  const orderTotal = summary?.pipelines.orders.total || 0;

  const listingSummary = useMemo(
    () =>
      listingItems.map((item: CommandCenterPipelineItem) => ({
        ...item,
        color: LISTING_VISUALS[item.key]?.color || "#64748B",
        icon: LISTING_VISUALS[item.key]?.icon || <Layers size={14} />,
      })),
    [listingItems],
  );

  const orderFlow = useMemo(
    () =>
      orderItems.map((item: CommandCenterPipelineItem) => ({
        ...item,
        color: ORDER_VISUALS[item.key]?.color || "#64748B",
        icon: ORDER_VISUALS[item.key]?.icon || <Layers size={16} />,
      })),
    [orderItems],
  );
  const syncPill = getSyncPill({
    summaryLoading,
    shipmentsLoading,
    summaryError,
    lastUpdated,
    cacheTtlSeconds: summary?.meta.cache_ttl_seconds || 0,
    generatedFromCache: Boolean(summary?.meta.generated_from_cache),
  });

  if (initialLoading) {
    return (
      <div className="space-y-7">
        <CardSkeletons />
      </div>
    );
  }

  if (!summary && summaryError) {
    return (
      <div className="space-y-7">
        <div className="px-5 py-4 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.875rem]">{summaryError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <motion.h1 className="text-foreground tracking-tight mb-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            Command Center
          </motion.h1>
          <motion.p className="text-muted-foreground/70 text-[0.875rem]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Live operations aligned to domain APIs.
          </motion.p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-[0.6875rem] text-muted-foreground/50">{formatRelativeUpdate(lastUpdated)}</p>
            <StatusPill status={syncPill.status} label={syncPill.label} pulse={syncPill.pulse} />
            {summary?.meta.is_partial ? <StatusPill status="warning" label="Partial data" /> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as CommandCenterPeriod)}
            className="px-4 py-2.5 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
          </select>
          <BounceButton variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={refresh}>
            {refreshing ? "Refreshing" : "Refresh"}
          </BounceButton>
        </div>
      </div>

      {summaryError ? (
        <div className="px-5 py-4 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
          Summary sync issue: {summaryError}
        </div>
      ) : null}
      {summary?.meta.warnings?.length ? (
        <div className="px-5 py-4 rounded-2xl bg-[#FFB224]/8 text-[#A16207] text-[0.8125rem]">
          Partial command-center data: {summary.meta.warnings.join(" | ")}
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="cursor-pointer" onClick={() => navigate(summary?.hero.active_orders.path || summary?.meta.paths.orders || "/admin/management/orders")}>
          <StatCard
            label="Open Orders (Now)"
            value={(summary?.hero.active_orders.snapshot_total || 0).toLocaleString()}
            icon={<Package size={20} className="text-[#3B82F6]" />}
            iconBg="bg-[#3B82F6]/8"
            index={0}
            accentColor="#3B82F6"
            subtitle={`${summary?.hero.active_orders.snapshot_b2c || 0} B2C · ${summary?.hero.active_orders.snapshot_b2b || 0} B2B`}
            sparklineData={summary?.hero.active_orders.sparkline || []}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate(summary?.hero.quality_score.path || summary?.meta.paths.quality || "/admin/quality")}>
          <StatCard
            label="Quality Score"
            value={`${(summary?.hero.quality_score.total || 0).toFixed(1)}%`}
            icon={<ClipboardCheck size={20} className="text-[#30A46C]" />}
            iconBg="bg-[#30A46C]/8"
            index={1}
            accentColor="#30A46C"
            subtitle={`${(summary?.hero.quality_score.pass_rate || 0).toFixed(1)}% pass · ${summary?.hero.quality_score.pending || 0} pending`}
            sparklineData={summary?.hero.quality_score.sparkline || []}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate(summary?.hero.users_online.path || summary?.meta.paths.users || "/admin/users")}>
          <StatCard
            label="Users Online"
            value={(summary?.hero.users_online.snapshot_total || 0).toLocaleString()}
            icon={<Users size={20} className="text-[#8B5CF6]" />}
            iconBg="bg-[#8B5CF6]/8"
            index={2}
            accentColor="#8B5CF6"
            subtitle={`${summary?.hero.users_online.snapshot_sellers || 0} sellers · ${summary?.hero.users_online.snapshot_buyers || 0} buyers · ${summary?.hero.users_online.snapshot_workers || 0} staff`}
            sparklineData={summary?.hero.users_online.sparkline || []}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate(summary?.hero.shipments_in_transit.path || summary?.meta.paths.logistics || "/admin/logistics")}>
          <StatCard
            label="Shipments In Transit"
            value={String(summary?.hero.shipments_in_transit.total || 0)}
            icon={<Truck size={20} className="text-[#0171E3]" />}
            iconBg="bg-[#0171E3]/8"
            index={3}
            accentColor="#0171E3"
            subtitle={`${(summary?.hero.shipments_in_transit.on_time_rate || 0).toFixed(1)}% on-time`}
          />
        </div>
      </div>

      <Section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/6 flex items-center justify-center">
              <Layers size={17} className="text-primary/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Listings Pipeline</p>
              <p className="text-muted-foreground/50 text-[0.6875rem]">{listingTotal} items moving through requests and launch</p>
            </div>
          </div>
          <BounceButton variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => navigate(summary?.meta.paths.listings || "/admin/management/listings")}>
            View
          </BounceButton>
        </div>
        {summaryLoading ? <p className="text-[0.6875rem] text-muted-foreground/45 mb-4">Refreshing listing pipeline…</p> : null}
        <div className="flex flex-wrap gap-2.5">
          {listingSummary.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/[0.015] border border-black/[0.03] hover:bg-black/[0.02] transition-colors"
            >
              <span style={{ color: item.color, opacity: 0.7 }}>{item.icon}</span>
              <span className="text-[0.75rem] text-muted-foreground/60">{item.label}</span>
              <span className="text-[0.8125rem] text-foreground/80 min-w-[16px] text-center tabular-nums">{item.count}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/6 flex items-center justify-center">
              <Layers size={16} className="text-primary/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Order Flow</p>
              <p className="text-[0.6875rem] text-muted-foreground/50">{orderTotal} orders in pipeline</p>
            </div>
          </div>
          <BounceButton variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => navigate(summary?.meta.paths.orders || "/admin/management/orders")}>
            View Orders
          </BounceButton>
        </div>
        {summaryLoading ? <p className="text-[0.6875rem] text-muted-foreground/45 mb-4">Refreshing order flow…</p> : null}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {orderFlow.map((stage, i) => {
            const pct = orderTotal ? Math.round((stage.count / orderTotal) * 100) : 0;
            return (
              <motion.button
                type="button"
                key={stage.key}
                className="rounded-2xl p-4 bg-black/[0.012] border border-black/[0.03] relative overflow-hidden text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                onClick={() => navigate(stage.path)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stage.color}12`, color: stage.color }}>
                    {stage.icon}
                  </div>
                  <span className="text-[0.6875rem] text-muted-foreground/45">{pct}%</span>
                </div>
                <p className="text-[0.75rem] text-muted-foreground/55">{stage.label}</p>
                <p className="text-[1.25rem] text-foreground/85 tabular-nums mt-1">{stage.count}</p>
                <div className="mt-3 h-1.5 rounded-full bg-black/[0.03] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: stage.color, opacity: 0.55 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.05 }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/6 flex items-center justify-center">
              <Truck size={16} className="text-primary/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Live Shipments</p>
              <p className="text-[0.6875rem] text-muted-foreground/50">Latest active shipments from logistics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shipmentsError ? <StatusPill status="warning" label="sync issue" /> : null}
            <StatusPill status={shipmentsLoading ? "pending" : "info"} label={`${shipments.length} items`} pulse={shipments.length > 0 || shipmentsLoading} />
          </div>
        </div>
        {shipmentsError ? (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-[#FFB224]/8 text-[#A16207] text-[0.75rem]">Live shipment sync issue: {shipmentsError}</div>
        ) : null}
        {shipmentsLoading && shipments.length === 0 ? (
          <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
            Loading live shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/8 flex items-center justify-center">
                <Activity size={18} className="text-[#3B82F6]/70" />
              </div>
            </div>
            <p className="mb-4">No active shipments yet.</p>
            <div className="flex items-center justify-center gap-2">
              <BounceButton variant="secondary" size="sm" icon={<Truck size={14} />} onClick={() => navigate(summary?.meta.paths.logistics || "/admin/logistics")}>
                Open Logistics
              </BounceButton>
              <BounceButton variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate(summary?.meta.paths.orders || "/admin/management/orders")}>
                View Orders
              </BounceButton>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {shipments.map((shipment, i) => (
              <motion.div
                key={shipment.id || i}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-black/[0.02] transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/admin/logistics?q=sh-${shipment.id || ""}`)}
              >
                <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/8 flex items-center justify-center">
                  <Truck size={18} className="text-[#3B82F6]/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.875rem] text-foreground/80 truncate">{shipment.destination || "-"}</p>
                  <p className="text-[0.75rem] text-muted-foreground/50 truncate">
                    {shipment.seller || "-"} · ORD-{shipment.order_id ?? "-"} · {shipment.tracking_number ? `#${shipment.tracking_number}` : "no tracking"}
                  </p>
                </div>
                <StatusPill status={shipmentStatusTone(shipment.status)} label={(shipment.status || "-").replaceAll("_", " ")} />
              </motion.div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
