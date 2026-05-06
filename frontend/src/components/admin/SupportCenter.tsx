"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BounceButton } from "./BounceButton";
import {
  MessageCircle, Clock, CheckCircle2, User, ChevronRight, ChevronLeft,
  Send, Package, Search, X, Star, Headphones, Shield, FileText,
  Truck, HelpCircle, Scale, AlertTriangle, Paperclip, Smile, Phone,
  RotateCcw, Tag, Hash, ExternalLink, Copy, ThumbsUp, ThumbsDown,
  Flag, CreditCard, ArrowUpRight, Bookmark, MoreHorizontal, History,
  Eye, Zap, RefreshCw, Users, MapPin, Globe, CircleDot
} from "lucide-react";

/*
 * PLATONIC Support Center
 *
 * A support agent's world is simple:
 * "Someone needs help. Help them."
 *
 * The interface should DISAPPEAR. The agent should feel
 * like they're talking directly to the person — the tool
 * is just the air between them.
 *
 * Hierarchy of attention:
 * 1. The person you're helping RIGHT NOW
 * 2. Who else needs you (the queue)
 * 3. Context that helps you help them
 * 4. Actions to resolve, escalate, refund
 *
 * Jony Ive: "When something is designed really well,
 * the user doesn't notice the design."
 */

// ─── Types ───
interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isStaff: boolean;
  isSystem?: boolean;
}

interface CustomerContext {
  totalOrders: number;
  memberSince: string;
  lifetimeValue: string;
  country: string;
  countryCode: string;
  previousTickets: number;
  satisfaction: number;
  recentOrders: { id: string; item: string; status: string; date: string }[];
}

interface Ticket {
  id: string;
  type: "buyer" | "seller";
  category: "order" | "quality" | "delivery" | "refund" | "dispute" | "account" | "general";
  subject: string;
  userName: string;
  initials: string;
  companyName?: string;
  status: "open" | "active" | "waiting" | "resolved" | "escalated";
  priority: "urgent" | "high" | "normal" | "low";
  waitingSince: string; // human-readable
  waitMinutes: number; // for color-coding
  unread: number;
  messages: Message[];
  orderRef?: string;
  customer: CustomerContext;
  tags: string[];
}

// ─── Category Config ───
const catConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  order: { icon: <Package size={12} />, color: "#3B82F6", label: "Order" },
  quality: { icon: <Shield size={12} />, color: "#8B5CF6", label: "Quality" },
  delivery: { icon: <Truck size={12} />, color: "#30A46C", label: "Delivery" },
  refund: { icon: <RotateCcw size={12} />, color: "#D97706", label: "Refund" },
  dispute: { icon: <Scale size={12} />, color: "#E5484D", label: "Dispute" },
  account: { icon: <User size={12} />, color: "#0171E3", label: "Account" },
  general: { icon: <HelpCircle size={12} />, color: "#7A7D80", label: "General" },
};

// ─── Wait time color — green → amber → red ───
function waitColor(minutes: number): string {
  if (minutes < 5) return "#30A46C";
  if (minutes < 15) return "#FFB224";
  if (minutes < 30) return "#D97706";
  return "#E5484D";
}

