"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, AlertTriangle, Clock, CheckCircle2, Eye, ArrowRight,
  Calendar, Gavel, Flag, Package,
  FileText, Scale, AlertCircle, RefreshCw,
  Inbox, Globe, ChevronDown,
  ArrowUpRight, Activity, Send, BarChart3,
  Layers, Ban, Video, Upload, Camera, FileCheck, 
  CreditCard, Building2, UserCheck, Play, Pause, 
  RotateCcw, Download
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { ProgressRing } from "./ProgressRing";
import { BounceButton } from "./BounceButton";
import { CustomAreaChart, CustomDonutChart, HorizontalBarList } from "./CustomCharts";
import { useBounce } from "./BounceContext";

/*
 * ════════════════════════════════════════════════════════════
 *  LEGAL DASHBOARD — PLATONIC COMMAND CENTER
 *
 *  Philosophy: The legal team is the GUARDIAN of every order
 *  moving across the world. One wrong approval, one missed
 *  flag, and the entire platform is at risk.
 *
 *  The dashboard answers these questions IN ORDER:
 *
 *    1. "What's BLOCKED?" → Orders stuck, need my action NOW
 *    2. "What needs ME?" → Pending reviews, disputes, rechecks
 *    3. "Is everyone WORKING?" → Regional teams, their load
 *    4. "Are we SAFE?" → Compliance health, risk exposure
 *
 *  Information flows like gravity:
 *    FIRE (top) → ACTION → AWARENESS → TRENDS (bottom)
 *
 *  Jony Ive: "Design is not just what it looks like and
 *  feels like. Design is how it works."
 * ════════════════════════════════════════════════════════════
 */

// ─── Helpers ─────────────────────────────────────────────

const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

// ─── Types ───────────────────────────────────────────────

interface BlockedOrder {
  id: string;
  product: string;
  origin: { country: string; code: string };
  destination: { country: string; code: string };
  hsCode: string;
  reason: string;
  blockedSince: string;
  hoursBlocked: number;
  value: string;
  assignedTeam: string;
  severity: "critical" | "high" | "medium";
}

interface PendingReview {
  id: string;
  product: string;
  type: "new-order" | "recheck" | "amendment" | "renewal";
  origin: { country: string; code: string };
  destination: { country: string; code: string };
  submittedAgo: string;
  hsCode: string;
  value: string;
  priority: "urgent" | "normal" | "low";
  notes?: string;
}

interface RegionalTeam {
  region: string;
  countries: { name: string; code: string }[];
  lead: string;
  leadInitials: string;
  activeReviews: number;
  completedToday: number;
  avgResponseHrs: number;
  complianceRate: number;
  status: "online" | "partially" | "offline";
  members: number;
}

interface DisputeItem {
  id: string;
  parties: string;
  type: string;
  amount: string;
  stage: "escalated" | "mediation" | "investigating" | "new";
  daysOpen: number;
  region: string;
  regionCode: string;
}

interface RecheckItem {
  id: string;
  product: string;
  reason: string;
  originalApproval: string;
  regulationChange: string;
  risk: "high" | "medium" | "low";
  affectedOrders: number;
  region: string;
  regionCode: string;
}

// ─── Mock Data ───────────────────────────────────────────

const blockedOrders: BlockedOrder[] = [
  {
    id: "ORD-8847",
    product: "Industrial LED Panel Array (x200)",
    origin: { country: "China", code: "cn" },
    destination: { country: "Germany", code: "de" },
    hsCode: "9405.42",
    reason: "CE marking certification expired — needs renewal before EU entry",
    blockedSince: "14 hours ago",
    hoursBlocked: 14,
    value: "$48,200",
    assignedTeam: "EU Region",
    severity: "critical",
  },
  {
    id: "ORD-8851",
    product: "Organic Tea Blend (5,000 kg)",
    origin: { country: "India", code: "in" },
    destination: { country: "United States", code: "us" },
    hsCode: "0902.10",
    reason: "FDA labeling requirements updated Mar 1 — labels need re-verification",
    blockedSince: "6 hours ago",
    hoursBlocked: 6,
    value: "$31,500",
    assignedTeam: "Americas",
    severity: "high",
  },
  {
    id: "ORD-8839",
    product: "Lithium Battery Cells (10,000 units)",
    origin: { country: "South Korea", code: "kr" },
    destination: { country: "Brazil", code: "br" },
    hsCode: "8507.60",
    reason: "INMETRO certification missing — mandatory for Brazilian market",
    blockedSince: "28 hours ago",
    hoursBlocked: 28,
    value: "$124,000",
    assignedTeam: "Americas",
    severity: "critical",
  },
];

const pendingReviews: PendingReview[] = [
  { id: "REV-441", product: "Stainless Steel Cookware Set", type: "new-order", origin: { country: "India", code: "in" }, destination: { country: "France", code: "fr" }, submittedAgo: "2h ago", hsCode: "7323.93", value: "$18,400", priority: "urgent" },
  { id: "REV-442", product: "Bamboo Fiber Textiles", type: "recheck", origin: { country: "Vietnam", code: "vn" }, destination: { country: "Japan", code: "jp" }, submittedAgo: "3h ago", hsCode: "5311.00", value: "$9,200", priority: "normal", notes: "Regulation update: JIS standards revised Feb 2026" },
  { id: "REV-443", product: "Children's Toy Building Set", type: "new-order", origin: { country: "China", code: "cn" }, destination: { country: "United Kingdom", code: "gb" }, submittedAgo: "4h ago", hsCode: "9503.00", value: "$22,800", priority: "urgent", notes: "UKCA marking required post-Brexit" },
  { id: "REV-444", product: "Frozen Shrimp (20 tons)", type: "amendment", origin: { country: "Thailand", code: "th" }, destination: { country: "United States", code: "us" }, submittedAgo: "5h ago", hsCode: "0306.17", value: "$67,000", priority: "normal" },
  { id: "REV-445", product: "Essential Oils Collection", type: "new-order", origin: { country: "Egypt", code: "eg" }, destination: { country: "Canada", code: "ca" }, submittedAgo: "6h ago", hsCode: "3301.29", value: "$5,800", priority: "low" },
  { id: "REV-446", product: "Automotive Brake Pads", type: "recheck", origin: { country: "Mexico", code: "mx" }, destination: { country: "Germany", code: "de" }, submittedAgo: "7h ago", hsCode: "6813.81", value: "$34,500", priority: "urgent", notes: "ECE R90 certification due for renewal" },
  { id: "REV-447", product: "Organic Honey (2,000 jars)", type: "new-order", origin: { country: "New Zealand", code: "nz" }, destination: { country: "United Arab Emirates", code: "ae" }, submittedAgo: "8h ago", hsCode: "0409.00", value: "$12,100", priority: "normal" },
];

