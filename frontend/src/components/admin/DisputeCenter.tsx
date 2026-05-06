// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, Shield, Scale, Clock, CheckCircle2,
  ChevronRight, ArrowRight, Users, FileText, DollarSign,
  MessageCircle, Calendar, Flag, Eye, Send, X,
  TrendingDown, Gavel, Package, Truck, Handshake,
  AlertCircle, ThumbsUp, ArrowUp, BarChart3, History,
  Search, Filter, Flame, Zap, Archive, Inbox,
  ArrowUpRight, Phone, MapPin, Hash, Star, Activity,
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { StatCard } from "./StatCard";
import { ProgressRing } from "./ProgressRing";
import { CustomAreaChart, HorizontalBarList } from "./CustomCharts";
import { useBounce } from "./BounceContext";

/*
 * ════════════════════════════════════════════════════════════
 *  DISPUTE CENTER — PLATONIC REDESIGN
 *
 *  Philosophy: A dispute is a FIRE. The manager's brain
 *  must instantly answer:
 *
 *    1. "What's BURNING?" → Escalated cases, top of page
 *    2. "How much is at STAKE?" → Money at risk
 *    3. "Where is EVERYTHING?" → Pipeline / journey
 *    4. "What's the STORY?" → Individual case details
 *
 *  Sub-modules (internal tabs):
 *    Overview   → The big picture, escalated first
 *    Active     → All cases needing work
 *    Resolution → Cases approaching closure
 *    Archive    → Closed cases & learnings
 *
 *  Jony Ive: "When something is designed really well,
 *  the design is very quiet."
 * ════════════════════════════════════════════════════════════
 */

// ─── Types ──────────────────────────────────────────────

type DisputeStage = "filed" | "investigating" | "mediation" | "resolution" | "closed";
type DisputeSeverity = "critical" | "high" | "medium" | "low";
type DisputeType = "quality" | "delivery" | "billing" | "damaged" | "missing" | "misrepresented";
type SubModule = "overview" | "active" | "resolution" | "archive";

interface Dispute {
  id: string;
  type: DisputeType;
  stage: DisputeStage;
  severity: DisputeSeverity;
  partyA: { name: string; role: "buyer" | "seller"; avatar: string };
  partyB: { name: string; role: "buyer" | "seller" | "carrier" | "platform"; avatar: string };
  subject: string;
  amount: number;
  filedDate: string;
  lastActivity: string;
  daysOpen: number;
  assignedTo: string;
  summary: string;
  resolution?: string;
  outcome?: "refund" | "credit" | "replacement" | "dismissed" | "mediated";
  timeline: { date: string; event: string; actor: string }[];
}

// ─── Mock Data ──────────────────────────────────────────