// ─── Mock Data ───
const mockTickets: Ticket[] = [
  {
    id: "TKT-5001", type: "buyer", category: "delivery",
    subject: "Order hasn't arrived — 3 days overdue",
    userName: "David Chen", initials: "DC",
    status: "active", priority: "urgent",
    waitingSince: "2 min ago", waitMinutes: 2, unread: 1,
    orderRef: "ORD-8841",
    tags: ["escalation-risk", "premium-buyer"],
    messages: [
      { id: "m1", sender: "David Chen", text: "My order was supposed to arrive 3 days ago. Tracking still shows 'in transit' since last Thursday. This is a $2,400 order and I'm getting worried.", time: "10:30 AM", isStaff: false },
      { id: "m2", sender: "Sarah K.", text: "Hi David! I completely understand your concern — let me pull up the tracking right now. One moment.", time: "10:32 AM", isStaff: true },
      { id: "m3", sender: "System", text: "Sarah K. viewed order ORD-8841 details", time: "10:32 AM", isStaff: true, isSystem: true },
      { id: "m4", sender: "Sarah K.", text: "I can see the shipment is at the regional hub in Shenzhen. There was a customs hold for documentation — I'm contacting our logistics partner now to expedite. I'll have an update for you within the hour.", time: "10:35 AM", isStaff: true },
      { id: "m5", sender: "David Chen", text: "Thanks for looking into it. Please keep me posted — I need these parts for a client project next week.", time: "10:38 AM", isStaff: false },
    ],
    customer: {
      totalOrders: 23, memberSince: "Jan 2024", lifetimeValue: "$34,200",
      country: "United States", countryCode: "us", previousTickets: 2, satisfaction: 4.8,
      recentOrders: [
        { id: "ORD-8841", item: "Carbon Fiber Sheets (500 units)", status: "In Transit", date: "Mar 10" },
        { id: "ORD-8720", item: "Titanium Bolts M8 (2000 pcs)", status: "Delivered", date: "Feb 28" },
        { id: "ORD-8690", item: "Aerospace Adhesive (50L)", status: "Delivered", date: "Feb 15" },
      ],
    },
  },
  {
    id: "TKT-5002", type: "buyer", category: "quality",
    subject: "HEPA filters don't match product listing",
    userName: "Robert Miller", initials: "RM",
    status: "open", priority: "high",
    waitingSince: "18 min ago", waitMinutes: 18, unread: 2,
    orderRef: "ORD-8856",
    tags: ["quality-mismatch", "potential-dispute"],
    messages: [
      { id: "m1", sender: "Robert Miller", text: "The filters I received say HF-200B but the listing shows HF-200A. Also the packaging looks different from what was shown. I ordered 200 units and I'm not sure if these are the right spec.", time: "10:12 AM", isStaff: false },
      { id: "m2", sender: "Robert Miller", text: "I've attached photos of the product label vs the listing. Can someone verify these are functionally identical?", time: "10:14 AM", isStaff: false },
    ],
    customer: {
      totalOrders: 8, memberSince: "Sep 2025", lifetimeValue: "$12,600",
      country: "Germany", countryCode: "de", previousTickets: 1, satisfaction: 4.2,
      recentOrders: [
        { id: "ORD-8856", item: "HEPA Filters HF-200A (200 pcs)", status: "Delivered", date: "Mar 11" },
        { id: "ORD-8801", item: "Air Purifier Units (20 pcs)", status: "Delivered", date: "Mar 1" },
      ],
    },
  },
  {
    id: "TKT-5003", type: "seller", category: "dispute",
    subject: "Buyer claims damage — we have inspection proof",
    userName: "Mei Tanaka", initials: "MT",
    companyName: "GreenLeaf Organics",
    status: "open", priority: "high",
    waitingSince: "32 min ago", waitMinutes: 32, unread: 3,
    orderRef: "ORD-8790",
    tags: ["dispute", "needs-legal", "photo-evidence"],
    messages: [
      { id: "m1", sender: "Mei Tanaka", text: "A buyer is claiming our matcha powder arrived damaged, but our quality inspection report (B-2765) shows perfect packaging. The buyer's photos look like the box was mishandled after delivery.", time: "9:58 AM", isStaff: false },
      { id: "m2", sender: "Mei Tanaka", text: "We have the full inspection report with photos from before shipping. The seal was intact. I believe this should be a carrier liability issue, not ours.", time: "10:02 AM", isStaff: false },
      { id: "m3", sender: "Mei Tanaka", text: "Can this be forwarded to your disputes team? The buyer is threatening a chargeback.", time: "10:05 AM", isStaff: false },
    ],
    customer: {
      totalOrders: 45, memberSince: "Mar 2023", lifetimeValue: "$89,300",
      country: "Japan", countryCode: "jp", previousTickets: 3, satisfaction: 4.9,
      recentOrders: [
        { id: "ORD-8790", item: "Organic Matcha Powder (150 units)", status: "Dispute", date: "Mar 5" },
        { id: "ORD-8650", item: "Sencha Green Tea (300 units)", status: "Delivered", date: "Feb 20" },
      ],
    },
  },
  {
    id: "TKT-5004", type: "buyer", category: "refund",
    subject: "Request full refund for cancelled order",
    userName: "Ananya Sharma", initials: "AS",
    status: "waiting", priority: "normal",
    waitingSince: "1 hr ago", waitMinutes: 60, unread: 0,
    orderRef: "ORD-8810",
    tags: ["refund-pending", "cancellation"],
    messages: [
      { id: "m1", sender: "Ananya Sharma", text: "I cancelled order ORD-8810 two days ago but haven't received my refund of ₹45,000 yet. Your policy says 3-5 business days but I'm worried.", time: "9:30 AM", isStaff: false },
      { id: "m2", sender: "Carlos R.", text: "Hi Ananya! I've checked and your refund was processed yesterday. It typically takes 2-3 business days to reflect in your bank account. You should see it by March 19th at the latest.", time: "9:45 AM", isStaff: true },
      { id: "m3", sender: "Carlos R.", text: "I've also sent you a confirmation email with the refund reference number. Is there anything else I can help with?", time: "9:46 AM", isStaff: true },
    ],
    customer: {
      totalOrders: 5, memberSince: "Dec 2025", lifetimeValue: "$2,100",
      country: "India", countryCode: "in", previousTickets: 0, satisfaction: 5.0,
      recentOrders: [
        { id: "ORD-8810", item: "Silk Saree Collection (5 pcs)", status: "Cancelled", date: "Mar 8" },
      ],
    },
  },
  {
    id: "TKT-5005", type: "seller", category: "account",
    subject: "Need help updating export certification",
    userName: "Hans Weber", initials: "HW",
    companyName: "Atlas Materials GmbH",
    status: "active", priority: "normal",
    waitingSince: "45 min ago", waitMinutes: 45, unread: 0,
    orderRef: undefined,
    tags: ["compliance", "documentation"],
    messages: [
      { id: "m1", sender: "Hans Weber", text: "We've received our updated REACH compliance certificate. How do I replace the expiring document in our seller profile? The old one expires March 25th.", time: "9:45 AM", isStaff: false },
      { id: "m2", sender: "Priya M.", text: "Hi Hans! You can update it from Seller Dashboard → Documents → Compliance Certificates. Click the ↻ icon next to the expiring cert. I'll also upload it from our end to speed things up — can you share the new certificate here?", time: "10:00 AM", isStaff: true },
      { id: "m3", sender: "Hans Weber", text: "Perfect, I've attached the PDF. Registration number is REACH-2026-0447.", time: "10:08 AM", isStaff: false },
    ],
    customer: {
      totalOrders: 67, memberSince: "Jun 2022", lifetimeValue: "$156,800",
      country: "Germany", countryCode: "de", previousTickets: 5, satisfaction: 4.7,
      recentOrders: [
        { id: "ORD-8860", item: "Carbon Fiber Tubes (100 units)", status: "Processing", date: "Mar 14" },
      ],
    },
  },
  {
    id: "TKT-5006", type: "buyer", category: "general",
    subject: "How to set up B2B recurring orders?",
    userName: "Lisa Park", initials: "LP",
    status: "resolved", priority: "low",
    waitingSince: "2 days ago", waitMinutes: 2880, unread: 0,
    tags: ["how-to", "b2b"],
    messages: [
      { id: "m1", sender: "Lisa Park", text: "Is there a way to set up automatic recurring orders for our regular office supply purchases?", time: "Mar 16, 2:00 PM", isStaff: false },
      { id: "m2", sender: "Carlos R.", text: "Great question! Go to Orders → Recurring → Create Schedule. You can set frequency, quantity, and delivery preferences. Let me know if you need a walkthrough!", time: "Mar 16, 2:15 PM", isStaff: true },
      { id: "m3", sender: "Lisa Park", text: "Found it, thank you!", time: "Mar 16, 2:30 PM", isStaff: false },
    ],
    customer: {
      totalOrders: 12, memberSince: "Aug 2025", lifetimeValue: "$8,400",
      country: "South Korea", countryCode: "kr", previousTickets: 1, satisfaction: 5.0,
      recentOrders: [],
    },
  },
];

