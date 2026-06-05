"use client";

import { motion } from "motion/react";
import {
  LogOut,
  Package,
  ShoppingCart,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import Link from "next/link";
import {
  CarIcon,
  FactoryIcon,
  HammerIcon,
  MonitorIcon,
  CouchIcon,
  SolarPanelIcon,
  ShirtIcon,
  LipstickIcon,
  MineCartIcon,
  WheatIcon,
  BasketballIcon,
} from "./category-icons";

const categories = [
  { icon: <CarIcon />, label: "Auto" },
  { icon: <FactoryIcon />, label: "Industrial" },
  { icon: <HammerIcon />, label: "Tools" },
  { icon: <MonitorIcon />, label: "Electronics" },
  { icon: <CouchIcon />, label: "Furniture" },
  { icon: <SolarPanelIcon />, label: "Energy" },
  { icon: <ShirtIcon />, label: "Apparel" },
  { icon: <LipstickIcon />, label: "Beauty" },
  { icon: <MineCartIcon />, label: "Mining" },
  { icon: <WheatIcon />, label: "Agriculture" },
  { icon: <BasketballIcon />, label: "Sports" },
];

function readAuthed() {
  try {
    return Boolean(window.localStorage.getItem("vehsl.access") || "");
  } catch {
    return false;
  }
}

function clearAuth() {
  try {
    window.localStorage.removeItem("vehsl.access");
    window.localStorage.removeItem("vehsl.refresh");
    window.localStorage.removeItem("vehsl.user");
  } catch {}
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = wrapRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const logout = async () => {
    const refresh = (() => {
      try {
        return window.localStorage.getItem("vehsl.refresh") || "";
      } catch {
        return "";
      }
    })();

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
      const url =
        base && /^https?:\/\//.test(base) && !/\/\/backend(?=[:/]|$)/.test(base)
          ? `${base}/api/v1/auth/logout`
          : `${window.location.protocol}//${window.location.hostname || "localhost"}:8000/api/v1/auth/logout`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }).catch(() => null);
    } catch {}

    clearAuth();
    window.location.href = "/?signin=1";
  };

  const onOpen = () => {
    if (!readAuthed()) {
      window.location.href = "/?signin=1";
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <motion.button
        type="button"
        onClick={onOpen}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Profile"
        aria-expanded={open}
      >
        <User size={15} className="text-white" />
      </motion.button>
      {open ? (
        <div className="absolute right-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#0f1115] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <Package className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            My orders
          </Link>
          <Link
            href="/explore?profileSettings=1"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#0f1115] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <Settings className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            Profile settings
          </Link>
          <div className="h-px bg-black/[0.06]" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#d92d20] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <LogOut className="h-4 w-4 text-[#d92d20]" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function NavBar() {
  const { totalQuantity } = useCart();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <span style={{ fontSize: 22, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            Vehsl
          </span>

          {/* Category Icons - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => (
              <motion.button
                key={cat.label}
                className="w-12 h-10 rounded-[20px] flex items-center justify-center cursor-pointer text-[#56585D] hover:text-[#1d1d1f] transition-[color] duration-200"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  boxShadow: "0px 1px 6px 0px rgba(0,0,0,0.04)",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title={cat.label}
              >
                {cat.icon}
              </motion.button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-[color]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
            >
              <Search size={18} />
            </motion.button>

            <Link href="/checkout" className="relative">
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-[color]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
              >
                <ShoppingCart size={18} />
              </motion.div>
              {totalQuantity > 0 ? (
                <motion.div
                  key={totalQuantity}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-[#0071e3] flex items-center justify-center"
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: "white" }}>
                    {totalQuantity > 99 ? "99+" : totalQuantity}
                  </span>
                </motion.div>
              ) : null}
            </Link>

            <ProfileMenu />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
