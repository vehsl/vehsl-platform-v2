"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { ProgressRing } from "./ProgressRing";
import {
  Eye, Ruler, Scale, Thermometer, Droplets, Shield, Tag, PackageCheck,
  ChevronRight, ChevronLeft, Check, Camera, FileText, Send, Clock,
  AlertTriangle, Microscope, ClipboardCheck, Sparkles, ArrowRight,
  X, Star, Download, MessageSquare, Zap, Layers, User, Flag,
  CircleDot, Hash, Package, Search, Filter, BarChart3
} from "lucide-react";

/*
 * PLATONIC InspectorPortal
 *
 * The inspector's world is simple:
 * "Here's a product. Test it. Tell us what you found."
 *
 * Every interaction serves ONE purpose.
 * The interface builds the report FOR you as you work.
 * You never feel lost. You always know what's next.
 *
 * Jony Ive: "Simplicity is not the absence of clutter,
 * that's a consequence of simplicity. Simplicity is somehow
 * essentially describing the purpose and place of an object and product."
 */

// ─── Test Configuration ───
interface TestSpec {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: "visual" | "dimensional" | "functional" | "compliance";
  description: string; // what to look for
  inputType: "pass-fail" | "numeric" | "rating" | "text";
  unit?: string;
  expectedMin?: number;
  expectedMax?: number;
  ratingMax?: number;
  critical?: boolean; // if fail = whole product fails
}

interface TestResult {
  testId: string;
  value: string | number | boolean;
  passed: boolean;
  notes: string;
  photos: string[];
  timestamp: number;
}

interface InspectionProduct {
  id: string;
  name: string;
  sku: string;
  seller: string;
  sellerCountry: string;
  sellerCountryCode: string;
  batchId: string;
  quantity: number;
  category: string;
  image: string;
  orderRef: string;
  priority: "urgent" | "normal" | "routine";
  receivedDate: string;
  tests: TestSpec[];
}

interface CompletedInspection {
  id: string;
  productName: string;
  batchId: string;
  rating: number;
  status: "submitted" | "published" | "rejected";
  completedAt: string;
  testsPassed: number;
  testsTotal: number;
  sku: string;
  seller: string;
  sellerCountryCode: string;
  quantity: number;
  inspectorNote: string;
  managerNote?: string;
  productImage: string;
  testResults: {
    name: string;
    category: "visual" | "dimensional" | "functional" | "compliance";
    passed: boolean;
    value: string;
    critical: boolean;
    photo?: string;
    note?: string;
  }[];
}

// ─── Category styling ───
const categoryConfig: Record<string, { color: string; label: string }> = {
  visual: { color: "#8B5CF6", label: "Visual" },
  dimensional: { color: "#0171E3", label: "Dimensional" },
  functional: { color: "#30A46C", label: "Functional" },
  compliance: { color: "#D97706", label: "Compliance" },
};

const priorityEmoji: Record<string, string> = {
  urgent: "!",
  normal: "~",
  routine: ".",
};

// ─── Mock test specs ───
const standardTests: TestSpec[] = [
  { id: "visual-appearance", name: "Appearance", icon: <Eye size={18} />, category: "visual", description: "Check for scratches, dents, discoloration, or any surface defects. The product should look clean and uniform.", inputType: "pass-fail", critical: true },
  { id: "visual-color", name: "Color Match", icon: <Droplets size={18} />, category: "visual", description: "Compare against the approved color swatch. Color should be consistent across all units.", inputType: "rating", ratingMax: 5 },
  { id: "visual-labeling", name: "Label Accuracy", icon: <Tag size={18} />, category: "visual", description: "All labels must be present, legible, and correctly positioned. Check product name, weight, origin, and barcodes.", inputType: "pass-fail", critical: true },
  { id: "dim-length", name: "Length", icon: <Ruler size={18} />, category: "dimensional", description: "Measure the longest dimension. Use the calibrated digital caliper.", inputType: "numeric", unit: "mm", expectedMin: 148, expectedMax: 152 },
  { id: "dim-weight", name: "Weight", icon: <Scale size={18} />, category: "dimensional", description: "Place on the calibrated scale. Record the average of 3 readings.", inputType: "numeric", unit: "g", expectedMin: 245, expectedMax: 255 },
  { id: "func-operation", name: "Functionality", icon: <Zap size={18} />, category: "functional", description: "Power on and test all primary functions. Each feature should respond within 2 seconds.", inputType: "pass-fail", critical: true },
  { id: "func-durability", name: "Durability", icon: <Shield size={18} />, category: "functional", description: "Perform the standard stress test: 3 drops from 1m onto hard surface. Check for damage after each drop.", inputType: "rating", ratingMax: 5 },
  { id: "comp-packaging", name: "Packaging", icon: <PackageCheck size={18} />, category: "compliance", description: "Packaging must meet shipping standards. Check cushioning, seal integrity, and regulatory markings.", inputType: "pass-fail" },
  { id: "comp-safety", name: "Safety Cert", icon: <Shield size={18} />, category: "compliance", description: "Verify all required safety certifications are present and valid. Cross-reference with the compliance database.", inputType: "pass-fail", critical: true },
  { id: "comp-overall", name: "Overall Notes", icon: <MessageSquare size={18} />, category: "compliance", description: "Any additional observations, concerns, or recommendations for the manager.", inputType: "text" },
];

