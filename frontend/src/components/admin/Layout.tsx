"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useBounce } from "./BounceContext";
import {
  LayoutDashboard, Settings, Users, Truck, Shield, ClipboardCheck,
  Package, Bell, Search, ChevronRight, LogOut, Menu, X,
  Scale, FileText, AlertTriangle, Home, Briefcase, HardHat,
  Layers, Calendar, Receipt, Camera, Headphones, Fingerprint,
  TrendingUp, Play, Star, BookOpen, Globe, MessageCircle,
  Microscope, BarChart3, History
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

const roleNavs: Record<string, { title: string; emoji: string; items: NavItem[] }> = {
  admin: {
    title: "Admin",
    emoji: "shield",
    items: [
      { icon: <LayoutDashboard size={20} />, label: "Overview", path: "/admin" },
      { icon: <Users size={20} />, label: "Users", path: "/admin/users" },
      { icon: <Package size={20} />, label: "Products", path: "/admin/products" },
      { icon: <Truck size={20} />, label: "Logistics", path: "/admin/logistics" },
      { icon: <ClipboardCheck size={20} />, label: "Quality", path: "/admin/quality" },
      { icon: <Fingerprint size={20} />, label: "Verification", path: "/admin/verification", badge: 2 },
      { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
    ],
  },
  management: {
    title: "Operations",
    emoji: "briefcase",
    items: [
      { icon: <LayoutDashboard size={20} />, label: "Command Center", path: "/management" },
      { icon: <TrendingUp size={20} />, label: "Seller Trends", path: "/management/trends", badge: 9 },
      { icon: <Play size={20} />, label: "Product Reels", path: "/management/reels", badge: 6 },
      { icon: <Layers size={20} />, label: "Listings", path: "/management/listings", badge: 5 },
      { icon: <Calendar size={20} />, label: "Scheduling", path: "/management/scheduling", badge: 4 },
      { icon: <Receipt size={20} />, label: "Cost Ledger", path: "/management/costs" },
      { icon: <Camera size={20} />, label: "Quality Issues", path: "/management/quality-issues", badge: 2 },
      { icon: <Package size={20} />, label: "Order Pipeline", path: "/management/orders", badge: 24 },
      { icon: <Truck size={20} />, label: "Deliveries", path: "/management/deliveries", badge: 12 },
      { icon: <Users size={20} />, label: "Workforce", path: "/management/workforce" },
      { icon: <Briefcase size={20} />, label: "B2B Accounts", path: "/management/b2b" },
    ],
  },
  workers: {
    title: "My Work",
    emoji: "hardhat",
    items: [
      { icon: <Home size={20} />, label: "My Day", path: "/workers" },
      { icon: <ClipboardCheck size={20} />, label: "Tasks", path: "/workers/tasks", badge: 5 },
      { icon: <Truck size={20} />, label: "Routes", path: "/workers/routes" },
      { icon: <Shield size={20} />, label: "Inspections", path: "/workers/inspections", badge: 3 },
      { icon: <Package size={20} />, label: "Packaging", path: "/workers/packaging" },
    ],
  },
  legal: {
    title: "Legal",
    emoji: "scale",
    items: [
      { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/legal" },
      { icon: <Globe size={20} />, label: "Trade Compliance", path: "/legal/trade-compliance", badge: 4 },
      { icon: <MessageCircle size={20} />, label: "Team Hub", path: "/legal/team-hub", badge: 3 },
      { icon: <FileText size={20} />, label: "Contracts", path: "/legal/contracts", badge: 6 },
      { icon: <Shield size={20} />, label: "Compliance", path: "/legal/compliance" },
      { icon: <AlertTriangle size={20} />, label: "Disputes", path: "/legal/disputes", badge: 2 },
      { icon: <Scale size={20} />, label: "Regulations", path: "/legal/regulations" },
    ],
  },
  support: {
    title: "Support",
    emoji: "headphones",
    items: [
      { icon: <Headphones size={20} />, label: "Conversations", path: "/support", badge: 4 },
      { icon: <BookOpen size={20} />, label: "Knowledge Base", path: "/support/knowledge" },
    ],
  },
  inspector: {
    title: "Inspector",
    emoji: "microscope",
    items: [
      { icon: <Microscope size={20} />, label: "Inspections", path: "/inspector", badge: 3 },
    ],
  },
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield size={18} />,
  management: <Briefcase size={18} />,
  workers: <HardHat size={18} />,
  legal: <Scale size={18} />,
  support: <Headphones size={18} />,
  inspector: <Microscope size={18} />,
};

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastBounceTime, getIntensity } = useBounce();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(7);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(true);

  const currentRole = location.pathname.split("/")[1] || "admin";
  const nav = roleNavs[currentRole] || roleNavs.admin;

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

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

  useEffect(() => {
    const access = (() => {
      try {
        return window.localStorage.getItem("vehsl.access") || "";
      } catch {
        return "";
      }
    })();
    if (!access) return;

    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!res.ok) return;
        const me = await res.json();
        try {
          window.localStorage.setItem("vehsl.user", JSON.stringify(me));
        } catch {}
        setUser(me);
      } catch {}
    })();
  }, []);

  const initials = useMemo(() => {
    const first = (user?.first_name || "").toString().trim();
    const last = (user?.last_name || "").toString().trim();
    const email = (user?.email || "").toString().trim();
    const base = `${first} ${last}`.trim();
    const letters =
      base
        ? base
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p: string) => p[0]?.toUpperCase())
            .join("")
        : email && email.includes("@")
          ? email[0]?.toUpperCase() || "U"
          : "U";
    return letters || "U";
  }, [user]);

  const logout = async () => {
    const refresh = (() => {
      try {
        return window.localStorage.getItem("vehsl.refresh") || "";
      } catch {
        return "";
      }
    })();
    const access = (() => {
      try {
        return window.localStorage.getItem("vehsl.access") || "";
      } catch {
        return "";
      }
    })();

    try {
      await fetch(`${apiBase()}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {}

    try {
      window.localStorage.removeItem("vehsl.access");
      window.localStorage.removeItem("vehsl.refresh");
      window.localStorage.removeItem("vehsl.user");
    } catch {}
    window.location.assign("/");
  };

  const allowedRoleIds = useMemo(() => {
    const role = (user?.role || "").toString().toLowerCase();
    if (role !== "admin") return [];

    const explicit = user?.admin_portals;
    if (Array.isArray(explicit) && explicit.every((x: any) => typeof x === "string")) {
      return explicit.map((x: string) => x.toLowerCase());
    }

    const adminRole = (user?.admin_profile?.admin_role || "").toString().toLowerCase();
    if (!adminRole || adminRole === "super_admin") {
      return ["admin", "management", "workers", "legal", "support", "inspector"];
    }
    if (adminRole === "logistics" || adminRole === "finance") return ["management", "workers"];
    if (adminRole === "compliance") return ["legal", "workers"];
    if (adminRole === "support") return ["support", "workers"];
    if (adminRole === "inspector") return ["inspector", "workers"];
    return ["workers"];
  }, [user]);

  const allowedRoleNavKeys = useMemo(() => {
    const keys = new Set(Object.keys(roleNavs));
    return allowedRoleIds.filter((k) => keys.has(k));
  }, [allowedRoleIds]);

  useEffect(() => {
    if (allowedRoleNavKeys.length === 0) return;
    if (!allowedRoleNavKeys.includes(currentRole)) {
      navigate(`/${allowedRoleNavKeys[0]}`, { replace: true });
    }
  }, [allowedRoleNavKeys, currentRole, navigate]);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Role-aware notifications
  const roleNotifications: Record<string, { id: number; icon: React.ReactNode; color: string; title: string; body: string; time: string; unread: boolean; path?: string }[]> = {
    admin: [
      { id: 1, icon: <Fingerprint size={15} />, color: "#8B5CF6", title: "Buyer verification pending", body: "Meridian Corp submitted 3 documents for release approval", time: "3 min ago", unread: true, path: "/admin/verification" },
      { id: 2, icon: <AlertTriangle size={15} />, color: "#E5484D", title: "Compliance flag raised", body: "HS 8518.30 rule conflict detected for India → US route", time: "12 min ago", unread: true, path: "/admin/quality" },
      { id: 3, icon: <Users size={15} />, color: "#0171E3", title: "New user registration", body: "GreenLeaf Organics joined as a seller", time: "28 min ago", unread: true },
      { id: 4, icon: <Package size={15} />, color: "#D97706", title: "Inventory alert", body: "LED Panel stock below threshold — 12 units remaining", time: "1h ago", unread: false },
      { id: 5, icon: <Truck size={15} />, color: "#30A46C", title: "Delivery completed", body: "ORD-4819 delivered to FreshPack HQ successfully", time: "2h ago", unread: false },
    ],
    management: [
      { id: 1, icon: <TrendingUp size={15} />, color: "#0171E3", title: "Seller trend spike", body: "GreenLeaf Organics orders up 340% this week", time: "5 min ago", unread: true, path: "/management/trends" },
      { id: 2, icon: <Package size={15} />, color: "#E5484D", title: "24 orders need attention", body: "7 orders overdue, 3 pending seller confirmation", time: "10 min ago", unread: true, path: "/management/orders" },
      { id: 3, icon: <Camera size={15} />, color: "#D97706", title: "Quality issue reported", body: "Batch #284 failed visual inspection — photos attached", time: "22 min ago", unread: true, path: "/management/quality-issues" },
      { id: 4, icon: <Truck size={15} />, color: "#30A46C", title: "12 deliveries in transit", body: "3 arriving within the hour", time: "35 min ago", unread: false, path: "/management/deliveries" },
      { id: 5, icon: <Calendar size={15} />, color: "#8B5CF6", title: "Schedule conflict", body: "Driver Ahmed has overlapping pickups at 2:00 PM", time: "1h ago", unread: false, path: "/management/scheduling" },
    ],
    workers: [
      { id: 1, icon: <Truck size={15} />, color: "#30A46C", title: "New delivery assigned", body: "Deliver to Meridian Corp — Container from Mumbai Port", time: "2 min ago", unread: true, path: "/workers" },
      { id: 2, icon: <AlertTriangle size={15} />, color: "#E5484D", title: "Urgent: Route changed", body: "Pickup from GreenLeaf moved to 78 Market Ave due to road closure", time: "8 min ago", unread: true, path: "/workers/routes" },
      { id: 3, icon: <ClipboardCheck size={15} />, color: "#0171E3", title: "Inspection reminder", body: "Herbal Tea Batch #284 inspection due by 10:30 AM", time: "15 min ago", unread: true, path: "/workers/inspections" },
      { id: 4, icon: <Star size={15} />, color: "#FFB224", title: "Great feedback!", body: "Buyer James Rodriguez rated your last delivery 5 stars", time: "1h ago", unread: false },
      { id: 5, icon: <Package size={15} />, color: "#D97706", title: "Packaging specs updated", body: "Gift Box — Premium Tea Set now requires double wrap", time: "2h ago", unread: false, path: "/workers/packaging" },
    ],
    legal: [
      { id: 1, icon: <Globe size={15} />, color: "#E5484D", title: "Trade rule violation risk", body: "HS 8518.30 shipment India→US may require additional cert", time: "5 min ago", unread: true, path: "/legal/trade-compliance" },
      { id: 2, icon: <FileText size={15} />, color: "#0171E3", title: "Contract awaiting review", body: "GreenLeaf Organics seller agreement — 6 clauses flagged", time: "18 min ago", unread: true, path: "/legal/contracts" },
      { id: 3, icon: <MessageCircle size={15} />, color: "#8B5CF6", title: "Team Hub: New message", body: "Sarah posted in #asia-compliance about tariff update", time: "30 min ago", unread: true, path: "/legal/team-hub" },
      { id: 4, icon: <AlertTriangle size={15} />, color: "#D97706", title: "Dispute escalation", body: "Buyer dispute #D-2847 escalated to mediation", time: "1h ago", unread: false, path: "/legal/disputes" },
      { id: 5, icon: <Scale size={15} />, color: "#30A46C", title: "Regulation update", body: "EU CBAM reporting deadline extended to April 30", time: "3h ago", unread: false, path: "/legal/regulations" },
    ],
    support: [
      { id: 1, icon: <Headphones size={15} />, color: "#E5484D", title: "Urgent ticket", body: "Buyer unable to access verification portal — account locked", time: "3 min ago", unread: true, path: "/support" },
      { id: 2, icon: <BookOpen size={15} />, color: "#0171E3", title: "Knowledge Base update", body: "New article on shipping delays added", time: "20 min ago", unread: true, path: "/support/knowledge" },
      { id: 3, icon: <Star size={15} />, color: "#FFB224", title: "New feedback received", body: "Meridian Corp left a 4-star review with suggestions", time: "45 min ago", unread: true, path: "/support/feedback" },
      { id: 4, icon: <Headphones size={15} />, color: "#0171E3", title: "Ticket resolved", body: "Shipping delay inquiry #T-4421 closed by auto-resolve", time: "2h ago", unread: false },
    ],
    inspector: [
      { id: 1, icon: <Microscope size={15} />, color: "#0171E3", title: "New inspection", body: "Batch #284 requires visual inspection", time: "5 min ago", unread: true, path: "/inspector" },
      { id: 2, icon: <ClipboardCheck size={15} />, color: "#E5484D", title: "Test failed", body: "Batch #284 failed visual inspection — photos attached", time: "10 min ago", unread: true, path: "/inspector/active" },
      { id: 3, icon: <BarChart3 size={15} />, color: "#8B5CF6", title: "Inspection report", body: "Batch #284 inspection report available", time: "22 min ago", unread: true, path: "/inspector/reports" },
      { id: 4, icon: <History size={15} />, color: "#30A46C", title: "Inspection history", body: "View inspection history for Batch #284", time: "35 min ago", unread: false, path: "/inspector/history" },
    ],
  };

  const currentNotifs = roleNotifications[currentRole] || roleNotifications.admin;
  const unreadCount = currentNotifs.filter(n => n.unread).length;

  return (
    <div className="flex min-h-dvh h-dvh bg-background overflow-x-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col bg-card border-r border-black/[0.03] p-6 gap-1 overflow-hidden"
        initial={{ x: -24, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: sidebarHovered ? "280px" : "80px"
        }}
        transition={{ duration: 0.6, ease: [0.22, 0.68, 0.36, 1] }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Logo & Role */}
        <div className="flex items-center gap-3.5 mb-1 px-2 py-1">
          <motion.div
            className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-primary to-primary/85 flex items-center justify-center text-primary-foreground shadow-[0_2px_8px_rgba(1,113,227,0.2)] flex-shrink-0"
            whileHover={{ scale: 1.06, rotate: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Package size={19} />
          </motion.div>
          <motion.div 
            className="flex flex-col overflow-hidden"
            animate={{ opacity: sidebarHovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.68, 0.36, 1] }}
          >
            <p className="text-[0.9375rem] text-foreground tracking-[-0.01em] whitespace-nowrap">TradeFlow</p>
            <p className="text-[0.6875rem] text-muted-foreground/70 tracking-wide uppercase whitespace-nowrap">{nav.title} Portal</p>
          </motion.div>
        </div>

        {/* Role Switcher */}
        <motion.div 
          className="flex gap-0.5 p-[3px] bg-black/[0.025] rounded-full mb-5 mt-4"
          animate={{ 
            opacity: sidebarHovered ? 1 : 0,
            height: sidebarHovered ? "auto" : "0px",
            marginBottom: sidebarHovered ? "1.25rem" : "0px",
            marginTop: sidebarHovered ? "1rem" : "0px",
            paddingTop: sidebarHovered ? "3px" : "0px",
            paddingBottom: sidebarHovered ? "3px" : "0px"
          }}
          transition={{ duration: 0.3, ease: [0.22, 0.68, 0.36, 1] }}
          style={{ overflow: "hidden" }}
        >
          {(allowedRoleNavKeys.length ? allowedRoleNavKeys : Object.keys(roleNavs)).map((role) => (
            <motion.button
              key={role}
              onClick={() => navigate(`/${role}`)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[0.6875rem] transition-colors duration-300 cursor-pointer ${
                currentRole === role
                  ? "text-foreground"
                  : "text-muted-foreground/40 hover:text-muted-foreground/70"
              }`}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {currentRole === role && (
                <motion.div
                  layoutId="roleSwitcherBg"
                  className="absolute inset-0 bg-card rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {roleIcons[role]}
                <span className="hidden xl:inline capitalize">{role === "workers" ? "Work" : role === "management" ? "Ops" : role}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5">
          {nav.items.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-[0.8125rem] transition-colors duration-300 cursor-pointer ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/55 hover:text-foreground"
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.08 * index + 0.2,
                  duration: 0.35,
                  ease: [0.22, 0.68, 0.36, 1],
                }}
                whileHover={{ x: 3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 600, damping: 20 } }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute bg-primary/[0.06] rounded-[14px]"
                    style={{
                      left: sidebarHovered ? 0 : "50%",
                      right: sidebarHovered ? 0 : "auto",
                      width: sidebarHovered ? "100%" : "48px",
                      height: sidebarHovered ? "100%" : "48px",
                      top: sidebarHovered ? 0 : "50%",
                      bottom: sidebarHovered ? 0 : "auto",
                      transform: sidebarHovered ? "translate(0%, 0%)" : "translate(-50%, -50%)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-300 flex-shrink-0 ${isActive ? "text-primary" : ""}`}>{item.icon}</span>
                <motion.span 
                  className="relative z-10 flex-1 text-left whitespace-nowrap overflow-hidden"
                  animate={{ opacity: sidebarHovered ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 0.68, 0.36, 1] }}
                >
                  {item.label}
                </motion.span>
                {item.badge && (
                  <motion.span
                    className={`relative z-10 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[0.625rem] flex-shrink-0 overflow-hidden ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-black/[0.04] text-muted-foreground/70"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: sidebarHovered ? 1 : 0,
                      opacity: sidebarHovered ? 1 : 0,
                    }}
                    style={{
                      marginRight: sidebarHovered ? "7px" : "0px"
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.08 * index + 0.35 }}
                  >
                    {item.badge}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute z-10 right-2 w-[3px] h-5 rounded-full bg-primary"
                    animate={{ opacity: sidebarHovered ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-2 pt-5 border-t border-black/[0.03]">
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-card z-50 p-5 flex flex-col gap-2 shadow-xl"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                    <Package size={20} />
                  </div>
                  <p className="text-[0.9375rem] text-foreground">TradeFlow</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-1.5 p-1.5 bg-muted/40 rounded-2xl mb-4">
                {(allowedRoleNavKeys.length ? allowedRoleNavKeys : Object.keys(roleNavs)).map((role) => (
                  <button
                    key={role}
                    onClick={() => { navigate(`/${role}`); setMobileOpen(false); }}
                    className={`flex-1 flex items-center justify-center py-2 rounded-xl text-[0.6875rem] transition-all duration-300 cursor-pointer capitalize ${
                      currentRole === role
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {role === "workers" ? "Work" : role === "management" ? "Ops" : role}
                  </button>
                ))}
              </div>

              <nav className="flex-1 space-y-1">
                {nav.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[0.8125rem] transition-all cursor-pointer ${
                        isActive ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[0.625rem] ${
                          isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}>{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <motion.header
          className="h-[68px] flex items-center justify-between px-6 lg:px-10 bg-card/70 backdrop-blur-2xl border-b border-black/[0.03]"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-black/[0.03] cursor-pointer"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="text-[0.875rem] text-foreground/80">{greeting} <span className="text-muted-foreground/30">·</span> <span className="text-muted-foreground/50 text-[0.8125rem]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-black/[0.025] rounded-2xl px-4 py-2.5 min-w-[220px] transition-all duration-400 focus-within:bg-card focus-within:shadow-[0_0_0_2px_rgba(1,113,227,0.1)]">
              <Search size={15} className="text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 w-full"
              />
              <kbd className="hidden lg:inline text-[0.5625rem] text-muted-foreground/40 bg-card px-1.5 py-0.5 rounded-md border border-black/[0.04]">/</kbd>
            </div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                className="relative p-2.5 rounded-xl hover:bg-black/[0.03] transition-all cursor-pointer"
                whileTap={{ scale: 0.92 }}
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={19} className="text-muted-foreground/50" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E5484D] text-white text-[0.5rem] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notification Panel */}
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setNotifOpen(false)}
                    />
                    <motion.div
                      className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-card rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.04)] z-50 overflow-hidden"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[0.9375rem] text-foreground tracking-tight">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-[0.625rem] tabular-nums">{unreadCount} new</span>
                          )}
                        </div>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors cursor-pointer"
                        >
                          <X size={14} className="text-muted-foreground/40" />
                        </button>
                      </div>

                      {/* Notification list */}
                      <div className="max-h-[420px] overflow-y-auto px-2 pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.06) transparent" }}>
                        {currentNotifs.map((notif, i) => (
                          <motion.button
                            key={notif.id}
                            className={`w-full flex items-start gap-3 px-3 py-3.5 rounded-xl text-left transition-all cursor-pointer group ${
                              notif.unread ? "bg-primary/[0.02] hover:bg-primary/[0.05]" : "hover:bg-black/[0.02]"
                            }`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => {
                              if (notif.path) {
                                navigate(notif.path);
                                setNotifOpen(false);
                              }
                            }}
                          >
                            {/* Icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: `${notif.color}10` }}
                            >
                              <span style={{ color: notif.color }}>{notif.icon}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-[0.8125rem] truncate ${notif.unread ? "text-foreground" : "text-foreground/55"}`}>{notif.title}</p>
                                {notif.unread && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[0.75rem] text-muted-foreground/45 mt-0.5 line-clamp-2">{notif.body}</p>
                              <p className="text-[0.625rem] text-muted-foreground/30 mt-1.5 tabular-nums">{notif.time}</p>
                            </div>

                            {/* Navigate arrow for actionable notifs */}
                            {notif.path && (
                              <ChevronRight size={13} className="text-muted-foreground/20 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 border-t border-black/[0.03]">
                        <button
                          className="w-full text-center text-[0.75rem] text-primary/60 hover:text-primary transition-colors cursor-pointer py-1"
                          onClick={() => setNotifOpen(false)}
                        >
                          Mark all as read
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setProfileOpen((s) => !s)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-primary-foreground text-[0.6875rem] cursor-pointer"
                whileTap={{ scale: 0.95 }}
              >
                {initials}
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setProfileOpen(false)}
                    />
                    <motion.div
                      className="absolute right-0 top-[calc(100%+10px)] w-[92vw] max-w-[320px] bg-card rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.04)] z-50 overflow-hidden"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <div className="px-5 pt-5 pb-4 border-b border-black/[0.03]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[0.875rem]">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.875rem] text-foreground truncate">
                              {((user?.first_name || "") + " " + (user?.last_name || "")).trim() || "Account"}
                            </p>
                            <p className="text-[0.75rem] text-muted-foreground/60 truncate">{user?.email || user?.phone || ""}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        {currentRole === "admin" && (
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.8125rem] text-foreground/80 hover:bg-black/[0.02] transition-colors cursor-pointer"
                            onClick={() => {
                              navigate("/admin/settings");
                              setProfileOpen(false);
                            }}
                          >
                            <Settings size={18} className="text-muted-foreground/55" />
                            Profile Settings
                          </button>
                        )}
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.8125rem] text-foreground/80 hover:bg-black/[0.02] transition-colors cursor-pointer"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                        >
                          <LogOut size={18} className="text-muted-foreground/55" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
            <div className="mx-auto max-w-[1440px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12, scale: 0.998 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.998 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    opacity: { duration: 0.3 },
                  }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
              {/* Scroll comfort — generous bottom breathing room */}
              <div className="h-12 lg:h-16" aria-hidden />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
