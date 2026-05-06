"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
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

const revenueData = [
  { month: "Jan", b2b: 42000, b2c: 28000 },
  { month: "Feb", b2b: 48000, b2c: 31000 },
  { month: "Mar", b2b: 45000, b2c: 35000 },
  { month: "Apr", b2b: 56000, b2c: 38000 },
  { month: "May", b2b: 62000, b2c: 42000 },
  { month: "Jun", b2b: 68000, b2c: 45000 },
  { month: "Jul", b2b: 72000, b2c: 48000 },
];

const recentAlerts = [
  {
    id: 1,
    type: "warning" as const,
    message: "Quality inspection backlog reaching 85% capacity",
    time: "12 min ago",
    action: "Review Queue",
  },
  {
    id: 2,
    type: "info" as const,
    message: "New B2B partner 'Meridian Corp' registration pending",
    time: "34 min ago",
    action: "Review",
  },
  {
    id: 3,
    type: "success" as const,
    message: "Monthly compliance audit completed successfully",
    time: "1 hr ago",
    action: "View Report",
  },
  {
    id: 4,
    type: "warning" as const,
    message: "3 driver licenses expiring within 30 days",
    time: "2 hrs ago",
    action: "Manage",
  },
];

const recentActivities = [
  {
    id: 1,
    user: "Sarah K.",
    action: "approved quality report",
    target: "Batch #2847",
    time: "5 min ago",
    avatar: "SK",
  },
  {
    id: 2,
    user: "James L.",
    action: "completed delivery",
    target: "Order #1293",
    time: "18 min ago",
    avatar: "JL",
  },
  {
    id: 3,
    user: "Priya M.",
    action: "flagged sample",
    target: "SKU-4821",
    time: "32 min ago",
    avatar: "PM",
  },
  {
    id: 4,
    user: "Carlos R.",
    action: "onboarded seller",
    target: "GreenLeaf Ltd.",
    time: "1 hr ago",
    avatar: "CR",
  },
];

const topRegions = [
  { label: "United States", value: 124500, color: "#0171E3" },
  { label: "United Kingdom", value: 89200, color: "#3B82F6" },
  { label: "UAE", value: 67800, color: "#30A46C" },
  { label: "Saudi Arabia", value: 45600, color: "#D97706" },
  { label: "Pakistan", value: 34200, color: "#EC4899" },
];

const channelData = [
  { name: "B2B Direct", value: 45, color: "#0171E3" },
  { name: "B2C Marketplace", value: 30, color: "#30A46C" },
  { name: "Wholesale", value: 15, color: "#FFB224" },
  { name: "Referral", value: 10, color: "#3B82F6" },
];

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
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

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

      {/* ─── Hero Stats — THE most important numbers ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue"
          value="$347.2K"
          change="+12.5%"
          changeType="positive"
          icon={<TrendingUp size={20} className="text-primary" />}
          iconBg="bg-primary/8"
          index={0}
          subtitle="B2B $225K · B2C $122K"
          sparklineData={[280, 295, 310, 305, 325, 338, 347]}
          sparklineColor="#0171E3"
          accentColor="#0171E3"
        />
        <StatCard
          label="Active Orders"
          value="1,284"
          change="+8.2%"
          changeType="positive"
          icon={<Package size={20} className="text-[#3B82F6]" />}
          iconBg="bg-[#3B82F6]/8"
          index={1}
          subtitle="342 B2B · 942 B2C"
          sparklineData={[980, 1020, 1050, 1120, 1180, 1240, 1284]}
          sparklineColor="#3B82F6"
          accentColor="#3B82F6"
        />
        <StatCard
          label="Users Online"
          value="89"
          change="+3"
          changeType="positive"
          icon={<Users size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={2}
          subtitle="14 sellers · 12 workers · 63 buyers"
          sparklineData={[62, 68, 72, 75, 80, 84, 89]}
          sparklineColor="#30A46C"
          accentColor="#30A46C"
        />
        <StatCard
          label="Quality Score"
          value="96.4%"
          change="+0.8%"
          changeType="positive"
          icon={<ShieldCheck size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={3}
          subtitle="Based on 847 inspections"
          sparklineData={[93.2, 94.1, 94.8, 95.2, 95.8, 96.1, 96.4]}
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
              $120K
            </span>
            <span className="flex items-center gap-1 text-[0.75rem] text-[#30A46C] mb-1">
              <ArrowUp size={12} />
              +15.2% vs last period
            </span>
          </div>

          <CustomAreaChart
            data={revenueData}
            xKey="month"
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
              value={96}
              color="#30A46C"
              label="Healthy"
              sublabel="All core systems running"
            />
          </div>

          <div className="space-y-1.5 mt-4">
            {[
              {
                label: "Order Processing",
                status: "success" as const,
                uptime: "99.9%",
              },
              {
                label: "Quality Pipeline",
                status: "success" as const,
                uptime: "99.7%",
              },
              {
                label: "Delivery Network",
                status: "warning" as const,
                uptime: "97.2%",
              },
              {
                label: "Payment Gateway",
                status: "success" as const,
                uptime: "99.9%",
              },
            ].map((item) => (
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
                  {item.uptime}
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
            data={topRegions}
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
              data={channelData}
              size={150}
              centerValue="$347K"
              centerLabel="Total"
              thickness={24}
            />
            <div className="flex-1 space-y-3.5">
              {channelData.map((item) => (
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
                {recentAlerts.length} items require action
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {recentAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-black/[0.012] hover:bg-black/[0.025] transition-all duration-400 cursor-pointer group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className={`w-[6px] h-[6px] rounded-full mt-2 flex-shrink-0 ${
                    alert.type === "warning"
                      ? "bg-[#FFB224]"
                      : alert.type === "success"
                      ? "bg-[#30A46C]"
                      : "bg-[#3B82F6]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-foreground/80 leading-relaxed">
                    {alert.message}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5">
                    {alert.time}
                  </p>
                </div>
                <button className="text-[0.75rem] text-primary/60 hover:text-primary whitespace-nowrap cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300">
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
            {recentActivities.map((activity, i) => (
              <motion.div
                key={activity.id}
                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-black/[0.015] transition-all duration-400 cursor-pointer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
                    {activity.time}
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
            },
            {
              icon: <Package size={20} />,
              label: "New Product",
              color: "#3B82F6",
              desc: "Create listing",
            },
            {
              icon: <Truck size={20} />,
              label: "Track Delivery",
              color: "#30A46C",
              desc: "Live tracking",
            },
            {
              icon: <BarChart3 size={20} />,
              label: "View Reports",
              color: "#D97706",
              desc: "Analytics & insights",
            },
          ].map((action) => (
            <motion.button
              key={action.label}
              className="flex flex-col items-center gap-3 py-7 px-5 rounded-2xl bg-black/[0.01] hover:bg-black/[0.025] 
                border border-black/[0.03] hover:border-black/[0.06]
                transition-all duration-500 cursor-pointer group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
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