// ─── Mock data ───
const mockQueue: InspectionProduct[] = [
  {
    id: "insp-1", name: "Wireless Earbuds Pro", sku: "WEP-4200", seller: "ShenTech Audio",
    sellerCountry: "China", sellerCountryCode: "cn", batchId: "B-2847", quantity: 500,
    category: "Electronics", image: "", orderRef: "ORD-8841", priority: "urgent",
    receivedDate: "Mar 17, 2026", tests: standardTests,
  },
  {
    id: "insp-2", name: "Organic Matcha Powder", sku: "OMP-1100", seller: "Uji Gardens",
    sellerCountry: "Japan", sellerCountryCode: "jp", batchId: "B-2903", quantity: 200,
    category: "Food & Beverage", image: "", orderRef: "ORD-8856", priority: "normal",
    receivedDate: "Mar 16, 2026", tests: standardTests.filter(t => !["func-operation", "func-durability"].includes(t.id)),
  },
  {
    id: "insp-3", name: "Bamboo Cutlery Set", sku: "BCS-7700", seller: "EcoLife Vietnam",
    sellerCountry: "Vietnam", sellerCountryCode: "vn", batchId: "B-2915", quantity: 1000,
    category: "Home & Kitchen", image: "", orderRef: "ORD-8861", priority: "routine",
    receivedDate: "Mar 15, 2026", tests: standardTests,
  },
];

