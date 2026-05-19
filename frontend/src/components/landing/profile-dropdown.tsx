"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  MessageCircle,
  Heart,
  Store,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Package,
  Truck,
} from "lucide-react";
import { SellerVerificationModal } from "./seller-verification-modal";

const spring = { type: "spring", bounce: 0.32, duration: 0.38 } as const;
const snappy = { type: "spring", bounce: 0.45, duration: 0.26 } as const;

// ─── Menu item ────────────────────────────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  accent,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  accent?: boolean;
  sub?: string;
}) {
  const [hov, setHov] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.974 }}
      transition={snappy}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center gap-3 h-[46px] px-3 rounded-[14px] cursor-pointer text-left"
      style={{
        background: hov
          ? danger
            ? "rgba(255,59,48,0.055)"
            : accent
            ? "rgba(0,113,227,0.055)"
            : "rgba(0,0,0,0.033)"
          : "rgba(0,0,0,0)",
      }}
    >
      <div className="w-[18px] flex items-center justify-center shrink-0">
        <Icon
          size={15}
          strokeWidth={1.6}
          style={{
            color: danger ? "rgba(255,59,48,0.72)" : accent ? "#0071e3" : "#99999a",
            transition: "color 0.15s",
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-[13.5px] leading-none block"
          style={{
            fontWeight: 500,
            fontFamily: "Urbanist, sans-serif",
            color: danger
              ? "rgba(255,59,48,0.82)"
              : accent
              ? "#0071e3"
              : "rgba(29,29,31,0.82)",
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            className="text-[11px] text-[#b4b4b4] block mt-0.5"
            style={{ fontWeight: 420, fontFamily: "Urbanist, sans-serif" }}
          >
            {sub}
          </span>
        )}
      </div>
      {accent && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.4, delay: 0.15 }}
          className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: "rgba(0,113,227,0.09)",
            color: "#0071e3",
            fontWeight: 640,
            border: "1px solid rgba(0,113,227,0.14)",
            fontFamily: "Urbanist, sans-serif",
          }}
        >
          New
        </motion.span>
      )}
    </motion.button>
  );
}

function Divider() {
  return (
    <div
      className="h-px my-1.5 mx-0 rounded-full"
      style={{ background: "rgba(0,0,0,0.048)" }}
    />
  );
}

function apiBase() {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  const normalize = (u: string) => u.replace(/\/$/, "");
  if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
  const host = (window.location.hostname === "0.0.0.0" || window.location.hostname === "") ? "localhost" : window.location.hostname;
  return normalize(`${window.location.protocol}//${host}:8000`);
}

