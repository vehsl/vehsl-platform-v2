// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router";
import {
  Users, UserPlus, Shield, ShieldCheck, Search, Filter, MoreHorizontal,
  Package, Eye, Edit3, Trash2, CheckCircle2, XCircle, Clock,
  Truck, MapPin, Fuel, AlertTriangle, ArrowRight, Calendar,
  Settings, Bell, Lock, Palette, Globe, Database, Mail,
  ChevronRight, ArrowUpRight, TrendingUp, BarChart3, Star, X, Copy,
  ClipboardCheck, Camera, Download, Upload, FileText, Hash,
} from "lucide-react";
import { getApiBase, authedFetch, fetchJsonAuthed } from "@/lib/api";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { ProgressRing } from "./ProgressRing";
import { CustomAreaChart, HorizontalBarList } from "./CustomCharts";

/*
 * ════════════════════════════════════════════════════════════
 *  ADMIN SUB-MODULES — PLATONIC DESIGN
 *
 *  Each page answers ONE question clearly:
 *    Users    → "Who's on the platform?"
 *    Products → "What's being sold?"
 *    Logistics→ "How's stuff moving?"
 *    Quality  → "How good is everything?"
 *    Settings → "How is the system configured?"
 * ════════════════════════════════════════════════════════════
 */

// ─── SHARED ANIMATION ──────────────────────────────────────
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } },
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → USERS
// ════════════════════════════════════════════════════════════

const roleColors: Record<string, string> = {
  buyer: "#3B82F6",
  seller: "#30A46C",
  partner: "#D97706",
  admin: "#0171E3",
  manager: "#8B5CF6",
};

