"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/components/ui/utils";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { categories } from "@/lib/categories";

function CategoryCard({ id }: { id: string }) {
  const category = categories.find((c) => c.id === id)!;
  const Icon = category.icon;
  const chips = category.subcategories.slice(0, 3).map((s) => s.name);
  const overflow = Math.max(category.subcategories.length - chips.length, 0);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-3xl border border-white/60 bg-white/85 p-6 backdrop-blur-sm shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"
          style={{ color: category.accent }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {category.count}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{category.name}</div>
        <div className="mt-1 text-xs text-gray-500">{category.subcategories.length} types</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((c) => (
          <div key={c} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            {c}
          </div>
        ))}
        {overflow > 0 ? (
          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            +{overflow}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function SubcategoryCard({
  categoryId,
  subIndex,
}: {
  categoryId: string;
  subIndex: number;
}) {
  const category = categories.find((c) => c.id === categoryId)!;
  const sub = category.subcategories[subIndex]!;
  const Icon = sub.icon;
  const preview = sub.items
    .filter((x) => !x.startsWith("+"))
    .slice(0, 4)
    .join(", ");
  const more = sub.items.find((x) => x.startsWith("+")) ?? "";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-soft"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50"
          style={{ color: category.accent }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-900">{sub.name}</div>
        </div>
        <div className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {sub.count}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
      </div>

      <div className="mt-3 text-sm text-gray-500">
        {preview}
        {more ? ` ${more}` : ""}
      </div>
    </motion.div>
  );
}

function CategorySection({
  id,
  setRef,
}: {
  id: string;
  setRef: (id: string, el: HTMLElement | null) => void;
}) {
  const category = categories.find((c) => c.id === id)!;
  const Icon = category.icon;

  return (
    <section
      id={category.id}
      ref={(el) => setRef(category.id, el)}
      className="py-20"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-md shadow-soft"
          style={{ color: category.accent }}
        >
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-5xl font-bold text-gray-900">{category.name}</div>
          <div className="mt-2 text-sm text-gray-500">
            {category.subcategories.length} subcategories · {category.count} products
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {category.subcategories.slice(0, 9).map((_, i) => (
          <SubcategoryCard key={`${category.id}-${i}`} categoryId={category.id} subIndex={i} />
        ))}
      </div>
    </section>
  );
}

function StickyNav({
  visible,
  activeId,
  onJump,
}: {
  visible: boolean;
  activeId: string | null;
  onJump: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/80 backdrop-blur-xl",
        !visible && "pointer-events-none",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <div className="text-sm font-semibold tracking-tight text-[#0f1115]">Vehsl</div>
        <div className="h-5 w-px bg-black/10" />

        <div className="hidden flex-1 items-center gap-2 overflow-x-auto md:flex">
          {categories.map((c) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onJump(c.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition",
                  isActive ? "bg-orange-500 text-white" : "text-[#1f2330] hover:text-black",
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

export function ExploreShell() {
  const [search, setSearch] = useState("");
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setRef = (id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  useEffect(() => {
    const onScroll = () => {
      setStickyVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { root: null, threshold: [0.15, 0.25, 0.35], rootMargin: "-10% 0px -70% 0px" },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const stats = useMemo(() => {
    const categoryCount = categories.length;
    const subCount = categories.reduce((acc, c) => acc + c.subcategories.length, 0);
    const products = categories.reduce((acc, c) => acc + c.count, 0);
    return { categoryCount, subCount, products };
  }, []);

  const jumpTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-vehsl-watercolor-explore font-inter min-h-screen w-full">
      <StickyNav visible={stickyVisible} activeId={activeId} onJump={jumpTo} />

      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur shadow-soft"
          >
            <ArrowLeft className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-[#0f1115]">Home</span>
          </Link>
          <LanguageToggle />
        </div>

        <div className="mt-14">
          <div className="text-7xl font-extrabold tracking-tight">
            <span className="text-[#0f1115]">Explore </span>
            <span className="text-gradient-brand">everything</span>
          </div>

          <div className="mt-4 text-sm text-[#7c7f87]">
            {stats.categoryCount} categories · {stats.subCount} subcategories · {stats.products}+ products
          </div>

          <div className="mt-8">
            <div className="flex h-14 w-full max-w-[560px] items-center gap-3 rounded-full bg-white/90 px-6 shadow-soft">
              <Search className="h-5 w-5 text-[#7c7f87]" strokeWidth={1.5} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything — 'solar panel', 'mango', 'sofa'…"
                className="w-full bg-transparent text-sm text-[#0f1115] outline-none placeholder:text-[#7c7f87]/70"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} id={c.id} />
          ))}
        </div>

        <div className="mt-14">
          {categories.map((c) => (
            <CategorySection key={c.id} id={c.id} setRef={setRef} />
          ))}
        </div>
      </div>
    </div>
  );
}
