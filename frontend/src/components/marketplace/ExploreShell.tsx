"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";

import { cn } from "@/components/ui/utils";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { categories as fallbackCategories } from "@/lib/categories";
import { fetchJsonAuthed } from "@/lib/api";

type UiSubcategory = {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  items: string[];
  count: number;
};

type UiCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: string;
  count: number;
  subcategories: UiSubcategory[];
};

type ExploreApiChild = {
  id: number;
  name: string;
  slug: string;
  accent: string;
  icon: string;
  product_count: number;
  parent_id: number;
};

type ExploreApiCategory = {
  id: number;
  name: string;
  slug: string;
  accent: string;
  icon: string;
  product_count: number;
  children: ExploreApiChild[];
};

type ExploreApiResponse = {
  categories: ExploreApiCategory[];
  total_products: number;
};

type ProductRow = {
  id: number;
  name: string;
  title?: string;
  currency: string;
  price: string;
  hero_image_url?: string;
  seller_name?: string;
};

type ProductsApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductRow[];
};

function slugifyName(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function fmtMoney(currency: string, amount: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(num);
  } catch {
    return `${currency} ${amount}`;
  }
}

function CategoryCard({ category, onClick }: { category: UiCategory; onClick: () => void }) {
  const Icon = category.icon;
  const chips = category.subcategories.slice(0, 3).map((s) => s.name);
  const overflow = Math.max(category.subcategories.length - chips.length, 0);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full rounded-3xl border border-white/60 bg-white/85 p-6 backdrop-blur-sm shadow-soft flex flex-col cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
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

      <div className="mt-5 flex flex-wrap gap-2 min-h-[42px]">
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
  category,
  sub,
  onClick,
}: {
  category: UiCategory;
  sub: UiSubcategory;
  onClick: () => void;
}) {
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
      className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-soft cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
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
  category,
  setRef,
  onSelectSubcategory,
}: {
  category: UiCategory;
  setRef: (id: string, el: HTMLElement | null) => void;
  onSelectSubcategory: (category: UiCategory, sub: UiSubcategory) => void;
}) {
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
          <div className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">{category.name}</div>
          <div className="mt-2 text-sm text-gray-500">
            {category.subcategories.length} subcategories · {category.count} products
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {category.subcategories.slice(0, 9).map((s) => (
          <SubcategoryCard
            key={`${category.id}-${s.id}`}
            category={category}
            sub={s}
            onClick={() => onSelectSubcategory(category, s)}
          />
        ))}
      </div>
    </section>
  );
}

