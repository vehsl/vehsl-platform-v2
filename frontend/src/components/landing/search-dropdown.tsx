"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Mic,
  Camera,
  ArrowRight,
  X,
  Star,
  ShieldCheck,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchJsonAuthed } from "@/lib/api";
import { getIcon } from "./category-nav";
import { useBounce } from "./bounce-context";

// ─── Filter Data ──────────────────────────────────────────────────────────
const PRICE_OPTIONS = [
  { label: "Under $50",  value: "under-50" },
  { label: "$50–$500",   value: "50-500"   },
  { label: "$500–$5K",   value: "500-5k"   },
  { label: "$5K–$50K",   value: "5k-50k"   },
  { label: "$50K+",      value: "50k-plus" },
  { label: "Bulk / B2B", value: "bulk"     },
];

const RATING_OPTIONS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4.0 },
  { label: "3.5+", value: 3.5 },
];

const QA_GRADES = [
  { label: "A+", desc: "Premium",  value: "a-plus", color: "#059669", bg: "rgba(5,150,105,0.08)"  },
  { label: "A",  desc: "Verified", value: "a",       color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  { label: "B",  desc: "Standard", value: "b",       color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  { label: "C",  desc: "Budget",   value: "c",       color: "#6b7280", bg: "rgba(107,114,128,0.06)"},
];

// ─── Filter row: label + horizontal scrollable chips ──────────────────────
function FilterRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0 min-h-[34px]">
      {/* Label — fixed width, never wraps */}
      <div className="flex items-center gap-1.5 shrink-0 w-[88px]">
        <Icon size={11} className="text-[#b4b4b4]" strokeWidth={1.6} />
        <span
          className="text-[11px] text-[#b4b4b4] tracking-[0.1px] whitespace-nowrap"
          style={{ fontWeight: 480 }}
        >
          {label}
        </span>
      </div>
      {/* Chips — horizontally scrollable, no scrollbar */}
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pr-4 scrollbar-hide">
          {children}
        </div>
        {/* Fade-out gradient on the right */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#f4faff] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Individual filter chip ───────────────────────────────────────────────
function Chip({
  label,
  active,
  activeColor,
  activeBg,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  activeBg?: string;
  icon?: React.ElementType;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.45, duration: 0.28 }}
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-[5px] rounded-full shrink-0 cursor-pointer transition-all duration-200 whitespace-nowrap"
      style={{
        background: active
          ? activeBg || "#1d1d1f"
          : "rgba(255,255,255,0.55)",
        border: active
          ? `1px solid ${activeColor || "#1d1d1f"}20`
          : "1px solid rgba(0,0,0,0.07)",
        boxShadow: active
          ? `0 1px 6px ${activeColor || "#000"}18`
          : "0 1px 2px rgba(0,0,0,0.03)",
        color: active
          ? activeColor && activeBg ? activeColor : "#fff"
          : "#6b7280",
      }}
    >
      {Icon && <Icon size={10} strokeWidth={1.8} />}
      <span className="text-[11.5px]" style={{ fontWeight: active ? 600 : 460 }}>
        {label}
      </span>
      {active && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-0.5"
        >
          <X size={9} strokeWidth={2.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ─── Star chip — for rating ───────────────────────────────────────────────
function StarChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.45, duration: 0.28 }}
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-[5px] rounded-full shrink-0 cursor-pointer transition-all duration-200"
      style={{
        background: active ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.55)",
        border: active ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(0,0,0,0.07)",
        boxShadow: active ? "0 1px 6px rgba(251,191,36,0.15)" : "0 1px 2px rgba(0,0,0,0.03)",
        color: active ? "#d97706" : "#6b7280",
      }}
    >
      <Star
        size={10}
        strokeWidth={1.8}
        style={{ fill: active ? "#fbbf24" : "none", color: active ? "#fbbf24" : "#9ca3af" }}
      />
      <span className="text-[11.5px]" style={{ fontWeight: active ? 620 : 460 }}>
        {label}
      </span>
      {active && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-0.5"
        >
          <X size={9} strokeWidth={2.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ─── Main SearchDropdown ──────────────────────────────────────────────────
export interface SearchDropdownProps {
  className?: string;
}

export function SearchDropdown({ className = "" }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [serverCategories, setServerCategories] = useState<
    Array<{
      id: string;
      label: string;
      icon: string;
      children: Array<{ id: string; label: string; icon: string }>;
    }>
  >([]);
  const [trending, setTrending] = useState<Array<{ id: number; name: string; icon: string; category: string }>>([]);
  const [results, setResults] = useState<
    Array<{ key: string; name: string; icon: string; category: string; productId?: number; categorySlug?: string }>
  >([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [filters, setFilters] = useState<{
    category: string | null;
    price: string | null;
    rating: number | null;
    qaGrade: string | null;
  }>({
    category: null,
    price: null,
    rating: null,
    qaGrade: null,
  });

  const { triggerBounce } = useBounce();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasQuery = query.trim().length > 0;
  const showDropdown = isFocused;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    let cancelled = false;
    fetchJsonAuthed("/api/v1/categories/explore/")
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.categories) ? (data as any).categories : [];
        const mapped = rows
          .map((c: any) => ({
            id: String(c?.slug || c?.id || ""),
            label: String(c?.name || "").trim(),
            icon: String(c?.icon || "circle"),
            children: (Array.isArray(c?.children) ? c.children : [])
              .map((ch: any) => ({
                id: String(ch?.slug || ch?.id || ""),
                label: String(ch?.name || "").trim(),
                icon: String(ch?.icon || "circle"),
              }))
              .filter((ch: any) => ch.id && ch.label),
          }))
          .filter((c: any) => c.id && c.label);
        setServerCategories(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setServerCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page_size", "7");
    params.set("ordering", "-created_at");
    fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? data : [];
        const mapped = rows
          .map((r: any) => ({
            id: Number(r?.id || 0),
            name: String(r?.name || r?.title || "").trim(),
            icon: "tag",
            category: String(r?.category_name || "").trim(),
          }))
          .filter((x: any) => x.id && x.name);
        setTrending(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setTrending([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Toggle helpers ──
  const toggleCategory = useCallback((val: string) => {
    setFilters((p) => ({ ...p, category: p.category === val ? null : val }));
    triggerBounce();
  }, [triggerBounce]);

  const togglePrice = useCallback((val: string) => {
    setFilters((p) => ({ ...p, price: p.price === val ? null : val }));
    triggerBounce();
  }, [triggerBounce]);

  const toggleRating = useCallback((val: number) => {
    setFilters((p) => ({ ...p, rating: p.rating === val ? null : val }));
    triggerBounce();
  }, [triggerBounce]);

  const toggleQA = useCallback((val: string) => {
    setFilters((p) => ({ ...p, qaGrade: p.qaGrade === val ? null : val }));
    triggerBounce();
  }, [triggerBounce]);

  const clearFilters = useCallback(() => {
    setFilters({ category: null, price: null, rating: null, qaGrade: null });
    triggerBounce();
  }, [triggerBounce]);

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setResultsLoading(false);
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      const qq = q.toLowerCase();
      const local = serverCategories
        .flatMap((c) => {
          const items: Array<{ key: string; name: string; icon: string; category: string; categorySlug?: string }> = [];
          if (c.label.toLowerCase().includes(qq)) {
            items.push({ key: `cat:${c.id}`, name: c.label, icon: c.icon, category: "Category", categorySlug: c.id });
          }
          for (const ch of c.children) {
            if (ch.label.toLowerCase().includes(qq)) {
              items.push({ key: `sub:${ch.id}`, name: ch.label, icon: ch.icon, category: c.label, categorySlug: ch.id });
            }
          }
          return items;
        })
        .slice(0, 8);
      setResults(local);
      setResultsLoading(false);
      return;
    }

    let cancelled = false;
    const tmr = window.setTimeout(() => {
      const qq = q.toLowerCase();
      const local = serverCategories.flatMap((c) => {
        const items: Array<{ key: string; name: string; icon: string; category: string; categorySlug?: string }> = [];
        if (c.label.toLowerCase().includes(qq)) {
          items.push({ key: `cat:${c.id}`, name: c.label, icon: c.icon, category: "Category", categorySlug: c.id });
        }
        for (const ch of c.children) {
          if (ch.label.toLowerCase().includes(qq)) {
            items.push({ key: `sub:${ch.id}`, name: ch.label, icon: ch.icon, category: c.label, categorySlug: ch.id });
          }
        }
        return items;
      });

      setResultsLoading(true);
      const params = new URLSearchParams();
      params.set("search", q);
      params.set("page_size", "8");
      params.set("ordering", "-created_at");
      if (filters.category) params.set("category", filters.category);
      fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)
        .then((data) => {
          if (cancelled) return;
          const rows = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? data : [];
          const prods = rows
            .map((r: any) => ({
              key: `prod:${String(r?.id || "")}`,
              name: String(r?.name || r?.title || "").trim(),
              icon: "tag",
              category: String(r?.category_name || "").trim() || "Product",
              productId: Number(r?.id || 0),
            }))
            .filter((x: any) => x.productId && x.name);

          const merged = [...local, ...prods].slice(0, 8);
          setResults(merged);
        })
        .catch(() => {
          if (cancelled) return;
          setResults(local.slice(0, 8));
        })
        .finally(() => {
          if (cancelled) return;
          setResultsLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(tmr);
    };
  }, [filters.category, hasQuery, query, serverCategories]);

  // ── Close on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setHoveredIndex(null);
  }, [query]);

  const handleItemClick = useCallback(
    (item: { name: string; productId?: number; categorySlug?: string }) => {
      triggerBounce();
      if (item.productId) {
        router.push(`/products/${item.productId}`);
        setIsFocused(false);
        return;
      }
      if (item.categorySlug) {
        const sp = new URLSearchParams();
        sp.set("category", item.categorySlug);
        router.push(`/explore?${sp.toString()}`);
        setIsFocused(false);
        return;
      }
      setQuery(item.name);
      setIsFocused(false);
    },
    [router, triggerBounce]
  );

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q && !filters.category) return;
    const sp = new URLSearchParams();
    if (q) sp.set("search", q);
    if (filters.category) sp.set("category", filters.category);
    triggerBounce();
    setIsFocused(false);
    router.push(`/explore?${sp.toString()}`);
  }, [filters.category, query, router, triggerBounce]);

  // ── Category chips: just the 11 categories ──
  const categoryChips = useMemo(
    () => serverCategories.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
    [serverCategories]
  );

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>

      {/* ── Search Bar ── */}
      <motion.div
        layout
        animate={{
          boxShadow: isFocused
            ? "0 8px 48px rgba(0,113,227,0.13), 0 2px 8px rgba(0,0,0,0.06)"
            : "0 1px 5px rgba(0,0,0,0.06)",
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`relative w-[88vw] sm:w-[480px] md:w-[560px] lg:w-[640px] bg-[#f4faff] flex items-center gap-3 border transition-all duration-400 ${
          showDropdown
            ? "rounded-t-[28px] rounded-b-none border-[#0071e3]/25 border-b-transparent px-6 py-3.5"
            : "rounded-full border-[#0071e3]/20 px-6 py-3.5"
        }`}
      >
        <Search size={18} className="text-[#0d1117] opacity-35 shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Search products, categories, brands…"
          className="flex-1 bg-transparent outline-none font-['Urbanist',sans-serif] text-[16px] text-[#0d1117] placeholder:text-[#0d1117]/30"
          onFocus={() => { setIsFocused(true); triggerBounce(); }}
        />

        <div className="flex items-center gap-2">

          {/* Filters button — appears inside bar only when focused, before Camera */}
          <AnimatePresence>
            {isFocused && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.3 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setFiltersOpen((v) => !v); triggerBounce(); }}
                className="flex items-center gap-1.5 px-2.5 py-[6px] rounded-full cursor-pointer overflow-hidden shrink-0 transition-colors duration-200"
                style={{
                  background: filtersOpen || activeFilterCount > 0 ? "#1d1d1f" : "rgba(255,255,255,0.7)",
                  border: filtersOpen || activeFilterCount > 0 ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.09)",
                  boxShadow: filtersOpen || activeFilterCount > 0 ? "0 1px 6px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                  color: filtersOpen || activeFilterCount > 0 ? "#fff" : "#6b7280",
                }}
              >
                <SlidersHorizontal size={11} strokeWidth={1.8} />
                <span className="text-[12px] whitespace-nowrap" style={{ fontWeight: filtersOpen || activeFilterCount > 0 ? 600 : 480 }}>
                  Filters
                </span>
                {activeFilterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center w-[14px] h-[14px] rounded-full text-[9px]"
                    style={{ background: "rgba(255,255,255,0.28)", fontWeight: 700 }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
                <motion.span
                  animate={{ rotate: filtersOpen ? 180 : 0 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.28 }}
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Camera — visual search */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/90 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:bg-white transition-colors cursor-pointer"
          >
            <Camera size={14} className="text-[#0d1117] opacity-55" />
          </motion.button>

          {/* Blue CTA: mic → arrow */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => hasQuery ? handleSubmit() : triggerBounce()}
            className="w-[40px] h-[40px] rounded-full bg-[#0171e3] flex items-center justify-center shadow-[0_2px_10px_rgba(1,113,227,0.3)] cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {hasQuery ? (
                <motion.div
                  key="arrow"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.18 }}
                >
                  <ArrowRight size={18} className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Mic size={16} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full left-0 right-0 z-50"
          >
            <div className="bg-[#f4faff] border border-[#0071e3]/22 border-t-0 rounded-b-[28px] shadow-[0_16px_56px_rgba(0,113,227,0.11),0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden">

              {/* ── Gradient separator ── */}
              <div className="mx-5 h-[0.8px]">
                <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 545 0.8">
                  <line stroke="url(#grad)" strokeOpacity="0.6" strokeWidth="0.8" x2="545" y1="0.4" y2="0.4" />
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="grad" x1="0" x2="545" y1="0.4" y2="0.4">
                      <stop stopColor="#008FF7" />
                      <stop offset="0.5" stopColor="#B363FA" />
                      <stop offset="1" stopColor="#F34546" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* ══ FILTER ROWS — only when filtersOpen ══ */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ height: { type: "spring", bounce: 0.1, duration: 0.42 }, opacity: { duration: 0.2 } }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-3 pt-3 space-y-2">

                      {/* Clear all row */}
                      {activeFilterCount > 0 && (
                        <div className="flex justify-end mb-1">
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={clearFilters}
                            className="text-[11px] text-[#0071e3] cursor-pointer hover:text-[#0058b0] transition-colors"
                            style={{ fontWeight: 520 }}
                          >
                            Clear all
                          </motion.button>
                        </div>
                      )}

                      {/* ── Category ── */}
                      <FilterRow icon={Tag} label="Category">
                        {categoryChips.map((cat) => {
                          const Icon = getIcon(cat.icon);
                          const isActive = filters.category === cat.id;
                          return (
                            <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.91 }}
                              transition={{ type: "spring", bounce: 0.45, duration: 0.28 }}
                              onClick={() => toggleCategory(cat.id)}
                              className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full shrink-0 cursor-pointer transition-all duration-200 whitespace-nowrap"
                              style={{
                                background: isActive ? "#1d1d1f" : "rgba(255,255,255,0.55)",
                                border: isActive ? "1px solid rgba(0,0,0,0.18)" : "1px solid rgba(0,0,0,0.07)",
                                boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
                                color: isActive ? "#fff" : "#6b7280",
                              }}
                            >
                              <Icon size={10} strokeWidth={1.7} style={{ opacity: isActive ? 0.9 : 0.6 }} />
                              <span className="text-[11.5px]" style={{ fontWeight: isActive ? 600 : 460 }}>
                                {cat.label}
                              </span>
                              {isActive && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <X size={9} strokeWidth={2.5} />
                                </motion.span>
                              )}
                            </motion.button>
                          );
                        })}
                      </FilterRow>

                      {/* ── Price ── */}
                      <FilterRow icon={Tag} label="Price">
                        {PRICE_OPTIONS.map((opt) => (
                          <Chip
                            key={opt.value}
                            label={opt.label}
                            active={filters.price === opt.value}
                            onClick={() => togglePrice(opt.value)}
                          />
                        ))}
                      </FilterRow>

                      {/* ── Rating ── */}
                      <FilterRow icon={Star} label="Rating">
                        {RATING_OPTIONS.map((opt) => (
                          <StarChip
                            key={opt.value}
                            label={`${opt.label} ★`}
                            active={filters.rating === opt.value}
                            onClick={() => toggleRating(opt.value)}
                          />
                        ))}
                      </FilterRow>

                      {/* ── QA Grade ── */}
                      <FilterRow icon={ShieldCheck} label="QA Grade">
                        {QA_GRADES.map((grade) => (
                          <motion.button
                            key={grade.value}
                            whileTap={{ scale: 0.91 }}
                            transition={{ type: "spring", bounce: 0.45, duration: 0.28 }}
                            onClick={() => toggleQA(grade.value)}
                            className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full shrink-0 cursor-pointer transition-all duration-200"
                            style={{
                              background: filters.qaGrade === grade.value ? grade.bg : "rgba(255,255,255,0.55)",
                              border: filters.qaGrade === grade.value
                                ? `1px solid ${grade.color}30`
                                : "1px solid rgba(0,0,0,0.07)",
                              boxShadow: filters.qaGrade === grade.value
                                ? `0 1px 8px ${grade.color}16`
                                : "0 1px 2px rgba(0,0,0,0.03)",
                              color: filters.qaGrade === grade.value ? grade.color : "#6b7280",
                            }}
                            title={grade.desc}
                          >
                            <span
                              className="text-[10px] rounded-[4px] px-1 py-[1px] leading-none"
                              style={{
                                fontWeight: 700,
                                background: filters.qaGrade === grade.value ? grade.color : "rgba(0,0,0,0.06)",
                                color: filters.qaGrade === grade.value ? "#fff" : "#9ca3af",
                                letterSpacing: "0.02em",
                              }}
                            >
                              {grade.label}
                            </span>
                            <span
                              className="text-[11.5px]"
                              style={{ fontWeight: filters.qaGrade === grade.value ? 600 : 440 }}
                            >
                              {grade.desc}
                            </span>
                            {filters.qaGrade === grade.value && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <X size={9} strokeWidth={2.5} style={{ color: grade.color }} />
                              </motion.span>
                            )}
                          </motion.button>
                        ))}
                      </FilterRow>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Divider before results ── */}
              <div className="mx-5 h-[0.5px] bg-black/[0.05]" />

              {/* ══ RESULTS SECTION ══ */}
              <div className="p-4 pt-3">
                {!hasQuery ? (
                  /* Trending */
                  <div>
                    <p
                      className="font-['Urbanist',sans-serif] text-[11px] text-[#0d1117]/35 tracking-[0.4px] uppercase mb-2 px-1"
                      style={{ fontWeight: 520 }}
                    >
                      Trending now
                    </p>
                    <div className="flex flex-col">
                      {trending.map((product, i) => {
                        const Icon = getIcon(product.icon);
                        const isHovered = hoveredIndex === i;
                        return (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => handleItemClick({ name: product.name, productId: product.id })}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 text-left ${
                              isHovered ? "bg-white/70 shadow-[0_1px_4px_rgba(0,0,0,0.07)]" : ""
                            }`}
                          >
                            <div
                              className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                              style={{ background: isHovered ? "rgba(0,113,227,0.07)" : "rgba(0,0,0,0.04)" }}
                            >
                              <Icon size={14} strokeWidth={1.4} className="text-[#56585D]" />
                            </div>
                            <span
                              className="font-['Urbanist',sans-serif] text-[14.5px] flex-1"
                              style={{
                                fontWeight: isHovered ? 580 : 420,
                                color: isHovered ? "#1d1d1f" : "#56585D",
                              }}
                            >
                              {product.name}
                            </span>
                            <span
                              className="text-[11px] text-[#b4b4b4] capitalize"
                              style={{ fontWeight: 420 }}
                            >
                              {product.category}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : resultsLoading && results.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="font-['Urbanist',sans-serif] text-[13.5px] text-[#b4b4b4]" style={{ fontWeight: 520 }}>
                      Searching…
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  /* Live results */
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p
                        className="font-['Urbanist',sans-serif] text-[11px] text-[#0d1117]/35 tracking-[0.4px] uppercase"
                        style={{ fontWeight: 520 }}
                      >
                        Results
                      </p>
                      {activeFilterCount > 0 && (
                        <p
                          className="text-[10.5px] text-[#0071e3]"
                          style={{ fontWeight: 480 }}
                        >
                          {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {results.map((item, i) => {
                        const Icon = getIcon(item.icon);
                        const isHovered = hoveredIndex === i;
                        return (
                          <motion.button
                            key={item.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.025, duration: 0.2 }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => handleItemClick(item)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer transition-all duration-200 text-left ${
                              isHovered ? "bg-white/70 shadow-[0_1px_4px_rgba(0,0,0,0.07)]" : ""
                            }`}
                          >
                            <div
                              className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                              style={{ background: isHovered ? "rgba(0,113,227,0.07)" : "rgba(0,0,0,0.04)" }}
                            >
                              <Icon size={14} strokeWidth={1.4} className="text-[#56585D]" />
                            </div>
                            <span
                              className="font-['Urbanist',sans-serif] text-[14.5px] flex-1"
                              style={{
                                fontWeight: isHovered ? 580 : 420,
                                color: isHovered ? "#1d1d1f" : "#56585D",
                              }}
                            >
                              {highlightMatch(item.name, query)}
                            </span>
                            <span
                              className="text-[11px] text-[#b4b4b4] capitalize shrink-0"
                              style={{ fontWeight: 420 }}
                            >
                              {item.category}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* No results */
                  <div className="py-5 text-center">
                    <p className="font-['Urbanist',sans-serif] text-[14.5px] text-[#b4b4b4]">
                      No results for{" "}
                      <span style={{ color: "#1d1d1f", fontWeight: 560 }}>"{query}"</span>
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-[12px] text-[#0071e3] cursor-pointer hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        Try clearing filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Highlight matching text ──────────────────────────────────────────────
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
