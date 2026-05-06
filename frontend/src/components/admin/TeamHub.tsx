"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Users, Plus, Send, Search, Hash,
  MapPin, Package, Globe, ChevronDown, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, X, UserPlus,
  Bell, Pin, Paperclip, Star, MoreHorizontal,
  ArrowRight, Circle, FileText, Image as ImageIcon,
  AtSign, Smile, CalendarDays, Flag, Check,
  Phone, Mail, Filter, Layers, Target, RefreshCw
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";

/* ════════════════════════════════════════════════════════════
 *  TEAM HUB — PLATONIC CORRESPONDENCE
 *
 *  "Talk about [REACH Compliance] in [EU Region] with
 *   [the right people] and never lose a follow-up."
 *
 *  Every channel is a living room.
 *  Every message carries weight.
 *  Every follow-up has a home.
 *
 *  Jony Ive: "The best design is the most honest."
 * ════════════════════════════════════════════════════════════ */

// ─── TYPES ─────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  country: string;
  countryCode: string;
}

interface FollowUp {
  id: string;
  text: string;
  assignee: TeamMember;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  sender: TeamMember;
  text: string;
  timestamp: string;
  pinned?: boolean;
  followUp?: FollowUp;
  attachments?: { name: string; type: string; size: string }[];
  reactions?: { emoji: string; count: number; reacted: boolean }[];
}

interface Channel {
  id: string;
  name: string;
  type: "region" | "product" | "compliance" | "general";
  description: string;
  members: TeamMember[];
  messages: Message[];
  followUps: FollowUp[];
  unread: number;
  pinned: boolean;
  icon: string;
  color: string;
}

// ─── DATA ──────────────────────────────────────────────────

const getFlagUrl = (code: string) => `https://flagcdn.com/w20/${code}.png`;

const allMembers: TeamMember[] = [
  { id: "m1", name: "Sarah Chen", initials: "SC", role: "Compliance Lead", status: "online", country: "United States", countryCode: "us" },
  { id: "m2", name: "Raj Patel", initials: "RP", role: "Trade Analyst", status: "online", country: "India", countryCode: "in" },
  { id: "m3", name: "Emma Wilson", initials: "EW", role: "Legal Counsel", status: "away", country: "United Kingdom", countryCode: "gb" },
  { id: "m4", name: "Kenji Tanaka", initials: "KT", role: "Import Specialist", status: "online", country: "Japan", countryCode: "jp" },
  { id: "m5", name: "Maria Garcia", initials: "MG", role: "Export Officer", status: "offline", country: "Spain", countryCode: "es" },
  { id: "m6", name: "Hans Mueller", initials: "HM", role: "EU Regulations", status: "online", country: "Germany", countryCode: "de" },
  { id: "m7", name: "Amira Hassan", initials: "AH", role: "Documentation", status: "away", country: "Egypt", countryCode: "eg" },
  { id: "m8", name: "Lucas Silva", initials: "LS", role: "Logistics Coord.", status: "online", country: "Brazil", countryCode: "br" },
];

