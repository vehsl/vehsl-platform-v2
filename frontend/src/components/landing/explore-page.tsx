// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { categories } from "./category-data";
import type { Category, SubCategory, Product } from "./category-data";
import { useBounce } from "./bounce-context";
import { AliveElement } from "./alive-element";
import { IconResolver } from "./icon-resolver";

/*
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║  DESIGN CONSTITUTION — The Platonic Explore                            ║
 ║                                                                        ║
 ║  Platonic = the ideal form. Not decoration. Pure function made warm.   ║
 ║                                                                        ║
 ║  1. EVERYTHING VISIBLE — no content behind doors. Scroll to see all.   ║
 ║  2. SEARCH IS INSTANT — results appear as you type, right there.       ║
 ║  3. EACH CATEGORY IS A ROOM — unique color identity, immediate feel.   ║
 ║  4. PRODUCTS FLOW LIKE LANGUAGE — pills that read like words, not      ║
 ║     cells in a spreadsheet.                                            ║
 ║  5. THE ROADMAP IS THE MAP — a glanceable tree of everything.          ║
 ║  6. EVERY INTERACTION IS A CONVERSATION — bounce, spring, breathe.     ║
 ║  7. A CHILD CAN USE IT — tap a color, see the thing, done.            ║
 ╚══════════════════════════════════════════════════════════════════════════╝
*/

// ─── Category Color System ─────────────────────────────────────────────
// Each category has a unique warm identity — like rooms in a museum
const THEMES: Record<
  string,
  { bg: string; accent: string; light: string; ring: string }
> = {
  vehicles:    { bg: "from-[#dbeafe] to-[#eff6ff]", accent: "#3b82f6", light: "#eff6ff", ring: "ring-blue-200/60" },
  industrial:  { bg: "from-[#e2e8f0] to-[#f1f5f9]", accent: "#64748b", light: "#f1f5f9", ring: "ring-slate-200/60" },
  hardware:    { bg: "from-[#fef3c7] to-[#fffbeb]", accent: "#d97706", light: "#fffbeb", ring: "ring-amber-200/60" },
  electronics: { bg: "from-[#ede9fe] to-[#f5f3ff]", accent: "#7c3aed", light: "#f5f3ff", ring: "ring-violet-200/60" },
  furniture:   { bg: "from-[#ffedd5] to-[#fff7ed]", accent: "#ea580c", light: "#fff7ed", ring: "ring-orange-200/60" },
  energy:      { bg: "from-[#d1fae5] to-[#ecfdf5]", accent: "#059669", light: "#ecfdf5", ring: "ring-emerald-200/60" },
  apparel:     { bg: "from-[#fce7f3] to-[#fdf2f8]", accent: "#db2777", light: "#fdf2f8", ring: "ring-pink-200/60" },
  beauty:      { bg: "from-[#f3e8ff] to-[#faf5ff]", accent: "#9333ea", light: "#faf5ff", ring: "ring-purple-200/60" },
  mining:      { bg: "from-[#e7e5e4] to-[#f5f5f4]", accent: "#78716c", light: "#f5f5f4", ring: "ring-stone-200/60" },
  agriculture: { bg: "from-[#dcfce7] to-[#f0fdf4]", accent: "#16a34a", light: "#f0fdf4", ring: "ring-green-200/60" },
  sports:      { bg: "from-[#fee2e2] to-[#fef2f2]", accent: "#dc2626", light: "#fef2f2", ring: "ring-red-200/60" },
};
const t = (id: string) => THEMES[id] || THEMES.vehicles;