const disputes: Dispute[] = [
  {
    id: "DIS-077",
    type: "damaged",
    stage: "mediation",
    severity: "critical",
    partyA: { name: "Atlas Materials", role: "seller", avatar: "AM" },
    partyB: { name: "LogiPrime Carriers", role: "carrier", avatar: "LC" },
    subject: "Carbon fiber sheets damaged during transit — $12,500 claim",
    amount: 12500,
    filedDate: "Feb 28, 2026",
    lastActivity: "1 day ago",
    daysOpen: 18,
    assignedTo: "Sarah K.",
    summary: "High-value carbon fiber shipment arrived with moisture damage. Photos confirm packaging breach. Insurance claim filed. Mediation scheduled between seller and carrier for March 28.",
    timeline: [
      { date: "Feb 28", event: "Dispute filed with photo evidence", actor: "Atlas Materials" },
      { date: "Mar 1", event: "Insurance claim initiated", actor: "Sarah K." },
      { date: "Mar 5", event: "Independent assessor confirmed damage — 40 units affected", actor: "Third Party" },
      { date: "Mar 10", event: "Mediation scheduled for Mar 28", actor: "Sarah K." },
      { date: "Mar 17", event: "Pre-mediation brief submitted by both parties", actor: "System" },
    ],
  },
  {
    id: "DIS-082",
    type: "missing",
    stage: "investigating",
    severity: "high",
    partyA: { name: "Hans Weber", role: "buyer", avatar: "HW" },
    partyB: { name: "BrightStar Elec.", role: "seller", avatar: "BS" },
    subject: "5 units missing from 50-unit LED panel order",
    amount: 2750,
    filedDate: "Mar 11, 2026",
    lastActivity: "6 hours ago",
    daysOpen: 7,
    assignedTo: "James L.",
    summary: "Buyer reports receiving only 45 of 50 ordered LED Panel B200 units. Warehouse packing records show 50 shipped. Investigating potential transit loss.",
    timeline: [
      { date: "Mar 11", event: "Dispute filed — 5 units missing from shipment", actor: "Hans Weber" },
      { date: "Mar 12", event: "Warehouse records pulled — 50 units packed & sealed", actor: "James L." },
      { date: "Mar 13", event: "Carrier contacted for transit investigation", actor: "James L." },
      { date: "Mar 18", event: "CCTV footage from warehouse loading dock requested", actor: "James L." },
    ],
  },
  {
    id: "DIS-081",
    type: "quality",
    stage: "investigating",
    severity: "high",
    partyA: { name: "Robert Miller", role: "buyer", avatar: "RM" },
    partyB: { name: "FreshPack Foods", role: "seller", avatar: "FP" },
    subject: "HEPA filters don't match product description",
    amount: 4200,
    filedDate: "Mar 8, 2026",
    lastActivity: "2 hours ago",
    daysOpen: 10,
    assignedTo: "James L.",
    summary: "Buyer received HF-200B model instead of listed HF-200A. Seller confirms it's a newer model with identical specs. Awaiting buyer's decision on partial refund vs. keeping upgraded units.",
    timeline: [
      { date: "Mar 8", event: "Dispute filed by buyer", actor: "Robert Miller" },
      { date: "Mar 9", event: "QC team contacted for product verification", actor: "James L." },
      { date: "Mar 10", event: "Seller confirms model upgrade, offers partial refund", actor: "FreshPack Foods" },
      { date: "Mar 13", event: "Awaiting buyer response — follow-up sent", actor: "System" },
    ],
  },
  {
    id: "DIS-079",
    type: "delivery",
    stage: "resolution",
    severity: "medium",
    partyA: { name: "Lisa Park", role: "buyer", avatar: "LP" },
    partyB: { name: "LogiPrime Carriers", role: "carrier", avatar: "LC" },
    subject: "Order delivered 3 days late — requesting compensation",
    amount: 1800,
    filedDate: "Mar 3, 2026",
    lastActivity: "5 hours ago",
    daysOpen: 15,
    assignedTo: "Priya M.",
    summary: "Delivery was delayed due to routing issues. Carrier has acknowledged fault. Compensation of $180 credit proposed and accepted in principle. Awaiting final confirmation.",
    timeline: [
      { date: "Mar 3", event: "Dispute filed — delivery 3 days late", actor: "Lisa Park" },
      { date: "Mar 5", event: "Carrier investigation completed — routing error confirmed", actor: "LogiPrime" },
      { date: "Mar 8", event: "Compensation offer: $180 store credit", actor: "Priya M." },
      { date: "Mar 12", event: "Buyer accepted compensation in principle", actor: "Lisa Park" },
      { date: "Mar 18", event: "Final paperwork sent for signature", actor: "Priya M." },
    ],
  },
  {
    id: "DIS-076",
    type: "billing",
    stage: "filed",
    severity: "low",
    partyA: { name: "David Chen", role: "buyer", avatar: "DC" },
    partyB: { name: "TradeFlow", role: "platform", avatar: "TF" },
    subject: "Duplicate charge on order #ORD-3847",
    amount: 245,
    filedDate: "Mar 12, 2026",
    lastActivity: "3 hours ago",
    daysOpen: 6,
    assignedTo: "Unassigned",
    summary: "Customer reports being charged twice for the same order. Needs payment team review to verify and process refund if confirmed.",
    timeline: [
      { date: "Mar 12", event: "Dispute filed — duplicate charge reported", actor: "David Chen" },
      { date: "Mar 13", event: "Auto-routed to billing team", actor: "System" },
    ],
  },
  {
    id: "DIS-074",
    type: "misrepresented",
    stage: "closed",
    severity: "medium",
    partyA: { name: "Karen Wu", role: "buyer", avatar: "KW" },
    partyB: { name: "GreenLeaf Organics", role: "seller", avatar: "GL" },
    subject: "Product images significantly different from received item",
    amount: 890,
    filedDate: "Feb 20, 2026",
    lastActivity: "4 days ago",
    daysOpen: 21,
    assignedTo: "Carlos R.",
    summary: "Resolved. Seller updated product photos and issued 15% discount on next order. Both parties satisfied with outcome.",
    resolution: "Seller updated listing photos. 15% discount issued. Case closed with mutual agreement.",
    outcome: "credit",
    timeline: [
      { date: "Feb 20", event: "Dispute filed with comparison photos", actor: "Karen Wu" },
      { date: "Feb 22", event: "Seller acknowledged photo discrepancy", actor: "GreenLeaf" },
      { date: "Feb 25", event: "Resolution: photos updated + 15% discount", actor: "Carlos R." },
      { date: "Mar 9", event: "Dispute closed — both parties satisfied", actor: "System" },
    ],
  },
  {
    id: "DIS-073",
    type: "quality",
    stage: "closed",
    severity: "medium",
    partyA: { name: "BrightStar Elec.", role: "seller", avatar: "BE" },
    partyB: { name: "Nordic Health", role: "buyer", avatar: "NH" },
    subject: "Specification mismatch on LED driver modules",
    amount: 3100,
    filedDate: "Feb 14, 2026",
    lastActivity: "6 days ago",
    daysOpen: 25,
    assignedTo: "Carlos R.",
    summary: "Product specifications didn't match listing. Full refund issued. Listing corrected.",
    resolution: "Full refund of $3,100 processed. Seller corrected product listing. Quality team updated verification checklist.",
    outcome: "refund",
    timeline: [
      { date: "Feb 14", event: "Dispute filed — specs don't match listing", actor: "Nordic Health" },
      { date: "Feb 17", event: "Seller confirmed discrepancy", actor: "BrightStar" },
      { date: "Feb 22", event: "Full refund processed", actor: "Carlos R." },
      { date: "Mar 12", event: "Listing corrected, dispute closed", actor: "System" },
    ],
  },
  {
    id: "DIS-070",
    type: "damaged",
    stage: "closed",
    severity: "high",
    partyA: { name: "Meridian Corp", role: "buyer", avatar: "MC" },
    partyB: { name: "FreshPack Foods", role: "seller", avatar: "FP" },
    subject: "Crushed packaging on bulk protein bar shipment",
    amount: 1680,
    filedDate: "Feb 5, 2026",
    lastActivity: "12 days ago",
    daysOpen: 28,
    assignedTo: "Sarah K.",
    summary: "80 units arrived with crushed packaging. Carrier accepted liability. Replacement shipment sent and received.",
    resolution: "Carrier covered replacement cost. New packaging protocol implemented for fragile food items.",
    outcome: "replacement",
    timeline: [
      { date: "Feb 5", event: "Dispute filed with photos of crushed packaging", actor: "Meridian Corp" },
      { date: "Feb 8", event: "Carrier acknowledged liability", actor: "LogiPrime" },
      { date: "Feb 15", event: "Replacement shipment sent", actor: "FreshPack Foods" },
      { date: "Mar 5", event: "Replacement received, dispute closed", actor: "Meridian Corp" },
    ],
  },
];

