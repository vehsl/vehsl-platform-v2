// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, UserPlus, Shield, ShieldCheck, Search, Filter, MoreHorizontal,
  Package, Eye, Edit3, Trash2, CheckCircle2, XCircle, Clock,
  Truck, MapPin, Fuel, AlertTriangle, ArrowRight, Calendar,
  Settings, Bell, Lock, Palette, Globe, Database, Mail,
  ChevronRight, ArrowUpRight, TrendingUp, BarChart3, Star, X,
  ClipboardCheck, Camera, Download, Upload, FileText, Hash,
} from "lucide-react";
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

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "buyer" | "seller" | "partner" | "manager">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "review" | "suspended">("all");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [menuUserId, setMenuUserId] = useState<number | null>(null);
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
      const msg =
        (data && (data.detail || data.error)) ||
        (typeof data === "string" ? data : "") ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

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
    setError("");
    setLoading(true);
    const t = setTimeout(() => {
      (async () => {
        try {
          const params = new URLSearchParams();
          if (search.trim()) params.set("q", search.trim());
          if (roleFilter !== "all") {
            if (roleFilter === "manager") {
              params.set("role", "admin");
              params.set("admin_role", "manager");
            } else {
              params.set("role", roleFilter);
            }
          }
          if (statusFilter !== "all") params.set("admin_status", statusFilter);
          const data = await fetchJson(`/api/v1/admin/users?${params.toString()}`);
          const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
          if (!cancelled) setUsers(rows);
        } catch (e: any) {
          if (!cancelled) {
            setUsers([]);
            setError(e?.message || "Failed to load users.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const onDoc = () => setMenuUserId(null);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

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
    setSaving(true);
    setFormError("");
    try {
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
      if ((form.password || "").trim()) payload.password = (form.password || "").trim();
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

  const resetPassword = async (u: any) => {
    const ok = typeof window !== "undefined" ? window.confirm("Reset password to Test123!@# ?") : false;
    if (!ok) return;
    try {
      const data = await fetchJson(`/api/v1/admin/users/${u.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "Test123!@#" }),
      });
      upsertUser(data);
      setMenuUserId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to reset password.");
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
        <BounceButton variant="primary" size="md" icon={<UserPlus size={16} />} onClick={openCreate}>Add User</BounceButton>
      </motion.div>

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

          {/* User List */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
              {error}
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
              return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors group"
              >
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
                        className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-border/40 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
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
                          onClick={() => resetPassword(user)}
                        >
                          <Lock size={14} className="text-muted-foreground/60" />
                          Reset Password
                        </button>
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
                  placeholder={formMode === "create" ? "Password (optional)" : "New password (optional)"}
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
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → PRODUCTS
// ════════════════════════════════════════════════════════════

export function AdminProducts() {
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
      const msg =
        (data && (data.detail || data.error)) ||
        (typeof data === "string" ? data : "") ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "low_stock" | "review">("all");
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
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
  });

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

  useEffect(() => {
    let cancelled = false;
    setError("");
    setLoading(true);
    const t = setTimeout(() => {
      (async () => {
        try {
          const params = new URLSearchParams();
          if (search.trim()) params.set("q", search.trim());
          if (catFilter !== "all") params.set("category", catFilter);
          if (statusFilter !== "all") params.set("admin_status", statusFilter);
          const data = await fetchJson(`/api/v1/admin/products/?${params.toString()}`);
          const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
          if (!cancelled) setProducts(rows);
        } catch (e: any) {
          if (!cancelled) {
            setProducts([]);
            setError(e?.message || "Failed to load products.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, catFilter, statusFilter]);

  const refreshStats = async () => {
    try {
      const statsData = await fetchJson("/api/v1/admin/products/stats");
      setStats(statsData);
    } catch {}
  };

  const openCreate = () => {
    setFormError("");
    setForm({
      name: "",
      seller_email: "",
      category_id: categories?.[0]?.id ? String(categories[0].id) : "",
      hs_code: "",
      currency: "USD",
      price: "",
      stock_units: "",
      status: "active",
    });
    setFormOpen(true);
  };

  const saveProduct = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload: any = {
        name: (form.name || "").trim(),
        seller_email: (form.seller_email || "").trim(),
        category_id: Number(form.category_id),
        currency: (form.currency || "USD").toString().toUpperCase(),
        price: Number(form.price),
        status: (form.status || "active").toString().toLowerCase(),
        hs_code: (form.hs_code || "").trim(),
      };
      const stock = (form.stock_units || "").toString().trim();
      if (stock !== "") payload.stock_units = Number(stock);

      const created = await fetchJson("/api/v1/admin/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setProducts(prev => [created, ...prev]);
      setFormOpen(false);
      await refreshStats();
    } catch (e: any) {
      setFormError(e?.message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async () => {
    try {
      const access = getAccess();
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (catFilter !== "all") params.set("category", catFilter);
      if (statusFilter !== "all") params.set("admin_status", statusFilter);
      const res = await fetch(`${apiBase()}/api/v1/admin/products/export/?${params.toString()}`, {
        headers: access ? { Authorization: `Bearer ${access}` } : {},
      });
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
      setError(e?.message || "Export failed.");
    }
  };

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

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "all" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter("all")}>
          <StatCard label="Total Products" value={formatNumber(stats?.total_products)} icon={<Package size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={0} accentColor="#0171E3" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "active" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "active" ? "all" : "active"))}>
          <StatCard label="Active Listings" value={formatNumber(stats?.active_listings)} icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "low_stock" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "low_stock" ? "all" : "low_stock"))}>
          <StatCard label="Low Stock" value={formatNumber(stats?.low_stock)} icon={<AlertTriangle size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={2} accentColor="#FFB224" />
        </button>
        <button type="button" className={`rounded-[1.25rem] ring-2 transition-all ${statusFilter === "review" ? "ring-primary/30" : "ring-transparent"}`} onClick={() => setStatusFilter(v => (v === "review" ? "all" : "review"))}>
          <StatCard label="Pending Review" value={formatNumber(stats?.pending_review)} icon={<Eye size={20} className="text-[#8B5CF6]" />} iconBg="bg-[#8B5CF6]/8" index={3} accentColor="#8B5CF6" />
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
              <button
                key="all"
                onClick={() => setCatFilter("all")}
                className={`px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer whitespace-nowrap ${catFilter === "all" ? "bg-primary/8 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"}`}
              >
                All
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

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#E5484D]/5 text-[#E5484D]/80 text-[0.8125rem]">
              {error}
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
                <div className="w-10 h-10 rounded-2xl bg-primary/6 flex items-center justify-center">
                  <Package size={18} className="text-primary/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-foreground truncate">{p.name}</span>
                    {!!p.hs_code && <span className="text-[0.6875rem] text-muted-foreground/40 hidden sm:inline">HS {p.hs_code}</span>}
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
              </motion.div>
            ))}
          </div>
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
                  <h2 className="text-foreground tracking-tight mb-1">Add Product</h2>
                  <p className="text-muted-foreground text-[0.8125rem]">Create a product and set inventory quantity.</p>
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
                <input
                  value={form.seller_email}
                  onChange={e => setForm((p: any) => ({ ...p, seller_email: e.target.value }))}
                  placeholder="Seller email"
                  className="w-full sm:col-span-2 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
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
                <select
                  value={form.status}
                  onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
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
                  {saving ? "Saving…" : "Create"}
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
//  ADMIN → LOGISTICS
// ════════════════════════════════════════════════════════════

const vehicleStatusColor: Record<string, string> = {
  "in-transit": "#3B82F6", loading: "#FFB224", idle: "#30A46C", maintenance: "#E5484D",
};

export function AdminLogistics() {
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
      const msg =
        (data && (data.detail || data.error)) ||
        (typeof data === "string" ? data : "") ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  const [stats, setStats] = useState<any>(null);
  const [flow, setFlow] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
        const [s, f, fl] = await Promise.all([
          fetchJson("/api/v1/admin/logistics/stats"),
          fetchJson("/api/v1/admin/logistics/flow?days=7"),
          fetchJson("/api/v1/admin/logistics/fleet?limit=8"),
        ]);
        if (cancelled) return;
        setStats(s);
        setFlow(Array.isArray(f) ? f : []);
        setFleet(Array.isArray(fl) ? fl : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load logistics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Logistics</h1>
        <p className="text-muted-foreground text-[0.875rem]">Fleet status, shipment flow, and delivery performance.</p>
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
          <h2 className="text-foreground text-[0.9375rem] mb-6">Fleet Status</h2>
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
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
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
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → QUALITY
// ════════════════════════════════════════════════════════════

const qualityInspections = [
  { id: "QI-482", product: "Herbal Tea Batch #284", seller: "GreenLeaf Organics", inspector: "Dr. Amara Johnson", status: "in-progress" as const, score: 82, date: "Mar 18, 2026" },
  { id: "QI-481", product: "LED Panel Light 60W", seller: "BrightStar Electronics", inspector: "Marcus Lee", status: "passed" as const, score: 96, date: "Mar 17, 2026" },
  { id: "QI-480", product: "Protein Energy Bar", seller: "FreshPack Foods", inspector: "Dr. Amara Johnson", status: "passed" as const, score: 91, date: "Mar 16, 2026" },
  { id: "QI-479", product: "Carbon Fiber Sheet", seller: "Atlas Materials", inspector: "Marcus Lee", status: "failed" as const, score: 54, date: "Mar 15, 2026" },
  { id: "QI-478", product: "Vitamin D3 Supplements", seller: "FreshPack Foods", inspector: "Dr. Amara Johnson", status: "passed" as const, score: 89, date: "Mar 14, 2026" },
];

const qualityTrend = [
  { month: "Oct", score: 86 }, { month: "Nov", score: 88 }, { month: "Dec", score: 87 },
  { month: "Jan", score: 91 }, { month: "Feb", score: 93 }, { month: "Mar", score: 92 },
];

export function AdminQuality() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[1100px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Quality Control</h1>
        <p className="text-muted-foreground text-[0.875rem]">Inspection results, compliance scores, and product quality trends.</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Avg Quality Score" value="92" icon={<Star size={20} className="text-[#FFB224]" />} iconBg="bg-[#FFB224]/8" index={0} accentColor="#FFB224" subtitle="out of 100" change="+3" changeType="positive" />
        <StatCard label="Pass Rate" value="94.2%" icon={<CheckCircle2 size={20} className="text-[#30A46C]" />} iconBg="bg-[#30A46C]/8" index={1} accentColor="#30A46C" />
        <StatCard label="Pending" value="7" icon={<Clock size={20} className="text-[#0171E3]" />} iconBg="bg-[#0171E3]/8" index={2} accentColor="#0171E3" subtitle="Awaiting inspection" />
        <StatCard label="Failed" value="3" icon={<XCircle size={20} className="text-[#E5484D]" />} iconBg="bg-[#E5484D]/8" index={3} accentColor="#E5484D" subtitle="This month" />
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <SectionCard className="lg:col-span-3">
          <h2 className="text-foreground text-[0.9375rem] mb-1">Quality Score Trend</h2>
          <p className="text-muted-foreground/50 text-[0.75rem] mb-4">Average inspection score over time</p>
          <CustomAreaChart data={qualityTrend} xKey="month" series={[{ dataKey: "score", color: "#0171E3" }]} height={180} yDomain={[70, 100]} />
        </SectionCard>
        <SectionCard className="lg:col-span-2">
          <h2 className="text-foreground text-[0.9375rem] mb-4">Score Distribution</h2>
          <HorizontalBarList
            data={[
              { label: "Excellent (90+)", value: 64, color: "#30A46C" },
              { label: "Good (80-89)", value: 22, color: "#3B82F6" },
              { label: "Fair (70-79)", value: 8, color: "#FFB224" },
              { label: "Poor (<70)", value: 6, color: "#E5484D" },
            ]}
            maxValue={100}
            valueFormatter={v => `${v}%`}
          />
        </SectionCard>
      </motion.div>

      <motion.div variants={stagger.item}>
        <SectionCard>
          <h2 className="text-foreground text-[0.9375rem] mb-6">Recent Inspections</h2>
          <div className="space-y-2">
            {qualityInspections.map((qi, i) => (
              <motion.div key={qi.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-muted/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: qi.score >= 90 ? "#30A46C10" : qi.score >= 70 ? "#FFB22410" : "#E5484D10" }}>
                  <span className="text-[0.875rem]" style={{ color: qi.score >= 90 ? "#30A46C" : qi.score >= 70 ? "#D97706" : "#E5484D" }}>{qi.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.875rem] text-foreground block truncate">{qi.product}</span>
                  <span className="text-[0.75rem] text-muted-foreground/50">{qi.seller} · {qi.inspector}</span>
                </div>
                <span className="text-[0.75rem] text-muted-foreground/40 hidden sm:block">{qi.date}</span>
                <StatusPill
                  status={qi.status === "passed" ? "success" : qi.status === "failed" ? "error" : "pending"}
                  label={qi.status}
                  pulse={qi.status === "in-progress"}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN → SETTINGS
// ════════════════════════════════════════════════════════════

const settingsSections = [
  {
    title: "General",
    icon: <Settings size={20} className="text-[#0171E3]" />,
    color: "#0171E3",
    items: [
      { label: "Platform Name", value: "TradeFlow", type: "text" as const },
      { label: "Default Currency", value: "USD", type: "select" as const },
      { label: "Timezone", value: "America/Chicago (CST)", type: "select" as const },
      { label: "Language", value: "English", type: "select" as const },
    ],
  },
  {
    title: "Notifications",
    icon: <Bell size={20} className="text-[#FFB224]" />,
    color: "#FFB224",
    items: [
      { label: "Email Notifications", value: "Enabled", type: "toggle" as const },
      { label: "Push Notifications", value: "Enabled", type: "toggle" as const },
      { label: "SMS Alerts", value: "Disabled", type: "toggle" as const },
      { label: "Daily Digest", value: "Enabled", type: "toggle" as const },
    ],
  },
  {
    title: "Security",
    icon: <Lock size={20} className="text-[#E5484D]" />,
    color: "#E5484D",
    items: [
      { label: "Two-Factor Auth", value: "Enabled", type: "toggle" as const },
      { label: "Session Timeout", value: "30 min", type: "select" as const },
      { label: "IP Whitelisting", value: "Disabled", type: "toggle" as const },
      { label: "Password Policy", value: "Strong (12+ chars)", type: "select" as const },
    ],
  },
  {
    title: "Integrations",
    icon: <Globe size={20} className="text-[#30A46C]" />,
    color: "#30A46C",
    items: [
      { label: "Stripe Payments", value: "Connected", type: "status" as const },
      { label: "SendGrid Email", value: "Connected", type: "status" as const },
      { label: "Twilio SMS", value: "Not Connected", type: "status" as const },
      { label: "Google Maps", value: "Connected", type: "status" as const },
    ],
  },
];

export function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [me, setMe] = useState<any>(null);
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
        const data = await res.json();
        setMe(data);
        setForm({
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
      }

      const refreshed = await fetch(`${apiBase}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        setMe(data);
        try {
          window.localStorage.setItem("vehsl.user", JSON.stringify(data));
        } catch {}
      }

      setSaved(true);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-8 max-w-[900px]">
      <motion.div variants={stagger.item}>
        <h1 className="text-foreground tracking-tight mb-1.5">Settings</h1>
        <p className="text-muted-foreground text-[0.875rem]">Manage your profile and account details.</p>
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
