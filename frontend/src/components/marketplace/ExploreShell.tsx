"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronRight, LogOut, Package, Search, Settings, ShoppingCart, User, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/components/ui/utils";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { fetchJsonAuthed } from "@/lib/api";
import { fmtMoney as fmtMoneyUtil } from "@/lib/utils";
import { useCart } from "@/components/product/cart-context";
import { useLanguage } from "@/context/language";
import { categories as staticCategories } from "@/lib/categories";


type UiSubcategory = {
  id: string;
  name: string;
  nameZh?: string;
  slug: string;
  icon: LucideIcon;
  items: string[];
  itemsZh?: string[];
  count: number;
};

type UiCategory = {
  id: string;
  name: string;
  nameZh?: string;
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

function fmtMoney(currency: string, amount: string) {
  return fmtMoneyUtil(amount, currency);
}

function CategoryCard({ category, onClick }: { category: UiCategory; onClick: () => void }) {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const Icon = category.icon;
  const categoryName = language === "zh" ? category.nameZh || category.name : category.name;
  const chips = category.subcategories
    .slice(0, 3)
    .map((s) => (language === "zh" ? s.nameZh || s.name : s.name));
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
        <div className="text-2xl font-bold text-gray-900">{categoryName}</div>
        <div className="mt-1 text-xs text-gray-500">
          {t(`${category.subcategories.length} types`, `${category.subcategories.length} 种类型`)}
        </div>
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
  const { language } = useLanguage();
  const Icon = sub.icon;
  const subName = language === "zh" ? sub.nameZh || sub.name : sub.name;
  const items = language === "zh" ? (sub.itemsZh && sub.itemsZh.length ? sub.itemsZh : sub.items) : sub.items;
  const preview = items
    .filter((x) => !x.startsWith("+"))
    .slice(0, 4)
    .join(", ");
  const more = items.find((x) => x.startsWith("+")) ?? "";

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
          <div className="text-lg font-semibold text-gray-900">{subName}</div>
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
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const Icon = category.icon;
  const categoryName = language === "zh" ? category.nameZh || category.name : category.name;

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
          <div className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">{categoryName}</div>
          <div className="mt-2 text-sm text-gray-500">
            {t(
              `${category.subcategories.length} subcategories · ${category.count} products`,
              `${category.subcategories.length} 个子分类 · ${category.count} 个商品`,
            )}
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

function ProfileMenu({
  onProfileSettings,
  onLogout,
}: {
  onProfileSettings: () => void;
  onLogout: () => void;
}) {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
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

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3] shadow-soft transition hover:bg-[#0062c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
        aria-label="Profile"
        aria-expanded={open}
      >
        <User className="h-5 w-5 text-white" strokeWidth={1.5} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#0f1115] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <Package className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            {t("My orders", "我的订单")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onProfileSettings();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#0f1115] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <Settings className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            {t("Profile settings", "个人设置")}
          </button>
          <div className="h-px bg-black/[0.06]" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#d92d20] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <LogOut className="h-4 w-4 text-[#d92d20]" strokeWidth={1.5} />
            {t("Logout", "退出登录")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StickyNav({
  visible,
  activeId,
  onJump,
  onSearch,
  categories,
  totalQuantity,
  onProfileSettings,
  onLogout,
  authed,
}: {
  visible: boolean;
  activeId: string | null;
  onJump: (id: string) => void;
  onSearch: () => void;
  categories: UiCategory[];
  totalQuantity: number;
  onProfileSettings: () => void;
  onLogout: () => void;
  authed: boolean;
}) {
  const { language } = useLanguage();
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
            const label = language === "zh" ? c.nameZh || c.name : c.name;
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
                {label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle className="h-10" />
          <button
            type="button"
            onClick={onSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
          </button>
          {authed ? (
            <>
              <Link
                href="/checkout"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
                {totalQuantity > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0071e3] text-white text-[11px] font-bold flex items-center justify-center">
                    {totalQuantity > 99 ? "99+" : totalQuantity}
                  </span>
                ) : null}
              </Link>
              <ProfileMenu onProfileSettings={onProfileSettings} onLogout={onLogout} />
            </>
          ) : (
            <Link
              href="/?signin=1"
              className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-[12px] font-semibold text-white hover:bg-black/90"
            >
              {language === "zh" ? "登录" : "Sign in"}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ExploreShell() {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);

  const authed = useMemo(() => {
    try {
      return Boolean(window.localStorage.getItem("vehsl.access") || "");
    } catch {
      return false;
    }
  }, []);

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [openProfileFromQuery, setOpenProfileFromQuery] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const { totalQuantity, refresh: refreshCart } = useCart();

  type BuyerAddress = {
    id: number;
    kind: "primary" | "secondary";
    contact_name: string;
    phone: string;
    country: string;
    region: string;
    city: string;
    street1: string;
    street2: string;
    postal_code: string;
  };

  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalKind, setAddressModalKind] = useState<"primary" | "secondary">("primary");
  const [addressDraft, setAddressDraft] = useState<BuyerAddress>({
    id: 0,
    kind: "primary",
    contact_name: "",
    phone: "",
    country: "",
    region: "",
    city: "",
    street1: "",
    street2: "",
    postal_code: "",
  });
  const [addressSaving, setAddressSaving] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const didInitFromQueryRef = useRef(false);

  const setRef = (id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("profileSettings") !== "1") return;
    setOpenProfileFromQuery(true);
    sp.delete("profileSettings");
    const q = sp.toString();
    const next = `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", next);
  }, []);

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

  const uiCategories: UiCategory[] = useMemo(() => {
    const slugify = (v: string) =>
      v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

    const server = Array.isArray(serverCategories) ? serverCategories : [];
    const serverMap = new Map<string, ExploreApiCategory>();
    for (const c of server) {
      const slug = String(c.slug || c.id || "").toLowerCase();
      if (!slug) continue;
      if (slug === "other" || String(c.name || "").toLowerCase() === "other") continue;
      serverMap.set(slug, c);
    }

    return staticCategories.map((base) => {
      const hit = serverMap.get(String(base.id || "").toLowerCase());
      const children = Array.isArray(hit?.children) ? hit!.children : [];
      const byName = new Map<string, ExploreApiChild>();
      const bySlug = new Map<string, ExploreApiChild>();
      for (const ch of children) {
        byName.set(String(ch.name || "").toLowerCase(), ch);
        bySlug.set(String(ch.slug || ch.id || "").toLowerCase(), ch);
      }

      return {
        id: base.id,
        name: base.name,
        nameZh: base.nameZh,
        icon: base.icon,
        accent: (hit?.accent || base.accent || "#3B82F6").toString(),
        count: Number(hit?.product_count || 0),
        subcategories: base.subcategories.map((s) => {
          const key = String(s.name || "").toLowerCase();
          const ch = byName.get(key) || bySlug.get(slugify(String(s.name || "")));
          const slug = String(ch?.slug || slugify(String(s.name || "")) || "").trim() || slugify(String(s.name || ""));
          return {
            id: slug,
            name: s.name,
            nameZh: s.nameZh,
            slug,
            icon: s.icon,
            items: Array.isArray(s.items) ? s.items : [],
            itemsZh: s.itemsZh,
            count: Number(ch?.product_count || 0),
          };
        }),
      };
    });
  }, [serverCategories]);

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

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    const wrap = searchWrapRef.current;
    if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

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
    setSelected({ category, sub });
    setSubSearch("");
    setSubProducts([]);
    setSubTotal(null);
    setSubHasMore(false);
    setSubPage(1);
    void fetchSubProducts(1, sub.slug, "");
  };

  useEffect(() => {
    if (didInitFromQueryRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    const rawSearch = (sp.get("search") || "").trim();
    const rawCategory = (sp.get("category") || "").trim();
    if (!rawSearch && !rawCategory) {
      didInitFromQueryRef.current = true;
      return;
    }

    if (rawSearch) {
      setSearch(rawSearch);
      setSearchOpen(true);
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    if (rawCategory && uiCategories.length > 0) {
      const hit = uiCategories
        .flatMap((c) => c.subcategories.map((sub) => ({ category: c, sub })))
        .find((x) => x.sub.slug === rawCategory || x.sub.id === rawCategory);
      if (hit) {
        onSelectSubcategory(hit.category, hit.sub);
      } else {
        const top = uiCategories.find((c) => c.id === rawCategory);
        if (top) jumpTo(top.id);
      }
    }

    sp.delete("search");
    sp.delete("category");
    const qs = sp.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", next);
    didInitFromQueryRef.current = true;
  }, [uiCategories]);

  const goDashboard = () => {
    window.location.href = "/";
  };

  const openProfile = useCallback(async () => {
    setProfileOpen(true);
    try {
      const me = (await fetchJsonAuthed("/api/v1/auth/me")) as any;
      setProfileForm({
        first_name: String(me?.first_name || ""),
        last_name: String(me?.last_name || ""),
        phone: String(me?.phone || ""),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load profile.";
      toast.error(msg);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const data = await fetchJsonAuthed("/api/v1/auth/addresses/?page_size=50");
      const rows = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? data : [];
      const parsed: BuyerAddress[] = rows
        .map((r: any) => ({
          id: Number(r?.id || 0),
          kind: (r?.kind || "") as any,
          contact_name: r?.contact_name || "",
          phone: r?.phone || "",
          country: r?.country || "",
          region: r?.region || "",
          city: r?.city || "",
          street1: r?.street1 || "",
          street2: r?.street2 || "",
          postal_code: r?.postal_code || "",
        }))
        .filter((r: BuyerAddress) => r.id && (r.kind === "primary" || r.kind === "secondary"));
      parsed.sort((a, b) => (a.kind === b.kind ? a.id - b.id : a.kind === "primary" ? -1 : 1));
      setAddresses(parsed);
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!openProfileFromQuery) return;
    void openProfile();
    setOpenProfileFromQuery(false);
  }, [openProfile, openProfileFromQuery]);

  useEffect(() => {
    if (!profileOpen) return;
    void fetchAddresses();
  }, [fetchAddresses, profileOpen]);

  const saveProfile = useCallback(async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const payload: any = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone || null,
      };
      const updated = (await fetchJsonAuthed("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })) as any;
      try {
        window.localStorage.setItem("vehsl.user", JSON.stringify(updated));
      } catch {}
      toast.success("Profile updated.");
      setProfileOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Profile update failed.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  }, [profileForm, savingProfile]);

  const primaryAddress = useMemo(() => addresses.find((a) => a.kind === "primary") || null, [addresses]);
  const secondaryAddress = useMemo(() => addresses.find((a) => a.kind === "secondary") || null, [addresses]);

  const openAddressModal = useCallback(
    (kind: "primary" | "secondary") => {
      setAddressModalKind(kind);
      const existing = (kind === "primary" ? primaryAddress : secondaryAddress) || null;
      if (existing) {
        setAddressDraft({ ...existing });
      } else {
        setAddressDraft({
          id: 0,
          kind,
          contact_name: "",
          phone: "",
          country: "",
          region: "",
          city: "",
          street1: "",
          street2: "",
          postal_code: "",
        });
      }
      setAddressModalOpen(true);
    },
    [primaryAddress, secondaryAddress],
  );

  const saveAddress = useCallback(async () => {
    if (addressSaving) return;
    const payload = {
      kind: addressModalKind,
      contact_name: String(addressDraft.contact_name || "").trim(),
      phone: String(addressDraft.phone || "").trim(),
      country: String(addressDraft.country || "").trim(),
      region: String(addressDraft.region || "").trim(),
      city: String(addressDraft.city || "").trim(),
      street1: String(addressDraft.street1 || "").trim(),
      street2: String(addressDraft.street2 || "").trim(),
      postal_code: String(addressDraft.postal_code || "").trim(),
    };
    if (!payload.country || !payload.city || !payload.street1) {
      toast.error(t("Country, City and Street are required.", "国家、城市和街道为必填项。"));
      return;
    }
    setAddressSaving(true);
    try {
      const existing = (addressModalKind === "primary" ? primaryAddress : secondaryAddress) || null;
      if (existing?.id) {
        await fetchJsonAuthed(`/api/v1/auth/addresses/${existing.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJsonAuthed("/api/v1/auth/addresses/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      toast.success(t("Address saved.", "地址已保存。"));
      setAddressModalOpen(false);
      await fetchAddresses();
    } catch (e: any) {
      toast.error(e?.message || t("Failed to save address.", "保存地址失败。"));
    } finally {
      setAddressSaving(false);
    }
  }, [addressDraft, addressModalKind, addressSaving, fetchAddresses, primaryAddress, secondaryAddress, t]);

  const logout = useCallback(async () => {
    const refresh = window.localStorage.getItem("vehsl.refresh") || "";
    try {
      await fetchJsonAuthed("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
    } catch {}
    try {
      window.localStorage.removeItem("vehsl.access");
      window.localStorage.removeItem("vehsl.refresh");
      window.localStorage.removeItem("vehsl.user");
    } catch {}
    window.location.href = "/?signin=1";
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    void refreshCart();
  }, [profileOpen, refreshCart]);

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
      <StickyNav
        visible={stickyVisible || searchOpen}
        activeId={activeId}
        onJump={jumpTo}
        onSearch={openSearch}
        categories={uiCategories}
        totalQuantity={totalQuantity}
        onProfileSettings={() => void openProfile()}
        onLogout={() => void logout()}
        authed={authed}
      />
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
                <div className="text-[12px] font-semibold text-[#7c7f87]">
                  {language === "zh"
                    ? selected.category.nameZh || selected.category.name
                    : selected.category.name}
                </div>
                <div className="mt-1 text-[20px] font-extrabold text-[#0f1115]">
                  {language === "zh" ? selected.sub.nameZh || selected.sub.name : selected.sub.name}
                </div>
                <div className="mt-1 text-[12px] text-[#7c7f87]">
                  {typeof subTotal === "number" ? t(`${subTotal} products`, `${subTotal} 个商品`) : ""}
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
                  placeholder={t("Search in this subcategory…", "在此子类别中搜索…")}
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
                      <div className="text-[13px] font-semibold text-[#0f1115] line-clamp-2">
                        {p.title || p.name}
                      </div>
                      <div className="mt-1 text-[12px] text-[#7c7f87] truncate">{p.seller_name || ""}</div>
                      <div className="mt-auto pt-3 text-[12px] font-semibold text-[#0f1115]">
                        {fmtMoney(p.currency, p.price)}
                      </div>
                    </div>
                  </Link>
                ))}
                {!subLoading && subProducts.length === 0 ? (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl border border-white/60 bg-white/80 p-6 text-[13px] text-[#7c7f87]">
                    {t("No products found.", "未找到商品。")}
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
                    {subLoading ? t("Loading…", "加载中…") : t("Load more", "加载更多")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {profileOpen ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setProfileOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setProfileOpen(false);
            }}
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/50 bg-white/90 shadow-soft backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div>
                <div className="text-[16px] font-extrabold text-[#0f1115]">{t("Profile settings", "个人设置")}</div>
                <div className="mt-1 text-[12px] text-[#7c7f87]">{t("Update your buyer profile settings", "更新你的买家资料")}</div>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="max-h-[70dvh] overflow-auto px-6 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder={t("First name", "名")}
                  className="h-12 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                />
                <input
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder={t("Last name", "姓")}
                  className="h-12 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                />
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={t("Phone", "电话")}
                  className="h-12 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none sm:col-span-2"
                />
              </div>

              <div className="mt-8">
                <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">{t("ADDRESS BOOK", "地址簿")}</div>
                <div className="mt-2 text-[12px] text-[#7c7f87]">{t("Used for shipping quotes and checkout.", "用于运费报价与结算。")}</div>
                <div className="mt-4 space-y-3">
                  {[
                    { kind: "primary" as const, title: t("Primary address", "主地址"), addr: primaryAddress },
                    { kind: "secondary" as const, title: t("Secondary address", "次地址"), addr: secondaryAddress },
                  ].map((row) => {
                    const a = row.addr;
                    const addrLine = a
                      ? [a.street1, a.street2, a.city, a.region, a.country, a.postal_code].map((x) => String(x || "").trim()).filter(Boolean).join(", ")
                      : "";
                    return (
                      <div key={row.kind} className="rounded-3xl border border-black/[0.06] bg-white/80 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[13px] font-extrabold text-[#0f1115]">{row.title}</div>
                            <div className="mt-1 text-[12px] text-[#7c7f87] truncate">
                              {addressesLoading ? t("Loading…", "加载中…") : addrLine || t("Not set yet", "尚未设置")}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openAddressModal(row.kind)}
                            className="h-9 rounded-full bg-black px-4 text-[12px] font-semibold text-white hover:bg-black/90"
                          >
                            {a ? t("Edit", "编辑") : t("Add", "添加")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => void saveProfile()}
                  className="rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-black/90 disabled:opacity-60"
                >
                  {savingProfile ? t("Saving…", "保存中…") : t("Save", "保存")}
                </button>
              </div>
            </div>
          </div>

          {addressModalOpen ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={() => setAddressModalOpen(false)}
                aria-label="Close"
              />
              <div className="relative w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/70 bg-white/90 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
                  <div>
                    <div className="text-[14px] font-black text-[#1A1A1A]/85">
                      {addressModalKind === "primary" ? t("Primary address", "主地址") : t("Secondary address", "次地址")}
                    </div>
                    <div className="text-[12px] font-medium text-[#1A1A1A]/40">{t("Used for shipping quotes and delivery.", "用于运费报价与配送。")}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                  >
                    {t("Close", "关闭")}
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={addressDraft.contact_name}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, contact_name: e.target.value }))}
                      placeholder={t("Contact name", "联系人")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.phone}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t("Phone", "电话")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.country}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, country: e.target.value }))}
                      placeholder={t("Country", "国家")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.region}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, region: e.target.value }))}
                      placeholder={t("State/Region", "省/州")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.city}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, city: e.target.value }))}
                      placeholder={t("City", "城市")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.postal_code}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, postal_code: e.target.value }))}
                      placeholder={t("Postal code", "邮编")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none"
                    />
                    <input
                      value={addressDraft.street1}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, street1: e.target.value }))}
                      placeholder={t("Street address", "街道地址")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none sm:col-span-2"
                    />
                    <input
                      value={addressDraft.street2}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, street2: e.target.value }))}
                      placeholder={t("Apt/Suite (optional)", "门牌/楼层（可选）")}
                      className="h-11 rounded-2xl border border-black/[0.06] bg-white/80 px-4 text-[13px] font-semibold text-[#0f1115] outline-none sm:col-span-2"
                    />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={addressSaving}
                      onClick={() => void saveAddress()}
                      className="rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-black/90 disabled:opacity-60"
                    >
                      {addressSaving ? t("Saving…", "保存中…") : t("Save address", "保存地址")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}


      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goDashboard}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
          >
            <ArrowLeft className="h-4 w-4 text-[#1f2330]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-[#0f1115]">{t("Home", "首页")}</span>
          </button>
          <div className="flex items-center gap-2">
            <LanguageToggle className="h-10" />
            <button
              type="button"
              onClick={() => {
                openSearch();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
            </button>
            {authed ? (
              <>
                <Link
                  href="/checkout"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30"
                  aria-label="Cart"
                >
                  <ShoppingCart className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
                  {totalQuantity > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0071e3] text-white text-[11px] font-bold flex items-center justify-center">
                      {totalQuantity > 99 ? "99+" : totalQuantity}
                    </span>
                  ) : null}
                </Link>
                <ProfileMenu onProfileSettings={() => void openProfile()} onLogout={() => void logout()} />
              </>
            ) : (
              <Link
                href="/?signin=1"
                className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-[12px] font-semibold text-white hover:bg-black/90"
              >
                {language === "zh" ? "登录" : "Sign in"}
              </Link>
            )}
          </div>
        </div>

        <div className="mt-14">
          <div className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-[#0f1115]">{t("Explore ", "探索")}</span>
            <span className="text-gradient-brand">{t("everything", "全部")}</span>
          </div>

          <div className="mt-4 text-sm text-[#7c7f87]">
            {t(
              `${stats.categoryCount} categories · ${stats.subCount} subcategories · ${stats.products}+ products`,
              `${stats.categoryCount} 个分类 · ${stats.subCount} 个子分类 · ${stats.products}+ 个商品`,
            )}
          </div>

          <div className="mt-8">
            <div className="w-full max-w-[560px]" ref={searchWrapRef}>
              <div className="flex h-14 w-full items-center gap-3 rounded-full bg-white/90 px-6 shadow-soft">
                <Search className="h-5 w-5 text-[#7c7f87]" strokeWidth={1.5} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  ref={searchInputRef}
                  placeholder={t("Search anything — 'solar panel', 'mango', 'sofa'…", "搜索任意商品 — “太阳能板”、“芒果”、“沙发”…")}
                  className="w-full bg-transparent text-sm text-[#0f1115] outline-none placeholder:text-[#7c7f87]/70"
                />
              </div>
              {searchOpen && (searchingProducts || searchResults.length > 0) ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-soft">
                  <div className="px-4 py-3 text-xs font-semibold text-[#7c7f87]">
                    {searchingProducts ? t("Searching…", "搜索中…") : t("Top matches", "匹配结果")}
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
                          <div className="truncate text-[13px] font-semibold text-[#0f1115]">
                            {p.title || p.name}
                          </div>
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