const regionalTeams: RegionalTeam[] = [
  { region: "EU & UK", countries: [{ name: "Germany", code: "de" }, { name: "France", code: "fr" }, { name: "UK", code: "gb" }, { name: "Italy", code: "it" }], lead: "Hans Mueller", leadInitials: "HM", activeReviews: 8, completedToday: 5, avgResponseHrs: 2.1, complianceRate: 98, status: "online", members: 4 },
  { region: "Americas", countries: [{ name: "USA", code: "us" }, { name: "Brazil", code: "br" }, { name: "Canada", code: "ca" }, { name: "Mexico", code: "mx" }], lead: "Sarah Chen", leadInitials: "SC", activeReviews: 6, completedToday: 3, avgResponseHrs: 3.4, complianceRate: 96, status: "online", members: 3 },
  { region: "Asia Pacific", countries: [{ name: "Japan", code: "jp" }, { name: "South Korea", code: "kr" }, { name: "India", code: "in" }, { name: "Vietnam", code: "vn" }], lead: "Kenji Tanaka", leadInitials: "KT", activeReviews: 11, completedToday: 7, avgResponseHrs: 1.8, complianceRate: 99, status: "online", members: 5 },
  { region: "Middle East & Africa", countries: [{ name: "UAE", code: "ae" }, { name: "Egypt", code: "eg" }, { name: "South Africa", code: "za" }], lead: "Amira Hassan", leadInitials: "AH", activeReviews: 3, completedToday: 2, avgResponseHrs: 4.2, complianceRate: 94, status: "partially", members: 2 },
];

const disputes: DisputeItem[] = [
  { id: "DIS-081", parties: "Meridian Corp vs. Carrier", type: "Damaged Goods", amount: "$12,500", stage: "escalated", daysOpen: 18, region: "EU", regionCode: "de" },
  { id: "DIS-083", parties: "FreshPack vs. Buyer #4291", type: "Quality Dispute", amount: "$4,200", stage: "mediation", daysOpen: 10, region: "US", regionCode: "us" },
  { id: "DIS-079", parties: "Buyer #3847 vs. TradeFlow", type: "Delivery Delay", amount: "$1,800", stage: "investigating", daysOpen: 15, region: "Asia", regionCode: "jp" },
  { id: "DIS-085", parties: "NovaTech vs. Supplier", type: "Non-Compliance", amount: "$8,900", stage: "new", daysOpen: 2, region: "EU", regionCode: "fr" },
];

const recheckItems: RecheckItem[] = [
  { id: "RCK-12", product: "UV-Cured Coating Chemicals", reason: "REACH SVHC list updated — 7 new substances", regulationChange: "EU REACH Regulation", originalApproval: "Jan 15, 2026", risk: "high", affectedOrders: 4, region: "EU", regionCode: "de" },
  { id: "RCK-13", product: "Pediatric Vitamin Supplements", reason: "FDA labeling guidelines revised", regulationChange: "FDA 21 CFR 101.36", originalApproval: "Dec 8, 2025", risk: "high", affectedOrders: 2, region: "US", regionCode: "us" },
  { id: "RCK-14", product: "Electric Scooter Components", reason: "UN38.3 battery testing standard update", regulationChange: "UN Manual Tests & Criteria", originalApproval: "Feb 20, 2026", risk: "medium", affectedOrders: 1, region: "Global", regionCode: "gb" },
];

const approvalTrendData = [
  { week: "W6", approved: 42, flagged: 3, blocked: 1 },
  { week: "W7", approved: 38, flagged: 5, blocked: 2 },
  { week: "W8", approved: 45, flagged: 4, blocked: 1 },
  { week: "W9", approved: 51, flagged: 2, blocked: 0 },
  { week: "W10", approved: 48, flagged: 6, blocked: 3 },
  { week: "W11", approved: 53, flagged: 3, blocked: 2 },
  { week: "W12", approved: 47, flagged: 4, blocked: 3 },
];

const pipelineCounts = {
  submitted: 7,
  underReview: 12,
  approved: 47,
  flagged: 4,
  blocked: 3,
};

// ─── Inspection Data ─────────────────────────────────────────

interface InspectionDocument {
  id: string;
  type: "passport" | "drivers_license" | "national_id" | "business_registration" | "tax_certificate" | "other";
  name: string;
  uploadedAt: string;
  status: "verified" | "pending" | "rejected";
  party: "buyer" | "seller";
}

interface InspectionItem {
  id: string;
  orderId: string;
  product: string;
  buyer: { name: string; country: string; code: string };
  seller: { name: string; country: string; code: string };
  documents: InspectionDocument[];
  videoVerification: {
    buyer?: { status: "completed" | "pending" | "failed"; recordedAt?: string };
    seller?: { status: "completed" | "pending" | "failed"; recordedAt?: string };
  };
  inspectorNotes: string;
  status: "pending_documents" | "pending_video" | "under_review" | "approved" | "rejected";
  priority: "high" | "medium" | "low";
  assignedTo: string;
  createdAt: string;
}

const inspectionItems: InspectionItem[] = [
  {
    id: "INS-8847",
    orderId: "ORD-8847",
    product: "Industrial LED Panel Array (x200)",
    buyer: { name: "TechSupply GmbH", country: "Germany", code: "de" },
    seller: { name: "Shenzhen LED Corp", country: "China", code: "cn" },
    documents: [
      { id: "doc1", type: "passport", name: "buyer_passport_zhang.pdf", uploadedAt: "2h ago", status: "verified", party: "buyer" },
      { id: "doc2", type: "business_registration", name: "techsupply_registration.pdf", uploadedAt: "2h ago", status: "verified", party: "buyer" },
      { id: "doc3", type: "passport", name: "seller_passport_wang.pdf", uploadedAt: "3h ago", status: "pending", party: "seller" },
      { id: "doc4", type: "business_registration", name: "shenzhen_led_license.pdf", uploadedAt: "3h ago", status: "verified", party: "seller" },
    ],
    videoVerification: {
      buyer: { status: "completed", recordedAt: "1h ago" },
      seller: { status: "pending" },
    },
    inspectorNotes: "Buyer verified successfully. Awaiting seller video verification.",
    status: "pending_video",
    priority: "high",
    assignedTo: "Hans Mueller",
    createdAt: "4h ago",
  },
  {
    id: "INS-8851",
    orderId: "ORD-8851",
    product: "Organic Tea Blend (5,000 kg)",
    buyer: { name: "Green Imports LLC", country: "United States", code: "us" },
    seller: { name: "Kerala Tea Estates", country: "India", code: "in" },
    documents: [
      { id: "doc5", type: "drivers_license", name: "buyer_license_smith.pdf", uploadedAt: "5h ago", status: "verified", party: "buyer" },
      { id: "doc6", type: "tax_certificate", name: "green_imports_tax.pdf", uploadedAt: "5h ago", status: "verified", party: "buyer" },
      { id: "doc7", type: "national_id", name: "seller_id_kumar.pdf", uploadedAt: "6h ago", status: "verified", party: "seller" },
      { id: "doc8", type: "business_registration", name: "kerala_tea_registration.pdf", uploadedAt: "6h ago", status: "verified", party: "seller" },
    ],
    videoVerification: {
      buyer: { status: "completed", recordedAt: "4h ago" },
      seller: { status: "completed", recordedAt: "5h ago" },
    },
    inspectorNotes: "All documents and videos verified. Ready for final approval.",
    status: "under_review",
    priority: "medium",
    assignedTo: "Sarah Chen",
    createdAt: "7h ago",
  },
  {
    id: "INS-8839",
    orderId: "ORD-8839",
    product: "Lithium Battery Cells (10,000 units)",
    buyer: { name: "EnergyTech Brasil", country: "Brazil", code: "br" },
    seller: { name: "Samsung SDI", country: "South Korea", code: "kr" },
    documents: [
      { id: "doc9", type: "passport", name: "buyer_passport_silva.pdf", uploadedAt: "1d ago", status: "rejected", party: "buyer" },
      { id: "doc10", type: "business_registration", name: "energytech_registration.pdf", uploadedAt: "1d ago", status: "verified", party: "buyer" },
    ],
    videoVerification: {
      buyer: { status: "failed" },
      seller: { status: "pending" },
    },
    inspectorNotes: "Buyer passport rejected - image quality too low. Requesting resubmission.",
    status: "pending_documents",
    priority: "high",
    assignedTo: "Kenji Tanaka",
    createdAt: "1d ago",
  },
];

