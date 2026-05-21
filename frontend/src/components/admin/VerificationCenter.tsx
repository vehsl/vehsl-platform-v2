"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, CheckCircle2, Clock, User, AlertCircle,
  ChevronRight, X, FileText, Camera, Eye,
  Fingerprint, CreditCard, Building2, Truck as TruckIcon,
  Upload, ThumbsUp, ThumbsDown, ChevronLeft,
  UserCheck, Users, Star, MapPin, Calendar, Lock
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { StatCard } from "./StatCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Types ──────────────────────────────────────────────

type UserType = "buyer" | "seller";
type DocType =
  | "passport"
  | "driving_license"
  | "id_card"
  | "bank_statement"
  | "utility_bill"
  | "business_license"
  | "business_registration"
  | "factory_ownership";
type VerificationStatus = "pending" | "verified" | "rejected" | "expired" | "under_review";

interface Document {
  id: string;
  type: DocType;
  label: string;
  status: VerificationStatus;
  originalName?: string;
  contentType?: string;
  uploadedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  imageUrl: string;
}

interface BiometricRecord {
  type: "fingerprint" | "face_id" | "voice";
  status: VerificationStatus;
  enrolledAt?: string;
  lastVerified?: string;
  matchScore?: number;
}

interface VerificationProfile {
  id: string | number;
  name: string;
  avatar: string;
  type: UserType;
  companyName?: string;
  location: string;
  email: string;
  phone: string;
  overallStatus: VerificationStatus;
  kycLevel: number; // 1-3
  documents: Document[];
  biometrics: BiometricRecord[];
  joinedAt: string;
  lastActive: string;
  trustScore: number; // 0-100
}

// ─── Release Condition Types ────────────────────────────

type ReleaseConditionType = "inspection" | "lab_test" | "certification" | "documentation" | "photo_proof" | "custom";
type ReleaseConditionStatus = "pending" | "in_progress" | "satisfied" | "waived" | "failed";

interface ReleaseCondition {
  id: string | number;
  type: ReleaseConditionType;
  title: string;
  description: string;
  status: ReleaseConditionStatus;
  requiredBy: string;
  orderRef: string;
  dueDate: string;
  satisfiedAt?: string;
  satisfiedBy?: string;
  proofDocs: { name: string; size: string; uploadedAt: string }[];
  notes?: string;
  priority: "critical" | "required" | "optional";
}

interface BuyerReleaseOrder {
  id: string | number;
  orderRef: string;
  buyerName: string;
  buyerAvatar: string;
  buyerCountry: string;
  buyerCountryCode: string;
  productName: string;
  hsCode: string;
  quantity: number;
  conditions: ReleaseCondition[];
  overallStatus: "blocked" | "partial" | "cleared" | "released";
  createdAt: string;
}

const releaseConditionConfig: Record<ReleaseConditionType, { icon: React.ReactNode; label: string; color: string }> = {
  inspection: { icon: <Eye size={14} />, label: "Inspection", color: "#0171E3" },
  lab_test: { icon: <Shield size={14} />, label: "Lab Test", color: "#8B5CF6" },
  certification: { icon: <CheckCircle2 size={14} />, label: "Certification", color: "#30A46C" },
  documentation: { icon: <FileText size={14} />, label: "Documentation", color: "#3B82F6" },
  photo_proof: { icon: <Camera size={14} />, label: "Photo Proof", color: "#D97706" },
  custom: { icon: <AlertCircle size={14} />, label: "Custom", color: "#E5484D" },
};

const releasePriorityConfig = {
  critical: { color: "#E5484D", bg: "bg-[#E5484D]/6", label: "Critical" },
  required: { color: "#FFB224", bg: "bg-[#FFB224]/6", label: "Required" },
  optional: { color: "#30A46C", bg: "bg-[#30A46C]/6", label: "Optional" },
};

const mockReleaseOrders: BuyerReleaseOrder[] = [
  {
    id: "REL-001", orderRef: "ORD-4821", buyerName: "David Chen", buyerAvatar: "DC",
    buyerCountry: "United States", buyerCountryCode: "us",
    productName: "Wireless Bluetooth Headphones", hsCode: "8518.30.20", quantity: 500,
    overallStatus: "partial", createdAt: "Mar 14, 2026",
    conditions: [
      { id: "RC-001", type: "lab_test", title: "FCC Electromagnetic Compatibility Test", description: "Product must pass FCC Part 15 EMC testing. Submit full test report from an accredited lab.", status: "satisfied", requiredBy: "David Chen", orderRef: "ORD-4821", dueDate: "Mar 20", satisfiedAt: "Mar 16", satisfiedBy: "SGS Testing Lab", proofDocs: [{ name: "FCC_EMC_Report_4821.pdf", size: "2.4 MB", uploadedAt: "Mar 16" }], priority: "critical" },
      { id: "RC-002", type: "inspection", title: "Pre-Shipment Visual Inspection", description: "Random sampling of 5% units. Check for cosmetic defects, button responsiveness, and packaging integrity.", status: "in_progress", requiredBy: "David Chen", orderRef: "ORD-4821", dueDate: "Mar 21", proofDocs: [], notes: "Inspector assigned — scheduled for tomorrow morning.", priority: "critical" },
      { id: "RC-003", type: "certification", title: "CE Marking Confirmation", description: "Provide valid CE declaration of conformity for EU market readiness.", status: "pending", requiredBy: "David Chen", orderRef: "ORD-4821", dueDate: "Mar 22", proofDocs: [], priority: "required" },
      { id: "RC-004", type: "photo_proof", title: "Packaging & Labeling Photos", description: "Send clear photos of final packaging, retail box labels, and barcode placement.", status: "pending", requiredBy: "David Chen", orderRef: "ORD-4821", dueDate: "Mar 22", proofDocs: [], priority: "required" },
      { id: "RC-005", type: "documentation", title: "Material Safety Data Sheet (MSDS)", description: "Battery MSDS required for lithium-ion cells used in headphones.", status: "satisfied", requiredBy: "David Chen", orderRef: "ORD-4821", dueDate: "Mar 18", satisfiedAt: "Mar 15", satisfiedBy: "Compliance Team", proofDocs: [{ name: "Battery_MSDS_LiIon.pdf", size: "890 KB", uploadedAt: "Mar 15" }], priority: "critical" },
    ],
  },
  {
    id: "REL-002", orderRef: "ORD-4835", buyerName: "Lisa Park", buyerAvatar: "LP",
    buyerCountry: "South Korea", buyerCountryCode: "kr",
    productName: "LED Panel Light (Commercial)", hsCode: "9405.40.80", quantity: 200,
    overallStatus: "blocked", createdAt: "Mar 15, 2026",
    conditions: [
      { id: "RC-006", type: "certification", title: "KC Certification (Korea)", description: "Korean Certification mark is mandatory for all electrical products sold in South Korea.", status: "pending", requiredBy: "Lisa Park", orderRef: "ORD-4835", dueDate: "Mar 25", proofDocs: [], priority: "critical" },
      { id: "RC-007", type: "lab_test", title: "Luminous Efficacy Test Report", description: "Third-party lab test confirming ≥120 lm/W as specified in the purchase order.", status: "pending", requiredBy: "Lisa Park", orderRef: "ORD-4835", dueDate: "Mar 24", proofDocs: [], priority: "critical" },
      { id: "RC-008", type: "inspection", title: "Drop Test & Thermal Cycling", description: "1.5m drop test on 3 samples, thermal cycling -10°C to 60°C for 48h.", status: "pending", requiredBy: "Lisa Park", orderRef: "ORD-4835", dueDate: "Mar 26", proofDocs: [], priority: "required" },
      { id: "RC-009", type: "custom", title: "Korean Language Labeling", description: "All product labels, user manual, and warranty card must be in Korean.", status: "pending", requiredBy: "Lisa Park", orderRef: "ORD-4835", dueDate: "Mar 23", proofDocs: [], priority: "required" },
    ],
  },
  {
    id: "REL-003", orderRef: "ORD-4840", buyerName: "Meridian Corp", buyerAvatar: "MC",
    buyerCountry: "United States", buyerCountryCode: "us",
    productName: "Organic Green Tea (Loose Leaf)", hsCode: "0902.20.00", quantity: 1000,
    overallStatus: "cleared", createdAt: "Mar 10, 2026",
    conditions: [
      { id: "RC-010", type: "certification", title: "USDA Organic Certification", description: "Valid USDA NOP organic certificate for the specific batch being shipped.", status: "satisfied", requiredBy: "Meridian Corp", orderRef: "ORD-4840", dueDate: "Mar 15", satisfiedAt: "Mar 13", satisfiedBy: "USDA Accredited Agent", proofDocs: [{ name: "USDA_Organic_Cert_Batch284.pdf", size: "1.1 MB", uploadedAt: "Mar 13" }], priority: "critical" },
      { id: "RC-011", type: "lab_test", title: "Pesticide Residue Analysis", description: "GC-MS analysis for 450+ pesticide compounds. Must show zero detectable residues.", status: "satisfied", requiredBy: "Meridian Corp", orderRef: "ORD-4840", dueDate: "Mar 14", satisfiedAt: "Mar 12", satisfiedBy: "Eurofins Lab", proofDocs: [{ name: "Pesticide_Analysis_GreenTea.pdf", size: "3.2 MB", uploadedAt: "Mar 12" }], priority: "critical" },
      { id: "RC-012", type: "documentation", title: "FDA Prior Notice Filing", description: "FDA prior notice must be filed and confirmed before arrival at US port.", status: "satisfied", requiredBy: "Meridian Corp", orderRef: "ORD-4840", dueDate: "Mar 16", satisfiedAt: "Mar 14", satisfiedBy: "Compliance Team", proofDocs: [{ name: "FDA_PriorNotice_Confirmation.pdf", size: "240 KB", uploadedAt: "Mar 14" }], priority: "critical" },
    ],
  },
];

