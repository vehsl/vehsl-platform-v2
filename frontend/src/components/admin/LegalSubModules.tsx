// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FileText, Shield, AlertTriangle, Scale, Clock, CheckCircle2,
  Eye, Download, Calendar, Users, Gavel, Flag, ChevronRight,
  Search, Filter, DollarSign, ExternalLink, BookOpen,
  ArrowUpRight, Globe, Building2, Hash, XCircle, TrendingUp,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { ProgressRing } from "./ProgressRing";
import { CustomAreaChart, HorizontalBarList } from "./CustomCharts";

/*
 * ════════════════════════════════════════════════════════════
 *  LEGAL SUB-MODULES — PLATONIC DESIGN
 *
 *    Contracts   → "What agreements are active?"
 *    Compliance  → "Are we following the rules?"
 *    Disputes    → "What needs resolution?"
 *    Regulations → "What laws apply to us?"
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
//  LEGAL → CONTRACTS
// ════════════════════════════════════════════════════════════

const contracts = [
  { id: "CTR-2401", party: "Meridian Corp", type: "B2B Supply", value: "$245,000", status: "active" as const, expires: "Jun 15, 2026", daysLeft: 89, signed: "Jan 10, 2025" },
  { id: "CTR-2402", party: "GreenLeaf Organics", type: "Seller Agreement", value: "$180,000", status: "renewal" as const, expires: "Apr 2, 2026", daysLeft: 15, signed: "Apr 2, 2025" },
  { id: "CTR-2403", party: "Atlas Materials", type: "B2B Supply", value: "$520,000", status: "active" as const, expires: "Sep 30, 2026", daysLeft: 196, signed: "Sep 30, 2024" },
  { id: "CTR-2404", party: "BrightStar Elec.", type: "Seller Agreement", value: "$92,000", status: "review" as const, expires: "Mar 28, 2026", daysLeft: 10, signed: "—" },
  { id: "CTR-2405", party: "FreshPack Foods", type: "Distribution", value: "$310,000", status: "active" as const, expires: "Dec 1, 2026", daysLeft: 258, signed: "Dec 1, 2024" },
  { id: "CTR-2406", party: "LogiPrime Carriers", type: "Logistics", value: "$156,000", status: "draft" as const, expires: "N/A", daysLeft: 0, signed: "—" },
  { id: "CTR-2407", party: "Nordic Health", type: "B2B Supply", value: "$420,000", status: "active" as const, expires: "Nov 15, 2026", daysLeft: 242, signed: "Nov 15, 2024" },
];

const contractStatusColor: Record<string, string> = {
  active: "#30A46C", renewal: "#FFB224", review: "#0171E3", draft: "#8B5CF6", expired: "#E5484D",
};

export function LegalContracts() {
  const [filter, setFilter] = useState("all");
  const statuses = ["all", "active", "renewal", "review", "draft"];
  const filtered = filter === "all" ? contracts : contracts.filter(c => c.status === filter);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Contracts</h1>
          <p className="text-muted-foreground text-[0.875rem]">Active agreements, renewals, and drafts in one place.</p>
        </div>
        <div className="flex gap-2">
          <BounceButton variant="ghost" size="sm" icon={<Download size={14} />}>Export</BounceButton>
          <BounceButton variant="primary" size="md" icon={<FileText size={16} />}>New Contract</BounceButton>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Active Contracts" value="4" icon={<FileText size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={0} accentColor="#30A46C" />
        <StatCard label="Total Value" value="$1.92M" icon={<DollarSign size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={1} accentColor="#0171E3" />
        <StatCard label="Expiring Soon" value="2" icon={<Clock size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" subtitle="Within 30 days" />
        <StatCard label="Pending Review" value="1" icon={<Eye size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item} className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] transition-all cursor-pointer capitalize ${
              filter === s ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >{s === "all" ? "All" : s}</button>
        ))}
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-5 rounded-2xl hover:bg-muted/20 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${contractStatusColor[c.status]}10` }}>
                  <FileText size={20} style={{ color: contractStatusColor[c.status] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground">{c.party}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/40">{c.id}</span>
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{c.type} · Signed {c.signed}</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-[0.8125rem]">
                  <span className="text-foreground/70">{c.value}</span>
                  {c.daysLeft > 0 && (
                    <span className={`text-[0.75rem] ${c.daysLeft <= 30 ? "text-[#FFB224]" : "text-muted-foreground/40"}`}>
                      {c.daysLeft}d left
                    </span>
                  )}
                </div>
                <StatusPill
                  status={c.status === "active" ? "success" : c.status === "renewal" ? "warning" : c.status === "review" ? "info" : "pending"}
                  label={c.status}
                  pulse={c.status === "renewal"}
                />
                <ChevronRight size={16} className="text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  LEGAL → COMPLIANCE
// ════════════════════════════════════════════════════════════

const complianceAreas = [
  { area: "Trade Regulations", score: 97, status: "compliant" as const, lastAudit: "Mar 10, 2026", items: 24, passed: 23 },
  { area: "Data Privacy (GDPR)", score: 94, status: "compliant" as const, lastAudit: "Mar 5, 2026", items: 18, passed: 17 },
  { area: "Food Safety (FDA)", score: 91, status: "attention" as const, lastAudit: "Feb 28, 2026", items: 32, passed: 29 },
  { area: "Employment Law", score: 100, status: "compliant" as const, lastAudit: "Mar 1, 2026", items: 15, passed: 15 },
  { area: "Environmental (EPA)", score: 85, status: "attention" as const, lastAudit: "Feb 15, 2026", items: 20, passed: 17 },
  { area: "Consumer Protection", score: 98, status: "compliant" as const, lastAudit: "Mar 12, 2026", items: 12, passed: 12 },
];

const complianceTrend = [
  { month: "Sep", score: 89 }, { month: "Oct", score: 91 }, { month: "Nov", score: 90 },
  { month: "Dec", score: 93 }, { month: "Jan", score: 95 }, { month: "Feb", score: 94 }, { month: "Mar", score: 96 },
];

export function LegalCompliance() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Compliance</h1>
        <p className="text-muted-foreground text-[0.875rem]">Regulatory compliance status across all operational areas.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="col-span-2">
          <StatCard label="Overall Compliance" value="96%" icon={<Shield size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={0} accentColor="#30A46C" change="+2%" changeType="positive" subtitle="Across all regulatory areas" />
        </div>
        <StatCard label="Areas Compliant" value="4/6" icon={<CheckCircle2 size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={1} accentColor="#0171E3" />
        <StatCard label="Need Attention" value="2" icon={<AlertTriangle size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-1">Compliance Score Trend</h2>
          <p className="text-muted-foreground/50 text-[0.75rem] mb-4">Weighted average across all areas</p>
          <CustomAreaChart data={complianceTrend} xKey="month" series={[{ dataKey: "score", color: "#30A46C" }]} height={180} yDomain={[80, 100]} />
        </SectionCard>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Compliance Areas</h2>
          <div className="space-y-2">
            {complianceAreas.map((a, i) => (
              <motion.div key={a.area} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-5 rounded-2xl hover:bg-muted/20 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative" style={{ backgroundColor: a.score >= 95 ? "#30A46C10" : a.score >= 85 ? "#FFB22410" : "#E5484D10" }}>
                  <ProgressRing percentage={a.score} size={48} strokeWidth={3} color={a.score >= 95 ? "#30A46C" : a.score >= 85 ? "#FFB224" : "#E5484D"} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.875rem] text-foreground">{a.area}</span>
                  <span className="text-[0.75rem] text-muted-foreground/50 block">{a.passed}/{a.items} requirements met · Audited {a.lastAudit}</span>
                </div>
                <StatusPill
                  status={a.status === "compliant" ? "success" : "warning"}
                  label={a.status === "compliant" ? "Compliant" : "Attention"}
                />
                <ChevronRight size={16} className="text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  LEGAL → DISPUTES
// ════════════════════════════════════════════════════════════

const disputes = [
  { id: "DIS-081", parties: "FreshPack vs. Buyer #4291", type: "Quality Dispute", amount: "$4,200", status: "investigating" as const, filed: "Mar 8, 2026", severity: "medium" as const, description: "Buyer claims 12 units received with damaged packaging. Seller disputes, states packaging was intact at pickup." },
  { id: "DIS-079", parties: "Buyer #3847 vs. TradeFlow", type: "Delivery Delay", amount: "$1,800", status: "resolution" as const, filed: "Mar 3, 2026", severity: "low" as const, description: "Shipment delayed by 3 days due to weather. Buyer requesting partial refund for expedited shipping charges." },
  { id: "DIS-077", parties: "Meridian Corp vs. Carrier", type: "Damaged Goods", amount: "$12,500", status: "escalated" as const, filed: "Feb 28, 2026", severity: "high" as const, description: "Container arrived with water damage. 40 units affected. Insurance claim initiated. Mediation scheduled." },
  { id: "DIS-075", parties: "GreenLeaf vs. Inspector", type: "QC Disagreement", amount: "$0", status: "resolved" as const, filed: "Feb 20, 2026", severity: "low" as const, description: "Seller disputed quality inspection results. Re-inspection confirmed original findings. Case closed." },
  { id: "DIS-073", parties: "BrightStar vs. Buyer #2981", type: "Specification Mismatch", amount: "$3,100", status: "resolved" as const, filed: "Feb 14, 2026", severity: "medium" as const, description: "Product specifications didn't match listing. Full refund issued. Listing corrected." },
];

const severityColor: Record<string, string> = { high: "#E5484D", medium: "#FFB224", low: "#30A46C" };
const disputeStatusConfig: Record<string, { status: "error" | "warning" | "info" | "pending" | "success" | "neutral"; label: string }> = {
  investigating: { status: "warning", label: "Investigating" },
  resolution: { status: "info", label: "In Resolution" },
  escalated: { status: "error", label: "Escalated" },
  resolved: { status: "success", label: "Resolved" },
};

export function LegalDisputes() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? disputes : disputes.filter(d => d.status === filter);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Disputes</h1>
          <p className="text-muted-foreground text-[0.875rem]">Track, mediate, and resolve disputes between parties.</p>
        </div>
        <BounceButton variant="primary" size="md" icon={<Gavel size={16} />}>File Dispute</BounceButton>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Open Disputes" value="3" icon={<AlertTriangle size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={0} accentColor="#FFB224" />
        <StatCard label="Amount at Risk" value="$18.5K" icon={<DollarSign size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={1} accentColor="#E5484D" />
        <StatCard label="Avg Resolution" value="12d" icon={<Clock size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={2} accentColor="#0171E3" subtitle="Target: 14 days" />
        <StatCard label="Resolved (YTD)" value="8" icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={3} accentColor="#30A46C" />
      </motion.div>

      <motion.div variants={stagger.item} className="flex gap-2 flex-wrap">
        {["all", "investigating", "resolution", "escalated", "resolved"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] transition-all cursor-pointer capitalize ${
              filter === s ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >{s === "all" ? "All" : (disputeStatusConfig[s]?.label || s)}</button>
        ))}
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="space-y-3">
            {filtered.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="px-5 py-5 rounded-2xl hover:bg-muted/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor[d.severity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] text-foreground">{d.parties}</span>
                      <span className="text-[0.6875rem] text-muted-foreground/40">{d.id}</span>
                    </div>
                  </div>
                  <span className="text-[0.8125rem] text-foreground/70">{d.amount}</span>
                  <StatusPill
                    status={disputeStatusConfig[d.status]?.status || "neutral"}
                    label={disputeStatusConfig[d.status]?.label || d.status}
                    pulse={d.status === "escalated"}
                  />
                </div>
                <div className="ml-6 flex items-center gap-3">
                  <span className="text-[0.75rem] text-muted-foreground/50">{d.type} · Filed {d.filed}</span>
                </div>
                <p className="ml-6 mt-2 text-[0.75rem] text-muted-foreground/40 leading-relaxed">{d.description}</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  LEGAL → REGULATIONS
// ════════════════════════════════════════════════════════════

const regulations = [
  { id: 1, title: "FDA Labeling Requirements Update", category: "Food Safety", deadline: "Apr 1, 2026", status: "in-progress" as const, impact: "High" as const, description: "Updated nutritional labeling format required for all food products. New allergen declaration format mandated.", assignee: "Sarah Mitchell" },
  { id: 2, title: "GDPR Data Retention Audit — Q1", category: "Data Privacy", deadline: "Mar 31, 2026", status: "in-progress" as const, impact: "High" as const, description: "Quarterly audit of data retention policies. Must verify all user data handling meets GDPR requirements.", assignee: "Legal Team" },
  { id: 3, title: "EPA Sustainable Packaging Standards", category: "Environmental", deadline: "May 15, 2026", status: "planned" as const, impact: "Medium" as const, description: "New packaging material requirements for environmental compliance. Must transition to 80% recyclable materials.", assignee: "Operations" },
  { id: 4, title: "Cross-Border Trade License Renewal", category: "Trade", deadline: "Jun 1, 2026", status: "planned" as const, impact: "High" as const, description: "Annual renewal of cross-border trade licenses for all active trade corridors.", assignee: "James Wu" },
  { id: 5, title: "Worker Safety Recertification", category: "Employment", deadline: "Jul 30, 2026", status: "planned" as const, impact: "Medium" as const, description: "Annual recertification of warehouse and driver safety protocols.", assignee: "HR Department" },
  { id: 6, title: "Anti-Money Laundering Compliance", category: "Financial", deadline: "Mar 25, 2026", status: "complete" as const, impact: "High" as const, description: "Quarterly AML screening of all B2B partners and high-value transactions completed.", assignee: "Compliance Team" },
];

const impactColor: Record<string, string> = { High: "#E5484D", Medium: "#FFB224", Low: "#30A46C" };
const regStatusMap: Record<string, { status: "pending" | "info" | "warning" | "success" | "neutral"; label: string }> = {
  "in-progress": { status: "pending", label: "In Progress" },
  "planned": { status: "info", label: "Planned" },
  "complete": { status: "success", label: "Complete" },
  "overdue": { status: "error", label: "Overdue" },
};

export function LegalRegulations() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Regulations</h1>
        <p className="text-muted-foreground text-[0.875rem]">Regulatory requirements, deadlines, and compliance tracking.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Active Requirements" value="5" icon={<Scale size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        <StatCard label="In Progress" value="2" icon={<Clock size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={1} accentColor="#FFB224" />
        <StatCard label="Completed (YTD)" value="4" icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={2} accentColor="#30A46C" />
        <StatCard label="Next Deadline" value="7d" icon={<Calendar size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" subtitle="Mar 25 — AML" />
      </motion.div>

      {/* Timeline */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Regulatory Timeline</h2>
          <div className="space-y-1">
            {regulations.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="relative px-5 py-5 rounded-2xl hover:bg-muted/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: impactColor[r.impact], backgroundColor: r.status === "complete" ? impactColor[r.impact] : "transparent" }} />
                    {i < regulations.length - 1 && <div className="w-0.5 h-12 bg-border/30 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[0.875rem] text-foreground">{r.title}</span>
                      <span className="text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${impactColor[r.impact]}10`, color: impactColor[r.impact] }}>{r.impact}</span>
                    </div>
                    <p className="text-[0.75rem] text-muted-foreground/40 mb-2 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-4 text-[0.75rem] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><Calendar size={12} />{r.deadline}</span>
                      <span>{r.category}</span>
                      <span>{r.assignee}</span>
                    </div>
                  </div>
                  <StatusPill
                    status={regStatusMap[r.status]?.status || "neutral"}
                    label={regStatusMap[r.status]?.label || r.status}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