// ─── Explore Page ──────────────────────────────────────────────────────
export function ExplorePage() {
  const params = useParams() as { slug?: string[] };
  const [categoryId, subcategoryId] = params.slug ?? [];
  const [search, setSearch] = useState("");
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const { triggerBounce } = useBounce();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const { scrollY } = useScroll();

  // ── Sticky nav logic ──
  useMotionValueEvent(scrollY, "change", (y) => {
    setStickyVisible(y > 480);
    let current: string | null = null;
    for (const cat of categories) {
      const el = refs.current[cat.id];
      if (el && el.getBoundingClientRect().top <= 180) current = cat.id;
    }
    if (current !== activeNav) setActiveNav(current);
  });

  // ── URL param navigation ──
  useEffect(() => {
    if (categoryId) {
      setTimeout(() => {
        refs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
      if (subcategoryId) setOpenSub(`${categoryId}/${subcategoryId}`);
    }
  }, [categoryId, subcategoryId]);

  // ── Search: instant results ──
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: {
      type: "category" | "subcategory" | "product";
      name: string;
      icon: string;
      catId: string;
      catLabel: string;
      subId?: string;
      subLabel?: string;
      price?: string;
    }[] = [];

    for (const cat of categories) {
      if (cat.label.toLowerCase().includes(q)) {
        results.push({ type: "category", name: cat.label, icon: cat.icon, catId: cat.id, catLabel: cat.label });
      }
      for (const sub of cat.subcategories) {
        if (sub.label.toLowerCase().includes(q)) {
          results.push({
            type: "subcategory",
            name: sub.label,
            icon: sub.icon,
            catId: cat.id,
            catLabel: cat.label,
            subId: sub.id,
            subLabel: sub.label,
          });
        }
        for (const prod of sub.products) {
          if (prod.name.toLowerCase().includes(q)) {
            results.push({
              type: "product",
              name: prod.name,
              icon: prod.icon,
              catId: cat.id,
              catLabel: cat.label,
              subId: sub.id,
              subLabel: sub.label,
              price: prod.price,
            });
          }
        }
      }
    }
    return results.slice(0, 24);
  }, [search]);

  const scrollTo = useCallback(
    (catId: string, subId?: string) => {
      triggerBounce();
      if (subId) setOpenSub(`${catId}/${subId}`);
      setSearch("");
      setTimeout(() => {
        refs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [triggerBounce]
  );

  const toggleSub = useCallback(
    (catId: string, subId: string) => {
      triggerBounce();
      const key = `${catId}/${subId}`;
      setOpenSub((prev) => (prev === key ? null : key));
    },
    [triggerBounce]
  );

  const totalProducts = useMemo(
    () => categories.reduce((s, c) => s + c.subcategories.reduce((ss, sub) => ss + sub.products.length, 0), 0),
    []
  );
  const totalSubs = useMemo(
    () => categories.reduce((s, c) => s + c.subcategories.length, 0),
    []
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] font-['Urbanist',sans-serif]">
      {/* ═══ Sticky Category Bar ═══ */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.nav
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/65 border-b border-black/[0.04] shadow-[0_1px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="max-w-[1200px] mx-auto px-6 h-[52px] flex items-center gap-5">
              <Link
                href="/"
                className="text-[17px] text-[#1d1d1f] tracking-[-0.4px] shrink-0"
                style={{ fontWeight: 660 }}
              >
                Vehsl
              </Link>
              <div className="w-px h-4 bg-black/[0.06]" />
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 min-w-max">
                  {categories.map((cat) => {
                    const active = activeNav === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => scrollTo(cat.id)}
                        className="px-3 py-1.5 rounded-full text-[12px] tracking-[-0.1px] transition-all duration-200 cursor-pointer whitespace-nowrap"
                        style={{
                          fontWeight: active ? 600 : 440,
                          backgroundColor: active ? t(cat.id).accent : "transparent",
                          color: active ? "#fff" : "#86868b",
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Sticky search trigger */}
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => searchRef.current?.focus(), 500);
                }}
                className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center hover:bg-black/[0.06] transition-colors cursor-pointer shrink-0"
              >
                <Search size={14} className="text-[#86868b]" />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ═══ Hero / Header ═══ */}
      <header className="relative overflow-hidden">
        {/* Warm ambient wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(165deg, #e8f0fe 0%, #f3e8ff 28%, #fce7f3 56%, #ecfdf5 100%)",
          }}
        />
        <div className="absolute top-[5%] left-[15%] w-[600px] h-[600px] bg-blue-200/12 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[10%] w-[500px] h-[500px] bg-purple-200/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-14 pb-16">
          {/* Back */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/45 backdrop-blur-sm border border-white/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:bg-white/70 hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all"
            >
              <ArrowLeft size={13} className="text-[#86868b] group-hover:text-[#1d1d1f] transition-colors" />
              <span className="text-[12px] text-[#86868b] group-hover:text-[#1d1d1f] transition-colors" style={{ fontWeight: 500 }}>
                Home
              </span>
            </Link>
          </motion.div>

          {/* Title + Search — the heart of the page */}
          <div className="mt-14 max-w-[600px]">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="text-[clamp(38px,7vw,60px)] tracking-[-1.8px] text-[#1d1d1f] leading-[1.05] mb-4"
              style={{ fontWeight: 760 }}
            >
              Explore{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #3b82f6, #8b5cf6 45%, #ec4899)",
                }}
              >
                everything
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="text-[15px] md:text-[17px] text-[#86868b] leading-[1.65] mb-10"
            >
              {categories.length} categories · {totalSubs} subcategories · {totalProducts}+ products
            </motion.p>

            {/* ── Search with live results ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="relative"
            >
              <div className="relative z-10">
                <Search
                  size={17}
                  className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    search ? "text-[#1d1d1f]" : "text-[#c4c4c4]"
                  }`}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search anything — 'solar panel', 'mango', 'sofa'…"
                  className={`w-full h-[54px] pl-[48px] pr-12 text-[15px] text-[#1d1d1f] placeholder:text-[#c4c4c4] bg-white/75 backdrop-blur-xl border shadow-[0_2px_16px_rgba(0,0,0,0.03)] focus:outline-none focus:bg-white focus:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ${
                    searchResults && searchResults.length > 0
                      ? "rounded-t-[22px] border-white/80 border-b-transparent"
                      : "rounded-[22px] border-white/70"
                  }`}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center hover:bg-black/[0.08] transition-colors cursor-pointer"
                  >
                    <X size={11} className="text-[#86868b]" />
                  </button>
                )}
              </div>

              {/* Live results dropdown */}
              <AnimatePresence>
                {searchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 top-[54px] z-20 bg-white/95 backdrop-blur-xl border border-white/80 border-t-0 rounded-b-[22px] shadow-[0_12px_48px_rgba(0,0,0,0.1)] overflow-hidden"
                  >
                    <div className="px-2 py-2 max-h-[360px] overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <motion.button
                          key={`${r.catId}-${r.subId || ""}-${r.name}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.25 }}
                          onClick={() => scrollTo(r.catId, r.subId)}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-[14px] hover:bg-[#f5f5f3] transition-colors cursor-pointer group"
                        >
                          {/* Icon */}
                          <div
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${t(r.catId).accent}0A` }}
                          >
                            <IconResolver name={r.icon} size={13} strokeWidth={1.5} style={{ color: t(r.catId).accent, opacity: 0.7 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[13.5px] text-[#1d1d1f] truncate"
                              style={{ fontWeight: 530 }}
                            >
                              {highlightMatch(r.name, search)}
                            </p>
                            <p className="text-[11px] text-[#b4b4b4] truncate mt-0.5">
                              {r.catLabel}
                              {r.subLabel && ` → ${r.subLabel}`}
                              {r.price && ` · ${r.price}`}
                            </p>
                          </div>
                          <ArrowUpRight
                            size={12}
                            className="text-[#c4c4c4] group-hover:text-[#86868b] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          />
                        </motion.button>
                      ))}
                    </div>
                    {/* Results count */}
                    <div className="px-5 py-2.5 border-t border-black/[0.03]">
                      <p className="text-[11px] text-[#b4b4b4]">
                        {searchResults.length === 24 ? "24+" : searchResults.length} results for "{search}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No results */}
              <AnimatePresence>
                {searchResults && searchResults.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-[54px] z-20 bg-white/95 backdrop-blur-xl border border-white/80 border-t-0 rounded-b-[22px] shadow-[0_12px_48px_rgba(0,0,0,0.1)] px-5 py-6 text-center"
                  >
                    <p className="text-[14px] text-[#86868b]" style={{ fontWeight: 500 }}>
                      Nothing found for "{search}"
                    </p>
                    <p className="text-[12px] text-[#c4c4c4] mt-1">
                      Try a different word
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Category Overview Cards ── */}
          {/* These are the "table of contents" — every category at a glance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {categories.map((cat, i) => {
              const theme = t(cat.id);
              const productCount = cat.subcategories.reduce((s, sub) => s + sub.products.length, 0);
              return (
                <AliveElement key={cat.id} delay={i} sensitivity={0.35}>
                  <motion.button
                    whileHover={{ y: -3, scale: 1.015 }}
                    whileTap={{ scale: 0.975 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.45 }}
                    onClick={() => scrollTo(cat.id)}
                    className="w-full text-left cursor-pointer group relative overflow-hidden rounded-[24px]"
                    style={{
                      padding: "22px 20px 18px",
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(40px) saturate(1.4)",
                      WebkitBackdropFilter: "blur(40px) saturate(1.4)",
                      border: "1px solid rgba(0,0,0,0.07)",
                      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Living accent line — hugs the top edge */}
                    <div
                      className="absolute top-0 left-5 right-5 h-[1px] rounded-full opacity-25 group-hover:opacity-50 transition-opacity duration-700"
                      style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
                    />

                    {/* Subtle neutral lift glow on hover — no colour bleed */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none rounded-[24px]"
                      style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.07)" }}
                    />

                    <div className="relative">
                      {/* Icon + count on the same line */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-[13px] flex items-center justify-center"
                          style={{
                            background: "rgba(0,0,0,0.04)",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
                          }}
                        >
                          <IconResolver name={cat.icon} size={19} strokeWidth={1.35} style={{ color: theme.accent }} />
                        </div>
                        <span
                          className="text-[10.5px] px-2 py-[3px] rounded-full mt-0.5"
                          style={{
                            color: "#6b7280",
                            backgroundColor: "rgba(0,0,0,0.05)",
                            fontWeight: 520,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {productCount}
                        </span>
                      </div>

                      <p
                        className="text-[15.5px] tracking-[-0.25px] text-[#1d1d1f] mb-0.5"
                        style={{ fontWeight: 620 }}
                      >
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-[#a1a1a6] mb-3" style={{ fontWeight: 420 }}>
                        {cat.subcategories.length} types
                      </p>

                      {/* Subcategory previews — less uniform, more organic */}
                      <div className="flex flex-wrap gap-[5px]">
                        {cat.subcategories.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className="text-[10px] px-[7px] py-[2.5px] rounded-[8px] text-[#78788c] transition-colors duration-300 group-hover:text-[#5e5e72]"
                            style={{
                              fontWeight: 460,
                              background: "rgba(0,0,0,0.04)",
                              border: "0.5px solid rgba(0,0,0,0.06)",
                            }}
                          >
                            {sub.label}
                          </span>
                        ))}
                        {cat.subcategories.length > 3 && (
                          <span
                            className="text-[10px] px-[7px] py-[2.5px] rounded-[8px]"
                            style={{
                              fontWeight: 440,
                              color: "#9ca3af",
                            }}
                          >
                            +{cat.subcategories.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                </AliveElement>
              );
            })}
          </motion.div>
        </div>
      </header>

      {/* Click overlay to close search */}
      {search && searchResults && (
        <div className="fixed inset-0 z-10" onClick={() => setSearch("")} />
      )}

      {/* ═══ All Categories — Flowing Sections ═══ */}
      <main className="relative max-w-[1200px] mx-auto px-6 pt-8 pb-20">
        {/* Gentle introduction */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[12px] text-[#c4c4c4] tracking-[0.8px] uppercase text-center mb-16"
          style={{ fontWeight: 450 }}
        >
          All categories
        </motion.p>

        <div className="space-y-24">
          {categories.map((cat) => {
            const theme = t(cat.id);
            return (
              <section
                key={cat.id}
                ref={(el) => { refs.current[cat.id] = el; }}
                className="scroll-mt-20"
              >
                {/* ── Category Header ── */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.7 }}
                  className="mb-10"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                      style={{ backgroundColor: `${theme.accent}0C` }}
                    >
                      <IconResolver name={cat.icon} size={20} strokeWidth={1.4} style={{ color: theme.accent }} />
                    </div>
                    <h2
                      className="text-[clamp(26px,4vw,38px)] tracking-[-0.9px] text-[#1d1d1f]"
                      style={{ fontWeight: 720 }}
                    >
                      {cat.label}
                    </h2>
                  </div>
                  <p className="text-[13px] text-[#b4b4b4] ml-[56px]">
                    {cat.subcategories.length} subcategories ·{" "}
                    {cat.subcategories.reduce((s, sub) => s + sub.products.length, 0)} products
                  </p>
                </motion.div>

                {/* ── Subcategory Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.subcategories.map((sub, si) => {
                    const subKey = `${cat.id}/${sub.id}`;
                    const isOpen = openSub === subKey;
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.05 }}
                        transition={{ duration: 0.5, delay: Math.min(si * 0.04, 0.3) }}
                        className="group"
                      >
                        <AliveElement delay={si} sensitivity={0.25}>
                          <div
                            className={`rounded-[22px] transition-all duration-400 ${
                              isOpen
                                ? "shadow-[0_10px_48px_rgba(0,0,0,0.07)] ring-1 " + theme.ring
                                : "shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.05)]"
                            }`}
                          >
                            {/* Card header */}
                            <motion.button
                              whileTap={{ scale: 0.99 }}
                              transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                              onClick={() => toggleSub(cat.id, sub.id)}
                              className={`w-full text-left px-6 py-5.5 cursor-pointer transition-colors duration-300 border ${
                                isOpen
                                  ? "bg-white border-transparent"
                                  : "bg-white/55 border-white/40 hover:bg-white/85"
                              }`}
                              style={{
                                borderRadius: isOpen ? "22px 22px 0 0" : "22px",
                                paddingTop: "22px",
                                paddingBottom: "22px",
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Subcategory name + count */}
                                  <div className="flex items-center gap-2.5 mb-2.5">
                                    <IconResolver name={sub.icon} size={14} strokeWidth={1.5} style={{ color: theme.accent, opacity: 0.6 }} />
                                    <span
                                      className="text-[15.5px] tracking-[-0.2px] text-[#1d1d1f]"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {sub.label}
                                    </span>
                                    <span
                                      className="text-[10px] px-2 py-[3px] rounded-full tabular-nums shrink-0"
                                      style={{
                                        fontWeight: 520,
                                        backgroundColor: `${theme.accent}0C`,
                                        color: theme.accent,
                                      }}
                                    >
                                      {sub.products.length}
                                    </span>
                                  </div>
                                  {/* Product preview — reads like natural language */}
                                  <p className="text-[12px] text-[#b4b4b4] leading-[1.65]">
                                    {sub.products
                                      .slice(0, isOpen ? 0 : 4)
                                      .map((p) => p.name)
                                      .join(", ")}
                                    {!isOpen && sub.products.length > 4 && (
                                      <span className="text-[#d2d2d7]">
                                        {" "}+{sub.products.length - 4} more
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {/* Chevron that morphs */}
                                <motion.div
                                  animate={{ rotate: isOpen ? 90 : 0 }}
                                  transition={{ type: "spring", bounce: 0.35, duration: 0.35 }}
                                  className="mt-1 shrink-0"
                                >
                                  <ChevronRight size={14} className="text-[#d2d2d7]" />
                                </motion.div>
                              </div>
                            </motion.button>

                            {/* ── Product Bloom ── */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    height: { type: "spring", bounce: 0.08, duration: 0.5 },
                                    opacity: { duration: 0.25, delay: 0.05 },
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    className="px-5 pb-5 pt-2 border-x border-b rounded-b-[22px]"
                                    style={{
                                      backgroundColor: theme.light,
                                      borderColor: "rgba(255,255,255,0.5)",
                                    }}
                                  >
                                    {/* Products as flowing pills */}
                                    <div className="flex flex-wrap gap-[7px] pt-2">
                                      {sub.products.map((product, pi) => (
                                        <motion.div
                                          key={product.id}
                                          initial={{ opacity: 0, scale: 0.92, y: 5 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          transition={{
                                            delay: Math.min(pi * 0.018, 0.5),
                                            type: "spring",
                                            bounce: 0.3,
                                            duration: 0.35,
                                          }}
                                        >
                                          <ProductPill
                                            product={product}
                                            accent={theme.accent}
                                          />
                                        </motion.div>
                                      ))}
                                    </div>
                                    {/* Product count confirmation */}
                                    <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-black/[0.03]">
                                      <Check size={11} className="text-[#b4b4b4]" />
                                      <span className="text-[10.5px] text-[#c4c4c4]" style={{ fontWeight: 450 }}>
                                        {sub.products.length} products in {sub.label}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </AliveElement>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* ═══ Roadmap — The Complete Map ═══ */}
      <Roadmap onNavigate={scrollTo} />
    </div>
  );
}

// ─── Highlight matching text in search results ─────────────────────────
function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 700, color: "#1d1d1f" }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Product Pill ──────────────────────────────────────────────────────
// Each product as a soft, readable pill — like a word in a sentence
function ProductPill({ product, accent }: { product: Product; accent: string }) {
  const { triggerBounce } = useBounce();
  const [tapped, setTapped] = useState(false);

  return (
    <motion.button
      whileHover={{ scale: 1.025, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
      onClick={() => {
        triggerBounce();
        setTapped(true);
        setTimeout(() => setTapped(false), 1200);
      }}
      className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-white/85 border border-white/50 hover:border-white/80 hover:shadow-[0_3px_14px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer"
    >
      <IconResolver name={product.icon} size={12} strokeWidth={1.5} className="text-[#c4c4c4] group-hover:text-[#86868b] transition-colors" />
      <span
        className="text-[12px] tracking-[-0.05px] text-[#3a3a3c] group-hover:text-[#1d1d1f] transition-colors"
        style={{ fontWeight: 490 }}
      >
        {product.name}
      </span>
      <span className="text-[10px] text-[#c4c4c4] group-hover:text-[#96969b] transition-colors tabular-nums whitespace-nowrap">
        {product.price}
      </span>
      {/* Tapped confirmation — subtle green dot */}
      <AnimatePresence>
        {tapped && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.3 }}
          >
            <Check size={10} style={{ color: accent }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Roadmap ───────────────────────────────────────────────────────────
// A complete visual map of the platform — every category, every subcategory
// Glanceable. A child can read it. Tap anything to go there.
function Roadmap({ onNavigate }: { onNavigate: (catId: string, subId?: string) => void }) {
  const { triggerBounce } = useBounce();
  const totalSubs = categories.reduce((s, c) => s + c.subcategories.length, 0);
  const totalProducts = categories.reduce(
    (s, c) => s + c.subcategories.reduce((ss, sub) => ss + sub.products.length, 0),
    0
  );

  return (
    <footer className="relative border-t border-black/[0.03]">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fafaf8] to-[#f5f4f0] pointer-events-none" />
      <div className="absolute top-[15%] left-[8%] w-[500px] h-[500px] bg-blue-50/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[12%] w-[400px] h-[400px] bg-violet-50/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p
            className="text-[11px] text-[#c4c4c4] tracking-[1.5px] uppercase mb-4"
            style={{ fontWeight: 480 }}
          >
            Platform Directory
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,44px)] tracking-[-1px] text-[#1d1d1f] mb-4"
            style={{ fontWeight: 720 }}
          >
            The complete{" "}
            <span style={{ fontWeight: 340 }}>map</span>
          </h2>
          <p className="text-[14px] text-[#96969b] max-w-[400px] mx-auto leading-[1.65]">
            {categories.length} categories · {totalSubs} subcategories · {totalProducts} products.
            <br />
            Tap anywhere to explore.
          </p>
        </motion.div>

        {/* Category tree */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
          {categories.map((cat, ci) => {
            const theme = t(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, delay: Math.min(ci * 0.05, 0.4) }}
              >
                {/* Category name */}
                <button
                  onClick={() => {
                    triggerBounce();
                    onNavigate(cat.id);
                  }}
                  className="group flex items-center gap-2.5 mb-4 cursor-pointer"
                >
                  <IconResolver name={cat.icon} size={15} strokeWidth={1.4} style={{ color: theme.accent, opacity: 0.7 }} />
                  <span
                    className="text-[15px] tracking-[-0.25px] text-[#1d1d1f] group-hover:text-[#3a3a3c] transition-colors"
                    style={{ fontWeight: 640 }}
                  >
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-[#d2d2d7] tabular-nums">
                    {cat.subcategories.reduce((s, sub) => s + sub.products.length, 0)}
                  </span>
                </button>

                {/* Subcategory links */}
                <div
                  className="pl-5 border-l-[1.5px] space-y-[1px]"
                  style={{ borderColor: `${theme.accent}15` }}
                >
                  {cat.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        triggerBounce();
                        onNavigate(cat.id, sub.id);
                      }}
                      className="group/item w-full text-left flex items-center justify-between px-3 py-[7px] rounded-[10px] hover:bg-white/60 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconResolver name={sub.icon} size={11} strokeWidth={1.4} className="text-[#c4c4c4] group-hover/item:text-[#86868b] transition-colors" />
                        <span
                          className="text-[12.5px] text-[#96969b] group-hover/item:text-[#56585D] transition-colors"
                          style={{ fontWeight: 440 }}
                        >
                          {sub.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#d2d2d7] tabular-nums opacity-0 group-hover/item:opacity-100 transition-opacity">
                        {sub.products.length}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-black/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#d2d2d7]">
            Every item quality-verified. © 2026 Vehsl.
          </p>
          <Link
            href="/"
            className="group flex items-center gap-1.5 text-[12px] text-[#96969b] hover:text-[#1d1d1f] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Back to home
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
