"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Shield,
  Briefcase,
  HardHat,
  Scale,
  ArrowRight,
  Package,
  Headphones,
  Microscope,
  LogOut,
} from "lucide-react";
import { authedFetch } from "@/lib/api";

/*
 * PLATONIC RoleSelector
 * The first thing a user sees. It should feel like
 * opening a door — warm, clear, welcoming.
 * Each role card is a gentle invitation, not a choice paralysis.
 */

const roles = [
  {
    id: "admin",
    title: "Admin Portal",
    description:
      "Full platform control — users, verification, analytics, and system health.",
    icon: <Shield size={26} />,
    color: "#015AB6",
    stats: "14 active users · 2 pending",
    path: "/admin",
  },
  {
    id: "management",
    title: "Operations Hub",
    description:
      "Listings pipeline, scheduling, cost tracking, quality, and workforce.",
    icon: <Briefcase size={26} />,
    color: "#0171E3",
    stats: "24 orders · 4 scheduled today",
    path: "/management",
  },
  {
    id: "workers",
    title: "My Workday",
    description:
      "Today's tasks, routes, inspections, and packaging — your day, simplified.",
    icon: <HardHat size={26} />,
    color: "#30A46C",
    stats: "5 tasks today",
    path: "/workers",
  },
  {
    id: "legal",
    title: "Legal & Compliance",
    description:
      "Contracts, regulatory compliance, disputes, and documentation.",
    icon: <Scale size={26} />,
    color: "#D97706",
    stats: "6 contracts pending",
    path: "/legal",
  },
  {
    id: "support",
    title: "Support Center",
    description:
      "Customer tickets, seller requests, and issue resolution.",
    icon: <Headphones size={26} />,
    color: "#E5484D",
    stats: "4 open tickets",
    path: "/support",
  },
  {
    id: "inspector",
    title: "Inspector Portal",
    description:
      "Test products, prepare data sheets, and submit ratings for manager review.",
    icon: <Microscope size={26} />,
    color: "#8B5CF6",
    stats: "3 awaiting inspection",
    path: "/inspector",
  },
];

export function RoleSelector() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

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

  const visibleRoles = useMemo(() => {
    if (!user) return [];
    if (allowedRoleIds.length === 0) return [];
    const allow = new Set(allowedRoleIds);
    return roles.filter((r) => allow.has(r.id));
  }, [allowedRoleIds, user]);

  const logout = async () => {
    const refresh = (() => {
      try {
        return window.localStorage.getItem("vehsl.refresh") || "";
      } catch {
        return "";
      }
    })();
    try {
      await authedFetch(`/api/v1/auth/logout`, {
        method: "POST",
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

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 sm:p-8">
      {user && allowedRoleIds.length > 0 && (
        <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
          <motion.button
            type="button"
            onClick={logout}
            className="h-10 rounded-full bg-white/70 backdrop-blur-xl border border-black/[0.06] px-4 text-[12px] font-semibold text-foreground flex items-center gap-2 cursor-pointer"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        </div>
      )}
      <div className="w-full max-w-3xl">
        {/* Header — warm welcome */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/6 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              delay: 0.1,
            }}
          >
            <Package size={26} className="text-primary/70" />
          </motion.div>
          <h1 className="text-foreground mb-3 tracking-tight">
            Welcome to Vehsl
          </h1>
          <p className="text-muted-foreground/60 text-[0.9375rem] max-w-md mx-auto leading-relaxed">
            Choose your portal to get started.
          </p>
        </motion.div>

        {/* Role Cards — clean grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {visibleRoles.map((role, index) => (
            <motion.button
              key={role.id}
              onClick={() => navigate(role.path)}
              className={`group relative bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-xl rounded-[1.5rem] p-8 text-left 
                border border-black/[0.04] hover:border-black/[0.08]
                shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.02),0_0_0_1px_rgba(0,0,0,0.01)_inset]
                hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)_inset]
                transition-all duration-500 cursor-pointer overflow-hidden
                ${index === 0 && visibleRoles.length >= 5 ? "lg:col-span-2 lg:row-span-1" : ""}
                ${index === visibleRoles.length - 1 && visibleRoles.length % 3 === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.08 + 0.15,
                ease: [0.22, 0.68, 0.36, 1],
              }}
              whileHover={{ 
                y: -6, 
                scale: 1.02,
                transition: { duration: 0.4, ease: [0.22, 0.68, 0.36, 1] } 
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: `linear-gradient(135deg, ${role.color}03 0%, ${role.color}08 50%, transparent 100%), 
                             linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`
              }}
            >
              {/* Gradient mesh overlay */}
              <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${role.color}12 0%, transparent 60%),
                               radial-gradient(circle at 70% 80%, ${role.color}08 0%, transparent 50%)`
                }}
              />
              
              {/* Subtle grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.015] group-hover:opacity-[0.025] transition-opacity duration-500 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(${role.color} 1px, transparent 1px), linear-gradient(90deg, ${role.color} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <motion.div
                    className="relative w-14 h-14 rounded-[1.125rem] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    style={{
                      background: `linear-gradient(135deg, ${role.color}18 0%, ${role.color}28 100%)`,
                      color: role.color,
                    }}
                    whileHover={{ 
                      rotate: [0, -8, 8, 0],
                      scale: [1, 1.08, 1.08, 1],
                      transition: { duration: 0.6 } 
                    }}
                  >
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 rounded-[1.125rem] opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-700"
                      style={{ background: role.color }}
                    />
                    <span className="relative z-10">{role.icon}</span>
                  </motion.div>

                  <motion.div 
                    className="p-2.5 rounded-xl bg-black/[0.02] backdrop-blur-sm border border-black/[0.02] group-hover:bg-black/[0.04] group-hover:border-black/[0.06] transition-all duration-400"
                    whileHover={{ x: 3, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                  >
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground/25 group-hover:text-primary/70 transition-all duration-400"
                      strokeWidth={2.5}
                    />
                  </motion.div>
                </div>

                <div className={index === 0 ? "lg:grid lg:grid-cols-2 lg:gap-8" : ""}>
                  <div>
                    <h3 className="text-[1.0625rem] text-foreground/95 mb-2 tracking-[-0.01em] font-medium group-hover:text-foreground transition-colors duration-400">
                      {role.title}
                    </h3>
                    <p className="text-muted-foreground/55 text-[0.8125rem] leading-[1.6] mb-5 group-hover:text-muted-foreground/70 transition-colors duration-400">
                      {role.description}
                    </p>
                  </div>

                  <div className={index === 0 ? "lg:flex lg:items-end" : ""}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.02] border border-black/[0.03] group-hover:bg-black/[0.04] group-hover:border-black/[0.05] transition-all duration-400">
                      <div 
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: role.color }}
                      />
                      <p className="text-[0.6875rem] text-muted-foreground/45 tabular-nums tracking-tight">
                        {role.stats}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${role.color}40, transparent)`
                }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 0.68, 0.36, 1] }}
              />
            </motion.button>
          ))}
        </div>

        {user && allowedRoleIds.length === 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground/70">
            This page is only available for admin and managers.
          </div>
        )}

        {/* Footer */}
        <motion.p
          className="text-center text-muted-foreground/35 text-[0.75rem] mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Each portal is tailored to your role. You can switch anytime from the
          sidebar.
        </motion.p>
      </div>
    </div>
  );
}