// ─── Config Maps ────────────────────────────────────────

const stageConfig: Record<DisputeStage, { label: string; color: string; icon: React.ReactNode; order: number }> = {
  filed: { label: "Filed", color: "#3B82F6", icon: <Flag size={13} />, order: 0 },
  investigating: { label: "Investigating", color: "#D97706", icon: <Eye size={13} />, order: 1 },
  mediation: { label: "Mediation", color: "#8B5CF6", icon: <Handshake size={13} />, order: 2 },
  resolution: { label: "Resolution", color: "#30A46C", icon: <ThumbsUp size={13} />, order: 3 },
  closed: { label: "Closed", color: "#7A7D80", icon: <CheckCircle2 size={13} />, order: 4 },
};

const typeConfig: Record<DisputeType, { label: string; color: string; icon: React.ReactNode }> = {
  quality: { label: "Quality", color: "#0171E3", icon: <Shield size={12} /> },
  delivery: { label: "Delivery", color: "#30A46C", icon: <Truck size={12} /> },
  billing: { label: "Billing", color: "#3B82F6", icon: <DollarSign size={12} /> },
  damaged: { label: "Damaged", color: "#E5484D", icon: <AlertTriangle size={12} /> },
  missing: { label: "Missing", color: "#D97706", icon: <Package size={12} /> },
  misrepresented: { label: "Misrepresented", color: "#8B5CF6", icon: <Eye size={12} /> },
};

const severityConfig: Record<DisputeSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: "#E5484D", bg: "bg-[#E5484D]/6", label: "Critical" },
  high: { color: "#D97706", bg: "bg-[#D97706]/6", label: "High" },
  medium: { color: "#FFB224", bg: "bg-[#FFB224]/6", label: "Medium" },
  low: { color: "#30A46C", bg: "bg-[#30A46C]/6", label: "Low" },
};

const outcomeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  refund: { label: "Full Refund", color: "#0171E3", icon: <DollarSign size={12} /> },
  credit: { label: "Store Credit", color: "#30A46C", icon: <Star size={12} /> },
  replacement: { label: "Replacement", color: "#D97706", icon: <Package size={12} /> },
  dismissed: { label: "Dismissed", color: "#7A7D80", icon: <X size={12} /> },
  mediated: { label: "Mediated", color: "#8B5CF6", icon: <Handshake size={12} /> },
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } },
};

// ─── Sub-module tabs config ─────────────────────────────

const subModules: { key: SubModule; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={16} />, description: "The big picture" },
  { key: "active", label: "Active Cases", icon: <Flame size={16} />, description: "Needs attention" },
  { key: "resolution", label: "Resolution", icon: <Handshake size={16} />, description: "Approaching closure" },
  { key: "archive", label: "Archive", icon: <Archive size={16} />, description: "Closed & resolved" },
];

// ═══════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

// Severity bar — visual weight proportional to importance
function SeverityBar({ severity }: { severity: DisputeSeverity }) {
  const sev = severityConfig[severity];
  const levels = { critical: 4, high: 3, medium: 2, low: 1 };
  const level = levels[severity];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: i <= level ? 8 + (i * 3) : 6,
            backgroundColor: i <= level ? sev.color : "rgba(0,0,0,0.06)",
            opacity: i <= level ? 0.7 : 0.3,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// Party avatars — the human side
function PartyVs({ a, b }: { a: Dispute["partyA"]; b: Dispute["partyB"] }) {
  const roleGrad: Record<string, string> = {
    buyer: "bg-gradient-to-br from-[#3B82F6] to-[#0171E3]",
    seller: "bg-gradient-to-br from-[#D97706] to-[#FFB224]",
    carrier: "bg-gradient-to-br from-[#30A46C] to-[#4EB882]",
    platform: "bg-gradient-to-br from-[#7A7D80] to-[#9DA0A3]",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.5rem] ${roleGrad[a.role]}`}>
        {a.avatar}
      </div>
      <span className="text-[0.5625rem] text-muted-foreground/25">vs</span>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.5rem] ${roleGrad[b.role]}`}>
        {b.avatar}
      </div>
    </div>
  );
}

// ─── Dispute Card ───────────────────────────────────────
// The Platonic form: severity → subject → amount → parties → latest event