// ─── Response Templates ───
const templates = [
  { id: "t1", label: "Greeting", text: "Hi {name}! Thank you for reaching out. I'm looking into this for you right now." },
  { id: "t2", label: "Checking order", text: "Let me pull up order {orderRef} and check the current status. One moment please." },
  { id: "t3", label: "Refund initiated", text: "I've initiated your refund of {amount}. It will reflect in your account within 3-5 business days. You'll receive a confirmation email shortly." },
  { id: "t4", label: "Escalating", text: "I understand this is important. I'm escalating this to our {team} team who can provide more specialized help. They'll reach out within 2 hours." },
  { id: "t5", label: "Resolved", text: "I'm glad we could help! If anything else comes up, don't hesitate to reach out. We're always here for you." },
];

// ─── Escalation reasons ───
const disputeReasons = [
  "Product quality mismatch",
  "Damaged in transit — carrier liability",
  "Counterfeit or unauthorized product",
  "Contract breach — delivery timeline",
  "Payment dispute / chargeback",
  "Intellectual property concern",
  "Seller misrepresentation",
  "Other",
];

// ═══════════════════════════════════════════════════
// MAIN PORTAL
// ═══════════════════════════════════════════════════

export function SupportCenter() {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "needs-reply" | "waiting" | "resolved">("all");
  const [newMessage, setNewMessage] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [queueHovered, setQueueHovered] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateNote, setEscalateNote] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter tickets
  const filtered = mockTickets.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.userName.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    }
    if (filterStatus === "needs-reply") return t.unread > 0 || t.status === "open";
    if (filterStatus === "waiting") return t.status === "waiting" || t.status === "active";
    if (filterStatus === "resolved") return t.status === "resolved" || t.status === "escalated";
    return true;
  });

  // Sort: unread first, then by wait time
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "resolved" && b.status !== "resolved") return 1;
    if (b.status === "resolved" && a.status !== "resolved") return -1;
    if (a.unread > 0 && b.unread === 0) return -1;
    if (b.unread > 0 && a.unread === 0) return 1;
    return a.waitMinutes - b.waitMinutes;
  });

  const needsReplyCount = mockTickets.filter(t => t.unread > 0 || t.status === "open").length;
  const activeCount = mockTickets.filter(t => t.status !== "resolved" && t.status !== "escalated").length;

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket]);

  const selectTicket = useCallback((ticket: Ticket) => {
    setActiveTicket(ticket);
    setShowContext(false);
    setShowEscalate(false);
    setShowResolve(false);
    setShowTemplates(false);
    setEscalated(false);
    setResolved(false);
    setNewMessage("");
  }, []);

  const applyTemplate = useCallback((text: string) => {
    if (!activeTicket) return;
    let filled = text
      .replace("{name}", activeTicket.userName.split(" ")[0])
      .replace("{orderRef}", activeTicket.orderRef || "your order")
      .replace("{team}", "disputes")
      .replace("{amount}", "the full amount");
    setNewMessage(filled);
    setShowTemplates(false);
  }, [activeTicket]);

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden -m-6 sm:-m-8">

      {/* ═══ LEFT: THE QUEUE ═══ */}
      {/* When a conversation is open, the queue collapses to a thin strip
          and reveals itself on hover — giving the conversation ALL the space.
          The strip shows a subtle count so the agent always knows who's waiting. */}
      <motion.div
        className={`flex-shrink-0 flex flex-col bg-background border-r border-border/20 relative ${
          activeTicket ? "hidden sm:flex" : "w-full sm:w-[420px] lg:w-[460px]"
        }`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          width: activeTicket
            ? queueHovered ? 340 : 52
            : undefined,
        }}
        transition={{
          width: { type: "spring", stiffness: 400, damping: 35 },
        }}
        onMouseEnter={() => activeTicket && setQueueHovered(true)}
        onMouseLeave={() => activeTicket && setQueueHovered(false)}
      >
        {/* Collapsed indicator — visible only when queue is collapsed */}
        {activeTicket && !queueHovered && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-start pt-6 gap-4 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="w-8 h-8 rounded-xl bg-[#E5484D]/6 flex items-center justify-center">
              <Headphones size={14} className="text-[#E5484D]/40" />
            </div>
            {needsReplyCount > 0 && (
              <div className="w-5 h-5 rounded-full bg-[#E5484D] flex items-center justify-center">
                <span className="text-[0.5rem] text-white tabular-nums">{needsReplyCount}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 mt-2">
              {sorted.slice(0, 5).map(t => (
                <div
                  key={t.id}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.4375rem] text-white flex-shrink-0 ${
                    t.type === "buyer"
                      ? "bg-gradient-to-br from-[#3B82F6]/60 to-[#0171E3]/80"
                      : "bg-gradient-to-br from-[#D97706]/60 to-[#FFB224]/80"
                  } ${activeTicket?.id === t.id ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
                >
                  {t.initials}
                </div>
              ))}
            </div>
            <motion.div
              className="mt-2"
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronRight size={10} className="text-muted-foreground/15" />
            </motion.div>
          </motion.div>
        )}
        {/* Queue content — fades out when collapsed, fades in on hover */}
        <motion.div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          animate={{
            opacity: activeTicket && !queueHovered ? 0 : 1,
          }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: activeTicket && !queueHovered ? "none" : "auto" }}
        >
        {/* Queue header */}
        <div className="flex-shrink-0 p-6 pb-4">
          {/* Warm greeting — the agent is a PERSON, not a ticket machine */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3.5 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#E5484D]/6 flex items-center justify-center">
                <Headphones size={18} className="text-[#E5484D]/60" />
              </div>
              <div>
                <h2 className="text-foreground tracking-tight">Support</h2>
                <p className="text-[0.75rem] text-muted-foreground/40">
                  {needsReplyCount > 0
                    ? `${needsReplyCount} ${needsReplyCount === 1 ? "person needs" : "people need"} your help`
                    : "All caught up"
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-3 border border-border/20 focus-within:border-primary/15 transition-all mb-4">
            <Search size={14} className="text-muted-foreground/30" />
            <input
              type="text"
              placeholder="Search people, tickets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[0.8125rem] text-foreground placeholder:text-muted-foreground/25"
            />
          </div>

          {/* Filter tabs — gentle, not screaming */}
          <div className="flex items-center gap-1 bg-muted/10 rounded-xl p-0.5">
            {([
              { key: "all", label: "All", count: activeCount },
              { key: "needs-reply", label: "Needs reply", count: needsReplyCount },
              { key: "waiting", label: "Waiting", count: mockTickets.filter(t => t.status === "waiting" || t.status === "active").length },
              { key: "resolved", label: "Done", count: mockTickets.filter(t => t.status === "resolved" || t.status === "escalated").length },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[0.6875rem] transition-all cursor-pointer ${
                  filterStatus === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground/40 hover:text-muted-foreground/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && filterStatus !== tab.key && (
                  <span className="text-[0.5625rem] tabular-nums text-muted-foreground/25">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {sorted.map((ticket, i) => {
              const cat = catConfig[ticket.category];
              const isActive = activeTicket?.id === ticket.id;
              const isResolved = ticket.status === "resolved" || ticket.status === "escalated";
              const lastMsg = ticket.messages[ticket.messages.length - 1];

              return (
                <motion.button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`w-full text-left p-4 rounded-2xl mb-1.5 transition-all cursor-pointer group ${
                    isActive
                      ? "bg-primary/[0.04] border border-primary/10"
                      : "hover:bg-card/80 border border-transparent"
                  } ${isResolved ? "opacity-50" : ""}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with urgency ring */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[0.625rem] tracking-wide ${
                        ticket.type === "buyer"
                          ? "bg-gradient-to-br from-[#3B82F6]/80 to-[#0171E3] text-white"
                          : "bg-gradient-to-br from-[#D97706]/80 to-[#FFB224] text-white"
                      }`}>
                        {ticket.initials}
                      </div>
                      {ticket.unread > 0 && (
                        <motion.div
                          className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#E5484D] flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          <span className="text-[0.5rem] text-white tabular-nums">{ticket.unread}</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + time */}
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[0.8125rem] truncate ${ticket.unread > 0 ? "text-foreground" : "text-foreground/60"}`}>
                            {ticket.userName}
                          </span>
                          {ticket.companyName && (
                            <span className="text-[0.625rem] text-muted-foreground/25 truncate hidden sm:inline">
                              {ticket.companyName}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[0.625rem] tabular-nums flex-shrink-0"
                          style={{ color: isResolved ? "rgba(0,0,0,0.15)" : waitColor(ticket.waitMinutes) }}
                        >
                          {ticket.waitingSince}
                        </span>
                      </div>

                      {/* Subject — the WHAT */}
                      <p className={`text-[0.75rem] truncate mb-1.5 ${ticket.unread > 0 ? "text-foreground/70" : "text-muted-foreground/40"}`}>
                        {ticket.subject}
                      </p>

                      {/* Category + status — quiet metadata */}
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: `${cat.color}08`, color: `${cat.color}80` }}
                        >
                          {cat.icon} {cat.label}
                        </span>
                        {ticket.priority === "urgent" && (
                          <span className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-md bg-[#E5484D]/6 text-[#E5484D]/60">
                            <span className="w-1 h-1 rounded-full bg-[#E5484D] animate-pulse" />
                            Urgent
                          </span>
                        )}
                        {ticket.status === "escalated" && (
                          <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-md bg-[#D97706]/6 text-[#D97706]/60">
                            Escalated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-[#30A46C]/6 flex items-center justify-center mb-4">
                <CheckCircle2 size={22} className="text-[#30A46C]/40" />
              </div>
              <p className="text-[0.875rem] text-muted-foreground/30">No tickets match your filter</p>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>

      {/* ═══ RIGHT: THE CONVERSATION ═══ */}
      <div className="flex-1 flex flex-col bg-[#FAFAFA] min-w-0">
        <AnimatePresence mode="wait">
          {activeTicket ? (
            <motion.div
              key={activeTicket.id}
              className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* ─── Conversation Header ─── */}
              <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-border/15 px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Back button (mobile) */}
                  <motion.button
                    className="sm:hidden w-9 h-9 rounded-xl bg-muted/15 flex items-center justify-center cursor-pointer"
                    onClick={() => setActiveTicket(null)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft size={16} className="text-muted-foreground/50" />
                  </motion.button>

                  {/* Person identity — WHO you're helping */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.5625rem] text-white flex-shrink-0 ${
                    activeTicket.type === "buyer"
                      ? "bg-gradient-to-br from-[#3B82F6]/80 to-[#0171E3]"
                      : "bg-gradient-to-br from-[#D97706]/80 to-[#FFB224]"
                  }`}>
                    {activeTicket.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[0.875rem] text-foreground">{activeTicket.userName}</span>
                      <span className="text-[0.625rem] text-muted-foreground/20 tabular-nums">{activeTicket.id}</span>
                      <img
                        src={`https://flagcdn.com/16x12/${activeTicket.customer.countryCode}.png`}
                        alt={activeTicket.customer.country}
                        className="w-3.5 h-2.5 rounded-[1px] opacity-50"
                      />
                    </div>
                    <p className="text-[0.6875rem] text-muted-foreground/35 truncate">{activeTicket.subject}</p>
                  </div>

                  {/* Quick actions in header */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <motion.button
                      className={`p-2 rounded-xl transition-all cursor-pointer ${showContext ? "bg-primary/6 text-primary" : "hover:bg-muted/20 text-muted-foreground/30"}`}
                      onClick={() => setShowContext(!showContext)}
                      whileTap={{ scale: 0.92 }}
                      title="Customer context"
                    >
                      <User size={15} />
                    </motion.button>
                    {activeTicket.orderRef && (
                      <motion.button
                        className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/30 cursor-pointer"
                        whileTap={{ scale: 0.92 }}
                        title="View order"
                      >
                        <Package size={15} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Content area: messages + optional context panel ─── */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    {/* Date separator */}
                    <div className="flex justify-center mb-8">
                      <span className="text-[0.6875rem] text-muted-foreground/20 bg-muted/10 px-4 py-1.5 rounded-full">
                        Today
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="max-w-[680px] mx-auto space-y-5">
                      {activeTicket.messages.map((msg, i) => {
                        if (msg.isSystem) {
                          return (
                            <motion.div
                              key={msg.id}
                              className="flex justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              <span className="text-[0.625rem] text-muted-foreground/15 flex items-center gap-1.5">
                                <Eye size={9} /> {msg.text} · {msg.time}
                              </span>
                            </motion.div>
                          );
                        }

                        return (
                          <motion.div
                            key={msg.id}
                            className={`flex ${msg.isStaff ? "justify-end" : "justify-start"}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <div className={`max-w-[80%] ${msg.isStaff ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={`px-5 py-3.5 ${
                                msg.isStaff
                                  ? "bg-primary text-white rounded-t-[22px] rounded-bl-[22px] rounded-br-[6px] shadow-[0_2px_12px_rgba(1,113,227,0.15)]"
                                  : "bg-white text-foreground rounded-t-[22px] rounded-br-[22px] rounded-bl-[6px] shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
                              }`}>
                                <p className="text-[0.875rem] leading-relaxed">{msg.text}</p>
                              </div>
                              <span className={`text-[0.5625rem] text-muted-foreground/20 mt-1.5 px-2 ${msg.isStaff ? "text-right" : ""}`}>
                                {msg.time}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* ─── Input & Actions ─── */}
                  <div className="flex-shrink-0 bg-white/60 backdrop-blur-xl border-t border-border/10 px-6 py-4">
                    {/* Template picker */}
                    <AnimatePresence>
                      {showTemplates && (
                        <motion.div
                          className="mb-3 flex flex-wrap gap-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {templates.map(t => (
                            <motion.button
                              key={t.id}
                              onClick={() => applyTemplate(t.text)}
                              className="px-3.5 py-2 rounded-full bg-white border border-border/20 text-[0.75rem] text-primary/70 hover:bg-primary/[0.03] hover:border-primary/15 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              {t.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Message input */}
                    <div className="flex items-end gap-3">
                      <div className="flex-1 bg-white rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] border border-border/10 flex items-end px-4 py-2.5">
                        <motion.button
                          className="p-1.5 rounded-full hover:bg-muted/10 transition-colors cursor-pointer flex-shrink-0 mb-0.5"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Paperclip size={16} className="text-muted-foreground/30" />
                        </motion.button>
                        <textarea
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 bg-transparent border-none outline-none text-[0.875rem] text-foreground placeholder:text-muted-foreground/20 resize-none min-h-[24px] max-h-[120px] mx-3 py-1"
                          rows={1}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              // Would send message
                            }
                          }}
                        />
                        <motion.button
                          className="p-1.5 rounded-full hover:bg-muted/10 transition-colors cursor-pointer flex-shrink-0 mb-0.5"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Smile size={16} className="text-muted-foreground/30" />
                        </motion.button>
                        <motion.button
                          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${
                            newMessage.trim()
                              ? "bg-primary shadow-[0_2px_8px_rgba(1,113,227,0.3)]"
                              : "bg-muted/15"
                          }`}
                          whileTap={{ scale: 0.88 }}
                        >
                          <Send size={14} className={newMessage.trim() ? "text-white" : "text-muted-foreground/20"} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Action bar — clear, purposeful, proportional bouncing */}
                    <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-thin pb-0.5">
                      <motion.button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] transition-all cursor-pointer whitespace-nowrap ${
                          showTemplates ? "bg-primary/6 text-primary" : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/10"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Zap size={11} /> Templates
                      </motion.button>

                      <div className="w-px h-4 bg-border/15 flex-shrink-0" />

                      {activeTicket.status !== "resolved" && activeTicket.status !== "escalated" && (
                        <>
                          <motion.button
                            onClick={() => setShowResolve(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] text-[#30A46C]/60 hover:text-[#30A46C] hover:bg-[#30A46C]/6 transition-all cursor-pointer whitespace-nowrap"
                            whileTap={{ scale: 0.94 }}
                          >
                            <CheckCircle2 size={11} /> Resolve
                          </motion.button>

                          <motion.button
                            onClick={() => setShowEscalate(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] text-[#D97706]/50 hover:text-[#D97706] hover:bg-[#D97706]/6 transition-all cursor-pointer whitespace-nowrap"
                            whileTap={{ scale: 0.94 }}
                          >
                            <Scale size={11} /> Forward to Legal
                          </motion.button>

                          {activeTicket.orderRef && (
                            <motion.button
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/10 transition-all cursor-pointer whitespace-nowrap"
                              whileTap={{ scale: 0.95 }}
                            >
                              <CreditCard size={11} /> Refund
                            </motion.button>
                          )}

                          <motion.button
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/10 transition-all cursor-pointer whitespace-nowrap"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Bookmark size={11} /> Internal note
                          </motion.button>
                        </>
                      )}
                    </div>

                    <p className="text-[0.5625rem] text-muted-foreground/15 text-center mt-2.5">
                      TradeFlow support · avg response 2 min
                    </p>
                  </div>
                </div>

                {/* ─── Context Panel (slides in) ─── */}
                <AnimatePresence>
                  {showContext && (
                    <motion.div
                      className="w-[300px] flex-shrink-0 border-l border-border/10 bg-white/50 overflow-y-auto scrollbar-thin"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="p-5 space-y-6">
                        {/* Customer identity */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-[0.75rem] ${
                              activeTicket.type === "buyer"
                                ? "bg-gradient-to-br from-[#3B82F6]/80 to-[#0171E3]"
                                : "bg-gradient-to-br from-[#D97706]/80 to-[#FFB224]"
                            }`}>
                              {activeTicket.initials}
                            </div>
                            <div>
                              <p className="text-[0.875rem] text-foreground">{activeTicket.userName}</p>
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={`https://flagcdn.com/16x12/${activeTicket.customer.countryCode}.png`}
                                  alt=""
                                  className="w-3 h-2 rounded-[1px]"
                                />
                                <span className="text-[0.625rem] text-muted-foreground/30">{activeTicket.customer.country}</span>
                              </div>
                            </div>
                          </div>

                          {/* Key stats — arranged by importance */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 rounded-xl bg-background/50">
                              <p className="text-[0.5625rem] text-muted-foreground/25 mb-1">Lifetime value</p>
                              <p className="text-[0.9375rem] text-foreground/60 tabular-nums">{activeTicket.customer.lifetimeValue}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-background/50">
                              <p className="text-[0.5625rem] text-muted-foreground/25 mb-1">Orders</p>
                              <p className="text-[0.9375rem] text-foreground/60 tabular-nums">{activeTicket.customer.totalOrders}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-background/50">
                              <p className="text-[0.5625rem] text-muted-foreground/25 mb-1">Member since</p>
                              <p className="text-[0.75rem] text-foreground/40">{activeTicket.customer.memberSince}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-background/50">
                              <p className="text-[0.5625rem] text-muted-foreground/25 mb-1">Satisfaction</p>
                              <div className="flex items-center gap-1">
                                <Star size={10} className="text-[#FFB224]" fill="#FFB224" />
                                <span className="text-[0.75rem] text-foreground/40 tabular-nums">{activeTicket.customer.satisfaction}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {activeTicket.tags.length > 0 && (
                          <div>
                            <p className="text-[0.5625rem] text-muted-foreground/20 uppercase tracking-wider mb-2">Tags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {activeTicket.tags.map(tag => (
                                <span key={tag} className="text-[0.625rem] text-muted-foreground/35 px-2 py-1 rounded-lg bg-muted/10">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent orders */}
                        {activeTicket.customer.recentOrders.length > 0 && (
                          <div>
                            <p className="text-[0.5625rem] text-muted-foreground/20 uppercase tracking-wider mb-2">Recent orders</p>
                            <div className="space-y-2">
                              {activeTicket.customer.recentOrders.map(order => (
                                <div key={order.id} className="p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-all cursor-pointer">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[0.625rem] text-primary/50 tabular-nums">{order.id}</span>
                                    <span className="text-[0.5625rem] text-muted-foreground/20">{order.date}</span>
                                  </div>
                                  <p className="text-[0.75rem] text-foreground/45 truncate">{order.item}</p>
                                  <span className={`text-[0.5625rem] ${
                                    order.status === "Delivered" ? "text-[#30A46C]/50" :
                                    order.status === "Dispute" ? "text-[#E5484D]/50" :
                                    order.status === "Cancelled" ? "text-muted-foreground/25" :
                                    "text-primary/40"
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Previous tickets */}
                        <div className="p-3 rounded-xl bg-background/50">
                          <div className="flex items-center gap-2">
                            <History size={11} className="text-muted-foreground/20" />
                            <span className="text-[0.6875rem] text-muted-foreground/30">
                              {activeTicket.customer.previousTickets} previous tickets
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* ─── Empty state: no ticket selected ─── */
            <motion.div
              key="empty"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center max-w-[320px]">
                <motion.div
                  className="w-20 h-20 rounded-full bg-primary/[0.03] flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <MessageCircle size={28} className="text-primary/15" />
                </motion.div>
                <h3 className="text-foreground/30 tracking-tight mb-2">Select a conversation</h3>
                <p className="text-[0.8125rem] text-muted-foreground/20 leading-relaxed">
                  Pick someone from the queue to start helping them. Every conversation is a chance to make someone's day better.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Escalate to Legal Modal */}
      <AnimatePresence>
        {showEscalate && activeTicket && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/12 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !escalated && setShowEscalate(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] z-50"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-border/20 overflow-hidden">
                {escalated ? (
                  <motion.div
                    className="p-10 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-[#D97706]/6 flex items-center justify-center mx-auto mb-5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Scale size={24} className="text-[#D97706]/60" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-foreground tracking-tight mb-2">Forwarded to Legal</h3>
                    <p className="text-[0.8125rem] text-muted-foreground/40 mb-6">
                      The legal team will review <strong className="text-foreground/50">{activeTicket.id}</strong> and respond within 24 hours.
                    </p>
                    <BounceButton
                      variant="secondary"
                      onClick={() => { setShowEscalate(false); setEscalated(false); setEscalateReason(""); setEscalateNote(""); }}
                      energyWeight={1}
                    >
                      Back to conversation
                    </BounceButton>
                  </motion.div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-[#D97706]/6 flex items-center justify-center">
                        <Scale size={18} className="text-[#D97706]/50" />
                      </div>
                      <div>
                        <h3 className="text-foreground tracking-tight">Forward to Legal Team</h3>
                        <p className="text-[0.75rem] text-muted-foreground/35 mt-0.5">
                          {activeTicket.id} · {activeTicket.userName}
                        </p>
                      </div>
                    </div>

                    {/* Dispute reason */}
                    <div className="mb-5">
                      <label className="text-[0.6875rem] text-muted-foreground/30 mb-2.5 block">Reason for escalation</label>
                      <div className="grid grid-cols-2 gap-2">
                        {disputeReasons.map(reason => (
                          <motion.button
                            key={reason}
                            onClick={() => setEscalateReason(reason)}
                            className={`p-3 rounded-xl text-left text-[0.75rem] transition-all cursor-pointer border ${
                              escalateReason === reason
                                ? "bg-[#D97706]/[0.04] border-[#D97706]/15 text-[#D97706]/70"
                                : "bg-background/50 border-border/10 text-muted-foreground/40 hover:border-border/30"
                            }`}
                            whileTap={{ scale: 0.97 }}
                          >
                            {reason}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Summary note */}
                    <div className="mb-6">
                      <label className="text-[0.6875rem] text-muted-foreground/30 mb-2 block">Summary for legal team</label>
                      <textarea
                        placeholder="Brief context for the legal team..."
                        value={escalateNote}
                        onChange={e => setEscalateNote(e.target.value)}
                        className="w-full bg-background/50 border border-border/15 rounded-xl px-4 py-3 text-[0.8125rem] text-foreground outline-none focus:border-[#D97706]/15 transition-all resize-none min-h-[100px] placeholder:text-muted-foreground/20"
                      />
                    </div>

                    {/* Conversation history auto-attached notice */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/[0.02] border border-primary/5 mb-6">
                      <MessageCircle size={13} className="text-primary/25 flex-shrink-0" />
                      <p className="text-[0.6875rem] text-primary/35">
                        Full conversation history ({activeTicket.messages.length} messages) will be attached automatically
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <BounceButton
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowEscalate(false)}
                      >
                        Cancel
                      </BounceButton>
                      <BounceButton
                        variant="warning"
                        className="flex-1"
                        icon={<Scale size={13} />}
                        onClick={() => setEscalated(true)}
                        energyWeight={4}
                      >
                        Forward to Legal
                      </BounceButton>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Resolve Modal */}
      <AnimatePresence>
        {showResolve && activeTicket && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/12 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !resolved && setShowResolve(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] z-50"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-border/20 overflow-hidden">
                {resolved ? (
                  <motion.div
                    className="p-10 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-[#30A46C]/6 flex items-center justify-center mx-auto mb-5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.25, type: "spring", stiffness: 500, damping: 18 }}
                      >
                        <CheckCircle2 size={24} className="text-[#30A46C]" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-foreground tracking-tight mb-2">Ticket Resolved</h3>
                    <p className="text-[0.8125rem] text-muted-foreground/40 mb-6">
                      {activeTicket.userName} will receive a satisfaction survey.
                    </p>
                    <BounceButton
                      variant="primary"
                      onClick={() => { setShowResolve(false); setResolved(false); setActiveTicket(null); }}
                      energyWeight={2}
                    >
                      Back to Queue
                    </BounceButton>
                  </motion.div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-[#30A46C]/6 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-[#30A46C]/50" />
                      </div>
                      <div>
                        <h3 className="text-foreground tracking-tight">Resolve Ticket</h3>
                        <p className="text-[0.75rem] text-muted-foreground/35 mt-0.5">{activeTicket.userName} · {activeTicket.id}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-2xl bg-background/50 border border-border/10 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.6875rem] text-muted-foreground/25">{activeTicket.messages.length} messages</span>
                        <span className="text-[0.6875rem] text-muted-foreground/25">{activeTicket.waitingSince}</span>
                      </div>
                      <p className="text-[0.8125rem] text-foreground/45 truncate">{activeTicket.subject}</p>
                    </div>

                    <div className="mb-6">
                      <label className="text-[0.6875rem] text-muted-foreground/30 mb-2 block">Resolution note (optional)</label>
                      <textarea
                        placeholder="How was this resolved?"
                        value={resolveNote}
                        onChange={e => setResolveNote(e.target.value)}
                        className="w-full bg-background/50 border border-border/15 rounded-xl px-4 py-3 text-[0.8125rem] text-foreground outline-none focus:border-[#30A46C]/15 transition-all resize-none min-h-[80px] placeholder:text-muted-foreground/20"
                      />
                    </div>

                    <div className="flex gap-3">
                      <BounceButton
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowResolve(false)}
                      >
                        Cancel
                      </BounceButton>
                      <BounceButton
                        variant="success"
                        className="flex-1"
                        icon={<CheckCircle2 size={13} />}
                        onClick={() => setResolved(true)}
                        energyWeight={3}
                      >
                        Resolve
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