// ─── Doc Type Config ────────────────────────────────────

const docTypeConfig: Record<DocType, { icon: React.ReactNode; label: string; color: string }> = {
  passport: { icon: <CreditCard size={16} />, label: "Passport", color: "#3B82F6" },
  driving_license: { icon: <TruckIcon size={16} />, label: "Driving License", color: "#0171E3" },
  id_card: { icon: <CreditCard size={16} />, label: "ID Card", color: "#8B5CF6" },
  bank_statement: { icon: <FileText size={16} />, label: "Bank Statement", color: "#30A46C" },
  utility_bill: { icon: <FileText size={16} />, label: "Utility Bill", color: "#FFB224" },
  business_license: { icon: <FileText size={16} />, label: "Business License", color: "#30A46C" },
  factory_ownership: { icon: <Building2 size={16} />, label: "Factory Ownership", color: "#D97706" },
  business_registration: { icon: <FileText size={16} />, label: "Business Registration", color: "#30A46C" },
};

// ─── Mock Profiles ──────────────────────────────────────

const mockProfiles: VerificationProfile[] = [
  {
    id: "USR-B001",
    name: "David Chen",
    avatar: "DC",
    type: "buyer",
    location: "Chicago, IL, USA",
    email: "david.chen@example.com",
    phone: "+1 (312) 555-0142",
    overallStatus: "verified",
    kycLevel: 3,
    documents: [
      { id: "DOC-001", type: "passport", label: "US Passport", status: "verified", uploadedAt: "Jan 15, 2026", verifiedAt: "Jan 16, 2026", expiresAt: "Dec 2031", verifiedBy: "Auto-verify", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
      { id: "DOC-002", type: "driving_license", label: "Illinois DL", status: "verified", uploadedAt: "Jan 15, 2026", verifiedAt: "Jan 16, 2026", expiresAt: "Nov 2028", verifiedBy: "Auto-verify", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
    ],
    biometrics: [
      { type: "fingerprint", status: "verified", enrolledAt: "Jan 15, 2026", lastVerified: "Mar 13, 2026", matchScore: 98.4 },
      { type: "face_id", status: "verified", enrolledAt: "Jan 15, 2026", lastVerified: "Mar 13, 2026", matchScore: 99.1 },
    ],
    joinedAt: "Jan 15, 2026",
    lastActive: "2 hours ago",
    trustScore: 94,
  },
  {
    id: "USR-S001",
    name: "Mei Tanaka",
    avatar: "MT",
    type: "seller",
    companyName: "GreenLeaf Organics",
    location: "Kyoto, Japan",
    email: "mei@greenleaf.jp",
    phone: "+81 75-555-0198",
    overallStatus: "verified",
    kycLevel: 3,
    documents: [
      { id: "DOC-003", type: "passport", label: "Japan Passport", status: "verified", uploadedAt: "Dec 1, 2025", verifiedAt: "Dec 2, 2025", expiresAt: "Aug 2030", verifiedBy: "Compliance Team", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
      { id: "DOC-004", type: "business_registration", label: "JAS Registration", status: "verified", uploadedAt: "Dec 1, 2025", verifiedAt: "Dec 3, 2025", verifiedBy: "Legal Dept", imageUrl: "https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=400&h=300&fit=crop" },
      { id: "DOC-005", type: "factory_ownership", label: "Kyoto Processing Facility", status: "verified", uploadedAt: "Dec 1, 2025", verifiedAt: "Dec 5, 2025", verifiedBy: "Compliance Team", imageUrl: "https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=400&h=300&fit=crop" },
    ],
    biometrics: [
      { type: "fingerprint", status: "verified", enrolledAt: "Dec 1, 2025", lastVerified: "Mar 12, 2026", matchScore: 97.8 },
      { type: "face_id", status: "verified", enrolledAt: "Dec 1, 2025", lastVerified: "Mar 12, 2026", matchScore: 98.5 },
    ],
    joinedAt: "Dec 1, 2025",
    lastActive: "5 hours ago",
    trustScore: 97,
  },
  {
    id: "USR-S002",
    name: "Hans Weber",
    avatar: "HW",
    type: "seller",
    companyName: "Atlas Materials",
    location: "Stuttgart, Germany",
    email: "hans@atlas-materials.de",
    phone: "+49 711-555-0234",
    overallStatus: "under_review",
    kycLevel: 2,
    documents: [
      { id: "DOC-006", type: "passport", label: "German Passport", status: "verified", uploadedAt: "Feb 10, 2026", verifiedAt: "Feb 11, 2026", expiresAt: "Mar 2029", verifiedBy: "Auto-verify", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
      { id: "DOC-007", type: "business_registration", label: "Handelsregister Extract", status: "verified", uploadedAt: "Feb 10, 2026", verifiedAt: "Feb 12, 2026", verifiedBy: "Legal Dept", imageUrl: "https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=400&h=300&fit=crop" },
      { id: "DOC-008", type: "factory_ownership", label: "Stuttgart Production Facility", status: "under_review", uploadedAt: "Mar 9, 2026", imageUrl: "https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=400&h=300&fit=crop" },
    ],
    biometrics: [
      { type: "fingerprint", status: "verified", enrolledAt: "Feb 10, 2026", lastVerified: "Mar 10, 2026", matchScore: 96.2 },
      { type: "face_id", status: "pending", enrolledAt: undefined },
    ],
    joinedAt: "Feb 10, 2026",
    lastActive: "1 day ago",
    trustScore: 78,
  },
  {
    id: "USR-B002",
    name: "Lisa Park",
    avatar: "LP",
    type: "buyer",
    location: "Seoul, South Korea",
    email: "lisa.park@koreaimport.kr",
    phone: "+82 2-555-0367",
    overallStatus: "pending",
    kycLevel: 1,
    documents: [
      { id: "DOC-009", type: "passport", label: "Korean Passport", status: "pending", uploadedAt: "Mar 12, 2026", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
      { id: "DOC-010", type: "id_card", label: "National ID", status: "pending", uploadedAt: "Mar 12, 2026", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
    ],
    biometrics: [
      { type: "fingerprint", status: "pending" },
      { type: "face_id", status: "pending" },
    ],
    joinedAt: "Mar 12, 2026",
    lastActive: "30 min ago",
    trustScore: 45,
  },
  {
    id: "USR-S003",
    name: "Carlos Rodriguez",
    avatar: "CR",
    type: "seller",
    companyName: "Terra Clay Studio",
    location: "Oaxaca, Mexico",
    email: "carlos@terraclay.mx",
    phone: "+52 951-555-0189",
    overallStatus: "verified",
    kycLevel: 3,
    documents: [
      { id: "DOC-011", type: "passport", label: "Mexican Passport", status: "verified", uploadedAt: "Nov 5, 2025", verifiedAt: "Nov 6, 2025", expiresAt: "Jun 2030", verifiedBy: "Auto-verify", imageUrl: "https://images.unsplash.com/photo-1767216427262-ce74ba565c3c?w=400&h=300&fit=crop" },
      { id: "DOC-012", type: "factory_ownership", label: "Oaxaca Workshop", status: "verified", uploadedAt: "Nov 5, 2025", verifiedAt: "Nov 8, 2025", verifiedBy: "Compliance Team", imageUrl: "https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=400&h=300&fit=crop" },
    ],
    biometrics: [
      { type: "fingerprint", status: "verified", enrolledAt: "Nov 5, 2025", lastVerified: "Mar 11, 2026", matchScore: 97.1 },
      { type: "face_id", status: "verified", enrolledAt: "Nov 5, 2025", lastVerified: "Mar 11, 2026", matchScore: 98.8 },
    ],
    joinedAt: "Nov 5, 2025",
    lastActive: "3 hours ago",
    trustScore: 92,
  },
];

// ─── KYC Level Display ──────────────────────────────────

function KYCLevel({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((l) => (
        <div
          key={l}
          className={`w-6 h-2 rounded-full transition-all ${
            l <= level ? "bg-primary" : "bg-muted/40"
          }`}
        />
      ))}
      <span className="text-[0.6875rem] text-muted-foreground ml-1">Level {level}</span>
    </div>
  );
}

// ─── Trust Score Ring ────────────────────────────────────

function TrustScore({ score }: { score: number }) {
  const color = score >= 80 ? "#30A46C" : score >= 60 ? "#FFB224" : "#E5484D";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative w-[72px] h-[72px]">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#E9EDF2" strokeWidth="5" />
        <motion.circle
          cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[0.875rem] text-foreground">{score}</span>
      </div>
    </div>
  );
}

// ─── Profile Detail ─────────────────────────────────────

function ProfileDetail({
  profile,
  onClose,
  onApproveDoc,
  onRejectDoc,
  onApproveAll,
  onRequestReverification,
}: {
  profile: VerificationProfile;
  onClose: () => void;
  onApproveDoc: (docId: string) => void;
  onRejectDoc: (docId: string) => void;
  onApproveAll: () => void;
  onRequestReverification: () => void;
}) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  const canPreviewAsImage = (doc: Document) => {
    const ct = (doc.contentType || "").toLowerCase();
    const name = `${doc.originalName || doc.imageUrl || ""}`.toLowerCase();
    return ct.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
  };

  const browserUrl = (url: string) => {
    if (!url || typeof window === "undefined") return url;
    try {
      const next = new URL(url, window.location.href);
      if (next.hostname === "0.0.0.0" && window.location.hostname !== "0.0.0.0") {
        next.hostname = window.location.hostname;
      }
      return next.toString();
    } catch {
      return url;
    }
  };

  useEffect(() => {
    if (!previewDoc?.imageUrl) {
      setPreviewObjectUrl("");
      setPreviewError("");
      return;
    }

    let alive = true;
    let objectUrl = "";
    setPreviewObjectUrl("");
    setPreviewError("");

    fetch(browserUrl(previewDoc.imageUrl))
      .then((res) => {
        if (!res.ok) throw new Error(`Document failed to load (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewObjectUrl(objectUrl);
      })
      .catch((e) => {
        if (!alive) return;
        setPreviewError(e instanceof Error ? e.message : "Document failed to load.");
      });

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewDoc]);

  const fmt = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[600px] bg-background overflow-y-auto shadow-2xl"
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
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
                <p className="text-[0.6875rem] text-muted-foreground">{profile.id}</p>
                <h3 className="text-foreground tracking-tight">Verification Profile</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[1rem] ${
              profile.type === "buyer"
                ? "bg-gradient-to-br from-[#3B82F6] to-[#0171E3]"
                : "bg-gradient-to-br from-[#D97706] to-[#FFB224]"
            }`}>
              {profile.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-foreground tracking-tight">{profile.name}</h2>
              {profile.companyName && (
                <p className="text-[0.8125rem] text-muted-foreground">{profile.companyName}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[0.625rem] px-2 py-0.5 rounded capitalize ${
                  profile.type === "buyer" ? "bg-[#3B82F6]/8 text-[#3B82F6]" : "bg-[#D97706]/8 text-[#D97706]"
                }`}>
                  {profile.type}
                </span>
                <KYCLevel level={profile.kycLevel} />
              </div>
            </div>
            <TrustScore score={profile.trustScore} />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground">Location</p>
              <p className="text-[0.8125rem] text-foreground flex items-center gap-1 mt-0.5"><MapPin size={12} /> {profile.location}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/15">
              <p className="text-[0.6875rem] text-muted-foreground">Member Since</p>
              <p className="text-[0.8125rem] text-foreground flex items-center gap-1 mt-0.5"><Calendar size={12} /> {profile.joinedAt}</p>
            </div>
          </div>

          {/* Biometrics */}
          {/*
          <div>
            <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
              <Fingerprint size={14} />
              Biometric Verification
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {profile.biometrics.map((bio) => {
                const bioCfg = {
                  fingerprint: { icon: <Fingerprint size={20} />, label: "Fingerprint" },
                  face_id: { icon: <Scan size={20} />, label: "Face ID" },
                  voice: { icon: <User size={20} />, label: "Voice Print" },
                };
                const cfg = bioCfg[bio.type];
                return (
                  <div
                    key={bio.type}
                    className={`p-4 rounded-2xl border ${
                      bio.status === "verified"
                        ? "border-[#30A46C]/20 bg-[#30A46C]/3"
                        : "border-border/30 bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={bio.status === "verified" ? "text-[#30A46C]" : "text-muted-foreground"}>
                        {cfg.icon}
                      </span>
                      {bio.status === "verified" ? (
                        <CheckCircle2 size={16} className="text-[#30A46C]" />
                      ) : (
                        <Clock size={16} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <p className="text-[0.8125rem] text-foreground">{cfg.label}</p>
                    {bio.matchScore && (
                      <p className="text-[0.6875rem] text-[#30A46C] mt-0.5">{bio.matchScore}% match</p>
                    )}
                    {bio.lastVerified && (
                      <p className="text-[0.625rem] text-muted-foreground mt-0.5">Last: {bio.lastVerified}</p>
                    )}
                    {bio.status === "pending" && (
                      <p className="text-[0.6875rem] text-muted-foreground mt-1">Not enrolled</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          */}

          {/* Documents */}
          <div>
            <h4 className="text-[0.8125rem] text-muted-foreground mb-3 flex items-center gap-1.5">
              <FileText size={14} />
              Documents ({profile.documents.length})
            </h4>
            {profile.documents.length === 0 && (
              <div className="p-5 rounded-2xl border border-border/30 bg-muted/10 text-[0.8125rem] text-muted-foreground">
                No uploaded documents found.
              </div>
            )}
            <div className="space-y-3">
              {profile.documents.map((doc) => {
                const dcfg = docTypeConfig[doc.type];
                const hasFile = !!doc.imageUrl;
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl border ${
                      doc.status === "verified"
                        ? "border-[#30A46C]/15 bg-[#30A46C]/3"
                        : doc.status === "rejected"
                        ? "border-[#E5484D]/15 bg-[#E5484D]/3"
                        : "border-border/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Doc Preview */}
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-muted/20 flex-shrink-0 border border-border/20">
                        {hasFile && canPreviewAsImage(doc) ? (
                          <ImageWithFallback src={doc.imageUrl} alt={doc.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/35">
                            <FileText size={18} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: dcfg.color }}>{dcfg.icon}</span>
                          <span className="text-[0.8125rem] text-foreground">{doc.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[0.6875rem] text-muted-foreground">
                          <span>Uploaded: {fmt(doc.uploadedAt)}</span>
                          {doc.expiresAt && <span>Expires: {fmt(doc.expiresAt)}</span>}
                        </div>
                        {doc.verifiedBy && (
                          <p className="text-[0.625rem] text-[#30A46C] mt-0.5">Verified by: {doc.verifiedBy}</p>
                        )}
                        {doc.rejectionReason && (
                          <p className="text-[0.625rem] text-[#E5484D] mt-0.5">Reason: {doc.rejectionReason}</p>
                        )}
                        {!hasFile && (
                          <p className="text-[0.625rem] text-[#E5484D] mt-0.5">File missing. Request a new upload.</p>
                        )}
                      </div>

                      <StatusPill
                        status={
                          doc.status === "verified" ? "success" :
                          doc.status === "rejected" ? "error" :
                          doc.status === "expired" ? "warning" :
                          doc.status === "under_review" ? "info" : "pending"
                        }
                        label={doc.status === "under_review" ? "Reviewing" : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      />
                    </div>

                    {/* Action buttons for pending/under_review */}
                    {hasFile && (doc.status === "pending" || doc.status === "under_review") && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/15">
                        <BounceButton
                          variant="success"
                          size="sm"
                          icon={<ThumbsUp size={13} />}
                          energyWeight={3}
                          onClick={() => onApproveDoc(doc.id)}
                        >
                          Approve
                        </BounceButton>
                        <BounceButton variant="ghost" size="sm" icon={<ThumbsDown size={13} />} onClick={() => onRejectDoc(doc.id)}>
                          Reject
                        </BounceButton>
                        <BounceButton variant="secondary" size="sm" icon={<Eye size={13} />} onClick={() => setPreviewDoc(doc)}>
                          View Full
                        </BounceButton>
                      </div>
                    )}
                    {!hasFile && (doc.status === "pending" || doc.status === "under_review") && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/15">
                        <BounceButton variant="secondary" size="sm" icon={<Upload size={13} />} onClick={onRequestReverification}>
                          Request Upload
                        </BounceButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {previewDoc && (
              <>
                <motion.div
                  className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewDoc(null)}
                />
                <motion.div
                  className="fixed left-1/2 top-1/2 z-[71] w-[min(940px,94vw)] h-[min(760px,88vh)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card shadow-2xl border border-border/30"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[0.875rem] text-foreground">{previewDoc.originalName || previewDoc.label}</div>
                      <div className="text-[0.6875rem] text-muted-foreground">{previewDoc.contentType || "Document"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(null)}
                      className="rounded-xl p-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="h-[calc(100%-57px)] bg-muted/10">
                    {previewError ? (
                      <div className="flex h-full items-center justify-center px-6 text-center text-[0.8125rem] text-[#E5484D]/80">
                        {previewError}
                      </div>
                    ) : !previewObjectUrl ? (
                      <div className="flex h-full items-center justify-center text-[0.8125rem] text-muted-foreground">
                        Loading document…
                      </div>
                    ) : canPreviewAsImage(previewDoc) ? (
                      <img src={previewObjectUrl} alt={previewDoc.label} className="h-full w-full object-contain" />
                    ) : (
                      <iframe src={previewObjectUrl} title={previewDoc.label} className="h-full w-full border-0" />
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Overall Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
            {profile.overallStatus !== "verified" && (
              <BounceButton variant="success" size="md" icon={<UserCheck size={16} />} energyWeight={5} onClick={onApproveAll}>
                Approve All & Verify
              </BounceButton>
            )}
            <BounceButton variant="secondary" size="md" icon={<Lock size={16} />} onClick={onRequestReverification}>
              Request Re-verification
            </BounceButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Verification Center ───────────────────────────

export function VerificationCenter() {
  const [selectedProfile, setSelectedProfile] = useState<VerificationProfile | null>(null);
  const [filterType, setFilterType] = useState<"all" | "buyer" | "seller">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "under_review">("all");
  const [activeTab, setActiveTab] = useState<"users" | "release">("release");
  const [releaseOrders, setReleaseOrders] = useState<BuyerReleaseOrder[]>([]);
  const [releaseStats, setReleaseStats] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | number | null>(null);
  const [satisfyingCondition, setSatisfyingCondition] = useState<{ orderId: string | number; conditionId: string | number } | null>(null);
  const [satisfyDocs, setSatisfyDocs] = useState<{ file: File; name: string; size: string }[]>([]);
  const [satisfyNote, setSatisfyNote] = useState("");
  const [profiles, setProfiles] = useState<VerificationProfile[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [missingGroups, setMissingGroups] = useState<string[] | null>(null);
  const [missingUserId, setMissingUserId] = useState<string | null>(null);
  const [requestingUpload, setRequestingUpload] = useState(false);

  const apiBase = () => {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const normalize = (u: string) => u.replace(/\/$/, "");
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
      return normalize(fromEnv);
    }
    if (typeof window !== "undefined") {
      return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
    }
    return "http://localhost:8000";
  };

  const getAccess = () => {
    try {
      return window.localStorage.getItem("vehsl.access") || "";
    } catch {
      return "";
    }
  };

  const fetchJson = async (path: string, init?: RequestInit) => {
    const access = getAccess();
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
    });
    if (res.status === 401) {
      try {
        window.location.assign("/?signin=1");
      } catch {}
    }
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const pickMsg = (x: any): string => {
        if (!x) return "";
        if (typeof x === "string") return x;
        if (typeof x?.detail === "string") return x.detail;
        if (typeof x?.error === "string") return x.error;
        if (typeof x === "object") {
          for (const k of Object.keys(x)) {
            const v = (x as any)[k];
            if (typeof v === "string" && v.trim()) return v;
            if (Array.isArray(v) && v.length && typeof v[0] === "string") return v[0];
          }
        }
        return "";
      };
      const msg =
        pickMsg(data) ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fmtDate = (d: any) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  };

  const fmtDateFull = (d: any) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  const relativeTime = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    const diffMs = Date.now() - dt.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    const days = Math.floor(hrs / 24);
    return `${days} days ago`;
  };

  const toCount = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const refreshUserStats = async () => {
    try {
      const s = await fetchJson("/api/v1/admin/verification/users/stats/");
      setUserStats(s);
    } catch {
      setUserStats(null);
    }
  };

  const refreshRelease = async () => {
    setReleaseLoading(true);
    setError("");
    try {
      const [s, list] = await Promise.all([
        fetchJson("/api/v1/admin/verification/release/orders/stats/"),
        fetchJson("/api/v1/admin/verification/release/orders/"),
      ]);
      const rows = Array.isArray(list) ? list : Array.isArray(list?.results) ? list.results : [];
      setReleaseStats(s);
      setReleaseOrders(rows);
      if (!expandedOrder && rows?.[0]?.id) setExpandedOrder(rows[0].id);
    } catch (e: any) {
      setError(e?.message || "Failed to load release requirements.");
    } finally {
      setReleaseLoading(false);
    }
  };

  const refreshUsers = async () => {
    setUsersLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const list = await fetchJson(`/api/v1/admin/verification/users/?${params.toString()}`);
      const rows = Array.isArray(list) ? list : Array.isArray(list?.results) ? list.results : [];
      setProfiles(
        rows.map((p: any) => ({
          ...p,
          lastActive: p.lastActive || relativeTime(p.lastActiveAt),
        }))
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    refreshRelease();
    refreshUserStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") refreshUsers();
  }, [activeTab, filterType, filterStatus]);

  const filtered = useMemo(() => profiles, [profiles]);

  const pendingCount =
    toCount(userStats?.pending_review) ||
    filtered.filter(p => p.overallStatus === "pending" || p.overallStatus === "under_review").length;
  const verifiedCount = toCount(userStats?.fully_verified) || filtered.filter(p => p.overallStatus === "verified").length;
  const totalUsers = toCount(userStats?.total_users) || filtered.length;
  const buyersCount = toCount(userStats?.buyers) || filtered.filter(p => p.type === "buyer").length;
  const sellersCount = toCount(userStats?.sellers) || filtered.filter(p => p.type === "seller").length;
  const avgTrustScore = toCount(userStats?.avg_trust_score) || Math.round(filtered.reduce((s, p) => s + (p.trustScore || 0), 0) / Math.max(1, filtered.length));
  const blockedOrders = releaseOrders.filter(o => o.overallStatus === "blocked" || o.overallStatus === "partial").length;
  const clearedOrders = releaseOrders.filter(o => o.overallStatus === "cleared" || o.overallStatus === "released").length;
  const totalConditions = releaseOrders.flatMap(o => o.conditions).length;
  const satisfiedConditions = releaseOrders.flatMap(o => o.conditions).filter(c => c.status === "satisfied").length;

  const satisfyCondition = async () => {
    if (!satisfyingCondition) return;
    try {
      const fd = new FormData();
      if (satisfyNote.trim()) fd.append("note", satisfyNote.trim());
      satisfyDocs.forEach(d => fd.append("files", d.file));
      await fetchJson(`/api/v1/admin/verification/release/conditions/${satisfyingCondition.conditionId}/satisfy/`, {
        method: "POST",
        body: fd,
      });
      setSatisfyingCondition(null);
      setSatisfyDocs([]);
      setSatisfyNote("");
      await refreshRelease();
    } catch (e: any) {
      setError(e?.message || "Failed to satisfy condition.");
    }
  };

  const authorizeRelease = async (orderId: string | number) => {
    try {
      await fetchJson(`/api/v1/admin/verification/release/orders/${orderId}/authorize/`, { method: "POST" });
      await refreshRelease();
    } catch (e: any) {
      setError(e?.message || "Failed to authorize release.");
    }
  };

  const openProfile = async (id: string) => {
    try {
      const p = await fetchJson(`/api/v1/admin/verification/users/${id}/`);
      setSelectedProfile({
        ...p,
        lastActive: p.lastActive || relativeTime(p.lastActiveAt),
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load profile.");
    }
  };

  const approveDoc = async (docId: string) => {
    if (!selectedProfile) return;
    try {
      await fetchJson(`/api/v1/admin/verification/kyc-documents/${docId}/approve/`, { method: "POST" });
      await openProfile(String(selectedProfile.id));
      await refreshUsers();
      await refreshUserStats();
    } catch (e: any) {
      setError(e?.message || "Failed to approve document.");
    }
  };

  const rejectDoc = async (docId: string) => {
    if (!selectedProfile) return;
    const reason = typeof window !== "undefined" ? window.prompt("Rejection reason (optional):") || "" : "";
    try {
      await fetchJson(`/api/v1/admin/verification/kyc-documents/${docId}/reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await openProfile(String(selectedProfile.id));
      await refreshUsers();
      await refreshUserStats();
    } catch (e: any) {
      setError(e?.message || "Failed to reject document.");
    }
  };

  const postAdminVerificationAction = async (path: string, body?: any) => {
    const access = getAccess();
    const res = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: {
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const msg =
        (data && (typeof data.detail === "string" ? data.detail : "")) ||
        (typeof data === "string" ? data : "") ||
        `Request failed (${res.status})`;
      const err: any = new Error(msg);
      if (data && typeof data === "object") err.data = data;
      throw err;
    }
    return data;
  };

  const approveAll = async () => {
    if (!selectedProfile) return;
    try {
      await postAdminVerificationAction(`/api/v1/admin/verification/users/${selectedProfile.id}/approve-all/`);
      await openProfile(String(selectedProfile.id));
      await refreshUsers();
      await refreshUserStats();
    } catch (e: any) {
      const mg = e?.data?.missing_groups;
      if (Array.isArray(mg) && mg.length) {
        setMissingGroups(mg.map((x: any) => String(x)));
        setMissingUserId(String(selectedProfile.id));
        setError("");
        return;
      }
      setError(e?.message || "Failed to approve all.");
    }
  };

  const requestReverification = async () => {
    if (!selectedProfile) return;
    try {
      await postAdminVerificationAction(`/api/v1/admin/verification/users/${selectedProfile.id}/request-reverification/`);
      await openProfile(String(selectedProfile.id));
      await refreshUsers();
      await refreshUserStats();
    } catch (e: any) {
      setError(e?.message || "Failed to request re-verification.");
    }
  };

  const requestUploadFromUser = async () => {
    if (!missingUserId) return;
    setRequestingUpload(true);
    setError("");
    try {
      await postAdminVerificationAction(`/api/v1/admin/verification/users/${missingUserId}/request-documents/`);
      setMissingGroups(null);
      setMissingUserId(null);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to request upload.");
    } finally {
      setRequestingUpload(false);
    }
  };

  const releaseStatusConfig = {
    blocked: { color: "#E5484D", bg: "bg-[#E5484D]/6", label: "Blocked", pillStatus: "error" as const },
    partial: { color: "#FFB224", bg: "bg-[#FFB224]/6", label: "In Progress", pillStatus: "warning" as const },
    cleared: { color: "#30A46C", bg: "bg-[#30A46C]/6", label: "Cleared", pillStatus: "success" as const },
    released: { color: "#0171E3", bg: "bg-[#0171E3]/6", label: "Released", pillStatus: "info" as const },
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Verification Center</h1>
          <p className="text-muted-foreground text-[0.875rem]">{activeTab === "users" ? "Biometric enrollment and document verification." : "Buyer-defined release conditions — nothing ships until they're satisfied."}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-card rounded-3xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 inline-flex gap-1.5">
        {([{ key: "release" as const, label: "Release Requirements", icon: <Lock size={16} />, badge: blockedOrders }, { key: "users" as const, label: "User Verification", icon: <Fingerprint size={16} />, badge: pendingCount }]).map(tab => (
          <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[0.8125rem] transition-all duration-300 cursor-pointer ${activeTab === tab.key ? "bg-card shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-primary" : "text-muted-foreground hover:text-foreground"}`} whileTap={{ scale: 0.97 }}>
            {tab.icon}<span>{tab.label}</span>
            {tab.badge > 0 && <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[0.5625rem] ${activeTab === tab.key ? "bg-primary text-white" : "bg-muted/40 text-muted-foreground"}`}>{tab.badge}</span>}
          </motion.button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "release" ? (
          <motion.div key="release" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                label="Active Orders"
                value={(toCount(releaseStats?.active_orders) || releaseOrders.length).toString()}
                icon={<Lock size={20} className="text-[#0171E3]" />}
                iconBg="bg-[#0171E3]/8"
                index={0}
                subtitle={`${(toCount(releaseStats?.blocked_orders) || blockedOrders).toString()} need attention`}
                accentColor="#0171E3"
              />
              <StatCard
                label="Conditions Met"
                value={`${toCount(releaseStats?.satisfied_conditions) || satisfiedConditions}/${toCount(releaseStats?.total_conditions) || totalConditions}`}
                icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
                iconBg="bg-[#30A46C]/8"
                index={1}
                subtitle={`${Math.round(
                  (((toCount(releaseStats?.satisfied_conditions) || satisfiedConditions) * 100) /
                    Math.max(1, toCount(releaseStats?.total_conditions) || totalConditions))
                )}% complete`}
                accentColor="#30A46C"
              />
              <StatCard
                label="Ready to Ship"
                value={(toCount(releaseStats?.ready_to_ship) || clearedOrders).toString()}
                icon={<TruckIcon size={20} className="text-[#30A46C]" />}
                iconBg="bg-[#30A46C]/8"
                index={2}
                subtitle="All conditions satisfied"
                accentColor="#30A46C"
              />
            </div>

            <div className="space-y-4">
              {releaseLoading && (
                <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                  Loading release orders…
                </div>
              )}
              {!releaseLoading && releaseOrders.length === 0 && (
                <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                  No active orders found.
                </div>
              )}
              {releaseOrders.map((order, oi) => {
                const isExpanded = expandedOrder === order.id;
                const statusCfg = releaseStatusConfig[order.overallStatus];
                const satisfiedCount = order.conditions.filter(c => c.status === "satisfied" || c.status === "waived").length;
                const denom = Math.max(1, order.conditions.length);
                const pct = order.conditions.length ? Math.round((satisfiedCount / denom) * 100) : 0;
                return (
                  <motion.div key={order.id} layout className={`bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border overflow-hidden ${order.overallStatus === "blocked" ? "border-[#E5484D]/20" : order.overallStatus === "partial" ? "border-[#FFB224]/15" : "border-border/40"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: oi * 0.05 }}>
                    <motion.button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full p-6 text-left cursor-pointer" whileTap={{ scale: 0.998 }}>
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#0171E3] flex items-center justify-center text-white text-[0.75rem]">{order.buyerAvatar}</div>
                          <img src={`https://flagcdn.com/w20/${order.buyerCountryCode}.png`} alt={order.buyerCountry} className="absolute -bottom-1 -right-1 w-[16px] rounded-[2px] shadow-[0_0_0_2px_white,0_0_4px_rgba(0,0,0,0.1)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-foreground/80 tracking-tight">{order.buyerName}</h3>
                            <span className="text-[0.625rem] text-muted-foreground/40 tabular-nums">{order.orderRef}</span>
                            <StatusPill status={statusCfg.pillStatus} label={statusCfg.label} pulse={order.overallStatus === "blocked"} />
                          </div>
                          <p className="text-[0.8125rem] text-muted-foreground/50">{order.productName}</p>
                          <div className="flex items-center gap-3 mt-2 text-[0.6875rem] text-muted-foreground/35">
                            <span>HS {order.hsCode}</span>
                            <span className="text-[0.5rem]">|</span>
                            <span>{order.quantity} units</span>
                            <span className="text-[0.5rem]">|</span>
                            <span>{fmtDateFull(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="relative w-[52px] h-[52px]">
                            <svg width="52" height="52" className="-rotate-90">
                              <circle cx="26" cy="26" r="20" fill="none" stroke="#E9EDF2" strokeWidth="4" />
                              <motion.circle cx="26" cy="26" r="20" fill="none" stroke={statusCfg.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={2*Math.PI*20} initial={{ strokeDashoffset: 2*Math.PI*20 }} animate={{ strokeDashoffset: 2*Math.PI*20*(1-pct/100) }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-[0.6875rem] text-foreground/60 tabular-nums">{pct}%</span></div>
                          </div>
                          <span className="text-[0.5625rem] text-muted-foreground/30">{satisfiedCount}/{order.conditions.length}</span>
                        </div>
                        <ChevronRight size={16} className={`text-muted-foreground/25 flex-shrink-0 mt-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </motion.button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="overflow-hidden">
                          <div className="px-6 pb-6 pt-0 space-y-2.5 border-t border-border/20">
                            <p className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest pt-4 pb-1">Buyer's Release Conditions</p>
                            {order.conditions.map((cond, ci) => {
                              const ccfg = releaseConditionConfig[cond.type];
                              const pcfg = releasePriorityConfig[cond.priority];
                              return (
                                <motion.div key={cond.id} className={`rounded-2xl border p-4 transition-all ${cond.status === "satisfied" ? "border-[#30A46C]/15 bg-[#30A46C]/[0.02]" : cond.status === "in_progress" ? "border-[#0171E3]/15 bg-[#0171E3]/[0.02]" : cond.status === "failed" ? "border-[#E5484D]/15 bg-[#E5484D]/[0.02]" : "border-border/30"}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.03 }}>
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${ccfg.color}10` }}><span style={{ color: ccfg.color }}>{ccfg.icon}</span></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-[0.8125rem] text-foreground/70">{cond.title}</span>
                                        <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${ccfg.color}10`, color: `${ccfg.color}99` }}>{ccfg.label}</span>
                                        <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded-full ${pcfg.bg}`} style={{ color: pcfg.color }}>{pcfg.label}</span>
                                      </div>
                                      <p className="text-[0.75rem] text-muted-foreground/40 leading-relaxed mb-2">{cond.description}</p>
                                      <div className="flex items-center gap-3 text-[0.625rem] text-muted-foreground/30 mb-2">
                                        <span className="flex items-center gap-1"><Calendar size={9} />Due: {fmtDate(cond.dueDate)}</span>
                                        {cond.satisfiedAt && (
                                          <span className="flex items-center gap-1 text-[#30A46C]/60">
                                            <CheckCircle2 size={9} />
                                            Satisfied: {fmtDate(cond.satisfiedAt)}
                                          </span>
                                        )}
                                        {cond.satisfiedBy && <span>by {cond.satisfiedBy}</span>}
                                      </div>
                                      {cond.notes && <div className="px-3 py-2 rounded-lg bg-[#FFB224]/[0.04] border border-[#FFB224]/10 mb-2"><p className="text-[0.6875rem] text-foreground/45">{cond.notes}</p></div>}
                                      {cond.proofDocs.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                          {cond.proofDocs.map((doc, di) => (
                                            <div key={di} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/10 cursor-pointer hover:bg-[#30A46C]/[0.08] transition-colors">
                                              <FileText size={10} className="text-[#30A46C]/50" /><span className="text-[0.6875rem] text-foreground/50">{doc.name}</span><span className="text-[0.5625rem] text-muted-foreground/25">{doc.size}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {(cond.status === "pending" || cond.status === "in_progress") && (
                                        <div className="flex gap-2 pt-1">
                                          <BounceButton variant="success" size="sm" icon={<CheckCircle2 size={12} />} energyWeight={3} onClick={() => { setSatisfyingCondition({ orderId: order.id, conditionId: cond.id }); setSatisfyDocs([]); setSatisfyNote(""); }}>Satisfy Condition</BounceButton>
                                          <BounceButton variant="secondary" size="sm" icon={<Eye size={12} />}>Details</BounceButton>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0">
                                      {cond.status === "satisfied" ? <CheckCircle2 size={18} className="text-[#30A46C]/60" /> : cond.status === "in_progress" ? <StatusPill status="info" label="In Progress" pulse /> : cond.status === "failed" ? <AlertCircle size={18} className="text-[#E5484D]/60" /> : <Clock size={18} className="text-muted-foreground/25" />}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                            {order.overallStatus === "cleared" && (
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#30A46C]/15">
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#30A46C]" /><span className="text-[0.8125rem] text-[#30A46C]/70">All conditions satisfied</span></div>
                                <BounceButton variant="success" size="md" icon={<TruckIcon size={16} />} energyWeight={5} onClick={() => authorizeRelease(order.id)}>
                                  Authorize Release
                                </BounceButton>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                label="Total Users"
                value={totalUsers.toString()}
                icon={<Users size={20} className="text-primary" />}
                iconBg="bg-primary/8"
                index={0}
                subtitle={`${buyersCount} buyers · ${sellersCount} sellers`}
                accentColor="#0171E3"
              />
              <StatCard
                label="Fully Verified"
                value={verifiedCount.toString()}
                change={`${Math.round((verifiedCount * 100) / Math.max(1, totalUsers))}% of total`}
                changeType="positive"
                icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
                iconBg="bg-[#30A46C]/8"
                index={1}
                accentColor="#30A46C"
                sparklineData={[1, 2, 2, 3, 3, 4, verifiedCount]}
                sparklineColor="#30A46C"
              />
              <StatCard label="Pending Review" value={pendingCount.toString()} change="Needs attention" changeType="negative" icon={<Clock size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
              <StatCard
                label="Avg. Trust Score"
                value={avgTrustScore.toString()}
                change="Out of 100"
                changeType="neutral"
                icon={<Shield size={20} className="text-[#0171E3]" />}
                iconBg="bg-[#0171E3]/8"
                index={3}
              />
            </div>
            {/* Biometric Security */}
            {/*
            <div className="bg-card rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-2xl bg-[#0171E3]/8 flex items-center justify-center"><Fingerprint size={20} className="text-[#0171E3]" /></div><div><h3 className="text-foreground tracking-tight">Biometric Security</h3><p className="text-muted-foreground text-[0.75rem]">Multi-factor identity verification across all users</p></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Fingerprint Enrolled",
                    count: toCount(userStats?.fingerprint_enrolled) || filtered.filter(p => p.biometrics.some(b => b.type === "fingerprint" && b.status === "verified")).length,
                    total: totalUsers,
                    icon: <Fingerprint size={16} />,
                    color: "#3B82F6",
                  },
                  {
                    label: "Face ID Enrolled",
                    count: toCount(userStats?.face_id_enrolled) || filtered.filter(p => p.biometrics.some(b => b.type === "face_id" && b.status === "verified")).length,
                    total: totalUsers,
                    icon: <Scan size={16} />,
                    color: "#0171E3",
                  },
                  {
                    label: "KYC Level 3",
                    count: toCount(userStats?.kyc_level_3) || filtered.filter(p => p.kycLevel === 3).length,
                    total: totalUsers,
                    icon: <Shield size={16} />,
                    color: "#30A46C",
                  },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl bg-muted/10 border border-border/15">
                    <div className="flex items-center justify-between mb-2"><span style={{ color: item.color }}>{item.icon}</span><span className="text-[0.8125rem] text-foreground">{item.count}/{item.total}</span></div>
                    <p className="text-[0.75rem] text-muted-foreground">{item.label}</p>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / Math.max(1, item.total)) * 100}%` }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 bg-muted/20 rounded-xl p-1">
                {(["all", "buyer", "seller"] as const).map((type) => (<button key={type} onClick={() => setFilterType(type)} className={`px-3.5 py-2 rounded-lg text-[0.8125rem] transition-all cursor-pointer capitalize ${filterType === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{type === "all" ? "All Users" : type === "buyer" ? "Buyers" : "Sellers"}</button>))}
              </div>
              <div className="flex items-center gap-1.5">
                {(["all", "pending", "under_review", "verified"] as const).map((status) => (<button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-all cursor-pointer ${filterStatus === status ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"}`}>{status === "all" ? "All" : status === "under_review" ? "Reviewing" : status.charAt(0).toUpperCase() + status.slice(1)}</button>))}
              </div>
            </div>
            <div className="space-y-3">
              {usersLoading && (
                <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                  Loading users…
                </div>
              )}
              {!usersLoading && filtered.length === 0 && (
                <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                  No users found.
                </div>
              )}
              {filtered.map((profile, i) => (
                <motion.div key={profile.id} className="bg-card rounded-2xl border border-border/30 p-5 hover:shadow-md transition-all cursor-pointer group" onClick={() => openProfile(String(profile.id))} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -1 }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[0.75rem] flex-shrink-0 ${profile.type === "buyer" ? "bg-gradient-to-br from-[#3B82F6] to-[#0171E3]" : "bg-gradient-to-br from-[#D97706] to-[#FFB224]"}`}>{profile.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5"><h4 className="text-[0.875rem] text-foreground">{profile.name}</h4><span className={`text-[0.5625rem] px-1.5 py-0.5 rounded capitalize ${profile.type === "buyer" ? "bg-[#3B82F6]/8 text-[#3B82F6]" : "bg-[#D97706]/8 text-[#D97706]"}`}>{profile.type}</span></div>
                      <p className="text-[0.75rem] text-muted-foreground">{profile.companyName ? `${profile.companyName} · ` : ""}{profile.location}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <KYCLevel level={profile.kycLevel} />
                      {/* {profile.biometrics.map((bio) => (...))} */}
                    </div>
                    <div className="hidden sm:block"><TrustScore score={profile.trustScore} /></div>
                    <StatusPill status={profile.overallStatus === "verified" ? "success" : profile.overallStatus === "pending" ? "warning" : profile.overallStatus === "under_review" ? "info" : profile.overallStatus === "rejected" ? "error" : "neutral"} label={profile.overallStatus === "under_review" ? "Reviewing" : profile.overallStatus.charAt(0).toUpperCase() + profile.overallStatus.slice(1)} pulse={profile.overallStatus === "pending"} />
                    <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/15 text-[0.6875rem] text-muted-foreground">
                    <span className="flex items-center gap-1"><FileText size={11} />{profile.documents.length} documents</span>
                    <span className="flex items-center gap-1 text-[#30A46C]"><CheckCircle2 size={11} />{profile.documents.filter(d => d.status === "verified").length} verified</span>
                    {profile.documents.some(d => d.status === "pending" || d.status === "under_review") && <span className="flex items-center gap-1 text-[#FFB224]"><Clock size={11} />{profile.documents.filter(d => d.status === "pending" || d.status === "under_review").length} pending</span>}
                    <span className="flex items-center gap-1 ml-auto"><Clock size={11} />Active {profile.lastActive}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetail
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onApproveDoc={approveDoc}
            onRejectDoc={rejectDoc}
            onApproveAll={approveAll}
            onRequestReverification={requestReverification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!missingGroups?.length && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!requestingUpload) {
                  setMissingGroups(null);
                  setMissingUserId(null);
                }
              }}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] bg-card rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <div className="px-6 pt-6 pb-4 border-b border-black/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[0.875rem] text-foreground/80">Missing required documents</h3>
                    <p className="text-[0.75rem] text-muted-foreground/60 mt-1">
                      Approve is blocked until the user uploads all required documents.
                    </p>
                  </div>
                  <motion.button
                    onClick={() => {
                      if (!requestingUpload) {
                        setMissingGroups(null);
                        setMissingUserId(null);
                      }
                    }}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer p-1"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="text-[0.75rem] text-muted-foreground/70">Missing:</div>
                <div className="flex flex-wrap gap-2">
                  {missingGroups.map((g) => (
                    <span key={g} className="px-3 py-1.5 rounded-full bg-muted/20 text-[0.75rem] text-foreground/70">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-black/[0.04] flex justify-end gap-2">
                <motion.button
                  onClick={() => {
                    if (!requestingUpload) {
                      setMissingGroups(null);
                      setMissingUserId(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-[0.75rem] text-muted-foreground/50 hover:text-foreground/60 hover:bg-muted/15 transition-colors cursor-pointer"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={requestingUpload ? undefined : requestUploadFromUser}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0171E3] text-white text-[0.75rem] shadow-[0_1px_8px_rgba(1,113,227,0.22)] cursor-pointer ${
                    requestingUpload ? "opacity-70 pointer-events-none" : ""
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload size={13} />
                  {requestingUpload ? "Requesting…" : "Request Upload"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Satisfy Condition Modal */}
      <AnimatePresence>
        {satisfyingCondition && (
          <>
            <motion.div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSatisfyingCondition(null); setSatisfyDocs([]); setSatisfyNote(""); }} />
            <motion.div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] bg-card rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
              <div className="px-6 pt-6 pb-4 border-b border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#30A46C]/10 flex items-center justify-center"><CheckCircle2 size={16} className="text-[#30A46C]" /></div>
                    <div>
                      <h3 className="text-[0.875rem] text-foreground/80">Satisfy Condition</h3>
                      <p className="text-[0.625rem] text-muted-foreground/40 mt-0.5">{(() => { const o = releaseOrders.find(o => o.id === satisfyingCondition.orderId); return o?.conditions.find(c => c.id === satisfyingCondition.conditionId)?.title || ""; })()}</p>
                    </div>
                  </div>
                  <motion.button onClick={() => { setSatisfyingCondition(null); setSatisfyDocs([]); setSatisfyNote(""); }} className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer p-1" whileTap={{ scale: 0.9 }}><X size={14} /></motion.button>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[0.5625rem] text-muted-foreground/35 uppercase tracking-widest mb-1.5 block">Notes</label>
                  <textarea value={satisfyNote} onChange={e => setSatisfyNote(e.target.value)} placeholder="How was this condition fulfilled?" rows={2} className="w-full px-3.5 py-2.5 rounded-xl bg-muted/10 text-[0.8125rem] text-foreground/60 placeholder:text-muted-foreground/25 border border-black/[0.04] focus:border-primary/15 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[0.5625rem] text-muted-foreground/35 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Upload size={8} className="opacity-40" />Proof Documents</label>
                  {satisfyDocs.length > 0 && <div className="space-y-1 mb-2">{satisfyDocs.map((doc, di) => (<div key={di} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#30A46C]/[0.04] border border-[#30A46C]/10"><FileText size={11} className="text-[#30A46C]/50 flex-shrink-0" /><span className="text-[0.6875rem] text-foreground/55 flex-1 truncate">{doc.name}</span><span className="text-[0.5625rem] text-muted-foreground/30 flex-shrink-0">{doc.size}</span><motion.button onClick={() => setSatisfyDocs(prev => prev.filter((_, i) => i !== di))} className="text-muted-foreground/25 hover:text-[#E5484D]/50 cursor-pointer flex-shrink-0" whileTap={{ scale: 0.9 }}><X size={10} /></motion.button></div>))}</div>}
                  <label className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-[#30A46C]/20 bg-[#30A46C]/[0.02] cursor-pointer hover:bg-[#30A46C]/[0.04] hover:border-[#30A46C]/30 transition-colors group">
                    <Upload size={13} className="text-[#30A46C]/30 group-hover:text-[#30A46C]/50 transition-colors" />
                    <span className="text-[0.6875rem] text-muted-foreground/35 group-hover:text-muted-foreground/55 transition-colors">Upload proof documents</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        const newDocs = Array.from(files).map((f) => ({
                          file: f,
                          name: f.name,
                          size: formatSize(f.size),
                        }));
                        setSatisfyDocs((prev) => [...prev, ...newDocs]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-black/[0.04] flex justify-end gap-2">
                <motion.button onClick={() => { setSatisfyingCondition(null); setSatisfyDocs([]); setSatisfyNote(""); }} className="px-4 py-2 rounded-xl text-[0.75rem] text-muted-foreground/50 hover:text-foreground/60 hover:bg-muted/15 transition-colors cursor-pointer" whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button onClick={satisfyCondition} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#30A46C] text-white text-[0.75rem] shadow-[0_1px_8px_rgba(48,164,108,0.2)] cursor-pointer" whileTap={{ scale: 0.95 }}><CheckCircle2 size={13} />Confirm Satisfied</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
