// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router";
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
    const controller = new AbortController();
    const t = window.setTimeout(() => {
      (async () => {
        try {
          const params = new URLSearchParams();
          const s = search.trim();
          if (s) params.set("q", s);
          if (activeNow) params.set("active_now", "1");
          else if (activePeriod) params.set("active_period", activePeriod);
          if (roleFilter !== "all") {
            if (roleFilter === "manager") {
              params.set("role", "admin");
              params.set("admin_role", "manager");
            } else {
              params.set("role", roleFilter);
            }
          }
          if (statusFilter !== "all") params.set("admin_status", statusFilter);
          const qs = params.toString();
          const data = await fetchJson(`/api/v1/admin/users/stats${qs ? `?${qs}` : ""}`, { signal: controller.signal } as any);
          if (!cancelled) setStats(data);
        } catch (e: any) {
          if (!cancelled) setStats(null);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [fetchJson, search, activeNow, activePeriod, roleFilter, statusFilter]);

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
        {deleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setDeleteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[520px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">Delete product</h2>
                  <p className="text-muted-foreground text-[0.8125rem] truncate">
                    #{deleteProductId || "—"} · {deleteProductName || "Product"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setDeleteOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl bg-[#E5484D]/5 border border-[#E5484D]/10 p-4 text-[0.8125rem] text-[#E5484D]/80">
                This removes the product from the marketplace and hides it across the system. This action cannot be undone.
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <BounceButton variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={deleteSaving ? undefined : submitDelete}
                  className={deleteSaving ? "opacity-70 pointer-events-none bg-[#E5484D]/80" : "bg-[#E5484D] hover:bg-[#D63E44]"}
                  icon={deleteSaving ? <Clock size={14} /> : <Trash2 size={14} />}
                >
                  {deleteSaving ? "Deleting…" : "Delete"}
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
  const navigate = useNavigate();

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

  const prettyFieldLabel = (key: string) =>
    (key || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const displayAdminValue = (value: any) => {
    if (value == null || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      const clean = value
        .map((item) => (typeof item === "string" || typeof item === "number" ? String(item).trim() : ""))
        .filter(Boolean);
      return clean.length ? clean.join(", ") : "—";
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const productStatusToPill = (s: string) => {
    const x = (s || "").toString().toLowerCase();
    if (x === "active") return { status: "success", label: "Active" };
    if (x === "low_stock") return { status: "warning", label: "Low Samples" };
    if (x === "out") return { status: "error", label: "No Samples" };
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
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [requestingMedia, setRequestingMedia] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesId, setChangesId] = useState<number | null>(null);
  const [changesMessage, setChangesMessage] = useState<string>("");
  const [changesSaving, setChangesSaving] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyId, setVerifyId] = useState<number | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<string>("");
  const [verifySaving, setVerifySaving] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [approveRating, setApproveRating] = useState<string>("");
  const [approveSaving, setApproveSaving] = useState(false);

  const [publishSaving, setPublishSaving] = useState(false);

  const [readinessOpen, setReadinessOpen] = useState(false);
  const [readinessId, setReadinessId] = useState<number | null>(null);
  const [readinessTitle, setReadinessTitle] = useState<string>("");
  const [readinessMissing, setReadinessMissing] = useState<string[]>([]);
  const [readinessRequiredDocs, setReadinessRequiredDocs] = useState<string[]>([]);
  const [readinessDocsAttached, setReadinessDocsAttached] = useState<number>(0);
  const [readinessSuggestedMessage, setReadinessSuggestedMessage] = useState<string>("");
  const [readinessDetail, setReadinessDetail] = useState<any>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string>("");
  const [readinessEditMode, setReadinessEditMode] = useState(false);
  const [readinessSaving, setReadinessSaving] = useState(false);
  const [readinessSaveError, setReadinessSaveError] = useState("");
  const [readinessForm, setReadinessForm] = useState<any>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const categoryPopoverRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedCategory = useMemo(() => {
    if (catFilter === "all") return null;
    return (
      categories.find((c: any) => String(c?.slug || "") === String(catFilter)) ||
      categories.find((c: any) => String(c?.id || "") === String(catFilter)) ||
      null
    );
  }, [catFilter, categories]);

  const filteredCategories = useMemo(() => {
    const q = (categoryQuery || "").trim().toLowerCase();
    const base = [...(categories || [])].sort((a: any, b: any) => Number(b?.count || 0) - Number(a?.count || 0));
    if (!q) return base;
    return base.filter((c: any) => {
      const label = (c?.label || c?.name || c?.slug || "").toString().toLowerCase();
      return label.includes(q);
    });
  }, [categories, categoryQuery]);

  useEffect(() => {
    if (!categoryOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as any;
      if (categoryPopoverRef.current && categoryPopoverRef.current.contains(t)) return;
      if (categoryButtonRef.current && categoryButtonRef.current.contains(t)) return;
      setCategoryOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [categoryOpen]);
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

  const [lrSearch, setLrSearch] = useState("");
  const [lrStage, setLrStage] = useState<string>("all");

  const setListingRequestStageFilter = useCallback(
    (v: string) => {
      const next = (v || "").toString();
      setLrStage(next);
      const params = new URLSearchParams(location.search);
      if (next && next !== "all") params.set("rs", next);
      else params.delete("rs");
      navigate({ search: params.toString() ? `?${params.toString()}` : "" });
    },
    [location.search, navigate]
  );

  const lrFilters = useMemo(() => {
    const f: any = {};
    const q = lrSearch.trim();
    if (q) f.q = q;
    if (lrStage && lrStage !== "all") f.stage = lrStage;
    return f;
  }, [lrSearch, lrStage]);

  const {
    rows: listingRequests,
    count: listingRequestsCount,
    loading: listingRequestsLoading,
    error: listingRequestsError,
    page: lrPage,
    pageSize: lrPageSize,
    setPage: setLrPage,
    setPageSize: setLrPageSize,
    refresh: refreshListingRequests,
    totalPages: lrTotalPages,
  } = usePaginatedList<any>({
    endpoint: "/api/v1/admin/listing-requests/",
    filters: lrFilters,
    initialOrdering: "-created_at",
    initialPageSize: 20,
    debounceMs: 250,
  });

  const didRelaxListingRequestFilterRef = useRef(false);
  useEffect(() => {
    if (didRelaxListingRequestFilterRef.current) return;
    const modeFromUrl = (new URLSearchParams(location.search).get("mode") || "").trim().toLowerCase();
    if (modeFromUrl !== "requests") return;
    if (listingRequestsLoading) return;
    if (lrSearch.trim()) return;
    const params = new URLSearchParams(location.search);
    if (!params.has("rs")) return;
    if (listingRequestsCount !== 0) return;
    didRelaxListingRequestFilterRef.current = true;
    params.delete("rs");
    navigate({ search: params.toString() ? `?${params.toString()}` : "" });
  }, [listingRequestsCount, listingRequestsLoading, location.search, lrSearch, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = (params.get("mode") || "").trim().toLowerCase();
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
    if (mode === "requests") {
      const rq = (params.get("rq") || "").trim();
      const rs = (params.get("rs") || "").trim().toLowerCase();
      setLrSearch(rq);
      setLrStage(rs || "all");
      setLrPage(1);
    }
  }, [location.search, setPage]);

  const mode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const m = (params.get("mode") || "").trim().toLowerCase();
    return m === "requests" ? "requests" : "products";
  }, [location.search]);

  const setMode = (nextMode: "products" | "requests") => {
    const params = new URLSearchParams(location.search);
    if (nextMode === "requests") {
      params.set("mode", "requests");
      params.delete("rs");
      params.delete("rq");
      params.delete("page");
    } else {
      params.delete("mode");
      params.delete("rs");
      params.delete("rq");
      params.delete("page");
    }
    navigate({ search: params.toString() ? `?${params.toString()}` : "" });
  };

  const publishListingRequest = async (lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;

    const requiredDocs = Array.isArray(lr?.required_documents) ? lr.required_documents.filter((x: any) => typeof x === "string") : [];
    const docsAttached = Number(lr?.documents_attached || 0) || 0;
    const needsDocs = requiredDocs.length > 0;

    const needsInspection = !!lr?.inspector;
    const canPublish =
      !lr?.created_product_id &&
      String(lr?.stage || "").toLowerCase() === "live" &&
      !!lr?.compliance_verified &&
      (!needsInspection || !!lr?.inspected) &&
      (!needsDocs || docsAttached > 0);

    if (!canPublish) {
      setActionError("Cannot publish: resolve readiness requirements first (use “Why disabled?”).");
      return;
    }

    if (publishSaving) return;
    setPublishSaving(true);
    setActionError("");
    setActionSuccess("");

    try {
      await fetchJson(`/api/v1/admin/listing-requests/${id}/publish/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setActionSuccess("Published. Product created and listing request moved to Done.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
      refreshProducts();
    } catch (e: any) {
      setActionError(e?.message || "Publish failed.");
    } finally {
      setPublishSaving(false);
    }
  };

  const computeMissingFields = (lr: any): string[] => {
    if (Array.isArray(lr?.missing_fields)) return lr.missing_fields.filter((x: any) => typeof x === "string");
    const meta = lr?.product_meta && typeof lr.product_meta === "object" ? lr.product_meta : {};
    const origin = meta?.origin_location && typeof meta.origin_location === "object" ? meta.origin_location : {};
    const missing: string[] = [];
    if (!String(meta?.sku || "").trim()) missing.push("sku");
    if (!String(meta?.hs_code || "").trim()) missing.push("hs_code");
    if (!String(origin?.country || "").trim()) missing.push("origin_country");
    if (meta?.lead_time_days == null || meta?.lead_time_days === "") missing.push("lead_time_days");
    if (meta?.weight_grams == null || meta?.weight_grams === "") missing.push("weight_grams");
    if (meta?.ship_time_min_days == null || meta?.ship_time_min_days === "" || meta?.ship_time_max_days == null || meta?.ship_time_max_days === "") {
      missing.push("ship_time_range_days");
    }
    return missing;
  };

  const buildReadinessForm = (detail: any) => {
    const meta = detail?.product_meta && typeof detail.product_meta === "object" ? detail.product_meta : {};
    const created = detail?.created_product_detail && typeof detail.created_product_detail === "object" ? detail.created_product_detail : {};
    const detailConfig =
      meta?.detail_config && typeof meta.detail_config === "object"
        ? meta.detail_config
        : created?.detail_config && typeof created.detail_config === "object"
          ? created.detail_config
          : {};
    const origin =
      meta?.origin_location && typeof meta.origin_location === "object"
        ? meta.origin_location
        : created?.origin_location && typeof created.origin_location === "object"
          ? created.origin_location
          : {};
    const pricingTiers = Array.isArray(meta?.pricing_tiers)
      ? meta.pricing_tiers
      : Array.isArray(created?.pricing_tiers)
        ? created.pricing_tiers.map((tier: any) => ({
            variation: tier?.variation ?? null,
            min_quantity: tier?.min_quantity ?? 1,
            max_quantity: tier?.max_quantity ?? null,
            unit_price: tier?.unit_price ?? "",
            currency: tier?.currency || detail?.currency || "USD",
          }))
        : [];
    const variations = Array.isArray(meta?.variations) ? meta.variations : [];

    return {
      product_name: (detail?.product_name || "").toString(),
      company_name: (detail?.company_name || "").toString(),
      category_id: detail?.category ? String(detail.category) : "",
      description: (detail?.description || "").toString(),
      currency: (detail?.currency || "USD").toString().toUpperCase(),
      unit_price: detail?.unit_price != null ? String(detail.unit_price) : "",
      moq: detail?.moq != null ? String(detail.moq) : "1",
      sku: (meta?.sku || created?.sku || "").toString(),
      hs_code: (meta?.hs_code || created?.hs_code || "").toString(),
      origin_country: (origin?.country || "").toString(),
      origin_region: (origin?.region || "").toString(),
      origin_city: (origin?.city || "").toString(),
      lead_time_days: meta?.lead_time_days ?? created?.lead_time_days ?? "",
      weight_grams: meta?.weight_grams ?? created?.weight_grams ?? "",
      ship_time_min_days: meta?.ship_time_min_days ?? created?.ship_time_min_days ?? "",
      ship_time_max_days: meta?.ship_time_max_days ?? created?.ship_time_max_days ?? "",
      sample_available: Boolean(meta?.sample_available ?? created?.sample_available),
      sample_ship_days: meta?.sample_ship_days ?? created?.sample_ship_days ?? "",
      monthly_capacity: (detail?.monthly_capacity || detailConfig?.monthly_capacity || "").toString(),
      ip_protection_level: (meta?.ip_protection_level || created?.ip_protection_level || "").toString(),
      trademark_registration_number: (meta?.trademark_registration_number || detailConfig?.trademark_registration_number || "").toString(),
      pricing_tiers: JSON.stringify(pricingTiers, null, 2),
      variations: JSON.stringify(variations, null, 2),
      detail_config: JSON.stringify(detailConfig || {}, null, 2),
    };
  };

  const openReadinessModal = (lr: any, title: string) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    const missing = computeMissingFields(lr);
    const requiredDocs = Array.isArray(lr?.required_documents) ? lr.required_documents.filter((x: any) => typeof x === "string") : [];
    const docsAttached = Number(lr?.documents_attached || 0) || 0;

    const msgParts: string[] = [];
    if (missing.length) msgParts.push(`Missing required fields: ${missing.join(", ")}`);
    if (requiredDocs.length && docsAttached <= 0) msgParts.push(`Missing required documents: ${requiredDocs.join(", ")}`);
    const suggested =
      msgParts.length === 0
        ? ""
        : `Please fix the following before we can approve/publish:\n- ${msgParts.join("\n- ")}`;

    setReadinessId(id);
    setReadinessTitle(title);
    setReadinessMissing(missing);
    setReadinessRequiredDocs(requiredDocs);
    setReadinessDocsAttached(docsAttached);
    setReadinessSuggestedMessage(suggested);
    setReadinessDetail(null);
    setReadinessError("");
    setReadinessLoading(true);
    setReadinessEditMode(false);
    setReadinessSaving(false);
    setReadinessSaveError("");
    setReadinessForm(null);
    setReadinessOpen(true);
    (async () => {
      try {
        const data = await fetchJson(`/api/v1/admin/listing-requests/${id}/`);
        setReadinessDetail(data);
        setReadinessForm(buildReadinessForm(data));
      } catch (e: any) {
        setReadinessError(e?.message || "Failed to load full listing details.");
      } finally {
        setReadinessLoading(false);
      }
    })();
  };

  const saveReadinessEdits = async () => {
    const id = Number(readinessDetail?.id || readinessId || 0);
    if (!id || !readinessForm || readinessSaving) return;
    setReadinessSaveError("");
    setReadinessSaving(true);
    try {
      const parseOptionalJson = (raw: string, label: string) => {
        const text = (raw || "").trim();
        if (!text) return "";
        try {
          return JSON.stringify(JSON.parse(text));
        } catch {
          throw new Error(`${label} must be valid JSON.`);
        }
      };
      const payload: any = {};
      if ((readinessForm.product_name || "").trim()) payload.product_name = readinessForm.product_name.trim();
      if ("company_name" in readinessForm) payload.company_name = (readinessForm.company_name || "").trim();
      if (String(readinessForm.category_id || "").trim()) payload.category_id = Number(readinessForm.category_id);
      if ("description" in readinessForm) payload.description = (readinessForm.description || "").trim();
      if ("currency" in readinessForm) payload.currency = (readinessForm.currency || "USD").trim().toUpperCase();
      if (String(readinessForm.unit_price || "").trim() !== "") payload.unit_price = Number(readinessForm.unit_price);
      if (String(readinessForm.moq || "").trim() !== "") payload.moq = Number(readinessForm.moq);
      payload.sku = (readinessForm.sku || "").trim();
      payload.hs_code = (readinessForm.hs_code || "").trim();
      payload.origin_country = (readinessForm.origin_country || "").trim();
      payload.origin_region = (readinessForm.origin_region || "").trim();
      payload.origin_city = (readinessForm.origin_city || "").trim();
      if (String(readinessForm.lead_time_days || "").trim() !== "") payload.lead_time_days = Number(readinessForm.lead_time_days);
      if (String(readinessForm.weight_grams || "").trim() !== "") payload.weight_grams = Number(readinessForm.weight_grams);
      if (String(readinessForm.ship_time_min_days || "").trim() !== "") payload.ship_time_min_days = Number(readinessForm.ship_time_min_days);
      if (String(readinessForm.ship_time_max_days || "").trim() !== "") payload.ship_time_max_days = Number(readinessForm.ship_time_max_days);
      payload.sample_available = !!readinessForm.sample_available;
      if (String(readinessForm.sample_ship_days || "").trim() !== "") payload.sample_ship_days = Number(readinessForm.sample_ship_days);
      payload.monthly_capacity = (readinessForm.monthly_capacity || "").trim();
      payload.ip_protection_level = (readinessForm.ip_protection_level || "").trim().toLowerCase();
      payload.trademark_registration_number = (readinessForm.trademark_registration_number || "").trim();
      payload.pricing_tiers = parseOptionalJson(readinessForm.pricing_tiers || "", "Pricing tiers");
      payload.variations = parseOptionalJson(readinessForm.variations || "", "Variations");
      payload.detail_config = (readinessForm.detail_config || "").trim()
        ? JSON.parse(readinessForm.detail_config)
        : {};

      const updated = await fetchJson(`/api/v1/admin/listing-requests/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setReadinessDetail(updated);
      setReadinessForm(buildReadinessForm(updated));
      setReadinessEditMode(false);
      setActionSuccess("Listing details updated successfully.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setReadinessSaveError(e?.message || "Failed to update listing details.");
    } finally {
      setReadinessSaving(false);
    }
  };

  const verifyCompliance = async (lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    setActionError("");
    setActionSuccess("");
    setVerifyId(id);
    setVerifyNotes((lr?.compliance_notes || "").toString());
    setVerifyOpen(true);
  };

  const approveListingRequest = async (lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    setActionError("");
    setActionSuccess("");
    setApproveId(id);
    setApproveRating("");
    setApproveOpen(true);
  };

  const submitVerifyModal = async () => {
    const id = Number(verifyId || 0);
    if (!id) return;
    if (verifySaving) return;
    setVerifySaving(true);
    try {
      const notes = (verifyNotes || "").trim();
      await fetchJson(`/api/v1/admin/listing-requests/${id}/verify_compliance/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true, notes }),
      });
      setVerifyOpen(false);
      setVerifyId(null);
      setVerifyNotes("");
      setActionSuccess("Compliance verified. Listing moved to Inspection stage.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
      if (lrStage === "compliance") setListingRequestStageFilter("inspection");
    } catch (e: any) {
      setActionError(e?.message || "Compliance verification failed.");
    } finally {
      setVerifySaving(false);
    }
  };

  const submitApproveModal = async () => {
    const id = Number(approveId || 0);
    if (!id) return;
    if (approveSaving) return;
    setApproveSaving(true);
    try {
      const raw = (approveRating || "").trim();
      const body: any = { decision: "approve" };
      if (raw) {
        const rating = Number(raw);
        if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
          setActionError("Rating must be between 0 and 5.");
          return;
        }
        body.rating = rating;
      }
      await fetchJson(`/api/v1/admin/listing-requests/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setApproveOpen(false);
      setApproveId(null);
      setApproveRating("");
      setActionSuccess("Approved. Listing moved to Approved stage (ready for publish).");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
      if (lrStage === "inspection" || lrStage === "inbound") setListingRequestStageFilter("live");
    } catch (e: any) {
      setActionError(e?.message || "Approval failed.");
    } finally {
      setApproveSaving(false);
    }
  };

  const completeInspection = async (lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    try {
      setActionError("");
      setActionSuccess("");
      await fetchJson(`/api/v1/admin/listing-requests/${id}/complete_inspection/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspected: true }),
      });
      setActionSuccess("Inspection marked complete.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
    } catch (e: any) {
      setActionError(e?.message || "Failed to complete inspection.");
    }
  };

  const confirmPickupListingRequest = async (lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    try {
      setActionError("");
      setActionSuccess("");
      await fetchJson(`/api/v1/admin/listing-requests/${id}/confirm_pickup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setActionSuccess("Sample pickup confirmed. Listing is now LIVE.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
    } catch (e: any) {
      setActionError(e?.message || "Failed to confirm pickup.");
    }
  };

  const requestChangesForListing = async (id: number, msg: string) => {
    try {
      setActionError("");
      setActionSuccess("");
      await fetchJson(`/api/v1/admin/listing-requests/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "needs_changes", message: (msg || "").trim() }),
      });
      setActionSuccess("Changes requested. Listing moved to Samples stage.");
      window.setTimeout(() => setActionSuccess(""), 2500);
      refreshListingRequests();
      if (lrStage !== "all" && lrStage !== "samples") setListingRequestStageFilter("samples");
    } catch (e: any) {
      setActionError(e?.message || "Request changes failed.");
    }
  };

  const openChangesModal = useCallback((lr: any) => {
    const id = Number(lr?.id || 0);
    if (!id) return;
    setActionError("");
    setActionSuccess("");
    const meta = lr?.product_meta && typeof lr.product_meta === "object" ? lr.product_meta : {};
    const existing = (meta?.review_message || "").toString();
    setChangesId(id);
    setChangesMessage(existing);
    setChangesOpen(true);
  }, []);

  const submitChangesModal = useCallback(async () => {
    const id = Number(changesId || 0);
    const msg = (changesMessage || "").trim();
    if (!id) return;
    if (!msg) {
      setActionError("Please enter a message for the seller.");
      return;
    }
    if (changesSaving) return;
    setChangesSaving(true);
    try {
      await requestChangesForListing(id, msg);
      setChangesOpen(false);
      setChangesId(null);
      setChangesMessage("");
    } finally {
      setChangesSaving(false);
    }
  }, [changesId, changesMessage, changesSaving, requestChangesForListing]);

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

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackProductId, setFeedbackProductId] = useState<number | null>(null);
  const [feedbackProductName, setFeedbackProductName] = useState<string>("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [feedbackKind, setFeedbackKind] = useState<string>("info");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  const [productDeleteOpen, setProductDeleteOpen] = useState(false);
  const [productDeleteId, setProductDeleteId] = useState<number | null>(null);
  const [productDeleteName, setProductDeleteName] = useState<string>("");
  const [productDeleteSaving, setProductDeleteSaving] = useState(false);

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

  const openFeedbackModal = async (p: any) => {
    const id = Number(p?.id || 0);
    if (!id) return;
    setActionError("");
    setActionSuccess("");
    setMenuProductId(null);
    setFeedbackOpen(true);
    setFeedbackProductId(id);
    setFeedbackProductName((p?.name || "").toString());
    setFeedbackItems([]);
    setFeedbackMessage("");
    setFeedbackKind("info");
    setFeedbackLoading(true);
    try {
      const data = await fetchJson(`/api/v1/admin/products/${id}/feedback/`);
      setFeedbackItems(Array.isArray(data?.results) ? data.results : []);
    } catch (e: any) {
      setFeedbackItems([]);
      setActionError(e?.message || "Failed to load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const submitFeedback = async () => {
    const id = Number(feedbackProductId || 0);
    const msg = (feedbackMessage || "").trim();
    if (!id) return;
    if (!msg) {
      setActionError("Please write a feedback message.");
      return;
    }
    if (feedbackSaving) return;
    setFeedbackSaving(true);
    try {
      setActionError("");
      setActionSuccess("");
      await fetchJson(`/api/v1/admin/products/${id}/feedback/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, kind: feedbackKind }),
      });
      setActionSuccess("Feedback sent to seller.");
      setFeedbackMessage("");
      const data = await fetchJson(`/api/v1/admin/products/${id}/feedback/`);
      setFeedbackItems(Array.isArray(data?.results) ? data.results : []);
    } catch (e: any) {
      setActionError(e?.message || "Failed to send feedback.");
    } finally {
      setFeedbackSaving(false);
    }
  };

  const openProductDeleteModal = (p: any) => {
    const id = Number(p?.id || 0);
    if (!id) return;
    setActionError("");
    setActionSuccess("");
    setMenuProductId(null);
    setProductDeleteId(id);
    setProductDeleteName((p?.name || "").toString());
    setProductDeleteOpen(true);
  };

  const closeProductDeleteModal = () => {
    setProductDeleteOpen(false);
    setProductDeleteId(null);
    setProductDeleteName("");
    setProductDeleteSaving(false);
  };

  const submitProductDelete = async () => {
    const id = Number(productDeleteId || 0);
    if (!id) return;
    if (productDeleteSaving) return;
    setProductDeleteSaving(true);
    try {
      setActionError("");
      setActionSuccess("");
      await fetchJson(`/api/v1/admin/products/${id}/delete/`, { method: "POST" });
      setActionSuccess("Product deleted.");
      closeProductDeleteModal();
      refreshProducts();
      await refreshStats();
    } catch (e: any) {
      setActionError(e?.message || "Failed to delete product.");
    } finally {
      setProductDeleteSaving(false);
    }
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
      <AnimatePresence>
        {changesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !changesSaving) {
                setChangesOpen(false);
                setChangesId(null);
                setChangesMessage("");
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[640px] rounded-3xl bg-card border border-border/30 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.9375rem] font-bold text-foreground/85">Request Changes</div>
                  <div className="text-[0.8125rem] text-muted-foreground/70 mt-0.5">Tell the seller exactly what to fix.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (changesSaving) return;
                    setChangesOpen(false);
                    setChangesId(null);
                    setChangesMessage("");
                  }}
                  className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/40 grid place-items-center"
                >
                  <X size={16} className="text-muted-foreground/70" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={changesMessage}
                  onChange={(e) => setChangesMessage(e.target.value)}
                  placeholder="Example: Please add HS code, upload compliance documents, and correct the origin country."
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.875rem] text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (changesSaving) return;
                      setChangesOpen(false);
                      setChangesId(null);
                      setChangesMessage("");
                    }}
                    className="px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitChangesModal()}
                    disabled={changesSaving}
                    className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold border ${
                      changesSaving
                        ? "bg-muted/10 border-border/20 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15"
                    }`}
                  >
                    {changesSaving ? "Sending…" : "Send to Seller"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {verifyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !verifySaving) {
                setVerifyOpen(false);
                setVerifyId(null);
                setVerifyNotes("");
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[640px] rounded-3xl bg-card border border-border/30 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.9375rem] font-bold text-foreground/85">Verify Compliance</div>
                  <div className="text-[0.8125rem] text-muted-foreground/70 mt-0.5">Confirm compliance and move the listing to Inspection.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (verifySaving) return;
                    setVerifyOpen(false);
                    setVerifyId(null);
                    setVerifyNotes("");
                  }}
                  className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/40 grid place-items-center"
                >
                  <X size={16} className="text-muted-foreground/70" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Optional notes (e.g., documents reviewed, exceptions, requirements)."
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.875rem] text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (verifySaving) return;
                      setVerifyOpen(false);
                      setVerifyId(null);
                      setVerifyNotes("");
                    }}
                    className="px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitVerifyModal()}
                    disabled={verifySaving}
                    className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold border ${
                      verifySaving
                        ? "bg-muted/10 border-border/20 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15"
                    }`}
                  >
                    {verifySaving ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {approveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !approveSaving) {
                setApproveOpen(false);
                setApproveId(null);
                setApproveRating("");
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[520px] rounded-3xl bg-card border border-border/30 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.9375rem] font-bold text-foreground/85">Approve Listing</div>
                  <div className="text-[0.8125rem] text-muted-foreground/70 mt-0.5">Set rating and move the listing to Approved stage.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (approveSaving) return;
                    setApproveOpen(false);
                    setApproveId(null);
                    setApproveRating("");
                  }}
                  className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/40 grid place-items-center"
                >
                  <X size={16} className="text-muted-foreground/70" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="text-[0.75rem] uppercase tracking-wide text-muted-foreground/60 mb-2">Rating (0–5)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={5}
                    step={0.1}
                    value={approveRating}
                    onChange={(e) => setApproveRating(e.target.value)}
                    placeholder="Leave blank for default 4.8"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.875rem] text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (approveSaving) return;
                      setApproveOpen(false);
                      setApproveId(null);
                      setApproveRating("");
                    }}
                    className="px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitApproveModal()}
                    disabled={approveSaving}
                    className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold border ${
                      approveSaving
                        ? "bg-muted/10 border-border/20 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15"
                    }`}
                  >
                    {approveSaving ? "Approving…" : "Approve"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {readinessOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setReadinessOpen(false);
                setReadinessId(null);
                setReadinessTitle("");
                setReadinessMissing([]);
                setReadinessRequiredDocs([]);
                setReadinessDocsAttached(0);
                setReadinessSuggestedMessage("");
                setReadinessDetail(null);
                setReadinessLoading(false);
                setReadinessError("");
                setReadinessEditMode(false);
                setReadinessSaving(false);
                setReadinessSaveError("");
                setReadinessForm(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[1180px] max-h-[90vh] rounded-3xl bg-card border border-border/30 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[1rem] font-bold text-foreground/90">Listing Request Details</div>
                  <div className="text-[0.8125rem] text-muted-foreground/70 mt-0.5">{readinessTitle || "Review product details, media, readiness, and seller submission data."}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReadinessOpen(false);
                    setReadinessId(null);
                    setReadinessTitle("");
                    setReadinessMissing([]);
                    setReadinessRequiredDocs([]);
                    setReadinessDocsAttached(0);
                    setReadinessSuggestedMessage("");
                    setReadinessDetail(null);
                    setReadinessLoading(false);
                    setReadinessError("");
                    setReadinessEditMode(false);
                    setReadinessSaving(false);
                    setReadinessSaveError("");
                    setReadinessForm(null);
                  }}
                  className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/40 grid place-items-center"
                >
                  <X size={16} className="text-muted-foreground/70" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`rounded-[24px] border p-4 ${readinessMissing.length ? "border-amber-200/70 bg-amber-50/80" : "border-emerald-200/70 bg-emerald-50/80"}`}>
                    <div className="flex items-center gap-2">
                      {readinessMissing.length ? (
                        <AlertTriangle size={15} className="text-amber-600" />
                      ) : (
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      )}
                      <div className="text-[0.6875rem] uppercase tracking-wide text-foreground/55">Missing fields</div>
                    </div>
                    <div className="mt-2 text-[0.875rem] font-semibold text-foreground/85">
                      {readinessMissing.length ? `${readinessMissing.length} item${readinessMissing.length === 1 ? "" : "s"} need review` : "No missing fields flagged"}
                    </div>
                    {!!readinessMissing.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {readinessMissing.map((field) => (
                          <span key={field} className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-white/80 border border-amber-200/80 text-amber-700">
                            {prettyFieldLabel(field)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`rounded-[24px] border p-4 ${readinessRequiredDocs.length && readinessDocsAttached <= 0 ? "border-amber-200/70 bg-amber-50/80" : "border-sky-200/70 bg-sky-50/80"}`}>
                    <div className="flex items-center gap-2">
                      <FileText size={15} className={readinessRequiredDocs.length && readinessDocsAttached <= 0 ? "text-amber-600" : "text-sky-600"} />
                      <div className="text-[0.6875rem] uppercase tracking-wide text-foreground/55">Documents</div>
                    </div>
                    <div className="mt-2 text-[0.875rem] font-semibold text-foreground/85">
                      {readinessRequiredDocs.length
                        ? readinessDocsAttached > 0
                          ? `${readinessDocsAttached} attached`
                          : "Required documents missing"
                        : "No required documents"}
                    </div>
                    <div className="mt-1 text-[0.75rem] text-foreground/60">
                      {readinessRequiredDocs.length ? `${readinessRequiredDocs.length} document type${readinessRequiredDocs.length === 1 ? "" : "s"} required for this category` : "This product can move without extra documents."}
                    </div>
                  </div>
                </div>

                {readinessRequiredDocs.length > 0 && (
                  <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4">
                    <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Required documents</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {readinessRequiredDocs.map((doc) => (
                        <span key={doc} className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-background/70 border border-border/40 text-foreground/70">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {readinessLoading && (
                  <div className="rounded-2xl border border-border/30 bg-muted/10 p-4 text-[0.8125rem] text-muted-foreground/70">
                    Loading full details…
                  </div>
                )}
                {readinessError && !readinessLoading && (
                  <div className="rounded-2xl border border-border/30 bg-muted/10 p-4 text-[0.8125rem] text-muted-foreground/70">
                    {readinessError}
                  </div>
                )}

                {!readinessLoading && readinessDetail && (
                  (() => {
                    const created = readinessDetail?.created_product_detail || null;
                    const meta = readinessDetail?.product_meta && typeof readinessDetail.product_meta === "object" ? readinessDetail.product_meta : {};
                    const detailConfig =
                      meta?.detail_config && typeof meta.detail_config === "object"
                        ? meta.detail_config
                        : created?.detail_config && typeof created.detail_config === "object"
                          ? created.detail_config
                          : {};
                    const origin =
                      meta?.origin_location && typeof meta.origin_location === "object"
                        ? meta.origin_location
                        : created?.origin_location && typeof created.origin_location === "object"
                          ? created.origin_location
                          : {};
                    const requestAssets = Array.isArray(readinessDetail?.photos) ? readinessDetail.photos : [];
                    const requestImages = requestAssets.filter((p: any) => String(p?.content_type || "").toLowerCase().startsWith("image/") && String(p?.file_url || "").trim());
                    const requestDocs = requestAssets.filter((p: any) => !String(p?.content_type || "").toLowerCase().startsWith("image/") && String(p?.file_url || "").trim());
                    const productImages = Array.isArray(created?.images) ? created.images.filter((u: any) => typeof u === "string" && u.trim()) : [];
                    const tiers = Array.isArray(created?.pricing_tiers)
                      ? created.pricing_tiers
                      : Array.isArray(meta?.pricing_tiers)
                        ? meta.pricing_tiers
                        : [];
                    const variants = Array.isArray(created?.variations)
                      ? created.variations
                      : Array.isArray(detailConfig?.variants)
                        ? detailConfig.variants
                        : [];
                    const specifications = Array.isArray(detailConfig?.specifications) ? detailConfig.specifications : [];
                    const description = String(readinessDetail?.description || meta?.description || created?.description || "").trim();
                    const additionalMetaEntries = Object.entries(meta).filter(([key, value]) => {
                      if (["origin_location", "detail_config", "pricing_tiers", "review_message", "sku", "hs_code", "lead_time_days", "weight_grams", "ship_time_min_days", "ship_time_max_days", "sample_available", "monthly_production_capacity", "trademark_reg_number", "ip_protection_level"].includes(key)) {
                        return false;
                      }
                      if (value == null || value === "") return false;
                      if (Array.isArray(value) && value.length === 0) return false;
                      return true;
                    });
                    const allMedia = [...requestImages, ...productImages.map((url: string, index: number) => ({ id: `product-${index}`, file_url: url, original_name: `Published image ${index + 1}` }))];
                    const closeAndRequestChanges = () => {
                      const id = Number(readinessDetail?.id || readinessId || 0);
                      if (!id) return;
                      const msg = (readinessSuggestedMessage || "").trim();
                      setReadinessOpen(false);
                      setReadinessId(null);
                      setReadinessTitle("");
                      setReadinessMissing([]);
                      setReadinessRequiredDocs([]);
                      setReadinessDocsAttached(0);
                      setReadinessSuggestedMessage("");
                      setReadinessDetail(null);
                      setReadinessLoading(false);
                      setReadinessError("");
                      setReadinessEditMode(false);
                      setReadinessSaving(false);
                      setReadinessSaveError("");
                      setReadinessForm(null);
                      setChangesId(id);
                      setChangesMessage(msg);
                      setChangesOpen(true);
                    };

                    return (
                      <div className="space-y-5">
                        <div className="rounded-[28px] border border-border/30 bg-[linear-gradient(135deg,rgba(1,113,227,0.08),rgba(255,255,255,0.92))] p-5 sm:p-6">
                          <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
                            <div className="flex gap-4 min-w-0">
                              <div className="w-24 h-24 rounded-[22px] overflow-hidden border border-white/70 bg-white/80 shadow-sm shrink-0">
                                {allMedia.length ? (
                                  <img src={String(allMedia[0]?.file_url || allMedia[0])} alt={String(readinessDetail?.product_name || "product")} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full grid place-items-center text-muted-foreground/35">
                                    <Camera size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-[1.1rem] sm:text-[1.25rem] font-bold text-foreground/90">
                                    {readinessDetail?.product_name || "Untitled product"}
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-white/80 border border-white/80 text-foreground/70">
                                    {(readinessDetail?.stage || "—").toString().toUpperCase()}
                                  </span>
                                  {!!created && (
                                    <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-emerald-50 border border-emerald-200/80 text-emerald-700">
                                      Published product exists
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-[0.875rem] text-muted-foreground/75">
                                  {readinessDetail?.company_name || "—"} · {readinessDetail?.category_label || "—"}
                                </div>
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.75rem]">
                                  <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                    <div className="text-muted-foreground/55">Unit price</div>
                                    <div className="mt-1 font-semibold text-foreground/85">{formatMoney(readinessDetail?.currency, readinessDetail?.unit_price)}</div>
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                    <div className="text-muted-foreground/55">MOQ</div>
                                    <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(readinessDetail?.moq)}</div>
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                    <div className="text-muted-foreground/55">Currency</div>
                                    <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(readinessDetail?.currency)}</div>
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                    <div className="text-muted-foreground/55">Admin rating</div>
                                    <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(readinessDetail?.rating)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReadinessEditMode((prev) => {
                                    const next = !prev;
                                    if (next && readinessDetail) setReadinessForm(buildReadinessForm(readinessDetail));
                                    if (!next) setReadinessSaveError("");
                                    return next;
                                  });
                                }}
                                className={`px-4 py-2.5 rounded-2xl text-[0.75rem] font-semibold border transition-colors ${
                                  readinessEditMode
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background/70 text-foreground/80 border-border/40 hover:border-primary/30 hover:text-primary"
                                }`}
                              >
                                {readinessEditMode ? "Editing" : "Edit details"}
                              </button>
                              <button
                                type="button"
                                onClick={closeAndRequestChanges}
                                className="px-4 py-2.5 rounded-2xl text-[0.75rem] font-semibold bg-primary text-primary-foreground hover:opacity-95"
                              >
                                Request changes
                              </button>
                            </div>
                          </div>
                        </div>

                        {readinessEditMode && readinessForm && (
                          <div className="rounded-[28px] border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <div className="text-[0.95rem] font-bold text-foreground/90">Edit listing data</div>
                                <div className="mt-1 text-[0.8125rem] text-muted-foreground/70">
                                  Update the request data here. If a published product already exists, these changes will sync there too.
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReadinessEditMode(false);
                                    setReadinessSaveError("");
                                    if (readinessDetail) setReadinessForm(buildReadinessForm(readinessDetail));
                                  }}
                                  className="px-4 py-2.5 rounded-2xl text-[0.75rem] font-semibold bg-background/80 border border-border/40 text-foreground/75"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void saveReadinessEdits()}
                                  disabled={readinessSaving}
                                  className={`px-4 py-2.5 rounded-2xl text-[0.75rem] font-semibold ${
                                    readinessSaving
                                      ? "bg-primary/40 text-white cursor-not-allowed"
                                      : "bg-primary text-primary-foreground hover:opacity-95"
                                  }`}
                                >
                                  {readinessSaving ? "Saving..." : "Save changes"}
                                </button>
                              </div>
                            </div>

                            {readinessSaveError && (
                              <div className="rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-[0.8125rem] text-rose-700">
                                {readinessSaveError}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                              {[
                                ["Product name", "product_name", "text"],
                                ["Company name", "company_name", "text"],
                                ["Unit price", "unit_price", "number"],
                                ["MOQ", "moq", "number"],
                                ["SKU", "sku", "text"],
                                ["HS code", "hs_code", "text"],
                                ["Origin country", "origin_country", "text"],
                                ["Origin region", "origin_region", "text"],
                                ["Origin city", "origin_city", "text"],
                                ["Lead time (days)", "lead_time_days", "number"],
                                ["Weight (grams)", "weight_grams", "number"],
                                ["Ship time min", "ship_time_min_days", "number"],
                                ["Ship time max", "ship_time_max_days", "number"],
                                ["Sample ship days", "sample_ship_days", "number"],
                                ["Monthly capacity", "monthly_capacity", "text"],
                                ["Trademark reg. number", "trademark_registration_number", "text"],
                              ].map(([label, key, type]) => (
                                <label key={String(key)} className="rounded-2xl border border-border/30 bg-background/70 p-3 block">
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">{label}</div>
                                  <input
                                    type={String(type)}
                                    value={String(readinessForm?.[String(key)] ?? "")}
                                    onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, [key]: e.target.value }))}
                                    className="mt-2 w-full bg-transparent outline-none text-[0.8125rem] text-foreground/85 placeholder:text-muted-foreground/35"
                                  />
                                </label>
                              ))}

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-3 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Category</div>
                                <select
                                  value={String(readinessForm?.category_id ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, category_id: e.target.value }))}
                                  className="mt-2 w-full bg-transparent outline-none text-[0.8125rem] text-foreground/85"
                                >
                                  <option value="">Select category</option>
                                  {(categories || []).map((cat: any) => (
                                    <option key={cat.id} value={String(cat.id)}>
                                      {String(cat.label || cat.name || cat.slug || `Category ${cat.id}`)}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-3 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Currency</div>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={String(readinessForm?.currency ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                                  className="mt-2 w-full bg-transparent outline-none text-[0.8125rem] text-foreground/85"
                                />
                              </label>

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-3 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">IP protection</div>
                                <select
                                  value={String(readinessForm?.ip_protection_level ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, ip_protection_level: e.target.value }))}
                                  className="mt-2 w-full bg-transparent outline-none text-[0.8125rem] text-foreground/85"
                                >
                                  <option value="">None</option>
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </label>

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-3 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Sample available</div>
                                  <div className="mt-1 text-[0.75rem] text-foreground/70">Toggle product sample offering</div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={!!readinessForm?.sample_available}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, sample_available: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <label className="rounded-2xl border border-border/30 bg-background/70 p-4 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Description</div>
                                <textarea
                                  value={String(readinessForm?.description ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, description: e.target.value }))}
                                  rows={5}
                                  className="mt-2 w-full bg-transparent outline-none resize-none text-[0.8125rem] text-foreground/85"
                                />
                              </label>

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-4 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Detail config JSON</div>
                                <textarea
                                  value={String(readinessForm?.detail_config ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, detail_config: e.target.value }))}
                                  rows={5}
                                  className="mt-2 w-full bg-transparent outline-none resize-none text-[0.75rem] text-foreground/85 font-mono"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <label className="rounded-2xl border border-border/30 bg-background/70 p-4 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Pricing tiers JSON</div>
                                <div className="mt-1 text-[0.75rem] text-muted-foreground/60">Format: array of objects with `variation`, `min_quantity`, `max_quantity`, `unit_price`, `currency`.</div>
                                <textarea
                                  value={String(readinessForm?.pricing_tiers ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, pricing_tiers: e.target.value }))}
                                  rows={9}
                                  className="mt-2 w-full bg-transparent outline-none resize-none text-[0.75rem] text-foreground/85 font-mono"
                                />
                              </label>

                              <label className="rounded-2xl border border-border/30 bg-background/70 p-4 block">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Variations JSON</div>
                                <div className="mt-1 text-[0.75rem] text-muted-foreground/60">Format: array of objects with `sku` and `attributes`.</div>
                                <textarea
                                  value={String(readinessForm?.variations ?? "")}
                                  onChange={(e) => setReadinessForm((prev: any) => ({ ...prev, variations: e.target.value }))}
                                  rows={9}
                                  className="mt-2 w-full bg-transparent outline-none resize-none text-[0.75rem] text-foreground/85 font-mono"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                          <div className="space-y-5 xl:sticky xl:top-0">
                            <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4">
                              <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                                <Package size={14} />
                                Request overview
                              </div>
                              <div className="mt-4 space-y-3 text-[0.8125rem]">
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-muted-foreground/60">Seller</span>
                                  <span className="text-right text-foreground/80">{displayAdminValue(readinessDetail?.seller_label || readinessDetail?.seller_email)}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-muted-foreground/60">Email</span>
                                  <span className="text-right text-foreground/80 break-all">{displayAdminValue(readinessDetail?.seller_email)}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-muted-foreground/60">Created</span>
                                  <span className="text-right text-foreground/80">{displayAdminValue(readinessDetail?.created_at)}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-muted-foreground/60">Compliance</span>
                                  <span className="text-right text-foreground/80">{readinessDetail?.compliance_verified ? "Verified" : "Pending"}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-muted-foreground/60">Inspection</span>
                                  <span className="text-right text-foreground/80">{readinessDetail?.inspected ? "Completed" : readinessDetail?.inspector ? "Assigned" : "Not required"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4">
                              <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                                <ClipboardCheck size={14} />
                                Admin review focus
                              </div>
                              <div className="mt-3 space-y-2">
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-[0.6875rem] text-muted-foreground/60 uppercase tracking-wide">Missing fields</div>
                                  <div className="mt-1 text-[0.8125rem] text-foreground/80">
                                    {readinessMissing.length ? readinessMissing.map(prettyFieldLabel).join(", ") : "None flagged"}
                                  </div>
                                </div>
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-[0.6875rem] text-muted-foreground/60 uppercase tracking-wide">Seller message draft</div>
                                  <div className="mt-1 text-[0.8125rem] text-foreground/80 whitespace-pre-wrap">
                                    {readinessSuggestedMessage || "Nothing missing right now."}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4">
                              <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                                <FileText size={14} />
                                Files summary
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-3 text-[0.75rem]">
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-muted-foreground/55">Request images</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatNumber(requestImages.length)}</div>
                                </div>
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-muted-foreground/55">Docs uploaded</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatNumber(requestDocs.length)}</div>
                                </div>
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-muted-foreground/55">Published images</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatNumber(productImages.length)}</div>
                                </div>
                                <div className="rounded-2xl bg-background/50 border border-border/30 p-3">
                                  <div className="text-muted-foreground/55">Pricing tiers</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatNumber(tiers.length)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="xl:col-span-2 space-y-5">
                            <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                              <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                <Camera size={16} />
                                Media and documents
                              </div>

                              <div className="mt-4">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Submitted images</div>
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {requestImages.length ? requestImages.map((asset: any) => (
                                    <a
                                      key={asset.id}
                                      href={String(asset.file_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group block rounded-[20px] overflow-hidden border border-border/30 bg-background/70"
                                    >
                                      <img src={String(asset.file_url)} alt={String(asset.original_name || "request image")} className="w-full h-32 object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                                      <div className="px-3 py-2 text-[0.6875rem] text-muted-foreground/70 truncate">{String(asset.original_name || "Request image")}</div>
                                    </a>
                                  )) : (
                                    <div className="col-span-full rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No request images uploaded.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {productImages.length > 0 && (
                                <div className="mt-5">
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Published product images</div>
                                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {productImages.map((url: string, idx: number) => (
                                      <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="group block rounded-[20px] overflow-hidden border border-border/30 bg-background/70">
                                        <img src={url} alt={`Published image ${idx + 1}`} className="w-full h-32 object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                                        <div className="px-3 py-2 text-[0.6875rem] text-muted-foreground/70 truncate">Published image {idx + 1}</div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-5">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Documents</div>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {requestDocs.length ? requestDocs.map((doc: any) => (
                                    <a
                                      key={doc.id}
                                      href={String(doc.file_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-2xl border border-border/30 bg-background/60 px-4 py-3 text-[0.8125rem] text-foreground/80 hover:border-primary/30 hover:text-primary transition-colors"
                                    >
                                      <div className="font-semibold">{String(doc.original_name || "Document")}</div>
                                      <div className="mt-1 text-[0.6875rem] text-muted-foreground/60">{String(doc.content_type || "File")}</div>
                                    </a>
                                  )) : (
                                    <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No supporting documents uploaded.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                  <Hash size={16} />
                                  Core product info
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.8125rem]">
                                  {[
                                    ["Product name", readinessDetail?.product_name],
                                    ["Company name", readinessDetail?.company_name],
                                    ["Category", readinessDetail?.category_label],
                                    ["SKU", meta?.sku],
                                    ["HS code", meta?.hs_code],
                                    ["Trademark reg. number", meta?.trademark_reg_number],
                                    ["IP protection", meta?.ip_protection_level],
                                    ["Sample available", meta?.sample_available ?? created?.sample_available],
                                  ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                      <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">{label}</div>
                                      <div className="mt-1 text-foreground/85">{displayAdminValue(value)}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 rounded-2xl border border-border/30 bg-background/50 p-4">
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Description</div>
                                  <div className="mt-2 text-[0.8125rem] leading-6 text-foreground/80">
                                    {description || "No description provided."}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                  <Truck size={16} />
                                  Pricing, supply, and shipping
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.8125rem]">
                                  {[
                                    ["Unit price", formatMoney(readinessDetail?.currency, readinessDetail?.unit_price)],
                                    ["MOQ", readinessDetail?.moq],
                                    ["Lead time (days)", meta?.lead_time_days ?? created?.lead_time_days],
                                    ["Weight (grams)", meta?.weight_grams ?? created?.weight_grams],
                                    ["Ship time min", meta?.ship_time_min_days ?? created?.ship_time_min_days],
                                    ["Ship time max", meta?.ship_time_max_days ?? created?.ship_time_max_days],
                                    ["Monthly capacity", meta?.monthly_production_capacity],
                                    ["Published status", created?.status],
                                  ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                      <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">{label}</div>
                                      <div className="mt-1 text-foreground/85">{displayAdminValue(value)}</div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 rounded-2xl border border-border/30 bg-background/50 p-4">
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Origin</div>
                                  <div className="mt-2 flex items-center gap-2 text-[0.8125rem] text-foreground/80">
                                    <MapPin size={14} className="text-muted-foreground/50" />
                                    <span>
                                      {[origin?.country, origin?.region, origin?.city].filter((item) => String(item || "").trim()).join(" · ") || "Origin not provided"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {tiers.length > 0 && (
                              <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                  <Star size={16} />
                                  Quantity pricing
                                </div>
                                <div className="mt-4 overflow-hidden rounded-2xl border border-border/30">
                                  <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-background/60 text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                                    <div className="col-span-3">Min qty</div>
                                    <div className="col-span-3">Max qty</div>
                                    <div className="col-span-3">Unit price</div>
                                    <div className="col-span-3">Variant</div>
                                  </div>
                                  <div className="divide-y divide-border/20 bg-card/50">
                                    {tiers.map((tier: any, idx: number) => (
                                      <div key={`${tier?.id ?? idx}-${idx}`} className="grid grid-cols-12 gap-3 px-4 py-3 text-[0.8125rem] text-foreground/80">
                                        <div className="col-span-3">{displayAdminValue(tier?.min_quantity)}</div>
                                        <div className="col-span-3">{displayAdminValue(tier?.max_quantity)}</div>
                                        <div className="col-span-3">{formatMoney(tier?.currency || readinessDetail?.currency, tier?.unit_price)}</div>
                                        <div className="col-span-3">{displayAdminValue(tier?.variation_name || tier?.variation_label || tier?.variation)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(variants.length > 0 || specifications.length > 0) && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                  <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                    <Palette size={16} />
                                    Variants
                                  </div>
                                  <div className="mt-4 space-y-3">
                                    {variants.length ? variants.map((variant: any, idx: number) => (
                                      <div key={`${variant?.id ?? idx}-${idx}`} className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                        <div className="text-[0.8125rem] font-semibold text-foreground/85">
                                          {displayAdminValue(variant?.name || variant?.label || `Variant ${idx + 1}`)}
                                        </div>
                                        <div className="mt-1 text-[0.75rem] text-muted-foreground/65">
                                          {[variant?.value, variant?.sku, variant?.stock_units != null ? `${variant.stock_units} units` : ""].filter(Boolean).join(" · ") || "No extra variant details"}
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                        No variants added.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                  <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                    <ClipboardCheck size={16} />
                                    Specifications
                                  </div>
                                  <div className="mt-4 space-y-3">
                                    {specifications.length ? specifications.map((group: any, idx: number) => (
                                      <div key={`${group?.group ?? idx}-${idx}`} className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                        <div className="text-[0.8125rem] font-semibold text-foreground/85">{displayAdminValue(group?.group || `Group ${idx + 1}`)}</div>
                                        <div className="mt-2 space-y-1">
                                          {(Array.isArray(group?.items) ? group.items : []).map((item: any, itemIdx: number) => (
                                            <div key={`${item?.label ?? itemIdx}-${itemIdx}`} className="flex items-start justify-between gap-3 text-[0.75rem]">
                                              <span className="text-muted-foreground/65">{displayAdminValue(item?.label)}</span>
                                              <span className="text-right text-foreground/80">{displayAdminValue(item?.value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                        No specifications provided.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {additionalMetaEntries.length > 0 && (
                              <div className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-[0.75rem] font-semibold text-foreground/75">
                                  <Database size={16} />
                                  Additional submitted details
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {additionalMetaEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                      <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">{prettyFieldLabel(key)}</div>
                                      <div className="mt-1 text-[0.8125rem] text-foreground/85 break-words">{displayAdminValue(value)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <details className="rounded-[24px] border border-border/30 bg-muted/10 p-4 sm:p-5">
                              <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[0.75rem] font-semibold text-foreground/75">Raw data fallback</div>
                                  <div className="mt-1 text-[0.75rem] text-muted-foreground/60">Open only if admin needs the exact payload from seller request or created product.</div>
                                </div>
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/55">Expand</div>
                              </summary>
                              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                  <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Listing request payload</div>
                                  <pre className="mt-2 text-[11px] leading-[1.45] text-foreground/80 whitespace-pre-wrap break-words">{JSON.stringify(readinessDetail, null, 2)}</pre>
                                </div>
                                {created && (
                                  <div className="rounded-2xl border border-border/30 bg-background/50 p-3">
                                    <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Created product payload</div>
                                    <pre className="mt-2 text-[11px] leading-[1.45] text-foreground/80 whitespace-pre-wrap break-words">{JSON.stringify(created, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {readinessSuggestedMessage && (
                  <div className="rounded-2xl border border-border/30 bg-muted/10 p-4">
                    <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Suggested message to seller</div>
                    <div className="mt-2 text-[0.8125rem] text-foreground/80 whitespace-pre-wrap">
                      {readinessSuggestedMessage}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReadinessOpen(false);
                      setReadinessId(null);
                      setReadinessTitle("");
                      setReadinessMissing([]);
                      setReadinessRequiredDocs([]);
                      setReadinessDocsAttached(0);
                      setReadinessSuggestedMessage("");
                      setReadinessDetail(null);
                      setReadinessLoading(false);
                      setReadinessError("");
                      setReadinessEditMode(false);
                      setReadinessSaving(false);
                      setReadinessSaveError("");
                      setReadinessForm(null);
                    }}
                    className="px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                  {!!readinessSuggestedMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        setReadinessOpen(false);
                        setReadinessId(null);
                        setChangesId(readinessId);
                        setChangesMessage(readinessSuggestedMessage);
                        setChangesOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15"
                    >
                      Request changes
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <motion.div variants={stagger.item} className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("products")}
          className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold border transition-all ${
            mode === "products" ? "bg-primary/8 text-primary border-primary/20" : "bg-muted/20 text-muted-foreground border-border/30 hover:text-foreground"
          }`}
        >
          Products
        </button>
        <button
          type="button"
          onClick={() => setMode("requests")}
          className={`px-4 py-2.5 rounded-2xl text-[0.8125rem] font-semibold border transition-all ${
            mode === "requests" ? "bg-primary/8 text-primary border-primary/20" : "bg-muted/20 text-muted-foreground border-border/30 hover:text-foreground"
          }`}
        >
          Listing Requests
        </button>
      </motion.div>

      {mode === "requests" ? (
        <motion.div variants={stagger.item}>
          <SectionCard>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Search listing requests..."
                  value={lrSearch}
                  onChange={(e) => {
                    setLrSearch(e.target.value);
                    const params = new URLSearchParams(location.search);
                    if (e.target.value.trim()) params.set("rq", e.target.value.trim());
                    else params.delete("rq");
                    navigate({ search: params.toString() ? `?${params.toString()}` : "" });
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={lrStage}
                  onChange={(e) => {
                    const v = (e.target.value || "").toString();
                    setListingRequestStageFilter(v);
                  }}
                  className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
                >
                  <option value="all">All stages</option>
                  <option value="samples">Samples</option>
                  <option value="compliance">Compliance</option>
                  <option value="inspection">Inspection</option>
                  <option value="live">Approved</option>
                  <option value="done">Published</option>
                </select>
                <select
                  value={String(lrPageSize)}
                  onChange={(e) => setLrPageSize(Number(e.target.value) || 20)}
                  className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
                >
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>
            </div>

            {listingRequestsError && (
              <div className="rounded-2xl border border-border/30 bg-muted/10 p-4 text-[0.8125rem] text-muted-foreground">
                Failed to load listing requests.
              </div>
            )}

            {!listingRequestsLoading && (!listingRequests || listingRequests.length === 0) ? (
              <div className="rounded-2xl border border-border/30 bg-muted/10 p-6">
                <div className="text-[0.875rem] text-foreground/80 font-semibold">No listing requests found.</div>
                <div className="text-[0.8125rem] text-muted-foreground/70 mt-1">Try changing stage filter or search.</div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/30">
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/10 text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                  <div className="col-span-2">Product</div>
                  <div className="col-span-2">Seller</div>
                  <div className="col-span-2">Stage</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1 text-right">Changes</div>
                  <div className="col-span-2 text-right">Review</div>
                  <div className="col-span-1 text-right">Publish</div>
                  <div className="col-span-1 text-right">View</div>
                </div>
                <div className="divide-y divide-border/20">
                  {(listingRequests || []).map((lr: any) => (
                    <div key={lr.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                      <div className="col-span-2">
                        <div className="text-[0.875rem] font-semibold text-foreground/85 truncate" title={lr.product_name}>{lr.product_name || "—"}</div>
                        <div className="text-[0.75rem] text-muted-foreground/60 truncate">{lr.company_name || "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[0.8125rem] text-foreground/80 truncate">{lr.seller_label || lr.seller_email || "—"}</div>
                        <div className="text-[0.75rem] text-muted-foreground/60 truncate">{lr.seller_email || "—"}</div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <StatusPill 
                          status={
                            lr.stage === "done" ? "success" : 
                            lr.stage === "live" ? "success" :
                            lr.stage === "inbound" ? "info" :
                            lr.stage === "inspection" ? "info" :
                            lr.stage === "compliance" ? "warning" :
                            "pending"
                          } 
                          label={String(lr.stage || "—").toLowerCase() === "live" ? "approved" : (lr.stage || "—").toString()} 
                        />
                        <div className="flex gap-1">
                          {lr.compliance_verified ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center" title="Compliance Verified">
                              <ShieldCheck size={12} className="text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center" title="Compliance Pending">
                              <Shield size={12} className="text-amber-500" />
                            </div>
                          )}
                          {lr.inspected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center" title="Inspected">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center" title={lr.inspector_name ? `Inspector Assigned: ${lr.inspector_name}` : "Inspection Pending"}>
                              <Search size={12} className="text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-1 text-[0.8125rem] text-muted-foreground/70 tabular-nums whitespace-nowrap">
                        {(lr.created_at || "").toString().slice(0, 10) || "—"}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => openChangesModal(lr)}
                          className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Changes
                        </button>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 flex-wrap">
                        {(() => {
                          const stageKey = String(lr?.stage || "").toLowerCase();
                          const isDone = stageKey === "done" || !!lr?.created_product_id;
                          
                          if (lr.can_verify_compliance) {
                            return (
                              <button
                                type="button"
                                onClick={() => verifyCompliance(lr)}
                                className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
                                title="Verify Compliance"
                              >
                                Verify
                              </button>
                            );
                          }

                          if (lr.can_confirm_pickup) {
                            return (
                              <button
                                type="button"
                                onClick={() => confirmPickupListingRequest(lr)}
                                className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/15 transition-colors"
                                title="Confirm Sample Pickup"
                              >
                                Confirm Pickup
                              </button>
                            );
                          }

                          if (!isDone && stageKey === "inspection" && !!lr?.compliance_verified && !lr?.inspected) {
                            return (
                              <button
                                type="button"
                                onClick={() => completeInspection(lr)}
                                className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
                                title="Mark inspection complete"
                              >
                                Mark inspected
                              </button>
                            );
                          }

                          const requiredDocs = Array.isArray(lr?.required_documents) ? lr.required_documents : [];
                          const docsAttached = Number(lr?.documents_attached || 0) || 0;
                          const needsDocs = requiredDocs.length > 0;
                          const canApprove = !!lr?.compliance_verified && stageKey === "inspection" && (!needsDocs || docsAttached > 0);

                          if (!isDone && canApprove) {
                            return (
                              <button
                                type="button"
                                onClick={() => approveListingRequest(lr)}
                                className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
                                title="Approve Listing"
                              >
                                Approve
                              </button>
                            );
                          }

                          if (stageKey === "live") return <div className="text-[0.75rem] text-muted-foreground/50">Approved</div>;
                          if (isDone) return <div className="text-[0.75rem] text-muted-foreground/50">Done</div>;
                          
                          return <div className="text-[0.75rem] text-muted-foreground/50">—</div>;
                        })()}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {(() => {
                          const canPublish = !!lr.can_publish;
                          const isDone = String(lr?.stage || "").toLowerCase() === "done" || !!lr?.created_product_id;
                          
                          if (isDone) return <div className="text-[0.75rem] text-muted-foreground/50">Published</div>;

                          return (
                            <div className="flex flex-col items-end">
                              <button
                                type="button"
                                onClick={() => publishListingRequest(lr)}
                                disabled={!canPublish}
                                className={`px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold transition-all ${
                                  canPublish
                                    ? "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15"
                                    : "bg-muted/10 border border-border/20 text-muted-foreground/40 cursor-not-allowed"
                                }`}
                              >
                                Publish
                              </button>
                              {!canPublish && lr.stage === "live" && (
                                <button
                                  type="button"
                                  onClick={() => openReadinessModal(lr, "Needs compliance checks before publish")}
                                  className="mt-1 text-[0.6875rem] font-semibold text-primary/70 hover:text-primary underline underline-offset-4"
                                >
                                  Why disabled?
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (lr.created_product_id) {
                              setListingRequestStageFilter("all");
                              setSearch(lr.product_name);
                              setMode("products");
                            } else {
                              openReadinessModal(lr, "View listing details");
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-5 text-[0.8125rem] text-muted-foreground/70">
              <div>
                {typeof listingRequestsCount === "number" ? `Total: ${listingRequestsCount.toLocaleString()}` : ""}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLrPage(Math.max(1, lrPage - 1))}
                  disabled={lrPage <= 1}
                  className="px-3 py-2 rounded-xl border border-border/30 bg-muted/20 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setLrPage(lrTotalPages != null ? Math.min(lrTotalPages, lrPage + 1) : lrPage + 1)}
                  disabled={lrTotalPages != null ? lrPage >= lrTotalPages : (listingRequests || []).length < lrPageSize}
                  className="px-3 py-2 rounded-xl border border-border/30 bg-muted/20 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      ) : null}

      {mode === "requests" ? null : (
      <>
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-5 gap-5">
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "all" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter("all")}>
          <StatCard label="Total Products" value={formatNumber(stats?.total_products)} icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "active" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "active" ? "all" : "active"))}>
          <StatCard label="Active Listings" value={formatNumber(stats?.active_listings)} icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "low_stock" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "low_stock" ? "all" : "low_stock"))}>
          <StatCard label="Low Samples" value={formatNumber(stats?.low_stock)} icon={<AlertTriangle size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "out" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "out" ? "all" : "out"))}>
          <StatCard label="No Samples" value={formatNumber(stats?.out_of_stock)} icon={<XCircle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" />
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
              <div className="relative">
                <button
                  ref={categoryButtonRef}
                  type="button"
                  onClick={() => {
                    setCategoryOpen((v) => !v);
                    setCategoryQuery("");
                  }}
                  className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
                    catFilter !== "all" ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Filter size={14} className="opacity-70" />
                  {selectedCategory?.label || "All categories"}
                  <ChevronRight size={14} className={`opacity-50 transition-transform ${categoryOpen ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      ref={categoryPopoverRef}
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-30 mt-2 w-[340px] rounded-2xl border border-border/40 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                    >
                      <div className="p-3 border-b border-border/30">
                        <div className="flex items-center gap-2 bg-muted/20 border border-border/30 rounded-2xl px-3 py-2.5">
                          <Search size={14} className="text-muted-foreground/50" />
                          <input
                            value={categoryQuery}
                            onChange={(e) => setCategoryQuery(e.target.value)}
                            placeholder="Search categories..."
                            className="bg-transparent border-none outline-none text-[0.8125rem] text-foreground/80 placeholder:text-muted-foreground/40 w-full"
                          />
                        </div>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCatFilter("all");
                            setCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[0.8125rem] transition-colors ${
                            catFilter === "all" ? "bg-primary/8 text-primary" : "hover:bg-muted/20 text-foreground/80"
                          }`}
                        >
                          <span>All categories</span>
                          <span className="text-[0.75rem] text-muted-foreground/60 tabular-nums">{formatNumber(stats?.total_products)}</span>
                        </button>
                        {filteredCategories.map((cat: any) => (
                          <button
                            key={cat.slug || cat.id}
                            type="button"
                            onClick={() => {
                              setCatFilter(cat.slug || String(cat.id));
                              setCategoryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[0.8125rem] transition-colors ${
                              catFilter === (cat.slug || String(cat.id))
                                ? "bg-primary/8 text-primary"
                                : "hover:bg-muted/20 text-foreground/80"
                            }`}
                          >
                            <span className="truncate">{cat.label || cat.name}</span>
                            <span className="text-[0.75rem] text-muted-foreground/60 tabular-nums">{formatNumber(cat.count)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter(v => (v === "compliance" ? "all" : "compliance"))}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "compliance" ? "bg-[#E5484D]/10 text-[#E5484D]/80" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Needs compliance
              </button>
            </div>
          </div>

          {actionSuccess && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 text-[0.8125rem]">
              {actionSuccess}
            </div>
          )}

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
                        {c.label || c.name}
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
                  <span className="text-[0.75rem] text-muted-foreground/50">{p.seller_name || "—"} · {p.category_display || p.category_name || "—"}</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-[0.8125rem]">
                  <span className="text-foreground/70">{formatMoney(p.currency, p.price)}</span>
                  <span className={`${Number(p.stock_units) === 0 ? "text-muted-foreground/40" : Number(p.stock_units) < 50 ? "text-[#FFB224]/80" : "text-muted-foreground/50"}`}>
                    {`Samples: ${formatNumber(p.stock_units)}`}
                  </span>
                  <span className={`${String(p.fulfillment_mode || "").toLowerCase() === "seller_stock" ? (Number(p.seller_stock_units) <= 0 ? "text-[#E5484D]/80" : Number(p.seller_stock_units) < 10 ? "text-[#FFB224]/80" : "text-muted-foreground/50") : "text-primary/50"}`}>
                    {String(p.fulfillment_mode || "").toLowerCase() === "seller_stock"
                      ? `Bulk: ${formatNumber(p.seller_stock_units)}`
                      : "Bulk: MTO"}
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
                          onClick={() => void openFeedbackModal(p)}
                        >
                          <Bell size={14} className="text-muted-foreground/60" />
                          Feedback
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
                        <button
                          className="w-full text-left px-4 py-3 text-[0.8125rem] hover:bg-muted/20 flex items-center gap-2"
                          onClick={() => openProductDeleteModal(p)}
                        >
                          <Trash2 size={14} className="text-[#E5484D]/80" />
                          <span className="text-[#E5484D]/80">Delete</span>
                        </button>
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
      </>
      )}

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
                      {c.label || c.name}
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
        {feedbackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setFeedbackOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[720px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">Feedback</h2>
                  <p className="text-muted-foreground text-[0.8125rem] truncate">
                    #{feedbackProductId || "—"} · {feedbackProductName || "Product"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setFeedbackOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <select
                  value={feedbackKind}
                  onChange={e => setFeedbackKind(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="action_required">Action required</option>
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <input
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    placeholder="Write feedback for the seller…"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                  <BounceButton
                    variant="primary"
                    size="sm"
                    onClick={feedbackSaving ? undefined : submitFeedback}
                    className={feedbackSaving ? "opacity-70 pointer-events-none" : ""}
                    icon={feedbackSaving ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                  >
                    {feedbackSaving ? "Sending…" : "Send"}
                  </BounceButton>
                </div>
              </div>

              <div className="rounded-2xl border border-border/30 overflow-hidden">
                <div className="px-4 py-3 bg-muted/10 border-b border-border/20 flex items-center justify-between">
                  <div className="text-[0.75rem] text-muted-foreground/60">History</div>
                  <div className="text-[0.75rem] text-muted-foreground/50">{Array.isArray(feedbackItems) ? feedbackItems.length : 0}</div>
                </div>
                {feedbackLoading ? (
                  <div className="px-4 py-10 text-center text-[0.8125rem] text-muted-foreground/60">Loading…</div>
                ) : !feedbackItems?.length ? (
                  <div className="px-4 py-10 text-center text-[0.8125rem] text-muted-foreground/60">No feedback yet.</div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {feedbackItems.map((fb: any) => (
                      <div key={fb.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[0.6875rem] text-muted-foreground/60 uppercase tracking-wide">
                            {(fb.kind || "info").toString().replaceAll("_", " ")}
                          </span>
                          <span className="text-[0.75rem] text-muted-foreground/50">
                            {(fb.author_label || "").toString() || "Admin"} · {fb.created_at ? new Date(fb.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                        <div className="text-[0.875rem] text-foreground/80 whitespace-pre-wrap break-words">{fb.message || "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={closeProductDeleteModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[520px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">Delete product</h2>
                  <p className="text-muted-foreground text-[0.8125rem] truncate">
                    #{productDeleteId || "—"} · {productDeleteName || "Product"}
                  </p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={closeProductDeleteModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl bg-[#E5484D]/5 border border-[#E5484D]/10 p-4 text-[0.8125rem] text-[#E5484D]/80">
                This will remove the product from the marketplace and hide it across the system.
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <BounceButton variant="ghost" size="sm" onClick={closeProductDeleteModal}>
                  Cancel
                </BounceButton>
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={productDeleteSaving ? undefined : submitProductDelete}
                  className={productDeleteSaving ? "opacity-70 pointer-events-none bg-[#E5484D]/80" : "bg-[#E5484D] hover:bg-[#D63E44]"}
                  icon={productDeleteSaving ? <Clock size={14} /> : <Trash2 size={14} />}
                >
                  {productDeleteSaving ? "Deleting…" : "Delete"}
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
              className="w-full max-w-[1180px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
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
                (() => {
                  const productFull = detailData?.product_full || {};
                  const listingRequestDetail = detailData?.listing_request_detail || null;
                  const detailConfig = productFull?.detail_config && typeof productFull.detail_config === "object" ? productFull.detail_config : {};
                  const specifications = Array.isArray(detailConfig?.specifications) ? detailConfig.specifications : [];
                  const images = Array.isArray(productFull?.images) ? productFull.images : [];
                  const media = Array.isArray(detailData?.media) ? detailData.media : [];
                  const mediaImages = media.filter((m: any) => String(m?.media_type || "").toLowerCase() === "image" && String(m?.url || "").trim());
                  const mediaDocs = media.filter((m: any) => String(m?.media_type || "").toLowerCase() === "document" && String(m?.url || "").trim());
                  const videos = media.filter((m: any) => String(m?.media_type || "").toLowerCase() === "video" && String(m?.url || "").trim());
                  const missingFields = Array.isArray(detailData?.readiness?.missing_fields) ? detailData.readiness.missing_fields : [];
                  const variants = Array.isArray(detailData?.variations) ? detailData.variations : [];
                  const pricingTiers = Array.isArray(detailData?.pricing_tiers) ? detailData.pricing_tiers : [];
                  const trademarks = Array.isArray(detailData?.trademarks) ? detailData.trademarks : [];
                  const origin = productFull?.origin_location && typeof productFull.origin_location === "object" ? productFull.origin_location : {};
                  const requestChangesFromProduct = () => {
                    setDetailOpen(false);
                    openFeedbackModal(detailData?.product_full || detailData?.product);
                  };

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`rounded-[24px] border p-4 ${missingFields.length ? "border-amber-200/70 bg-amber-50/80" : "border-emerald-200/70 bg-emerald-50/80"}`}>
                          <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-foreground/55">
                            {missingFields.length ? <AlertTriangle size={14} className="text-amber-600" /> : <CheckCircle2 size={14} className="text-emerald-600" />}
                            Missing fields
                          </div>
                          <div className="mt-2 text-[0.9375rem] font-semibold text-foreground/85">
                            {missingFields.length ? `${missingFields.length} item${missingFields.length === 1 ? "" : "s"} need admin review` : "No missing fields flagged"}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {missingFields.length ? missingFields.map((field: string) => (
                              <span key={field} className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-white/80 border border-amber-200/80 text-amber-700">
                                {prettyFieldLabel(field)}
                              </span>
                            )) : (
                              <span className="text-[0.75rem] text-foreground/60">Admin can still review and ask seller for changes if the information looks weak or inconsistent.</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-sky-200/70 bg-sky-50/80 p-4">
                          <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-foreground/55">
                            <FileText size={14} className="text-sky-600" />
                            Compliance and docs
                          </div>
                          <div className="mt-2 text-[0.9375rem] font-semibold text-foreground/85">
                            {detailData?.readiness?.needs_compliance ? "Needs compliance review" : "Ready for admin review"}
                          </div>
                          <div className="mt-2 text-[0.75rem] text-foreground/65">
                            Legal review: {displayAdminValue(detailData?.readiness?.legal_review_status)} · Docs required: {formatNumber(detailData?.readiness?.certifications_required_count)} · Blocked destinations: {formatNumber(detailData?.readiness?.blocked_destinations_count)}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <BounceButton
                              variant="ghost"
                              size="sm"
                              icon={<Upload size={14} />}
                              onClick={requestingMedia ? undefined : requestMedia}
                              className={requestingMedia ? "opacity-70 pointer-events-none" : ""}
                            >
                              Request upload
                            </BounceButton>
                            <BounceButton variant="ghost" size="sm" icon={<Bell size={14} />} onClick={requestChangesFromProduct}>
                              Ask seller
                            </BounceButton>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-border/30 bg-[linear-gradient(135deg,rgba(1,113,227,0.08),rgba(255,255,255,0.92))] p-5 sm:p-6">
                        <div className="flex flex-col xl:flex-row gap-5 xl:items-center xl:justify-between">
                          <div className="flex gap-4 min-w-0">
                            <div className="w-24 h-24 rounded-[22px] overflow-hidden border border-white/70 bg-white/80 shadow-sm shrink-0">
                              {images[0] ? (
                                <img src={images[0]} alt={String(productFull?.name || "product")} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-muted-foreground/35">
                                  <Package size={24} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[1.1rem] sm:text-[1.25rem] font-bold text-foreground/90">
                                  {productFull?.name || detailData?.product?.name || "Untitled product"}
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-white/80 border border-white/80 text-foreground/70">
                                  {String(productFull?.status || detailData?.product?.status || "—").toUpperCase()}
                                </span>
                                {listingRequestDetail?.id && (
                                  <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-violet-50 border border-violet-200/80 text-violet-700">
                                    From listing request #{listingRequestDetail.id}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-[0.875rem] text-muted-foreground/75">
                                {detailData?.seller?.name || "—"} · {productFull?.category_name || detailData?.product?.category_name || "—"}
                              </div>
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.75rem]">
                                <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                  <div className="text-muted-foreground/55">Price</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatMoney(productFull?.currency, productFull?.price)}</div>
                                </div>
                                <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                  <div className="text-muted-foreground/55">Stock</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{formatNumber(detailData?.product?.stock_units)} units</div>
                                </div>
                                <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                  <div className="text-muted-foreground/55">Currency</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(productFull?.currency)}</div>
                                </div>
                                <div className="rounded-2xl bg-white/80 border border-white/80 px-3 py-2">
                                  <div className="text-muted-foreground/55">Vehsl rating</div>
                                  <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(productFull?.vehsl_rating)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.75rem] min-w-full xl:min-w-[360px]">
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2">
                              <div className="text-muted-foreground/55">Product ID</div>
                              <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(productFull?.id)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2">
                              <div className="text-muted-foreground/55">SKU</div>
                              <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(productFull?.sku)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2">
                              <div className="text-muted-foreground/55">HS code</div>
                              <div className="mt-1 font-semibold text-foreground/85">{displayAdminValue(productFull?.hs_code)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2">
                              <div className="text-muted-foreground/55">Images</div>
                              <div className="mt-1 font-semibold text-foreground/85">{formatNumber(images.length)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                        <div className="space-y-5 xl:sticky xl:top-0">
                          <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Review summary</div>
                            <div className="space-y-3 text-[0.8125rem]">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground/60">Seller</span>
                                <span className="text-right text-foreground/80">{displayAdminValue(detailData?.seller?.name)}</span>
                              </div>
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground/60">Email</span>
                                <span className="text-right text-foreground/80 break-all">{displayAdminValue(detailData?.seller?.email)}</span>
                              </div>
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground/60">Category</span>
                                <span className="text-right text-foreground/80">{displayAdminValue(productFull?.category_name)}</span>
                              </div>
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground/60">Fulfillment</span>
                                <span className="text-right text-foreground/80">{displayAdminValue(productFull?.fulfillment_mode)}</span>
                              </div>
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground/60">Listing request</span>
                                <span className="text-right text-foreground/80">
                                  {listingRequestDetail?.id ? `#${listingRequestDetail.id} · ${listingRequestDetail.stage}` : "None"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Inventory and quality</div>
                            <div className="grid grid-cols-1 gap-3">
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

                          <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Compliance</div>
                            <div className="text-[0.8125rem] text-foreground/80">
                              {detailData?.readiness?.needs_compliance ? "Needs compliance review" : "Looks ready"} · HS {detailData?.readiness?.missing_hs_code ? "missing" : "ok"}
                            </div>
                            <div className="mt-3 space-y-1 text-[0.75rem] text-muted-foreground/70">
                              <div>Legal review: {displayAdminValue(detailData?.readiness?.legal_review_status)}</div>
                              <div>Docs required: {formatNumber(detailData?.readiness?.certifications_required_count)}</div>
                              <div>Blocked destinations: {formatNumber(detailData?.readiness?.blocked_destinations_count)}</div>
                            </div>
                            <div className="mt-4 flex gap-2 flex-wrap">
                              {(detailData?.compliance_rules || []).slice(0, 8).map((r: any) => (
                                <span key={r.id} className="px-3 py-2 rounded-xl bg-card border border-border/30 text-[0.75rem] text-muted-foreground">
                                  {r.rule_type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="xl:col-span-2 space-y-5">
                          <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[0.75rem] font-semibold text-foreground/75">Media and files</div>
                              <div className="text-[0.75rem] text-muted-foreground/65">
                                {formatNumber(images.length)} images · {formatNumber(mediaDocs.length)} docs · {formatNumber(videos.length)} videos
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Images</div>
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {images.length ? images.map((url: string, idx: number) => (
                                  <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="group block rounded-[20px] overflow-hidden border border-border/30 bg-background/70">
                                    <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-32 object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                                    <div className="px-3 py-2 text-[0.6875rem] text-muted-foreground/70 truncate">Product image {idx + 1}</div>
                                  </a>
                                )) : mediaImages.length ? mediaImages.map((m: any) => (
                                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="group block rounded-[20px] overflow-hidden border border-border/30 bg-background/70">
                                    <img src={m.url} alt={String(m.title || "Product image")} className="w-full h-32 object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                                    <div className="px-3 py-2 text-[0.6875rem] text-muted-foreground/70 truncate">{String(m.title || "Product image")}</div>
                                  </a>
                                )) : (
                                  <div className="col-span-full rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                    No product images available.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Documents</div>
                                <div className="mt-3 space-y-2">
                                  {mediaDocs.length ? mediaDocs.map((m: any) => (
                                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border/30 bg-background/60 px-4 py-3 text-[0.8125rem] text-foreground/80 hover:border-primary/30 hover:text-primary transition-colors">
                                      <div className="font-semibold">{displayAdminValue(m?.title || m?.original_name || "Document")}</div>
                                      <div className="mt-1 text-[0.6875rem] text-muted-foreground/60">{displayAdminValue(m?.content_type || "document")}</div>
                                    </a>
                                  )) : (
                                    <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No documents uploaded.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Videos / extra media</div>
                                <div className="mt-3 space-y-2">
                                  {videos.length ? videos.map((m: any) => (
                                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border/30 bg-background/60 px-4 py-3 text-[0.8125rem] text-foreground/80 hover:border-primary/30 hover:text-primary transition-colors">
                                      <div className="font-semibold">{displayAdminValue(m?.title || "Video")}</div>
                                      <div className="mt-1 text-[0.6875rem] text-muted-foreground/60">{displayAdminValue(m?.media_type)}</div>
                                    </a>
                                  )) : (
                                    <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No extra media uploaded.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                              <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Core product info</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.8125rem]">
                                {[
                                  ["Product ID", productFull?.id],
                                  ["Category", productFull?.category_name],
                                  ["SKU", productFull?.sku],
                                  ["HS code", productFull?.hs_code],
                                  ["Status", productFull?.status],
                                  ["IP protection", productFull?.ip_protection_level],
                                  ["Sample available", productFull?.sample_available],
                                  ["Sample units", productFull?.sample_units],
                                ].map(([label, value]) => (
                                  <div key={String(label)} className="rounded-2xl bg-card border border-border/30 p-4">
                                    <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">{label}</div>
                                    <div className="text-[0.875rem] text-foreground/80">{displayAdminValue(value)}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 rounded-2xl bg-card border border-border/30 p-4">
                                <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Description</div>
                                <div className="text-[0.875rem] text-foreground/80 whitespace-pre-wrap">
                                  {displayAdminValue(productFull?.description)}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                              <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Supply, origin, and shipping</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[0.8125rem]">
                                {[
                                  ["Price", formatMoney(productFull?.currency, productFull?.price)],
                                  ["Available quantity", productFull?.quantity_available],
                                  ["Lead time (days)", productFull?.lead_time_days],
                                  ["Weight (grams)", productFull?.weight_grams],
                                  ["Ship time min", productFull?.ship_time_min_days],
                                  ["Ship time max", productFull?.ship_time_max_days],
                                  ["Stock status", productFull?.stock_status],
                                  ["Seller stock units", productFull?.seller_stock_units],
                                ].map(([label, value]) => (
                                  <div key={String(label)} className="rounded-2xl bg-card border border-border/30 p-4">
                                    <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">{label}</div>
                                    <div className="text-[0.875rem] text-foreground/80">{displayAdminValue(value)}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 rounded-2xl bg-card border border-border/30 p-4">
                                <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Origin</div>
                                <div className="text-[0.875rem] text-foreground/80">
                                  {[origin?.country, origin?.region, origin?.city].filter((item) => String(item || "").trim()).join(" · ") || "—"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {(pricingTiers.length > 0 || variants.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                                <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Quantity pricing</div>
                                {pricingTiers.length ? (
                                  <div className="overflow-hidden rounded-2xl border border-border/30">
                                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-card text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">
                                      <div className="col-span-3">Min qty</div>
                                      <div className="col-span-3">Max qty</div>
                                      <div className="col-span-3">Unit price</div>
                                      <div className="col-span-3">Variation</div>
                                    </div>
                                    <div className="divide-y divide-border/20 bg-background/50">
                                      {pricingTiers.map((tier: any, idx: number) => (
                                        <div key={`${tier?.id ?? idx}-${idx}`} className="grid grid-cols-12 gap-3 px-4 py-3 text-[0.8125rem] text-foreground/80">
                                          <div className="col-span-3">{displayAdminValue(tier?.min_quantity)}</div>
                                          <div className="col-span-3">{displayAdminValue(tier?.max_quantity)}</div>
                                          <div className="col-span-3">{formatMoney(tier?.currency || productFull?.currency, tier?.unit_price)}</div>
                                          <div className="col-span-3">{displayAdminValue(tier?.variation)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                    No quantity pricing configured.
                                  </div>
                                )}
                              </div>

                              <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                                <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Variants</div>
                                {variants.length ? (
                                  <div className="space-y-3">
                                    {variants.map((variant: any) => (
                                      <div key={variant.id} className="rounded-2xl bg-card border border-border/30 p-4">
                                        <div className="text-[0.8125rem] font-semibold text-foreground/85">SKU: {displayAdminValue(variant?.sku)}</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {Object.entries(variant?.attributes || {}).map(([key, value]) => (
                                            <span key={`${key}-${value}`} className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-muted/20 border border-border/30 text-foreground/70">
                                              {prettyFieldLabel(key)}: {displayAdminValue(value)}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                    No variants configured.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {(specifications.length > 0 || trademarks.length > 0 || detailData?.warehouse_stocks?.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                                <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Specifications</div>
                                {specifications.length ? (
                                  <div className="space-y-3">
                                    {specifications.map((group: any, idx: number) => (
                                      <div key={`${group?.title ?? idx}-${idx}`} className="rounded-2xl bg-card border border-border/30 p-4">
                                        <div className="text-[0.8125rem] font-semibold text-foreground/85">{displayAdminValue(group?.title || group?.group || `Group ${idx + 1}`)}</div>
                                        <div className="mt-2 space-y-1">
                                          {(Array.isArray(group?.items) ? group.items : []).map((item: any, itemIdx: number) => (
                                            <div key={`${item?.label ?? itemIdx}-${itemIdx}`} className="flex items-start justify-between gap-3 text-[0.75rem]">
                                              <span className="text-muted-foreground/65">{displayAdminValue(item?.label)}</span>
                                              <span className="text-right text-foreground/80">{displayAdminValue(item?.value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                    No specifications available.
                                  </div>
                                )}
                              </div>

                              <div className="space-y-5">
                                <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                                  <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Trademarks</div>
                                  {trademarks.length ? (
                                    <div className="space-y-3">
                                      {trademarks.map((tm: any) => (
                                        <div key={tm.id} className="rounded-2xl bg-card border border-border/30 p-4">
                                          <div className="text-[0.8125rem] font-semibold text-foreground/85">{displayAdminValue(tm?.registration_number)}</div>
                                          <div className="mt-1 text-[0.75rem] text-muted-foreground/65">Status: {displayAdminValue(tm?.status)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No trademark records linked.
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                                  <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Warehouse stock</div>
                                  {detailData?.warehouse_stocks?.length ? (
                                    <div className="space-y-3">
                                      {detailData.warehouse_stocks.slice(0, 10).map((stock: any) => (
                                        <div key={stock.id} className="rounded-2xl bg-card border border-border/30 p-4 text-[0.8125rem]">
                                          <div className="font-semibold text-foreground/85">{displayAdminValue(stock?.warehouse_name || stock?.warehouse)}</div>
                                          <div className="mt-1 text-muted-foreground/65">
                                            Qty: {displayAdminValue(stock?.quantity_units)} · Reserved: {displayAdminValue(stock?.reserved_units)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-border/40 bg-background/40 p-4 text-[0.8125rem] text-muted-foreground/65">
                                      No warehouse stock rows available.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {listingRequestDetail && (
                            <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[0.75rem] font-semibold text-foreground/75">Source listing request</div>
                                  <div className="mt-1 text-[0.75rem] text-muted-foreground/60">
                                    This lets admin compare the live product with the original seller submission.
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-card border border-border/30 text-foreground/70">
                                  #{listingRequestDetail.id} · {displayAdminValue(listingRequestDetail.stage)}
                                </span>
                              </div>
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                  ["Request product", listingRequestDetail?.product_name],
                                  ["Company", listingRequestDetail?.company_name],
                                  ["MOQ", listingRequestDetail?.moq],
                                  ["Request price", formatMoney(listingRequestDetail?.currency, listingRequestDetail?.unit_price)],
                                ].map(([label, value]) => (
                                  <div key={String(label)} className="rounded-2xl bg-card border border-border/30 p-4">
                                    <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">{label}</div>
                                    <div className="text-[0.875rem] text-foreground/80">{displayAdminValue(value)}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl bg-card border border-border/30 p-4">
                                  <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Request images</div>
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {(listingRequestDetail?.photos || [])
                                      .filter((p: any) => String(p?.content_type || "").toLowerCase().startsWith("image/"))
                                      .slice(0, 6)
                                      .map((p: any) => (
                                        <a key={p.id} href={p.file_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border/30">
                                          <img src={p.file_url} alt={String(p.original_name || "request image")} className="w-full h-24 object-cover" />
                                        </a>
                                      ))}
                                  </div>
                                </div>
                                <div className="rounded-2xl bg-card border border-border/30 p-4">
                                  <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Request missing fields</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Array.isArray(listingRequestDetail?.missing_fields) && listingRequestDetail.missing_fields.length ? listingRequestDetail.missing_fields.map((field: string) => (
                                      <span key={field} className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-amber-50 border border-amber-200/80 text-amber-700">
                                        {prettyFieldLabel(field)}
                                      </span>
                                    )) : (
                                      <span className="text-[0.8125rem] text-muted-foreground/60">None</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <div className="text-[0.75rem] font-semibold text-foreground/75 mb-3">Recent orders</div>
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

                          <details className="rounded-[24px] bg-muted/10 border border-border/20 p-5">
                            <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[0.75rem] font-semibold text-foreground/75">Raw data fallback</div>
                                <div className="mt-1 text-[0.75rem] text-muted-foreground/60">Open if admin needs the exact API payload for investigation.</div>
                              </div>
                              <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/55">Expand</div>
                            </summary>
                            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                              <div className="rounded-2xl bg-card border border-border/30 p-4">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Product detail payload</div>
                                <pre className="mt-2 text-[11px] leading-[1.45] text-foreground/80 whitespace-pre-wrap break-words">{JSON.stringify(detailData, null, 2)}</pre>
                              </div>
                              <div className="rounded-2xl bg-card border border-border/30 p-4">
                                <div className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/60">Serialized product</div>
                                <pre className="mt-2 text-[11px] leading-[1.45] text-foreground/80 whitespace-pre-wrap break-words">{JSON.stringify(productFull, null, 2)}</pre>
                              </div>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  );
                })()
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
  const navigate = useNavigate();
  const fetchJson = fetchJsonAuthed;

  const [stats, setStats] = useState<any>(null);
  const [flow, setFlow] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [days, setDays] = useState<number>(7);
  const [fleetStatus, setFleetStatus] = useState<string>("all");
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipQ, setShipQ] = useState<string>("");
  const [shipSeller, setShipSeller] = useState<string>("");
  const [shipBuyer, setShipBuyer] = useState<string>("");
  const [shipRoute, setShipRoute] = useState<string>("");
  const [shipStatus, setShipStatus] = useState<string>("all");
  const [trackingFilter, setTrackingFilter] = useState<"all" | "has" | "missing">("all");
  const [lateOnly, setLateOnly] = useState<boolean>(false);
  const [deliveredOnly, setDeliveredOnly] = useState<boolean>(false);
  const [shipPage, setShipPage] = useState<number>(1);
  const [shipTotalPages, setShipTotalPages] = useState<number>(1);
  const [shipCount, setShipCount] = useState<number>(0);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentDetail, setShipmentDetail] = useState<any>(null);
  const [flowMode, setFlowMode] = useState<"outgoing" | "incoming" | "late">("outgoing");
  const [shipActionSaving, setShipActionSaving] = useState(false);
  const [editTracking, setEditTracking] = useState("");
  const [editCarrier, setEditCarrier] = useState("");
  const [editEta, setEditEta] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const copyToClipboard = useCallback(async (text: string, successMsg: string) => {
    const t = (text || "").toString();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      setSuccess(successMsg);
      window.setTimeout(() => setSuccess(""), 2000);
    } catch {
      try {
        window.prompt("Copy to clipboard:", t);
      } catch {}
    }
  }, []);

  const syncUrl = useCallback(
    (next?: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(location.search || "");
      const setOrDel = (k: string, v: string) => {
        if (v) params.set(k, v);
        else params.delete(k);
      };

      setOrDel("status", shipStatus !== "all" ? shipStatus : "");
      setOrDel("q", shipQ.trim());
      setOrDel("seller", shipSeller.trim());
      setOrDel("buyer", shipBuyer.trim());
      setOrDel("route", shipRoute.trim());
      setOrDel("has_tracking", trackingFilter === "has" ? "1" : trackingFilter === "missing" ? "0" : "");
      setOrDel("late_only", lateOnly ? "1" : "");
      setOrDel("delivered_only", deliveredOnly ? "1" : "");
      setOrDel("page", shipPage && shipPage !== 1 ? String(shipPage) : "");

      for (const [k, v] of Object.entries(next || {})) {
        setOrDel(k, v);
      }

      navigate({ search: `?${params.toString()}` }, { replace: true });
    },
    [location.search, navigate, shipBuyer, shipPage, shipQ, shipRoute, shipSeller, shipStatus, trackingFilter, lateOnly, deliveredOnly]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const statusIn = (params.get("status") || "").trim();
    const qIn = params.get("q");
    const sellerIn = params.get("seller");
    const buyerIn = params.get("buyer");
    const routeIn = params.get("route");
    const trackingIn = (params.get("has_tracking") || "").trim();
    const lateIn = (params.get("late_only") || "").trim();
    const deliveredIn = (params.get("delivered_only") || "").trim();
    const pageIn = Number(params.get("page") || "1");
    if (qIn != null) setShipQ(qIn);
    if (sellerIn != null) setShipSeller(sellerIn);
    if (buyerIn != null) setShipBuyer(buyerIn);
    if (routeIn != null) setShipRoute(routeIn);
    if (statusIn) setShipStatus(statusIn);
    else setShipStatus("all");
    if (trackingIn === "1") setTrackingFilter("has");
    else if (trackingIn === "0") setTrackingFilter("missing");
    else setTrackingFilter("all");
    setLateOnly(lateIn === "1" || lateIn === "true" || lateIn === "yes");
    setDeliveredOnly(deliveredIn === "1" || deliveredIn === "true" || deliveredIn === "yes");
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
    setSuccess("");
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
        if (shipSeller.trim()) shipParams.set("seller", shipSeller.trim());
        if (shipBuyer.trim()) shipParams.set("buyer", shipBuyer.trim());
        if (shipRoute.trim()) shipParams.set("route", shipRoute.trim());
        if (shipStatus && shipStatus !== "all") shipParams.set("status", shipStatus);
        if (trackingFilter === "has") shipParams.set("has_tracking", "1");
        if (trackingFilter === "missing") shipParams.set("has_tracking", "0");
        if (lateOnly) shipParams.set("late_only", "1");
        if (deliveredOnly) shipParams.set("delivered_only", "1");

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
  }, [days, fleetStatus, shipPage, shipQ, shipSeller, shipBuyer, shipRoute, shipStatus, trackingFilter, lateOnly, deliveredOnly, refreshNonce]);

  const openShipment = async (shipmentId: number) => {
    if (!shipmentId) return;
    setShipmentOpen(true);
    setShipmentLoading(true);
    setShipmentDetail(null);
    try {
      const d = await fetchJson(`/api/v1/admin/logistics/shipment-detail/?id=${shipmentId}`);
      setShipmentDetail(d);
      const sh = d?.shipment || {};
      setEditTracking((sh?.tracking_number || "").toString());
      setEditCarrier((sh?.carrier_id || "").toString());
      setEditStatus((sh?.status || "").toString());
      const etaIso = (sh?.estimated_delivery_at || "").toString();
      if (etaIso) {
        const dt = new Date(etaIso);
        const pad = (n: number) => String(n).padStart(2, "0");
        if (!isNaN(dt.getTime())) {
          const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
          setEditEta(local);
        } else {
          setEditEta("");
        }
      } else {
        setEditEta("");
      }
    } catch (e: any) {
      setShipmentDetail(null);
      setError(e?.message || "Failed to load shipment.");
      setShipmentOpen(false);
    } finally {
      setShipmentLoading(false);
    }
  };

  const refreshAfterShipmentAction = async (shipmentId: number) => {
    setRefreshNonce((n) => n + 1);
    await openShipment(shipmentId);
  };

  const setShipmentTracking = async () => {
    const shipmentId = Number(shipmentDetail?.shipment?.id || 0);
    if (!shipmentId) return;
    const tracking_number = (editTracking || "").trim();
    const carrier_id = (editCarrier || "").trim();
    if (!tracking_number && !carrier_id) {
      setError("Enter a tracking number or carrier id.");
      return;
    }
    setShipActionSaving(true);
    try {
      setError("");
      await fetchJson("/api/v1/admin/logistics/shipments/set-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment_id: shipmentId, tracking_number, carrier_id }),
      });
      setSuccess("Tracking updated.");
      window.setTimeout(() => setSuccess(""), 2000);
      await refreshAfterShipmentAction(shipmentId);
    } catch (e: any) {
      setError(e?.message || "Failed to update tracking.");
    } finally {
      setShipActionSaving(false);
    }
  };

  const setShipmentStatus = async () => {
    const shipmentId = Number(shipmentDetail?.shipment?.id || 0);
    if (!shipmentId) return;
    const statusVal = (editStatus || "").trim();
    if (!statusVal) {
      setError("Select a status.");
      return;
    }
    setShipActionSaving(true);
    try {
      setError("");
      await fetchJson("/api/v1/admin/logistics/shipments/set-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment_id: shipmentId, status: statusVal }),
      });
      setSuccess("Status updated.");
      window.setTimeout(() => setSuccess(""), 2000);
      await refreshAfterShipmentAction(shipmentId);
    } catch (e: any) {
      setError(e?.message || "Failed to update status.");
    } finally {
      setShipActionSaving(false);
    }
  };

  const setShipmentEta = async () => {
    const shipmentId = Number(shipmentDetail?.shipment?.id || 0);
    if (!shipmentId) return;
    const raw = (editEta || "").trim();
    if (!raw) {
      setError("Select an ETA.");
      return;
    }
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) {
      setError("Invalid ETA.");
      return;
    }
    setShipActionSaving(true);
    try {
      setError("");
      await fetchJson("/api/v1/admin/logistics/shipments/set-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment_id: shipmentId, estimated_delivery_at: dt.toISOString() }),
      });
      setSuccess("ETA updated.");
      window.setTimeout(() => setSuccess(""), 2000);
      await refreshAfterShipmentAction(shipmentId);
    } catch (e: any) {
      setError(e?.message || "Failed to set ETA.");
    } finally {
      setShipActionSaving(false);
    }
  };

  const markShipmentDelivered = async () => {
    const shipmentId = Number(shipmentDetail?.shipment?.id || 0);
    if (!shipmentId) return;
    setShipActionSaving(true);
    try {
      setError("");
      await fetchJson("/api/v1/admin/logistics/shipments/mark-delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment_id: shipmentId }),
      });
      setSuccess("Marked delivered.");
      window.setTimeout(() => setSuccess(""), 2000);
      await refreshAfterShipmentAction(shipmentId);
    } catch (e: any) {
      setError(e?.message || "Failed to mark delivered.");
    } finally {
      setShipActionSaving(false);
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
      {success && (
        <motion.div variants={stagger.item} className="px-4 py-3 rounded-2xl bg-[#30A46C]/8 text-[#1f7a4a] text-[0.8125rem]">
          {success}
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
              <p className="text-muted-foreground/50 text-[0.75rem]">
                {flowMode === "outgoing" ? "Created shipments" : flowMode === "incoming" ? "Delivered shipments" : "Late shipments"}
              </p>
            </div>
            <select
              value={flowMode}
              onChange={(e) => setFlowMode(e.target.value as any)}
              className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
            >
              <option value="outgoing">Created</option>
              <option value="incoming">Delivered</option>
              <option value="late">Late</option>
            </select>
          </div>
          <CustomAreaChart
            data={flow}
            xKey="month"
            series={
              flowMode === "incoming"
                ? [{ dataKey: "incoming", color: "#3B82F6", label: "Delivered" }]
                : flowMode === "late"
                  ? [{ dataKey: "late", color: "#E5484D", label: "Late" }]
                  : [{ dataKey: "outgoing", color: "#30A46C", label: "Created" }]
            }
            height={200}
          />
        </SectionCard>
      </motion.div>

      {/* Fleet */}
      <motion.div variants={stagger.item}>
        <SectionCard>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-foreground text-[0.9375rem]">Shipment Watchlist</h2>
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
                No shipments to watch yet.
              </div>
            )}
            {fleet.map((v, i) => (
              <motion.div key={v.shipment_id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => openShipment(Number(v.shipment_id || 0))}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${vehicleStatusColor[v.status]}10` }}>
                  <Truck size={18} style={{ color: vehicleStatusColor[v.status] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground/90 truncate">
                      SH-{v.shipment_id} · ORD-{v.order_id || "—"}
                    </span>
                    <span className="text-[0.6875rem] text-muted-foreground/40 truncate">
                      {v.tracking_number || v.carrier_id || "No tracking"}
                    </span>
                  </div>
                  <div className="text-[0.75rem] text-muted-foreground/55 truncate">
                    {(v.seller?.label || "—")} → {(v.buyer?.label || "—")}
                  </div>
                  <div className="text-[0.75rem] text-muted-foreground/45 truncate">
                    {(v.origin || "—")} → {(v.destination || "—")}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground/50">
                    <MapPin size={12} />{v.last_location || "—"}
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
                    syncUrl({ q: e.target.value, page: "" });
                  }}
                  placeholder="Search tracking, order, email…"
                  className="pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[260px]"
                />
              </div>
              <input
                value={shipSeller}
                onChange={(e) => {
                  setShipSeller(e.target.value);
                  setShipPage(1);
                  syncUrl({ seller: e.target.value, page: "" });
                }}
                placeholder="Seller (id/email/name)"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[220px]"
              />
              <input
                value={shipBuyer}
                onChange={(e) => {
                  setShipBuyer(e.target.value);
                  setShipPage(1);
                  syncUrl({ buyer: e.target.value, page: "" });
                }}
                placeholder="Buyer (id/email/name)"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[220px]"
              />
              <input
                value={shipRoute}
                onChange={(e) => {
                  setShipRoute(e.target.value);
                  setShipPage(1);
                  syncUrl({ route: e.target.value, page: "" });
                }}
                placeholder="Route (origin/dest)"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[200px]"
              />
              <select
                value={shipStatus}
                onChange={(e) => {
                  setShipStatus(e.target.value);
                  setShipPage(1);
                  syncUrl({ status: e.target.value === "all" ? "" : e.target.value, page: "" });
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
              <select
                value={trackingFilter}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setTrackingFilter(v);
                  setShipPage(1);
                  syncUrl({ has_tracking: v === "has" ? "1" : v === "missing" ? "0" : "", page: "" });
                }}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">Tracking: all</option>
                <option value="has">Has tracking</option>
                <option value="missing">Missing tracking</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const next = !lateOnly;
                  setLateOnly(next);
                  setShipPage(1);
                  syncUrl({ late_only: next ? "1" : "", page: "" });
                }}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  lateOnly ? "bg-[#E5484D]/10 text-[#E5484D]/80" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Late only
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !deliveredOnly;
                  setDeliveredOnly(next);
                  setShipPage(1);
                  syncUrl({ delivered_only: next ? "1" : "", page: "" });
                }}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  deliveredOnly ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Delivered only
              </button>
            </div>
          </div>

          {shipLoading && (
            <div className="px-5 py-4 rounded-2xl bg-muted/10 text-[0.8125rem] text-muted-foreground/60">
              Loading shipments…
            </div>
          )}

          {!shipLoading && shipments.length === 0 && (
            <div className="px-5 py-10 rounded-2xl bg-muted/10 text-center text-[0.8125rem] text-muted-foreground/60">
              <div>No shipments found.</div>
              <div className="mt-3 flex items-center justify-center">
                <BounceButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/management/orders")}
                >
                  Open orders
                </BounceButton>
              </div>
            </div>
          )}

          {!shipLoading && shipments.length > 0 && (
            <div className="space-y-2">
              {trackingFilter === "all" &&
                shipments.length > 0 &&
                shipments.every((s: any) => !String(s?.tracking_number || s?.carrier_id || "").trim()) && (
                  <div className="px-5 py-4 rounded-2xl bg-[#FFB224]/8 border border-[#FFB224]/15 text-[0.8125rem] text-foreground/70 flex items-center justify-between gap-3">
                    <span>No tracking numbers found. Connect carrier integration or enter tracking.</span>
                    <BounceButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTrackingFilter("missing");
                        setShipPage(1);
                        syncUrl({ has_tracking: "0", page: "" });
                      }}
                    >
                      Show missing
                    </BounceButton>
                  </div>
                )}
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
                      <button
                        type="button"
                        className="text-[0.6875rem] text-muted-foreground/55 hover:text-foreground truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          const oid = s.order_id || "";
                          if (!oid) return;
                          navigate(`/management/orders?q=${encodeURIComponent(`ORD-${oid}`)}`);
                        }}
                        title="Open order"
                      >
                        ORD-{s.order_id || "—"}
                      </button>
                      <span className="text-[0.6875rem] text-muted-foreground/40 truncate" title={s.tracking_number || s.carrier_id || ""}>
                        {s.tracking_number || s.carrier_id || "—"}
                      </span>
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground/50 truncate">
                      {s.origin || "—"} → {s.destination || "—"} ·{" "}
                      <button
                        type="button"
                        className="hover:text-foreground"
                        title={s?.seller_contact?.email || s?.seller_contact?.phone || ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          const key = s?.seller_contact?.email || s?.seller_contact?.phone || s?.seller || "";
                          if (!key) return;
                          navigate(`/users?q=${encodeURIComponent(key)}`);
                        }}
                      >
                        {s.seller || "—"}
                      </button>{" "}
                      {!!(s?.seller_contact?.email || s?.seller_contact?.phone) && (
                        <span className="text-[0.6875rem] text-muted-foreground/40" title={s?.seller_contact?.email || s?.seller_contact?.phone || ""}>
                          ({s?.seller_contact?.phone || s?.seller_contact?.email})
                        </span>
                      )}{" "}
                      →{" "}
                      <button
                        type="button"
                        className="hover:text-foreground"
                        title={s?.buyer_contact?.email || s?.buyer_contact?.phone || ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          const key = s?.buyer_contact?.email || s?.buyer_contact?.phone || s?.buyer || "";
                          if (!key) return;
                          navigate(`/users?q=${encodeURIComponent(key)}`);
                        }}
                      >
                        {s.buyer || "—"}
                      </button>
                      {!!(s?.buyer_contact?.email || s?.buyer_contact?.phone) && (
                        <span className="text-[0.6875rem] text-muted-foreground/40" title={s?.buyer_contact?.email || s?.buyer_contact?.phone || ""}>
                          ({s?.buyer_contact?.phone || s?.buyer_contact?.email})
                        </span>
                      )}
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
              <BounceButton
                variant="ghost"
                size="sm"
                onClick={
                  shipPage <= 1
                    ? undefined
                    : () => {
                        const next = Math.max(1, shipPage - 1);
                        setShipPage(next);
                        syncUrl({ page: next === 1 ? "" : String(next) });
                      }
                }
                className={shipPage <= 1 ? "opacity-60 pointer-events-none" : ""}
              >
                Prev
              </BounceButton>
              <BounceButton
                variant="ghost"
                size="sm"
                onClick={
                  shipPage >= shipTotalPages
                    ? undefined
                    : () => {
                        const next = shipPage + 1;
                        setShipPage(next);
                        syncUrl({ page: String(next) });
                      }
                }
                className={shipPage >= shipTotalPages ? "opacity-60 pointer-events-none" : ""}
              >
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
                    <button
                      type="button"
                      className="hover:text-foreground"
                      onClick={() => {
                        const oid = shipmentDetail?.shipment?.order_id;
                        if (!oid) return;
                        navigate(`/management/orders?q=${encodeURIComponent(`ORD-${oid}`)}`);
                      }}
                      title="Open order"
                    >
                      ORD-{shipmentDetail?.shipment?.order_id || "—"}
                    </button>{" "}
                    · {shipmentDetail?.shipment?.status || "—"}
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[0.875rem] text-foreground/80 truncate">
                          {shipmentDetail?.shipment?.tracking_number || shipmentDetail?.shipment?.carrier_id || "—"}
                        </div>
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/60"
                          onClick={() => void copyToClipboard(String(shipmentDetail?.shipment?.tracking_number || shipmentDetail?.shipment?.carrier_id || ""), "Copied tracking.")}
                          disabled={!(shipmentDetail?.shipment?.tracking_number || shipmentDetail?.shipment?.carrier_id)}
                          title="Copy tracking"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Route</div>
                      <div className="text-[0.875rem] text-foreground/80">{shipmentDetail?.shipment?.origin || "—"} → {shipmentDetail?.shipment?.destination || "—"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Buyer / Seller</div>
                      <div className="text-[0.875rem] text-foreground/80 truncate">
                        <button
                          type="button"
                          className="hover:text-foreground"
                          title={shipmentDetail?.buyer?.email || shipmentDetail?.buyer?.phone || ""}
                          onClick={() => {
                            const key = shipmentDetail?.buyer?.email || shipmentDetail?.buyer?.phone || "";
                            if (!key) return;
                            navigate(`/users?q=${encodeURIComponent(key)}`);
                          }}
                        >
                          {shipmentDetail?.buyer?.label || "—"}
                        </button>{" "}
                        ·{" "}
                        <button
                          type="button"
                          className="hover:text-foreground"
                          title={shipmentDetail?.seller?.email || shipmentDetail?.seller?.phone || ""}
                          onClick={() => {
                            const key = shipmentDetail?.seller?.email || shipmentDetail?.seller?.phone || "";
                            if (!key) return;
                            navigate(`/users?q=${encodeURIComponent(key)}`);
                          }}
                        >
                          {shipmentDetail?.seller?.label || "—"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="text-[0.75rem] text-muted-foreground/60">Actions</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/30 text-[0.75rem] text-muted-foreground/80 flex items-center gap-2"
                          onClick={() => void copyToClipboard(String(shipmentDetail?.shipment?.id || ""), "Copied shipment id.")}
                          disabled={!shipmentDetail?.shipment?.id}
                          title="Copy shipment id"
                        >
                          <Hash size={14} />
                          SH
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/30 text-[0.75rem] text-muted-foreground/80 flex items-center gap-2"
                          onClick={() => void copyToClipboard(String(shipmentDetail?.shipment?.order_id || ""), "Copied order id.")}
                          disabled={!shipmentDetail?.shipment?.order_id}
                          title="Copy order id"
                        >
                          <Hash size={14} />
                          ORD
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-card border border-border/30 p-4">
                        <div className="text-[0.6875rem] text-muted-foreground/50 mb-2">Tracking</div>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            value={editTracking}
                            onChange={(e) => setEditTracking(e.target.value)}
                            placeholder="Tracking #"
                            className="px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                          />
                          <input
                            value={editCarrier}
                            onChange={(e) => setEditCarrier(e.target.value)}
                            placeholder="Carrier id (optional)"
                            className="px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                          />
                          <BounceButton variant="primary" size="sm" onClick={shipActionSaving ? undefined : setShipmentTracking} className={shipActionSaving ? "opacity-60 pointer-events-none" : ""}>
                            Set tracking #
                          </BounceButton>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-card border border-border/30 p-4">
                        <div className="text-[0.6875rem] text-muted-foreground/50 mb-2">Status</div>
                        <div className="grid grid-cols-1 gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                          >
                            <option value="label_created">Label created</option>
                            <option value="picked_up">Picked up</option>
                            <option value="in_transit">In transit</option>
                            <option value="customs">Customs</option>
                            <option value="out_for_delivery">Out for delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <BounceButton variant="ghost" size="sm" onClick={shipActionSaving ? undefined : setShipmentStatus} className={shipActionSaving ? "opacity-60 pointer-events-none" : ""}>
                              Update status
                            </BounceButton>
                            <BounceButton
                              variant="primary"
                              size="sm"
                              onClick={shipActionSaving ? undefined : markShipmentDelivered}
                              className={shipActionSaving ? "opacity-60 pointer-events-none" : ""}
                            >
                              Mark delivered
                            </BounceButton>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-card border border-border/30 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-2">ETA</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="datetime-local"
                          value={editEta}
                          onChange={(e) => setEditEta(e.target.value)}
                          className="px-4 py-3 rounded-2xl bg-muted/20 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all flex-1"
                        />
                        <BounceButton variant="ghost" size="sm" onClick={shipActionSaving ? undefined : setShipmentEta} className={shipActionSaving ? "opacity-60 pointer-events-none" : ""}>
                          Set ETA
                        </BounceButton>
                      </div>
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
  const navigate = useNavigate();
  const fetchJson = fetchJsonAuthed;

  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [dist, setDist] = useState<any>(null);
  const [trendMetric, setTrendMetric] = useState<"avg_score" | "count" | "pass_rate">("avg_score");
  const [distMode, setDistMode] = useState<"percent" | "count">("percent");
  const [days, setDays] = useState<number>(30);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [q, setQ] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sellerId, setSellerId] = useState<string>("");
  const [inspectorId, setInspectorId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [scoreMin, setScoreMin] = useState<string>("");
  const [scoreMax, setScoreMax] = useState<string>("");
  const [inspectedFrom, setInspectedFrom] = useState<string>("");
  const [inspectedTo, setInspectedTo] = useState<string>("");
  const [failedOnly, setFailedOnly] = useState<boolean>(false);
  const [pendingOnly, setPendingOnly] = useState<boolean>(false);
  const [unassignedInspector, setUnassignedInspector] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [inspections, setInspections] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionDetail, setInspectionDetail] = useState<any>(null);
  const [inspectionAudit, setInspectionAudit] = useState<any[]>([]);
  const [editScore, setEditScore] = useState<string>("");
  const [editInspectorId, setEditInspectorId] = useState<string>("");
  const [assignInspectorQuery, setAssignInspectorQuery] = useState<string>("");
  const [assignInspectorResults, setAssignInspectorResults] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string>("");
  const [createForm, setCreateForm] = useState<any>({
    product_id: "",
    seller_id: "",
    inspector_id: "",
    inspector_name: "",
    status: "in_progress",
    score: "",
    inspected_at: "",
  });
  const [createProductQuery, setCreateProductQuery] = useState<string>("");
  const [createProductResults, setCreateProductResults] = useState<any[]>([]);
  const [createSellerQuery, setCreateSellerQuery] = useState<string>("");
  const [createSellerResults, setCreateSellerResults] = useState<any[]>([]);
  const [createInspectorQuery, setCreateInspectorQuery] = useState<string>("");
  const [createInspectorResults, setCreateInspectorResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const copyToClipboard = useCallback(async (text: string, successMsg: string) => {
    const t = (text || "").toString();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      setSuccess(successMsg);
      window.setTimeout(() => setSuccess(""), 2000);
    } catch {
      try {
        window.prompt("Copy to clipboard:", t);
      } catch {}
    }
  }, []);

  const syncUrl = useCallback(
    (next?: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(location.search || "");
      const setOrDel = (k: string, v: string) => {
        if (v) params.set(k, v);
        else params.delete(k);
      };

      setOrDel("days", days && days !== 30 ? String(days) : "");
      setOrDel("q", q.trim());
      setOrDel("status", statusFilter && statusFilter !== "all" ? statusFilter : "");
      setOrDel("seller_id", sellerId.trim());
      setOrDel("inspector_id", inspectorId.trim());
      setOrDel("product_id", productId.trim());
      setOrDel("sku", sku.trim());
      setOrDel("score_min", scoreMin.trim());
      setOrDel("score_max", scoreMax.trim());
      setOrDel("inspected_from", inspectedFrom.trim());
      setOrDel("inspected_to", inspectedTo.trim());
      setOrDel("failed_only", failedOnly ? "1" : "");
      setOrDel("pending_only", pendingOnly ? "1" : "");
      setOrDel("unassigned_inspector", unassignedInspector ? "1" : "");
      setOrDel("page", page && page !== 1 ? String(page) : "");

      for (const [k, v] of Object.entries(next || {})) {
        setOrDel(k, v);
      }

      navigate({ search: `?${params.toString()}` }, { replace: true });
    },
    [
      location.search,
      navigate,
      days,
      q,
      statusFilter,
      sellerId,
      inspectorId,
      productId,
      sku,
      scoreMin,
      scoreMax,
      inspectedFrom,
      inspectedTo,
      failedOnly,
      pendingOnly,
      unassignedInspector,
      page,
    ]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const statusIn = (params.get("status") || "").trim();
    const qIn = params.get("q");
    const daysIn = Number(params.get("days") || "");
    const pageIn = Number(params.get("page") || "1");
    const sellerIdIn = params.get("seller_id");
    const inspectorIdIn = params.get("inspector_id");
    const productIdIn = params.get("product_id");
    const skuIn = params.get("sku");
    const scoreMinIn = params.get("score_min");
    const scoreMaxIn = params.get("score_max");
    const inspectedFromIn = params.get("inspected_from");
    const inspectedToIn = params.get("inspected_to");
    const failedOnlyIn = (params.get("failed_only") || "").trim().toLowerCase();
    const pendingOnlyIn = (params.get("pending_only") || "").trim().toLowerCase();
    const unassignedIn = (params.get("unassigned_inspector") || "").trim().toLowerCase();
    if (qIn != null) setQ(qIn);
    if (statusIn) setStatusFilter(statusIn);
    else setStatusFilter("all");
    if (Number.isFinite(daysIn) && daysIn >= 2) setDays(Math.floor(daysIn));
    if (Number.isFinite(pageIn) && pageIn >= 1) setPage(Math.floor(pageIn));
    if (sellerIdIn != null) setSellerId(sellerIdIn);
    if (inspectorIdIn != null) setInspectorId(inspectorIdIn);
    if (productIdIn != null) setProductId(productIdIn);
    if (skuIn != null) setSku(skuIn);
    if (scoreMinIn != null) setScoreMin(scoreMinIn);
    if (scoreMaxIn != null) setScoreMax(scoreMaxIn);
    if (inspectedFromIn != null) setInspectedFrom(inspectedFromIn);
    if (inspectedToIn != null) setInspectedTo(inspectedToIn);
    setFailedOnly(failedOnlyIn === "1" || failedOnlyIn === "true" || failedOnlyIn === "yes");
    setPendingOnly(pendingOnlyIn === "1" || pendingOnlyIn === "true" || pendingOnlyIn === "yes");
    setUnassignedInspector(unassignedIn === "1" || unassignedIn === "true" || unassignedIn === "yes");
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

  const trendKey = useMemo(() => {
    if (trendMetric === "count") return "count";
    if (trendMetric === "pass_rate") return "pass_rate";
    return "score";
  }, [trendMetric]);

  const trendLabel = useMemo(() => {
    if (trendMetric === "count") return "Inspections Trend";
    if (trendMetric === "pass_rate") return "Pass Rate Trend";
    return "Quality Score Trend";
  }, [trendMetric]);

  const trendSubtitle = useMemo(() => {
    if (trendMetric === "count") return "Inspections created over time";
    if (trendMetric === "pass_rate") return "Pass rate over time";
    return "Average inspection score over time";
  }, [trendMetric]);

  const trendHasData = useMemo(() => {
    if (!Array.isArray(trend) || trend.length === 0) return false;
    if (trendMetric === "count") return trend.some((r) => Number(r?.count || 0) > 0);
    return trend.some((r) => Number(r?.completed || 0) > 0);
  }, [trend, trendMetric]);

  const trendYDomain = useMemo(() => {
    if (!Array.isArray(trend) || trend.length === 0) return undefined;
    if (trendMetric === "count") return undefined;
    const vals = trend
      .filter((r) => Number(r?.completed || 0) > 0)
      .map((r) => Number(r?.[trendKey] || 0))
      .filter((v) => Number.isFinite(v));
    if (vals.length === 0) return undefined;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(3, Math.round((max - min) * 0.2));
    const lo = Math.max(0, Math.floor(min - pad));
    const hi = Math.min(100, Math.ceil(max + pad));
    if (hi <= lo) return [Math.max(0, lo - 1), Math.min(100, hi + 1)] as [number, number];
    return [lo, hi] as [number, number];
  }, [trend, trendKey, trendMetric]);

  const trendYFormatter = useMemo(() => {
    if (trendMetric === "count") return (v: number) => Number(v || 0).toLocaleString();
    if (trendMetric === "pass_rate") return (v: number) => `${Math.round(Number(v || 0))}%`;
    return (v: number) => String(Math.round(Number(v || 0)));
  }, [trendMetric]);

  const formatDate = (iso: any) => {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  const formatDateTime = (iso: any) => {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const openInspection = async (id: number) => {
    if (!id) return;
    setInspectionOpen(true);
    setInspectionLoading(true);
    setInspectionDetail(null);
    setInspectionAudit([]);
    try {
      const [data, auditResp] = await Promise.all([
        fetchJson(`/api/v1/admin/quality/${id}/`),
        fetchJson(`/api/v1/admin/quality/${id}/audit/?limit=15`).catch(() => null),
      ]);
      setInspectionDetail(data);
      setEditScore(data?.score != null ? String(data.score) : "");
      setEditInspectorId(data?.inspector_id != null ? String(data.inspector_id) : "");
      setAssignInspectorQuery("");
      setAssignInspectorResults([]);
      const rows = Array.isArray(auditResp?.results) ? auditResp.results : [];
      setInspectionAudit(rows);
    } catch (e: any) {
      setInspectionDetail(null);
      setError(e?.message || "Failed to load inspection.");
      setInspectionOpen(false);
    } finally {
      setInspectionLoading(false);
    }
  };

  const openCreateInspection = () => {
    setCreateError("");
    setCreateForm({
      product_id: productId || "",
      seller_id: sellerId || "",
      inspector_id: inspectorId || "",
      inspector_name: "",
      status: pendingOnly ? "in_progress" : failedOnly ? "failed" : statusFilter && statusFilter !== "all" ? statusFilter : "in_progress",
      score: "",
      inspected_at: "",
    });
    setCreateProductQuery("");
    setCreateProductResults([]);
    setCreateSellerQuery("");
    setCreateSellerResults([]);
    setCreateInspectorQuery("");
    setCreateInspectorResults([]);
    setCreateOpen(true);
  };

  const createInspection = async () => {
    setCreateError("");
    const product_id = Number(String(createForm?.product_id || "").trim());
    const seller_id = Number(String(createForm?.seller_id || "").trim());
    if (!Number.isFinite(product_id) || product_id <= 0) {
      setCreateError("Product id is required.");
      return;
    }
    if (!Number.isFinite(seller_id) || seller_id <= 0) {
      setCreateError("Seller id is required.");
      return;
    }
    const inspector_id_raw = String(createForm?.inspector_id || "").trim();
    const inspector_id = inspector_id_raw ? Number(inspector_id_raw) : null;
    const statusVal = String(createForm?.status || "in_progress").trim();
    const scoreRaw = String(createForm?.score || "").trim();
    const scoreVal = scoreRaw ? Number(scoreRaw) : null;
    const inspectedAtRaw = String(createForm?.inspected_at || "").trim();
    const inspected_at = inspectedAtRaw ? new Date(inspectedAtRaw).toISOString() : null;

    const payload: any = { product_id, seller_id, status: statusVal };
    if (inspector_id_raw) {
      if (!Number.isFinite(inspector_id as any) || (inspector_id as any) <= 0) {
        setCreateError("Inspector id must be a positive integer.");
        return;
      }
      payload.inspector_id = inspector_id;
    }
    if (String(createForm?.inspector_name || "").trim()) payload.inspector_name = String(createForm.inspector_name).trim();
    if (scoreRaw) {
      if (!Number.isFinite(scoreVal as any) || (scoreVal as any) < 0 || (scoreVal as any) > 100) {
        setCreateError("Score must be 0-100.");
        return;
      }
      payload.score = Math.round(scoreVal as any);
    }
    if (inspected_at) payload.inspected_at = inspected_at;

    setCreateSaving(true);
    try {
      const data = await fetchJson("/api/v1/admin/quality/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setCreateOpen(false);
      setSuccess("Inspection created.");
      window.setTimeout(() => setSuccess(""), 2000);
      setRefreshNonce((n) => n + 1);
      if (data?.id) {
        await openInspection(Number(data.id));
      }
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create inspection.");
    } finally {
      setCreateSaving(false);
    }
  };

  const setInspection = async (patch: { status?: string; score?: number; inspector_id?: number | null; inspector_name?: string }) => {
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
      setEditInspectorId(data?.inspector_id != null ? String(data.inspector_id) : "");
      setRefreshNonce((n) => n + 1);
    } catch (e: any) {
      setError(e?.message || "Failed to update inspection.");
    } finally {
      setInspectionSaving(false);
    }
  };

  useEffect(() => {
    if (!createOpen) return;
    const qv = (createProductQuery || "").trim();
    if (qv.length < 2) {
      setCreateProductResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetchJson(`/api/v1/admin/products/?page=1&page_size=8&q=${encodeURIComponent(qv)}`);
        if (cancelled) return;
        const rows = Array.isArray(resp?.results) ? resp.results : [];
        setCreateProductResults(rows.slice(0, 8));
      } catch {
        if (!cancelled) setCreateProductResults([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [createOpen, createProductQuery]);

  useEffect(() => {
    if (!createOpen) return;
    const qv = (createSellerQuery || "").trim();
    if (qv.length < 2) {
      setCreateSellerResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetchJson(`/api/v1/admin/users/?page=1&page_size=10&q=${encodeURIComponent(qv)}`);
        if (cancelled) return;
        const rows = Array.isArray(resp?.results) ? resp.results : [];
        const sellers = rows.filter((u: any) => String(u?.role || "").toLowerCase() === "seller" || String(u?.account_type || "").toLowerCase() === "seller");
        setCreateSellerResults(sellers.slice(0, 8));
      } catch {
        if (!cancelled) setCreateSellerResults([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [createOpen, createSellerQuery]);

  useEffect(() => {
    if (!createOpen) return;
    const qv = (createInspectorQuery || "").trim();
    if (qv.length < 2) {
      setCreateInspectorResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetchJson(`/api/v1/admin/users/?page=1&page_size=10&q=${encodeURIComponent(qv)}`);
        if (cancelled) return;
        const rows = Array.isArray(resp?.results) ? resp.results : [];
        const inspectors = rows.filter(
          (u: any) =>
            String(u?.admin_role || "").toLowerCase() === "inspector" || String(u?.role || "").toLowerCase() === "admin"
        );
        setCreateInspectorResults(inspectors.slice(0, 8));
      } catch {
        if (!cancelled) setCreateInspectorResults([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [createOpen, createInspectorQuery]);

  useEffect(() => {
    if (!inspectionOpen) return;
    const qv = (assignInspectorQuery || "").trim();
    if (qv.length < 2) {
      setAssignInspectorResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetchJson(`/api/v1/admin/users/?page=1&page_size=10&q=${encodeURIComponent(qv)}`);
        if (cancelled) return;
        const rows = Array.isArray(resp?.results) ? resp.results : [];
        const inspectors = rows.filter(
          (u: any) =>
            String(u?.admin_role || "").toLowerCase() === "inspector" || String(u?.role || "").toLowerCase() === "admin"
        );
        setAssignInspectorResults(inspectors.slice(0, 8));
      } catch {
        if (!cancelled) setAssignInspectorResults([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [inspectionOpen, assignInspectorQuery]);

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
        if (failedOnly) params.set("failed_only", "1");
        if (pendingOnly) params.set("pending_only", "1");
        if (unassignedInspector) params.set("unassigned_inspector", "1");
        if (!failedOnly && !pendingOnly && statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (sellerId.trim()) params.set("seller_id", sellerId.trim());
        if (inspectorId.trim()) params.set("inspector_id", inspectorId.trim());
        if (productId.trim()) params.set("product_id", productId.trim());
        if (sku.trim()) params.set("sku", sku.trim());
        if (scoreMin.trim()) params.set("score_min", scoreMin.trim());
        if (scoreMax.trim()) params.set("score_max", scoreMax.trim());
        if (inspectedFrom.trim()) params.set("inspected_from", inspectedFrom.trim());
        if (inspectedTo.trim()) params.set("inspected_to", inspectedTo.trim());
        params.set("days", String(days));

        const [s, t, d, listResp] = await Promise.all([
          fetchJson(`/api/v1/admin/quality/stats/?days=${days}`),
          fetchJson(`/api/v1/admin/quality/trend/?days=${Math.min(31, days)}&metric=${encodeURIComponent(trendMetric)}`),
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
  }, [days, page, q, statusFilter, sellerId, inspectorId, productId, sku, scoreMin, scoreMax, inspectedFrom, inspectedTo, failedOnly, pendingOnly, unassignedInspector, refreshNonce, trendMetric]);

  const showGlobalEmpty = useMemo(() => {
    if (loading) return false;
    if (inspections.length > 0) return false;
    const avg = Number(stats?.avg_quality_score || 0) || 0;
    const pr = Number(stats?.pass_rate || 0) || 0;
    const pend = Number(stats?.pending || 0) || 0;
    const failed = Number(stats?.failed || 0) || 0;
    return avg === 0 && pr === 0 && pend === 0 && failed === 0;
  }, [loading, inspections.length, stats]);

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
              const nextDays = Number(e.target.value) || 30;
              setDays(nextDays);
              setPage(1);
              syncUrl({ days: nextDays === 30 ? "" : String(nextDays), page: "" });
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
      {success && (
        <motion.div variants={stagger.item} className="px-4 py-3 rounded-2xl bg-[#30A46C]/8 text-[#1f7a4a] text-[0.8125rem]">
          {success}
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
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-foreground text-[0.9375rem]">{trendLabel}</h2>
            <select
              value={trendMetric}
              onChange={(e) => setTrendMetric(e.target.value as any)}
              className="px-3 py-2 rounded-2xl text-[0.75rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
            >
              <option value="avg_score">Avg score</option>
              <option value="count"># inspections</option>
              <option value="pass_rate">Pass rate</option>
            </select>
          </div>
          <p className="text-muted-foreground/50 text-[0.75rem] mb-4">{trendSubtitle}</p>
          {!trendHasData ? (
            <div className="h-[180px] rounded-2xl bg-muted/10 border border-border/20 flex flex-col items-center justify-center text-center px-6">
              <div className="text-[0.8125rem] text-muted-foreground/70">No data in selected period.</div>
              {showGlobalEmpty && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <BounceButton variant="primary" size="sm" onClick={openCreateInspection}>
                    Create inspection
                  </BounceButton>
                  <BounceButton variant="ghost" size="sm" onClick={() => navigate("/products?admin_status=pending")}>
                    Open products needing review
                  </BounceButton>
                </div>
              )}
            </div>
          ) : (
            <CustomAreaChart
              data={trend}
              xKey="month"
              series={[
                {
                  dataKey: trendKey,
                  color: "#0171E3",
                  label: trendMetric === "count" ? "Inspections" : trendMetric === "pass_rate" ? "Pass rate" : "Avg score",
                },
              ]}
              height={180}
              yDomain={trendYDomain as any}
              yFormatter={trendYFormatter as any}
            />
          )}
        </SectionCard>
        <SectionCard className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-foreground text-[0.9375rem]">Score Distribution</h2>
            <select
              value={distMode}
              onChange={(e) => setDistMode(e.target.value as any)}
              className="px-3 py-2 rounded-2xl text-[0.75rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer"
            >
              <option value="percent">Percent</option>
              <option value="count">Count</option>
            </select>
          </div>
          <HorizontalBarList
            data={[
              {
                label: "Excellent (90+)",
                value: distMode === "count" ? Number(dist?.excellent_count) || 0 : Number(dist?.excellent) || 0,
                color: "#30A46C",
              },
              {
                label: "Good (80-89)",
                value: distMode === "count" ? Number(dist?.good_count) || 0 : Number(dist?.good) || 0,
                color: "#3B82F6",
              },
              {
                label: "Fair (70-79)",
                value: distMode === "count" ? Number(dist?.fair_count) || 0 : Number(dist?.fair) || 0,
                color: "#FFB224",
              },
              {
                label: "Poor (<70)",
                value: distMode === "count" ? Number(dist?.poor_count) || 0 : Number(dist?.poor) || 0,
                color: "#E5484D",
              },
            ]}
            maxValue={
              distMode === "count"
                ? Math.max(
                    Number(dist?.excellent_count) || 0,
                    Number(dist?.good_count) || 0,
                    Number(dist?.fair_count) || 0,
                    Number(dist?.poor_count) || 0,
                    1
                  )
                : 100
            }
            valueFormatter={(v) => (distMode === "count" ? Number(v || 0).toLocaleString() : `${v}%`)}
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
                    syncUrl({ q: e.target.value, page: "" });
                  }}
                  placeholder="Search product, seller, inspector…"
                  className="pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[260px]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setFailedOnly(false);
                  setPendingOnly(false);
                  setPage(1);
                  syncUrl({ status: e.target.value === "all" ? "" : e.target.value, failed_only: "", pending_only: "", page: "" });
                }}
                className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="in_progress">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <input
                value={sellerId}
                onChange={(e) => {
                  setSellerId(e.target.value);
                  setPage(1);
                  syncUrl({ seller_id: e.target.value, page: "" });
                }}
                placeholder="Seller id"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[140px]"
              />
              <input
                value={inspectorId}
                onChange={(e) => {
                  setInspectorId(e.target.value);
                  setPage(1);
                  syncUrl({ inspector_id: e.target.value, page: "" });
                }}
                placeholder="Inspector id"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[150px]"
              />
              <input
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setPage(1);
                  syncUrl({ product_id: e.target.value, page: "" });
                }}
                placeholder="Product id"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[140px]"
              />
              <input
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  setPage(1);
                  syncUrl({ sku: e.target.value, page: "" });
                }}
                placeholder="SKU"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[160px]"
              />
              <input
                value={scoreMin}
                onChange={(e) => {
                  setScoreMin(e.target.value);
                  setPage(1);
                  syncUrl({ score_min: e.target.value, page: "" });
                }}
                placeholder="Score min"
                inputMode="numeric"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[140px]"
              />
              <input
                value={scoreMax}
                onChange={(e) => {
                  setScoreMax(e.target.value);
                  setPage(1);
                  syncUrl({ score_max: e.target.value, page: "" });
                }}
                placeholder="Score max"
                inputMode="numeric"
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-[140px]"
              />
              <input
                type="date"
                value={inspectedFrom}
                onChange={(e) => {
                  setInspectedFrom(e.target.value);
                  setPage(1);
                  syncUrl({ inspected_from: e.target.value, page: "" });
                }}
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              <input
                type="date"
                value={inspectedTo}
                onChange={(e) => {
                  setInspectedTo(e.target.value);
                  setPage(1);
                  syncUrl({ inspected_to: e.target.value, page: "" });
                }}
                className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const next = !failedOnly;
                  setFailedOnly(next);
                  if (next) {
                    setPendingOnly(false);
                    setStatusFilter("all");
                  }
                  setPage(1);
                  if (next) syncUrl({ failed_only: "1", pending_only: "", status: "", page: "" });
                  else syncUrl({ failed_only: "", page: "" });
                }}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  failedOnly ? "bg-[#E5484D]/10 text-[#E5484D]/80" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Failed only
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !pendingOnly;
                  setPendingOnly(next);
                  if (next) {
                    setFailedOnly(false);
                    setStatusFilter("all");
                  }
                  setPage(1);
                  if (next) syncUrl({ pending_only: "1", failed_only: "", status: "", page: "" });
                  else syncUrl({ pending_only: "", page: "" });
                }}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  pendingOnly ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending only
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !unassignedInspector;
                  setUnassignedInspector(next);
                  setPage(1);
                  syncUrl({ unassigned_inspector: next ? "1" : "", page: "" });
                }}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${
                  unassignedInspector ? "bg-[#FFB224]/12 text-[#D97706]" : "bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Unassigned
              </button>
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
                <div>No inspections yet.</div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <BounceButton variant="primary" size="sm" onClick={openCreateInspection}>
                    Create inspection
                  </BounceButton>
                  <BounceButton variant="ghost" size="sm" onClick={() => navigate("/products?admin_status=pending")}>
                    Open products needing review
                  </BounceButton>
                </div>
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
                  <button
                    type="button"
                    className="text-[0.875rem] text-foreground block truncate hover:text-foreground/90 text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      const qv = (qi?.product_sku || qi?.product_name || "").toString().trim();
                      if (!qv) return;
                      navigate(`/products?q=${encodeURIComponent(qv)}`);
                    }}
                    title="Open product"
                  >
                    {qi.product_name || "—"}
                  </button>
                  <span className="text-[0.75rem] text-muted-foreground/50 truncate">
                    <button
                      type="button"
                      className="hover:text-foreground"
                      title={qi?.seller_contact?.email || qi?.seller_contact?.phone || ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        const key = qi?.seller_contact?.email || qi?.seller_contact?.phone || "";
                        if (!key) return;
                        navigate(`/users?q=${encodeURIComponent(key)}`);
                      }}
                    >
                      {qi.seller_label || qi.seller_name || "—"}
                    </button>
                    {!!(qi?.seller_contact?.email || qi?.seller_contact?.phone) && (
                      <span className="text-[0.6875rem] text-muted-foreground/40" title={qi?.seller_contact?.email || qi?.seller_contact?.phone || ""}>
                        {" "}
                        ({qi?.seller_contact?.phone || qi?.seller_contact?.email})
                      </span>
                    )}{" "}
                    ·{" "}
                    <button
                      type="button"
                      className="hover:text-foreground"
                      title={qi?.inspector_contact?.email || qi?.inspector_contact?.phone || ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        const key =
                          qi?.inspector_contact?.email ||
                          qi?.inspector_contact?.phone ||
                          (qi?.inspector_id ? String(qi.inspector_id) : "") ||
                          (qi?.inspector_display || "");
                        if (!key) return;
                        navigate(`/users?q=${encodeURIComponent(key)}`);
                      }}
                    >
                      {qi.inspector_display || "—"}
                    </button>
                  </span>
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
              <BounceButton
                variant="ghost"
                size="sm"
                onClick={
                  page <= 1
                    ? undefined
                    : () => {
                        const next = Math.max(1, page - 1);
                        setPage(next);
                        syncUrl({ page: next === 1 ? "" : String(next) });
                      }
                }
                className={page <= 1 ? "opacity-60 pointer-events-none" : ""}
              >
                Prev
              </BounceButton>
              <BounceButton
                variant="ghost"
                size="sm"
                onClick={
                  page >= totalPages
                    ? undefined
                    : () => {
                        const next = page + 1;
                        setPage(next);
                        syncUrl({ page: String(next) });
                      }
                }
                className={page >= totalPages ? "opacity-60 pointer-events-none" : ""}
              >
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
                    {inspectionDetail?.product_name ? (
                      <button
                        type="button"
                        className="hover:text-foreground/90 text-left truncate"
                        onClick={() => {
                          const qv = (inspectionDetail?.product_sku || inspectionDetail?.product_name || "").toString().trim();
                          if (!qv) return;
                          navigate(`/products?q=${encodeURIComponent(qv)}`);
                        }}
                        title="Open product"
                      >
                        {inspectionDetail?.product_name}
                      </button>
                    ) : (
                      inspectionLoading ? "Loading…" : "Inspection"
                    )}
                  </h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    <button
                      type="button"
                      className="hover:text-foreground"
                      title={inspectionDetail?.seller_contact?.email || inspectionDetail?.seller_contact?.phone || ""}
                      onClick={() => {
                        const key = inspectionDetail?.seller_contact?.email || inspectionDetail?.seller_contact?.phone || "";
                        if (!key) return;
                        navigate(`/users?q=${encodeURIComponent(key)}`);
                      }}
                    >
                      {inspectionDetail?.seller_label || inspectionDetail?.seller_name || "—"}
                    </button>{" "}
                    ·{" "}
                    <button
                      type="button"
                      className="hover:text-foreground"
                      title={inspectionDetail?.inspector_contact?.email || inspectionDetail?.inspector_contact?.phone || ""}
                      onClick={() => {
                        const key =
                          inspectionDetail?.inspector_contact?.email ||
                          inspectionDetail?.inspector_contact?.phone ||
                          (inspectionDetail?.inspector_id ? String(inspectionDetail.inspector_id) : "") ||
                          (inspectionDetail?.inspector_display || "");
                        if (!key) return;
                        navigate(`/users?q=${encodeURIComponent(key)}`);
                      }}
                    >
                      {inspectionDetail?.inspector_display || "—"}
                    </button>
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[0.875rem] text-foreground/80 truncate">{inspectionDetail?.id}</div>
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/60"
                          onClick={() => void copyToClipboard(String(inspectionDetail?.id || ""), "Copied inspection id.")}
                          disabled={!inspectionDetail?.id}
                          title="Copy inspection id"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Product</div>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="text-[0.875rem] text-foreground/80 truncate hover:text-foreground/90 text-left"
                          onClick={() => {
                            const qv = (inspectionDetail?.product_sku || inspectionDetail?.product_name || "").toString().trim();
                            if (!qv) return;
                            navigate(`/products?q=${encodeURIComponent(qv)}`);
                          }}
                          title="Open product"
                        >
                          #{inspectionDetail?.product || "—"}{inspectionDetail?.product_sku ? ` · ${inspectionDetail.product_sku}` : ""}
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/60"
                          onClick={() => void copyToClipboard(String(inspectionDetail?.product || ""), "Copied product id.")}
                          disabled={!inspectionDetail?.product}
                          title="Copy product id"
                        >
                          <Hash size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Seller</div>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="text-[0.875rem] text-foreground/80 truncate hover:text-foreground/90 text-left"
                          onClick={() => {
                            const key = inspectionDetail?.seller_contact?.email || inspectionDetail?.seller_contact?.phone || String(inspectionDetail?.seller_id || "");
                            if (!key) return;
                            navigate(`/users?q=${encodeURIComponent(key)}`);
                          }}
                          title="Open seller"
                        >
                          #{inspectionDetail?.seller_id || "—"}
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/60"
                          onClick={() => void copyToClipboard(String(inspectionDetail?.seller_id || ""), "Copied seller id.")}
                          disabled={!inspectionDetail?.seller_id}
                          title="Copy seller id"
                        >
                          <Hash size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-4">
                      <div className="text-[0.6875rem] text-muted-foreground/50 mb-1">Inspector</div>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="text-[0.875rem] text-foreground/80 truncate hover:text-foreground/90 text-left"
                          onClick={() => {
                            const key =
                              inspectionDetail?.inspector_contact?.email ||
                              inspectionDetail?.inspector_contact?.phone ||
                              String(inspectionDetail?.inspector_id || "");
                            if (!key) return;
                            navigate(`/users?q=${encodeURIComponent(key)}`);
                          }}
                          title="Open inspector"
                        >
                          #{inspectionDetail?.inspector_id || "—"}
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground/60"
                          onClick={() => void copyToClipboard(String(inspectionDetail?.inspector_id || ""), "Copied inspector id.")}
                          disabled={!inspectionDetail?.inspector_id}
                          title="Copy inspector id"
                        >
                          <Hash size={14} />
                        </button>
                      </div>
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

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        value={editInspectorId}
                        onChange={(e) => setEditInspectorId(e.target.value)}
                        placeholder="Inspector id"
                        inputMode="numeric"
                        className="sm:col-span-1 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                      <BounceButton
                        variant="ghost"
                        size="sm"
                        onClick={
                          inspectionSaving
                            ? undefined
                            : () => {
                                const n = Number(editInspectorId);
                                if (!Number.isFinite(n) || n <= 0) return;
                                setAssignInspectorQuery("");
                                setAssignInspectorResults([]);
                                void setInspection({ inspector_id: n });
                              }
                        }
                        className={inspectionSaving ? "opacity-70 pointer-events-none" : ""}
                      >
                        Assign inspector
                      </BounceButton>
                      <BounceButton
                        variant="ghost"
                        size="sm"
                        onClick={inspectionSaving ? undefined : () => void setInspection({ inspector_id: null })}
                        className={inspectionSaving ? "opacity-70 pointer-events-none" : ""}
                      >
                        Clear
                      </BounceButton>
                    </div>

                    <div className="mt-3">
                      <input
                        value={assignInspectorQuery}
                        onChange={(e) => setAssignInspectorQuery(e.target.value)}
                        placeholder="Search inspector (name / email / phone)…"
                        className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                      {assignInspectorResults.length > 0 && (
                        <div className="mt-2 rounded-2xl bg-muted/10 border border-border/20 overflow-hidden">
                          {assignInspectorResults.map((u: any) => (
                            <button
                              key={u.id}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-muted/20 flex items-center justify-between gap-3"
                              onClick={() => {
                                setEditInspectorId(String(u.id));
                                setAssignInspectorQuery("");
                                setAssignInspectorResults([]);
                                void setInspection({ inspector_id: Number(u.id) });
                              }}
                              title={u.email || u.phone || ""}
                            >
                              <span className="text-[0.8125rem] text-foreground/90 truncate">{u.display_name || u.email || u.phone || `user:${u.id}`}</span>
                              <span className="text-[0.75rem] text-muted-foreground/60 shrink-0">
                                #{u.id}
                                {u.admin_role ? ` · ${String(u.admin_role).replaceAll("_", " ")}` : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                    <div className="text-[0.75rem] text-muted-foreground/60 mb-2">Dates</div>
                    <div className="text-[0.8125rem] text-foreground/80 flex flex-col gap-1">
                      <div>Created: {formatDateTime(inspectionDetail?.created_at)}</div>
                      <div>Inspected: {formatDateTime(inspectionDetail?.inspected_at)}</div>
                    </div>
                  </div>

                  {inspectionAudit.length > 0 && (
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                      <div className="text-[0.75rem] text-muted-foreground/60 mb-3">Activity</div>
                      <div className="space-y-2">
                        {inspectionAudit.map((ev: any) => {
                          const actorLabel = ev?.actor?.label || "System";
                          const fields = Array.isArray(ev?.payload?.fields) ? ev.payload.fields : [];
                          const fieldsText = fields.length ? ` · ${fields.join(", ")}` : "";
                          const action = String(ev?.action || "");
                          const actionLabel =
                            action === "admin_quality_inspection_created"
                              ? "Created"
                              : action === "admin_quality_inspection_updated"
                                ? "Updated"
                                : action.replaceAll("_", " ");
                          return (
                            <div key={ev?.id} className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-[0.8125rem] text-foreground/85 truncate">
                                  {actionLabel}
                                  <span className="text-muted-foreground/60">{fieldsText}</span>
                                </div>
                                <div className="text-[0.75rem] text-muted-foreground/60 truncate">
                                  {actorLabel}
                                </div>
                              </div>
                              <div className="text-[0.75rem] text-muted-foreground/50 shrink-0">
                                {formatDateTime(ev?.occurred_at)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {Array.isArray(inspectionDetail?.recent_sample_requests) && inspectionDetail.recent_sample_requests.length > 0 && (
                    <div className="rounded-2xl bg-muted/10 border border-border/20 p-5">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="text-[0.75rem] text-muted-foreground/60">Recent buyers requesting samples</div>
                        <div className="text-[0.75rem] text-muted-foreground/40">
                          {Number(inspectionDetail?.recent_sample_requests_count || inspectionDetail.recent_sample_requests.length || 0).toLocaleString()} total
                        </div>
                      </div>
                      <div className="space-y-2">
                        {inspectionDetail.recent_sample_requests.map((sr: any) => {
                          const label = sr?.buyer_label || "—";
                          const key = sr?.buyer_contact?.email || sr?.buyer_contact?.phone || (sr?.buyer_id ? String(sr.buyer_id) : "");
                          return (
                            <div key={sr?.sample_request_id || `${sr?.buyer_id}-${sr?.requested_at || ""}`} className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="text-[0.8125rem] text-foreground/85 truncate hover:text-foreground"
                                  title={sr?.buyer_contact?.email || sr?.buyer_contact?.phone || ""}
                                  onClick={() => {
                                    if (!key) return;
                                    navigate(`/users?q=${encodeURIComponent(key)}`);
                                  }}
                                >
                                  {label}
                                </button>
                                <div className="text-[0.75rem] text-muted-foreground/60 truncate">
                                  {(sr?.status || "").toString().replaceAll("_", " ")}
                                  {sr?.buyer_id ? ` · #${sr.buyer_id}` : ""}
                                </div>
                              </div>
                              <div className="text-[0.75rem] text-muted-foreground/50 shrink-0">
                                {formatDateTime(sr?.requested_at)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[860px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h2 className="text-foreground tracking-tight mb-1 truncate">Create inspection</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">Create a new quality inspection record.</p>
                </div>
                <button className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60" onClick={() => setCreateOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {createError && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    value={createProductQuery}
                    onChange={(e) => setCreateProductQuery(e.target.value)}
                    placeholder="Search product (name / SKU)…"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                  {createProductResults.length > 0 && (
                    <div className="mt-2 rounded-2xl bg-muted/10 border border-border/20 overflow-hidden">
                      {createProductResults.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted/20 flex items-center justify-between gap-3"
                          onClick={() => {
                            setCreateForm((prev: any) => ({ ...prev, product_id: String(p.id) }));
                            setCreateProductQuery("");
                            setCreateProductResults([]);
                          }}
                          title={p.sku || ""}
                        >
                          <span className="text-[0.8125rem] text-foreground/90 truncate">{p.name || `product:${p.id}`}</span>
                          <span className="text-[0.75rem] text-muted-foreground/60 shrink-0">
                            #{p.id}
                            {p.sku ? ` · ${p.sku}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={createForm.product_id}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, product_id: e.target.value }))}
                  placeholder="Product id"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <div>
                  <input
                    value={createSellerQuery}
                    onChange={(e) => setCreateSellerQuery(e.target.value)}
                    placeholder="Search seller (name / email / phone)…"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                  {createSellerResults.length > 0 && (
                    <div className="mt-2 rounded-2xl bg-muted/10 border border-border/20 overflow-hidden">
                      {createSellerResults.map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted/20 flex items-center justify-between gap-3"
                          onClick={() => {
                            setCreateForm((prev: any) => ({ ...prev, seller_id: String(u.id) }));
                            setCreateSellerQuery("");
                            setCreateSellerResults([]);
                          }}
                          title={u.email || u.phone || ""}
                        >
                          <span className="text-[0.8125rem] text-foreground/90 truncate">{u.display_name || u.email || u.phone || `user:${u.id}`}</span>
                          <span className="text-[0.75rem] text-muted-foreground/60 shrink-0">#{u.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={createForm.seller_id}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, seller_id: e.target.value }))}
                  placeholder="Seller id"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <div>
                  <input
                    value={createInspectorQuery}
                    onChange={(e) => setCreateInspectorQuery(e.target.value)}
                    placeholder="Search inspector (name / email / phone)…"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                  {createInspectorResults.length > 0 && (
                    <div className="mt-2 rounded-2xl bg-muted/10 border border-border/20 overflow-hidden">
                      {createInspectorResults.map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted/20 flex items-center justify-between gap-3"
                          onClick={() => {
                            setCreateForm((prev: any) => ({ ...prev, inspector_id: String(u.id), inspector_name: "" }));
                            setCreateInspectorQuery("");
                            setCreateInspectorResults([]);
                          }}
                          title={u.email || u.phone || ""}
                        >
                          <span className="text-[0.8125rem] text-foreground/90 truncate">{u.display_name || u.email || u.phone || `user:${u.id}`}</span>
                          <span className="text-[0.75rem] text-muted-foreground/60 shrink-0">
                            #{u.id}
                            {u.admin_role ? ` · ${String(u.admin_role).replaceAll("_", " ")}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={createForm.inspector_id}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, inspector_id: e.target.value }))}
                  placeholder="Inspector id (optional)"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  value={createForm.inspector_name}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, inspector_name: e.target.value }))}
                  placeholder="Inspector name (optional)"
                  className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, status: e.target.value }))}
                  className="px-4 py-3 rounded-2xl text-[0.8125rem] bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="in_progress">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
                <input
                  value={createForm.score}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, score: e.target.value }))}
                  placeholder="Score (0-100, optional)"
                  inputMode="numeric"
                  className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                <input
                  type="datetime-local"
                  value={createForm.inspected_at}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, inspected_at: e.target.value }))}
                  className="sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <BounceButton variant="ghost" size="sm" onClick={createSaving ? undefined : () => setCreateOpen(false)} className={createSaving ? "opacity-70 pointer-events-none" : ""}>
                  Cancel
                </BounceButton>
                <BounceButton variant="primary" size="sm" onClick={createSaving ? undefined : createInspection} className={createSaving ? "opacity-70 pointer-events-none" : ""}>
                  Create
                </BounceButton>
              </div>
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
      general: {
        platform_name: "Vehsl",
        default_currency: "USD",
        timezone: "UTC",
        language: "English",
        integrations_enabled: {
          stripe_payments: true,
          sendgrid_email: true,
          twilio_sms: true,
          google_maps: true,
        },
        integration_credentials_set: {
          stripe_secret_key_set: false,
          sendgrid_api_key_set: false,
          twilio_account_sid_set: false,
          twilio_auth_token_set: false,
          google_maps_api_key_set: false,
        },
      },
      notifications: { email_notifications: true, push_notifications: true, sms_alerts: false, daily_digest: true },
      security: { two_factor_auth: false, session_timeout_minutes: 0, ip_whitelisting: false, ip_whitelist: [], password_policy: "strong_10_chars" },
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
              try {
                const g = (s && s.general) || {};
                const pn = String(g.platform_name || "").trim();
                const cur = String(g.default_currency || "").trim();
                const tz = String(g.timezone || "").trim();
                const lang = String(g.language || "").trim();
                if (pn) window.localStorage.setItem("vehsl.platform_name", pn);
                if (cur) window.localStorage.setItem("vehsl.platform_currency", cur);
                if (tz) window.localStorage.setItem("vehsl.platform_timezone", tz);
                if (lang) window.localStorage.setItem("vehsl.platform_language", lang);
              } catch {}
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
          const generalToSend = { ...(settingsForm.general || {}) };
          try {
            delete (generalToSend as any).integration_credentials_set;
          } catch {}
          const sRes = await fetch(`${apiBase}/api/v1/admin/settings`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access}`,
            },
            body: JSON.stringify({
              general: generalToSend,
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
          if (updated) {
            setPlatformSettings(updated);
            try {
              const g = (updated && updated.general) || {};
              const pn = String(g.platform_name || "").trim();
              const cur = String(g.default_currency || "").trim();
              const tz = String(g.timezone || "").trim();
              const lang = String(g.language || "").trim();
              if (pn) window.localStorage.setItem("vehsl.platform_name", pn);
              if (cur) window.localStorage.setItem("vehsl.platform_currency", cur);
              if (tz) window.localStorage.setItem("vehsl.platform_timezone", tz);
              if (lang) window.localStorage.setItem("vehsl.platform_language", lang);
            } catch {}
          }
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

  const [securityBusy, setSecurityBusy] = useState(false);
  const [totpSetup, setTotpSetup] = useState<any>(null);
  const [totpEnableCode, setTotpEnableCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [totpDisableRecoveryCode, setTotpDisableRecoveryCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [integrationTests, setIntegrationTests] = useState<Record<string, any>>({});
  const [notifTestMsg, setNotifTestMsg] = useState<string>("");
  const [credKey, setCredKey] = useState<string | null>(null);
  const [credDraft, setCredDraft] = useState<any>({});
  const [credSaving, setCredSaving] = useState(false);

  const postAuthed = async (path: string, body?: any) => {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: body ? JSON.stringify(body) : JSON.stringify({}),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  };

  const getAuthed = async (path: string) => {
    const res = await fetch(`${apiBase}${path}`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  };

  const testIntegration = async (key: string) => {
    if (!access) return;
    setNotifTestMsg("");
    setError(null);
    try {
      const r = await getAuthed(`/api/v1/admin/integrations/${encodeURIComponent(key)}/test`);
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.non_field_errors)) || "Integration test failed.";
        setError(typeof msg === "string" ? msg : "Integration test failed.");
        return;
      }
      setIntegrationTests((p) => ({ ...(p || {}), [key]: r.data }));
    } catch {
      setError("Network error.");
    }
  };

  const testNotification = async (channel: "email" | "sms" | "push" | "in_app") => {
    if (!access) return;
    setNotifTestMsg("");
    setError(null);
    try {
      const r = await postAuthed("/api/v1/admin/notifications/test", { channel });
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.non_field_errors)) || "Notification test failed.";
        setError(typeof msg === "string" ? msg : "Notification test failed.");
        return;
      }
      setNotifTestMsg(String(r.data?.detail || "OK"));
    } catch {
      setError("Network error.");
    }
  };

  const openCreds = (key: string) => {
    setError(null);
    setNotifTestMsg("");
    setCredKey(key);
    setCredDraft({});
  };

  const saveCreds = async () => {
    if (!access || !credKey || credSaving) return;
    setCredSaving(true);
    setError(null);
    try {
      const patch: any = {};
      if (credKey === "stripe_payments") {
        patch.stripe_secret_key = String(credDraft.stripe_secret_key || "").trim();
      } else if (credKey === "sendgrid_email") {
        patch.sendgrid_api_key = String(credDraft.sendgrid_api_key || "").trim();
      } else if (credKey === "twilio_sms") {
        patch.twilio_account_sid = String(credDraft.twilio_account_sid || "").trim();
        patch.twilio_auth_token = String(credDraft.twilio_auth_token || "").trim();
      } else if (credKey === "google_maps") {
        patch.google_maps_api_key = String(credDraft.google_maps_api_key || "").trim();
      }

      const res = await fetch(`${apiBase}/api/v1/admin/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ general: { integration_credentials: patch } }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && (data.detail || data.non_field_errors)) || "Failed to save integration credentials.";
        setError(typeof msg === "string" ? msg : "Failed to save integration credentials.");
        return;
      }
      if (data) setPlatformSettings(data);
      setCredKey(null);
      setCredDraft({});
    } catch {
      setError("Network error.");
    } finally {
      setCredSaving(false);
    }
  };

  const beginTotpSetup = async () => {
    if (!access || securityBusy) return;
    setSecurityBusy(true);
    setError(null);
    setRecoveryCodes(null);
    try {
      const r = await postAuthed("/api/v1/security/totp/setup");
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.non_field_errors)) || "Failed to start 2FA setup.";
        setError(typeof msg === "string" ? msg : "Failed to start 2FA setup.");
        return;
      }
      setTotpSetup(r.data || null);
    } finally {
      setSecurityBusy(false);
    }
  };

  const enableTotp = async () => {
    if (!access || securityBusy) return;
    const code = (totpEnableCode || "").trim();
    if (!code) {
      setError("OTP code is required.");
      return;
    }
    setSecurityBusy(true);
    setError(null);
    try {
      const r = await postAuthed("/api/v1/security/totp/enable", { code });
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.code || r.data.non_field_errors)) || "Failed to enable 2FA.";
        setError(typeof msg === "string" ? msg : "Failed to enable 2FA.");
        return;
      }
      setTotpEnableCode("");
      const next = { ...(me || {}), two_factor_enabled: true };
      setMe(next);
      try {
        window.localStorage.setItem("vehsl.user", JSON.stringify(next));
      } catch {}
    } finally {
      setSecurityBusy(false);
    }
  };

  const generateRecoveryCodes = async () => {
    if (!access || securityBusy) return;
    setSecurityBusy(true);
    setError(null);
    try {
      const r = await postAuthed("/api/v1/security/recovery-codes");
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.non_field_errors)) || "Failed to generate recovery codes.";
        setError(typeof msg === "string" ? msg : "Failed to generate recovery codes.");
        return;
      }
      const codes = r.data?.codes;
      setRecoveryCodes(Array.isArray(codes) ? codes : []);
    } finally {
      setSecurityBusy(false);
    }
  };

  const disableTotp = async () => {
    if (!access || securityBusy) return;
    const code = (totpDisableCode || "").trim();
    const recovery_code = (totpDisableRecoveryCode || "").trim();
    if (!code && !recovery_code) {
      setError("OTP or recovery code required.");
      return;
    }
    setSecurityBusy(true);
    setError(null);
    try {
      const r = await postAuthed("/api/v1/security/totp/disable", { code, recovery_code });
      if (!r.ok) {
        const msg = (r.data && (r.data.detail || r.data.non_field_errors)) || "Failed to disable 2FA.";
        setError(typeof msg === "string" ? msg : "Failed to disable 2FA.");
        return;
      }
      setTotpDisableCode("");
      setTotpDisableRecoveryCode("");
      setTotpSetup(null);
      setRecoveryCodes(null);
      const next = { ...(me || {}), two_factor_enabled: false };
      setMe(next);
      try {
        window.localStorage.setItem("vehsl.user", JSON.stringify(next));
      } catch {}
    } finally {
      setSecurityBusy(false);
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
    const disabled = s === "disabled";
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[0.75rem] border ${
          ok
            ? "bg-[#30A46C]/10 text-[#30A46C] border-[#30A46C]/20"
            : disabled
            ? "bg-black/[0.02] text-muted-foreground/70 border-black/[0.06]"
            : "bg-[#E5484D]/8 text-[#E5484D] border-[#E5484D]/20"
        }`}
      >
        {ok ? "Connected" : disabled ? "Disabled" : "Not Connected"}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Nationality</label>
                  <input
                    value={form.nationality}
                    onChange={(e) => setForm((p: any) => ({ ...p, nationality: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p: any) => ({ ...p, gender: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Date of birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth || ""}
                    onChange={(e) => setForm((p: any) => ({ ...p, date_of_birth: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
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

      {!loading && access && (
        <motion.div variants={stagger.item}>
          <SectionCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#E5484D]/10">
                <Lock size={20} className="text-[#E5484D]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-[0.9375rem]">Account Security</h2>
                <p className="text-muted-foreground text-[0.75rem]">Two-factor authentication for your account</p>
              </div>
              <div className="ml-auto">
                <span className="px-2.5 py-1 rounded-full text-[0.75rem] border bg-black/[0.02] border-black/[0.05] text-muted-foreground/70">
                  {me?.two_factor_enabled ? "2FA Enabled" : "2FA Off"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {!me?.two_factor_enabled ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <BounceButton variant="primary" size="sm" onClick={securityBusy ? undefined : beginTotpSetup} className={securityBusy ? "opacity-70 pointer-events-none" : ""}>
                    Set up 2FA
                  </BounceButton>
                  <BounceButton variant="ghost" size="sm" onClick={securityBusy ? undefined : generateRecoveryCodes} className={securityBusy ? "opacity-70 pointer-events-none" : ""}>
                    Generate recovery codes
                  </BounceButton>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <BounceButton variant="ghost" size="sm" onClick={securityBusy ? undefined : generateRecoveryCodes} className={securityBusy ? "opacity-70 pointer-events-none" : ""}>
                    Regenerate recovery codes
                  </BounceButton>
                  <BounceButton variant="ghost" size="sm" onClick={securityBusy ? undefined : disableTotp} className={securityBusy ? "opacity-70 pointer-events-none" : ""}>
                    Disable 2FA
                  </BounceButton>
                </div>
              )}

              {totpSetup && (
                <div className="p-4 rounded-2xl bg-black/[0.012] border border-black/[0.04] space-y-3">
                  <div className="text-[0.8125rem] text-foreground/80">
                    Add this secret to your authenticator app, then enter the 6-digit code to enable.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <div className="text-[0.6875rem] text-muted-foreground/60 mb-1">Secret</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.8125rem] text-foreground/90 break-all">{totpSetup?.secret || ""}</div>
                        <button
                          type="button"
                          className="p-2 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] text-muted-foreground/70"
                          onClick={() => {
                            const v = String(totpSetup?.secret || "");
                            if (!v) return;
                            navigator.clipboard?.writeText(v).catch(() => {});
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <div className="text-[0.6875rem] text-muted-foreground/60 mb-1">OTPAuth URL</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.8125rem] text-foreground/90 break-all">{totpSetup?.otpauth_url || ""}</div>
                        <button
                          type="button"
                          className="p-2 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] text-muted-foreground/70"
                          onClick={() => {
                            const v = String(totpSetup?.otpauth_url || "");
                            if (!v) return;
                            navigator.clipboard?.writeText(v).catch(() => {});
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      value={totpEnableCode}
                      onChange={(e) => setTotpEnableCode(e.target.value)}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      className="flex-1 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <BounceButton variant="primary" size="sm" onClick={securityBusy ? undefined : enableTotp} className={securityBusy ? "opacity-70 pointer-events-none" : ""}>
                      Enable
                    </BounceButton>
                  </div>
                </div>
              )}

              {me?.two_factor_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Disable with OTP</label>
                    <input
                      value={totpDisableCode}
                      onChange={(e) => setTotpDisableCode(e.target.value)}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Or disable with recovery code</label>
                    <input
                      value={totpDisableRecoveryCode}
                      onChange={(e) => setTotpDisableRecoveryCode(e.target.value)}
                      placeholder="ABCD-EFGH"
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>
              )}

              {recoveryCodes && (
                <div className="p-4 rounded-2xl bg-black/[0.012] border border-black/[0.04]">
                  <div className="text-[0.8125rem] text-foreground/80 mb-2">Recovery codes</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {recoveryCodes.map((c) => (
                      <div key={c} className="px-3 py-2 rounded-xl bg-muted/20 border border-border/30 text-[0.8125rem] text-foreground/90 font-mono">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}

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

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <BounceButton variant="ghost" size="sm" onClick={() => testNotification("email")}>
                  Test Email
                </BounceButton>
                <BounceButton variant="ghost" size="sm" onClick={() => testNotification("sms")}>
                  Test SMS
                </BounceButton>
                <BounceButton variant="ghost" size="sm" onClick={() => testNotification("push")}>
                  Test Push
                </BounceButton>
              </div>

              {!!notifTestMsg && (
                <div className="px-4 py-3 rounded-2xl bg-black/[0.012] border border-black/[0.03] text-[0.8125rem] text-muted-foreground/70">
                  {notifTestMsg}
                </div>
              )}
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

              {!!settingsForm.security.ip_whitelisting && (
                <div>
                  <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">IP whitelist</label>
                  <textarea
                    rows={4}
                    value={Array.isArray(settingsForm.security.ip_whitelist) ? settingsForm.security.ip_whitelist.join("\n") : String(settingsForm.security.ip_whitelist || "")}
                    onChange={(e) => {
                      const raw = e.target.value || "";
                      const parts = raw.replace(/,/g, "\n").split("\n").map((s) => s.trim()).filter(Boolean);
                      setSettingsForm((p: any) => ({ ...p, security: { ...(p.security || {}), ip_whitelist: parts } }));
                    }}
                    placeholder={"203.0.113.10\n203.0.113.0/24"}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
                  />
                  <div className="text-muted-foreground/50 text-[0.75rem] mt-2">
                    One per line. CIDR supported (e.g. 203.0.113.0/24).
                  </div>
                </div>
              )}

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
                  {[0, 15, 30, 60, 120, 240].map((m) => (
                    <option key={m} value={String(m)}>
                      {m === 0 ? "Never" : `${m} min`}
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
                <p className="text-muted-foreground text-[0.75rem]">Connected (env) + Enabled (platform)</p>
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
                  <div className="min-w-0">
                    <div className="text-[0.8125rem] text-foreground">{it.label}</div>
                    {(() => {
                      const cs = settingsForm.general?.integration_credentials_set || {};
                      const configured =
                        it.key === "stripe_payments"
                          ? !!cs.stripe_secret_key_set
                          : it.key === "sendgrid_email"
                          ? !!cs.sendgrid_api_key_set
                          : it.key === "twilio_sms"
                          ? !!cs.twilio_account_sid_set && !!cs.twilio_auth_token_set
                          : it.key === "google_maps"
                          ? !!cs.google_maps_api_key_set
                          : false;
                      return configured ? (
                        <div className="text-[0.75rem] text-muted-foreground/60">Credentials configured</div>
                      ) : (
                        <div className="text-[0.75rem] text-muted-foreground/60">No credentials configured</div>
                      );
                    })()}
                    {integrationTests[it.key]?.details && (
                      <div className="text-[0.75rem] text-muted-foreground/60 truncate">
                        {String(integrationTests[it.key]?.details || "")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusPill(settingsForm.integrations[it.key])}
                    <Toggle
                      value={!!settingsForm.general?.integrations_enabled?.[it.key]}
                      onChange={(v) =>
                        setSettingsForm((p: any) => ({
                          ...p,
                          general: {
                            ...(p.general || {}),
                            integrations_enabled: { ...((p.general && p.general.integrations_enabled) || {}), [it.key]: v },
                          },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70"
                      onClick={() => openCreds(it.key)}
                    >
                      Configure
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl bg-black/[0.012] hover:bg-black/[0.02] text-[0.75rem] text-muted-foreground/70"
                      onClick={() => testIntegration(it.key)}
                    >
                      Test
                    </button>
                  </div>
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

      <AnimatePresence>
        {credKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            onClick={() => (credSaving ? undefined : setCredKey(null))}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[560px] rounded-3xl bg-card border border-border/40 shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-foreground tracking-tight mb-1">Configure integration</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">
                    Stored credentials require server env ALLOW_DB_SECRETS=1.
                  </p>
                </div>
                <button
                  className="p-2 rounded-2xl hover:bg-muted/20 text-muted-foreground/60"
                  onClick={() => (credSaving ? undefined : setCredKey(null))}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {credKey === "stripe_payments" && (
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Stripe secret key</label>
                    <input
                      value={credDraft.stripe_secret_key || ""}
                      onChange={(e) => setCredDraft((p: any) => ({ ...(p || {}), stripe_secret_key: e.target.value }))}
                      placeholder="sk_live_... or sk_test_..."
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <div className="text-muted-foreground/50 text-[0.75rem] mt-2">Leave blank to clear stored key.</div>
                  </div>
                )}

                {credKey === "sendgrid_email" && (
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">SendGrid API key</label>
                    <input
                      value={credDraft.sendgrid_api_key || ""}
                      onChange={(e) => setCredDraft((p: any) => ({ ...(p || {}), sendgrid_api_key: e.target.value }))}
                      placeholder="SG...."
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <div className="text-muted-foreground/50 text-[0.75rem] mt-2">Leave blank to clear stored key.</div>
                  </div>
                )}

                {credKey === "twilio_sms" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Twilio Account SID</label>
                      <input
                        value={credDraft.twilio_account_sid || ""}
                        onChange={(e) => setCredDraft((p: any) => ({ ...(p || {}), twilio_account_sid: e.target.value }))}
                        placeholder="AC..."
                        className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Twilio Auth Token</label>
                      <input
                        value={credDraft.twilio_auth_token || ""}
                        onChange={(e) => setCredDraft((p: any) => ({ ...(p || {}), twilio_auth_token: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                    </div>
                    <div className="text-muted-foreground/50 text-[0.75rem]">Leave both blank to clear stored credentials.</div>
                  </div>
                )}

                {credKey === "google_maps" && (
                  <div>
                    <label className="block text-[0.75rem] text-muted-foreground/60 mb-2">Google Maps API key</label>
                    <input
                      value={credDraft.google_maps_api_key || ""}
                      onChange={(e) => setCredDraft((p: any) => ({ ...(p || {}), google_maps_api_key: e.target.value }))}
                      placeholder="AIza..."
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <div className="text-muted-foreground/50 text-[0.75rem] mt-2">Leave blank to clear stored key.</div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <BounceButton variant="ghost" size="sm" onClick={credSaving ? undefined : () => setCredKey(null)} className={credSaving ? "opacity-70 pointer-events-none" : ""}>
                  Cancel
                </BounceButton>
                <BounceButton variant="primary" size="sm" onClick={credSaving ? undefined : saveCreds} className={credSaving ? "opacity-70 pointer-events-none" : ""}>
                  {credSaving ? "Saving..." : "Save credentials"}
                </BounceButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