export function AdminUsers() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "buyer" | "seller" | "partner" | "manager">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "review" | "suspended">("all");
  const [activeNow, setActiveNow] = useState<boolean>(false);
  const [activePeriod, setActivePeriod] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesUrl, setMessagesUrl] = useState<string>("/messages");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [requestingMedia, setRequestingMedia] = useState(false);
  const [resetLinkOpen, setResetLinkOpen] = useState(false);
  const [resetLinkData, setResetLinkData] = useState<{ url: string; expires_at: string } | null>(null);

  const [menuUserId, setMenuUserId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [form, setForm] = useState<any>({
    id: null,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "buyer",
    admin_role: "logistics",
    status: "active",
    password: "",
  });

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [reviewUser, setReviewUser] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const formatNumber = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString();
  };

  const titleRole = (r: string) => {
    const x = (r || "").toString().toLowerCase();
    if (!x) return "—";
    return x[0].toUpperCase() + x.slice(1);
  };

  const relativeTime = (iso: any) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const diffMs = Date.now() - d.getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const statusToPill = (s: string) => {
    const x = (s || "").toString().toLowerCase();
    if (x === "active") return { status: "success", label: "active" };
    if (x === "pending") return { status: "pending", label: "pending" };
    if (x === "review") return { status: "warning", label: "review" };
    if (x === "suspended") return { status: "error", label: "suspended" };
    return { status: "pending", label: x || "unknown" };
  };

  const fetchJson = fetchJsonAuthed;

  const listFilters = useMemo(() => {
    const f: any = {};
    const s = search.trim();
    if (s) f.q = s;
    if (activeNow) f.active_now = 1;
    else if (activePeriod) f.active_period = activePeriod;
    if (roleFilter !== "all") {
      if (roleFilter === "manager") {
        f.role = "admin";
        f.admin_role = "manager";
      } else {
        f.role = roleFilter;
      }
    }
    if (statusFilter !== "all") f.admin_status = statusFilter;
    return f;
  }, [search, activeNow, activePeriod, roleFilter, statusFilter]);

  const {
    rows: listRows,
    count: totalCount,
    loading: loading,
    error: listError,
    page,
    pageSize,
    setPage,
    refresh: refreshUsers,
    totalPages,
  } = usePaginatedList<any>({
    endpoint: "/api/v1/admin/users/",
    filters: listFilters,
    initialOrdering: "",
    initialPageSize: 10,
    debounceMs: 250,
  });

  useEffect(() => {
    setUsers(listRows);
    setSelectedIds([]);
  }, [listRows]);

  const copyToClipboard = useCallback(
    async (text: string, successMsg: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setSuccess(successMsg);
      } catch {
        try {
          window.prompt("Copy to clipboard:", text);
        } catch {}
      }
    },
    []
  );

  const buildUsersParams = (opts?: { search?: string; roleFilter?: string; statusFilter?: string; page?: number }) => {
    const params = new URLSearchParams();
    const s = (opts?.search ?? search).trim();
    const rf = (opts?.roleFilter ?? roleFilter).toString();
    const sf = (opts?.statusFilter ?? statusFilter).toString();
    const p = opts?.page ?? 1;
    if (s) params.set("q", s);
    if (activeNow) params.set("active_now", "1");
    else if (activePeriod) params.set("active_period", activePeriod);
    if (rf !== "all") {
      if (rf === "manager") {
        params.set("role", "admin");
        params.set("admin_role", "manager");
      } else {
        params.set("role", rf);
      }
    }
    if (sf !== "all") params.set("admin_status", sf);
    if (p && p !== 1) params.set("page", String(p));
    return params;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const qIn = params.get("q");
    const roleIn = (params.get("role") || "").toLowerCase();
    const adminRoleIn = (params.get("admin_role") || "").toLowerCase();
    const statusIn = (params.get("admin_status") || "").toLowerCase();
    const activeNowIn = (params.get("active_now") || "").toLowerCase();
    const activePeriodIn = (params.get("active_period") || "").toLowerCase();
    const pageIn = Number(params.get("page") || "1");

    if (qIn != null) setSearch(qIn);

    if (roleIn === "admin" && adminRoleIn === "manager") setRoleFilter("manager");
    else if (roleIn === "buyer" || roleIn === "seller" || roleIn === "partner") setRoleFilter(roleIn as any);
    else if (!roleIn) setRoleFilter("all");

    if (statusIn === "active" || statusIn === "pending" || statusIn === "review" || statusIn === "suspended") {
      setStatusFilter(statusIn as any);
    } else if (!statusIn) {
      setStatusFilter("all");
    }

    const onNow = activeNowIn === "1" || activeNowIn === "true" || activeNowIn === "yes";
    setActiveNow(onNow);
    if (onNow) setActivePeriod("");
    else setActivePeriod(activePeriodIn);

    if (Number.isFinite(pageIn) && pageIn >= 1) setPage(Math.floor(pageIn));
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson("/api/v1/admin/users/stats");
        if (!cancelled) setStats(data);
      } catch (e: any) {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const threads = await fetchJson("/api/v1/chat/threads/");
        if (cancelled) return;
        const total = Array.isArray(threads)
          ? threads.reduce((sum: number, t: any) => sum + (Number(t?.unread_count || 0) || 0), 0)
          : 0;
        setUnreadMessages(total);
      } catch {
        if (!cancelled) setUnreadMessages(0);
      }
    };
    void loadUnread();
    const t = window.setInterval(() => void loadUnread(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (menuUserId == null) return;
    const onPointerDown = (e: Event) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(t)) return;
      setMenuUserId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuUserId]);

  const openCreate = () => {
    setFormMode("create");
    setFormError("");
    setForm({
      id: null,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "buyer",
      admin_role: "logistics",
      status: "active",
      password: "",
    });
    setFormOpen(true);
  };

  const openEdit = (u: any) => {
    setFormMode("edit");
    setFormError("");
    const rawRole = (u?.role || "buyer").toString().toLowerCase();
    const adminRole = (u?.admin_role || "").toString().toLowerCase();
    const isManager = rawRole === "admin" && adminRole && adminRole !== "super_admin";
    setForm({
      id: u?.id ?? null,
      first_name: u?.first_name || "",
      last_name: u?.last_name || "",
      email: u?.email || "",
      phone: u?.phone || "",
      role: isManager ? "manager" : rawRole,
      admin_role: isManager ? adminRole : "logistics",
      status: (u?.status || "active").toString().toLowerCase(),
      password: "",
    });
    setFormOpen(true);
  };

  const upsertUser = (updated: any) => {
    setUsers(prev => {
      const id = updated?.id;
      if (!id) return prev;
      const idx = prev.findIndex(x => x?.id === id);
      if (idx === -1) return [updated, ...prev];
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...updated };
      return copy;
    });
  };

  const saveUser = async () => {
    setFormError("");
    const passwordToSend = (form.password || "").trim();
    if (formMode === "create" && !passwordToSend) {
      setFormError("Password is required for new users.");
      return;
    }
    setSaving(true);
    try {
      setSuccess("");
      const roleRaw = (form.role || "buyer").toString().toLowerCase();
      const isManager = roleRaw === "manager";
      const roleToSend = isManager ? "admin" : roleRaw;
      const payload: any = {
        first_name: form.first_name || "",
        last_name: form.last_name || "",
        email: (form.email || "").trim() || null,
        phone: (form.phone || "").trim() || null,
        role: roleToSend,
        status: (form.status || "active").toString().toLowerCase(),
      };
      if (passwordToSend) payload.password = passwordToSend;
      if (isManager) payload.admin_role = (form.admin_role || "logistics").toString().toLowerCase();

      const data =
        formMode === "create"
          ? await fetchJson("/api/v1/admin/users/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetchJson(`/api/v1/admin/users/${form.id}/`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      upsertUser(data);
      setFormOpen(false);
      setSuccess(formMode === "create" ? "User created." : "User updated.");
      try {
        const newStats = await fetchJson("/api/v1/admin/users/stats");
        setStats(newStats);
      } catch {}
    } catch (e: any) {
      setFormError(e?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const setUserStatus = async (u: any, status: "active" | "suspended") => {
    try {
      const data = await fetchJson(`/api/v1/admin/users/${u.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      upsertUser(data);
      setMenuUserId(null);
      try {
        const newStats = await fetchJson("/api/v1/admin/users/stats");
        setStats(newStats);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to update user.");
    }
  };

  const generatePasswordResetLink = async (u: any) => {
    try {
      const data = await fetchJson(`/api/v1/admin/users/${u.id}/password-reset-link/`, { method: "POST" });
      const identifier = encodeURIComponent(data?.identifier || "");
      const token = encodeURIComponent(data?.token || "");
      const expires_at = (data?.expires_at || "").toString();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/?reset=1&identifier=${identifier}&token=${token}`;
      setResetLinkData({ url, expires_at });
      setResetLinkOpen(true);
      setMenuUserId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to generate reset link.");
    }
  };

  const openUserDetail = async (u: any) => {
    if (!u?.id) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await fetchJson(`/api/v1/admin/users/${u.id}/detail/`);
      setDetailData(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load user details.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const messageUser = async (userId: number) => {
    try {
      const data = await fetchJson("/api/v1/chat/threads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [userId] }),
      });
      const threadId = data?.id;
      if (!threadId) {
        setError("Failed to start chat.");
        return;
      }
      const rt = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      setMessagesUrl(`/messages?thread=${encodeURIComponent(String(threadId))}&returnTo=${rt}`);
      setMessagesOpen(true);
    } catch (e: any) {
      setError(e?.message || "Failed to start chat.");
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const ids = users.map(u => u?.id).filter((x: any) => typeof x === "number") as number[];
    setSelectedIds(prev => (prev.length === ids.length ? [] : ids));
  };

  const bulkStatus = async (nextStatus: "active" | "suspended") => {
    if (!selectedIds.length) return;
    try {
      await fetchJson("/api/v1/admin/users/bulk/status/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: nextStatus }),
      });
      setPage(1);
      setSelectedIds([]);
      refreshUsers();
      try {
        const newStats = await fetchJson("/api/v1/admin/users/stats");
        setStats(newStats);
      } catch {}
      setSuccess(`Updated ${nextStatus} for ${selectedIds.length} users.`);
    } catch (e: any) {
      setError(e?.message || "Bulk update failed.");
    }
  };

  const bulkRequestReverification = async () => {
    if (!selectedIds.length) return;
    try {
      await fetchJson("/api/v1/admin/users/bulk/request-reverification/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setPage(1);
      setSelectedIds([]);
      refreshUsers();
      try {
        const newStats = await fetchJson("/api/v1/admin/users/stats");
        setStats(newStats);
      } catch {}
      setSuccess("Re-verification requested.");
    } catch (e: any) {
      setError(e?.message || "Bulk re-verification failed.");
    }
  };

  const exportCsv = () => {
    const params = buildUsersParams({ page: 1 });
    const url = `${getApiBase()}/api/v1/admin/users/export/?${params.toString()}`;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  };

  const openSellerReview = (u: any, mode: "approve" | "reject") => {
    setReviewUser(u);
    setReviewMode(mode);
    setReviewReason("");
    setReviewOpen(true);
    setMenuUserId(null);
  };

  const submitSellerReview = async () => {
    if (!reviewUser?.id) return;
    setReviewSaving(true);
    setError("");
    try {
      const mode = reviewMode;
      const url =
        mode === "approve"
          ? `/api/v1/admin/users/${reviewUser.id}/seller-verify/approve/`
          : `/api/v1/admin/users/${reviewUser.id}/seller-verify/reject/`;

      const init: RequestInit =
        mode === "approve"
          ? { method: "POST" }
          : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reviewReason || "" }) };

      const data = await fetchJson(url, init);
      upsertUser(data);
      setReviewOpen(false);
      setReviewUser(null);
      setReviewReason("");
      try {
        const newStats = await fetchJson("/api/v1/admin/users/stats");
        setStats(newStats);
      } catch {}
      try {
        setPage(1);
        refreshUsers();
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to update seller verification.");
    } finally {
      setReviewSaving(false);
    }
  };

  const cardWrap = (active: boolean) =>
    `rounded-[1.25rem] transition-all focus:outline-none ${active ? "ring-2 ring-primary/30" : "ring-2 ring-transparent"}`;

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Users</h1>
          <p className="text-muted-foreground text-[0.875rem]">Everyone on TradeFlow. Buyers, sellers, and partners.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <BounceButton
              variant="ghost"
              size="sm"
              icon={<Mail size={14} />}
              onClick={() => {
                const rt = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                setMessagesUrl(`/messages?returnTo=${rt}`);
                setMessagesOpen(true);
              }}
            >
              Messages
            </BounceButton>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-[#E5484D] text-white text-[0.625rem] flex items-center justify-center tabular-nums">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </div>
          <BounceButton variant="primary" size="md" icon={<UserPlus size={16} />} onClick={openCreate}>Add User</BounceButton>
        </div>
      </motion.div>

      <AnimatePresence>
        {messagesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30"
            onClick={() => setMessagesOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[1100px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border/20">
                <div className="min-w-0">
                  <div className="text-foreground tracking-tight">Messages</div>
                  <div className="text-[0.75rem] text-muted-foreground/60 truncate">{messagesUrl}</div>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setMessagesOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <iframe
                key={messagesUrl}
                src={messagesUrl}
                className="w-full h-[78vh] bg-background"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <button
          type="button"
          className={cardWrap(statusFilter === "all")}
          onClick={() => {
            setStatusFilter("all");
          }}
        >
          <StatCard label="Total Users" value={formatNumber(stats?.total_users)} icon={<Users size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        </button>
        <button
          type="button"
          className={cardWrap(statusFilter === "active")}
          onClick={() => {
            setStatusFilter(v => (v === "active" ? "all" : "active"));
          }}
        >
          <StatCard label="Active" value={formatNumber(stats?.active)} icon={<Shield size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        </button>
        <button
          type="button"
          className={cardWrap(statusFilter === "pending")}
          onClick={() => {
            setStatusFilter(v => (v === "pending" ? "all" : "pending"));
          }}
        >
          <StatCard label="Pending Review" value={formatNumber(stats?.pending_review)} icon={<Clock size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        </button>
        <button
          type="button"
          className={cardWrap(statusFilter === "suspended")}
          onClick={() => {
            setStatusFilter(v => (v === "suspended" ? "all" : "suspended"));
          }}
        >
          <StatCard label="Suspended" value={formatNumber(stats?.suspended)} icon={<XCircle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
        </button>
      </motion.div>

      {/* Search + Filter */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "buyer", label: "Buyer" },
                { key: "seller", label: "Seller" },
                { key: "partner", label: "Partner" },
                { key: "manager", label: "Manager" },
              ].map(role => (
                <button
                  key={role.key}
                  onClick={() => setRoleFilter(role.key as any)}
                  className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer ${
                    roleFilter === role.key ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-2xl bg-muted/15 border border-border/30">
              <div className="flex items-center gap-3 text-[0.8125rem]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-muted-foreground/70">{selectedIds.length} selected</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/25 hover:bg-muted/35 text-[0.8125rem]"
                  onClick={() => bulkStatus("active")}
                >
                  Activate
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/25 hover:bg-muted/35 text-[0.8125rem]"
                  onClick={() => bulkStatus("suspended")}
                >
                  Suspend
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/25 hover:bg-muted/35 text-[0.8125rem]"
                  onClick={bulkRequestReverification}
                >
                  Request re-verification
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/25 hover:bg-muted/35 text-[0.8125rem]"
                  onClick={exportCsv}
                >
                  Export CSV
                </button>
              </div>
            </div>
          )}

          {/* User List */}
          {(error || listError) && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
              {error || listError}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#30A46C]/8 text-[#1f7a4a] text-[0.8125rem]">
              {success}
            </div>
          )}

          <div className="space-y-2">
            {loading && (
              <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                Loading users…
              </div>
            )}
            {!loading && users.length === 0 && (
              <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                No users found.
              </div>
            )}
            {users.map((user, i) => {
              const roleKey = (user?.role || "").toString().toLowerCase();
              const adminRole = (user?.admin_role || "").toString().toLowerCase();
              const displayRoleKey = roleKey === "admin" && adminRole && adminRole !== "super_admin" ? "manager" : roleKey;
              const roleColor = roleColors[displayRoleKey] || "#0171E3";
              const pill = statusToPill(user?.admin_status || user?.status);
              const isSeller = roleKey === "seller" || (user?.account_type || "").toString().toLowerCase() === "seller";
              const needsSellerReview = isSeller && (pill.label === "pending" || pill.label === "review");
              return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors group cursor-pointer"
                onClick={() => openUserDetail(user)}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleSelected(user.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-[0.75rem] text-white/90"
                  style={{ backgroundColor: roleColor }}
                >
                  {(user?.avatar || "U").toString().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground truncate">{user.display_name || "—"}</span>
                    <span className="text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${roleColor}10`, color: roleColor }}>
                      {titleRole(displayRoleKey)}
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{user.email || user.phone || "—"}</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-[0.75rem] text-muted-foreground/50">
                  <span>{formatNumber(user.orders_count)} orders</span>
                  <span>{relativeTime(user.last_active_at)}</span>
                </div>
                <StatusPill
                  status={pill.status as any}
                  label={pill.label}
                />
                <div className="relative">
                  <button
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-muted/30 cursor-pointer"
                    ref={(el) => {
                      if (menuUserId === user.id) menuButtonRef.current = el;
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setMenuUserId(prev => (prev === user.id ? null : user.id));
                    }}
                    aria-label="User actions"
                  >
                    <MoreHorizontal size={16} className="text-muted-foreground/40" />
                  </button>
                  <AnimatePresence>
                    {menuUserId === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-border/40 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                        ref={(el) => {
                          if (menuUserId === user.id) menuRef.current = el;
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => {
                            setMenuUserId(null);
                            openUserDetail(user);
                          }}
                        >
                          <Eye size={14} className="text-muted-foreground/60" />
                          View details
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => {
                            setMenuUserId(null);
                            messageUser(user.id);
                          }}
                        >
                          <Mail size={14} className="text-muted-foreground/60" />
                          Message
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2 disabled:opacity-60"
                          onClick={() => {
                            const idOrEmail = (user.email || user.phone || "").toString();
                            void copyToClipboard(idOrEmail, "Copied user identifier.");
                            setMenuUserId(null);
                          }}
                          disabled={!(user.email || user.phone)}
                        >
                          <Copy size={14} className="text-muted-foreground/60" />
                          Copy email/phone
                        </button>
                        <div className="h-px bg-border/30" />
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => {
                            setMenuUserId(null);
                            openEdit(user);
                          }}
                        >
                          <Edit3 size={14} className="text-muted-foreground/60" />
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => {
                            setMenuUserId(null);
                            generatePasswordResetLink(user);
                          }}
                        >
                          <Lock size={14} className="text-muted-foreground/60" />
                          Reset Link
                        </button>
                        {needsSellerReview && (
                          <>
                            <button
                              className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                              onClick={() => openSellerReview(user, "approve")}
                            >
                              <CheckCircle2 size={14} className="text-[#30A46C]/80" />
                              Approve Seller
                            </button>
                            <button
                              className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                              onClick={() => openSellerReview(user, "reject")}
                            >
                              <XCircle size={14} className="text-[#E5484D]/80" />
                              Reject Seller
                            </button>
                          </>
                        )}
                        {(user?.status || "").toString().toLowerCase() === "suspended" ? (
                          <button
                            className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                            onClick={() => setUserStatus(user, "active")}
                          >
                            <CheckCircle2 size={14} className="text-[#30A46C]/80" />
                            Activate
                          </button>
                        ) : (
                          <button
                            className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                            onClick={() => setUserStatus(user, "suspended")}
                          >
                            <XCircle size={14} className="text-[#E5484D]/80" />
                            Suspend
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )})}
          </div>
          {!loading && users.length > 0 && (
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[0.75rem] text-muted-foreground/60">
                {(() => {
                  const start = (page - 1) * pageSize + 1;
                  const end = start + users.length - 1;
                  if (totalCount != null) return `Showing ${start}-${end} of ${formatNumber(totalCount)}`;
                  return `Showing ${start}-${end}`;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/30 text-[0.75rem] text-muted-foreground/80 disabled:opacity-50"
                  onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                  disabled={loading || page <= 1}
                >
                  Prev
                </button>
                <div className="text-[0.75rem] text-muted-foreground/60">
                  Page {page}{totalPages ? ` / ${totalPages}` : ""}
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/30 text-[0.75rem] text-muted-foreground/80 disabled:opacity-50"
                  onClick={() => setPage((p: number) => p + 1)}
                  disabled={loading || (totalPages != null ? page >= totalPages : users.length < pageSize)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>


      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[520px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">{formMode === "create" ? "Add User" : "Edit User"}</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">Create accounts for buyers, sellers, partners, admins, or managers.</p>
                </div>
                <button
                  className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60"
                  onClick={() => setFormOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.first_name}
                  onChange={e => setForm((p: any) => ({ ...p, first_name: e.target.value }))}
                  placeholder="First name"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.last_name}
                  onChange={e => setForm((p: any) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Last name"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.email}
                  onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))}
                  placeholder="Email (optional if phone)"
                  className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.phone}
                  onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone (optional if email)"
                  className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <select
                  value={form.role}
                  onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
                {(form.role || "").toString().toLowerCase() === "manager" ? (
                  <select
                    value={form.admin_role}
                    onChange={e => setForm((p: any) => ({ ...p, admin_role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  >
                    <option value="logistics">Ops Manager</option>
                    <option value="compliance">Legal Manager</option>
                    <option value="support">Support Manager</option>
                    <option value="inspector">Inspector Manager</option>
                    <option value="finance">Finance Manager</option>
                  </select>
                ) : (
                <select
                  value={form.status}
                  onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                )}
                {(form.role || "").toString().toLowerCase() === "manager" && (
                  <select
                    value={form.status}
                    onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                )}
                <input
                  value={form.password}
                  onChange={e => setForm((p: any) => ({ ...p, password: e.target.value }))}
                  placeholder={formMode === "create" ? "Password (required)" : "New password (optional)"}
                  type="password"
                  className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <BounceButton variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={saving ? undefined : saveUser}
                  className={saving ? "opacity-70 pointer-events-none" : ""}
                  icon={saving ? <Clock size={14} /> : <UserPlus size={14} />}
                >
                  {saving ? "Saving…" : formMode === "create" ? "Create" : "Save"}
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => {
              if (!reviewSaving) setReviewOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[520px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">
                    {reviewMode === "approve" ? "Approve seller account" : "Reject seller account"}
                  </h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    {reviewUser?.display_name || reviewUser?.email || reviewUser?.phone || "Seller"} · Only admins can perform this action.
                  </p>
                </div>
                <button
                  className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60"
                  onClick={() => {
                    if (!reviewSaving) setReviewOpen(false);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {reviewMode === "reject" && (
                <div className="mb-5">
                  <label className="block text-[0.75rem] text-muted-foreground/70 mb-2">Reason (optional)</label>
                  <textarea
                    value={reviewReason}
                    onChange={e => setReviewReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    placeholder="Write a short reason for rejection…"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <BounceButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!reviewSaving) setReviewOpen(false);
                  }}
                >
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={reviewSaving ? undefined : submitSellerReview}
                  className={reviewSaving ? "opacity-70 pointer-events-none" : ""}
                  icon={
                    reviewSaving ? (
                      <Clock size={14} />
                    ) : reviewMode === "approve" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )
                  }
                >
                  {reviewSaving ? "Saving…" : reviewMode === "approve" ? "Approve" : "Reject"}
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetLinkOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setResetLinkOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[620px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">Password reset link</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    Expires: {resetLinkData?.expires_at ? new Date(resetLinkData.expires_at).toLocaleString() : "—"}
                  </p>
                </div>
                <button
                  className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60"
                  onClick={() => setResetLinkOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl bg-muted/15 border border-border/30 p-4">
                <div className="text-[0.75rem] text-muted-foreground/70 mb-2">Share this link with the user:</div>
                <div className="text-[0.8125rem] break-all text-foreground/90">{resetLinkData?.url || "—"}</div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <BounceButton variant="ghost" size="sm" onClick={() => setResetLinkOpen(false)}>
                  Close
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const url = resetLinkData?.url || "";
                    if (!url) return;
                    navigator.clipboard?.writeText?.(url);
                    setSuccess("Reset link copied.");
                    setResetLinkOpen(false);
                  }}
                  icon={<Copy size={14} />}
                >
                  Copy link
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-card border-l border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="text-[0.75rem] text-muted-foreground/60">User 360</div>
                  <h2 className="text-foreground tracking-tight truncate">
                    {detailData?.user?.display_name || detailData?.user?.email || detailData?.user?.phone || "—"}
                  </h2>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setDetailOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {detailLoading ? (
                <div className="px-4 py-3 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/70">Loading…</div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <BounceButton
                      variant="primary"
                      size="sm"
                      onClick={() => messageUser(detailData?.user?.id)}
                      icon={<Mail size={14} />}
                    >
                      Message
                    </BounceButton>
                    <BounceButton
                      variant="ghost"
                      size="sm"
                      onClick={() => generatePasswordResetLink(detailData?.user)}
                      icon={<Lock size={14} />}
                    >
                      Reset link
                    </BounceButton>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-muted/10 border border-border/30 p-4">
                      <div className="text-[0.75rem] text-muted-foreground/70 mb-2">Profile</div>
                      <div className="text-[0.8125rem] text-foreground/90">
                        <div>Email: {detailData?.user?.email || "—"}</div>
                        <div>Phone: {detailData?.user?.phone || "—"}</div>
                        <div>Role: {detailData?.user?.role || "—"}</div>
                        <div>Status: {detailData?.user?.status || "—"}</div>
                        <div>Last active: {detailData?.user?.last_active_at ? relativeTime(detailData.user.last_active_at) : "—"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/10 border border-border/30 p-4">
                      <div className="text-[0.75rem] text-muted-foreground/70 mb-2">Commerce</div>
                      <div className="grid grid-cols-2 gap-2 text-[0.8125rem] text-foreground/90">
                        <div>Buyer orders: {formatNumber(detailData?.commerce?.buyer_orders_count)}</div>
                        <div>Seller orders: {formatNumber(detailData?.commerce?.seller_orders_count)}</div>
                        <div>Shipments: {formatNumber(detailData?.commerce?.shipments_count)}</div>
                        <div>Disputes: {formatNumber(detailData?.commerce?.disputes_count)}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/10 border border-border/30 p-4">
                      <div className="text-[0.75rem] text-muted-foreground/70 mb-2">Security</div>
                      <div className="grid grid-cols-2 gap-2 text-[0.8125rem] text-foreground/90">
                        <div>2FA: {detailData?.security?.two_factor_enabled ? "Enabled" : "Off"}</div>
                        <div>Recovery codes: {detailData?.security?.recovery_generated ? "Generated" : "Not generated"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/10 border border-border/30 p-4">
                      <div className="text-[0.75rem] text-muted-foreground/70 mb-2">KYC Documents</div>
                      {(detailData?.kyc?.documents || []).length ? (
                        <div className="space-y-2">
                          {(detailData.kyc.documents || []).slice(0, 8).map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between text-[0.8125rem]">
                              <div className="text-foreground/90">{d.doc_type || d.kind || "Document"}</div>
                              <div className="text-muted-foreground/70">{d.review_status || "—"}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[0.8125rem] text-muted-foreground/70">No documents.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → PRODUCTS
// ════════════════════════════════════════════════════════════

export function AdminProducts() {
  const fetchJson = fetchJsonAuthed;
  const location = useLocation();

  const formatNumber = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString();
  };

  const formatMoney = (currency: string, price: any) => {
    const c = (currency || "USD").toString().toUpperCase();
    const n = Number(price);
    if (!Number.isFinite(n)) return "—";
    const sym = c === "USD" ? "$" : `${c} `;
    return `${sym}${n.toFixed(2)}`;
  };

  const productStatusToPill = (s: string) => {
    const x = (s || "").toString().toLowerCase();
    if (x === "active") return { status: "success", label: "Active" };
    if (x === "low_stock") return { status: "warning", label: "Low Stock" };
    if (x === "out") return { status: "error", label: "Out" };
    if (x === "review") return { status: "pending", label: "Review" };
    return { status: "pending", label: x || "Review" };
  };

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "low_stock" | "out" | "review" | "compliance">("all");
  const [exactStatusFilter, setExactStatusFilter] = useState<string>("");
  const [missingHsCodeFilter, setMissingHsCodeFilter] = useState<boolean>(false);
  const [missingMediaFilter, setMissingMediaFilter] = useState<boolean>(false);
  const [missingDocumentsFilter, setMissingDocumentsFilter] = useState<boolean>(false);
  const [rejectedWithReasonFilter, setRejectedWithReasonFilter] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [actionError, setActionError] = useState<string>("");
  const listFilters = useMemo(() => {
    const f: any = {};
    const q = search.trim();
    if (q) f.q = q;
    if (catFilter !== "all") f.category = catFilter;
    if (statusFilter === "compliance") f.needs_compliance = 1;
    else if (statusFilter !== "all") f.admin_status = statusFilter;
    if (exactStatusFilter) f.status = exactStatusFilter;
    if (missingHsCodeFilter) f.missing_hs_code = 1;
    if (missingMediaFilter) f.missing_media = 1;
    if (missingDocumentsFilter) f.missing_documents = 1;
    if (rejectedWithReasonFilter) f.rejected_with_reason = 1;
    return f;
  }, [
    search,
    catFilter,
    statusFilter,
    exactStatusFilter,
    missingHsCodeFilter,
    missingMediaFilter,
    missingDocumentsFilter,
    rejectedWithReasonFilter,
  ]);

  const {
    rows: products,
    count: totalCount,
    loading,
    error,
    page,
    pageSize,
    ordering,
    setPage,
    setPageSize,
    setOrdering,
    refresh: refreshProducts,
    totalPages,
  } = usePaginatedList<any>({
    endpoint: "/api/v1/admin/products/",
    filters: listFilters,
    initialOrdering: "-created_at",
    initialPageSize: 20,
    debounceMs: 250,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const category = (params.get("category") || "").trim();
    const adminStatus = (params.get("admin_status") || "").trim().toLowerCase();
    const needsCompliance = (params.get("needs_compliance") || "").trim().toLowerCase();
    const status = (params.get("status") || "").trim().toLowerCase();
    const missingHsCode = (params.get("missing_hs_code") || "").trim().toLowerCase();
    const missingMedia = (params.get("missing_media") || "").trim().toLowerCase();
    const missingDocuments = (params.get("missing_documents") || "").trim().toLowerCase();
    const rejectedWithReason = (params.get("rejected_with_reason") || "").trim().toLowerCase();

    setSearch(q);
    setCatFilter(category || "all");

    if (adminStatus && ["all", "active", "low_stock", "out", "review", "compliance"].includes(adminStatus)) {
      setStatusFilter(adminStatus as any);
    } else if (needsCompliance === "1" || needsCompliance === "true" || needsCompliance === "yes") {
      setStatusFilter("compliance");
    } else {
      setStatusFilter("all");
    }

    setExactStatusFilter(status);
    setMissingHsCodeFilter(missingHsCode === "1" || missingHsCode === "true" || missingHsCode === "yes");
    setMissingMediaFilter(missingMedia === "1" || missingMedia === "true" || missingMedia === "yes");
    setMissingDocumentsFilter(missingDocuments === "1" || missingDocuments === "true" || missingDocuments === "yes");
    setRejectedWithReasonFilter(rejectedWithReason === "1" || rejectedWithReason === "true" || rejectedWithReason === "yes");

    setPage(1);
  }, [location.search, setPage]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<any>({
    name: "",
    seller_email: "",
    category_id: "",
    hs_code: "",
    currency: "USD",
    price: "",
    stock_units: "",
    status: "active",
    vehsl_rating: "",
  });

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<"" | "status" | "category" | "hs_code" | "stock">("");
  const [bulkStatus, setBulkStatus] = useState<string>("active");
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [bulkHsCode, setBulkHsCode] = useState<string>("");
  const [bulkStockUnits, setBulkStockUnits] = useState<string>("");

  const [menuProductId, setMenuProductId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const [stockOpen, setStockOpen] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockProductId, setStockProductId] = useState<number | null>(null);
  const [stockValue, setStockValue] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsData, catsData] = await Promise.all([
          fetchJson("/api/v1/admin/products/stats"),
          fetchJson("/api/v1/admin/products/categories"),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCategories(Array.isArray(catsData) ? catsData : []);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshStats = async () => {
    try {
      const statsData = await fetchJson("/api/v1/admin/products/stats");
      setStats(statsData);
    } catch {}
  };

  const openCreate = () => {
    setFormError("");
    setActionError("");
    setFormMode("create");
    setEditingId(null);
    setForm({
      name: "",
      seller_email: "",
      category_id: categories?.[0]?.id ? String(categories[0].id) : "",
      hs_code: "",
      currency: "USD",
      price: "",
      stock_units: "",
      status: "active",
      vehsl_rating: "",
    });
    setFormOpen(true);
  };

  const openEditProduct = (p: any) => {
    setFormError("");
    setActionError("");
    setFormMode("edit");
    setEditingId(Number(p?.id || 0) || null);
    setForm({
      name: p?.name || "",
      seller_email: "",
      category_id: p?.category != null ? String(p.category) : categories?.[0]?.id ? String(categories[0].id) : "",
      hs_code: p?.hs_code || "",
      currency: p?.currency || "USD",
      price: p?.price != null ? String(p.price) : "",
      stock_units: p?.stock_units != null ? String(p.stock_units) : "",
      status: (p?.status || "active").toString().toLowerCase(),
      vehsl_rating: p?.vehsl_rating != null ? String(p.vehsl_rating) : "",
    });
    setFormOpen(true);
    setMenuProductId(null);
  };

  const openProductDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setMenuProductId(null);
    try {
      const data = await fetchJson(`/api/v1/admin/products/${id}/detail/`);
      setDetailData(data);
    } catch (e: any) {
      setDetailData(null);
      setActionError(e?.message || "Failed to load product detail.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openStockModal = (p: any) => {
    setStockProductId(Number(p?.id || 0) || null);
    setStockValue(p?.stock_units != null ? String(p.stock_units) : "");
    setStockOpen(true);
    setMenuProductId(null);
  };

  const requestMedia = async () => {
    const id = Number(detailData?.product?.id || 0);
    if (!id) return;
    setRequestingMedia(true);
    try {
      setActionError("");
      await fetchJson(`/api/v1/admin/products/${id}/request-media/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Please upload a hero image + at least 3 additional photos. Add HS code and any required compliance documents.",
        }),
      });
    } catch (e: any) {
      setActionError(e?.message || "Failed to request media.");
    } finally {
      setRequestingMedia(false);
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload: any = {};
      if ((form.name || "").toString().trim()) payload.name = (form.name || "").trim();
      if (String(form.category_id || "").trim()) payload.category_id = Number(form.category_id);
      if (String(form.currency || "").trim()) payload.currency = (form.currency || "USD").toString().toUpperCase();
      if (String(form.price || "").trim() !== "") payload.price = Number(form.price);
      if (String(form.status || "").trim()) payload.status = (form.status || "active").toString().toLowerCase();
      if ("hs_code" in form) payload.hs_code = (form.hs_code || "").trim();
      const vr = (form.vehsl_rating || "").toString().trim();
      if (vr !== "") payload.vehsl_rating = Number(vr);
      const stock = (form.stock_units || "").toString().trim();
      if (stock !== "") payload.stock_units = Number(stock);
      if (formMode === "create") {
        payload.seller_email = (form.seller_email || "").trim();
        await fetchJson("/api/v1/admin/products/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        if (!editingId) throw new Error("Missing product id.");
        await fetchJson(`/api/v1/admin/products/${editingId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setFormOpen(false);
      setPage(1);
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setFormError(e?.message || (formMode === "create" ? "Failed to add product." : "Failed to update product."));
    } finally {
      setSaving(false);
    }
  };

  const setProductStatus = async (id: number, action: "approve" | "reject" | "archive" | "activate") => {
    try {
      setActionError("");
      await fetchJson(`/api/v1/admin/products/${id}/${action}/`, { method: "POST" });
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setActionError(e?.message || "Action failed.");
    }
  };

  const exportOne = async (id: number) => {
    try {
      setActionError("");
      const res = await authedFetch(`/api/v1/admin/products/${id}/export/`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin_product_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setActionError(e?.message || "Export failed.");
    }
  };

  const saveStock = async () => {
    if (!stockProductId) return;
    setStockSaving(true);
    try {
      setActionError("");
      const qty = Number(stockValue);
      if (!Number.isFinite(qty) || qty < 0) throw new Error("Stock must be >= 0.");
      await fetchJson(`/api/v1/admin/products/${stockProductId}/stock/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_units: Math.floor(qty) }),
      });
      setStockOpen(false);
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setActionError(e?.message || "Failed to update stock.");
    } finally {
      setStockSaving(false);
    }
  };

  useEffect(() => {
    if (menuProductId == null) return;
    const onPointerDown = (e: Event) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(t)) return;
      setMenuProductId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuProductId]);

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (catFilter !== "all") params.set("category", catFilter);
      if (statusFilter !== "all") params.set("admin_status", statusFilter);
      if (ordering) params.set("ordering", ordering);
      const res = await authedFetch(`/api/v1/admin/products/export/?${params.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admin_products.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setActionError(e?.message || "Export failed.");
    }
  };

  const toggleSelectedProduct = (id: number) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllProducts = () => {
    const ids = products.map((p: any) => Number(p?.id || 0)).filter((x: any) => Number.isFinite(x) && x > 0);
    setSelectedProductIds((prev) => (prev.length === ids.length ? [] : ids));
  };

  const applyBulk = async () => {
    if (!selectedProductIds.length || !bulkAction) return;
    try {
      setActionError("");
      if (bulkAction === "status") {
        await fetchJson("/api/v1/admin/products/bulk/status/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedProductIds, status: bulkStatus }),
        });
      } else if (bulkAction === "category") {
        await fetchJson("/api/v1/admin/products/bulk/category/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedProductIds, category_id: Number(bulkCategoryId) }),
        });
      } else if (bulkAction === "hs_code") {
        await fetchJson("/api/v1/admin/products/bulk/hs-code/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedProductIds, hs_code: (bulkHsCode || "").trim() }),
        });
      } else if (bulkAction === "stock") {
        await fetchJson("/api/v1/admin/products/bulk/stock/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedProductIds, stock_units: Number(bulkStockUnits) }),
        });
      }
      setSelectedProductIds([]);
      setBulkAction("");
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setActionError(e?.message || "Bulk action failed.");
    }
  };

  const exportSelected = async () => {
    if (!selectedProductIds.length) return;
    try {
      setActionError("");
      const res = await authedFetch("/api/v1/admin/products/bulk/export/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admin_products_selected.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setActionError(e?.message || "Export failed.");
    }
  };

  const total = typeof totalCount === "number" ? totalCount : products.length;
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = totalPages != null ? page < totalPages : products.length === pageSize;

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Products</h1>
          <p className="text-muted-foreground text-[0.875rem]">Everything listed on TradeFlow. Manage catalog and compliance.</p>
        </div>
        <div className="flex gap-2">
          <BounceButton variant="ghost" size="sm" icon={<Download size={14} />} onClick={exportCsv}>Export</BounceButton>
          <BounceButton variant="primary" size="md" icon={<Package size={16} />} onClick={openCreate}>Add Product</BounceButton>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-5 gap-5">
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "all" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter("all")}>
          <StatCard label="Total Products" value={formatNumber(stats?.total_products)} icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "active" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "active" ? "all" : "active"))}>
          <StatCard label="Active Listings" value={formatNumber(stats?.active_listings)} icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "low_stock" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "low_stock" ? "all" : "low_stock"))}>
          <StatCard label="Low Stock" value={formatNumber(stats?.low_stock)} icon={<AlertTriangle size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "out" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "out" ? "all" : "out"))}>
          <StatCard label="Out of Stock" value={formatNumber(stats?.out_of_stock)} icon={<XCircle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "review" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "review" ? "all" : "review"))}>
          <StatCard label="Pending Review" value={formatNumber(stats?.pending_review)} icon={<Eye size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={4} accentColor="#8B5CF6" />
        </button>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={ordering}
                onChange={e => setOrdering(e.target.value)}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
              >
                <option value="-created_at">Newest</option>
                <option value="created_at">Oldest</option>
                <option value="-needs_compliance">Needs compliance</option>
                <option value="-price">Price (high)</option>
                <option value="price">Price (low)</option>
                <option value="-stock_units">Stock (high)</option>
                <option value="stock_units">Stock (low)</option>
                <option value="-vehsl_rating">Rating (high)</option>
                <option value="name">Name (A–Z)</option>
              </select>
              <select
                value={String(pageSize)}
                onChange={e => setPageSize(Number(e.target.value) || 20)}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
              >
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
              <button
                key="all"
                onClick={() => setCatFilter("all")}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${catFilter === "all" ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(v => (v === "compliance" ? "all" : "compliance"))}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "compliance" ? "bg-[#E5484D]/10 text-[#E5484D]/80" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Needs compliance
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.slug || cat.id}
                  onClick={() => setCatFilter(cat.slug || String(cat.id))}
                  className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                    catFilter === (cat.slug || String(cat.id)) ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {(actionError || error) && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
              {actionError || error}
            </div>
          )}

          {selectedProductIds.length > 0 && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-muted/10 border border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAllProducts}
                  className="w-9 h-9 rounded-2xl bg-muted/20 hover:bg-muted/30 border border-border/20 flex items-center justify-center"
                  title="Select all"
                >
                  <ClipboardCheck size={16} className="text-muted-foreground/70" />
                </button>
                <div className="text-[0.8125rem] text-foreground/80">
                  {selectedProductIds.length} selected
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="px-3 py-2 rounded-xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  <option value="">Bulk action…</option>
                  <option value="status">Set status</option>
                  <option value="category">Set category</option>
                  <option value="hs_code">Set HS code</option>
                  <option value="stock">Set stock</option>
                </select>

                {bulkAction === "status" && (
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                )}

                {bulkAction === "category" && (
                  <select
                    value={bulkCategoryId || ""}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="px-3 py-2 rounded-xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {bulkAction === "hs_code" && (
                  <input
                    value={bulkHsCode}
                    onChange={(e) => setBulkHsCode(e.target.value)}
                    placeholder="HS code"
                    className="px-3 py-2 rounded-xl text-[0.8125rem] bg-muted/20 border border-border/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                )}

                {bulkAction === "stock" && (
                  <input
                    value={bulkStockUnits}
                    onChange={(e) => setBulkStockUnits(e.target.value)}
                    placeholder="Stock units"
                    inputMode="numeric"
                    className="px-3 py-2 rounded-xl text-[0.8125rem] bg-muted/20 border border-border/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                )}

                <BounceButton variant="ghost" size="sm" onClick={exportSelected} icon={<Download size={14} />}>
                  Export selected
                </BounceButton>
                <BounceButton variant="primary" size="sm" onClick={applyBulk} icon={<CheckCircle2 size={14} />}>
                  Apply
                </BounceButton>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="px-3 py-2 rounded-xl text-[0.8125rem] text-muted-foreground/70 hover:text-foreground hover:bg-muted/20"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {loading && (
              <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                Loading products…
              </div>
            )}
            {!loading && products.length === 0 && (
              <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                No products found.
              </div>
            )}
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(Number(p.id))}
                  onChange={() => toggleSelectedProduct(Number(p.id))}
                  className="h-4 w-4 rounded border-border/60"
                />
                <div className="w-10 h-10 rounded-2xl bg-primary/6 flex items-center justify-center">
                  <Package size={18} className="text-primary/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground truncate">{p.name}</span>
                    {!!p.hs_code && <span className="text-[0.6875rem] text-muted-foreground/40 hidden sm:inline">HS {p.hs_code}</span>}
                    {!!p?.needs_compliance && (
                      <span className="text-[0.6875rem] text-[#E5484D]/80 hidden sm:inline">Needs compliance</span>
                    )}
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{p.seller_name || "—"} · {p.category_name || "—"}</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-[0.8125rem]">
                  <span className="text-foreground/70">{formatMoney(p.currency, p.price)}</span>
                  <span className={`${Number(p.stock_units) === 0 ? "text-[#E5484D]/80" : Number(p.stock_units) < 50 ? "text-[#FFB224]/80" : "text-muted-foreground/50"}`}>
                    {Number(p.stock_units) === 0 ? "Out of stock" : `${formatNumber(p.stock_units)} units`}
                  </span>
                  {Number(p.vehsl_rating) > 0 && (
                    <span className="flex items-center gap-1 text-[#FFB224]/80">
                      <Star size={12} fill="#FFB224" />
                      {Number(p.vehsl_rating).toFixed(1)}
                    </span>
                  )}
                </div>
                {(() => {
                  const pill = productStatusToPill(p.admin_status);
                  return <StatusPill status={pill.status as any} label={pill.label} />;
                })()}
                <div className="relative">
                  <button
                    ref={(el) => {
                      if (menuProductId === p.id) menuButtonRef.current = el;
                    }}
                    className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuProductId((cur) => (cur === p.id ? null : p.id));
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  <AnimatePresence>
                    {menuProductId === p.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-border/40 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                        ref={(el) => {
                          if (menuProductId === p.id) menuRef.current = el;
                        }}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => openProductDetail(Number(p.id))}
                        >
                          <Eye size={14} className="text-muted-foreground/60" />
                          View details
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => openEditProduct(p)}
                        >
                          <Edit3 size={14} className="text-muted-foreground/60" />
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => openStockModal(p)}
                        >
                          <Hash size={14} className="text-muted-foreground/60" />
                          Adjust stock
                        </button>
                        <div className="h-px bg-border/30" />
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => setProductStatus(Number(p.id), "approve")}
                        >
                          <CheckCircle2 size={14} className="text-[#30A46C]/80" />
                          Approve
                        </button>
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => setProductStatus(Number(p.id), "reject")}
                        >
                          <XCircle size={14} className="text-[#E5484D]/80" />
                          Reject
                        </button>
                        {String(p.status || "").toLowerCase() === "archived" ? (
                          <button
                            className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                            onClick={() => setProductStatus(Number(p.id), "activate")}
                          >
                            <CheckCircle2 size={14} className="text-[#30A46C]/80" />
                            Activate
                          </button>
                        ) : (
                          <button
                            className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                            onClick={() => setProductStatus(Number(p.id), "archive")}
                          >
                            <Trash2 size={14} className="text-muted-foreground/60" />
                            Archive
                          </button>
                        )}
                        <div className="h-px bg-border/30" />
                        {/*
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => {
                            const text = `id:${p.id} sku:${p.sku || ""} hs:${p.hs_code || ""}`.trim();
                            void navigator.clipboard.writeText(text);
                            setMenuProductId(null);
                          }}
                        >
                          <Copy size={14} className="text-muted-foreground/60" />
                          Copy ID/SKU/HS
                        </button>
                        */}
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => exportOne(Number(p.id))}
                        >
                          <Download size={14} className="text-muted-foreground/60" />
                          Export CSV
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
          {!loading && typeof totalCount === "number" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-border/20">
              <div className="text-[0.75rem] text-muted-foreground/60">
                {totalCount === 0 ? "0 products" : `Showing ${startIdx}-${endIdx} of ${formatNumber(totalCount)}`}
              </div>
              <div className="flex items-center gap-2">
                <BounceButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={!hasPrev ? "opacity-50 pointer-events-none" : ""}
                >
                  Prev
                </BounceButton>
                <div className="text-[0.75rem] text-muted-foreground/60 px-2">Page {page}</div>
                <BounceButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  className={!hasNext ? "opacity-50 pointer-events-none" : ""}
                >
                  Next
                </BounceButton>
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[560px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">{formMode === "create" ? "Add Product" : "Edit Product"}</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    {formMode === "create" ? "Create a product and set inventory quantity." : "Update product details and inventory quantity."}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                  placeholder="Product name"
                  className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {formMode === "create" && (
                  <input
                    value={form.seller_email}
                    onChange={e => setForm((p: any) => ({ ...p, seller_email: e.target.value }))}
                    placeholder="Seller email"
                    className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                )}
                <select
                  value={form.category_id}
                  onChange={e => setForm((p: any) => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  value={form.hs_code}
                  onChange={e => setForm((p: any) => ({ ...p, hs_code: e.target.value }))}
                  placeholder="HS code (optional)"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.price}
                  onChange={e => setForm((p: any) => ({ ...p, price: e.target.value }))}
                  placeholder="Price"
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.currency}
                  onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))}
                  placeholder="Currency (USD)"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.stock_units}
                  onChange={e => setForm((p: any) => ({ ...p, stock_units: e.target.value }))}
                  placeholder="Stock units"
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={form.vehsl_rating}
                  onChange={e => setForm((p: any) => ({ ...p, vehsl_rating: e.target.value }))}
                  placeholder="Vehsl rating (optional)"
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <select
                  value={form.status}
                  onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <BounceButton variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={saving ? undefined : saveProduct}
                  className={saving ? "opacity-70 pointer-events-none" : ""}
                  icon={saving ? <Clock size={14} /> : <Package size={14} />}
                >
                  {saving ? "Saving…" : formMode === "create" ? "Create" : "Save"}
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stockOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setStockOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[440px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">Adjust stock</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">Set available stock units.</p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setStockOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <input
                value={stockValue}
                onChange={e => setStockValue(e.target.value)}
                placeholder="Stock units"
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              <div className="flex justify-end gap-2 mt-6">
                <BounceButton variant="ghost" size="sm" onClick={() => setStockOpen(false)}>
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={stockSaving ? undefined : saveStock}
                  className={stockSaving ? "opacity-70 pointer-events-none" : ""}
                  icon={stockSaving ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                >
                  {stockSaving ? "Saving…" : "Save"}
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[860px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">
                    {detailData?.product?.name || (detailLoading ? "Loading…" : "Product")}
                  </h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    {detailData?.seller?.name || "—"} · {detailData?.product?.category_name || "—"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setDetailOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {detailLoading && (
                <div className="px-5 py-6 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                  Loading details…
                </div>
              )}

              {!detailLoading && detailData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Product ID</div>
                      <div className="text-[0.875rem] text-foreground/80">{detailData?.product?.id}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">SKU / HS</div>
                      <div className="text-[0.875rem] text-foreground/80">{detailData?.product?.sku || "—"} · {detailData?.product?.hs_code || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Price / Stock</div>
                      <div className="text-[0.875rem] text-foreground/80">
                        {formatMoney(detailData?.product?.currency, detailData?.product?.price)} · {formatNumber(detailData?.product?.stock_units)} units
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                      <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Media</div>
                      <div className="text-[0.8125rem] text-foreground/80 mb-3">
                        {formatNumber(detailData?.readiness?.images_count)} images · {detailData?.readiness?.has_hero_image ? "Hero OK" : "Missing hero"}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(detailData?.media || []).slice(0, 6).map((m: any) => (
                          <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground hover:text-foreground">
                            {m.media_type}
                          </a>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <BounceButton
                          variant="ghost"
                          size="sm"
                          icon={<Upload size={14} />}
                          onClick={requestingMedia ? undefined : requestMedia}
                          className={requestingMedia ? "opacity-70 pointer-events-none" : ""}
                        >
                          Request upload
                        </BounceButton>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                      <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Compliance</div>
                      <div className="text-[0.8125rem] text-foreground/80 mb-3">
                        {detailData?.readiness?.needs_compliance ? "Needs compliance" : "Looks ready"} · HS {detailData?.readiness?.missing_hs_code ? "missing" : "ok"}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(detailData?.compliance_rules || []).slice(0, 8).map((r: any) => (
                          <span key={r.id} className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground">
                            {r.rule_type}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 space-y-1 text-[0.75rem] text-muted-foreground/70">
                        <div>Legal review: {detailData?.readiness?.legal_review_status || "—"}</div>
                        <div>Docs required: {formatNumber(detailData?.readiness?.certifications_required_count)}</div>
                        <div>Blocked destinations: {formatNumber(detailData?.readiness?.blocked_destinations_count)}</div>
                        {detailData?.listing_request?.id && (
                          <div>Listing request: #{detailData?.listing_request?.id} · {detailData?.listing_request?.stage}</div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap mt-4">
                        {detailData?.links?.listing_pipeline && (
                          <a
                            href={detailData.links.listing_pipeline}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground hover:text-foreground"
                          >
                            Listing pipeline
                          </a>
                        )}
                        {detailData?.links?.trade_compliance && (
                          <a
                            href={detailData.links.trade_compliance}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground hover:text-foreground"
                          >
                            Trade compliance
                          </a>
                        )}
                        {detailData?.links?.inspector_portal && (
                          <a
                            href={detailData.links.inspector_portal}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground hover:text-foreground"
                          >
                            Inspector portal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Inventory & Quality</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-card border border-border/30 p-4">
                        <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Samples</div>
                        <div className="text-[0.875rem] text-foreground/80">{formatNumber(detailData?.sample?.available_quantity)} available</div>
                      </div>
                      <div className="rounded-2xl bg-card border border-border/30 p-4">
                        <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Sample requests</div>
                        <div className="text-[0.875rem] text-foreground/80">{formatNumber(detailData?.sample_requests?.total)} total</div>
                      </div>
                      <div className="rounded-2xl bg-card border border-border/30 p-4">
                        <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Quality</div>
                        <div className="text-[0.875rem] text-foreground/80">{formatNumber(detailData?.quality?.passed)} passed · {formatNumber(detailData?.quality?.failed)} failed</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Recent orders</div>
                    {(detailData?.recent_orders || []).length === 0 ? (
                      <div className="text-[0.8125rem] text-muted-foreground/60">No recent orders.</div>
                    ) : (
                      <div className="space-y-2">
                        {(detailData?.recent_orders || []).map((o: any) => (
                          <div key={`${o.order_id}-${o.order_created_at}`} className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-card border border-border/30">
                            <div className="min-w-0">
                              <div className="text-[0.8125rem] text-foreground/80 truncate">Order #{o.order_id} · {o.buyer}</div>
                              <div className="text-[0.6875rem] text-muted-foreground/50">{o.order_status}</div>
                            </div>
                            <div className="text-[0.8125rem] text-muted-foreground/70 whitespace-nowrap">
                              {formatNumber(o.quantity)} × {o.unit_price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → LOGISTICS
// ════════════════════════════════════════════════════════════

const vehicleStatusColor: Record<string, string> = {
  "in-transit": "#3B82F6", loading: "#FFB224", idle: "#30A46C", maintenance: "#E5484D",
};

export function AdminLogistics() {
  const location = useLocation();
  const fetchJson = fetchJsonAuthed;

  const [stats, setStats] = useState<any>(null);
  const [flow, setFlow] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [days, setDays] = useState<number>(7);
  const [fleetStatus, setFleetStatus] = useState<string>("all");
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipQ, setShipQ] = useState<string>("");
  const [shipStatus, setShipStatus] = useState<string>("all");
  const [shipPage, setShipPage] = useState<number>(1);
  const [shipTotalPages, setShipTotalPages] = useState<number>(1);
  const [shipCount, setShipCount] = useState<number>(0);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentDetail, setShipmentDetail] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const statusIn = (params.get("status") || "").trim();
    const qIn = params.get("q");
    const pageIn = Number(params.get("page") || "1");
    if (qIn != null) setShipQ(qIn);
    if (statusIn) setShipStatus(statusIn);
    else setShipStatus("all");
    if (Number.isFinite(pageIn) && pageIn >= 1) setShipPage(Math.floor(pageIn));
  }, [location.search]);

  const fmtVehicles = (a: any, t: any) => {
    const aa = Number(a);
    const tt = Number(t);
    if (!Number.isFinite(aa) || !Number.isFinite(tt)) return "—";
    return `${aa}/${tt}`;
  };

  const fmtHours = (h: any) => {
    const n = Number(h);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return `${n.toFixed(1)}h`;
  };

  const fmtPct = (p: any) => {
    const n = Number(p);
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(1)}%`;
  };

  const fmtDeltaMin = (m: any) => {
    const n = Number(m);
    if (!Number.isFinite(n) || n === 0) return "";
    const sign = n < 0 ? "−" : "+";
    return `${sign}${Math.abs(Math.round(n))} min vs last week`;
  };

  const fmtDeltaPct = (p: any) => {
    const n = Number(p);
    if (!Number.isFinite(n) || n === 0) return undefined;
    const sign = n < 0 ? "" : "+";
    return `${sign}${n.toFixed(1)}%`;
  };

  useEffect(() => {
    let cancelled = false;
    setError("");
    setLoading(true);
    (async () => {
      try {
        const fleetParams = new URLSearchParams();
        fleetParams.set("limit", "8");
        if (fleetStatus && fleetStatus !== "all") fleetParams.set("status", fleetStatus);

        const shipParams = new URLSearchParams();
        shipParams.set("page", String(shipPage));
        shipParams.set("page_size", "10");
        if (shipQ.trim()) shipParams.set("q", shipQ.trim());
        if (shipStatus && shipStatus !== "all") shipParams.set("status", shipStatus);

        const [s, f, fl] = await Promise.all([
          fetchJson(`/api/v1/admin/logistics/stats/?days=${days}`),
          fetchJson(`/api/v1/admin/logistics/flow/?days=${days}`),
          fetchJson(`/api/v1/admin/logistics/fleet/?${fleetParams.toString()}`),
        ]);
        setShipLoading(true);
        const shipResp = await fetchJson(`/api/v1/admin/logistics/shipments/?${shipParams.toString()}`);
        if (cancelled) return;
        setStats(s);
        setFlow(Array.isArray(f) ? f : []);
        setFleet(Array.isArray(fl) ? fl : []);
        setShipments(Array.isArray(shipResp?.results) ? shipResp.results : []);
        const cnt = Number(shipResp?.count || 0);
        const ps = 10;
        setShipCount(Number.isFinite(cnt) ? cnt : 0);
        setShipTotalPages(Math.max(1, Math.ceil((Number.isFinite(cnt) ? cnt : 0) / ps)));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load logistics.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setShipLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, fleetStatus, shipPage, shipQ, shipStatus, refreshNonce]);

  const openShipment = async (shipmentId: number) => {
    if (!shipmentId) return;
    setShipmentOpen(true);
    setShipmentLoading(true);
    setShipmentDetail(null);
    try {
      const d = await fetchJson(`/api/v1/admin/logistics/shipment-detail/?id=${shipmentId}`);
      setShipmentDetail(d);
    } catch (e: any) {
      setShipmentDetail(null);
      setError(e?.message || "Failed to load shipment.");
      setShipmentOpen(false);
    } finally {
      setShipmentLoading(false);
    }
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Logistics</h1>
          <p className="text-muted-foreground text-[0.875rem]">Fleet status, shipment flow, and delivery performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value) || 7)}
            className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <BounceButton variant="ghost" size="sm" icon={<Clock size={14} />} onClick={() => setRefreshNonce((n) => n + 1)}>
            Refresh
          </BounceButton>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={stagger.item} className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
          {error}
        </motion.div>
      )}

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard
          label="Active Vehicles"
          value={fmtVehicles(stats?.active_vehicles, stats?.total_vehicles)}
          icon={<Truck size={20} className="text-[#3B82F6]" />}
          iconBg="bg-[#3B82F6]/8"
          index={0}
          accentColor="#3B82F6"
        />
        <StatCard
          label="In Transit"
          value={typeof stats?.in_transit === "number" ? stats.in_transit : "—"}
          icon={<MapPin size={20} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={1}
          accentColor="#0171E3"
        />
        <StatCard
          label="Avg Delivery"
          value={fmtHours(stats?.avg_delivery_hours)}
          icon={<Clock size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={2}
          accentColor="#30A46C"
          subtitle={fmtDeltaMin(stats?.avg_delivery_delta_minutes)}
        />
        <StatCard
          label="On-Time Rate"
          value={fmtPct(stats?.on_time_rate)}
          icon={<CheckCircle2 size={20} className="text-[#FFB224]" />}
          iconBg="bg-[#FFB224]/8"
          index={3}
          accentColor="#FFB224"
          change={fmtDeltaPct(stats?.on_time_delta)}
          changeType={(Number(stats?.on_time_delta) || 0) >= 0 ? "positive" : "negative"}
        />
      </motion.div>

      {/* Shipment Flow Chart */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-foreground text-[0.9375rem] mb-1">Shipment Flow — This Week</h2>
              <p className="text-muted-foreground/50 text-[0.75rem]">Incoming vs outgoing parcels</p>
            </div>
          </div>
          <CustomAreaChart
            data={flow}
            xKey="month"
            series={[
              { dataKey: "incoming", color: "#3B82F6", label: "Incoming" },
              { dataKey: "outgoing", color: "#30A46C", label: "Outgoing" },
            ]}
            height={200}
          />
        </SectionCard>
      </motion.div>

      {/* Fleet */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-foreground text-[0.9375rem]">Fleet Status</h2>
            <select
              value={fleetStatus}
              onChange={(e) => setFleetStatus(e.target.value)}
              className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <option value="all">All</option>
              <option value="in-transit">In transit</option>
              <option value="loading">Loading</option>
              <option value="idle">Idle</option>
            </select>
          </div>
          <div className="space-y-2">
            {loading && (
              <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                Loading fleet…
              </div>
            )}
            {!loading && fleet.length === 0 && (
              <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                No fleet activity yet.
              </div>
            )}
            {fleet.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => openShipment(Number(v.shipment_id || 0))}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${vehicleStatusColor[v.status]}10` }}>
                  <Truck size={18} style={{ color: vehicleStatusColor[v.status] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground">{v.driver}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/40">{v.id} · {v.plate}</span>
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground/50">{v.currentTask}</span>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground/50">
                    <MapPin size={12} />{v.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: v.fuel < 40 ? "#E5484D" : "#30A46C" }}>
                    <Fuel size={12} />{v.fuel}%
                  </div>
                </div>
                <StatusPill
                  status={v.status === "in-transit" ? "info" : v.status === "loading" ? "warning" : v.status === "idle" ? "success" : "error"}
                  label={v.status.replace("-", " ")}
                  pulse={v.status === "in-transit"}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-foreground text-[0.9375rem] mb-1">Shipments</h2>
              <p className="text-muted-foreground/50 text-[0.75rem]">Search, filter, and inspect shipment history.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  value={shipQ}
                  onChange={(e) => {
                    setShipQ(e.target.value);
                    setShipPage(1);
                  }}
                  placeholder="Search tracking, order, email…"
                  className="pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[260px]"
                />
              </div>
              <select
                value={shipStatus}
                onChange={(e) => {
                  setShipStatus(e.target.value);
                  setShipPage(1);
                }}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="label_created">Label created</option>
                <option value="picked_up">Picked up</option>
                <option value="in_transit">In transit</option>
                <option value="customs">Customs</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {shipLoading && (
            <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
              Loading shipments…
            </div>
          )}

          {!shipLoading && shipments.length === 0 && (
            <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
              No shipments found.
            </div>
          )}

          {!shipLoading && shipments.length > 0 && (
            <div className="space-y-2">
              {shipments.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => openShipment(Number(s.id))}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[0.875rem] text-foreground/80 truncate">SH-{s.id}</span>
                      <span className="text-[0.6875rem] text-muted-foreground/40 truncate">ORD-{s.order_id || "—"}</span>
                      <span className="text-[0.6875rem] text-muted-foreground/40 truncate">{s.tracking_number || s.carrier_id || "—"}</span>
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground/50 truncate">
                      {s.origin || "—"} → {s.destination || "—"} · {s.seller || "—"} → {s.buyer || "—"}
                    </div>
                  </div>
                  <StatusPill
                    status={
                      s.status === "delivered" ? "success" :
                        s.status === "customs" ? "warning" :
                          s.status === "in_transit" || s.status === "out_for_delivery" ? "info" :
                            "pending"
                    }
                    label={(s.status || "").replaceAll("_", " ")}
                    pulse={s.status === "in_transit" || s.status === "out_for_delivery"}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="text-[0.75rem] text-muted-foreground/60">
              {shipCount ? `Showing ${(shipPage - 1) * 10 + 1}-${Math.min(shipPage * 10, shipCount)} of ${shipCount}` : "—"}
            </div>
            <div className="flex items-center gap-2">
              <BounceButton variant="ghost" size="sm" onClick={shipPage <= 1 ? undefined : () => setShipPage((p) => Math.max(1, p - 1))} className={shipPage <= 1 ? "opacity-60 pointer-events-none" : ""}>
                Prev
              </BounceButton>
              <BounceButton variant="ghost" size="sm" onClick={shipPage >= shipTotalPages ? undefined : () => setShipPage((p) => p + 1)} className={shipPage >= shipTotalPages ? "opacity-60 pointer-events-none" : ""}>
                Next
              </BounceButton>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      <AnimatePresence>
        {shipmentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setShipmentOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[860px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">
                    {shipmentDetail?.shipment?.id ? `Shipment SH-${shipmentDetail.shipment.id}` : (shipmentLoading ? "Loading…" : "Shipment")}
                  </h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    ORD-{shipmentDetail?.shipment?.order_id || "—"} · {shipmentDetail?.shipment?.status || "—"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setShipmentOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {shipmentLoading && (
                <div className="px-5 py-6 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                  Loading shipment…
                </div>
              )}

              {!shipmentLoading && shipmentDetail && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Tracking</div>
                      <div className="text-[0.875rem] text-foreground/80">{shipmentDetail?.shipment?.tracking_number || shipmentDetail?.shipment?.carrier_id || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Route</div>
                      <div className="text-[0.875rem] text-foreground/80">{shipmentDetail?.shipment?.origin || "—"} → {shipmentDetail?.shipment?.destination || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Buyer / Seller</div>
                      <div className="text-[0.875rem] text-foreground/80">{shipmentDetail?.buyer?.label || "—"} · {shipmentDetail?.seller?.label || "—"}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Events</div>
                    {(shipmentDetail?.events || []).length === 0 ? (
                      <div className="text-[0.8125rem] text-muted-foreground/60">No events yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {(shipmentDetail?.events || []).slice(0, 30).map((ev: any) => (
                          <div key={ev.id} className="flex items-start justify-between gap-4 px-4 py-3 rounded-2xl bg-card border border-border/30">
                            <div className="min-w-0">
                              <div className="text-[0.8125rem] text-foreground/80 truncate">{ev.type}</div>
                              <div className="text-[0.6875rem] text-muted-foreground/50 truncate">{ev.location || "—"}</div>
                            </div>
                            <div className="text-[0.6875rem] text-muted-foreground/50 whitespace-nowrap">
                              {ev.occurred_at ? new Date(ev.occurred_at).toLocaleString() : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → QUALITY
// ════════════════════════════════════════════════════════════

export function AdminQuality() {
  const location = useLocation();
  const fetchJson = fetchJsonAuthed;

  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [dist, setDist] = useState<any>(null);
  const [days, setDays] = useState<number>(30);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [q, setQ] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [inspections, setInspections] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionDetail, setInspectionDetail] = useState<any>(null);
  const [editScore, setEditScore] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const statusIn = (params.get("status") || "").trim();
    const qIn = params.get("q");
    const daysIn = Number(params.get("days") || "");
    const pageIn = Number(params.get("page") || "1");
    if (qIn != null) setQ(qIn);
    if (statusIn) setStatusFilter(statusIn);
    else setStatusFilter("all");
    if (Number.isFinite(daysIn) && daysIn >= 2) setDays(Math.floor(daysIn));
    if (Number.isFinite(pageIn) && pageIn >= 1) setPage(Math.floor(pageIn));
  }, [location.search]);

  const fmtPct = (p: any) => {
    const n = Number(p);
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(1)}%`;
  };

  const fmtScore = (s: any) => {
    const n = Number(s);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n)}`;
  };

  const fmtDeltaScore = (d: any) => {
    const n = Number(d);
    if (!Number.isFinite(n) || n === 0) return undefined;
    const sign = n < 0 ? "" : "+";
    return `${sign}${Math.round(n)}`;
  };

  const formatDate = (iso: any) => {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  const openInspection = async (id: number) => {
    if (!id) return;
    setInspectionOpen(true);
    setInspectionLoading(true);
    setInspectionDetail(null);
    try {
      const data = await fetchJson(`/api/v1/admin/quality/${id}/`);
      setInspectionDetail(data);
      setEditScore(data?.score != null ? String(data.score) : "");
    } catch (e: any) {
      setInspectionDetail(null);
      setError(e?.message || "Failed to load inspection.");
      setInspectionOpen(false);
    } finally {
      setInspectionLoading(false);
    }
  };

  const setInspection = async (patch: { status?: string; score?: number }) => {
    const id = Number(inspectionDetail?.id || 0);
    if (!id) return;
    setInspectionSaving(true);
    try {
      setError("");
      const data = await fetchJson(`/api/v1/admin/quality/${id}/set/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setInspectionDetail(data);
      setEditScore(data?.score != null ? String(data.score) : "");
      setRefreshNonce((n) => n + 1);
    } catch (e: any) {
      setError(e?.message || "Failed to update inspection.");
    } finally {
      setInspectionSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        if (q.trim()) params.set("q", q.trim());
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        params.set("days", String(days));

        const [s, t, d, listResp] = await Promise.all([
          fetchJson(`/api/v1/admin/quality/stats/?days=${days}`),
          fetchJson(`/api/v1/admin/quality/trend/?days=${Math.min(31, days)}`),
          fetchJson(`/api/v1/admin/quality/distribution/?days=${days}`),
          fetchJson(`/api/v1/admin/quality/?${params.toString()}`),
        ]);
        if (cancelled) return;
        setStats(s);
        setTrend(Array.isArray(t) ? t : []);
        setDist(d);
        const rows = Array.isArray(listResp?.results) ? listResp.results : [];
        const cnt = Number(listResp?.count || 0);
        setInspections(rows);
        setCount(Number.isFinite(cnt) ? cnt : 0);
        setTotalPages(Math.max(1, Math.ceil((Number.isFinite(cnt) ? cnt : 0) / pageSize)));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load quality data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, page, q, statusFilter, refreshNonce]);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1.5">Quality Control</h1>
          <p className="text-muted-foreground text-[0.875rem]">Inspection results, compliance scores, and product quality trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={String(days)}
            onChange={(e) => {
              setDays(Number(e.target.value) || 30);
              setPage(1);
            }}
            className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <BounceButton variant="ghost" size="sm" icon={<Clock size={14} />} onClick={() => setRefreshNonce((n) => n + 1)}>
            Refresh
          </BounceButton>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={stagger.item} className="px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
          {error}
        </motion.div>
      )}

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard
          label="Avg Quality Score"
          value={fmtScore(stats?.avg_quality_score)}
          icon={<Star size={20} className="text-[#FFB224]" />}
          iconBg="bg-[#FFB224]/8"
          index={0}
          accentColor="#FFB224"
          subtitle="out of 100"
          change={fmtDeltaScore(stats?.avg_quality_score_delta)}
          changeType={(Number(stats?.avg_quality_score_delta) || 0) >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Pass Rate"
          value={fmtPct(stats?.pass_rate)}
          icon={<CheckCircle2 size={20} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/8"
          index={1}
          accentColor="#30A46C"
        />
        <StatCard
          label="Pending"
          value={typeof stats?.pending === "number" ? stats.pending : "—"}
          icon={<Clock size={20} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/8"
          index={2}
          accentColor="#0171E3"
          subtitle="Awaiting inspection"
        />
        <StatCard
          label="Failed"
          value={typeof stats?.failed === "number" ? stats.failed : "—"}
          icon={<XCircle size={20} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/8"
          index={3}
          accentColor="#E5484D"
          subtitle="This month"
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <SectionCard className="lg:col-span-3">
          <h2 className="text-foreground text-[0.9375rem] mb-1">Quality Score Trend</h2>
          <p className="text-muted-foreground/50 text-[0.75rem] mb-4">Average inspection score over time</p>
          <CustomAreaChart data={trend} xKey="month" series={[{ dataKey: "score", color: "#0171E3" }]} height={180} yDomain={[70, 100]} />
        </SectionCard>
        <SectionCard className="lg:col-span-2">
          <h2 className="text-foreground text-[0.9375rem] mb-4">Score Distribution</h2>
          <HorizontalBarList
            data={[
              { label: "Excellent (90+)", value: Number(dist?.excellent) || 0, color: "#30A46C" },
              { label: "Good (80-89)", value: Number(dist?.good) || 0, color: "#3B82F6" },
              { label: "Fair (70-79)", value: Number(dist?.fair) || 0, color: "#FFB224" },
              { label: "Poor (<70)", value: Number(dist?.poor) || 0, color: "#E5484D" },
            ]}
            maxValue={100}
            valueFormatter={v => `${v}%`}
          />
        </SectionCard>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-foreground text-[0.9375rem] mb-1">Inspections</h2>
              <p className="text-muted-foreground/50 text-[0.75rem]">Search, filter, and review inspection outcomes.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search product, seller, inspector…"
                  className="pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[260px]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="in_progress">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {loading && (
              <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                Loading inspections…
              </div>
            )}
            {!loading && inspections.length === 0 && (
              <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
                No inspections yet.
              </div>
            )}
            {inspections.map((qi, i) => (
              <motion.div key={qi.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => openInspection(Number(qi.id))}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: qi.score >= 90 ? "#30A46C10" : qi.score >= 70 ? "#FFB22410" : "#E5484D10" }}>
                  <span className="text-[0.875rem]" style={{ color: qi.score >= 90 ? "#30A46C" : qi.score >= 70 ? "#D97706" : "#E5484D" }}>{qi.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.875rem] text-foreground block truncate">{qi.product_name || "—"}</span>
                  <span className="text-[0.75rem] text-muted-foreground/50">{qi.seller_name || "—"} · {qi.inspector_display || "—"}</span>
                </div>
                <span className="text-[0.75rem] text-muted-foreground/40 hidden sm:block">{formatDate(qi.inspected_at || qi.created_at)}</span>
                <StatusPill
                  status={qi.status === "passed" ? "success" : qi.status === "failed" ? "error" : "pending"}
                  label={qi.status?.replace?.("_", " ") || qi.status}
                  pulse={qi.status === "in_progress"}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-[0.75rem] text-muted-foreground/60">
              {count ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, count)} of ${count}` : "—"}
            </div>
            <div className="flex items-center gap-2">
              <BounceButton variant="ghost" size="sm" onClick={page <= 1 ? undefined : () => setPage((p) => Math.max(1, p - 1))} className={page <= 1 ? "opacity-60 pointer-events-none" : ""}>
                Prev
              </BounceButton>
              <BounceButton variant="ghost" size="sm" onClick={page >= totalPages ? undefined : () => setPage((p) => p + 1)} className={page >= totalPages ? "opacity-60 pointer-events-none" : ""}>
                Next
              </BounceButton>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      <AnimatePresence>
        {inspectionOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setInspectionOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[860px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">
                    {inspectionDetail?.product_name || (inspectionLoading ? "Loading…" : "Inspection")}
                  </h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    {inspectionDetail?.seller_name || "—"} · {inspectionDetail?.inspector_display || "—"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setInspectionOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {inspectionLoading && (
                <div className="px-5 py-6 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
                  Loading inspection…
                </div>
              )}

              {!inspectionLoading && inspectionDetail && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Inspection ID</div>
                      <div className="text-[0.875rem] text-foreground/80">{inspectionDetail?.id}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Status</div>
                      <div className="text-[0.875rem] text-foreground/80">{(inspectionDetail?.status || "—").toString().replaceAll("_", " ")}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Score</div>
                      <div className="text-[0.875rem] text-foreground/80">{fmtScore(inspectionDetail?.score)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-4">Update</div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        placeholder="Score (0-100)"
                        inputMode="numeric"
                        className="flex-1 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                      <BounceButton
                        variant="ghost"
                        size="sm"
                        icon={<Clock size={14} />}
                        onClick={inspectionSaving ? undefined : () => setInspection({ status: "in_progress" })}
                        className={inspectionSaving ? "opacity-70 pointer-events-none" : ""}
                      >
                        Pending
                      </BounceButton>
                      <BounceButton
                        variant="ghost"
                        size="sm"
                        icon={<CheckCircle2 size={14} />}
                        onClick={inspectionSaving ? undefined : () => {
                          const n = Number(editScore);
                          const patch: any = { status: "passed" };
                          if (Number.isFinite(n)) patch.score = n;
                          void setInspection(patch);
                        }}
                        className={inspectionSaving ? "opacity-70 pointer-events-none" : ""}
                      >
                        Pass
                      </BounceButton>
                      <BounceButton
                        variant="ghost"
                        size="sm"
                        icon={<XCircle size={14} />}
                        onClick={inspectionSaving ? undefined : () => {
                          const n = Number(editScore);
                          const patch: any = { status: "failed" };
                          if (Number.isFinite(n)) patch.score = n;
                          void setInspection(patch);
                        }}
                        className={inspectionSaving ? "opacity-70 pointer-events-none" : ""}
                      >
                        Fail
                      </BounceButton>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-2">Dates</div>
                    <div className="text-[0.8125rem] text-foreground/80">
                      Inspected: {formatDate(inspectionDetail?.inspected_at)} · Created: {formatDate(inspectionDetail?.created_at)}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → SETTINGS
// ════════════════════════════════════════════════════════════

export function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [me, setMe] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    country: "",
    province: "",
    city: "",
    street: "",
    address: "",
    nationality: "",
    gender: "",
    date_of_birth: "",
  });

  const apiBase = useMemo(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const normalize = (u: string) => u.replace(/\/$/, "");
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
      return normalize(fromEnv);
    }
    if (typeof window !== "undefined") {
      return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
    }
    return "http://localhost:8000";
  }, []);

  const access = useMemo(() => {
    try {
      return window.localStorage.getItem("vehsl.access") || "";
    } catch {
      return "";
    }
  }, []);

  const isAdmin = useMemo(() => (me?.role || "").toString().toLowerCase() === "admin", [me]);

  const platformDefaults = useMemo(
    () => ({
      general: { platform_name: "Vehsl", default_currency: "USD", timezone: "UTC", language: "English" },
      notifications: { email_notifications: true, push_notifications: true, sms_alerts: false, daily_digest: true },
      security: { two_factor_auth: true, session_timeout_minutes: 30, ip_whitelisting: false, password_policy: "strong_12_chars" },
      integrations: { stripe_payments: "not_connected", sendgrid_email: "not_connected", twilio_sms: "not_connected", google_maps: "not_connected" },
    }),
    []
  );

  const settingsForm = useMemo(() => {
    const s = platformSettings || {};
    return {
      general: { ...platformDefaults.general, ...(s.general || {}) },
      notifications: { ...platformDefaults.notifications, ...(s.notifications || {}) },
      security: { ...platformDefaults.security, ...(s.security || {}) },
      integrations: { ...platformDefaults.integrations, ...(s.integrations || {}) },
    };
  }, [platformDefaults, platformSettings]);

  const setSettingsForm = (updater: (prev: any) => any) => {
    setPlatformSettings((prev: any) => {
      const merged = {
        general: { ...platformDefaults.general, ...((prev && prev.general) || {}) },
        notifications: { ...platformDefaults.notifications, ...((prev && prev.notifications) || {}) },
        security: { ...platformDefaults.security, ...((prev && prev.security) || {}) },
        integrations: { ...platformDefaults.integrations, ...((prev && prev.integrations) || {}) },
        ...(prev || {}),
      };
      const next = updater(merged);
      return next;
    });
  };

  const toForm = (data: any) => ({
    first_name: data?.first_name || "",
    last_name: data?.last_name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    department: data?.admin_profile?.department || "",
    country: data?.profile?.country || "",
    province: data?.profile?.province || "",
    city: data?.profile?.city || "",
    street: data?.profile?.street || "",
    address: data?.profile?.address || "",
    nationality: data?.profile?.nationality || "",
    gender: data?.profile?.gender || "",
    date_of_birth: data?.profile?.date_of_birth || "",
  });

  useEffect(() => {
    if (!access) {
      setLoading(false);
      setError("Not signed in.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiBase}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!res.ok) {
          setError("Failed to load profile.");
          return;
        }
        let data = await res.json();

        const role = (data?.role || "").toString().toLowerCase();
        if (role === "admin") {
          try {
            const profRes = await fetch(`${apiBase}/api/v1/profiles/admin/me`, {
              headers: { Authorization: `Bearer ${access}` },
            });
            if (profRes.ok) {
              const prof = await profRes.json();
              data = { ...data, admin_profile: { ...(data?.admin_profile || {}), ...(prof || {}) } };
            }
          } catch {}

          try {
            const sRes = await fetch(`${apiBase}/api/v1/admin/settings`, {
              headers: { Authorization: `Bearer ${access}` },
            });
            if (sRes.ok) {
              const s = await sRes.json();
              setPlatformSettings(s);
            }
          } catch {}
        }

        setMe(data);
        setForm(toForm(data));
        try {
          window.localStorage.setItem("vehsl.user", JSON.stringify(data));
        } catch {}
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    })();
  }, [access, apiBase]);

  const onSave = async () => {
    if (!access || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const meRes = await fetch(`${apiBase}/api/v1/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          country: form.country,
          province: form.province,
          city: form.city,
          street: form.street,
          address: form.address,
          nationality: form.nationality,
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
        }),
      });

      if (!meRes.ok) {
        const err = await meRes.json().catch(() => null);
        const msg = (err && (err.detail || err.phone || err.non_field_errors)) || "Failed to save.";
        setError(typeof msg === "string" ? msg : "Failed to save.");
        return;
      }

      if (isAdmin) {
        await fetch(`${apiBase}/api/v1/profiles/admin/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ department: form.department }),
        });

        if (platformSettings) {
          const sRes = await fetch(`${apiBase}/api/v1/admin/settings`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access}`,
            },
            body: JSON.stringify({
              general: settingsForm.general,
              notifications: settingsForm.notifications,
              security: settingsForm.security,
            }),
          });
          if (!sRes.ok) {
            const err = await sRes.json().catch(() => null);
            const msg = (err && (err.detail || err.non_field_errors)) || "Failed to save settings.";
            setError(typeof msg === "string" ? msg : "Failed to save settings.");
            return;
          }
          const updated = await sRes.json().catch(() => null);
          if (updated) setPlatformSettings(updated);
        }
      }

      let refreshedData: any = null;
      const refreshed = await fetch(`${apiBase}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (refreshed.ok) {
        refreshedData = await refreshed.json();
        if ((refreshedData?.role || "").toString().toLowerCase() === "admin") {
          try {
            const profRes = await fetch(`${apiBase}/api/v1/profiles/admin/me`, {
              headers: { Authorization: `Bearer ${access}` },
            });
            if (profRes.ok) {
              const prof = await profRes.json();
              refreshedData = { ...refreshedData, admin_profile: { ...(refreshedData?.admin_profile || {}), ...(prof || {}) } };
            }
          } catch {}
        }
        setMe(refreshedData);
        setForm(toForm(refreshedData));
        try {
          window.localStorage.setItem("vehsl.user", JSON.stringify(refreshedData));
        } catch {}
      }

      setSaved(true);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary/70" : "bg-muted/60"} border border-border/40`}
      aria-pressed={value}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background shadow transition-transform ${value ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );

  const statusPill = (status: string) => {
    const s = (status || "").toLowerCase();
    const ok = s === "connected";
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[0.75rem] border ${ok ? "bg-[#30A46C]/10 text-[#30A46C] border-[#30A46C]/20" : "bg-[#E5484D]/8 text-[#E5484D] border-[#E5484D]/20"}`}
      >
        {ok ? "Connected" : "Not Connected"}
      </span>
    );
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[900px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Settings</h1>
        <p className="text-muted-foreground text-[0.875rem]">Manage your profile and system configuration.</p>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary/10">
              <Settings size={20} className="text-primary/70" />
            </div>
            <h2 className="text-foreground text-[0.9375rem]">Profile</h2>
          </div>

          {loading ? (
            <div className="text-[0.8125rem] text-muted-foreground/60">Loading…</div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#E5484D]/8 text-[#E5484D] text-[0.8125rem]">
                  {error}
                </div>
              )}
              {saved && (
                <div className="px-4 py-3 rounded-2xl bg-[#30A46C]/8 text-[#30A46C] text-[0.8125rem]">
                  Saved.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">First name</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((p: any) => ({ ...p, first_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Last name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((p: any) => ({ ...p, last_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Email</label>
                  <input
                    value={form.email}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p: any) => ({ ...p, phone: e.target.value }))}
                    placeholder="+12345678900"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Admin role</label>
                    <input
                      value={me?.admin_profile?.admin_role || "super_admin"}
                      disabled
                      className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Department</label>
                    <input
                      value={form.department}
                      onChange={(e) => setForm((p: any) => ({ ...p, department: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Country</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm((p: any) => ({ ...p, country: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Province</label>
                  <input
                    value={form.province}
                    onChange={(e) => setForm((p: any) => ({ ...p, province: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((p: any) => ({ ...p, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Street</label>
                  <input
                    value={form.street}
                    onChange={(e) => setForm((p: any) => ({ ...p, street: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p: any) => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>

      {isAdmin && (
        <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#0171E3]/10">
                <Settings size={20} className="text-[#0171E3]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-[0.9375rem]">General</h2>
                <p className="text-muted-foreground text-[0.75rem]">Platform-wide defaults</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Platform name</label>
                <input
                  value={settingsForm.general.platform_name}
                  onChange={(e) =>
                    setSettingsForm((p: any) => ({ ...p, general: { ...(p.general || {}), platform_name: e.target.value } }))
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Default currency</label>
                  <select
                    value={settingsForm.general.default_currency}
                    onChange={(e) =>
                      setSettingsForm((p: any) => ({ ...p, general: { ...(p.general || {}), default_currency: e.target.value } }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  >
                    {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Language</label>
                  <select
                    value={settingsForm.general.language}
                    onChange={(e) =>
                      setSettingsForm((p: any) => ({ ...p, general: { ...(p.general || {}), language: e.target.value } }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  >
                    {["English", "Spanish", "French"].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Timezone</label>
                <select
                  value={settingsForm.general.timezone}
                  onChange={(e) =>
                    setSettingsForm((p: any) => ({ ...p, general: { ...(p.general || {}), timezone: e.target.value } }))
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  {["UTC", "America/Chicago", "America/New_York", "Europe/London"].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#FFB224]/10">
                <Bell size={20} className="text-[#D97706]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-[0.9375rem]">Notifications</h2>
                <p className="text-muted-foreground text-[0.75rem]">Delivery preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "email_notifications", label: "Email notifications" },
                { key: "push_notifications", label: "Push notifications" },
                { key: "sms_alerts", label: "SMS alerts" },
                { key: "daily_digest", label: "Daily digest" },
              ].map((it) => (
                <div key={it.key} className="flex items-center justify-between gap-4">
                  <span className="text-[0.8125rem] text-foreground">{it.label}</span>
                  <Toggle
                    value={!!settingsForm.notifications[it.key]}
                    onChange={(v) => setSettingsForm((p: any) => ({ ...p, notifications: { ...(p.notifications || {}), [it.key]: v } }))}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#E5484D]/10">
                <Lock size={20} className="text-[#E5484D]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-[0.9375rem]">Security</h2>
                <p className="text-muted-foreground text-[0.75rem]">Platform security posture</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.8125rem] text-foreground">Two-factor auth</span>
                <Toggle
                  value={!!settingsForm.security.two_factor_auth}
                  onChange={(v) => setSettingsForm((p: any) => ({ ...p, security: { ...(p.security || {}), two_factor_auth: v } }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.8125rem] text-foreground">IP whitelisting</span>
                <Toggle
                  value={!!settingsForm.security.ip_whitelisting}
                  onChange={(v) => setSettingsForm((p: any) => ({ ...p, security: { ...(p.security || {}), ip_whitelisting: v } }))}
                />
              </div>

              <div>
                <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Session timeout</label>
                <select
                  value={String(settingsForm.security.session_timeout_minutes)}
                  onChange={(e) =>
                    setSettingsForm((p: any) => ({
                      ...p,
                      security: { ...(p.security || {}), session_timeout_minutes: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  {[15, 30, 60, 120, 240].map((m) => (
                    <option key={m} value={String(m)}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Password policy</label>
                <select
                  value={settingsForm.security.password_policy}
                  onChange={(e) =>
                    setSettingsForm((p: any) => ({ ...p, security: { ...(p.security || {}), password_policy: e.target.value } }))
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="strong_12_chars">Strong (12+ chars)</option>
                  <option value="strong_10_chars">Strong (10+ chars)</option>
                  <option value="standard_8_chars">Standard (8+ chars)</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#30A46C]/10">
                <Globe size={20} className="text-[#30A46C]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-[0.9375rem]">Integrations</h2>
                <p className="text-muted-foreground text-[0.75rem]">Detected provider configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "stripe_payments", label: "Stripe payments" },
                { key: "sendgrid_email", label: "SendGrid email" },
                { key: "twilio_sms", label: "Twilio SMS" },
                { key: "google_maps", label: "Google Maps" },
              ].map((it) => (
                <div key={it.key} className="flex items-center justify-between gap-4">
                  <span className="text-[0.8125rem] text-foreground">{it.label}</span>
                  {statusPill(settingsForm.integrations[it.key])}
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      <motion.div variants={stagger.item} className="flex justify-end">
        <BounceButton
          variant="primary"
          size="md"
          icon={<CheckCircle2 size={16} />}
          disabled={loading || saving || !access}
          onClick={onSave}
        >
          {saving ? "Saving..." : "Save Changes"}
        </BounceButton>
      </motion.div>
    </motion.div>
  );
}