const initialChannels: Channel[] = [
  {
    id: "ch1",
    name: "EU REACH Compliance",
    type: "compliance",
    description: "All things REACH regulation for EU-bound products",
    icon: "shield",
    color: "#0171E3",
    members: [allMembers[0], allMembers[2], allMembers[5]],
    unread: 3,
    pinned: true,
    followUps: [
      { id: "f1", text: "Submit updated SVHC substance list", assignee: allMembers[5], dueDate: "Mar 22", done: false, createdAt: "2h ago" },
      { id: "f2", text: "Review lab test certificates", assignee: allMembers[0], dueDate: "Mar 25", done: false, createdAt: "Yesterday" },
    ],
    messages: [
      {
        id: "msg1", sender: allMembers[5], text: "The new SVHC candidate list was published yesterday. We need to cross-check our product ingredients against 7 newly added substances.", timestamp: "10:24 AM",
        reactions: [{ emoji: "thumbs-up", count: 2, reacted: false }],
      },
      {
        id: "msg2", sender: allMembers[0], text: "I'll coordinate with the lab for updated test reports. @Emma can you confirm the legal timeline for re-certification?", timestamp: "10:31 AM",
        followUp: { id: "f3", text: "Confirm legal timeline for re-certification", assignee: allMembers[2], dueDate: "Mar 20", done: false, createdAt: "Just now" },
      },
      {
        id: "msg3", sender: allMembers[2], text: "The re-certification window is 90 days from the candidate list publication. We're well within range but let's not delay. I'll draft a compliance brief this week.", timestamp: "10:45 AM",
        attachments: [{ name: "REACH_Timeline_2026.pdf", type: "pdf", size: "240 KB" }],
      },
      { id: "msg4", sender: allMembers[5], text: "Perfect. I've flagged the 3 products that may contain the newly listed substances. Sharing the analysis shortly.", timestamp: "11:02 AM" },
    ],
  },
  {
    id: "ch2",
    name: "South Asia Region",
    type: "region",
    description: "India, Sri Lanka, Bangladesh — origin operations",
    icon: "globe",
    color: "#30A46C",
    members: [allMembers[1], allMembers[0], allMembers[6]],
    unread: 1,
    pinned: false,
    followUps: [
      { id: "f4", text: "Verify updated GST rates for textile exports", assignee: allMembers[1], dueDate: "Mar 21", done: false, createdAt: "4h ago" },
    ],
    messages: [
      { id: "msg5", sender: allMembers[1], text: "New GST notification for textile exports dropped today. Rate changes effective April 1st. I'm reviewing the impact on our pricing models now.", timestamp: "9:15 AM" },
      { id: "msg6", sender: allMembers[6], text: "Could you share the notification number? I need to update the documentation templates accordingly.", timestamp: "9:28 AM" },
      { id: "msg7", sender: allMembers[1], text: "Notification No. 02/2026 — I'll attach the gazette copy here in a moment.", timestamp: "9:32 AM", attachments: [{ name: "GST_Notification_02_2026.pdf", type: "pdf", size: "180 KB" }] },
    ],
  },
  {
    id: "ch3",
    name: "Electronics Products",
    type: "product",
    description: "Headphones, LED panels, components",
    icon: "package",
    color: "#D97706",
    members: [allMembers[0], allMembers[3], allMembers[7]],
    unread: 0,
    pinned: false,
    followUps: [],
    messages: [
      { id: "msg8", sender: allMembers[3], text: "Japanese PSE certification for LED panels has been approved. Turnaround was faster than expected — 12 business days.", timestamp: "Yesterday" },
      { id: "msg9", sender: allMembers[0], text: "Excellent! Let's use this as a benchmark. Can you document the process so we can replicate for the next batch?", timestamp: "Yesterday" },
    ],
  },
  {
    id: "ch4",
    name: "Port & Logistics",
    type: "general",
    description: "Shipping updates, customs clearance, port operations",
    icon: "layers",
    color: "#E5484D",
    members: [allMembers[7], allMembers[0], allMembers[4]],
    unread: 5,
    pinned: true,
    followUps: [
      { id: "f5", text: "Confirm container release at Mumbai port", assignee: allMembers[7], dueDate: "Today", done: false, createdAt: "1h ago" },
      { id: "f6", text: "Upload Bill of Lading for shipment SH-4421", assignee: allMembers[4], dueDate: "Mar 19", done: true, createdAt: "3 days ago" },
    ],
    messages: [
      { id: "msg10", sender: allMembers[7], text: "Container MSKU-2847561 is held at Mumbai port pending customs verification. I've escalated with the port authority.", timestamp: "11:30 AM" },
      { id: "msg11", sender: allMembers[4], text: "I've uploaded the revised BoL. The discrepancy was in the HS code description — it's been corrected.", timestamp: "11:45 AM" },
      { id: "msg12", sender: allMembers[7], text: "Confirmed. Release expected by end of day. The buyer has been notified of the 1-day delay.", timestamp: "12:10 PM", reactions: [{ emoji: "check", count: 3, reacted: true }] },
    ],
  },
];