// ─── Severity/Priority styling ────────────────────────────

const severityConfig = {
  critical: { bg: "bg-[#E5484D]/8", text: "text-[#E5484D]", border: "border-[#E5484D]/15", dot: "bg-[#E5484D]", label: "Critical" },
  high: { bg: "bg-[#D97706]/8", text: "text-[#D97706]", border: "border-[#D97706]/15", dot: "bg-[#D97706]", label: "High" },
  medium: { bg: "bg-[#0171E3]/8", text: "text-[#0171E3]", border: "border-[#0171E3]/15", dot: "bg-[#0171E3]", label: "Medium" },
  low: { bg: "bg-[#30A46C]/8", text: "text-[#30A46C]", border: "border-[#30A46C]/15", dot: "bg-[#30A46C]", label: "Low" },
};

const reviewTypeConfig = {
  "new-order": { icon: <Package size={12} />, label: "New Order", color: "#0171E3" },
  "recheck": { icon: <RefreshCw size={12} />, label: "Recheck", color: "#D97706" },
  "amendment": { icon: <FileText size={12} />, label: "Amendment", color: "#30A46C" },
  "renewal": { icon: <Clock size={12} />, label: "Renewal", color: "#8B5CF6" },
};

const stageConfig = {
  escalated: { color: "#E5484D", bg: "bg-[#E5484D]/8", text: "text-[#E5484D]", label: "Escalated" },
  mediation: { color: "#D97706", bg: "bg-[#D97706]/8", text: "text-[#D97706]", label: "Mediation" },
  investigating: { color: "#0171E3", bg: "bg-[#0171E3]/8", text: "text-[#0171E3]", label: "Investigating" },
  new: { color: "#30A46C", bg: "bg-[#30A46C]/8", text: "text-[#30A46C]", label: "New" },
};

// ─── Component ───────────────────────────────────────────