function readAuthTokens() {
  try {
    return {
      access: window.localStorage.getItem("vehsl.access") || "",
      refresh: window.localStorage.getItem("vehsl.refresh") || "",
      user: (() => {
        const raw = window.localStorage.getItem("vehsl.user");
        return raw ? JSON.parse(raw) : null;
      })(),
    };
  } catch {
    return { access: "", refresh: "", user: null };
  }
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

type ActivityItem = { label: string; detail?: string | null; color: string };

function ActivityLine({ items }: { items: ActivityItem[] }) {

  return (
    <div className="flex flex-wrap gap-1.5 justify-center mt-2">
      {items.map(({ label, color }, i) => (
        <motion.span
          key={label}
          initial={{ opacity: 0, scale: 0.85, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.38, delay: 0.12 + i * 0.07 }}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px]"
          style={{
            background: `${color}0f`,
            border: `1px solid ${color}22`,
            color,
            fontWeight: 580,
            fontFamily: "Urbanist, sans-serif",
          }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main ProfileDropdown ─────────────────────────────────────────────────

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menuSummary, setMenuSummary] = useState<any | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBecomeSeller = () => {
    setOpen(false);
    setTimeout(() => setSellerOpen(true), 140);
  };

  useEffect(() => {
    if (!open) return;
    const { access } = readAuthTokens();
    if (!access) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/me/menu`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (res.status === 401) return;
        const data = await res.json().catch(() => null);
        if (!res.ok) return;
        setMenuSummary(data);
        if (data?.user) {
          setAuthUser(data.user);
          try {
            window.localStorage.setItem("vehsl.user", JSON.stringify(data.user));
          } catch {}
        }
      } catch {}
    })();
  }, [open]);

  useEffect(() => {
    if (authUser) return;
    const { user } = readAuthTokens();
    if (user) setAuthUser(user);
  }, [authUser]);

  const displayName = (() => {
    const first = (authUser?.first_name || "").toString().trim();
    const last = (authUser?.last_name || "").toString().trim();
    const full = `${first} ${last}`.trim();
    return full || (authUser?.email || authUser?.phone || "Account");
  })();
  const initial = ((displayName || "A").trim()[0] || "A").toUpperCase();

  const updates = Array.isArray(menuSummary?.updates) ? menuSummary.updates : [];
  const activityItems: ActivityItem[] = updates.slice(0, 3).map((u: any) => ({
    label: (u?.headline || "Update").toString(),
    detail: (u?.meta || "").toString() || null,
    color: (u?.tint || "#0071e3").toString(),
  }));

  const counts = menuSummary?.counts || {};
  const ordersOnWay = Number(counts.orders_on_the_way || 0);
  const unreadMessages = Number(counts.unread_messages || 0);
  const wishlistItems = Number(counts.wishlist_items || 0);

  const handleLogout = async () => {
    const { access, refresh } = readAuthTokens();
    if (access) {
      try {
        await fetch(`${apiBase()}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
      } catch {}
    }
    try {
      window.localStorage.removeItem("vehsl.access");
      window.localStorage.removeItem("vehsl.refresh");
      window.localStorage.removeItem("vehsl.user");
    } catch {}
    window.location.href = "/";
  };

  return (
    <>
      <div ref={wrapperRef} className="relative hidden md:block">
        {/* Avatar */}
        <motion.button
          whileTap={{ scale: 0.91 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.28 }}
          onClick={() => setOpen((v) => !v)}
          className="w-[44px] h-[44px] rounded-full cursor-pointer relative select-none"
          style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
            boxShadow: open
              ? "0 0 0 3px rgba(0,113,227,0.2), 0 2px 10px rgba(0,113,227,0.22)"
              : "0 2px 10px rgba(0,113,227,0.18)",
          }}
          aria-label="Open profile menu"
        >
          <span
            className="absolute inset-0 flex items-center justify-center text-white text-[15px]"
            style={{ fontWeight: 720, fontFamily: "Urbanist, sans-serif" }}
          >
            {initial}
          </span>
          <motion.span
            animate={{ scale: open ? 1.15 : 1 }}
            transition={snappy}
            className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-[#34c759] border-[2px] border-white"
          />
        </motion.button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              transition={spring}
              className="absolute top-[calc(100%+12px)] right-0 z-[100] origin-top-right"
              style={{ width: 288 }}
            >
              <div
                className="rounded-[26px] overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "0.5px solid rgba(255,255,255,0.9)",
                  boxShadow:
                    "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02), 0 12px 32px rgba(0,0,0,0.09), 0 40px 80px rgba(0,0,0,0.12)",
                }}
              >
                <div className="p-3.5">
                  {/* Greeting */}
                  <div
                    className="text-center pb-3 mb-1"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <p
                      className="text-[15px] text-[#1d1d1f]"
                      style={{
                        fontWeight: 660,
                        fontFamily: "Urbanist, sans-serif",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {greetingText()}, {displayName}
                    </p>
                    <ActivityLine
                      items={
                        activityItems.length
                          ? activityItems
                          : [
                              { label: "Updates", detail: null, color: "#0071e3" },
                              { label: "Messages", detail: null, color: "#34c759" },
                              { label: "Orders", detail: null, color: "#ff9500" },
                            ]
                      }
                    />
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-2.5 text-[11px] text-[#0071e3] flex items-center gap-0.5 mx-auto cursor-pointer hover:opacity-75 transition-opacity"
                      style={{ fontWeight: 520, fontFamily: "Urbanist, sans-serif" }}
                    >
                      See all updates
                      <ChevronRight size={10} strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Nav items */}
                  <div className="space-y-0.5 py-1">
                    <MenuItem icon={ShoppingBag} label="My orders" sub={`${ordersOnWay} on the way`} onClick={() => { window.location.href = "/orders"; }} />
                    <MenuItem icon={MessageCircle} label="Messages" sub={`${unreadMessages} unread`} onClick={() => { const rt = encodeURIComponent(`${window.location.pathname}${window.location.search}`); window.location.href = `/messages?returnTo=${rt}`; }} />
                    <MenuItem icon={Heart} label="Wishlist" sub={`${wishlistItems} items`} onClick={() => { window.location.href = "/wishlist"; }} />
                    <MenuItem
                      icon={Store}
                      label="Become a seller"
                      onClick={handleBecomeSeller}
                      accent
                    />
                  </div>

                  <Divider />

                  <div className="space-y-0.5">
                    <MenuItem icon={Settings} label="Settings" onClick={() => { window.location.href = "/orders?settings=1"; }} />
                    <MenuItem icon={HelpCircle} label="Help & Support" onClick={() => { window.location.href = "/orders?help=1"; }} />
                  </div>

                  <Divider />

                  <MenuItem icon={LogOut} label="Sign out" danger onClick={handleLogout} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seller verification modal — portaled to body */}
      <SellerVerificationModal
        open={sellerOpen}
        onClose={() => setSellerOpen(false)}
      />
    </>
  );
}
