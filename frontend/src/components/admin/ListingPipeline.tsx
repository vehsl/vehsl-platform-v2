"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, ClipboardCheck, Shield, Camera, CheckCircle2,
  ArrowRight, Star, MapPin, Factory, Calendar, User,
  ChevronDown, ChevronRight, X, Upload, Globe, Scale,
  Truck, Eye, ThumbsUp, ThumbsDown, AlertCircle, Sparkles,
  Clock, FileText, MessageCircle, Image as ImageIcon, Boxes,
  CircleCheck, CircleDot, Circle, ChevronLeft, Flag,
  TrendingUp, Zap, Send
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { ProgressRing } from "./ProgressRing";
import { StatCard } from "./StatCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AssignmentCard, AuditTrail, mockWorkers, mockAuditLog } from "./TaskAssignment";
import { CostBreakdownInline } from "./CostLedger";
import type { StageAssignment, AuditEntry } from "./TaskAssignment";
import type { CostBreakdown } from "./CostLedger";

// ─── Types ──────────────────────────────────────────────

type ListingStage = "received" | "sample_pickup" | "quality_testing" | "legal_review" | "photography" | "published";

interface ListingRequest {
  id: string;
  productName: string;
  seller: string;
  sellerLocation: string;
  category: string;
  description: string;
  priceRange: string;
  productionCapacity: string;
  moq: string; // minimum order quantity
  leadTime: string;
  certifications: string[];
  stage: ListingStage;
  submittedDate: string;
  lastUpdated: string;
  image: string;
  qualityScore?: number;
  qualityNotes?: string;
  legalStatus?: "pending" | "approved" | "needs_revision";
  legalMarkets?: string[];
  legalNotes?: string;
  photos?: string[];
  b2bReady: boolean;
  b2cReady: boolean;
  urgency: "normal" | "high" | "urgent";
  // New fields
  assignments?: StageAssignment[];
  auditLog?: AuditEntry[];
  costs?: CostBreakdown;
  costsApplied?: boolean;
}

// ─── Stage Configuration ────────────────────────────────

const stages: { key: ListingStage; label: string; shortLabel: string; icon: React.ReactNode; color: string; description: string }[] = [
  { key: "received", label: "Request Received", shortLabel: "Received", icon: <Package size={18} />, color: "#3B82F6", description: "Review product details & capacity" },
  { key: "sample_pickup", label: "Sample Pickup", shortLabel: "Sample", icon: <Truck size={18} />, color: "#8B5CF6", description: "Collect sample from seller" },
  { key: "quality_testing", label: "Quality Testing", shortLabel: "Quality", icon: <ClipboardCheck size={18} />, color: "#0171E3", description: "Test & rate product quality" },
  { key: "legal_review", label: "Legal Clearance", shortLabel: "Legal", icon: <Scale size={18} />, color: "#D97706", description: "Export & compliance approval" },
  { key: "photography", label: "Photography", shortLabel: "Photos", icon: <Camera size={18} />, color: "#EC4899", description: "Product photography for listing" },
  { key: "published", label: "Published", shortLabel: "Live", icon: <CheckCircle2 size={18} />, color: "#30A46C", description: "Live on marketplace" },
];

const stageIndex = (s: ListingStage) => stages.findIndex((st) => st.key === s);

// ─── Mock Data ──────────────────────────────────────────