function DisputeCard({
  dispute,
  onClick,
  index = 0,
  compact = false,
}: {
  dispute: Dispute;
  onClick: () => void;
  index?: number;
  compact?: boolean;
}) {
  const stg = stageConfig[dispute.stage];
  const typ = typeConfig[dispute.type];
  const sev = severityConfig[dispute.severity];
  const lastEvent = dispute.timeline[dispute.timeline.length - 1];

  return (
    <motion.div
      className={`bg-card rounded-2xl cursor-pointer group relative overflow-hidden
        shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_4px_rgba(0,0,0,0.02)]
        hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.06)]
        transition-all duration-300 ${compact ? "p-5" : "p-6 sm:p-7"}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      {/* Severity accent — left edge */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: sev.color, opacity: 0.5 }}
      />

      <div className="flex items-start gap-4 sm:gap-5">
        {/* Severity + Stage */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
          <SeverityBar severity={dispute.severity} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row: ID + Type + Stage */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.75rem] text-primary/70 tabular-nums">{dispute.id}</span>
            <span className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
              style={{ background: `${typ.color}08`, color: `${typ.color}BB` }}>
              {typ.icon} {typ.label}
            </span>
            <StatusPill
              status={
                dispute.stage === "closed" ? "success" :
                dispute.stage === "resolution" ? "info" :
                dispute.stage === "mediation" ? "warning" :
                dispute.stage === "investigating" ? "pending" : "error"
              }
              label={stg.label}
              pulse={dispute.stage === "filed" || dispute.severity === "critical"}
            />
          </div>

          {/* Subject — THE HEADLINE */}
          <h4 className="text-[0.9375rem] text-foreground leading-snug mb-2.5">
            {dispute.subject}
          </h4>

          {/* Parties */}
          <div className="flex items-center gap-3 mb-3">
            <PartyVs a={dispute.partyA} b={dispute.partyB} />
            <span className="text-[0.75rem] text-foreground/50">
              {dispute.partyA.name}
              <span className="text-muted-foreground/25 mx-1.5">vs</span>
              {dispute.partyB.name}
            </span>
          </div>

          {/* Latest activity — what's happening NOW */}
          {!compact && (
            <div className="p-3.5 rounded-xl bg-black/[0.015] border border-black/[0.02] mb-3">
              <p className="text-[0.75rem] text-muted-foreground/50 leading-relaxed">
                <span className="text-foreground/45">{lastEvent.date}:</span>{" "}
                {lastEvent.event}
              </p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[0.6875rem] text-muted-foreground/35">
              <span className="flex items-center gap-1"><Calendar size={11} />{dispute.filedDate}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                <span className={dispute.daysOpen > 14 ? "text-[#E5484D]/60" : dispute.daysOpen > 7 ? "text-[#D97706]/60" : ""}>
                  {dispute.daysOpen}d open
                </span>
              </span>
              {dispute.assignedTo !== "Unassigned" && (
                <span className="flex items-center gap-1"><Users size={11} />{dispute.assignedTo}</span>
              )}
              {dispute.assignedTo === "Unassigned" && (
                <span className="flex items-center gap-1 text-[#E5484D]/50"><AlertCircle size={11} />Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Amount — THE NUMBER */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <p className="text-[1.125rem] text-foreground/75 tabular-nums tracking-tight">
            ${dispute.amount.toLocaleString()}
          </p>
          <span className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-wider">at risk</span>
          <ChevronRight size={16} className="text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors mt-2" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dispute Detail Panel ───────────────────────────────

function DisputeDetailPanel({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const stg = stageConfig[dispute.stage];
  const typ = typeConfig[dispute.type];
  const sev = severityConfig[dispute.severity];

  // Stage progress visual
  const stages: DisputeStage[] = ["filed", "investigating", "mediation", "resolution", "closed"];
  const currentStageIdx = stages.indexOf(dispute.stage);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/12 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[600px] bg-background flex flex-col
          shadow-[0_0_0_1px_rgba(0,0,0,0.03),-8px_0_32px_rgba(0,0,0,0.06)]"
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-7 border-b border-black/[0.04]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="text-[0.8125rem] text-primary tabular-nums">{dispute.id}</span>
                <span className={`text-[0.625rem] px-2.5 py-0.5 rounded-full ${sev.bg}`}
                  style={{ color: sev.color }}>
                  {sev.label}
                </span>
                <StatusPill
                  status={
                    dispute.stage === "closed" ? "success" :
                    dispute.stage === "resolution" ? "info" :
                    dispute.stage === "mediation" ? "warning" :
                    dispute.stage === "investigating" ? "pending" : "error"
                  }
                  label={stg.label}
                  pulse={dispute.stage === "filed"}
                />
              </div>
              <h3 className="text-[1.0625rem] text-foreground leading-snug">{dispute.subject}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer -mt-1">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Parties */}
          <div className="flex items-center gap-3">
            <PartyVs a={dispute.partyA} b={dispute.partyB} />
            <div>
              <p className="text-[0.8125rem] text-foreground/70">
                {dispute.partyA.name} <span className="text-muted-foreground/30">vs</span> {dispute.partyB.name}
              </p>
              <p className="text-[0.6875rem] text-muted-foreground/35 capitalize">
                {dispute.partyA.role} · {dispute.partyB.role}
              </p>
            </div>
          </div>

          {/* Stage progress */}
          <div className="flex items-center gap-1 mt-5">
            {stages.map((stage, i) => {
              const cfg = stageConfig[stage];
              const isReached = i <= currentStageIdx;
              const isCurrent = i === currentStageIdx;
              return (
                <React.Fragment key={stage}>
                  <motion.div
                    className="flex-1 h-1.5 rounded-full relative overflow-hidden"
                    style={{ backgroundColor: isReached ? cfg.color : "rgba(0,0,0,0.04)" }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1, opacity: isReached ? 0.7 : 0.3 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {stages.map((stage, i) => (
              <span key={stage} className={`text-[0.5rem] ${i <= currentStageIdx ? "text-foreground/40" : "text-muted-foreground/20"}`}>
                {stageConfig[stage].label}
              </span>
            ))}
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          {/* Key metrics — THE NUMBERS at a glance */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/[0.015]">
              <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-1">Amount at Risk</p>
              <p className="text-[1.5rem] text-foreground/80 tracking-tight tabular-nums">
                ${dispute.amount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/[0.015]">
              <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-1">Days Open</p>
              <p className={`text-[1.5rem] tracking-tight tabular-nums ${
                dispute.daysOpen > 14 ? "text-[#E5484D]/70" : dispute.daysOpen > 7 ? "text-[#D97706]/70" : "text-foreground/60"
              }`}>
                {dispute.daysOpen}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/[0.015]">
              <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-1">Assigned To</p>
              <p className="text-[0.875rem] text-foreground/70 mt-2">{dispute.assignedTo}</p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-2.5">Summary</p>
            <p className="text-[0.8125rem] text-foreground/60 leading-[1.7]">{dispute.summary}</p>
          </div>

          {/* Resolution (for closed cases) */}
          {dispute.resolution && (
            <div className="p-4 rounded-2xl bg-[#30A46C]/4 border border-[#30A46C]/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-[#30A46C]/60" />
                <p className="text-[0.5625rem] text-[#30A46C]/60 tracking-[0.06em] uppercase">Resolution</p>
                {dispute.outcome && (
                  <span className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
                    style={{ background: `${outcomeConfig[dispute.outcome].color}10`, color: outcomeConfig[dispute.outcome].color }}>
                    {outcomeConfig[dispute.outcome].icon}
                    {outcomeConfig[dispute.outcome].label}
                  </span>
                )}
              </div>
              <p className="text-[0.8125rem] text-foreground/60 leading-relaxed">{dispute.resolution}</p>
            </div>
          )}

          {/* Type badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.6875rem]"
              style={{ background: `${typ.color}08`, color: `${typ.color}BB` }}>
              {typ.icon} {typ.label} Dispute
            </div>
            <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground/35">
              <Calendar size={11} /> Filed {dispute.filedDate}
            </div>
          </div>

          {/* Timeline — the story */}
          <div>
            <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-4">Case Timeline</p>
            <div className="space-y-0">
              {dispute.timeline.map((event, i) => (
                <motion.div
                  key={i}
                  className="flex gap-4 relative"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                >
                  <div className="flex flex-col items-center flex-shrink-0 w-5">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${
                      i === dispute.timeline.length - 1 ? "bg-primary/60" : "bg-black/[0.08]"
                    }`} />
                    {i < dispute.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-black/[0.04] my-1" />
                    )}
                  </div>
                  <div className="pb-5 min-w-0">
                    <p className="text-[0.8125rem] text-foreground/65 leading-snug">{event.event}</p>
                    <div className="flex items-center gap-2 mt-1 text-[0.6875rem] text-muted-foreground/30">
                      <span>{event.date}</span>
                      <span>·</span>
                      <span>{event.actor}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-black/[0.04] bg-background">
          <div className="flex items-center gap-2.5">
            <BounceButton variant="secondary" size="sm" icon={<MessageCircle size={14} />}>
              Message
            </BounceButton>
            <BounceButton variant="secondary" size="sm" icon={<FileText size={14} />}>
              Documents
            </BounceButton>
            {dispute.stage !== "closed" && dispute.stage !== "resolution" && (
              <BounceButton variant="warning" size="sm" icon={<ArrowUp size={14} />}>
                Escalate
              </BounceButton>
            )}
            {dispute.stage === "resolution" && (
              <BounceButton variant="success" size="sm" icon={<CheckCircle2 size={14} />} className="ml-auto">
                Close Dispute
              </BounceButton>
            )}
            {dispute.stage === "filed" && (
              <BounceButton variant="primary" size="sm" icon={<Users size={14} />} className="ml-auto">
                Assign & Begin
              </BounceButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUB-MODULE: OVERVIEW
//  What matters most → escalated cases → pipeline → stats
// ═══════════════════════════════════════════════════════════

function OverviewModule({
  onSelectDispute,
}: {
  onSelectDispute: (d: Dispute) => void;
}) {
  const activeDisputes = disputes.filter(d => d.stage !== "closed");
  const totalAtRisk = activeDisputes.reduce((s, d) => s + d.amount, 0);
  const criticalCount = activeDisputes.filter(d => d.severity === "critical" || d.severity === "high").length;
  const avgDaysOpen = activeDisputes.length > 0
    ? Math.round(activeDisputes.reduce((s, d) => s + d.daysOpen, 0) / activeDisputes.length)
    : 0;

  // Escalated cases first — SORTED BY IMPORTANCE
  const escalatedCases = activeDisputes
    .sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
      return b.amount - a.amount;
    });

  const stages: DisputeStage[] = ["filed", "investigating", "mediation", "resolution", "closed"];

  const resolutionTrend = [
    { month: "Oct", rate: 78, avg: 16 },
    { month: "Nov", rate: 82, avg: 14 },
    { month: "Dec", rate: 80, avg: 15 },
    { month: "Jan", rate: 85, avg: 12 },
    { month: "Feb", rate: 88, avg: 10 },
    { month: "Mar", rate: 89, avg: 8 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8">
      {/* ═══ HERO: What's burning? ═══ */}
      {criticalCount > 0 && (
        <motion.div variants={stagger.item}>
          <div className="bg-gradient-to-r from-[#E5484D]/4 via-[#D97706]/3 to-transparent rounded-3xl border border-[#E5484D]/8 p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <Flame size={18} className="text-[#E5484D]/60" />
              <span className="text-[0.6875rem] text-[#E5484D]/60 tracking-[0.06em] uppercase">Needs Immediate Attention</span>
              <span className="text-[0.6875rem] text-[#E5484D]/40 ml-auto">{criticalCount} case{criticalCount > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {escalatedCases.filter(d => d.severity === "critical" || d.severity === "high").slice(0, 3).map((d, i) => (
                <DisputeCard key={d.id} dispute={d} onClick={() => onSelectDispute(d)} index={i} compact />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ KEY NUMBERS ═══ */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Active Disputes"
          value={activeDisputes.length.toString()}
          change={`${criticalCount} urgent`}
          changeType="negative"
          icon={<Scale size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={0}
          accentColor="#D97706"
          sparklineData={[8, 7, 6, 7, 5, 6, activeDisputes.length]}
          sparklineColor="#D97706"
        />
        <StatCard
          label="Total at Risk"
          value={`$${(totalAtRisk / 1000).toFixed(1)}K`}
          icon={<DollarSign size={20} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/8"
          index={1}
          accentColor="#E5484D"
          subtitle="Combined claim value"
        />
        <StatCard
          label="Avg. Resolution"
          value={`${avgDaysOpen}d`}
          change="-3d vs last month"
          changeType="positive"
          icon={<Clock size={20} className="text-primary" />}
          iconBg="bg-primary/8"
          index={2}
          accentColor="#0171E3"
          sparklineData={[14, 12, 11, 10, 9, 8, avgDaysOpen]}
          sparklineColor="#0171E3"
        />
        <StatCard
          label="Resolution Rate"
          value="89%"
          change="+4% this quarter"
          changeType="positive"
          icon={<Handshake size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={3}
          accentColor="#30A46C"
          sparklineData={[78, 80, 82, 85, 86, 88, 89]}
          sparklineColor="#30A46C"
        />
      </motion.div>

      {/* ═══ DISPUTE JOURNEY — Pipeline ═══ */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <p className="text-[0.5625rem] text-muted-foreground/30 tracking-[0.06em] uppercase mb-1">Dispute Journey</p>
          <p className="text-[0.75rem] text-muted-foreground/35 mb-8">Where each case stands in its lifecycle</p>

          <div className="flex items-center gap-0">
            {stages.map((stage, i) => {
              const config = stageConfig[stage];
              const count = disputes.filter(d => d.stage === stage).length;
              const isActive = count > 0;

              return (
                <React.Fragment key={stage}>
                  <motion.div
                    className="flex-1 flex flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <motion.div
                      className="rounded-full flex items-center justify-center mb-3 relative"
                      style={{
                        width: isActive ? 52 : 40,
                        height: isActive ? 52 : 40,
                        background: isActive ? config.color : "rgba(0,0,0,0.03)",
                        opacity: isActive ? 0.8 : 0.4,
                      }}
                      whileHover={{ scale: 1.08 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    >
                      <span className={`tabular-nums ${isActive ? "text-white text-[1.125rem]" : "text-muted-foreground/50 text-[0.875rem]"}`}>
                        {count}
                      </span>
                      {stage === "filed" && count > 0 && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: `2px solid ${config.color}` }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </motion.div>
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: isActive ? config.color : "rgba(0,0,0,0.25)" }}>
                      {config.icon}
                    </div>
                    <span className={`text-[0.6875rem] ${isActive ? "text-foreground/60" : "text-muted-foreground/30"}`}>
                      {config.label}
                    </span>
                  </motion.div>

                  {i < stages.length - 1 && (
                    <motion.div
                      className="h-[2px] flex-shrink-0 rounded-full -mt-8"
                      style={{
                        width: 28,
                        background: `linear-gradient(90deg, ${config.color}30, ${stageConfig[stages[i + 1]].color}30)`,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.08 + 0.1, duration: 0.4 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* ═══ RESOLUTION TREND ═══ */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <SectionCard className="lg:col-span-3">
          <p className="text-foreground text-[0.9375rem] mb-1">Resolution Performance</p>
          <p className="text-muted-foreground/40 text-[0.75rem] mb-4">Success rate trending upward</p>
          <CustomAreaChart
            data={resolutionTrend}
            xKey="month"
            series={[{ dataKey: "rate", color: "#30A46C", label: "Resolution %" }]}
            height={180}
            yDomain={[60, 100]}
          />
        </SectionCard>
        <SectionCard className="lg:col-span-2">
          <p className="text-foreground text-[0.9375rem] mb-4">By Type</p>
          <HorizontalBarList
            data={[
              { label: "Quality", value: 3, color: "#0171E3" },
              { label: "Damaged", value: 2, color: "#E5484D" },
              { label: "Delivery", value: 1, color: "#30A46C" },
              { label: "Missing", value: 1, color: "#D97706" },
              { label: "Billing", value: 1, color: "#3B82F6" },
            ]}
            maxValue={4}
          />
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUB-MODULE: ACTIVE CASES
// ═══════════════════════════════════════════════════════════

function ActiveCasesModule({
  onSelectDispute,
}: {
  onSelectDispute: (d: Dispute) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<"all" | DisputeSeverity>("all");

  const activeCases = useMemo(() =>
    disputes
      .filter(d => d.stage !== "closed")
      .filter(d => filterSeverity === "all" || d.severity === filterSeverity)
      .filter(d =>
        searchTerm === "" ||
        d.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.partyA.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.partyB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
        return b.amount - a.amount;
      }),
    [searchTerm, filterSeverity]
  );

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      {/* Search + Severity Filter */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
          <input
            type="text"
            placeholder="Search by case ID, subject, or party..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem]
              text-foreground placeholder:text-muted-foreground/30
              focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-muted/15 rounded-2xl p-1.5">
          {(["all", "critical", "high", "medium", "low"] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3.5 py-2.5 rounded-xl text-[0.75rem] transition-all cursor-pointer capitalize ${
                filterSeverity === sev
                  ? sev === "all"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-white shadow-sm"
                  : "text-muted-foreground/50 hover:text-foreground"
              }`}
              style={filterSeverity === sev && sev !== "all" ? {
                background: severityConfig[sev].color,
                opacity: 0.85,
              } : {}}
            >
              {sev === "all" ? "All" : sev}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Count */}
      <motion.div variants={stagger.item} className="flex items-center gap-2 px-1">
        <span className="text-[0.8125rem] text-foreground/50">
          {activeCases.length} active case{activeCases.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[0.6875rem] text-muted-foreground/30">sorted by severity</span>
      </motion.div>

      {/* Cases list */}
      <div className="space-y-3">
        {activeCases.map((d, i) => (
          <DisputeCard key={d.id} dispute={d} onClick={() => onSelectDispute(d)} index={i} />
        ))}

        {activeCases.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CheckCircle2 size={40} className="text-[#30A46C]/25 mb-4" />
            <p className="text-[0.9375rem] text-foreground/40">No cases match your filters</p>
            <p className="text-[0.75rem] text-muted-foreground/25 mt-1">Try adjusting the severity filter or search term</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUB-MODULE: RESOLUTION
// ═══════════════════════════════════════════════════════════

function ResolutionModule({
  onSelectDispute,
}: {
  onSelectDispute: (d: Dispute) => void;
}) {
  const resolutionCases = disputes.filter(d => d.stage === "resolution" || d.stage === "mediation");
  const totalValue = resolutionCases.reduce((s, d) => s + d.amount, 0);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8">
      {/* Stats */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        <StatCard
          label="In Resolution"
          value={resolutionCases.length.toString()}
          icon={<Handshake size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={0}
          accentColor="#30A46C"
          subtitle="Approaching closure"
        />
        <StatCard
          label="Combined Value"
          value={`$${(totalValue / 1000).toFixed(1)}K`}
          icon={<DollarSign size={20} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={1}
          accentColor="#0171E3"
        />
        <StatCard
          label="Avg Days in Stage"
          value={`${resolutionCases.length > 0 ? Math.round(resolutionCases.reduce((s, d) => s + d.daysOpen, 0) / resolutionCases.length) : 0}d`}
          icon={<Clock size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={2}
          accentColor="#D97706"
        />
      </motion.div>

      {resolutionCases.length > 0 ? (
        <div className="space-y-3">
          {resolutionCases.map((d, i) => (
            <motion.div key={d.id} variants={stagger.item}>
              <SectionCard className="border-l-[3px]" >
                <div className="flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[0.75rem] text-primary/70 tabular-nums">{d.id}</span>
                      <StatusPill
                        status={d.stage === "resolution" ? "info" : "warning"}
                        label={stageConfig[d.stage].label}
                      />
                      <span className={`text-[0.625rem] px-2 py-0.5 rounded-full ${severityConfig[d.severity].bg}`}
                        style={{ color: severityConfig[d.severity].color }}>
                        {severityConfig[d.severity].label}
                      </span>
                    </div>
                    <h4 className="text-[0.9375rem] text-foreground leading-snug mb-2">{d.subject}</h4>

                    {/* Latest event — what's happening right now */}
                    <div className="p-3.5 rounded-xl bg-[#30A46C]/3 border border-[#30A46C]/8 mb-3">
                      <p className="text-[0.75rem] text-foreground/50 leading-relaxed">
                        <span className="text-[#30A46C]/60">{d.timeline[d.timeline.length - 1].date}:</span>{" "}
                        {d.timeline[d.timeline.length - 1].event}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <PartyVs a={d.partyA} b={d.partyB} />
                      <span className="text-[0.75rem] text-muted-foreground/40">
                        {d.partyA.name} vs {d.partyB.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-3">
                    <p className="text-[1.25rem] text-foreground/75 tabular-nums tracking-tight">
                      ${d.amount.toLocaleString()}
                    </p>
                    <BounceButton variant="success" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => onSelectDispute(d)}>
                      Review
                    </BounceButton>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={stagger.item}>
          <SectionCard className="text-center py-16">
            <Handshake size={40} className="text-[#30A46C]/20 mx-auto mb-4" />
            <p className="text-[0.9375rem] text-foreground/40">No cases in resolution</p>
            <p className="text-[0.75rem] text-muted-foreground/25 mt-1">Cases will appear here once they reach the resolution stage</p>
          </SectionCard>
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUB-MODULE: ARCHIVE
// ═══════════════════════════════════════════════════════════

function ArchiveModule({
  onSelectDispute,
}: {
  onSelectDispute: (d: Dispute) => void;
}) {
  const closedCases = disputes.filter(d => d.stage === "closed");
  const totalResolved = closedCases.reduce((s, d) => s + d.amount, 0);

  // Outcome distribution
  const outcomes = closedCases.reduce((acc, d) => {
    if (d.outcome) acc[d.outcome] = (acc[d.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard
          label="Total Resolved"
          value={closedCases.length.toString()}
          icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={0}
          accentColor="#30A46C"
        />
        <StatCard
          label="Value Resolved"
          value={`$${(totalResolved / 1000).toFixed(1)}K`}
          icon={<DollarSign size={20} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={1}
          accentColor="#0171E3"
        />
        <StatCard
          label="Avg Days to Close"
          value={`${closedCases.length > 0 ? Math.round(closedCases.reduce((s, d) => s + d.daysOpen, 0) / closedCases.length) : 0}d`}
          icon={<Clock size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={2}
          accentColor="#D97706"
        />
        <StatCard
          label="Satisfaction"
          value="94%"
          icon={<Star size={20} className="text-[#FFB224]" />}
          iconBg="bg-[#FFB224]/8"
          index={3}
          accentColor="#FFB224"
          subtitle="Both parties satisfied"
        />
      </motion.div>

      {/* Outcome breakdown */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <p className="text-foreground text-[0.9375rem] mb-4">Resolution Outcomes</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(outcomes).map(([key, count]) => {
              const cfg = outcomeConfig[key];
              if (!cfg) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: `${cfg.color}06`, border: `1px solid ${cfg.color}12` }}
                >
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span className="text-[0.8125rem] text-foreground/60">{cfg.label}</span>
                  <span className="text-[0.875rem] text-foreground/80 tabular-nums ml-1">{count}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* Closed cases */}
      <div className="space-y-3">
        {closedCases.map((d, i) => (
          <motion.div key={d.id} variants={stagger.item}>
            <div
              className="bg-card rounded-2xl p-6 cursor-pointer group opacity-80 hover:opacity-100
                shadow-[0_0_0_1px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]
                transition-all duration-300"
              onClick={() => onSelectDispute(d)}
            >
              <div className="flex items-start gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[0.75rem] text-muted-foreground/40 tabular-nums">{d.id}</span>
                    <StatusPill status="success" label="Closed" />
                    {d.outcome && (
                      <span className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
                        style={{ background: `${outcomeConfig[d.outcome].color}08`, color: `${outcomeConfig[d.outcome].color}AA` }}>
                        {outcomeConfig[d.outcome].icon}
                        {outcomeConfig[d.outcome].label}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[0.875rem] text-foreground/60 leading-snug mb-2">{d.subject}</h4>

                  {d.resolution && (
                    <p className="text-[0.75rem] text-muted-foreground/35 leading-relaxed mb-3">
                      {d.resolution}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <PartyVs a={d.partyA} b={d.partyB} />
                    <span className="text-[0.6875rem] text-muted-foreground/30">
                      {d.partyA.name} vs {d.partyB.name} · {d.daysOpen}d to resolve
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[1rem] text-foreground/50 tabular-nums tracking-tight line-through">
                    ${d.amount.toLocaleString()}
                  </p>
                  <p className="text-[0.625rem] text-[#30A46C]/50 mt-0.5">Resolved</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN DISPUTE CENTER
// ═══════════════════════════════════════════════════════════

export function DisputeCenter() {
  const { addEnergy } = useBounce();
  const [activeModule, setActiveModule] = useState<SubModule>("overview");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const activeDisputes = disputes.filter(d => d.stage !== "closed");
  const resolutionCount = disputes.filter(d => d.stage === "resolution" || d.stage === "mediation").length;
  const closedCount = disputes.filter(d => d.stage === "closed").length;

  const badgeCounts: Record<SubModule, number | undefined> = {
    overview: undefined,
    active: activeDisputes.length,
    resolution: resolutionCount || undefined,
    archive: closedCount || undefined,
  };

  const handleSelectDispute = useCallback((d: Dispute) => {
    addEnergy(0.6);
    setSelectedDispute(d);
  }, [addEnergy]);

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Dispute Center</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Track, mediate, and resolve disputes. What matters most comes first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="secondary" size="sm" icon={<FileText size={15} />}>Export</BounceButton>
          <BounceButton variant="primary" size="sm" icon={<Flag size={15} />} energyWeight={2}>
            File Dispute
          </BounceButton>
        </div>
      </motion.div>

      {/* ═══ SUB-MODULE TABS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-card rounded-3xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 inline-flex gap-1.5 flex-wrap">
          {subModules.map(mod => {
            const isActive = activeModule === mod.key;
            const badge = badgeCounts[mod.key];

            return (
              <motion.button
                key={mod.key}
                onClick={() => setActiveModule(mod.key)}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-[0.8125rem] transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-card shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-foreground"
                    : "text-muted-foreground/50 hover:text-foreground/70"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <span className={isActive ? "text-primary" : ""}>{mod.icon}</span>
                <span>{mod.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className={`text-[0.625rem] px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground/40"
                  }`}>
                    {badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ ACTIVE MODULE CONTENT ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {activeModule === "overview" && <OverviewModule onSelectDispute={handleSelectDispute} />}
          {activeModule === "active" && <ActiveCasesModule onSelectDispute={handleSelectDispute} />}
          {activeModule === "resolution" && <ResolutionModule onSelectDispute={handleSelectDispute} />}
          {activeModule === "archive" && <ArchiveModule onSelectDispute={handleSelectDispute} />}
        </motion.div>
      </AnimatePresence>

      {/* ═══ DETAIL PANEL ═══ */}
      <AnimatePresence>
        {selectedDispute && (
          <DisputeDetailPanel
            dispute={selectedDispute}
            onClose={() => setSelectedDispute(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