const channelTypeConfig = {
  region: { icon: <Globe size={14} />, label: "Region" },
  product: { icon: <Package size={14} />, label: "Product" },
  compliance: { icon: <Target size={14} />, label: "Compliance" },
  general: { icon: <Layers size={14} />, label: "General" },
};

const statusDot: Record<string, string> = {
  online: "bg-[#30A46C]",
  away: "bg-[#FFB224]",
  offline: "bg-muted-foreground/30",
};

// ─── COMPONENT ─────────────────────────────────────────────

export function TeamHub() {
  const [channels, setChannels] = useState(initialChannels);
  const [activeChannel, setActiveChannel] = useState(channels[0].id);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({ text: "", assigneeId: "", dueDate: "" });
  const [showNewFollowUp, setShowNewFollowUp] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", type: "general" as Channel["type"], description: "" });
  const [filterType, setFilterType] = useState<Channel["type"] | "all">("all");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel = channels.find(c => c.id === activeChannel)!;
  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const pinnedChannels = filteredChannels.filter(c => c.pinned);
  const unpinnedChannels = filteredChannels.filter(c => !c.pinned);
  const openFollowUps = channel.followUps.filter(f => !f.done);
  const allOpenFollowUps = channels.flatMap(c => c.followUps.filter(f => !f.done));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel.messages.length]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: allMembers[0],
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChannels(prev => prev.map(c => c.id === activeChannel ? { ...c, messages: [...c.messages, msg] } : c));
    setMessageInput("");
  };

  const addFollowUp = () => {
    if (!newFollowUp.text.trim() || !newFollowUp.assigneeId) return;
    const assignee = allMembers.find(m => m.id === newFollowUp.assigneeId)!;
    const fu: FollowUp = {
      id: `f-${Date.now()}`,
      text: newFollowUp.text,
      assignee,
      dueDate: newFollowUp.dueDate || "TBD",
      done: false,
      createdAt: "Just now",
    };
    setChannels(prev => prev.map(c => c.id === activeChannel ? { ...c, followUps: [...c.followUps, fu] } : c));
    setNewFollowUp({ text: "", assigneeId: "", dueDate: "" });
    setShowNewFollowUp(false);
  };

  const toggleFollowUp = (fuId: string) => {
    setChannels(prev => prev.map(c => c.id === activeChannel ? {
      ...c, followUps: c.followUps.map(f => f.id === fuId ? { ...f, done: !f.done } : f)
    } : c));
  };

  const createChannel = () => {
    if (!newChannel.name.trim()) return;
    const ch: Channel = {
      id: `ch-${Date.now()}`,
      name: newChannel.name,
      type: newChannel.type,
      description: newChannel.description,
      icon: newChannel.type === "region" ? "globe" : newChannel.type === "product" ? "package" : newChannel.type === "compliance" ? "shield" : "layers",
      color: newChannel.type === "region" ? "#30A46C" : newChannel.type === "product" ? "#D97706" : newChannel.type === "compliance" ? "#0171E3" : "#E5484D",
      members: [allMembers[0]],
      messages: [],
      followUps: [],
      unread: 0,
      pinned: false,
    };
    setChannels(prev => [...prev, ch]);
    setActiveChannel(ch.id);
    setShowCreateChannel(false);
    setNewChannel({ name: "", type: "general", description: "" });
  };

  const addMemberToChannel = (memberId: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== activeChannel) return c;
      if (c.members.some(m => m.id === memberId)) return c;
      const member = allMembers.find(m => m.id === memberId);
      return member ? { ...c, members: [...c.members, member] } : c;
    }));
  };

  const removeMemberFromChannel = (memberId: string) => {
    setChannels(prev => prev.map(c => c.id === activeChannel ? { ...c, members: c.members.filter(m => m.id !== memberId) } : c));
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Team Hub</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Conversations that move compliance forward
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allOpenFollowUps.length > 0 && (
            <motion.div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFB224]/8 text-[#D97706]"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Bell size={14} />
              <span className="text-[0.8125rem]">{allOpenFollowUps.length} open follow-ups</span>
            </motion.div>
          )}
          <BounceButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateChannel(true)}
            energyWeight={2}
          >
            New Channel
          </BounceButton>
        </div>
      </motion.div>

      {/* Main Layout — Sidebar + Chat */}
      <div className="flex gap-5 min-h-[calc(100vh-240px)]">

        {/* ═══ CHANNEL SIDEBAR ═══ */}
        <motion.div
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 flex flex-col overflow-hidden flex-shrink-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0, width: sidebarExpanded ? 340 : 68 }}
          transition={{ delay: 0.05, width: { type: "spring", stiffness: 300, damping: 30 } }}
          onMouseEnter={() => {
            if (!sidebarExpanded) {
              sidebarTimerRef.current = setTimeout(() => setSidebarExpanded(true), 200);
            }
          }}
          onMouseLeave={() => {
            if (sidebarTimerRef.current) {
              clearTimeout(sidebarTimerRef.current);
              sidebarTimerRef.current = null;
            }
            if (sidebarExpanded && activeChannel) {
              setSidebarExpanded(false);
            }
          }}
        >
          {/* Search + Filter */}
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 space-y-3 border-b border-border/30"
              >
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/20 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                  {(["all", "compliance", "region", "product", "general"] as const).map(type => (
                    <motion.button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] whitespace-nowrap cursor-pointer transition-all ${
                        filterType === type
                          ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(1,113,227,0.15)]"
                          : "text-muted-foreground/50 hover:text-foreground/60 hover:bg-muted/20"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {type === "all" ? <Filter size={10} /> : channelTypeConfig[type].icon}
                      {type === "all" ? "All" : channelTypeConfig[type].label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {sidebarExpanded ? (
              <>
                {pinnedChannels.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-2">
                      <Pin size={9} className="text-muted-foreground/25" />
                      <span className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest">Pinned</span>
                    </div>
                    {pinnedChannels.map(ch => (
                      <ChannelRow key={ch.id} channel={ch} active={activeChannel === ch.id} onClick={() => { setActiveChannel(ch.id); setShowFollowUps(false); setSidebarExpanded(false); }} />
                    ))}
                  </>
                )}
                {unpinnedChannels.length > 0 && (
                  <>
                    {pinnedChannels.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-2 mt-1">
                        <Hash size={9} className="text-muted-foreground/25" />
                        <span className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest">Channels</span>
                      </div>
                    )}
                    {unpinnedChannels.map(ch => (
                      <ChannelRow key={ch.id} channel={ch} active={activeChannel === ch.id} onClick={() => { setActiveChannel(ch.id); setShowFollowUps(false); setSidebarExpanded(false); }} />
                    ))}
                  </>
                )}
                {filteredChannels.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search size={24} className="text-muted-foreground/20 mb-3" />
                    <p className="text-[0.8125rem] text-muted-foreground/40">No channels found</p>
                  </div>
                )}
              </>
            ) : (
              /* Collapsed: icons only */
              <div className="flex flex-col items-center gap-1 pt-2">
                {channels.map(ch => {
                  const isActive = activeChannel === ch.id;
                  return (
                    <motion.button
                      key={ch.id}
                      onClick={() => { setActiveChannel(ch.id); setShowFollowUps(false); }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all relative ${
                        isActive
                          ? "bg-primary/8 shadow-[0_0_0_1px_rgba(1,113,227,0.12)]"
                          : "hover:bg-muted/20"
                      }`}
                      whileTap={{ scale: 0.92 }}
                      title={ch.name}
                    >
                      {ch.type === "region" ? <Globe size={16} style={{ color: ch.color }} /> :
                       ch.type === "product" ? <Package size={16} style={{ color: ch.color }} /> :
                       ch.type === "compliance" ? <Target size={16} style={{ color: ch.color }} /> :
                       <Layers size={16} style={{ color: ch.color }} />}
                      {ch.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[0.5rem] flex items-center justify-center">
                          {ch.unread}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ MAIN CHAT AREA ═══ */}
        <motion.div
          className="bg-card rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40 flex flex-col overflow-hidden flex-1 min-w-0"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Channel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${channel.color}12` }}>
                {channel.type === "region" ? <Globe size={16} style={{ color: channel.color }} /> :
                 channel.type === "product" ? <Package size={16} style={{ color: channel.color }} /> :
                 channel.type === "compliance" ? <Target size={16} style={{ color: channel.color }} /> :
                 <Layers size={16} style={{ color: channel.color }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground/80 tracking-tight truncate">{channel.name}</h3>
                  <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${channel.color}10`, color: `${channel.color}99` }}>
                    {channelTypeConfig[channel.type].label}
                  </span>
                </div>
                <p className="text-[0.75rem] text-muted-foreground/40 truncate">{channel.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Follow-ups badge */}
              {openFollowUps.length > 0 && (
                <motion.button
                  onClick={() => setShowFollowUps(!showFollowUps)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] cursor-pointer transition-all ${
                    showFollowUps ? "bg-[#FFB224]/10 text-[#D97706]" : "bg-muted/20 text-muted-foreground/50 hover:text-[#D97706] hover:bg-[#FFB224]/8"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Flag size={12} />
                  <span>{openFollowUps.length}</span>
                </motion.button>
              )}
              {/* Members */}
              <motion.button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/20 text-muted-foreground/50 hover:text-foreground/60 transition-colors cursor-pointer text-[0.75rem]"
                whileTap={{ scale: 0.95 }}
              >
                <Users size={12} />
                <span>{channel.members.length}</span>
              </motion.button>
            </div>
          </div>

          {/* Follow-ups Panel */}
          <AnimatePresence>
            {showFollowUps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="overflow-hidden border-b border-border/30"
              >
                <div className="p-5 bg-[#FFB224]/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag size={13} className="text-[#D97706]/60" />
                      <span className="text-[0.75rem] text-foreground/60">Follow-ups</span>
                    </div>
                    <motion.button
                      onClick={() => setShowNewFollowUp(!showNewFollowUp)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFB224]/10 text-[#D97706] text-[0.6875rem] cursor-pointer"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus size={10} />
                      Add
                    </motion.button>
                  </div>
                  {/* New follow-up form */}
                  <AnimatePresence>
                    {showNewFollowUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-xl bg-card border border-[#FFB224]/15 space-y-2.5">
                          <input
                            value={newFollowUp.text}
                            onChange={e => setNewFollowUp(p => ({ ...p, text: e.target.value }))}
                            placeholder="What needs to be done?"
                            className="w-full px-3 py-2 rounded-lg bg-muted/15 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/30 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={newFollowUp.assigneeId}
                              onChange={e => setNewFollowUp(p => ({ ...p, assigneeId: e.target.value }))}
                              className="flex-1 px-3 py-2 rounded-lg bg-muted/15 text-[0.75rem] text-foreground/60 focus:outline-none"
                            >
                              <option value="">Assign to...</option>
                              {channel.members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            <input
                              value={newFollowUp.dueDate}
                              onChange={e => setNewFollowUp(p => ({ ...p, dueDate: e.target.value }))}
                              placeholder="Due date"
                              className="w-[120px] px-3 py-2 rounded-lg bg-muted/15 text-[0.75rem] text-foreground/60 placeholder:text-muted-foreground/30 focus:outline-none"
                            />
                            <BounceButton variant="primary" size="sm" onClick={addFollowUp} icon={<Plus size={12} />}>Add</BounceButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Follow-up list */}
                  <div className="space-y-1.5">
                    {channel.followUps.map(fu => (
                      <motion.div
                        key={fu.id}
                        layout
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all ${fu.done ? "bg-muted/10 opacity-50" : "bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"}`}
                      >
                        <motion.button
                          onClick={() => toggleFollowUp(fu.id)}
                          className="mt-0.5 cursor-pointer flex-shrink-0"
                          whileTap={{ scale: 0.85 }}
                        >
                          {fu.done ? (
                            <CheckCircle2 size={16} className="text-[#30A46C]/60" />
                          ) : (
                            <Circle size={16} className="text-[#FFB224]/50" />
                          )}
                        </motion.button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[0.8125rem] ${fu.done ? "line-through text-muted-foreground/40" : "text-foreground/65"}`}>{fu.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[0.375rem] text-primary/60">{fu.assignee.initials}</div>
                              <span className="text-[0.625rem] text-muted-foreground/40">{fu.assignee.name}</span>
                            </div>
                            <span className="text-[0.5rem] text-muted-foreground/25">|</span>
                            <span className={`text-[0.625rem] flex items-center gap-1 ${fu.dueDate === "Today" ? "text-[#E5484D]/60" : "text-muted-foreground/35"}`}>
                              <CalendarDays size={9} />
                              {fu.dueDate}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {channel.followUps.length === 0 && (
                      <p className="text-center py-4 text-[0.8125rem] text-muted-foreground/30">No follow-ups yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Member Panel */}
          <AnimatePresence>
            {showAddMember && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="overflow-hidden border-b border-border/30"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-muted-foreground/40" />
                      <span className="text-[0.75rem] text-foreground/60">Members</span>
                      <span className="text-[0.625rem] text-muted-foreground/30 px-1.5 py-0.5 rounded-full bg-muted/20">{channel.members.length}</span>
                    </div>
                    <motion.button onClick={() => { setShowAddMember(false); setMemberSearchTerm(""); }} className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer" whileTap={{ scale: 0.9 }}>
                      <X size={14} />
                    </motion.button>
                  </div>

                  {/* Search members */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      value={memberSearchTerm}
                      onChange={e => setMemberSearchTerm(e.target.value)}
                      placeholder="Search by name, role, or country..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/15 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                    />
                  </div>

                  {/* Current members */}
                  <div>
                    <p className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest mb-2">In This Channel</p>
                    <div className="flex flex-wrap gap-2">
                      {channel.members
                        .filter(m =>
                          memberSearchTerm === "" ||
                          m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                          m.role.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                          m.country.toLowerCase().includes(memberSearchTerm.toLowerCase())
                        )
                        .map(m => (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/12 group">
                          <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[0.4375rem] text-primary/60">{m.initials}</div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${statusDot[m.status]}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.75rem] text-foreground/60">{m.name}</span>
                            <span className="text-[0.5625rem] text-muted-foreground/30">{m.role}</span>
                          </div>
                          <img src={getFlagUrl(m.countryCode)} alt={m.country} title={m.country} className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
                          <motion.button
                            onClick={() => removeMemberFromChannel(m.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground/25 hover:text-[#E5484D]/50 cursor-pointer transition-opacity"
                            whileTap={{ scale: 0.9 }}
                          >
                            <X size={10} />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available to add — searchable */}
                  {(() => {
                    const available = allMembers
                      .filter(m => !channel.members.some(cm => cm.id === m.id))
                      .filter(m =>
                        memberSearchTerm === "" ||
                        m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.role.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.country.toLowerCase().includes(memberSearchTerm.toLowerCase())
                      );
                    return available.length > 0 ? (
                      <>
                        <p className="text-[0.5625rem] text-muted-foreground/30 uppercase tracking-widest mt-2">
                          Add Members {memberSearchTerm && <span className="normal-case tracking-normal">· {available.length} found</span>}
                        </p>
                        <div className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin pr-1">
                          {available.map(m => (
                            <motion.button
                              key={m.id}
                              onClick={() => addMemberToChannel(m.id)}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-muted/8 hover:bg-primary/6 text-muted-foreground/50 hover:text-foreground/60 transition-all cursor-pointer"
                              whileTap={{ scale: 0.97 }}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="relative flex-shrink-0">
                                <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center text-[0.4375rem] text-primary/50">{m.initials}</div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px] border-card ${statusDot[m.status]}`} />
                              </div>
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-[0.75rem] text-foreground/60">{m.name}</span>
                                <span className="text-[0.5625rem] text-muted-foreground/30">{m.role}</span>
                              </div>
                              <img src={getFlagUrl(m.countryCode)} alt={m.country} title={m.country} className="w-[16px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] flex-shrink-0" />
                              <span className="text-[0.5625rem] text-muted-foreground/25 flex-shrink-0">{m.country}</span>
                              <Plus size={12} className="text-primary/40 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      </>
                    ) : memberSearchTerm ? (
                      <div className="text-center py-4">
                        <Search size={18} className="text-muted-foreground/15 mx-auto mb-2" />
                        <p className="text-[0.75rem] text-muted-foreground/30">No members match "{memberSearchTerm}"</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scrollbar-thin">
            {channel.messages.map((msg, i) => {
              const isOwn = msg.sender.id === "m1";
              const showAvatar = i === 0 || channel.messages[i - 1].sender.id !== msg.sender.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex gap-3 ${showAvatar ? "mt-5" : "mt-0.5"} ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center text-[0.5rem] text-primary/60">
                          {msg.sender.initials}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${statusDot[msg.sender.status]}`} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  {/* Bubble */}
                  <div className={`max-w-[70%] min-w-0 ${isOwn ? "items-end" : ""}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? "justify-end" : ""}`}>
                        <span className="text-[0.75rem] text-foreground/55">{msg.sender.name}</span>
                        <img src={getFlagUrl(msg.sender.countryCode)} alt="" className="w-[12px] rounded-[1px] opacity-50" />
                        <span className="text-[0.625rem] text-muted-foreground/25">{msg.timestamp}</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-[0.8125rem] leading-relaxed ${
                      isOwn
                        ? "bg-primary/8 text-foreground/70 rounded-tr-lg"
                        : "bg-muted/15 text-foreground/65 rounded-tl-lg"
                    }`}>
                      {msg.text}
                    </div>
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {msg.attachments.map((att, ai) => (
                          <div key={ai} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                            <FileText size={12} className="text-primary/40" />
                            <span className="text-[0.75rem] text-foreground/50">{att.name}</span>
                            <span className="text-[0.5625rem] text-muted-foreground/30">{att.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Follow-up indicator */}
                    {msg.followUp && (
                      <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFB224]/6 border border-[#FFB224]/10">
                        <Flag size={10} className="text-[#D97706]/50 flex-shrink-0" />
                        <span className="text-[0.6875rem] text-[#D97706]/70 flex-1">{msg.followUp.text}</span>
                        <span className="text-[0.5625rem] text-muted-foreground/30">{msg.followUp.dueDate}</span>
                      </div>
                    )}
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.625rem] cursor-pointer transition-colors ${
                            r.reacted ? "bg-primary/10 text-primary" : "bg-muted/15 text-muted-foreground/40 hover:bg-muted/25"
                          }`}>
                            {r.emoji === "thumbs-up" ? "👍" : r.emoji === "check" ? "✓" : r.emoji} {r.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {channel.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/6 flex items-center justify-center mb-4" style={{ color: channel.color }}>
                  <MessageCircle size={24} />
                </div>
                <p className="text-[0.875rem] text-foreground/50 mb-1">Start the conversation</p>
                <p className="text-[0.75rem] text-muted-foreground/35">Messages in this channel will appear here</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="px-5 py-4 border-t border-border/30">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message #${channel.name.toLowerCase()}...`}
                  rows={1}
                  className="w-full px-4 py-3 pr-24 rounded-2xl bg-muted/15 text-[0.8125rem] text-foreground/70 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none transition-all"
                />
                <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                  <motion.button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer transition-colors" whileTap={{ scale: 0.9 }}>
                    <Paperclip size={14} />
                  </motion.button>
                  <motion.button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground/30 hover:text-muted-foreground/50 cursor-pointer transition-colors" whileTap={{ scale: 0.9 }}>
                    <AtSign size={14} />
                  </motion.button>
                </div>
              </div>
              <motion.button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-3 rounded-xl bg-primary text-white shadow-[0_1px_8px_rgba(1,113,227,0.2)] disabled:opacity-30 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed transition-all"
                whileTap={{ scale: 0.92 }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ CREATE CHANNEL MODAL ═══ */}
      <AnimatePresence>
        {showCreateChannel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateChannel(false)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] max-w-[90vw] bg-card rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 p-7 space-y-5"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-foreground/80 tracking-tight">Create Channel</h3>
                <motion.button onClick={() => setShowCreateChannel(false)} className="text-muted-foreground/30 hover:text-muted-foreground/60 cursor-pointer" whileTap={{ scale: 0.9 }}>
                  <X size={16} />
                </motion.button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground/40 mb-1.5 block">Channel Name</label>
                  <input
                    value={newChannel.name}
                    onChange={e => setNewChannel(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., EU REACH Compliance"
                    className="w-full px-4 py-3 rounded-xl bg-muted/15 text-[0.875rem] text-foreground/70 placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground/40 mb-1.5 block">Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["region", "product", "compliance", "general"] as const).map(type => (
                      <motion.button
                        key={type}
                        onClick={() => setNewChannel(p => ({ ...p, type }))}
                        className={`flex flex-col items-center gap-2 py-3.5 rounded-xl text-[0.6875rem] cursor-pointer transition-all ${
                          newChannel.type === type
                            ? "bg-primary/8 text-primary shadow-[0_0_0_1.5px_rgba(1,113,227,0.2)]"
                            : "bg-muted/10 text-muted-foreground/40 hover:bg-muted/20"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {channelTypeConfig[type].icon}
                        {channelTypeConfig[type].label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground/40 mb-1.5 block">Description</label>
                  <textarea
                    value={newChannel.description}
                    onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))}
                    placeholder="What's this channel about?"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-muted/15 text-[0.8125rem] text-foreground/60 placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <BounceButton variant="secondary" size="md" onClick={() => setShowCreateChannel(false)}>Cancel</BounceButton>
                <BounceButton variant="primary" size="md" onClick={createChannel} icon={<Plus size={14} />} energyWeight={3}>Create Channel</BounceButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CHANNEL ROW ───────────────────────────────────────────

function ChannelRow({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left cursor-pointer transition-all ${
        active
          ? "bg-primary/6 shadow-[0_0_0_1px_rgba(1,113,227,0.1)]"
          : "hover:bg-muted/15"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${channel.color}10` }}>
        {channel.type === "region" ? <Globe size={14} style={{ color: channel.color }} /> :
         channel.type === "product" ? <Package size={14} style={{ color: channel.color }} /> :
         channel.type === "compliance" ? <Target size={14} style={{ color: channel.color }} /> :
         <Layers size={14} style={{ color: channel.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[0.8125rem] truncate ${active ? "text-foreground/70" : "text-foreground/55"}`}>{channel.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[0.625rem] text-muted-foreground/30">{channel.members.length} members</span>
          {channel.followUps.filter(f => !f.done).length > 0 && (
            <span className="flex items-center gap-0.5 text-[0.5625rem] text-[#D97706]/60">
              <Flag size={7} />
              {channel.followUps.filter(f => !f.done).length}
            </span>
          )}
        </div>
      </div>
      {channel.unread > 0 && (
        <span className="w-5 h-5 rounded-full bg-primary text-white text-[0.5625rem] flex items-center justify-center flex-shrink-0">
          {channel.unread}
        </span>
      )}
    </motion.button>
  );
}