const mockListings: ListingRequest[] = [
  {
    id: "LST-1001",
    productName: "Organic Herbal Tea Blend",
    seller: "GreenLeaf Organics",
    sellerLocation: "Kyoto, Japan",
    category: "Food & Beverage",
    description: "Premium blend of chamomile, lavender, and green tea leaves. Sourced from certified organic farms in southern Japan. Hand-picked and naturally dried.",
    priceRange: "$12 – $18 per unit",
    productionCapacity: "5,000 units/month",
    moq: "500 units",
    leadTime: "7–10 days",
    certifications: ["USDA Organic", "JAS Certified", "Fair Trade"],
    stage: "received",
    submittedDate: "Mar 11, 2026",
    lastUpdated: "2 hours ago",
    image: "https://images.unsplash.com/photo-1728977627308-1100ae430cef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwaGVyYmFsJTIwdGVhJTIwcHJvZHVjdCUyMHBhY2thZ2luZ3xlbnwxfHx8fDE3NzM0MDEyMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    b2bReady: true,
    b2cReady: true,
    urgency: "high",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "in-progress" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[1], status: "pending" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[3], status: "pending" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "pending" },
      { stage: "photography", stageLabel: "Photography", assignedWorker: mockWorkers[5], status: "pending" },
      { stage: "published", stageLabel: "Published", status: "pending" },
    ],
    auditLog: mockAuditLog.slice(0, 2),
    costs: { logistics: 85, testing: 120, platform: 50, photography: 40, total: 295 },
    costsApplied: false,
  },
  {
    id: "LST-1002",
    productName: "Industrial HEPA Filters",
    seller: "Meridian Corp",
    sellerLocation: "Shenzhen, China",
    category: "Industrial Equipment",
    description: "High-efficiency particulate air filters for cleanroom and industrial applications. 99.97% filtration efficiency at 0.3 microns.",
    priceRange: "$45 – $120 per unit",
    productionCapacity: "20,000 units/month",
    moq: "1,000 units",
    leadTime: "14–21 days",
    certifications: ["ISO 9001", "CE Marked", "UL Listed"],
    stage: "quality_testing",
    submittedDate: "Mar 5, 2026",
    lastUpdated: "30 min ago",
    image: "https://images.unsplash.com/photo-1731317734838-12da6c9a6139?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZmlsdGVyJTIwbWV0YWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3MzQwMTIxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    qualityScore: 4.2,
    qualityNotes: "Excellent filtration. Minor packaging consistency issue noted.",
    b2bReady: true,
    b2cReady: false,
    urgency: "normal",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "completed", completedDate: "Mar 5, 2026" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[1], status: "completed", completedDate: "Mar 7, 2026" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[3], status: "in-progress", scheduledDate: "Mar 13, 2026" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "pending" },
      { stage: "photography", stageLabel: "Photography", assignedWorker: mockWorkers[5], status: "pending" },
      { stage: "published", stageLabel: "Published", status: "pending" },
    ],
    auditLog: mockAuditLog,
    costs: { logistics: 95, testing: 180, platform: 50, photography: 40, total: 365 },
    costsApplied: true,
  },
  {
    id: "LST-1003",
    productName: "LED Panel B200",
    seller: "BrightStar Electronics",
    sellerLocation: "Taipei, Taiwan",
    category: "Electronics",
    description: "Ultra-thin 200W LED panel for commercial lighting. Dimmable, flicker-free, with 50,000hr rated lifespan. Color temperature 3000K–6500K.",
    priceRange: "$65 – $85 per unit",
    productionCapacity: "15,000 units/month",
    moq: "200 units",
    leadTime: "10–14 days",
    certifications: ["RoHS", "CE", "FCC", "Energy Star"],
    stage: "legal_review",
    submittedDate: "Feb 28, 2026",
    lastUpdated: "1 day ago",
    image: "https://images.unsplash.com/photo-1587569087747-addba755bda6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMRUQlMjBsaWdodCUyMHBhbmVsJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzczNDAxMjE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    qualityScore: 4.7,
    qualityNotes: "Outstanding build quality and light output uniformity.",
    legalStatus: "pending",
    legalNotes: "Awaiting FCC compliance verification for US market.",
    b2bReady: true,
    b2cReady: true,
    urgency: "normal",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "completed", completedDate: "Feb 28, 2026" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[7], status: "completed", completedDate: "Mar 2, 2026" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[4], status: "completed", completedDate: "Mar 6, 2026" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "assigned", scheduledDate: "Mar 10, 2026" },
      { stage: "photography", stageLabel: "Photography", assignedWorker: mockWorkers[5], status: "pending" },
      { stage: "published", stageLabel: "Published", status: "pending" },
    ],
    auditLog: mockAuditLog,
    costs: { logistics: 65, testing: 150, platform: 50, photography: 40, total: 305 },
    costsApplied: true,
  },
  {
    id: "LST-1004",
    productName: "Protein Energy Bars (Variety 24-Pack)",
    seller: "FreshPack Foods",
    sellerLocation: "Auckland, New Zealand",
    category: "Food & Beverage",
    description: "High-protein, low-sugar energy bars in 6 flavors. Made with whey isolate, oats, and natural sweeteners. Gluten-free options available.",
    priceRange: "$28 – $35 per pack",
    productionCapacity: "30,000 packs/month",
    moq: "300 packs",
    leadTime: "5–7 days",
    certifications: ["FDA Registered", "Halal", "Gluten-Free Certified"],
    stage: "photography",
    submittedDate: "Feb 20, 2026",
    lastUpdated: "3 hours ago",
    image: "https://images.unsplash.com/photo-1704650311540-e3b58fa6dc74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwZW5lcmd5JTIwYmFyJTIwZm9vZCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNDAxMjE4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    qualityScore: 4.5,
    legalStatus: "approved",
    legalMarkets: ["US", "Canada", "EU", "UK", "Australia"],
    b2bReady: true,
    b2cReady: true,
    urgency: "urgent",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "completed", completedDate: "Feb 20, 2026" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[1], status: "completed", completedDate: "Feb 22, 2026" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[3], status: "completed", completedDate: "Feb 26, 2026" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "completed", completedDate: "Mar 4, 2026" },
      { stage: "photography", stageLabel: "Photography", assignedWorker: mockWorkers[5], status: "in-progress", scheduledDate: "Mar 13, 2026" },
      { stage: "published", stageLabel: "Published", status: "pending" },
    ],
    auditLog: mockAuditLog,
    costs: { logistics: 45, testing: 200, platform: 50, photography: 40, total: 335 },
    costsApplied: true,
  },
  {
    id: "LST-1005",
    productName: "Carbon Fiber Composite Sheets",
    seller: "Atlas Materials",
    sellerLocation: "Stuttgart, Germany",
    category: "Raw Materials",
    description: "High-strength carbon fiber composite sheets for aerospace and automotive applications. Available in 1mm–5mm thickness. Twill weave pattern.",
    priceRange: "$180 – $450 per sheet",
    productionCapacity: "8,000 sheets/month",
    moq: "50 sheets",
    leadTime: "21–30 days",
    certifications: ["AS9100", "ISO 14001", "REACH Compliant"],
    stage: "sample_pickup",
    submittedDate: "Mar 9, 2026",
    lastUpdated: "5 hours ago",
    image: "https://images.unsplash.com/photo-1593499881934-2a652f450a85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wb3NpdGUlMjBtYXRlcmlhbCUyMHNoZWV0JTIwaW5kdXN0cmlhbHxlbnwxfHx8fDE3NzM0MDEyMTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    b2bReady: true,
    b2cReady: false,
    urgency: "normal",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "completed", completedDate: "Mar 9, 2026" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[1], status: "assigned", scheduledDate: "Mar 13, 2026" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[4], status: "pending" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "pending" },
      { stage: "photography", stageLabel: "Photography", status: "pending" },
      { stage: "published", stageLabel: "Published", status: "pending" },
    ],
    auditLog: mockAuditLog.slice(0, 3),
    costs: { logistics: 220, testing: 350, platform: 75, photography: 40, total: 685 },
    costsApplied: true,
  },
  {
    id: "LST-1006",
    productName: "Artisan Ceramic Dinnerware Set",
    seller: "Terra Clay Studio",
    sellerLocation: "Oaxaca, Mexico",
    category: "Home & Living",
    description: "Hand-crafted ceramic dinnerware set — 4 plates, 4 bowls, 4 mugs. Each piece is unique, glazed with non-toxic mineral glazes. Dishwasher and microwave safe.",
    priceRange: "$85 – $120 per set",
    productionCapacity: "2,000 sets/month",
    moq: "100 sets",
    leadTime: "14–18 days",
    certifications: ["FDA Food Contact", "Lead-Free Certified"],
    stage: "published",
    submittedDate: "Feb 10, 2026",
    lastUpdated: "Published Feb 24",
    image: "https://images.unsplash.com/photo-1767476106226-ff48f2e12286?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNlcmFtaWMlMjBwb3R0ZXJ5JTIwYXJ0aXNhbnxlbnwxfHx8fDE3NzM0MDEyMTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    qualityScore: 4.9,
    legalStatus: "approved",
    legalMarkets: ["US", "Canada", "EU", "UK", "Japan", "Australia"],
    b2bReady: true,
    b2cReady: true,
    urgency: "normal",
    assignments: [
      { stage: "received", stageLabel: "Request Received", assignedWorker: mockWorkers[0], status: "completed", completedDate: "Feb 10, 2026" },
      { stage: "sample_pickup", stageLabel: "Sample Pickup", assignedWorker: mockWorkers[2], status: "completed", completedDate: "Feb 13, 2026" },
      { stage: "quality_testing", stageLabel: "Quality Testing", assignedWorker: mockWorkers[3], status: "completed", completedDate: "Feb 17, 2026" },
      { stage: "legal_review", stageLabel: "Legal Clearance", status: "completed", completedDate: "Feb 20, 2026" },
      { stage: "photography", stageLabel: "Photography", assignedWorker: mockWorkers[5], status: "completed", completedDate: "Feb 23, 2026" },
      { stage: "published", stageLabel: "Published", status: "completed", completedDate: "Feb 24, 2026" },
    ],
    auditLog: mockAuditLog,
    costs: { logistics: 55, testing: 90, platform: 50, photography: 40, total: 235 },
    costsApplied: true,
  },
];