const mockCompleted: CompletedInspection[] = [
  {
    id: "c-1", productName: "Stainless Steel Bottle", batchId: "B-2780", rating: 4.2, status: "published",
    completedAt: "Mar 14", testsPassed: 9, testsTotal: 10, sku: "SSB-3100", seller: "MetalCraft Co.",
    sellerCountryCode: "in", quantity: 300, inspectorNote: "Overall excellent quality. Minor color variation on 2 units.",
    managerNote: "Approved for listing. Color variation within acceptable tolerance.",
    productImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    testResults: [
      { name: "Appearance", category: "visual", passed: true, value: "Pass", critical: true, photo: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=400&fit=crop", note: "Clean finish, no dents" },
      { name: "Color Match", category: "visual", passed: true, value: "4/5", critical: false, note: "Slight variation in 2 of 300 units" },
      { name: "Label Accuracy", category: "visual", passed: true, value: "Pass", critical: true, photo: "https://images.unsplash.com/photo-1647980231285-f18523150ad3?w=600&h=400&fit=crop", note: "All labels present and legible" },
      { name: "Length", category: "dimensional", passed: true, value: "150 mm", critical: false },
      { name: "Weight", category: "dimensional", passed: true, value: "248 g", critical: false },
      { name: "Functionality", category: "functional", passed: true, value: "Pass", critical: true, note: "Lid seal tested — no leaks" },
      { name: "Durability", category: "functional", passed: true, value: "5/5", critical: false, note: "3 drops from 1m — zero damage" },
      { name: "Packaging", category: "compliance", passed: true, value: "Pass", critical: false, photo: "https://images.unsplash.com/photo-1567570670849-79db9c45cd9d?w=600&h=400&fit=crop" },
      { name: "Safety Cert", category: "compliance", passed: false, value: "Fail", critical: true, note: "BIS certification expired — renewal submitted" },
      { name: "Overall Notes", category: "compliance", passed: true, value: "High quality batch. Recommend approval pending cert renewal.", critical: false },
    ],
  },
  {
    id: "c-2", productName: "Silk Pillowcase Set", batchId: "B-2765", rating: 4.8, status: "submitted",
    completedAt: "Mar 13", testsPassed: 10, testsTotal: 10, sku: "SPC-2200", seller: "Suzhou Silk House",
    sellerCountryCode: "cn", quantity: 150, inspectorNote: "Exceptional quality. Best batch this month.",
    productImage: "https://images.unsplash.com/photo-1619043518725-bc74b9d02c52?w=400&h=400&fit=crop",
    testResults: [
      { name: "Appearance", category: "visual", passed: true, value: "Pass", critical: true, photo: "https://images.unsplash.com/photo-1619043518725-bc74b9d02c52?w=600&h=400&fit=crop", note: "Flawless finish" },
      { name: "Color Match", category: "visual", passed: true, value: "5/5", critical: false },
      { name: "Label Accuracy", category: "visual", passed: true, value: "Pass", critical: true },
      { name: "Length", category: "dimensional", passed: true, value: "150 mm", critical: false },
      { name: "Weight", category: "dimensional", passed: true, value: "250 g", critical: false },
      { name: "Functionality", category: "functional", passed: true, value: "Pass", critical: true },
      { name: "Durability", category: "functional", passed: true, value: "5/5", critical: false },
      { name: "Packaging", category: "compliance", passed: true, value: "Pass", critical: false, photo: "https://images.unsplash.com/photo-1567570670849-79db9c45cd9d?w=600&h=400&fit=crop" },
      { name: "Safety Cert", category: "compliance", passed: true, value: "Pass", critical: true },
      { name: "Overall Notes", category: "compliance", passed: true, value: "Premium quality throughout.", critical: false },
    ],
  },
  {
    id: "c-3", productName: "LED Desk Lamp", batchId: "B-2701", rating: 2.9, status: "rejected",
    completedAt: "Mar 12", testsPassed: 6, testsTotal: 10, sku: "LDL-5500", seller: "BrightPath Electronics",
    sellerCountryCode: "tw", quantity: 400, inspectorNote: "Multiple failures. Recommend returning batch to seller.",
    managerNote: "Rejected. Seller notified — replacement batch requested.",
    productImage: "https://images.unsplash.com/photo-1766411503489-c6fe7b008bd6?w=400&h=400&fit=crop",
    testResults: [
      { name: "Appearance", category: "visual", passed: false, value: "Fail", critical: true, photo: "https://images.unsplash.com/photo-1581056771085-3ce30d907416?w=600&h=400&fit=crop", note: "Visible scratches on 40% of units" },
      { name: "Color Match", category: "visual", passed: true, value: "3/5", critical: false },
      { name: "Label Accuracy", category: "visual", passed: false, value: "Fail", critical: true, note: "Wrong voltage listed on 12 units" },
      { name: "Length", category: "dimensional", passed: true, value: "149 mm", critical: false },
      { name: "Weight", category: "dimensional", passed: true, value: "252 g", critical: false },
      { name: "Functionality", category: "functional", passed: false, value: "Fail", critical: true, note: "Dimmer switch unresponsive on 8% of units" },
      { name: "Durability", category: "functional", passed: false, value: "2/5", critical: false, note: "Arm joint loosened after 2nd drop" },
      { name: "Packaging", category: "compliance", passed: true, value: "Pass", critical: false },
      { name: "Safety Cert", category: "compliance", passed: true, value: "Pass", critical: true },
      { name: "Overall Notes", category: "compliance", passed: true, value: "Significant quality issues. Not ready for market.", critical: false },
    ],
  },
];

// ─── Portal ───
type View = "queue" | "inspecting" | "review" | "datasheet" | "reportDetail";

export function InspectorPortal() {
  const [view, setView] = useState<View>("queue");
  const [activeProduct, setActiveProduct] = useState<InspectionProduct | null>(null);
  const [currentTestIdx, setCurrentTestIdx] = useState(0);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [managerNote, setManagerNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CompletedInspection | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Start inspection
  const startInspection = useCallback((product: InspectionProduct) => {
    setActiveProduct(product);
    setCurrentTestIdx(0);
    setResults({});
    setView("inspecting");
    setSubmitted(false);
    setManagerNote("");
  }, []);

  // Record a test result
  const recordResult = useCallback((testId: string, value: string | number | boolean, passed: boolean, notes = "") => {
    setResults(prev => ({
      ...prev,
      [testId]: { testId, value, passed, notes, photos: [], timestamp: Date.now() },
    }));
  }, []);

  // Computed
  const totalTests = activeProduct?.tests.length ?? 0;
  const completedTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.passed).length;
  const failedTests = completedTests - passedTests;
  const overallRating = totalTests > 0 ? ((passedTests / totalTests) * 5) : 0;
  const currentTest = activeProduct?.tests[currentTestIdx];

  // Auto-determine pass for numeric
  const checkNumericPass = (val: number, test: TestSpec) => {
    if (test.expectedMin !== undefined && test.expectedMax !== undefined) {
      return val >= test.expectedMin && val <= test.expectedMax;
    }
    return true;
  };

  const filteredQueue = mockQueue.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.seller.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── QUEUE VIEW ───
  if (view === "queue") {
    return (
      <div className="space-y-8">
        {/* Hero header — what does the inspector need to know? */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0.36, 1] }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/8 flex items-center justify-center">
              <Microscope size={22} className="text-[#8B5CF6]/70" />
            </div>
            <div>
              <h1 className="text-foreground tracking-tight">Inspection Queue</h1>
              <p className="text-[0.875rem] text-muted-foreground/50 mt-0.5">
                {mockQueue.length} products waiting · {mockCompleted.length} completed this week
              </p>
            </div>
          </div>
        </motion.div>

        {/* At-a-glance stats — the pulse */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
        >
          {/* HERO — Awaiting is THE number that drives the inspector's day */}
          <motion.div
            className="bg-card rounded-3xl p-8 sm:p-10 border border-border/30 relative overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-[#E5484D]/8 flex items-center justify-center">
                    <Clock size={18} className="text-[#E5484D]/70" />
                  </div>
                  <span className="text-[0.875rem] text-muted-foreground/50">Awaiting Inspection</span>
                </div>
                <p className="text-[3.5rem] text-foreground tracking-tighter tabular-nums leading-none mb-3">{mockQueue.length}</p>
                <div className="flex items-center gap-2.5">
                  {mockQueue.filter(p => p.priority === "urgent").length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5484D]/6 text-[#E5484D]/70 text-[0.75rem]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-pulse" />
                      {mockQueue.filter(p => p.priority === "urgent").length} urgent
                    </span>
                  )}
                  <span className="text-[0.75rem] text-muted-foreground/25">{mockQueue.filter(p => p.priority === "normal").length} normal · {mockQueue.filter(p => p.priority === "routine").length} routine</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#E5484D]/[0.02] blur-2xl pointer-events-none" />
          </motion.div>

          {/* Secondary — quieter, stacked, reference-only */}
          <div className="flex sm:flex-col gap-3 sm:w-[180px]">
            <motion.div
              className="flex-1 bg-card rounded-2xl p-5 border border-border/15"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star size={12} className="text-[#FFB224]/50" />
                <span className="text-[0.6875rem] text-muted-foreground/35">Avg Rating</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-[1.5rem] text-foreground/60 tracking-tight tabular-nums leading-none">
                  {(mockCompleted.reduce((a, c) => a + c.rating, 0) / mockCompleted.length).toFixed(1)}
                </p>
                <span className="text-[0.625rem] text-muted-foreground/20">/ 5</span>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 bg-card rounded-2xl p-5 border border-border/15"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Check size={12} className="text-[#30A46C]/40" />
                <span className="text-[0.6875rem] text-muted-foreground/35">Done this week</span>
              </div>
              <p className="text-[1.5rem] text-foreground/40 tracking-tight tabular-nums leading-none">{mockCompleted.length}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex-1 flex items-center gap-2.5 bg-card rounded-2xl px-5 py-3.5 border border-border/30 focus-within:border-primary/20 transition-all">
            <Search size={16} className="text-muted-foreground/35" />
            <input
              type="text"
              placeholder="Search products, batches, or sellers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[0.875rem] text-foreground placeholder:text-muted-foreground/30"
            />
          </div>
        </motion.div>

        {/* The Queue — each product is a clear, actionable card */}
        <div className="space-y-3">
          {filteredQueue.map((product, i) => (
            <motion.div
              key={product.id}
              className="bg-card rounded-3xl border border-border/30 overflow-hidden hover:border-border/60 transition-all group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
            >
              <div className="p-6 sm:p-7">
                {/* Top row: priority signal + product identity */}
                <div className="flex items-start gap-5">
                  {/* Priority beacon — the FIRST thing you see */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div
                      className={`w-3 h-3 rounded-full ${product.priority === "urgent" ? "animate-pulse" : ""}`}
                      style={{
                        backgroundColor: product.priority === "urgent" ? "#E5484D" : product.priority === "normal" ? "#FFB224" : "#30A46C",
                      }}
                    />
                    <span className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest">
                      {product.priority === "urgent" ? "URG" : product.priority === "normal" ? "NRM" : "RTN"}
                    </span>
                  </div>

                  {/* Product identity — second most important */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-foreground tracking-tight truncate">{product.name}</h3>
                      <span className="text-[0.6875rem] text-muted-foreground/25 tabular-nums flex-shrink-0">{product.sku}</span>
                    </div>

                    {/* Context row — quiet but available */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={`https://flagcdn.com/16x12/${product.sellerCountryCode}.png`}
                          alt={product.sellerCountry}
                          className="w-4 h-3 rounded-[2px] object-cover"
                        />
                        <span className="text-[0.8125rem] text-muted-foreground/50">{product.seller}</span>
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/25">|</span>
                      <div className="flex items-center gap-1.5">
                        <Hash size={11} className="text-muted-foreground/25" />
                        <span className="text-[0.8125rem] text-muted-foreground/40 tabular-nums">{product.batchId}</span>
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/25">|</span>
                      <div className="flex items-center gap-1.5">
                        <Package size={11} className="text-muted-foreground/25" />
                        <span className="text-[0.8125rem] text-muted-foreground/40">{product.quantity} units</span>
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground/25">|</span>
                      <span className="text-[0.8125rem] text-muted-foreground/30">{product.tests.length} tests</span>
                    </div>
                  </div>

                  {/* Action — the clear next step */}
                  <BounceButton
                    variant="primary"
                    size="md"
                    icon={<ClipboardCheck size={16} />}
                    onClick={() => startInspection(product)}
                    energyWeight={2}
                  >
                    Begin
                  </BounceButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completed inspections — quieter, it's history */}
        {mockCompleted.length > 0 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-foreground/50 tracking-tight mb-4 flex items-center gap-2.5">
              <span>Recent Reports</span>
              <span className="text-[0.6875rem] text-muted-foreground/25">{mockCompleted.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mockCompleted.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="bg-card rounded-2xl p-5 border border-border/20 hover:border-border/40 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => { setSelectedReport(item); setView("reportDetail"); }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[0.75rem] text-muted-foreground/30 tabular-nums">{item.batchId}</span>
                    <StatusPill
                      status={item.status === "published" ? "success" : item.status === "submitted" ? "pending" : "error"}
                      label={item.status === "published" ? "Published" : item.status === "submitted" ? "Pending" : "Rejected"}
                    />
                  </div>
                  <p className="text-[0.875rem] text-foreground/65 mb-2 truncate">{item.productName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= Math.round(item.rating) ? "text-[#FFB224]" : "text-muted-foreground/10"}
                          fill={s <= Math.round(item.rating) ? "#FFB224" : "none"}
                        />
                      ))}
                      <span className="text-[0.6875rem] text-muted-foreground/35 ml-1 tabular-nums">{item.rating}</span>
                    </div>
                    <span className="text-[0.625rem] text-muted-foreground/25">{item.completedAt}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ─── REPORT DETAIL VIEW ───
  if (view === "reportDetail" && selectedReport) {
    const rpt = selectedReport;
    const photosInReport = rpt.testResults.filter(t => t.photo);
    const failedTests = rpt.testResults.filter(t => !t.passed);
    const criticalFails = failedTests.filter(t => t.critical);

    return (
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="bg-card rounded-3xl border border-border/30 p-6 sm:p-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start gap-5">
            <motion.button
              onClick={() => { setView("queue"); setSelectedReport(null); }}
              className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors flex-shrink-0 mt-1"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={16} className="text-muted-foreground/50" />
            </motion.button>

            {/* Product image + info */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-muted/10">
              <img src={rpt.productImage} alt={rpt.productName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-foreground tracking-tight truncate">{rpt.productName}</h2>
                <StatusPill
                  status={rpt.status === "published" ? "success" : rpt.status === "submitted" ? "pending" : "error"}
                  label={rpt.status === "published" ? "Published" : rpt.status === "submitted" ? "Pending Review" : "Rejected"}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <img src={`https://flagcdn.com/16x12/${rpt.sellerCountryCode}.png`} alt="" className="w-3.5 h-2.5 rounded-[1px]" />
                  <span className="text-[0.8125rem] text-muted-foreground/40">{rpt.seller}</span>
                </div>
                <span className="text-[0.75rem] text-muted-foreground/15">|</span>
                <span className="text-[0.8125rem] text-muted-foreground/30 tabular-nums">{rpt.sku}</span>
                <span className="text-[0.75rem] text-muted-foreground/15">|</span>
                <span className="text-[0.8125rem] text-muted-foreground/30 tabular-nums">{rpt.batchId}</span>
                <span className="text-[0.75rem] text-muted-foreground/15">|</span>
                <span className="text-[0.8125rem] text-muted-foreground/25">{rpt.quantity} units</span>
              </div>
            </div>

            {/* Rating — hero number */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} className={s <= Math.round(rpt.rating) ? "text-[#FFB224]" : "text-muted-foreground/10"} fill={s <= Math.round(rpt.rating) ? "#FFB224" : "none"} />
                ))}
              </div>
              <span className="text-[1.75rem] text-foreground tracking-tight tabular-nums leading-none">{rpt.rating}</span>
              <span className="text-[0.5625rem] text-muted-foreground/25 mt-1">{rpt.completedAt}</span>
            </div>
          </div>
        </motion.div>

        {/* Critical failures — MOST IMPORTANT if any exist */}
        {criticalFails.length > 0 && (
          <motion.div
            className="bg-[#E5484D]/[0.03] rounded-3xl border border-[#E5484D]/10 p-6 sm:p-7"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#E5484D]/8 flex items-center justify-center">
                <AlertTriangle size={15} className="text-[#E5484D]/70" />
              </div>
              <span className="text-[0.875rem] text-[#E5484D]/70">{criticalFails.length} Critical Failure{criticalFails.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {criticalFails.map((t, i) => (
                <div key={i} className="flex items-start gap-4">
                  {t.photo ? (
                    <motion.div
                      className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setExpandedPhoto(t.photo!)}
                    >
                      <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                    </motion.div>
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-[#E5484D]/6 flex items-center justify-center flex-shrink-0">
                      <X size={14} className="text-[#E5484D]/40" />
                    </div>
                  )}
                  <div>
                    <p className="text-[0.875rem] text-foreground/60">{t.name}</p>
                    {t.note && <p className="text-[0.8125rem] text-muted-foreground/40 mt-0.5">{t.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Photo evidence gallery */}
        {photosInReport.length > 0 && (
          <motion.div
            className="bg-card rounded-3xl border border-border/30 p-6 sm:p-7"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <Camera size={15} className="text-muted-foreground/30" />
              <span className="text-[0.875rem] text-foreground/50">Photo Evidence</span>
              <span className="text-[0.625rem] text-muted-foreground/20">{photosInReport.length} photos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photosInReport.map((t, i) => (
                <motion.div
                  key={i}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-[3/2]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setExpandedPhoto(t.photo!)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                >
                  <img src={t.photo!} alt={t.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[0.6875rem] text-white/90">{t.name}</p>
                  </div>
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${t.passed ? "bg-[#30A46C]" : "bg-[#E5484D]"}`}>
                    {t.passed ? <Check size={10} className="text-white" /> : <X size={10} className="text-white" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full test results table */}
        <motion.div
          className="bg-card rounded-3xl border border-border/30 p-6 sm:p-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <ClipboardCheck size={15} className="text-muted-foreground/30" />
              <span className="text-[0.875rem] text-foreground/50">Test Results</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.75rem] text-[#30A46C]/60">{rpt.testsPassed} passed</span>
              {rpt.testsTotal - rpt.testsPassed > 0 && (
                <span className="text-[0.75rem] text-[#E5484D]/60">{rpt.testsTotal - rpt.testsPassed} failed</span>
              )}
            </div>
          </div>

          {Object.entries(categoryConfig).map(([catKey, catCfg]) => {
            const catTests = rpt.testResults.filter(t => t.category === catKey);
            if (catTests.length === 0) return null;
            return (
              <div key={catKey} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catCfg.color }} />
                  <span className="text-[0.75rem] text-muted-foreground/35">{catCfg.label}</span>
                </div>
                <div className="space-y-1">
                  {catTests.map((test, i) => (
                    <motion.div
                      key={i}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl ${
                        test.passed ? "bg-[#30A46C]/[0.02]" : "bg-[#E5484D]/[0.03]"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.18 + i * 0.02 }}
                    >
                      {test.passed ? <Check size={13} className="text-[#30A46C]/50" /> : <X size={13} className="text-[#E5484D]/50" />}
                      <span className="text-[0.8125rem] text-foreground/55 flex-1">{test.name}</span>
                      {test.critical && <span className="text-[0.5rem] text-[#E5484D]/35 uppercase tracking-wider">Critical</span>}
                      <span className="text-[0.8125rem] tabular-nums text-foreground/35">{test.value}</span>
                      {test.photo && (
                        <motion.button
                          className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => setExpandedPhoto(test.photo!)}
                        >
                          <img src={test.photo} alt="" className="w-full h-full object-cover" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Inspector & manager notes */}
        <motion.div
          className="bg-card rounded-3xl border border-border/30 p-6 sm:p-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <User size={13} className="text-muted-foreground/30" />
                <span className="text-[0.75rem] text-muted-foreground/35">Inspector Note</span>
              </div>
              <p className="text-[0.9375rem] text-foreground/50 leading-relaxed pl-5">{rpt.inspectorNote}</p>
            </div>
            {rpt.managerNote && (
              <div className="pt-4 border-t border-border/15">
                <div className="flex items-center gap-2 mb-2.5">
                  <Layers size={13} className="text-primary/30" />
                  <span className="text-[0.75rem] text-primary/35">Manager Response</span>
                </div>
                <p className="text-[0.9375rem] text-foreground/50 leading-relaxed pl-5">{rpt.managerNote}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Expanded photo modal */}
        <AnimatePresence>
          {expandedPhoto && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedPhoto(null)}
              />
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-[90vw] max-h-[85vh]"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <div className="relative">
                  <img src={expandedPhoto} alt="Inspection evidence" className="rounded-2xl max-h-[80vh] object-contain shadow-2xl" />
                  <motion.button
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={() => setExpandedPhoto(null)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} className="text-white" />
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── INSPECTING VIEW ───
  if ((view === "inspecting" || view === "datasheet") && activeProduct && currentTest) {
    const progress = (completedTests / totalTests) * 100;
    const isLastTest = currentTestIdx === totalTests - 1;
    const currentResult = results[currentTest.id];
    const catConfig = categoryConfig[currentTest.category];

    return (
      <div className="space-y-6">
        {/* Compact header — product context, always visible but never dominant */}
        <motion.div
          className="bg-card rounded-3xl border border-border/30 p-5 sm:p-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-5">
            {/* Back */}
            <motion.button
              onClick={() => setView("queue")}
              className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors flex-shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={16} className="text-muted-foreground/50" />
            </motion.button>

            {/* Product identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-foreground tracking-tight truncate">{activeProduct.name}</h3>
                <span className="text-[0.6875rem] text-muted-foreground/20 tabular-nums">{activeProduct.batchId}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={`https://flagcdn.com/16x12/${activeProduct.sellerCountryCode}.png`}
                  alt=""
                  className="w-3.5 h-2.5 rounded-[1px]"
                />
                <span className="text-[0.75rem] text-muted-foreground/35">{activeProduct.seller}</span>
              </div>
            </div>

            {/* Progress ring — the PULSE of where you are */}
            <div className="flex items-center gap-5">
              <ProgressRing
                value={completedTests}
                max={totalTests}
                size={52}
                strokeWidth={4}
                color="#0171E3"
                bgColor="rgba(0,0,0,0.04)"
              />

              {/* View toggle */}
              <div className="flex bg-muted/15 rounded-xl p-0.5">
                {[
                  { key: "inspecting" as View, icon: <ClipboardCheck size={14} />, label: "Test" },
                  { key: "datasheet" as View, icon: <FileText size={14} />, label: "Sheet" },
                ].map(tab => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setView(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-all ${
                      view === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/40 hover:text-muted-foreground/70"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar — gentle, the breath of progress */}
          <div className="mt-5 h-1 bg-muted/15 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          {/* Test step indicators */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-thin pb-1">
            {activeProduct.tests.map((test, idx) => {
              const done = !!results[test.id];
              const active = idx === currentTestIdx;
              const passed = done && results[test.id].passed;
              const failed = done && !results[test.id].passed;
              const tCat = categoryConfig[test.category];
              return (
                <motion.button
                  key={test.id}
                  onClick={() => setCurrentTestIdx(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.625rem] cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
                    active ? "bg-card shadow-sm border border-border/40" :
                    done ? "bg-transparent" : "bg-transparent"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  style={{ opacity: active ? 1 : done ? 0.7 : 0.3 }}
                >
                  {done ? (
                    passed ? <Check size={10} className="text-[#30A46C]" /> : <X size={10} className="text-[#E5484D]" />
                  ) : (
                    <CircleDot size={9} style={{ color: active ? tCat.color : undefined }} className={active ? "" : "text-muted-foreground/20"} />
                  )}
                  <span className={active ? "text-foreground/70" : done ? "text-muted-foreground/40" : "text-muted-foreground/20"}>
                    {test.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ─── DATA SHEET VIEW ─── */}
        <AnimatePresence mode="wait">
          {view === "datasheet" ? (
            <motion.div
              key="datasheet"
              className="bg-card rounded-3xl border border-border/30 p-7 sm:p-9"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-foreground tracking-tight">Data Sheet</h2>
                  <p className="text-[0.8125rem] text-muted-foreground/40 mt-1">
                    {completedTests} of {totalTests} tests recorded
                  </p>
                </div>
                {completedTests === totalTests && (
                  <BounceButton
                    variant="success"
                    icon={<Send size={14} />}
                    onClick={() => setShowSubmitModal(true)}
                    energyWeight={3}
                  >
                    Submit to Manager
                  </BounceButton>
                )}
              </div>

              {/* Rating summary */}
              <div className="flex items-center gap-8 p-6 rounded-2xl bg-background/50 border border-border/15 mb-8">
                <ProgressRing
                  value={passedTests}
                  max={totalTests}
                  size={90}
                  strokeWidth={6}
                  color={overallRating >= 4 ? "#30A46C" : overallRating >= 3 ? "#FFB224" : "#E5484D"}
                  bgColor="rgba(0,0,0,0.04)"
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={18}
                        className={s <= Math.round(overallRating) ? "text-[#FFB224]" : "text-muted-foreground/10"}
                        fill={s <= Math.round(overallRating) ? "#FFB224" : "none"}
                      />
                    ))}
                    <span className="text-[1rem] text-foreground tabular-nums ml-1">{overallRating.toFixed(1)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[0.8125rem] text-[#30A46C]/70">{passedTests} passed</span>
                    {failedTests > 0 && <span className="text-[0.8125rem] text-[#E5484D]/70">{failedTests} failed</span>}
                    {(totalTests - completedTests) > 0 && <span className="text-[0.8125rem] text-muted-foreground/30">{totalTests - completedTests} remaining</span>}
                  </div>
                </div>
              </div>

              {/* Results by category */}
              {Object.entries(categoryConfig).map(([catKey, catCfg]) => {
                const catTests = activeProduct.tests.filter(t => t.category === catKey);
                if (catTests.length === 0) return null;
                return (
                  <div key={catKey} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catCfg.color }} />
                      <span className="text-[0.8125rem] text-foreground/50">{catCfg.label}</span>
                      <span className="text-[0.625rem] text-muted-foreground/20">{catTests.filter(t => results[t.id]).length}/{catTests.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {catTests.map(test => {
                        const result = results[test.id];
                        return (
                          <motion.div
                            key={test.id}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                              result ? (result.passed ? "bg-[#30A46C]/[0.03]" : "bg-[#E5484D]/[0.03]") : "bg-muted/6"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <span className="text-muted-foreground/30">{test.icon}</span>
                            <span className="text-[0.8125rem] text-foreground/55 flex-1">{test.name}</span>
                            {test.critical && <span className="text-[0.5rem] text-[#E5484D]/40 uppercase tracking-wider">Critical</span>}
                            {result ? (
                              <div className="flex items-center gap-3">
                                <span className="text-[0.8125rem] tabular-nums text-foreground/40">
                                  {typeof result.value === "boolean" ? (result.value ? "Pass" : "Fail") :
                                   typeof result.value === "number" ? `${result.value}${test.unit ? ` ${test.unit}` : ""}` :
                                   result.value === "pass" ? "Pass" : result.value === "fail" ? "Fail" :
                                   typeof result.value === "string" && result.value.length > 30 ? result.value.slice(0, 30) + "..." : String(result.value)}
                                </span>
                                {result.passed ? <Check size={14} className="text-[#30A46C]" /> : <X size={14} className="text-[#E5484D]" />}
                              </div>
                            ) : (
                              <span className="text-[0.6875rem] text-muted-foreground/20">—</span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* ─── ACTIVE TEST CARD ─── */
            <motion.div
              key={`test-${currentTestIdx}`}
              className="bg-card rounded-3xl border border-border/30 overflow-hidden"
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              {/* Category band — instant recognition */}
              <div className="h-1 w-full" style={{ backgroundColor: catConfig.color }} />

              <div className="p-7 sm:p-9">
                {/* Test identity */}
                <div className="flex items-start gap-5 mb-8">
                  <motion.div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${catConfig.color}10` }}
                    initial={{ scale: 0.8, rotate: -5 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <span style={{ color: catConfig.color }}>{currentTest.icon}</span>
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[0.6875rem] px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${catConfig.color}08`, color: `${catConfig.color}99` }}>
                        {catConfig.label}
                      </span>
                      <span className="text-[0.6875rem] text-muted-foreground/20 tabular-nums">
                        {currentTestIdx + 1} of {totalTests}
                      </span>
                      {currentTest.critical && (
                        <span className="text-[0.5625rem] px-2 py-0.5 rounded-md bg-[#E5484D]/6 text-[#E5484D]/60 uppercase tracking-wider">
                          Critical
                        </span>
                      )}
                    </div>
                    <h2 className="text-foreground tracking-tight">{currentTest.name}</h2>
                  </div>
                </div>

                {/* What to look for — the INSTRUCTION */}
                <motion.div
                  className="p-5 rounded-2xl bg-background/50 border border-border/15 mb-8"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <Eye size={13} className="text-muted-foreground/30" />
                    <span className="text-[0.6875rem] text-muted-foreground/35 uppercase tracking-wider">What to check</span>
                  </div>
                  <p className="text-[0.9375rem] text-foreground/55 leading-relaxed">{currentTest.description}</p>
                </motion.div>

                {/* Input area — THE ACTION */}
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {currentTest.inputType === "pass-fail" && (
                    <div className="flex gap-3">
                      {[
                        { val: "pass", label: "Pass", color: "#30A46C", icon: <Check size={22} /> },
                        { val: "fail", label: "Fail", color: "#E5484D", icon: <X size={22} /> },
                      ].map(opt => {
                        const isSelected = currentResult?.value === opt.val;
                        return (
                          <motion.button
                            key={opt.val}
                            onClick={() => recordResult(currentTest.id, opt.val, opt.val === "pass")}
                            className={`flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected ? "shadow-lg" : "border-border/20 hover:border-border/50"
                            }`}
                            style={{
                              borderColor: isSelected ? opt.color : undefined,
                              backgroundColor: isSelected ? `${opt.color}06` : undefined,
                            }}
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ y: -2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          >
                            <motion.div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center"
                              style={{
                                backgroundColor: isSelected ? `${opt.color}15` : `${opt.color}06`,
                              }}
                              animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <span style={{ color: opt.color, opacity: isSelected ? 1 : 0.4 }}>{opt.icon}</span>
                            </motion.div>
                            <span
                              className="text-[0.9375rem]"
                              style={{ color: isSelected ? opt.color : "rgba(0,0,0,0.3)" }}
                            >
                              {opt.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {currentTest.inputType === "numeric" && (
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder={`Enter value${currentTest.unit ? ` (${currentTest.unit})` : ""}`}
                            className="w-full bg-background/50 border-2 border-border/20 rounded-2xl px-6 py-5 text-[1.5rem] text-center text-foreground tabular-nums outline-none focus:border-primary/30 transition-all"
                            value={currentResult?.value !== undefined ? String(currentResult.value) : ""}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                recordResult(currentTest.id, val, checkNumericPass(val, currentTest));
                              }
                            }}
                          />
                        </div>
                      </div>
                      {currentTest.expectedMin !== undefined && currentTest.expectedMax !== undefined && (
                        <div className="flex items-center justify-center gap-3 text-[0.8125rem]">
                          <span className="text-muted-foreground/30">Expected range:</span>
                          <span className="px-3 py-1.5 rounded-xl bg-primary/[0.04] text-primary/60 tabular-nums">
                            {currentTest.expectedMin} – {currentTest.expectedMax} {currentTest.unit}
                          </span>
                          {currentResult && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`px-3 py-1.5 rounded-xl text-[0.8125rem] ${
                                currentResult.passed ? "bg-[#30A46C]/6 text-[#30A46C]" : "bg-[#E5484D]/6 text-[#E5484D]"
                              }`}
                            >
                              {currentResult.passed ? "Within range" : "Out of range"}
                            </motion.span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentTest.inputType === "rating" && (
                    <div className="flex flex-col items-center gap-5">
                      <div className="flex gap-3">
                        {Array.from({ length: currentTest.ratingMax || 5 }).map((_, idx) => {
                          const starVal = idx + 1;
                          const isFilled = currentResult && Number(currentResult.value) >= starVal;
                          return (
                            <motion.button
                              key={idx}
                              onClick={() => recordResult(currentTest.id, starVal, starVal >= 3)}
                              className="cursor-pointer p-2"
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.15, y: -3 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            >
                              <Star
                                size={36}
                                className={isFilled ? "text-[#FFB224]" : "text-muted-foreground/10"}
                                fill={isFilled ? "#FFB224" : "none"}
                              />
                            </motion.button>
                          );
                        })}
                      </div>
                      {currentResult && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-[0.8125rem] px-4 py-2 rounded-xl ${
                            Number(currentResult.value) >= 4 ? "bg-[#30A46C]/6 text-[#30A46C]/70" :
                            Number(currentResult.value) >= 3 ? "bg-[#FFB224]/6 text-[#D97706]/70" :
                            "bg-[#E5484D]/6 text-[#E5484D]/70"
                          }`}
                        >
                          {Number(currentResult.value) >= 4 ? "Excellent" : Number(currentResult.value) >= 3 ? "Acceptable" : "Below standard"}
                        </motion.span>
                      )}
                    </div>
                  )}

                  {currentTest.inputType === "text" && (
                    <textarea
                      placeholder="Type your observations here..."
                      className="w-full bg-background/50 border-2 border-border/20 rounded-2xl px-6 py-5 text-[0.9375rem] text-foreground outline-none focus:border-primary/30 transition-all resize-none min-h-[160px]"
                      value={currentResult?.value !== undefined ? String(currentResult.value) : ""}
                      onChange={e => recordResult(currentTest.id, e.target.value, e.target.value.length > 0)}
                    />
                  )}
                </motion.div>

                {/* Navigation — simple, clear */}
                <motion.div
                  className="flex items-center justify-between pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <BounceButton
                    variant="ghost"
                    size="md"
                    icon={<ChevronLeft size={16} />}
                    onClick={() => setCurrentTestIdx(Math.max(0, currentTestIdx - 1))}
                    className={currentTestIdx === 0 ? "opacity-30 pointer-events-none" : ""}
                  >
                    Previous
                  </BounceButton>

                  {/* Quick note for this test */}
                  <motion.button
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.75rem] text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/10 transition-all cursor-pointer"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera size={13} />
                    <span>Add photo</span>
                  </motion.button>

                  {isLastTest && completedTests === totalTests ? (
                    <BounceButton
                      variant="success"
                      size="md"
                      icon={<Send size={16} />}
                      onClick={() => setShowSubmitModal(true)}
                      energyWeight={3}
                    >
                      Submit Report
                    </BounceButton>
                  ) : (
                    <BounceButton
                      variant={currentResult ? "primary" : "secondary"}
                      size="md"
                      icon={<ChevronRight size={16} />}
                      onClick={() => setCurrentTestIdx(Math.min(totalTests - 1, currentTestIdx + 1))}
                      className={currentTestIdx === totalTests - 1 && !currentResult ? "opacity-30 pointer-events-none" : ""}
                    >
                      {currentResult ? "Next" : "Skip"}
                    </BounceButton>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live results ticker — quiet summary of what's done */}
        {completedTests > 0 && view === "inspecting" && (
          <motion.div
            className="bg-card rounded-2xl border border-border/20 p-4 flex items-center gap-4 overflow-x-auto scrollbar-thin"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-[0.6875rem] text-muted-foreground/25 flex-shrink-0">Results so far</span>
            <div className="flex gap-2">
              {activeProduct.tests.filter(t => results[t.id]).map(test => {
                const r = results[test.id];
                return (
                  <motion.button
                    key={test.id}
                    onClick={() => {
                      setCurrentTestIdx(activeProduct.tests.findIndex(t => t.id === test.id));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all flex-shrink-0 ${
                      r.passed ? "bg-[#30A46C]/6 text-[#30A46C]/60 hover:bg-[#30A46C]/10" : "bg-[#E5484D]/6 text-[#E5484D]/60 hover:bg-[#E5484D]/10"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {r.passed ? <Check size={10} /> : <X size={10} />}
                    {test.name}
                  </motion.button>
                );
              })}
            </div>
            <div className="ml-auto flex-shrink-0">
              <BounceButton
                variant="ghost"
                size="sm"
                icon={<FileText size={12} />}
                onClick={() => setView("datasheet")}
              >
                View Sheet
              </BounceButton>
            </div>
          </motion.div>
        )}

        {/* Submit Modal */}
        <AnimatePresence>
          {showSubmitModal && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/15 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !submitted && setShowSubmitModal(false)}
              />
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <div className="bg-card rounded-3xl shadow-2xl border border-border/30 overflow-hidden">
                  {submitted ? (
                    /* Success state */
                    <motion.div
                      className="p-10 text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <motion.div
                        className="w-20 h-20 rounded-full bg-[#30A46C]/8 flex items-center justify-center mx-auto mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.25, type: "spring", stiffness: 500, damping: 18 }}
                        >
                          <Check size={32} className="text-[#30A46C]" />
                        </motion.div>
                      </motion.div>
                      <h2 className="text-foreground tracking-tight mb-2">Sent to Manager</h2>
                      <p className="text-[0.875rem] text-muted-foreground/45 mb-8">
                        Your inspection report for <strong className="text-foreground/60">{activeProduct.name}</strong> is now pending review.
                      </p>
                      <BounceButton
                        variant="primary"
                        onClick={() => {
                          setShowSubmitModal(false);
                          setView("queue");
                        }}
                        energyWeight={2}
                      >
                        Back to Queue
                      </BounceButton>
                    </motion.div>
                  ) : (
                    /* Review before submit */
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/6 flex items-center justify-center">
                          <Send size={18} className="text-primary/60" />
                        </div>
                        <div>
                          <h2 className="text-foreground tracking-tight">Submit for Review</h2>
                          <p className="text-[0.8125rem] text-muted-foreground/40 mt-0.5">Manager will review & publish the rating</p>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="p-5 rounded-2xl bg-background/50 border border-border/15 mb-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-[1.5rem] text-foreground tabular-nums">{overallRating.toFixed(1)}</p>
                            <p className="text-[0.6875rem] text-muted-foreground/30 mt-1">Rating</p>
                          </div>
                          <div>
                            <p className="text-[1.5rem] text-[#30A46C] tabular-nums">{passedTests}</p>
                            <p className="text-[0.6875rem] text-muted-foreground/30 mt-1">Passed</p>
                          </div>
                          <div>
                            <p className="text-[1.5rem] text-[#E5484D] tabular-nums">{failedTests}</p>
                            <p className="text-[0.6875rem] text-muted-foreground/30 mt-1">Failed</p>
                          </div>
                        </div>
                      </div>

                      {/* Note to manager */}
                      <div className="mb-6">
                        <label className="text-[0.75rem] text-muted-foreground/35 mb-2 block">Note for manager (optional)</label>
                        <textarea
                          placeholder="Any highlights or concerns to flag..."
                          className="w-full bg-background/50 border border-border/20 rounded-xl px-4 py-3 text-[0.875rem] text-foreground outline-none focus:border-primary/20 transition-all resize-none min-h-[100px] placeholder:text-muted-foreground/25"
                          value={managerNote}
                          onChange={e => setManagerNote(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <BounceButton
                          variant="secondary"
                          className="flex-1"
                          onClick={() => setShowSubmitModal(false)}
                        >
                          Cancel
                        </BounceButton>
                        <BounceButton
                          variant="success"
                          className="flex-1"
                          icon={<Send size={14} />}
                          onClick={() => setSubmitted(true)}
                          energyWeight={4}
                        >
                          Submit Report
                        </BounceButton>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Fallback — shouldn't reach here
  return (
    <div className="flex items-center justify-center h-64">
      <BounceButton variant="primary" onClick={() => setView("queue")}>
        Go to Queue
      </BounceButton>
    </div>
  );
}