export function LegalDashboard() {
  const [expandedBlocked, setExpandedBlocked] = useState<string | null>(blockedOrders[0]?.id || null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "urgent" | "recheck">("all");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { addEnergy } = useBounce();

  const totalBlocked = blockedOrders.length;
  const totalBlockedValue = blockedOrders.reduce((s, o) => s + parseInt(o.value.replace(/[$,]/g, "")), 0);
  const totalPending = pendingReviews.length;
  const urgentCount = pendingReviews.filter(r => r.priority === "urgent").length;
  const recheckCount = pendingReviews.filter(r => r.type === "recheck").length;
  const totalActiveDisputes = disputes.length;
  const escalatedDisputes = disputes.filter(d => d.stage === "escalated").length;

  const filteredReviews = pendingReviews.filter(r => {
    if (reviewFilter === "urgent") return r.priority === "urgent";
    if (reviewFilter === "recheck") return r.type === "recheck";
    return true;
  });

  return (
    <div className="space-y-7 max-w-[1440px]">

      {/* ═══════════════════════════════════════════════════
       *  SECTION 0: HEADER — Warm, purposeful greeting
       * ═══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Legal Command Center</h1>
          <p className="text-muted-foreground/60 text-[0.875rem]">
            {totalBlocked > 0
              ? `${totalBlocked} shipment${totalBlocked > 1 ? "s" : ""} blocked, ${totalPending} reviews pending`
              : `${totalPending} reviews pending — all shipments flowing`
            }
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted/20 text-[0.75rem] text-muted-foreground/50">
            <Activity size={13} />
            <span>Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C] animate-pulse" />
          </div>
          <BounceButton variant="secondary" size="sm" icon={<BarChart3 size={14} />}>Reports</BounceButton>
          <BounceButton variant="primary" size="sm" icon={<Eye size={14} />} energyWeight={2}>Review Queue</BounceButton>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
       *  SECTION 1: BLOCKED ORDERS — "What's on FIRE?"
       *  The single most important thing. Pulsing. Unmissable.
       *  These are real shipments sitting at ports, stuck.
       * ═══════════════════════════════════════════════════ */}
      {blockedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E5484D]/12 overflow-hidden"
        >
          {/* Warm alert banner */}
          <div className="flex items-center justify-between px-7 py-4 bg-[#E5484D]/[0.03] border-b border-[#E5484D]/8">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-xl bg-[#E5484D]/10 flex items-center justify-center"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                <Ban size={17} className="text-[#E5484D]" />
              </motion.div>
              <div>
                <p className="text-[0.875rem] text-foreground/80">
                  {totalBlocked} Shipment{totalBlocked > 1 ? "s" : ""} Blocked
                </p>
                <p className="text-[0.6875rem] text-muted-foreground/40">
                  ${totalBlockedValue.toLocaleString()} in goods waiting for compliance clearance
                </p>
              </div>
            </div>
            <StatusPill status="error" label="Needs Immediate Action" pulse />
          </div>

          {/* Blocked order cards */}
          <div className="p-5 space-y-3">
            {blockedOrders.map((order, i) => {
              const isExpanded = expandedBlocked === order.id;
              const sev = severityConfig[order.severity];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.04 }}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isExpanded ? `${sev.border} shadow-[0_2px_12px_rgba(0,0,0,0.04)]` : "border-border/30 hover:border-border/50"
                  }`}
                >
                  <motion.button
                    onClick={() => {
                      setExpandedBlocked(isExpanded ? null : order.id);
                      addEnergy(2);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer text-left"
                    whileTap={{ scale: 0.995 }}
                  >
                    {/* Severity dot */}
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        className={`w-2.5 h-2.5 rounded-full ${sev.dot}`}
                        animate={order.severity === "critical" ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className={`text-[0.5rem] ${sev.text}`}>{sev.label}</span>
                    </div>

                    {/* Route: Origin → Destination */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <img src={getFlagUrl(order.origin.code)} alt={order.origin.country} className="w-[22px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                      <ArrowRight size={12} className="text-muted-foreground/25" />
                      <img src={getFlagUrl(order.destination.code)} alt={order.destination.country} className="w-[22px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] text-foreground/70 truncate">{order.product}</p>
                      <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">{order.id} &middot; HS {order.hsCode}</p>
                    </div>

                    {/* Time blocked */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[0.8125rem] tabular-nums ${order.hoursBlocked > 20 ? "text-[#E5484D]" : "text-foreground/60"}`}>
                        {order.hoursBlocked}h
                      </p>
                      <p className="text-[0.5625rem] text-muted-foreground/30">blocked</p>
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <p className="text-[0.875rem] text-foreground/70 tabular-nums">{order.value}</p>
                    </div>

                    <ChevronDown size={14} className={`text-muted-foreground/30 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                  </motion.button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1">
                          <div className={`rounded-2xl ${sev.bg} p-5 space-y-4`}>
                            {/* Reason — THE most important info */}
                            <div className="flex items-start gap-3">
                              <AlertCircle size={15} className={`${sev.text} mt-0.5 flex-shrink-0`} />
                              <div>
                                <p className="text-[0.6875rem] text-muted-foreground/40 uppercase tracking-wider mb-1">Why It's Blocked</p>
                                <p className="text-[0.8125rem] text-foreground/70 leading-relaxed">{order.reason}</p>
                              </div>
                            </div>

                            {/* Route detail */}
                            <div className="flex items-center gap-6 text-[0.75rem]">
                              <div className="flex items-center gap-2">
                                <img src={getFlagUrl(order.origin.code)} alt="" className="w-[16px] rounded-[1.5px]" />
                                <span className="text-foreground/55">{order.origin.country}</span>
                              </div>
                              <ArrowRight size={11} className="text-muted-foreground/25" />
                              <div className="flex items-center gap-2">
                                <img src={getFlagUrl(order.destination.code)} alt="" className="w-[16px] rounded-[1.5px]" />
                                <span className="text-foreground/55">{order.destination.country}</span>
                              </div>
                              <span className="text-muted-foreground/25">|</span>
                              <span className="text-muted-foreground/40">Team: {order.assignedTeam}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                              <BounceButton variant="primary" size="sm" icon={<Eye size={13} />} energyWeight={3}>
                                Review Now
                              </BounceButton>
                              <BounceButton variant="secondary" size="sm" icon={<Send size={13} />}>
                                Assign to Team
                              </BounceButton>
                              <BounceButton variant="secondary" size="sm" icon={<FileText size={13} />}>
                                View Documents
                              </BounceButton>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════
       *  SECTION 2: VITAL SIGNS — Quick pulse check
       *  4 cards: Pipeline flow, Pending queue, Disputes, Health
       * ═══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <StatCard
          label="Orders In Pipeline"
          value={String(pipelineCounts.submitted + pipelineCounts.underReview)}
          change={`${pipelineCounts.underReview} under review`}
          changeType="neutral"
          icon={<Layers size={20} className="text-primary" />}
          iconBg="bg-primary/8"
          index={0}
          subtitle={`${pipelineCounts.submitted} new submissions today`}
          sparklineData={[15, 18, 14, 19, 16, 22, 19]}
          sparklineColor="#0171E3"
          accentColor="#0171E3"
        />
        <StatCard
          label="Pending Your Review"
          value={String(totalPending)}
          change={`${urgentCount} urgent`}
          changeType={urgentCount > 2 ? "negative" : "neutral"}
          icon={<Inbox size={20} className="text-[#D97706]" />}
          iconBg="bg-[#D97706]/8"
          index={1}
          subtitle={`${recheckCount} are rechecks`}
          sparklineData={[5, 6, 4, 8, 7, 9, 7]}
          sparklineColor="#D97706"
          accentColor="#D97706"
        />
        <StatCard
          label="Active Disputes"
          value={String(totalActiveDisputes)}
          change={`${escalatedDisputes} escalated`}
          changeType={escalatedDisputes > 0 ? "negative" : "positive"}
          icon={<Gavel size={20} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/8"
          index={2}
          subtitle="$27,400 at stake"
          sparklineData={[7, 6, 5, 5, 4, 4, 4]}
          sparklineColor="#E5484D"
          accentColor="#E5484D"
        />
        <StatCard
          label="Compliance Health"
          value="96.8%"
          change="+1.2% this month"
          changeType="positive"
          icon={<Shield size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={3}
          subtitle="Across all regions"
          sparklineData={[93, 94, 95, 94, 96, 97, 96.8]}
          sparklineColor="#30A46C"
          accentColor="#30A46C"
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════
       *  SECTION 3: COMPLIANCE PIPELINE + PENDING REVIEWS
       *  Left: Visual pipeline — where are orders RIGHT NOW?
       *  Right: Action queue — what needs YOUR hands?
       * ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">

        {/* ORDER COMPLIANCE PIPELINE — Visual journey */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground/80 tracking-tight">Order Compliance Flow</h3>
              <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">Where every order stands right now</p>
            </div>
            <span className="text-[0.6875rem] text-muted-foreground/30 px-2.5 py-1 rounded-full bg-muted/15">
              {pipelineCounts.submitted + pipelineCounts.underReview + pipelineCounts.approved + pipelineCounts.flagged + pipelineCounts.blocked} total
            </span>
          </div>

          {/* Pipeline stages — visual waterfall */}
          <div className="space-y-3">
            {[
              { label: "Submitted", count: pipelineCounts.submitted, color: "#0171E3", icon: <Inbox size={14} /> },
              { label: "Under Review", count: pipelineCounts.underReview, color: "#8B5CF6", icon: <Eye size={14} /> },
              { label: "Approved", count: pipelineCounts.approved, color: "#30A46C", icon: <CheckCircle2 size={14} /> },
              { label: "Flagged", count: pipelineCounts.flagged, color: "#D97706", icon: <Flag size={14} /> },
              { label: "Blocked", count: pipelineCounts.blocked, color: "#E5484D", icon: <Ban size={14} /> },
            ].map((stage, i) => {
              const maxCount = Math.max(pipelineCounts.submitted, pipelineCounts.underReview, pipelineCounts.approved, pipelineCounts.flagged, pipelineCounts.blocked);
              const barWidth = (stage.count / maxCount) * 100;
              return (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span style={{ color: stage.color }} className="opacity-60">{stage.icon}</span>
                      <span className="text-[0.75rem] text-foreground/55">{stage.label}</span>
                    </div>
                    <span className="text-[0.875rem] text-foreground/70 tabular-nums">{stage.count}</span>
                  </div>
                  <div className="h-[7px] bg-black/[0.03] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: stage.color, opacity: 0.65 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Approval rate mini-chart */}
          <div className="mt-7 pt-5 border-t border-border/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] text-muted-foreground/40">Weekly Approval Volume</p>
              <p className="text-[0.6875rem] text-[#30A46C]/60">Avg 46/week</p>
            </div>
            <CustomAreaChart
              data={approvalTrendData}
              xKey="week"
              series={[
                { dataKey: "approved", color: "#30A46C", label: "Approved" },
              ]}
              height={100}
              yDomain={[30, 60]}
            />
          </div>
        </motion.div>

        {/* PENDING REVIEWS — "What needs MY hands?" */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 flex flex-col overflow-hidden"
        >
          {/* Header with filter */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-border/20">
            <div>
              <h3 className="text-foreground/80 tracking-tight">Pending Compliance Reviews</h3>
              <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">
                Orders waiting for your approval before shipment
              </p>
            </div>
            <div className="flex gap-1.5">
              {([
                { key: "all", label: `All (${totalPending})` },
                { key: "urgent", label: `Urgent (${urgentCount})` },
                { key: "recheck", label: `Rechecks (${recheckCount})` },
              ] as const).map(f => (
                <motion.button
                  key={f.key}
                  onClick={() => { setReviewFilter(f.key); addEnergy(1); }}
                  className={`px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer transition-all ${
                    reviewFilter === f.key
                      ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(1,113,227,0.12)]"
                      : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/15"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Review list — scrollable */}
          <div className="flex-1 overflow-y-auto max-h-[480px] scrollbar-thin">
            <div className="p-4 space-y-1.5">
              {filteredReviews.map((review, i) => {
                const typeConf = reviewTypeConfig[review.type];
                const prioConf = severityConfig[review.priority === "urgent" ? "high" : review.priority === "normal" ? "medium" : "low"];
                const isSelected = selectedReview === review.id;
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <motion.button
                      onClick={() => {
                        setSelectedReview(isSelected ? null : review.id);
                        addEnergy(1.5);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/[0.04] shadow-[0_0_0_1px_rgba(1,113,227,0.1)]"
                          : "hover:bg-muted/10"
                      }`}
                      whileTap={{ scale: 0.998 }}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Priority indicator */}
                        <div className={`w-1.5 h-8 rounded-full ${prioConf.dot} opacity-50 flex-shrink-0`} />

                        {/* Route flags */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <img src={getFlagUrl(review.origin.code)} alt={review.origin.country} className="w-[18px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          <ArrowRight size={10} className="text-muted-foreground/20" />
                          <img src={getFlagUrl(review.destination.code)} alt={review.destination.country} className="w-[18px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.8125rem] text-foreground/65 truncate">{review.product}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[0.625rem] text-muted-foreground/35">{review.id}</span>
                            <span className="text-[0.625rem] text-muted-foreground/20">&middot;</span>
                            <span className="text-[0.625rem] text-muted-foreground/35">HS {review.hsCode}</span>
                          </div>
                        </div>

                        {/* Type badge */}
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.5625rem] flex-shrink-0"
                          style={{ backgroundColor: `${typeConf.color}0A`, color: `${typeConf.color}90` }}>
                          {typeConf.icon}
                          {typeConf.label}
                        </span>

                        {/* Value + time */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-[0.8125rem] text-foreground/60 tabular-nums">{review.value}</p>
                          <p className="text-[0.5625rem] text-muted-foreground/30">{review.submittedAgo}</p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Expanded review detail */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-4 mb-2 p-4 rounded-xl bg-muted/[0.06] border border-border/20 space-y-3">
                            <div className="flex items-center gap-3 text-[0.75rem]">
                              <div className="flex items-center gap-1.5">
                                <img src={getFlagUrl(review.origin.code)} alt="" className="w-[14px] rounded-[1.5px]" />
                                <span className="text-foreground/50">{review.origin.country}</span>
                              </div>
                              <ArrowRight size={10} className="text-muted-foreground/20" />
                              <div className="flex items-center gap-1.5">
                                <img src={getFlagUrl(review.destination.code)} alt="" className="w-[14px] rounded-[1.5px]" />
                                <span className="text-foreground/50">{review.destination.country}</span>
                              </div>
                            </div>
                            {review.notes && (
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#D97706]/[0.04] border border-[#D97706]/8">
                                <AlertTriangle size={12} className="text-[#D97706]/50 mt-0.5 flex-shrink-0" />
                                <p className="text-[0.75rem] text-foreground/55 leading-relaxed">{review.notes}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <BounceButton variant="primary" size="sm" icon={<CheckCircle2 size={13} />} energyWeight={3}>
                                Approve
                              </BounceButton>
                              <BounceButton variant="warning" size="sm" icon={<Flag size={13} />} energyWeight={2}>
                                Flag for Review
                              </BounceButton>
                              <BounceButton variant="secondary" size="sm" icon={<FileText size={13} />}>
                                Documents
                              </BounceButton>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {filteredReviews.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <CheckCircle2 size={28} className="text-[#30A46C]/30 mb-3" />
                  <p className="text-[0.8125rem] text-muted-foreground/40">All caught up</p>
                  <p className="text-[0.6875rem] text-muted-foreground/25">No reviews match this filter</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════
       *  SECTION 4: REGIONAL TEAMS + DISPUTES
       *  Left: Which teams are working, their load, flags
       *  Right: Dispute mediation queue (escalated first)
       * ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">

        {/* REGIONAL LEGAL TEAMS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-card rounded-3xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <Globe size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-foreground/80 tracking-tight">Regional Legal Teams</h3>
                <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">Working simultaneously across time zones</p>
              </div>
            </div>
            <span className="text-[0.6875rem] text-muted-foreground/30">
              {regionalTeams.reduce((s, t) => s + t.activeReviews, 0)} active reviews
            </span>
          </div>

          <div className="space-y-3">
            {regionalTeams.map((team, i) => (
              <motion.div
                key={team.region}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="p-4 rounded-2xl bg-muted/[0.04] border border-border/20 hover:border-border/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Country flags cluster */}
                  <div className="flex -space-x-1.5 flex-shrink-0">
                    {team.countries.slice(0, 4).map(c => (
                      <img key={c.code} src={getFlagUrl(c.code)} alt={c.name} title={c.name}
                        className="w-[22px] rounded-[2px] shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_0_2.5px_rgba(0,0,0,0.04)]"
                      />
                    ))}
                  </div>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[0.8125rem] text-foreground/65">{team.region}</p>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        team.status === "online" ? "bg-[#30A46C]" :
                        team.status === "partially" ? "bg-[#FFB224]" : "bg-muted-foreground/30"
                      }`} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-primary/8 flex items-center justify-center text-[0.375rem] text-primary/60">{team.leadInitials}</div>
                      <span className="text-[0.625rem] text-muted-foreground/35">{team.lead} &middot; {team.members} members</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[0.9375rem] text-foreground/65 tabular-nums">{team.activeReviews}</p>
                      <p className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-wider">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[0.9375rem] text-[#30A46C]/70 tabular-nums">{team.completedToday}</p>
                      <p className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-wider">Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[0.9375rem] text-foreground/55 tabular-nums">{team.avgResponseHrs}h</p>
                      <p className="text-[0.5rem] text-muted-foreground/30 uppercase tracking-wider">Avg</p>
                    </div>
                    <div className="w-10">
                      <ProgressRing
                        value={team.complianceRate}
                        size={40}
                        strokeWidth={3}
                        color={team.complianceRate >= 97 ? "#30A46C" : team.complianceRate >= 95 ? "#0171E3" : "#D97706"}
                      />
                    </div>
                  </div>
                </div>

                {/* Workload bar */}
                <div className="mt-3">
                  <div className="h-[4px] bg-black/[0.02] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary/40"
                      initial={{ width: 0 }}
                      animate={{ width: `${(team.activeReviews / 15) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* DISPUTE MEDIATION QUEUE */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-3xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D97706]/8 flex items-center justify-center">
                <Scale size={16} className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="text-foreground/80 tracking-tight">Disputes & Mediation</h3>
                <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">
                  {escalatedDisputes > 0 ? `${escalatedDisputes} escalated — needs attention` : "All under control"}
                </p>
              </div>
            </div>
            <BounceButton variant="secondary" size="sm" icon={<ArrowUpRight size={13} />}>
              Full View
            </BounceButton>
          </div>

          <div className="space-y-2.5">
            {disputes
              .sort((a, b) => {
                const order = { escalated: 0, mediation: 1, investigating: 2, new: 3 };
                return order[a.stage] - order[b.stage];
              })
              .map((dispute, i) => {
                const stage = stageConfig[dispute.stage];
                return (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 + i * 0.04 }}
                    className={`p-4 rounded-2xl border transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer ${
                      dispute.stage === "escalated"
                        ? "border-[#E5484D]/15 bg-[#E5484D]/[0.02]"
                        : "border-border/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Stage indicator */}
                      <motion.div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}
                        style={{ backgroundColor: stage.color }}
                        animate={dispute.stage === "escalated" ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[0.75rem] text-primary/70">{dispute.id}</span>
                          <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded-md ${stage.bg} ${stage.text}`}>
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-[0.8125rem] text-foreground/65">{dispute.parties}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[0.6875rem] text-muted-foreground/35">
                          <span className="flex items-center gap-1"><Flag size={10} />{dispute.type}</span>
                          <span className="flex items-center gap-1">
                            <img src={getFlagUrl(dispute.regionCode)} alt="" className="w-[12px] rounded-[1px] opacity-60" />
                            {dispute.region}
                          </span>
                          <span className="flex items-center gap-1"><Clock size={10} />{dispute.daysOpen}d open</span>
                        </div>
                      </div>

                      <p className="text-[0.875rem] text-foreground/65 tabular-nums flex-shrink-0">{dispute.amount}</p>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Summary donut */}
          <div className="mt-6 pt-5 border-t border-border/15">
            <div className="flex items-center justify-center gap-8">
              <CustomDonutChart
                data={[
                  { name: "Escalated", value: disputes.filter(d => d.stage === "escalated").length, color: "#E5484D" },
                  { name: "Mediation", value: disputes.filter(d => d.stage === "mediation").length, color: "#D97706" },
                  { name: "Investigating", value: disputes.filter(d => d.stage === "investigating").length, color: "#0171E3" },
                  { name: "New", value: disputes.filter(d => d.stage === "new").length, color: "#30A46C" },
                ]}
                size={90}
                centerValue={String(totalActiveDisputes)}
                centerLabel="total"
                thickness={8}
              />
              <div className="space-y-2">
                {[
                  { label: "Escalated", count: disputes.filter(d => d.stage === "escalated").length, color: "#E5484D" },
                  { label: "Mediation", count: disputes.filter(d => d.stage === "mediation").length, color: "#D97706" },
                  { label: "Investigating", count: disputes.filter(d => d.stage === "investigating").length, color: "#0171E3" },
                  { label: "New", count: disputes.filter(d => d.stage === "new").length, color: "#30A46C" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color, opacity: 0.6 }} />
                    <span className="text-[0.6875rem] text-muted-foreground/45 w-[80px]">{s.label}</span>
                    <span className="text-[0.75rem] text-foreground/55 tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════
       *  SECTION 5: COMPLIANCE RECHECK QUEUE
       *  Products that were approved but regulations changed.
       *  Ship them without rechecking = catastrophe.
       * ═══════════════════════════════════════════════════ */}
      {recheckItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 overflow-hidden"
        >
          <div className="flex items-center justify-between px-7 py-5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D97706]/8 flex items-center justify-center">
                <RefreshCw size={16} className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="text-foreground/80 tracking-tight">Compliance Recheck Required</h3>
                <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">
                  Previously approved products affected by regulation changes
                </p>
              </div>
            </div>
            <StatusPill status="warning" label={`${recheckItems.length} products`} />
          </div>

          <div className="p-5 space-y-2.5">
            {recheckItems.map((item, i) => {
              const risk = severityConfig[item.risk];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.33 + i * 0.04 }}
                  className={`p-5 rounded-2xl border ${risk.border} ${risk.bg} transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full ${risk.dot} mt-1.5 flex-shrink-0`}
                      animate={item.risk === "high" ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[0.875rem] text-foreground/70">{item.product}</p>
                        <span className={`text-[0.5rem] uppercase tracking-wider ${risk.text}`}>{item.risk} risk</span>
                      </div>
                      <p className="text-[0.75rem] text-foreground/50 leading-relaxed mb-2">{item.reason}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] text-muted-foreground/40">
                        <span className="flex items-center gap-1"><FileText size={10} />{item.regulationChange}</span>
                        <span className="text-muted-foreground/15">|</span>
                        <span className="flex items-center gap-1">
                          <img src={getFlagUrl(item.regionCode)} alt="" className="w-[12px] rounded-[1px] opacity-60" />
                          {item.region}
                        </span>
                        <span className="text-muted-foreground/15">|</span>
                        <span className="flex items-center gap-1"><Package size={10} />{item.affectedOrders} active order{item.affectedOrders > 1 ? "s" : ""} affected</span>
                        <span className="text-muted-foreground/15">|</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />Approved {item.originalApproval}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <BounceButton variant="primary" size="sm" icon={<Eye size={13} />} energyWeight={2}>
                        Recheck Now
                      </BounceButton>
                      <BounceButton variant="secondary" size="sm" icon={<Clock size={13} />}>
                        Schedule
                      </BounceButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════
       *  SECTION 6: IDENTITY & DOCUMENT INSPECTIONS
       *  Verify buyers & sellers through documents + video
       *  Officer matches real person to submitted documents
       * ═══════════════════════════════════════════════════ */}
      {inspectionItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 overflow-hidden"
        >
          <div className="flex items-center justify-between px-7 py-5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/8 flex items-center justify-center">
                <UserCheck size={16} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-foreground/80 tracking-tight">Identity & Document Inspections</h3>
                <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">
                  Verify buyer and seller identity through documents and live video
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status="warning" label={`${inspectionItems.filter(i => i.status === "pending_documents" || i.status === "pending_video").length} pending`} />
              <BounceButton variant="secondary" size="sm" icon={<ArrowUpRight size={13} />}>
                Full Queue
              </BounceButton>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {inspectionItems.map((inspection, i) => {
              const isSelected = selectedInspection === inspection.id;
              const statusConfig = {
                pending_documents: { color: "#D97706", bg: "bg-[#D97706]/8", text: "text-[#D97706]", label: "Awaiting Documents" },
                pending_video: { color: "#8B5CF6", bg: "bg-[#8B5CF6]/8", text: "text-[#8B5CF6]", label: "Awaiting Video" },
                under_review: { color: "#0171E3", bg: "bg-[#0171E3]/8", text: "text-[#0171E3]", label: "Under Review" },
                approved: { color: "#30A46C", bg: "bg-[#30A46C]/8", text: "text-[#30A46C]", label: "Approved" },
                rejected: { color: "#E5484D", bg: "bg-[#E5484D]/8", text: "text-[#E5484D]", label: "Rejected" },
              };
              const status = statusConfig[inspection.status];
              const prioConf = severityConfig[inspection.priority === "high" ? "high" : inspection.priority === "medium" ? "medium" : "low"];

              return (
                <motion.div
                  key={inspection.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 + i * 0.04 }}
                  className={`rounded-2xl border transition-all ${
                    isSelected ? `${prioConf.border} shadow-[0_2px_12px_rgba(0,0,0,0.04)]` : "border-border/30 hover:border-border/50"
                  }`}
                >
                  <motion.button
                    onClick={() => {
                      setSelectedInspection(isSelected ? null : inspection.id);
                      addEnergy(2);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer text-left"
                    whileTap={{ scale: 0.995 }}
                  >
                    {/* Priority dot */}
                    <div className={`w-2.5 h-2.5 rounded-full ${prioConf.dot} flex-shrink-0`} />

                    {/* Buyer/Seller route */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <img src={getFlagUrl(inspection.seller.code)} alt={inspection.seller.country} className="w-[22px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                      <ArrowRight size={12} className="text-muted-foreground/25" />
                      <img src={getFlagUrl(inspection.buyer.code)} alt={inspection.buyer.country} className="w-[22px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                    </div>

                    {/* Inspection info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] text-foreground/70 truncate">{inspection.product}</p>
                      <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">{inspection.id} &middot; {inspection.seller.name} → {inspection.buyer.name}</p>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[0.625rem] flex-shrink-0 ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>

                    {/* Document & Video status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <FileCheck size={14} className={inspection.documents.filter(d => d.status === "verified").length === inspection.documents.length ? "text-[#30A46C]" : "text-muted-foreground/30"} />
                        <span className="text-[0.75rem] text-foreground/60 tabular-nums">{inspection.documents.filter(d => d.status === "verified").length}/{inspection.documents.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video size={14} className={
                          inspection.videoVerification.buyer?.status === "completed" && inspection.videoVerification.seller?.status === "completed"
                            ? "text-[#30A46C]"
                            : "text-muted-foreground/30"
                        } />
                        <span className="text-[0.75rem] text-foreground/60 tabular-nums">
                          {[inspection.videoVerification.buyer?.status, inspection.videoVerification.seller?.status].filter(s => s === "completed").length}/2
                        </span>
                      </div>
                    </div>

                    <ChevronDown size={14} className={`text-muted-foreground/30 transition-transform flex-shrink-0 ${isSelected ? "rotate-180" : ""}`} />
                  </motion.button>

                  {/* Expanded inspection detail */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="overflow-hidden"
                        onMouseEnter={() => setHoveredSection(inspection.id)}
                        onMouseLeave={() => setHoveredSection(null)}
                      >
                        <div className="px-5 pb-5 pt-1">
                          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
                            
                            {/* LEFT SIDEBAR: Document & Video Status - Collapses when not hovered */}
                            <motion.div
                              className="space-y-4 overflow-hidden"
                              initial={{ width: 280 }}
                              animate={{ 
                                width: hoveredSection === inspection.id ? 280 : 60,
                                opacity: hoveredSection === inspection.id ? 1 : 0.6
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                              {hoveredSection === inspection.id ? (
                                <>
                                  {/* Documents Section */}
                                  <div className="rounded-2xl bg-muted/[0.06] p-4 border border-border/20">
                                    <div className="flex items-center gap-2 mb-3">
                                      <FileCheck size={14} className="text-primary" />
                                      <p className="text-[0.75rem] text-foreground/60 font-medium">Documents</p>
                                    </div>
                                    <div className="space-y-2">
                                      {inspection.documents.map(doc => {
                                        const docTypeIcons = {
                                          passport: <CreditCard size={12} />,
                                          drivers_license: <CreditCard size={12} />,
                                          national_id: <CreditCard size={12} />,
                                          business_registration: <Building2 size={12} />,
                                          tax_certificate: <FileText size={12} />,
                                          other: <FileText size={12} />,
                                        };
                                        const docStatus = {
                                          verified: { color: "#30A46C", icon: <CheckCircle2 size={11} />, label: "Verified" },
                                          pending: { color: "#D97706", icon: <Clock size={11} />, label: "Pending" },
                                          rejected: { color: "#E5484D", icon: <AlertTriangle size={11} />, label: "Rejected" },
                                        };
                                        const ds = docStatus[doc.status];
                                        return (
                                          <div key={doc.id} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                                            <div className="w-6 h-6 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                              <span className="text-primary/60">{docTypeIcons[doc.type]}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 mb-0.5">
                                                <span style={{ color: ds.color }} className="flex-shrink-0">{ds.icon}</span>
                                                <p className="text-[0.625rem] text-foreground/50 truncate">{doc.name}</p>
                                              </div>
                                              <p className="text-[0.5625rem] text-muted-foreground/30">{doc.party} · {doc.uploadedAt}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <BounceButton variant="secondary" size="sm" icon={<Upload size={12} />} className="w-full mt-3">
                                      Upload Document
                                    </BounceButton>
                                  </div>

                                  {/* Video Verification Section */}
                                  <div className="rounded-2xl bg-muted/[0.06] p-4 border border-border/20">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Video size={14} className="text-[#8B5CF6]" />
                                      <p className="text-[0.75rem] text-foreground/60 font-medium">Video Verification</p>
                                    </div>
                                    <div className="space-y-3">
                                      {["buyer", "seller"].map(party => {
                                        const videoStatus = inspection.videoVerification[party as "buyer" | "seller"];
                                        const statusConfig = {
                                          completed: { color: "#30A46C", icon: <CheckCircle2 size={11} />, label: "Verified" },
                                          pending: { color: "#D97706", icon: <Clock size={11} />, label: "Awaiting" },
                                          failed: { color: "#E5484D", icon: <AlertTriangle size={11} />, label: "Failed" },
                                        };
                                        const vs = videoStatus ? statusConfig[videoStatus.status] : statusConfig.pending;
                                        return (
                                          <div key={party} className="p-2.5 rounded-lg bg-background/50">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span style={{ color: vs.color }}>{vs.icon}</span>
                                              <p className="text-[0.6875rem] text-foreground/60 capitalize">{party}</p>
                                            </div>
                                            {videoStatus?.status === "completed" ? (
                                              <p className="text-[0.5625rem] text-muted-foreground/40">{videoStatus.recordedAt}</p>
                                            ) : (
                                              <p className="text-[0.5625rem] text-muted-foreground/40">{vs.label}</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-3 py-4">
                                  <FileCheck size={18} className="text-primary/40" />
                                  <Video size={18} className="text-[#8B5CF6]/40" />
                                </div>
                              )}
                            </motion.div>

                            {/* RIGHT MAIN PANEL: Inspector Verification Interface */}
                            <div className="rounded-2xl bg-[#8B5CF6]/[0.03] p-5 border border-[#8B5CF6]/10 space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[0.6875rem] text-muted-foreground/40 uppercase tracking-wider mb-1">Inspector Verification</p>
                                  <p className="text-[0.875rem] text-foreground/70">Match identity documents with live video</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center text-[0.375rem] text-primary/60">
                                    {inspection.assignedTo.split(" ").map(n => n[0]).join("")}
                                  </div>
                                  <span className="text-[0.625rem] text-muted-foreground/35">{inspection.assignedTo}</span>
                                </div>
                              </div>

                              {/* Video Verification Interface */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Buyer Video */}
                                <div className="space-y-2">
                                  <p className="text-[0.625rem] text-muted-foreground/40 uppercase tracking-wider">Buyer Video</p>
                                  <div className="aspect-video rounded-xl bg-black/80 flex items-center justify-center relative overflow-hidden border border-border/10">
                                    {inspection.videoVerification.buyer?.status === "completed" ? (
                                      <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                                        <Play size={32} className="text-white/60" />
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                          <span className="text-[0.5625rem] text-white/60 px-2 py-0.5 rounded-md bg-black/40">
                                            {inspection.videoVerification.buyer.recordedAt}
                                          </span>
                                          <BounceButton variant="secondary" size="sm" icon={<Download size={10} />} className="h-6 text-[0.5625rem]">
                                            Download
                                          </BounceButton>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center">
                                        <Camera size={28} className="text-white/30 mx-auto mb-2" />
                                        <p className="text-[0.625rem] text-white/40">No video yet</p>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[0.625rem] text-muted-foreground/35">
                                    Buyer must record video following on-screen instructions
                                  </p>
                                </div>

                                {/* Seller Video */}
                                <div className="space-y-2">
                                  <p className="text-[0.625rem] text-muted-foreground/40 uppercase tracking-wider">Seller Video</p>
                                  <div className="aspect-video rounded-xl bg-black/80 flex items-center justify-center relative overflow-hidden border border-border/10">
                                    {inspection.videoVerification.seller?.status === "completed" ? (
                                      <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent" />
                                        <Play size={32} className="text-white/60" />
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                          <span className="text-[0.5625rem] text-white/60 px-2 py-0.5 rounded-md bg-black/40">
                                            {inspection.videoVerification.seller.recordedAt}
                                          </span>
                                          <BounceButton variant="secondary" size="sm" icon={<Download size={10} />} className="h-6 text-[0.5625rem]">
                                            Download
                                          </BounceButton>
                                        </div>
                                      </>
                                    ) : inspection.videoVerification.seller?.status === "pending" ? (
                                      <div className="text-center">
                                        <motion.div
                                          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                                          transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                          <Camera size={28} className="text-white/30 mx-auto mb-2" />
                                        </motion.div>
                                        <p className="text-[0.625rem] text-white/40">Awaiting video</p>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <AlertTriangle size={28} className="text-[#E5484D]/60 mx-auto mb-2" />
                                        <p className="text-[0.625rem] text-[#E5484D]/50">Verification failed</p>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[0.625rem] text-muted-foreground/35">
                                    Seller must record video following on-screen instructions
                                  </p>
                                </div>
                              </div>

                              {/* Inspector Instructions */}
                              <div className="rounded-xl bg-primary/[0.04] p-4 border border-primary/8">
                                <p className="text-[0.6875rem] text-muted-foreground/40 uppercase tracking-wider mb-2">Verification Instructions</p>
                                <ul className="space-y-1.5 text-[0.75rem] text-foreground/60">
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span>Compare face in video with photo on ID document</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span>Verify document details match business registration</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span>Ensure video shows person holding their ID clearly</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span>Check that person follows all on-screen prompts correctly</span>
                                  </li>
                                </ul>
                              </div>

                              {/* Inspector Notes */}
                              <div className="rounded-xl bg-muted/[0.06] p-4 border border-border/20">
                                <p className="text-[0.6875rem] text-muted-foreground/40 uppercase tracking-wider mb-2">Inspector Notes</p>
                                <p className="text-[0.75rem] text-foreground/60 leading-relaxed">{inspection.inspectorNotes}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <BounceButton variant="primary" size="sm" icon={<CheckCircle2 size={13} />} energyWeight={3}>
                                  Approve Inspection
                                </BounceButton>
                                <BounceButton variant="warning" size="sm" icon={<AlertTriangle size={13} />} energyWeight={2}>
                                  Request Resubmission
                                </BounceButton>
                                <BounceButton variant="secondary" size="sm" icon={<Flag size={13} />}>
                                  Flag for Review
                                </BounceButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════
       *  SECTION 7: BOTTOM ROW — Quick Actions + Risk Heatmap
       *  Gentle, supportive, always available
       * ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-3xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40"
        >
          <h3 className="text-foreground/80 tracking-tight mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Eye size={18} />, label: "Review Queue", desc: `${totalPending} pending`, color: "#0171E3" },
              { icon: <Shield size={18} />, label: "Run Audit", desc: "Compliance check", color: "#30A46C" },
              { icon: <Gavel size={18} />, label: "Dispute Center", desc: `${totalActiveDisputes} active`, color: "#D97706" },
              { icon: <RefreshCw size={18} />, label: "Recheck Products", desc: `${recheckItems.length} pending`, color: "#8B5CF6" },
              { icon: <FileText size={18} />, label: "Draft Contract", desc: "New agreement", color: "#0171E3" },
              { icon: <Globe size={18} />, label: "Regulations", desc: "Latest updates", color: "#30A46C" },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/[0.04] border border-border/15 hover:border-border/35 hover:bg-muted/8 transition-all cursor-pointer text-left"
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.43 + i * 0.03 }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${action.color}0A`, color: `${action.color}80` }}>
                  {action.icon}
                </div>
                <div>
                  <p className="text-[0.8125rem] text-foreground/65">{action.label}</p>
                  <p className="text-[0.625rem] text-muted-foreground/35">{action.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Risk Exposure by Region */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43 }}
          className="bg-card rounded-3xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground/80 tracking-tight">Risk Exposure by Region</h3>
              <p className="text-[0.6875rem] text-muted-foreground/40 mt-0.5">Combined blocked orders + flagged + disputes value</p>
            </div>
          </div>
          <HorizontalBarList
            data={[
              { label: "EU & UK", value: 82700, color: "#0171E3", icon: <div className="flex -space-x-1"><img src={getFlagUrl("de")} className="w-[14px] rounded-[1px]" /><img src={getFlagUrl("gb")} className="w-[14px] rounded-[1px]" /></div> },
              { label: "Americas", value: 155500, color: "#D97706", icon: <div className="flex -space-x-1"><img src={getFlagUrl("us")} className="w-[14px] rounded-[1px]" /><img src={getFlagUrl("br")} className="w-[14px] rounded-[1px]" /></div> },
              { label: "Asia Pacific", value: 31200, color: "#30A46C", icon: <div className="flex -space-x-1"><img src={getFlagUrl("jp")} className="w-[14px] rounded-[1px]" /><img src={getFlagUrl("kr")} className="w-[14px] rounded-[1px]" /></div> },
              { label: "Middle East & Africa", value: 17900, color: "#8B5CF6", icon: <div className="flex -space-x-1"><img src={getFlagUrl("ae")} className="w-[14px] rounded-[1px]" /><img src={getFlagUrl("eg")} className="w-[14px] rounded-[1px]" /></div> },
            ]}
            valueFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
          />

          {/* Total at stake */}
          <div className="mt-6 pt-5 border-t border-border/15 flex items-center justify-between">
            <p className="text-[0.6875rem] text-muted-foreground/35">Total value at risk</p>
            <p className="text-[1.125rem] text-foreground/60 tabular-nums tracking-tight">$287,300</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
