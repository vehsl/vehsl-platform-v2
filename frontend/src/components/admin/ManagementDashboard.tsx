"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Package,
  Truck,
  ClipboardCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Search,
  AlertTriangle,
  Box,
  Layers,
  Timer,
  TrendingUp,
  Eye,
  Filter,
  RotateCcw,
  Camera,
  Scale,
  Flame,
  Zap,
  DollarSign,
  ArrowUp,
  Hash,
} from "lucide-react";
import { fetchJsonAuthed } from "@/lib/api";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { ProgressRing } from "./ProgressRing";
import { BounceButton } from "./BounceButton";
import { QualityDeliverySection } from "./QualityDeliverySection";

/*
 * ════════════════════════════════════════════════════════════
 *  MANAGEMENT COMMAND CENTER — PLATONIC DESIGN
 *
 *  An operations manager should feel in CONTROL, not overwhelmed.
 *  The page tells a story: "Here's what needs your attention NOW,
 *  here's the big picture, here's the detail if you want it."
 *
 *  Information architecture:
 *  1. Listing pipeline banner — what's moving
 *  2. Today's vital numbers — instant pulse check
 *  3. Order flow visualization — the pipeline
 *  4. Quality + Delivery — operational health
 *  5. Live tracking — what's happening right now
 *  6. Trends + Earnings — business intelligence
 * ════════════════════════════════════════════════════════════
 */

const orderPipeline = [
  { stage: "New Orders", count: 24, color: "#3B82F6", icon: <Package size={16} /> },
  { stage: "Quality Check", count: 18, color: "#0171E3", icon: <ClipboardCheck size={16} /> },
  { stage: "Packaging", count: 12, color: "#D97706", icon: <Box size={16} /> },
  { stage: "In Transit", count: 31, color: "#30A46C", icon: <Truck size={16} /> },
  { stage: "Delivered", count: 156, color: "#10B981", icon: <CheckCircle2 size={16} /> },
];

const qualityData = [
  { name: "Mon", passed: 42, failed: 3 },
  { name: "Tue", passed: 38, failed: 5 },
  { name: "Wed", passed: 45, failed: 2 },
  { name: "Thu", passed: 41, failed: 4 },
  { name: "Fri", passed: 48, failed: 1 },
  { name: "Sat", passed: 22, failed: 1 },
  { name: "Sun", passed: 15, failed: 0 },
];

const deliveryStatusData = [
  { name: "On Time", value: 78, color: "#30A46C" },
  { name: "Slight Delay", value: 15, color: "#FFB224" },
  { name: "Delayed", value: 5, color: "#E5484D" },
  { name: "Early", value: 2, color: "#3B82F6" },
];

const activeDeliveries = [
  { id: "DEL-4821", driver: "Marcus T.", destination: "Chicago, IL", eta: "2:30 PM", status: "on-track" as const, progress: 72 },
  { id: "DEL-4822", driver: "Aisha R.", destination: "Milwaukee, WI", eta: "3:15 PM", status: "on-track" as const, progress: 45 },
  { id: "DEL-4823", driver: "Carlos M.", destination: "Detroit, MI", eta: "4:00 PM", status: "delayed" as const, progress: 28 },
  { id: "DEL-4824", driver: "Lin W.", destination: "Indianapolis, IN", eta: "1:45 PM", status: "on-track" as const, progress: 89 },
];

const sampleReadiness = [
  { seller: "GreenLeaf Organics", product: "Herbal Tea Blend", status: "ready" as const, dueIn: "Ready now" },
  { seller: "Meridian Corp", product: "Industrial Filters", status: "in-progress" as const, dueIn: "Due in 2 hrs" },
  { seller: "BrightStar Elec.", product: "LED Panel B200", status: "in-progress" as const, dueIn: "Due in 4 hrs" },
  { seller: "FreshPack Foods", product: "Protein Bars (24pk)", status: "overdue" as const, dueIn: "Overdue by 1 hr" },
];

const workforceStats = [
  { role: "Drivers", active: 8, total: 12, color: "#3B82F6" },
  { role: "QC Inspectors", active: 5, total: 6, color: "#0171E3" },
  { role: "Packaging", active: 10, total: 14, color: "#D97706" },
  { role: "Warehouse", active: 6, total: 8, color: "#30A46C" },
];

