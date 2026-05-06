"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, Camera, Send, CheckCircle2, Clock, User,
  ChevronRight, Image as ImageIcon, MessageCircle, X,
  Package, Eye, Plus, Flag, Lightbulb, ArrowRight,
  ChevronLeft, Upload, FileText, ThumbsUp, ThumbsDown, Phone,
  MapPin
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { StatCard } from "./StatCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Types ──────────────────────────────────────────────

interface IssuePhoto {
  id: string;
  url: string;
  caption: string;
  type: "issue" | "suggestion";
}

interface QualityIssue {
  id: string;
  listingId: string;
  productName: string;
  seller: string;
  sellerCity: string;
  sellerCountry: string;
  countryFlag: string;
  inspector: string;
  inspectorAvatar: string;
  severity: "critical" | "major" | "minor" | "observation";
  category: string;
  title: string;
  description: string;
  issuePhotos: IssuePhoto[];
  suggestionPhotos: IssuePhoto[];
  status: "draft" | "sent" | "acknowledged" | "resolved" | "disputed";
  createdAt: string;
  sentAt?: string;
  sellerResponse?: string;
  resolvedAt?: string;
}

// ─── Mock Issue Photos (using unsplash) ─────────────────

const mockIssues: QualityIssue[] = [
  {
    id: "QI-001",
    listingId: "LST-1002",
    productName: "Industrial HEPA Filters",
    seller: "Meridian Corp",
    sellerCity: "Shenzhen",
    sellerCountry: "China",
    countryFlag: "🇨🇳",
    inspector: "Priya Sharma",
    inspectorAvatar: "PS",
    severity: "major",
    category: "Packaging Inconsistency",
    title: "Uneven seal on 12% of filter units",
    description: "During inspection of Batch #2847, we found that approximately 12% of the HEPA filter units have inconsistent heat seals on the outer packaging. This could compromise the filter integrity during transit and storage. The seal pressure appears to be uneven on the left side of the packaging line.",
    issuePhotos: [
      { id: "IP-1", url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop", caption: "Uneven seal visible on left edge", type: "issue" },
      { id: "IP-2", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", caption: "Close-up of gap in heat seal", type: "issue" },
    ],
    suggestionPhotos: [
      { id: "SP-1", url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=300&fit=crop", caption: "Reference: correct seal standard", type: "suggestion" },
    ],
    status: "sent",
    createdAt: "Mar 12, 2026 · 2:30 PM",
    sentAt: "Mar 12, 2026 · 3:00 PM",
    sellerResponse: "We acknowledge the issue. Our packaging line has been recalibrated. Will send corrected samples within 48 hours.",
  },
  {
    id: "QI-002",
    listingId: "LST-1004",
    productName: "Protein Energy Bars (Variety 24-Pack)",
    seller: "FreshPack Foods",
    sellerCity: "Auckland",
    sellerCountry: "New Zealand",
    countryFlag: "🇳🇿",
    inspector: "James Liu",
    inspectorAvatar: "JL",
    severity: "minor",
    category: "Labeling",
    title: "Nutritional info font size below FDA minimum",
    description: "The nutritional information panel on the Chocolate Peanut Butter variant uses 5pt font instead of the required 6pt minimum for FDA compliance. All other variants meet the standard. This needs correction before US market approval.",
    issuePhotos: [
      { id: "IP-3", url: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop", caption: "Current label - font too small", type: "issue" },
    ],
    suggestionPhotos: [
      { id: "SP-2", url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop", caption: "Suggested: corrected label layout", type: "suggestion" },
    ],
    status: "acknowledged",
    createdAt: "Mar 11, 2026 · 10:00 AM",
    sentAt: "Mar 11, 2026 · 10:30 AM",
  },
  {
    id: "QI-003",
    listingId: "LST-1001",
    productName: "Organic Herbal Tea Blend",
    seller: "GreenLeaf Organics",
    sellerCity: "Kyoto",
    sellerCountry: "Japan",
    countryFlag: "🇯🇵",
    inspector: "Priya Sharma",
    inspectorAvatar: "PS",
    severity: "observation",
    category: "Product Appearance",
    title: "Slight color variation between batches",
    description: "Observed a slight color difference between Batch #284 and Batch #285 of the chamomile blend. This is within acceptable natural variation range but worth noting for quality consistency tracking.",
    issuePhotos: [
      { id: "IP-4", url: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop", caption: "Batch #284 - slightly darker", type: "issue" },
      { id: "IP-5", url: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=300&fit=crop", caption: "Batch #285 - standard shade", type: "issue" },
    ],
    suggestionPhotos: [],
    status: "resolved",
    createdAt: "Mar 10, 2026 · 4:00 PM",
    sentAt: "Mar 10, 2026 · 4:15 PM",
    resolvedAt: "Mar 11, 2026 · 9:00 AM",
    sellerResponse: "Thank you for the observation. This is due to seasonal variation in chamomile harvest. We will include a batch note for buyers.",
  },
  {
    id: "QI-004",
    listingId: "LST-1003",
    productName: "LED Panel B200",
    seller: "BrightStar Electronics",
    sellerCity: "Taipei",
    sellerCountry: "Taiwan",
    countryFlag: "🇹🇼",
    inspector: "James Liu",
    inspectorAvatar: "JL",
    severity: "critical",
    category: "Safety",
    title: "Potential overheating at max brightness after 6hr test",
    description: "During extended 6-hour burn test at maximum brightness (6500K), unit #3 of 5 tested exceeded safe temperature threshold by 8 degrees Celsius. Thermal paste application appears inconsistent. This is a safety concern that must be addressed before any market listing.",
    issuePhotos: [
      { id: "IP-6", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", caption: "Thermal imaging showing hotspot", type: "issue" },
      { id: "IP-7", url: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=400&h=300&fit=crop", caption: "Inconsistent thermal paste application", type: "issue" },
    ],
    suggestionPhotos: [
      { id: "SP-3", url: "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400&h=300&fit=crop", caption: "Correct thermal paste coverage", type: "suggestion" },
      { id: "SP-4", url: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=400&h=300&fit=crop", caption: "Recommended heat sink upgrade", type: "suggestion" },
    ],
    status: "sent",
    createdAt: "Mar 13, 2026 · 9:00 AM",
    sentAt: "Mar 13, 2026 · 9:15 AM",
  },
];

// ─── Severity Config ────────────────────────────────────

const severityConfig = {
  critical: { color: "#E5484D", bg: "bg-[#E5484D]/8", label: "Critical", icon: <AlertTriangle size={14} /> },
  major: { color: "#D97706", bg: "bg-[#D97706]/8", label: "Major", icon: <Flag size={14} /> },
  minor: { color: "#3B82F6", bg: "bg-[#3B82F6]/8", label: "Minor", icon: <Flag size={14} /> },
  observation: { color: "#7A7D80", bg: "bg-muted/30", label: "Observation", icon: <Eye size={14} /> },
};

// ─── Issue Detail Panel ─────────────────────────────────

function IssueDetail({ issue, onClose }: { issue: QualityIssue; onClose: () => void }) {
  const sev = severityConfig[issue.severity];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[640px] bg-background overflow-y-auto shadow-2xl"
        initial={{ x: 640 }}
        animate={{ x: 0 }}
        exit={{ x: 640 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <div>
                <p className="text-[0.6875rem] text-muted-foreground">{issue.id} · {issue.listingId}</p>
                <h3 className="text-foreground tracking-tight">{issue.title}</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Severity + Status */}
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] ${sev.bg}`} style={{ color: sev.color }}>
              {sev.icon}
              {sev.label}
            </span>
            <StatusPill
              status={
                issue.status === "resolved" ? "success" :
                issue.status === "sent" ? "info" :
                issue.status === "acknowledged" ? "pending" :
                issue.status === "disputed" ? "error" : "neutral"
              }
              label={issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
            />
          </div>

          {/* Product & Inspector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-1">Product</p>
              <p className="text-[0.8125rem] text-foreground">{issue.productName}</p>
              <p className="text-[0.6875rem] text-muted-foreground">{issue.seller}</p>
              <p className="text-[0.6875rem] text-muted-foreground flex items-center gap-1 mt-1">
                <span>{issue.countryFlag}</span>
                <MapPin size={10} />
                {issue.sellerCity}, {issue.sellerCountry}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground mb-1">Inspector</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[0.5625rem]">
                  {issue.inspectorAvatar}
                </div>
                <p className="text-[0.8125rem] text-foreground">{issue.inspector}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[0.8125rem] text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileText size={14} />
              Description
            </h4>
            <p className="text-[0.8125rem] text-foreground leading-relaxed">{issue.description}</p>
          </div>

          {/* Issue Photos */}
          {issue.issuePhotos.length > 0 && (
            <div>
              <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[#E5484D]" />
                Issue Photos ({issue.issuePhotos.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {issue.issuePhotos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted/20 border-2 border-[#E5484D]/15">
                      <ImageWithFallback src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[0.6875rem] text-muted-foreground mt-1.5 leading-snug">{photo.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestion Photos */}
          {issue.suggestionPhotos.length > 0 && (
            <div>
              <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-[#30A46C]" />
                Suggestions ({issue.suggestionPhotos.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {issue.suggestionPhotos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted/20 border-2 border-[#30A46C]/15">
                      <ImageWithFallback src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[0.6875rem] text-muted-foreground mt-1.5 leading-snug">{photo.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Response */}
          {issue.sellerResponse && (
            <div className="p-4 rounded-2xl bg-primary/3 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={14} className="text-primary" />
                <span className="text-[0.75rem] text-primary">Seller Response</span>
              </div>
              <p className="text-[0.8125rem] text-foreground leading-relaxed">{issue.sellerResponse}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="text-[0.8125rem] text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock size={14} />
              Timeline
            </h4>
            <div className="space-y-1 text-[0.75rem]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                Created: {issue.createdAt}
              </div>
              {issue.sentAt && (
                <div className="flex items-center gap-2 text-[#3B82F6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  Sent to seller: {issue.sentAt}
                </div>
              )}
              {issue.resolvedAt && (
                <div className="flex items-center gap-2 text-[#30A46C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C]" />
                  Resolved: {issue.resolvedAt}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {issue.status === "draft" && (
              <BounceButton variant="primary" size="md" icon={<Send size={16} />} energyWeight={3}>
                Send to Seller
              </BounceButton>
            )}
            {issue.status === "sent" && (
              <>
                <BounceButton variant="secondary" size="md" icon={<MessageCircle size={16} />}>
                  Follow Up
                </BounceButton>
                <BounceButton variant="ghost" size="md" icon={<Phone size={16} />}>
                  Call Seller
                </BounceButton>
              </>
            )}
            {(issue.status === "acknowledged" || issue.status === "sent") && (
              <BounceButton variant="success" size="md" icon={<CheckCircle2 size={16} />} energyWeight={3}>
                Mark Resolved
              </BounceButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Quality Issues Page ───────────────────────────

export function QualityIssues() {
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "major" | "minor" | "observation">("all");

  const filtered = filterSeverity === "all" ? mockIssues : mockIssues.filter(i => i.severity === filterSeverity);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Quality Issues</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Document, photograph, and communicate quality issues with sellers.
          </p>
        </div>
        <BounceButton variant="primary" size="sm" icon={<Plus size={15} />} energyWeight={2}>
          Report Issue
        </BounceButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Open Issues"
          value={mockIssues.filter(i => i.status !== "resolved").length.toString()}
          icon={<AlertTriangle size={20} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/8"
          index={0}
          subtitle="Awaiting resolution"
          accentColor="#E5484D"
          sparklineData={[5, 6, 4, 5, 3, 4, 3]}
          sparklineColor="#E5484D"
        />
        <StatCard
          label="Critical"
          value={mockIssues.filter(i => i.severity === "critical").length.toString()}
          change="Needs immediate action"
          changeType="negative"
          icon={<Flag size={20} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/8"
          index={1}
          accentColor="#E5484D"
        />
        <StatCard
          label="Resolved"
          value={mockIssues.filter(i => i.status === "resolved").length.toString()}
          change="This week"
          changeType="positive"
          icon={<CheckCircle2 size={22} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={2}
        />
        <StatCard
          label="Avg. Resolution"
          value="1.2d"
          change="-0.3d vs last month"
          changeType="positive"
          icon={<Clock size={22} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={3}
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "critical", "major", "minor", "observation"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.8125rem] transition-all cursor-pointer capitalize ${
              filterSeverity === sev
                ? sev === "all" ? "bg-primary/8 text-primary" : `${severityConfig[sev as keyof typeof severityConfig]?.bg} text-foreground`
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {sev !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: severityConfig[sev as keyof typeof severityConfig]?.color }} />}
            {sev === "all" ? "All Issues" : sev}
          </button>
        ))}
      </div>

      {/* Issue Cards */}
      <div className="space-y-4">
        {filtered.map((issue, i) => {
          const sev = severityConfig[issue.severity];
          return (
            <motion.div
              key={issue.id}
              className="bg-card rounded-2xl border border-border/30 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedIssue(issue)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -1 }}
            >
              {/* Severity bar */}
              <div className="h-[3px]" style={{ background: sev.color }} />

              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Issue Photo Preview */}
                  {issue.issuePhotos.length > 0 && (
                    <div className="w-full sm:w-24 h-20 sm:h-18 rounded-xl overflow-hidden bg-muted/20 flex-shrink-0">
                      <ImageWithFallback
                        src={issue.issuePhotos[0].url}
                        alt="Issue"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[0.6875rem] text-muted-foreground">{issue.id}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] ${sev.bg}`} style={{ color: sev.color }}>
                            {sev.icon}
                            {sev.label}
                          </span>
                        </div>
                        <h3 className="text-foreground tracking-tight">{issue.title}</h3>
                        <p className="text-[0.8125rem] text-muted-foreground mt-0.5">{issue.productName} · {issue.seller}</p>
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span>{issue.countryFlag}</span>
                          <MapPin size={10} />
                          {issue.sellerCity}, {issue.sellerCountry}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                        <Camera size={11} />
                        {issue.issuePhotos.length} issue photos
                      </div>
                      {issue.suggestionPhotos.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[0.6875rem] text-[#30A46C]">
                          <Lightbulb size={11} />
                          {issue.suggestionPhotos.length} suggestions
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                        <User size={11} />
                        {issue.inspector}
                      </div>
                      <StatusPill
                        status={
                          issue.status === "resolved" ? "success" :
                          issue.status === "sent" ? "info" :
                          issue.status === "acknowledged" ? "pending" :
                          issue.status === "disputed" ? "error" : "neutral"
                        }
                        label={issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        pulse={issue.severity === "critical" && issue.status !== "resolved"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetail issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}