// ─── Helper: Star Rating ────────────────────────────────

function StarRating({ value, onChange, size = 24 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          onClick={() => onChange?.(star)}
          className={`cursor-pointer transition-colors ${
            star <= Math.round(value) ? "text-[#FFB224]" : "text-muted-foreground/20"
          }`}
          whileTap={onChange ? { scale: 1.3 } : {}}
          whileHover={onChange ? { scale: 1.1 } : {}}
          disabled={!onChange}
        >
          <Star size={size} fill={star <= Math.round(value) ? "#FFB224" : "none"} />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Stage Progress Bar ─────────────────────────────────

function StageProgress({ currentStage, compact = false }: { currentStage: ListingStage; compact?: boolean }) {
  const currentIdx = stageIndex(currentStage);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.key} className="contents">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i < currentIdx ? "bg-[#30A46C]" :
                i === currentIdx ? "bg-current" : "bg-muted-foreground/15"
              }`}
              style={i === currentIdx ? { backgroundColor: stage.color } : {}}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {stages.map((stage, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={stage.key} className="contents">
            <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ minWidth: 48 }}>
              <motion.div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isDone ? "bg-[#30A46C]/10 text-[#30A46C]" :
                  isCurrent ? "text-white shadow-lg" : "bg-muted/40 text-muted-foreground/30"
                }`}
                style={isCurrent ? { backgroundColor: stage.color, boxShadow: `0 4px 14px ${stage.color}30` } : {}}
                initial={{ scale: 0.9 }}
                animate={{ scale: isCurrent ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isDone ? <CheckCircle2 size={18} /> : stage.icon}
              </motion.div>
              <span className={`text-[0.625rem] text-center leading-tight ${
                isCurrent ? "text-foreground" : isDone ? "text-[#30A46C]" : "text-muted-foreground/40"
              }`}>
                {stage.shortLabel}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 mt-[-18px] rounded-full overflow-hidden bg-muted/30">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: isDone ? "#30A46C" : isCurrent ? stage.color : "transparent" }}
                  initial={{ width: "0%" }}
                  animate={{ width: isDone ? "100%" : isCurrent ? "50%" : "0%" }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Listing Card (Pipeline View) ───────────────────────

function ListingCard({
  listing,
  onOpen,
}: {
  listing: ListingRequest;
  onOpen: (id: string) => void;
}) {
  const stage = stages[stageIndex(listing.stage)];
  const nextAction = getNextAction(listing.stage);

  return (
    <motion.div
      className="bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-500 overflow-hidden cursor-pointer group"
      onClick={() => onOpen(listing.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      layout
    >
      {/* Urgency indicator */}
      {listing.urgency !== "normal" && (
        <div className={`h-[3px] ${listing.urgency === "urgent" ? "bg-[#E5484D]" : "bg-[#FFB224]"}`} />
      )}

      <div className="p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          {/* Product Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-muted/20">
            <ImageWithFallback
              src={listing.image}
              alt={listing.productName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Core Info — Only what matters */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-foreground tracking-tight truncate">{listing.productName}</h3>
                <p className="text-muted-foreground text-[0.8125rem] mt-0.5 flex items-center gap-1.5">
                  <User size={12} />
                  {listing.seller}
                  <span className="text-muted-foreground/40">·</span>
                  <MapPin size={12} />
                  {listing.sellerLocation}
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-muted-foreground mt-1 transition-colors flex-shrink-0" />
            </div>

            {/* Key facts row — breathing room */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[0.6875rem] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Factory size={10} /> {listing.productionCapacity}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg">
                {listing.priceRange}
              </span>
              {listing.b2bReady && (
                <span className="text-[0.625rem] text-[#3B82F6] bg-[#3B82F6]/6 px-2 py-0.5 rounded-md">B2B</span>
              )}
              {listing.b2cReady && (
                <span className="text-[0.625rem] text-[#30A46C] bg-[#30A46C]/6 px-2 py-0.5 rounded-md">B2C</span>
              )}
            </div>

            {/* Stage + Next Action */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
              <div className="flex items-center gap-2.5">
                <StageProgress currentStage={listing.stage} compact />
                <span className="text-[0.75rem] flex items-center gap-1.5" style={{ color: stage.color }}>
                  {stage.icon}
                  {stage.label}
                </span>
              </div>
              {listing.stage !== "published" && (
                <span className="text-[0.6875rem] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {nextAction} <ArrowRight size={11} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getNextAction(stage: ListingStage): string {
  switch (stage) {
    case "received": return "Review & Accept";
    case "sample_pickup": return "Schedule Pickup";
    case "quality_testing": return "Rate Quality";
    case "legal_review": return "Check Status";
    case "photography": return "Upload Photos";
    case "published": return "View Listing";
  }
}

// ─── Listing Detail View ────────────────────────────────

function ListingDetail({
  listing: initialListing,
  onClose,
  onAdvance,
}: {
  listing: ListingRequest;
  onClose: () => void;
  onAdvance: (id: string) => void;
}) {
  const [listing, setListing] = useState(initialListing);
  const [qualityRating, setQualityRating] = useState(listing.qualityScore || 0);
  const [qualityNotes, setQualityNotes] = useState(listing.qualityNotes || "");
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  const currentStageObj = stages[stageIndex(listing.stage)];
  const currentIdx = stageIndex(listing.stage);

  const handleAdvance = () => {
    onAdvance(listing.id);
    setShowAdvanceConfirm(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/15 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Detail Panel */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[680px] bg-background overflow-y-auto shadow-2xl"
        initial={{ x: 680 }}
        animate={{ x: 0 }}
        exit={{ x: 680 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <div>
                <p className="text-[0.75rem] text-muted-foreground">{listing.id}</p>
                <h2 className="text-foreground tracking-tight">{listing.productName}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Hero Image + Stage Progress */}
          <div>
            <div className="w-full h-[200px] rounded-3xl overflow-hidden bg-muted/20 mb-6">
              <ImageWithFallback
                src={listing.image}
                alt={listing.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <StageProgress currentStage={listing.stage} />
          </div>

          {/* Current Stage Action Card — THE focal point */}
          {listing.stage !== "published" && (
            <motion.div
              className="rounded-3xl p-6 border-2 relative overflow-hidden"
              style={{ borderColor: `${currentStageObj.color}20`, background: `${currentStageObj.color}03` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: currentStageObj.color }} />

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: currentStageObj.color }}>
                  {currentStageObj.icon}
                </div>
                <div>
                  <p className="text-[0.875rem] text-foreground">{currentStageObj.label}</p>
                  <p className="text-[0.6875rem] text-muted-foreground">{currentStageObj.description}</p>
                </div>
              </div>

              {/* Stage-specific content */}
              {listing.stage === "received" && (
                <div className="space-y-4">
                  <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
                    Review the product details below. If everything looks good, accept this listing to schedule a sample pickup from the seller.
                  </p>
                  <div className="flex gap-2">
                    <BounceButton variant="primary" size="md" icon={<ThumbsUp size={16} />} onClick={() => setShowAdvanceConfirm(true)} energyWeight={3}>
                      Accept & Schedule Pickup
                    </BounceButton>
                    <BounceButton variant="secondary" size="md" icon={<MessageCircle size={16} />}>
                      Ask Seller
                    </BounceButton>
                  </div>
                </div>
              )}

              {listing.stage === "sample_pickup" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/20">
                    <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-[0.8125rem] text-foreground">Pickup from: {listing.seller}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{listing.sellerLocation}</p>
                    </div>
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
                    Assign a driver to collect the product sample. The seller has been notified and the sample is being prepared.
                  </p>
                  <div className="flex gap-2">
                    <BounceButton variant="primary" size="md" icon={<Truck size={16} />} onClick={() => setShowAdvanceConfirm(true)} energyWeight={2}>
                      Confirm Sample Collected
                    </BounceButton>
                    <BounceButton variant="secondary" size="md" icon={<Calendar size={16} />}>
                      Reschedule
                    </BounceButton>
                  </div>
                </div>
              )}

              {listing.stage === "quality_testing" && (
                <div className="space-y-5">
                  <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
                    Test the sample and provide your quality assessment. This rating determines if the product meets our marketplace standards.
                  </p>

                  {/* Rating */}
                  <div className="space-y-3">
                    <label className="text-[0.8125rem] text-foreground">Quality Rating</label>
                    <div className="flex items-center gap-4">
                      <StarRating value={qualityRating} onChange={setQualityRating} size={28} />
                      {qualityRating > 0 && (
                        <motion.span
                          className="text-[1.25rem] text-foreground"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          {qualityRating}.0
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-[0.8125rem] text-foreground">Notes</label>
                    <textarea
                      value={qualityNotes}
                      onChange={(e) => setQualityNotes(e.target.value)}
                      placeholder="What did you observe? Any concerns or highlights..."
                      className="w-full h-24 px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/50 resize-none outline-none focus:border-primary/30 focus:shadow-[0_0_0_3px_rgba(1,113,227,0.08)] transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <BounceButton
                      variant="primary"
                      size="md"
                      icon={<Send size={16} />}
                      onClick={() => setShowAdvanceConfirm(true)}
                      energyWeight={3}
                    >
                      Submit & Send to Legal
                    </BounceButton>
                    <BounceButton variant="secondary" size="md" icon={<ThumbsDown size={16} />}>
                      Reject Sample
                    </BounceButton>
                  </div>
                </div>
              )}

              {listing.stage === "legal_review" && (
                <div className="space-y-4">
                  {listing.legalStatus === "pending" && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#D97706]/5 border border-[#D97706]/10">
                        <Clock size={18} className="text-[#D97706] flex-shrink-0" />
                        <div>
                          <p className="text-[0.8125rem] text-foreground">Waiting for Legal Department</p>
                          <p className="text-[0.6875rem] text-muted-foreground">Sent for review on Mar 10, 2026 · Usually takes 1–2 business days</p>
                        </div>
                      </div>
                      {listing.legalNotes && (
                        <div className="p-3.5 rounded-2xl bg-muted/20">
                          <p className="text-[0.6875rem] text-muted-foreground mb-1">Legal Note</p>
                          <p className="text-[0.8125rem] text-foreground">{listing.legalNotes}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <BounceButton variant="secondary" size="md" icon={<MessageCircle size={16} />}>
                          Message Legal Team
                        </BounceButton>
                      </div>
                    </>
                  )}
                  {listing.legalStatus === "approved" && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#30A46C]/5 border border-[#30A46C]/10">
                        <CheckCircle2 size={18} className="text-[#30A46C] flex-shrink-0" />
                        <div>
                          <p className="text-[0.8125rem] text-foreground">Approved by Legal</p>
                          <p className="text-[0.6875rem] text-muted-foreground">
                            Cleared for export to: {listing.legalMarkets?.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <BounceButton variant="primary" size="md" icon={<Camera size={16} />} onClick={() => setShowAdvanceConfirm(true)} energyWeight={3}>
                          Proceed to Photography
                        </BounceButton>
                      </div>
                    </>
                  )}
                </div>
              )}

              {listing.stage === "photography" && (
                <div className="space-y-4">
                  <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
                    Upload product photographs for the marketplace listing. Aim for clean, well-lit images showing the product from multiple angles.
                  </p>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-primary/30 hover:bg-primary/2 transition-all cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                      <Upload size={24} className="text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-[0.8125rem] text-foreground">Drop photos here or click to browse</p>
                      <p className="text-[0.6875rem] text-muted-foreground mt-0.5">JPG, PNG up to 10MB · Recommended: 2000×2000px</p>
                    </div>
                  </div>

                  {/* Mock uploaded photos */}
                  <div className="grid grid-cols-3 gap-3">
                    {[listing.image].map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-muted/20 relative group/img">
                        <ImageWithFallback src={img} alt="Product" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-border/30 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors">
                      <Camera size={20} className="text-muted-foreground/30" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <BounceButton variant="primary" size="md" icon={<Sparkles size={16} />} onClick={() => setShowAdvanceConfirm(true)} energyWeight={5}>
                      Publish Listing
                    </BounceButton>
                    <BounceButton variant="secondary" size="md" icon={<Eye size={16} />}>
                      Preview
                    </BounceButton>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Published Success */}
          {listing.stage === "published" && (
            <motion.div
              className="rounded-3xl p-8 bg-[#30A46C]/5 border border-[#30A46C]/15 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#30A46C]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#30A46C]" />
              </div>
              <h3 className="text-foreground tracking-tight mb-1">Live on Marketplace</h3>
              <p className="text-muted-foreground text-[0.8125rem] mb-4">
                This product is published and available to buyers.
              </p>
              {listing.legalMarkets && (
                <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
                  <Globe size={14} className="text-[#30A46C]" />
                  {listing.legalMarkets.map((m) => (
                    <span key={m} className="text-[0.6875rem] text-[#30A46C] bg-[#30A46C]/8 px-2.5 py-1 rounded-full">{m}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-center gap-2">
                <BounceButton variant="success" size="md" icon={<Eye size={16} />}>View Live Listing</BounceButton>
                <BounceButton variant="secondary" size="md" icon={<TrendingUp size={16} />}>Analytics</BounceButton>
              </div>
            </motion.div>
          )}

          {/* Product Details — Always visible, quieter hierarchy */}
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
                <Package size={16} className="text-muted-foreground" />
                Product Details
              </h3>
              <p className="text-[0.8125rem] text-muted-foreground leading-relaxed mb-5">{listing.description}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Category", value: listing.category },
                  { label: "Price Range", value: listing.priceRange },
                  { label: "Production Capacity", value: listing.productionCapacity },
                  { label: "Min. Order Qty", value: listing.moq },
                  { label: "Lead Time", value: listing.leadTime },
                  { label: "Submitted", value: listing.submittedDate },
                ].map((item) => (
                  <div key={item.label} className="p-3.5 rounded-2xl bg-muted/15">
                    <p className="text-[0.6875rem] text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-[0.8125rem] text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield size={14} />
                Certifications
              </h4>
              <div className="flex flex-wrap gap-2">
                {listing.certifications.map((cert) => (
                  <span key={cert} className="text-[0.75rem] text-foreground bg-muted/25 px-3 py-1.5 rounded-xl border border-border/20">
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Market Readiness */}
            <div>
              <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
                <Globe size={14} />
                Market Readiness
              </h4>
              <div className="flex gap-3">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[0.8125rem] ${listing.b2bReady ? "bg-[#3B82F6]/6 text-[#3B82F6]" : "bg-muted/20 text-muted-foreground"}`}>
                  <Boxes size={15} />
                  B2B {listing.b2bReady ? "Ready" : "Not Applicable"}
                </div>
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[0.8125rem] ${listing.b2cReady ? "bg-[#30A46C]/6 text-[#30A46C]" : "bg-muted/20 text-muted-foreground"}`}>
                  <User size={15} />
                  B2C {listing.b2cReady ? "Ready" : "Not Applicable"}
                </div>
              </div>
            </div>

            {/* Quality Results (if exists) */}
            {listing.qualityScore && (
              <div>
                <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ClipboardCheck size={14} />
                  Quality Assessment
                </h4>
                <div className="p-4 rounded-2xl bg-muted/15 space-y-2">
                  <div className="flex items-center gap-3">
                    <StarRating value={listing.qualityScore} size={18} />
                    <span className="text-[0.9375rem] text-foreground">{listing.qualityScore}</span>
                  </div>
                  {listing.qualityNotes && (
                    <p className="text-[0.8125rem] text-muted-foreground">{listing.qualityNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Seller */}
            <div className="p-4 rounded-2xl bg-muted/10 border border-border/20 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[0.6875rem] flex-shrink-0">
                {listing.seller.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-[0.875rem] text-foreground">{listing.seller}</p>
                <p className="text-[0.75rem] text-muted-foreground flex items-center gap-1">
                  <MapPin size={11} /> {listing.sellerLocation}
                </p>
              </div>
              <BounceButton variant="ghost" size="sm" icon={<MessageCircle size={14} />}>
                Contact
              </BounceButton>
            </div>

            {/* Task Assignments — who handles each stage */}
            {listing.assignments && listing.assignments.length > 0 && (
              <div>
                <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  Task Assignments
                </h3>
                <div className="space-y-3">
                  {listing.assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.stage}
                      assignment={assignment}
                      canReassign={true}
                      workers={mockWorkers}
                      onReassign={(stage, worker) => {
                        // In a real app this would update state and create audit entry
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cost Breakdown — deducted from seller */}
            {listing.costs && (
              <div>
                <h3 className="text-foreground tracking-tight mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  Service Costs
                </h3>
                <div className={`p-4 rounded-2xl border ${
                  listing.costsApplied
                    ? "border-[#30A46C]/15 bg-[#30A46C]/3"
                    : "border-[#FFB224]/15 bg-[#FFB224]/3"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[0.75rem] text-muted-foreground">
                      {listing.costsApplied ? "Deducted on sample pickup acceptance" : "Will be deducted upon sample acceptance"}
                    </span>
                    <StatusPill
                      status={listing.costsApplied ? "success" : "warning"}
                      label={listing.costsApplied ? "Applied" : "Pending"}
                    />
                  </div>
                  <CostBreakdownInline costs={listing.costs} />
                </div>
              </div>
            )}

            {/* Audit Trail — full history of changes */}
            {listing.auditLog && listing.auditLog.length > 0 && (
              <div>
                <AuditTrail entries={listing.auditLog} />
              </div>
            )}
          </div>
        </div>

        {/* Advance Confirmation */}
        <AnimatePresence>
          {showAdvanceConfirm && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/20" onClick={() => setShowAdvanceConfirm(false)} />
              <motion.div
                className="relative bg-card rounded-3xl p-8 max-w-sm mx-4 shadow-2xl text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: currentStageObj.color }}>
                  {currentStageObj.icon}
                </div>
                <h3 className="text-foreground tracking-tight mb-2">Move to Next Stage?</h3>
                <p className="text-muted-foreground text-[0.8125rem] mb-6">
                  This will advance the listing from <strong>{currentStageObj.label}</strong> to <strong>{stages[currentIdx + 1]?.label}</strong>.
                </p>
                <div className="flex gap-2 justify-center">
                  <BounceButton variant="secondary" size="md" onClick={() => setShowAdvanceConfirm(false)}>Cancel</BounceButton>
                  <BounceButton variant="primary" size="md" icon={<ArrowRight size={16} />} onClick={handleAdvance} energyWeight={5}>
                    Confirm
                  </BounceButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Pipeline Component ────────────────────────────

export function ListingPipeline() {
  const [listings, setListings] = useState(mockListings);
  const [openListingId, setOpenListingId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<ListingStage | "all">("all");

  const openListing = listings.find((l) => l.id === openListingId);

  const filteredListings = filterStage === "all"
    ? listings
    : listings.filter((l) => l.stage === filterStage);

  const stageCounts = stages.map((s) => ({
    ...s,
    count: listings.filter((l) => l.stage === s.key).length,
  }));

  const handleAdvance = useCallback((id: string) => {
    setListings((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = stageIndex(l.stage);
        if (idx >= stages.length - 1) return l;
        const nextStage = stages[idx + 1].key;
        return { ...l, stage: nextStage, lastUpdated: "Just now" };
      })
    );
    setOpenListingId(null);
  }, []);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Listing Requests</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Products from sellers, moving through review, testing, approval, and publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="secondary" size="sm" icon={<Clock size={15} />}>
            {listings.filter(l => l.urgency !== "normal").length} Need Attention
          </BounceButton>
        </div>
      </div>

      {/* Stage Overview — visual pipeline counts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stageCounts.map((stage) => (
          <motion.button
            key={stage.key}
            onClick={() => setFilterStage(filterStage === stage.key ? "all" : stage.key)}
            className={`p-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
              filterStage === stage.key
                ? "border-current shadow-md"
                : filterStage === "all"
                ? "border-border/30 hover:border-border/60 bg-card"
                : "border-border/20 bg-card opacity-50 hover:opacity-80"
            }`}
            style={filterStage === stage.key ? { borderColor: stage.color, background: `${stage.color}05` } : {}}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex justify-center mb-2" style={{ color: stage.color }}>
              {stage.icon}
            </div>
            <p className="text-[1.25rem] text-foreground tracking-tight">{stage.count}</p>
            <p className="text-[0.625rem] text-muted-foreground mt-0.5">{stage.shortLabel}</p>
          </motion.button>
        ))}
      </div>

      {/* Filter indicator */}
      {filterStage !== "all" && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[0.8125rem] text-muted-foreground">
            Showing: <span className="text-foreground">{stages.find(s => s.key === filterStage)?.label}</span>
          </span>
          <button
            onClick={() => setFilterStage("all")}
            className="text-[0.75rem] text-primary hover:underline cursor-pointer"
          >
            Show all
          </button>
        </motion.div>
      )}

      {/* Listing Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.04 }}
              layout
            >
              <ListingCard
                listing={listing}
                onOpen={setOpenListingId}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-[0.875rem]">No listings in this stage</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {openListing && (
          <ListingDetail
            listing={openListing}
            onClose={() => setOpenListingId(null)}
            onAdvance={handleAdvance}
          />
        )}
      </AnimatePresence>
    </div>
  );
}