const trendingQuick = [
  { name: "Organic Herbal Tea", change: 142, badge: "breakout", orders: "12.4K", img: "https://images.unsplash.com/photo-1766482280244-afd07a7028fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100" },
  { name: "LED Panel B200", change: 67, badge: "popular", orders: "8.9K", img: "https://images.unsplash.com/photo-1572714792868-c203eaf84b43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100" },
  { name: "Natural Glow Kit", change: 89, badge: "breakout", orders: "5.8K", img: "https://images.unsplash.com/photo-1723392197044-515b81ec57cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100" },
  { name: "Soy Wax Candle", change: 45, badge: "new", orders: "3.6K", img: "https://images.unsplash.com/photo-1759766409687-7f624d6dc59e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100" },
];

const platformEarnings = [
  { label: "Today", value: "$4,820", change: "+12%" },
  { label: "This Week", value: "$28,400", change: "+8%" },
  { label: "This Month", value: "$124,600", change: "+15%" },
];

const topHashtags = [
  { tag: "sustainableliving", posts: "33K", fire: true },
  { tag: "handmadewithlove", posts: "28K", fire: true },
  { tag: "ecofriendly", posts: "22K", fire: false },
  { tag: "organicbeauty", posts: "19K", fire: true },
];

// ─── Reusable section wrapper ───────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-[1.25rem] p-7 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );
}