function StickyNav({
  visible,
  activeId,
  onJump,
  categories,
}: {
  visible: boolean;
  activeId: string | null;
  onJump: (id: string) => void;
  categories: UiCategory[];
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
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [serverCategories, setServerCategories] = useState<ExploreApiCategory[] | null>(null);
  const [serverTotalProducts, setServerTotalProducts] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ category: UiCategory; sub: UiSubcategory } | null>(null);
  const [subSearch, setSubSearch] = useState("");
  const [subProducts, setSubProducts] = useState<ProductRow[]>([]);
  const [subTotal, setSubTotal] = useState<number | null>(null);
  const [subHasMore, setSubHasMore] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetchJsonAuthed("/api/v1/categories/explore/")
      .then((data) => {
        if (cancelled) return;
        const payload = data as ExploreApiResponse;
        if (!payload || !Array.isArray(payload.categories)) {
          setServerCategories([]);
          setServerTotalProducts(0);
          return;
        }
        setServerCategories(payload.categories);
        setServerTotalProducts(typeof payload.total_products === "number" ? payload.total_products : null);
      })
      .catch(() => {
        if (cancelled) return;
        setServerCategories([]);
        setServerTotalProducts(null);
      })
      .finally(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackUiCategories: UiCategory[] = useMemo(() => {
    return fallbackCategories
      .filter((c) => c.id.toLowerCase() !== "other" && c.name.toLowerCase() !== "other")
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        accent: c.accent,
        count: 0,
        subcategories: c.subcategories.map((s) => {
          const slug = `${c.id}-${slugifyName(s.name)}`;
          return {
            id: `${c.id}-${s.name.toLowerCase().replace(/\s+/g, "-")}`,
            name: s.name,
            slug,
            icon: s.icon,
            items: s.items,
            count: 0,
          };
        }),
      }));
  }, []);

  const uiCategories: UiCategory[] = useMemo(() => {
    const server = Array.isArray(serverCategories) ? serverCategories : [];
    const serverBySlug = new Map(server.map((c) => [String(c.slug || "").toLowerCase(), c]));

    return fallbackUiCategories.map((c) => {
      const serverCat = serverBySlug.get(c.id.toLowerCase()) || null;
      const accent = (serverCat?.accent || c.accent || "#3B82F6").toString();
      const children = Array.isArray(serverCat?.children) ? serverCat!.children : [];
      const bySlug = new Map(children.map((ch) => [String(ch.slug || "").toLowerCase(), ch]));
      const byName = new Map(children.map((ch) => [String(ch.name || "").toLowerCase(), ch]));

      return {
        ...c,
        accent,
        count: Number(serverCat?.product_count || 0),
        subcategories: c.subcategories.map((s) => {
          const match = bySlug.get(s.slug.toLowerCase()) || byName.get(s.name.toLowerCase()) || null;
          return { ...s, count: Number(match?.product_count || 0) };
        }),
      };
    });
  }, [fallbackUiCategories, serverCategories]);

  const stats = useMemo(() => {
    const categoryCount = uiCategories.length;
    const subCount = uiCategories.reduce((acc, c) => acc + c.subcategories.length, 0);
    const products =
      typeof serverTotalProducts === "number"
        ? serverTotalProducts
        : uiCategories.reduce((acc, c) => acc + (Number.isFinite(c.count) ? c.count : 0), 0);
    return { categoryCount, subCount, products };
  }, [serverTotalProducts, uiCategories]);

  const jumpTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchSubProducts = async (page: number, categorySlug: string, query: string) => {
    setSubLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("category", categorySlug);
      params.set("page", String(page));
      params.set("page_size", "24");
      params.set("ordering", "-created_at");
      if (query.trim().length >= 2) params.set("search", query.trim());
      const data = (await fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)) as ProductsApiResponse;
      const rows = Array.isArray(data?.results) ? data.results : [];
      setSubTotal(typeof data?.count === "number" ? data.count : null);
      setSubHasMore(Boolean(data?.next));
      setSubPage(page);
      setSubProducts((prev) => (page <= 1 ? rows : [...prev, ...rows]));
    } catch {
      setSubTotal(null);
      setSubHasMore(false);
      setSubProducts([]);
    } finally {
      setSubLoading(false);
    }
  };

  const onSelectSubcategory = (category: UiCategory, sub: UiSubcategory) => {
    const server = Array.isArray(serverCategories) ? serverCategories : [];
    const serverCat = server.find((c) => String(c.slug || "").toLowerCase() === category.id.toLowerCase()) || null;
    const serverChildren = Array.isArray(serverCat?.children) ? serverCat!.children : [];
    const resolvedSlug =
      serverChildren.find((ch) => String(ch.slug || "").toLowerCase() === sub.slug.toLowerCase())?.slug ||
      serverChildren.find((ch) => String(ch.name || "").toLowerCase() === sub.name.toLowerCase())?.slug ||
      sub.slug;

    setSelected({ category, sub });
    setSubSearch("");
    setSubProducts([]);
    setSubTotal(null);
    setSubHasMore(false);
    setSubPage(1);
    void fetchSubProducts(1, resolvedSlug, "");
  };

  const goDashboard = () => {
    window.location.href = "/";
  };

  useEffect(() => {
    const q = search.trim();
    if (!searchOpen || q.length < 2) {
      setSearchResults([]);
      setSearchingProducts(false);
      return;
    }
    setSearchingProducts(true);
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("search", q);
      params.set("page", "1");
      params.set("page_size", "8");
      params.set("ordering", "-created_at");
      fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)
        .then((data) => {
          const rows = Array.isArray((data as ProductsApiResponse)?.results)
            ? ((data as ProductsApiResponse).results as ProductRow[])
            : [];
          setSearchResults(rows);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchingProducts(false));
    }, 220);
    return () => window.clearTimeout(t);
  }, [search, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = searchWrapRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [searchOpen]);

  useEffect(() => {
    if (!selected) return;
    const q = subSearch.trim();
    const t = window.setTimeout(() => {
      void fetchSubProducts(1, selected.sub.slug, q);
    }, 240);
    return () => window.clearTimeout(t);
  }, [subSearch, selected?.sub.slug]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);


  return (
    <div className="bg-vehsl-watercolor-explore font-inter min-h-dvh w-full overflow-x-hidden">
      <StickyNav visible={stickyVisible} activeId={activeId} onJump={jumpTo} categories={uiCategories} />
      {selected ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelected(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelected(null);
            }}
          />
          <div className="absolute inset-x-0 top-6 mx-auto w-[min(100%-24px,960px)] rounded-3xl border border-white/50 bg-white/90 shadow-soft backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div>
                <div className="text-[12px] font-semibold text-[#7c7f87]">{selected.category.name}</div>
                <div className="mt-1 text-[20px] font-extrabold text-[#0f1115]">{selected.sub.name}</div>
                <div className="mt-1 text-[12px] text-[#7c7f87]">
                  {typeof subTotal === "number" ? `${subTotal} products` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="flex h-12 w-full items-center gap-3 rounded-full bg-white/90 px-5 shadow-soft">
                <Search className="h-5 w-5 text-[#7c7f87]" strokeWidth={1.5} />
                <input
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Search in this subcategory…"
                  className="w-full bg-transparent text-sm text-[#0f1115] outline-none placeholder:text-[#7c7f87]/70"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {subProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="h-full rounded-2xl border border-white/60 bg-white/85 shadow-soft overflow-hidden hover:bg-white/95 transition flex flex-col"
                  >
                    {p.hero_image_url ? (
                      <img src={p.hero_image_url} alt={p.title || p.name} className="h-[140px] w-full object-cover" />
                    ) : (
                      <div className="h-[140px] w-full bg-black/[0.03]" />
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-[13px] font-semibold text-[#0f1115] line-clamp-2">{p.title || p.name}</div>
                      <div className="mt-1 text-[12px] text-[#7c7f87] truncate">{p.seller_name || ""}</div>
                      <div className="mt-auto pt-3 text-[12px] font-semibold text-[#0f1115]">
                        {fmtMoney(p.currency, p.price)}
                      </div>
                    </div>
                  </Link>
                ))}
                {!subLoading && subProducts.length === 0 ? (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl border border-white/60 bg-white/80 p-6 text-[13px] text-[#7c7f87]">
                    No products found.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                {subHasMore ? (
                  <button
                    type="button"
                    disabled={subLoading}
                    onClick={() => void fetchSubProducts(subPage + 1, selected.sub.slug, subSearch.trim())}
                    className="rounded-full bg-white/80 border border-white/70 px-5 py-2.5 text-[12px] font-semibold text-[#0f1115] hover:bg-white disabled:opacity-60"
                  >
                    {subLoading ? "Loading…" : "Load more"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}


      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goDashboard}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur shadow-soft"
          >
            <ArrowLeft className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-[#0f1115]">Home</span>
          </button>
          <LanguageToggle />
        </div>

        <div className="mt-14">
          <div className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-[#0f1115]">Explore </span>
            <span className="text-gradient-brand">everything</span>
          </div>

          <div className="mt-4 text-sm text-[#7c7f87]">
            {stats.categoryCount} categories · {stats.subCount} subcategories · {stats.products}+ products
          </div>

          <div className="mt-8">
            <div className="w-full max-w-[560px]" ref={searchWrapRef}>
              <div className="flex h-14 w-full items-center gap-3 rounded-full bg-white/90 px-6 shadow-soft">
                <Search className="h-5 w-5 text-[#7c7f87]" strokeWidth={1.5} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search anything — 'solar panel', 'mango', 'sofa'…"
                  className="w-full bg-transparent text-sm text-[#0f1115] outline-none placeholder:text-[#7c7f87]/70"
                />
              </div>
              {searchOpen && (searchingProducts || searchResults.length > 0) ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-soft">
                  <div className="px-4 py-3 text-xs font-semibold text-[#7c7f87]">
                    {searchingProducts ? "Searching…" : "Top matches"}
                  </div>
                  <div className="divide-y divide-black/[0.04]">
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/[0.02]"
                        onClick={() => setSearchOpen(false)}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#0f1115]">{p.title || p.name}</div>
                          <div className="truncate text-[12px] text-[#7c7f87]">{p.seller_name || ""}</div>
                        </div>
                        <div className="shrink-0 text-[12px] font-semibold text-[#0f1115]">
                          {fmtMoney(p.currency, p.price)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {uiCategories.map((c) => (
            <CategoryCard key={c.id} category={c} onClick={() => jumpTo(c.id)} />
          ))}
        </div>

        <div className="mt-14">
          {uiCategories.map((c) => (
            <CategorySection key={c.id} category={c} setRef={setRef} onSelectSubcategory={onSelectSubcategory} />
          ))}
        </div>
      </div>
    </div>
  );
}