export function ManagementDashboard() {
  const navigate = useNavigate();
  const fetchJson = fetchJsonAuthed;
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "90d">("7d");
  const [overview, setOverview] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [logisticsStats, setLogisticsStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = period === "24h" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("page_size", "6");
        params.set("status", "label_created,picked_up,in_transit,customs,out_for_delivery");
        const [ov, ls, sh] = await Promise.all([
          fetchJson(`/api/v1/admin/overview?period=${period}`),
          fetchJson(`/api/v1/admin/logistics/stats/?days=${days}`),
          fetchJson(`/api/v1/admin/logistics/shipments/?${params.toString()}`),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setLogisticsStats(ls);
        setShipments(Array.isArray(sh?.results) ? sh.results : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load command center.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period, days]);

  const listings = overview?.pipelines?.listings || {};
  const orders = overview?.pipelines?.orders || {};
  const orderCounts = orders?.status_counts || {};

  const listingSummaryWired = useMemo(() => {
    return [
      { stage: "Samples", count: Number(listings?.samples || 0), color: "#3B82F6", icon: <Package size={14} /> , path: "/admin/management/listings?mode=requests&rs=samples"},
      { stage: "Compliance", count: Number(listings?.compliance || 0), color: "#8B5CF6", icon: <ShieldCheck size={14} /> , path: "/admin/management/listings?mode=requests&rs=compliance"},
      { stage: "Inspection", count: Number(listings?.inspection || 0), color: "#0171E3", icon: <Search size={14} /> , path: "/admin/management/listings?mode=requests&rs=inspection"},
      { stage: "Inbound", count: Number(listings?.inbound || 0), color: "#8B5CF6", icon: <Truck size={14} /> , path: "/admin/management/listings?mode=requests&rs=inbound"},
      { stage: "Live", count: Number(listings?.live || 0), color: "#30A46C", icon: <CheckCircle2 size={14} /> , path: "/admin/management/listings?mode=requests&rs=live"},
      { stage: "Rejected", count: Number(listings?.rejected_products || 0), color: "#E5484D", icon: <AlertTriangle size={14} /> , path: "/admin/management/listings?status=rejected"},
    ];
  }, [listings]);

  const orderPipelineWired = useMemo(() => {
    return [
      { stage: "Created", count: Number(orderCounts?.created || 0), color: "#3B82F6", icon: <Package size={16} /> },
      { stage: "Accepted", count: Number(orderCounts?.accepted || 0), color: "#0171E3", icon: <ClipboardCheck size={16} /> },
      { stage: "Shipped", count: Number(orderCounts?.shipped || 0), color: "#D97706", icon: <Truck size={16} /> },
      { stage: "Delivered", count: Number(orderCounts?.delivered || 0), color: "#30A46C", icon: <CheckCircle2 size={16} /> },
      { stage: "Disputed", count: Number(orderCounts?.disputed || 0), color: "#FFB224", icon: <AlertTriangle size={16} /> },
    ];
  }, [orderCounts]);

  const totalPipelineWired = useMemo(() => orderPipelineWired.reduce((s, p) => s + (Number(p.count) || 0), 0), [orderPipelineWired]);

  const activeOrdersNow = Number(overview?.hero?.active_orders?.snapshot_total || overview?.hero?.active_orders?.total || 0) || 0;
  const b2bNow = Number(overview?.hero?.active_orders?.snapshot_b2b || 0) || 0;
  const b2cNow = Number(overview?.hero?.active_orders?.snapshot_b2c || 0) || 0;
  const qualityScore = Number(overview?.hero?.quality_score?.total || 0) || 0;
  const qualityPassRate = typeof overview?.hero?.quality_score?.pass_rate === "number" ? overview.hero.quality_score.pass_rate : null;
  const qualityPending = typeof overview?.hero?.quality_score?.pending === "number" ? overview.hero.quality_score.pending : null;
  const onlineNow = Number(overview?.hero?.users_online?.snapshot_total || 0) || 0;
  const onlineBuyers = Number(overview?.hero?.users_online?.snapshot_buyers || 0) || 0;
  const onlineSellers = Number(overview?.hero?.users_online?.snapshot_sellers || 0) || 0;
  const onlineWorkers = Number(overview?.hero?.users_online?.snapshot_workers || 0) || 0;

  const shipmentsInTransit = typeof logisticsStats?.in_transit === "number" ? logisticsStats.in_transit : null;
  const onTimeRate = typeof logisticsStats?.on_time_rate === "number" ? logisticsStats.on_time_rate : null;

  if (loading && !overview && !error) {
    return (
      <div className="space-y-7">
        <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.875rem] text-muted-foreground/60">
          Loading command center…
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="space-y-7">
        <div className="px-5 py-4 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.875rem]">{error}</div>
      </div>
    );
  }

  if (overview) {
    return (
      <div className="space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <motion.h1 className="text-foreground tracking-tight mb-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              Command Center
            </motion.h1>
            <motion.p className="text-muted-foreground/70 text-[0.875rem]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              Live operations from real endpoints.
            </motion.p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2.5 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
            </select>
            <BounceButton variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={() => setPeriod((p) => p)}>
              Refresh
            </BounceButton>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="cursor-pointer" onClick={() => navigate(overview?.hero?.active_orders?.path || "/admin/logistics")}>
            <StatCard label="Open Orders (Now)" value={activeOrdersNow.toLocaleString()} icon={<Package size={20} className="text-[#3B82F6]" />} iconBg="bg-[#3B82F6]/8" index={0} accentColor="#3B82F6" subtitle={`${b2cNow} B2C · ${b2bNow} B2B`} />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(overview?.hero?.quality_score?.path || "/admin/quality")}>
            <StatCard label="Quality Score" value={`${qualityScore.toFixed(1)}%`} icon={<ClipboardCheck size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" subtitle={qualityPassRate === null ? period : `${qualityPassRate.toFixed(1)}% pass · ${qualityPending ?? 0} pending`} />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(overview?.hero?.users_online?.path || "/admin/users")}>
            <StatCard label="Users Online" value={onlineNow.toLocaleString()} icon={<Users size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={2} accentColor="#8B5CF6" subtitle={`${onlineSellers} sellers · ${onlineBuyers} buyers · ${onlineWorkers} staff`} />
          </div>
          <div className="cursor-pointer" onClick={() => navigate("/admin/logistics")}>
            <StatCard label="Shipments In Transit" value={shipmentsInTransit === null ? "—" : String(shipmentsInTransit)} icon={<Truck size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={3} accentColor="#0171E3" subtitle={onTimeRate === null ? period : `${Number(onTimeRate).toFixed(1)}% on-time`} />
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
                <p className="text-muted-foreground/50 text-[0.6875rem]">Backlog + missing compliance</p>
              </div>
            </div>
            <BounceButton variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => navigate("/admin/management/listings")}>
              View
            </BounceButton>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {listingSummaryWired.map((item) => (
              <button
                key={item.stage}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/[0.015] border border-black/[0.03] hover:bg-black/[0.02] transition-colors"
              >
                <span style={{ color: item.color, opacity: 0.7 }}>{item.icon}</span>
                <span className="text-[0.75rem] text-muted-foreground/60">{item.stage}</span>
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
                <p className="text-[0.6875rem] text-muted-foreground/50">{totalPipelineWired} orders in pipeline</p>
              </div>
            </div>
            <BounceButton variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => navigate("/admin/management/orders")}>
              View Orders
            </BounceButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {orderPipelineWired.map((stage, i) => {
              const pct = totalPipelineWired ? Math.round((stage.count / totalPipelineWired) * 100) : 0;
              return (
                <motion.div
                  key={stage.stage}
                  className="rounded-2xl p-4 bg-black/[0.012] border border-black/[0.03] relative overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stage.color}12`, color: stage.color }}>
                      {stage.icon}
                    </div>
                    <span className="text-[0.6875rem] text-muted-foreground/45">{pct}%</span>
                  </div>
                  <p className="text-[0.75rem] text-muted-foreground/55">{stage.stage}</p>
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
                </motion.div>
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
                <p className="text-[0.6875rem] text-muted-foreground/50">Latest active shipments</p>
              </div>
            </div>
            <StatusPill status="info" label={`${shipments.length} items`} pulse={shipments.length > 0} />
          </div>
          {shipments.length === 0 ? (
            <div className="px-5 py-10 rounded-2xl bg-black/[0.012] text-center text-[0.8125rem] text-muted-foreground/60">
              No active shipments yet.
            </div>
          ) : (
            <div className="space-y-2">
              {shipments.map((sh: any, i: number) => (
                <motion.div
                  key={sh?.id || i}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-black/[0.02] transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/admin/logistics?q=sh-${sh?.id || ""}`)}
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/8 flex items-center justify-center">
                    <Truck size={18} className="text-[#3B82F6]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.875rem] text-foreground/80 truncate">{sh?.destination || "—"}</p>
                    <p className="text-[0.75rem] text-muted-foreground/50 truncate">
                      {sh?.seller || "—"} · ORD-{sh?.order_id ?? "—"} · {sh?.tracking_number ? `#${sh.tracking_number}` : "no tracking"}
                    </p>
                  </div>
                  <StatusPill status="info" label={(sh?.status || "—").toString().replaceAll("_", " ")} />
                </motion.div>
              ))}
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (false) {
  const listingSummary = [
    { stage: "New Requests", count: 1, color: "#3B82F6", icon: <Package size={14} /> },
    { stage: "Sample Pickup", count: 1, color: "#8B5CF6", icon: <Truck size={14} /> },
    { stage: "Quality Testing", count: 1, color: "#0171E3", icon: <ClipboardCheck size={14} /> },
    { stage: "Legal Review", count: 1, color: "#D97706", icon: <Scale size={14} /> },
    { stage: "Photography", count: 1, color: "#EC4899", icon: <Camera size={14} /> },
  ];

  const totalPipeline = orderPipeline.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-7">
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <motion.h1
            className="text-foreground tracking-tight mb-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Command Center
          </motion.h1>
          <motion.p
            className="text-muted-foreground/70 text-[0.875rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Real-time operations across orders, quality, and logistics.
          </motion.p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filters
          </BounceButton>
          <BounceButton variant="secondary" size="sm" icon={<RotateCcw size={14} />}>
            Refresh
          </BounceButton>
        </div>
      </div>

      {/* ─── Listing Pipeline Banner ─────────────────── */}
      <motion.div
        className="bg-card rounded-[1.25rem] p-6 sm:p-7 
          shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]
          relative overflow-hidden cursor-pointer group"
        onClick={() => navigate("/management/listings")}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.998 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Subtle gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B82F6] via-[#0171E3] to-[#30A46C] opacity-40" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/6 flex items-center justify-center">
              <Layers size={17} className="text-primary/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Listing Requests</p>
              <p className="text-muted-foreground/50 text-[0.6875rem]">5 products moving through the pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary/50 text-[0.8125rem] group-hover:text-primary/80 transition-colors duration-400">
            <span>Open Pipeline</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {listingSummary.map((item) => (
            <div
              key={item.stage}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/[0.015] border border-black/[0.03]"
            >
              <span style={{ color: item.color, opacity: 0.7 }}>{item.icon}</span>
              <span className="text-[0.75rem] text-muted-foreground/60">{item.stage}</span>
              <span className="text-[0.8125rem] text-foreground/80 min-w-[16px] text-center tabular-nums">
                {item.count}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/[0.03]">
          <AlertTriangle size={12} className="text-[#E5484D]/60" />
          <span className="text-[0.75rem] text-muted-foreground/50">
            <span className="text-[#E5484D]/70">1 urgent</span> — Protein Energy Bars awaiting photography before launch deadline
          </span>
        </div>
      </motion.div>

      {/* ─── Vital Numbers ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr_0.65fr] gap-5">

        {/* ── HERO: Orders Today — THE heartbeat ── */}
        <motion.div
          className="bg-card rounded-[1.5rem] p-7 sm:p-8 relative overflow-hidden
            shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.03)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Warm ambient glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)" }}
          />

          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center">
                <Package size={18} className="text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-[0.6875rem] text-muted-foreground/45 tracking-[0.04em] uppercase">Orders Today</p>
                <p className="text-[0.625rem] text-muted-foreground/30 mt-0.5">The pulse of operations</p>
              </div>
            </div>
            <StatusPill status="success" label="+6 vs yesterday" />
          </div>

          {/* THE NUMBER — dominates */}
          <div className="flex items-end gap-4 mt-4">
            <motion.span
              className="text-[4rem] sm:text-[4.5rem] tracking-[-0.04em] leading-none text-foreground/85 tabular-nums"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            >
              24
            </motion.span>
            <div className="mb-2.5 flex flex-col gap-1">
              <span className="text-[0.8125rem] text-[#3B82F6]/60">orders</span>
            </div>
          </div>

          {/* Breakdown pills */}
          <div className="flex items-center gap-3 mt-5">
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B82F6]/[0.04]"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]/40" />
              <span className="text-[0.75rem] text-foreground/50">18 B2C</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8B5CF6]/[0.04]"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/40" />
              <span className="text-[0.75rem] text-foreground/50">6 B2B</span>
            </motion.div>
          </div>

          {/* Mini sparkline as ambient history */}
          <motion.div
            className="mt-5 pt-4 border-t border-black/[0.03]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <p className="text-[0.625rem] text-muted-foreground/30">7-day trend</p>
              <svg width="120" height="28" viewBox="0 0 120 28" className="flex-shrink-0">
                {(() => {
                  const d = [15, 18, 16, 22, 19, 21, 24];
                  const min = Math.min(...d);
                  const max = Math.max(...d);
                  const range = max - min || 1;
                  const pts = d.map((v, i) => ({
                    x: (i / (d.length - 1)) * 120,
                    y: 28 - ((v - min) / range) * 22 - 3,
                  }));
                  const path = pts.map((p, i) => {
                    if (i === 0) return `M ${p.x} ${p.y}`;
                    const prev = pts[i - 1];
                    const cpx = (prev.x + p.x) / 2;
                    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
                  }).join(" ");
                  return (
                    <>
                      <defs>
                        <linearGradient id="hero-spark-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${path} L 120 28 L 0 28 Z`} fill="url(#hero-spark-grad)" />
                      <path d={path} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
                      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill="#3B82F6" fillOpacity="0.5" />
                    </>
                  );
                })()}
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* ── SECONDARY: Quality Pass Rate ── */}
        <motion.div
          className="bg-card rounded-[1.5rem] p-7 relative overflow-hidden
            shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.025)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(1,113,227,0.04) 0%, transparent 70%)" }}
          />

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#0171E3]/8 flex items-center justify-center">
              <ClipboardCheck size={16} className="text-[#0171E3]" />
            </div>
            <p className="text-[0.6875rem] text-muted-foreground/45 tracking-[0.04em] uppercase">Quality Pass Rate</p>
          </div>

          {/* THE NUMBER — strong secondary */}
          <motion.div
            className="flex items-baseline gap-1.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <span className="text-[2.75rem] tracking-[-0.03em] leading-none text-[#0171E3]/75 tabular-nums">
              94.2
            </span>
            <span className="text-[1.125rem] text-[#0171E3]/40">%</span>
          </motion.div>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 text-[0.6875rem] text-[#30A46C]/60">
              <TrendingUp size={12} />
              <span>+1.3%</span>
            </div>
            <span className="text-[0.625rem] text-muted-foreground/25">vs last week</span>
          </div>

          <div className="mt-5 pt-4 border-t border-black/[0.03]">
            <p className="text-[0.75rem] text-muted-foreground/40">
              <span className="text-foreground/50 tabular-nums">251</span> inspected today
            </p>
          </div>

          {/* Progress underline */}
          <div className="mt-3 h-[4px] rounded-full bg-black/[0.02] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#0171E3]/25"
              initial={{ width: 0 }}
              animate={{ width: "94.2%" }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
        </motion.div>

        {/* ── TERTIARY: Deliveries + Packaging stacked ── */}
        <div className="flex flex-col gap-4">
          {/* Active Deliveries — compact */}
          <motion.div
            className="flex-1 bg-card rounded-2xl p-5 relative overflow-hidden
              shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_4px_rgba(0,0,0,0.02)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#30A46C]/8 flex items-center justify-center">
                  <Truck size={14} className="text-[#30A46C]" />
                </div>
                <div>
                  <p className="text-[0.625rem] text-muted-foreground/40 tracking-[0.03em] uppercase">Active Deliveries</p>
                </div>
              </div>
              <motion.span
                className="text-[1.75rem] tracking-[-0.02em] leading-none text-foreground/65 tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                31
              </motion.span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/[0.025]">
              <span className="text-[0.6875rem] text-muted-foreground/35">5 completing soon</span>
              <span className="text-[0.625rem] text-[#30A46C]/50 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-[#30A46C]/40" />
                78% on-time
              </span>
            </div>
          </motion.div>

          {/* Packaging Queue — smallest, least urgent */}
          <motion.div
            className="flex-1 bg-card rounded-2xl p-5 relative overflow-hidden
              shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_4px_rgba(0,0,0,0.02)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#D97706]/8 flex items-center justify-center">
                  <Box size={14} className="text-[#D97706]" />
                </div>
                <div>
                  <p className="text-[0.625rem] text-muted-foreground/40 tracking-[0.03em] uppercase">Packaging Queue</p>
                </div>
              </div>
              <motion.span
                className="text-[1.75rem] tracking-[-0.02em] leading-none text-foreground/55 tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                12
              </motion.span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/[0.025]">
              <span className="text-[0.6875rem] text-muted-foreground/35">6 standard · 6 custom</span>
              <span className="text-[0.625rem] text-muted-foreground/30 flex items-center gap-1">
                <Timer size={10} />
                Est. 3 hrs
              </span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ─── Order Pipeline — Visual Flow ────────────── */}
      <Section>
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-muted-foreground/60 text-[0.6875rem] tracking-[0.04em] uppercase">
              Order Pipeline
            </p>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-0.5">
              Live flow from order to delivery
            </p>
          </div>
          <BounceButton variant="ghost" size="sm" icon={<Eye size={14} />}>
            View All
          </BounceButton>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {orderPipeline.map((stage, i) => {
            const pct = Math.round((stage.count / totalPipeline) * 100);
            return (
              <div key={stage.stage} className="contents">
                <motion.div
                  className="flex-1 rounded-2xl p-5 bg-black/[0.01] border border-black/[0.03]
                    hover:bg-black/[0.02] hover:border-black/[0.05]
                    transition-all duration-500 cursor-pointer relative overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2 }}
                >
                  {/* Color identity — tiny accent at top */}
                  <div
                    className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-30"
                    style={{ background: stage.color }}
                  />

                  <div className="flex items-center gap-2 mb-4 mt-1">
                    <span style={{ color: stage.color, opacity: 0.6 }}>{stage.icon}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/50">
                      {stage.stage}
                    </span>
                  </div>

                  {/* THE NUMBER */}
                  <p className="text-[2.25rem] text-foreground tracking-[-0.02em] leading-none tabular-nums">
                    {stage.count}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5 tabular-nums">
                    {pct}% of total
                  </p>

                  {/* Subtle progress indicator */}
                  <div className="mt-4 h-[3px] bg-black/[0.03] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: stage.color, opacity: 0.5 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                    />
                  </div>
                </motion.div>
                {i < orderPipeline.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-muted-foreground/15">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ─── Quality + Delivery ──────────────────────── */}
      <QualityDeliverySection qualityData={qualityData} deliveryStatusData={deliveryStatusData} />

      {/* ─── Active Deliveries — Live Tracking ──────── */}
      <Section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#30A46C]/6 flex items-center justify-center">
              <Truck size={15} className="text-[#30A46C]/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Active Deliveries</p>
              <p className="text-[0.6875rem] text-muted-foreground/50">
                Live tracking for in-transit orders
              </p>
            </div>
          </div>
          <StatusPill status="success" label={`${activeDeliveries.length} Active`} pulse />
        </div>

        <div className="space-y-2">
          {activeDeliveries.map((del, i) => (
            <motion.div
              key={del.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 p-4 rounded-2xl 
                bg-black/[0.01] hover:bg-black/[0.02] border border-transparent hover:border-black/[0.03]
                transition-all duration-400 cursor-pointer"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center gap-3 sm:w-[120px]">
                <span className="text-[0.8125rem] text-primary/70 tabular-nums">{del.id}</span>
              </div>
              <div className="flex items-center gap-2.5 sm:w-[130px]">
                <div className="w-7 h-7 rounded-full bg-[#3B82F6]/8 flex items-center justify-center text-[0.5625rem] text-[#3B82F6]/70">
                  {del.driver.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-[0.8125rem] text-foreground/80">{del.driver}</span>
              </div>
              <div className="sm:w-[140px]">
                <span className="text-[0.8125rem] text-muted-foreground/60">{del.destination}</span>
              </div>

              {/* Progress bar — the heart of the delivery */}
              <div className="flex-1 mx-4 hidden sm:block">
                <div className="h-[5px] bg-black/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: del.status === "delayed" ? "#E5484D" : "#30A46C",
                      opacity: 0.7,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${del.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:w-[80px] justify-end">
                <Timer size={11} className="text-muted-foreground/30" />
                <span className="text-[0.8125rem] text-muted-foreground/60 tabular-nums">{del.eta}</span>
              </div>
              <div className="sm:w-[85px] flex justify-end">
                <StatusPill
                  status={del.status === "delayed" ? "error" : "success"}
                  label={del.status === "delayed" ? "Delayed" : "On Track"}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ─── Trends + Earnings ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trending */}
        <motion.div
          className="lg:col-span-2 bg-card rounded-[1.25rem] p-7 
            shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]
            cursor-pointer group"
          onClick={() => navigate("/management/trends")}
          whileHover={{ y: -1 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E5484D]/6 flex items-center justify-center">
                <TrendingUp size={15} className="text-[#E5484D]/70" />
              </div>
              <div>
                <p className="text-[0.875rem] text-foreground/90">Trending Now</p>
                <p className="text-[0.6875rem] text-muted-foreground/50">
                  Top products gaining momentum
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-primary/40 text-[0.75rem] group-hover:text-primary/70 transition-colors duration-400">
              <span>Explore Trends</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          <div className="space-y-1">
            {trendingQuick.map((item, i) => (
              <motion.div
                key={item.name}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-black/[0.015] transition-all duration-300"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
              >
                <span className="text-[0.75rem] text-muted-foreground/30 w-5 text-center tabular-nums">
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/[0.03] flex-shrink-0">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/80 truncate">{item.name}</p>
                  <p className="text-[0.5625rem] text-muted-foreground/40">{item.orders} orders/7d</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] ${
                    item.badge === "breakout"
                      ? "bg-[#E5484D]/6 text-[#E5484D]/70"
                      : item.badge === "new"
                      ? "bg-[#30A46C]/6 text-[#30A46C]/70"
                      : "bg-[#0171E3]/6 text-[#0171E3]/70"
                  }`}
                >
                  {item.badge === "breakout" ? (
                    <Flame size={8} />
                  ) : item.badge === "new" ? (
                    <Zap size={8} />
                  ) : (
                    <TrendingUp size={8} />
                  )}
                  +{item.change}%
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-black/[0.03]">
            {topHashtags.map((ht) => (
              <span
                key={ht.tag}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.015] text-[0.625rem] text-muted-foreground/50 hover:text-foreground/70 hover:bg-black/[0.03] transition-all duration-300"
              >
                <Hash size={8} />
                {ht.tag}
                {ht.fire && <Flame size={7} className="text-[#E5484D]/50" />}
                <span className="text-[0.5rem] opacity-50">{ht.posts}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Platform Earnings */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#30A46C]/6 flex items-center justify-center">
              <DollarSign size={15} className="text-[#30A46C]/70" />
            </div>
            <div>
              <p className="text-[0.875rem] text-foreground/90">Platform Earnings</p>
              <p className="text-[0.6875rem] text-muted-foreground/50">Revenue from commissions</p>
            </div>
          </div>

          <div className="space-y-3">
            {platformEarnings.map((earning, i) => (
              <motion.div
                key={earning.label}
                className="p-4 rounded-xl bg-black/[0.01] border border-black/[0.03]"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.625rem] text-muted-foreground/40 uppercase tracking-[0.05em]">
                    {earning.label}
                  </span>
                  <span className="text-[0.625rem] text-[#30A46C]/60 flex items-center gap-0.5">
                    <ArrowUp size={8} />
                    {earning.change}
                  </span>
                </div>
                <p className="text-[1.5rem] text-foreground tracking-tight leading-none tabular-nums">
                  {earning.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-black/[0.03]">
            <div className="text-center p-3 rounded-xl bg-black/[0.01]">
              <p className="text-[1.125rem] text-foreground tracking-tight tabular-nums">1,842</p>
              <p className="text-[0.5rem] text-muted-foreground/40 uppercase tracking-[0.05em] mt-0.5">
                Active Users
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-black/[0.01]">
              <p className="text-[1.125rem] text-foreground tracking-tight tabular-nums">284</p>
              <p className="text-[0.5rem] text-muted-foreground/40 uppercase tracking-[0.05em] mt-0.5">
                Sellers Online
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ─── Sample Readiness + Workforce ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sample Readiness */}
        <Section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#D97706]/6 flex items-center justify-center">
                <Layers size={15} className="text-[#D97706]/70" />
              </div>
              <div>
                <p className="text-[0.875rem] text-foreground/90">Sample Readiness</p>
                <p className="text-[0.6875rem] text-muted-foreground/50">
                  Track sample preparation
                </p>
              </div>
            </div>
            <BounceButton variant="ghost" size="sm">View All</BounceButton>
          </div>

          <div className="space-y-1">
            {sampleReadiness.map((sample, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3.5 p-4 rounded-2xl hover:bg-black/[0.015] transition-all duration-400 cursor-pointer"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/80 truncate">{sample.product}</p>
                  <p className="text-[0.625rem] text-muted-foreground/40">{sample.seller}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.625rem] text-muted-foreground/40 hidden sm:inline">
                    {sample.dueIn}
                  </span>
                  <StatusPill
                    status={
                      sample.status === "ready"
                        ? "success"
                        : sample.status === "overdue"
                        ? "error"
                        : "pending"
                    }
                    label={
                      sample.status === "ready"
                        ? "Ready"
                        : sample.status === "overdue"
                        ? "Overdue"
                        : "In Progress"
                    }
                    pulse={sample.status === "overdue"}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Workforce */}
        <Section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/6 flex items-center justify-center">
                <Users size={15} className="text-primary/70" />
              </div>
              <div>
                <p className="text-[0.875rem] text-foreground/90">Workforce Status</p>
                <p className="text-[0.6875rem] text-muted-foreground/50">
                  Team availability overview
                </p>
              </div>
            </div>
            <StatusPill status="success" label="29 of 40 active" />
          </div>

          {/* Ring + quick stats */}
          <div className="flex items-center gap-8 mb-6">
            <ProgressRing value={73} size={88} strokeWidth={7} color="#0171E3" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
              {[
                { n: "29", l: "Active" },
                { n: "11", l: "Off Duty" },
                { n: "3", l: "On Leave" },
                { n: "2", l: "Training" },
              ].map((stat) => (
                <div key={stat.l}>
                  <p className="text-[1.25rem] text-foreground tracking-tight leading-none tabular-nums">
                    {stat.n}
                  </p>
                  <p className="text-[0.5625rem] text-muted-foreground/40 mt-0.5">
                    {stat.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {workforceStats.map((wf, i) => (
              <div key={wf.role}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.8125rem] text-foreground/80">{wf.role}</span>
                  <span className="text-[0.6875rem] text-muted-foreground/50 tabular-nums">
                    {wf.active}/{wf.total}
                  </span>
                </div>
                <div className="h-[5px] bg-black/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: wf.color, opacity: 0.6 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(wf.active / wf.total) * 100}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
  }
}
