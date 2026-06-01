"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { fetchJsonAuthed } from "@/lib/api";
import { safeJsonParse, fmtMoney as fmtMoneyUtil } from "@/lib/utils";
import { useCart } from "@/components/product/cart-context";
import { useLanguage } from "@/context/language";

type Product = {
  id: number;
  name: string;
  title: string;
  description: string;
  currency: string;
  price: string;
  category: number;
  category_name?: string;
  sku?: string;
  hs_code?: string;
  lead_time_days?: number;
  review_count?: number;
  average_rating?: number | null;
  vehsl_rating?: string | number | null;
  seller_rating?: string | number | null;
  origin_location?: Record<string, unknown>;
  weight_grams?: number;
  ship_time_min_days?: number;
  ship_time_max_days?: number;
  sample_available?: boolean;
  sample_ship_days?: number;
  images?: string[];
  media?: Array<{
    id: number;
    media_type: string;
    position: number;
    public_url: string;
    variation: number | null;
    title?: string;
    content_type?: string;
    size_bytes?: number;
  }>;
  variations?: Array<{ id: number; attributes: Record<string, unknown>; sku?: string }>;
  pricing_tiers?: Array<{
    id: number;
    min_quantity: number;
    max_quantity: number | null;
    unit_price: string;
    currency: string;
    variation: number | null;
  }>;
  seller_id?: number;
  seller_name?: string;
  hero_image_url?: string;
  detail_config?: Record<string, unknown>;
  quantity_available?: number;
  stock_status?: string;
};

type BuyerAddress = {
  id: number;
  kind: "primary" | "secondary";
  contact_name?: string;
  phone?: string;
  country?: string;
  region?: string;
  city?: string;
  street1?: string;
  street2?: string;
  postal_code?: string;
};

type ShippingQuote = {
  method: "sea" | "air" | "express";
  label: string;
  currency: string;
  unit_price: string;
  total_price: string;
  min_days: number;
  max_days: number;
  source?: string;
};

function fmtMoney(currency: string, amount: string) {
  return fmtMoneyUtil(amount, currency);
}

function fmtBytes(bytes: number) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (n >= gb) return `${(n / gb).toFixed(1)} GB`;
  if (n >= mb) return `${(n / mb).toFixed(1)} MB`;
  if (n >= kb) return `${Math.round(n / kb)} KB`;
  return `${Math.round(n)} B`;
}

export function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = useMemo(() => Number(params?.id || 0), [params?.id]);
  const { addToCart, totalQuantity } = useCart();
  const { language } = useLanguage();
  const t = useCallback((en: string, zh: string) => (language === "zh" ? zh : en), [language]);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [qty, setQty] = useState(1);
  const [qtyDraft, setQtyDraft] = useState("1");
  const [qtyEditing, setQtyEditing] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<"overview" | "specs" | "documents" | "compare">("overview");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<"primary" | "secondary" | "storage">("primary");
  const [deliverySolution, setDeliverySolution] = useState<"sea" | "air" | "express" | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [specOpen, setSpecOpen] = useState<Record<string, boolean>>({});
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareSearching, setCompareSearching] = useState(false);
  const [compareResults, setCompareResults] = useState<Product[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  const fetchProduct = useCallback(async () => {
    if (!productId || !Number.isFinite(productId)) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = (await fetchJsonAuthed(`/api/v1/products/${productId}/`)) as Product;
      setProduct(data && typeof data === "object" ? data : null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Failed to load product.", "加载商品失败。");
      toast.error(msg);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    setQty(1);
    setQtyDraft("1");
    setQtyEditing(false);
    setActiveImage(0);
    setTab("overview");
    setSelectedAttrs({});
    setSelectedTierId(null);
    setDeliveryLocation("primary");
    setDeliverySolution(null);
    setAddresses([]);
    setAddressesLoading(false);
    setQuotes([]);
    setQuotesLoading(false);
    setSpecOpen({});
    setCompareOpen(false);
    setCompareQuery("");
    setCompareSearching(false);
    setCompareResults([]);
    setCompareIds([]);
    setCompareLoading(false);
    setCompareProducts([]);
  }, [productId]);

  useEffect(() => {
    if (!qtyEditing) setQtyDraft(String(Math.max(1, Number(qty) || 1)));
  }, [qty, qtyEditing]);

  const bumpQty = useCallback((delta: number) => {
    setQty((prev) => {
      const next = Math.max(1, (Number(prev) || 1) + delta);
      setQtyDraft(String(next));
      return next;
    });
  }, []);

  const optionGroups = useMemo(() => {
    const vars = Array.isArray(product?.variations) ? product!.variations! : [];
    const map = new Map<string, Set<string>>();
    for (const v of vars) {
      const attrs = v?.attributes && typeof v.attributes === "object" ? (v.attributes as Record<string, unknown>) : {};
      for (const [k, raw] of Object.entries(attrs)) {
        if (!k) continue;
        const key = k.toString().trim();
        if (!key) continue;
        const val =
          typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" ? String(raw) : "";
        if (!val) continue;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(val);
      }
    }
    const groups = [...map.entries()]
      .map(([key, set]) => ({ key, values: [...set.values()].sort() }))
      .filter((g) => g.values.length > 1);
    groups.sort((a, b) => a.key.localeCompare(b.key));
    return groups;
  }, [product?.variations]);

  const normalizedGroups = useMemo(() => {
    const groups = optionGroups.map((g) => {
      const keyLower = g.key.toLowerCase();
      const kind = keyLower.includes("color") || keyLower.includes("colour")
        ? "color"
        : keyLower.includes("length") || keyLower.includes("size")
          ? "length"
          : keyLower.includes("speed") || keyLower.includes("bandwidth")
            ? "speed"
            : "other";
      return { ...g, kind };
    });
    const score = (k: string) => (k === "color" ? 0 : k === "length" ? 1 : k === "speed" ? 2 : 3);
    return [...groups].sort((a, b) => score(a.kind) - score(b.kind) || a.key.localeCompare(b.key));
  }, [optionGroups]);

  const selectedVariationId = useMemo(() => {
    const vars = Array.isArray(product?.variations) ? product!.variations! : [];
    const keys = normalizedGroups.map((g) => g.key);
    if (!keys.length) return null;
    const allSelected = keys.every((k) => Boolean(selectedAttrs[k]));
    if (!allSelected) return null;
    const found = vars.find((v) => {
      const attrs = v?.attributes && typeof v.attributes === "object" ? (v.attributes as Record<string, unknown>) : {};
      return keys.every((k) => String(attrs[k] ?? "") === String(selectedAttrs[k] ?? ""));
    });
    return found?.id ?? null;
  }, [normalizedGroups, product?.variations, selectedAttrs]);

  useEffect(() => {
    if (!product) return;
    if (!normalizedGroups.length) return;
    const vars = Array.isArray(product.variations) ? product.variations : [];
    if (!vars.length) return;
    const v0 = vars[0];
    const v0Attrs = v0?.attributes && typeof v0.attributes === "object" ? (v0.attributes as Record<string, unknown>) : {};

    setSelectedAttrs((prev) => {
      const keys = normalizedGroups.map((g) => g.key);
      const missing = keys.filter((k) => !String(prev[k] || "").trim());
      if (!missing.length) return prev;
      const next: Record<string, string> = { ...prev };
      for (const k of missing) {
        const raw = v0Attrs[k];
        const fromVar =
          typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" ? String(raw).trim() : "";
        if (fromVar) {
          next[k] = fromVar;
          continue;
        }
        const g = normalizedGroups.find((x) => x.key === k);
        const fallback = String(g?.values?.[0] || "").trim();
        if (fallback) next[k] = fallback;
      }
      return next;
    });
  }, [normalizedGroups, product]);

  const mediaByVariation = useMemo(() => {
    const rows = Array.isArray(product?.media) ? product!.media! : [];
    const map = new Map<number | null, Array<{ id: number; position: number; public_url: string }>>();
    for (const r of rows) {
      if (!r || r.media_type !== "image") continue;
      const u = (r.public_url || "").trim();
      if (!u) continue;
      const key = (r.variation ?? null) as number | null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: r.id, position: r.position ?? 0, public_url: u });
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.position || 0) - (b.position || 0) || a.id - b.id);
      map.set(k, list);
    }
    return map;
  }, [product?.media]);

  const images = useMemo(() => {
    const uniq = new Set<string>();
    const out: string[] = [];
    const add = (u: string) => {
      const v = (u || "").trim();
      if (!v) return;
      if (uniq.has(v)) return;
      uniq.add(v);
      out.push(v);
    };

    const hero = (product?.hero_image_url || "").trim();

    if (selectedVariationId && mediaByVariation.has(selectedVariationId)) {
      for (const r of mediaByVariation.get(selectedVariationId) || []) add(r.public_url);
    }

    if (!out.length && mediaByVariation.has(null)) {
      for (const r of mediaByVariation.get(null) || []) add(r.public_url);
    }

    if (!out.length) {
      const list = Array.isArray(product?.images) ? product!.images! : [];
      for (const u of list) add(u);
      if (hero) add(hero);
    } else if (hero) {
      add(hero);
    }

    return out.slice(0, 8);
  }, [mediaByVariation, product?.hero_image_url, product?.images, selectedVariationId]);

  useEffect(() => {
    if (activeImage >= images.length) setActiveImage(0);
  }, [activeImage, images.length]);

  const findVariationForChoice = useCallback(
    (key: string, value: string) => {
      const vars = Array.isArray(product?.variations) ? product!.variations! : [];
      const otherKeys = normalizedGroups.map((g) => g.key).filter((k) => k !== key);
      const picked: Record<string, string> = { ...selectedAttrs, [key]: value };
      const allSelected = otherKeys.every((k) => Boolean(picked[k]));
      const candidates = allSelected ? vars : vars;
      const match = candidates.find((v) => {
        const attrs = v?.attributes && typeof v.attributes === "object" ? (v.attributes as Record<string, unknown>) : {};
        if (String(attrs[key] ?? "") !== String(value ?? "")) return false;
        if (allSelected) return otherKeys.every((k) => String(attrs[k] ?? "") === String(picked[k] ?? ""));
        return true;
      });
      return match?.id ?? null;
    },
    [normalizedGroups, product?.variations, selectedAttrs],
  );

  const getVariationPreviewImage = useCallback(
    (variationId: number | null) => {
      if (!variationId) return "";
      const list = mediaByVariation.get(variationId) || [];
      return (list[0]?.public_url || "").trim();
    },
    [mediaByVariation],
  );

  const toggleWishlist = useCallback(async () => {
    if (!product) return;
    if (toggling) return;
    setToggling(true);
    try {
      await fetchJsonAuthed(`/api/v1/wishlist/toggle/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      setWishlisted((x) => !x);
      toast.success(wishlisted ? t("Removed from wishlist", "已从收藏移除") : t("Saved to wishlist", "已收藏"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Wishlist update failed.", "收藏更新失败。");
      toast.error(msg);
    } finally {
      setToggling(false);
    }
  }, [product, toggling, wishlisted, t]);

  const addThisToCart = useCallback(async () => {
    if (!product) return;
    try {
      await addToCart(product.id, Math.max(1, qty), selectedVariationId);
      toast.success(t("Added to cart", "已加入购物车"));
      router.push("/explore");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Add to cart failed.", "加入购物车失败。");
      toast.error(msg);
    }
  }, [addToCart, product, qty, router, selectedVariationId, t]);

  const localizedCategory = useMemo(() => {
    const raw = (product?.category_name || "").trim();
    if (!raw) return t("Category", "分类");
    return raw;
  }, [product?.category_name, t]);

  const localizedSeller = useMemo(() => {
    const raw = (product?.seller_name || "").trim();
    if (!raw) return t("Seller", "卖家");
    return raw;
  }, [product?.seller_name, t]);

  const tiers = useMemo(() => {
    const rows = Array.isArray(product?.pricing_tiers) ? product!.pricing_tiers! : [];
    const base = rows.filter((r) => (r.variation ?? null) === null);
    const byVariation = selectedVariationId ? rows.filter((r) => (r.variation ?? null) === selectedVariationId) : [];
    const pool = selectedVariationId ? byVariation : base.length ? base : rows;

    const deduped = new Map<string, (typeof rows)[number]>();
    for (const r of pool) {
      const minQ = Number(r.min_quantity || 0) || 0;
      const maxQ = r.max_quantity === null || r.max_quantity === undefined ? null : Number(r.max_quantity);
      const curr = String(r.currency || product?.currency || "USD");
      const k = `${minQ}:${maxQ ?? ""}:${curr}`;

      const prev = deduped.get(k);
      if (!prev) {
        deduped.set(k, r);
        continue;
      }
      const prevPrice = Number((prev.unit_price as any) ?? NaN);
      const nextPrice = Number((r.unit_price as any) ?? NaN);
      if (Number.isFinite(nextPrice) && (!Number.isFinite(prevPrice) || nextPrice < prevPrice)) {
        deduped.set(k, r);
      }
    }

    const sorted = [...deduped.values()].sort((a, b) => {
      const amin = Number(a.min_quantity || 0) || 0;
      const bmin = Number(b.min_quantity || 0) || 0;
      if (amin !== bmin) return amin - bmin;
      const amax = a.max_quantity === null || a.max_quantity === undefined ? Number.POSITIVE_INFINITY : Number(a.max_quantity);
      const bmax = b.max_quantity === null || b.max_quantity === undefined ? Number.POSITIVE_INFINITY : Number(b.max_quantity);
      if (amax !== bmax) return amax - bmax;
      return (a.id || 0) - (b.id || 0);
    });

    return sorted;
  }, [product?.pricing_tiers, selectedVariationId]);

  const detailConfig = useMemo(() => {
    const cfg = product?.detail_config && typeof product.detail_config === "object" ? (product.detail_config as Record<string, unknown>) : {};
    return cfg;
  }, [product?.detail_config]);

  const detailHighlights = useMemo(() => {
    const raw = detailConfig["highlights"];
    if (Array.isArray(raw)) {
      const list = raw
        .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
        .filter(Boolean)
        .map((x) => ({ title: String((x as any).title || ""), body: String((x as any).body || "") }))
        .filter((x) => x.title || x.body);
      if (list.length) return list.slice(0, 3);
    }
    return [
      { title: t("Fast charging.", "快速充电。"), body: t("Built for high-performance workflows.", "为高性能使用场景打造。") },
      { title: t("Reliable transfer.", "稳定传输。"), body: t("Consistent speed and durability.", "稳定速度与耐用性。") },
      { title: t("Made to last.", "经久耐用。"), body: t("Engineered for daily use.", "为日常使用优化设计。") },
    ];
  }, [detailConfig, t]);

  const detailInside = useMemo(() => {
    const raw = detailConfig["inside"];
    if (Array.isArray(raw)) {
      const list = raw
        .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
        .filter(Boolean)
        .map((x, idx) => ({
          left: String((x as any).left || ""),
          right: String((x as any).right || ""),
          strengthPct: Number((x as any).strengthPct ?? 0) || 0,
          idx,
        }))
        .filter((x) => x.left || x.right);
      if (list.length) return list.slice(0, 6);
    }
    return [
      { left: t("Outer layer", "外层"), right: t("Built for abrasion resistance", "耐磨抗损"), strengthPct: 55, idx: 0 },
      { left: t("Reinforcement", "加固层"), right: t("Enhanced tensile strength", "增强拉伸强度"), strengthPct: 67, idx: 1 },
      { left: t("Shielding", "屏蔽层"), right: t("Stable signal integrity", "信号更稳定"), strengthPct: 79, idx: 2 },
      { left: t("Conductors", "导体"), right: t("Optimized for efficiency", "效率优化"), strengthPct: 91, idx: 3 },
    ];
  }, [detailConfig, t]);

  const detailWorksWith = useMemo(() => {
    const raw = detailConfig["works_with"];
    if (Array.isArray(raw)) {
      const list = raw.map((x) => String(x || "")).filter(Boolean);
      if (list.length) return list.slice(0, 12);
    }
    return [
      t("MacBook", "MacBook"),
      t("iPad", "iPad"),
      t("iPhone", "iPhone"),
      t("Samsung", "三星"),
      t("Switch", "Switch"),
      t("Steam Deck", "Steam Deck"),
      t("Displays", "显示器"),
      t("Hubs & docks", "扩展坞"),
    ];
  }, [detailConfig, t]);

  const detailAssurances = useMemo(() => {
    const raw = detailConfig["assurances"];
    if (Array.isArray(raw)) {
      const list = raw.map((x) => String(x || "")).filter(Boolean);
      if (list.length) return list.slice(0, 10);
    }
    return [
      t("Verified seller", "认证卖家"),
      t("Quality checked", "质量检测"),
      t("Ships in 2–3 days", "2–3 天发货"),
      t("24/7 support", "7×24 支持"),
      t("30-day returns", "30 天退货"),
    ];
  }, [detailConfig, t]);

  const documents = useMemo(() => {
    const rows = Array.isArray(product?.media) ? product!.media! : [];
    const out = rows
      .filter((m: any) => (m?.media_type || "") === "document" && (m?.public_url || "").trim())
      .map((m: any) => ({
        id: Number(m.id || 0),
        title: String(m.title || "").trim(),
        contentType: String(m.content_type || "").trim(),
        sizeBytes: Number(m.size_bytes || 0) || 0,
        url: String(m.public_url || "").trim(),
      }))
      .filter((d) => d.id && d.url);
    return out;
  }, [product?.media]);

  const documentSlots = useMemo(() => {
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const slots = [
      {
        key: "vehsl_report",
        title: t("Vehsl test report and rating", "Vehsl 测试报告与评级"),
        desc: t("Independent lab results & performance scores", "独立实验室结果与性能评分"),
        keywords: ["vehsl", "report", "rating", "test"],
      },
      {
        key: "specs",
        title: t("Specifications", "规格参数"),
        desc: t("Full technical specs & dimensions", "完整技术规格与尺寸"),
        keywords: ["spec", "specification", "datasheet", "data sheet", "technical spec"],
      },
      {
        key: "manual",
        title: t("User manual", "使用手册"),
        desc: t("Setup guide & usage instructions", "安装指南与使用说明"),
        keywords: ["manual", "user", "guide", "instruction"],
      },
      {
        key: "compliance",
        title: t("Safety & compliance documents", "安全与合规文件"),
        desc: t("CE, FCC, RoHS & REACH certifications", "CE、FCC、RoHS、REACH 认证"),
        keywords: ["compliance", "safety", "ce", "fcc", "rohs", "reach", "certificate", "certification"],
      },
      {
        key: "warranty",
        title: t("Warranty statement", "保修声明"),
        desc: t("Coverage terms & claim process", "保修条款与申请流程"),
        keywords: ["warranty", "return", "policy", "claim"],
      },
      {
        key: "technical",
        title: t("Technical files", "技术文件"),
        desc: t("CAD drawings & integration guides", "CAD 图纸与集成指南"),
        keywords: ["cad", "dwg", "step", "stp", "drawing", "technical file", "integration"],
      },
    ];

    const remaining = [...documents];
    const assigned: Record<string, (typeof documents)[number] | null> = {};

    for (const s of slots) {
      const hitIdx = remaining.findIndex((d) => {
        const title = normalize(d.title);
        const ct = normalize(d.contentType);
        return s.keywords.some((k) => title.includes(k) || ct.includes(k));
      });
      assigned[s.key] = hitIdx >= 0 ? remaining.splice(hitIdx, 1)[0] : null;
    }

    for (const s of slots) {
      if (assigned[s.key]) continue;
      if (!remaining.length) break;
      assigned[s.key] = remaining.shift() || null;
    }

    return slots.map((s) => ({ ...s, doc: assigned[s.key] }));
  }, [documents, t]);

  const specGroups = useMemo(() => {
    const raw = detailConfig["specifications"];
    if (!Array.isArray(raw)) return [];
    const list = raw
      .map((g) => (g && typeof g === "object" ? (g as Record<string, unknown>) : null))
      .filter(Boolean)
      .map((g) => {
        const title = String(g!.title || "").trim();
        const collapsed = Boolean((g as any).collapsed);
        const itemsRaw = (g as any).items;
        const items = Array.isArray(itemsRaw)
          ? itemsRaw
              .map((it: any) => (it && typeof it === "object" ? it : null))
              .filter(Boolean)
              .map((it: any) => ({
                label: String(it.label || "").trim(),
                value: String(it.value || "").trim(),
              }))
              .filter((it: any) => it.label && it.value)
          : [];
        return title ? { title, collapsed, items } : null;
      })
      .filter(Boolean) as Array<{ title: string; collapsed: boolean; items: Array<{ label: string; value: string }> }>;
    return list;
  }, [detailConfig]);

  const fallbackSpecGroups = useMemo(() => {
    if (!product) return [];
    const general: Array<{ label: string; value: string }> = [];
    const add = (label: string, value: string | number | null | undefined) => {
      const v = value == null ? "" : String(value).trim();
      if (!v) return;
      general.push({ label, value: v });
    };

    add(t("SKU", "SKU"), (product as any).sku);
    add(t("HS code", "HS 编码"), (product as any).hs_code);
    if (typeof product.lead_time_days === "number" && product.lead_time_days > 0) {
      add(t("Lead time", "交期"), t(`${product.lead_time_days} days`, `${product.lead_time_days} 天`));
    }

    try {
      const origin = (product as any).origin_location;
      if (origin && typeof origin === "object") {
        const country = String((origin as any).country || "").trim();
        const city = String((origin as any).city || "").trim();
        const region = String((origin as any).region || "").trim();
        const parts = [city, region, country].filter(Boolean);
        if (parts.length) add(t("Origin", "产地"), parts.join(", "));
      }
    } catch {}

    const variationInfo: Array<{ label: string; value: string }> = [];
    if (normalizedGroups.length) {
      for (const g of normalizedGroups) {
        const vals = g.values.slice(0, 12).join(", ");
        if (vals) variationInfo.push({ label: g.key, value: vals });
      }
    }

    const sellerInfo: Array<{ label: string; value: string }> = [];
    if ((product.seller_name || "").trim()) sellerInfo.push({ label: t("Seller", "卖家"), value: product.seller_name!.trim() });
    if ((product.category_name || "").trim()) sellerInfo.push({ label: t("Category", "分类"), value: product.category_name!.trim() });

    const out: Array<{ title: string; collapsed: boolean; items: Array<{ label: string; value: string }> }> = [];
    if (general.length) out.push({ title: t("General", "通用"), collapsed: false, items: general });
    if (variationInfo.length) out.push({ title: t("Options", "选项"), collapsed: false, items: variationInfo });
    if (sellerInfo.length) out.push({ title: t("Seller information", "卖家信息"), collapsed: false, items: sellerInfo });
    return out;
  }, [normalizedGroups, product, t]);

  const effectiveSpecGroups = useMemo(() => (specGroups.length ? specGroups : fallbackSpecGroups), [fallbackSpecGroups, specGroups]);

  useEffect(() => {
    if (!effectiveSpecGroups.length) return;
    setSpecOpen((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const g of effectiveSpecGroups) {
        if (typeof next[g.title] === "boolean") continue;
        next[g.title] = !g.collapsed;
      }
      return next;
    });
  }, [effectiveSpecGroups]);

  useEffect(() => {
    if (!tiers.length) {
      setSelectedTierId(null);
      return;
    }
    if (selectedTierId && tiers.some((t) => t.id === selectedTierId)) return;
    setSelectedTierId(tiers[0].id);
  }, [selectedTierId, tiers]);

  const selectedTier = useMemo(() => tiers.find((x) => x.id === selectedTierId) || null, [tiers, selectedTierId]);

  useEffect(() => {
    if (!selectedTier) return;
    if (qty < selectedTier.min_quantity) setQty(selectedTier.min_quantity);
  }, [qty, selectedTier]);

  const ratingValue = useMemo(() => {
    const v = Number(product?.average_rating ?? product?.vehsl_rating ?? product?.seller_rating ?? 0);
    return Number.isFinite(v) ? v : 0;
  }, [product?.average_rating, product?.seller_rating, product?.vehsl_rating]);

  const reviewCount = useMemo(() => {
    const v = Number(product?.review_count ?? 0);
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }, [product?.review_count]);

  const [hasAccessToken, setHasAccessToken] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setHasAccessToken(typeof window !== "undefined" && Boolean(window.localStorage.getItem("vehsl.access")));
      } catch {
        setHasAccessToken(false);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

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

  const primaryAddress = useMemo(() => addresses.find((a) => a.kind === "primary") || null, [addresses]);
  const secondaryAddress = useMemo(() => addresses.find((a) => a.kind === "secondary") || null, [addresses]);
  const selectedAddress = useMemo(() => {
    if (deliveryLocation === "primary") return primaryAddress;
    if (deliveryLocation === "secondary") return secondaryAddress;
    return null;
  }, [deliveryLocation, primaryAddress, secondaryAddress]);

  const selectedAddressLine = useMemo(() => {
    const a = selectedAddress;
    if (!a) return "";
    const parts = [a.street1, a.street2, a.city, a.region, a.country, a.postal_code].map((x) => String(x || "").trim()).filter(Boolean);
    return parts.join(", ");
  }, [selectedAddress]);

  const fetchAddresses = useCallback(async () => {
    if (!hasAccessToken) return;
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
      if (!parsed.some((a) => a.kind === "primary") && parsed.some((a) => a.kind === "secondary")) {
        setDeliveryLocation("secondary");
      }
    } catch {
    } finally {
      setAddressesLoading(false);
    }
  }, [hasAccessToken]);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  const openAddressModal = useCallback(
    (kind: "primary" | "secondary") => {
      if (!hasAccessToken) {
        toast.error(t("Please sign in to manage addresses.", "请先登录以管理地址。"));
        window.location.assign("/?signin=1");
        return;
      }
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
    [hasAccessToken, primaryAddress, secondaryAddress, t],
  );

  const saveAddress = useCallback(async () => {
    if (!hasAccessToken) return;
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
  }, [addressDraft, addressModalKind, fetchAddresses, hasAccessToken, primaryAddress, secondaryAddress, t]);

  useEffect(() => {
    if (!productId || !Number.isFinite(productId)) return;
    if (deliveryLocation === "storage") {
      setQuotes([]);
      setQuotesLoading(false);
      return;
    }
    const addrId = selectedAddress?.id || 0;
    if (!addrId) {
      setQuotes([]);
      setQuotesLoading(false);
      return;
    }
    setQuotesLoading(true);
    let cancelled = false;
    fetchJsonAuthed(`/api/v1/shipping/quote/?product_id=${productId}&quantity=${qty}&address_id=${addrId}`)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.results) ? (data as any).results : [];
        const parsed: ShippingQuote[] = rows
          .map((r: any) => ({
            method: (r?.method || "") as any,
            label: String(r?.label || ""),
            currency: String(r?.currency || "USD"),
            unit_price: String(r?.unit_price || ""),
            total_price: String(r?.total_price || ""),
            min_days: Number(r?.min_days || 0),
            max_days: Number(r?.max_days || 0),
            source: String(r?.source || ""),
          }))
          .filter((r: ShippingQuote) => r.method === "sea" || r.method === "air" || r.method === "express");
        setQuotes(parsed);
      })
      .catch(() => {
        if (cancelled) return;
        setQuotes([]);
      })
      .finally(() => {
        if (cancelled) return;
        setQuotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryLocation, productId, qty, selectedAddress?.id]);

  const quoteByMethod = useMemo(() => {
    const m = new Map<ShippingQuote["method"], ShippingQuote>();
    for (const q of quotes) {
      m.set(q.method, q);
    }
    return m;
  }, [quotes]);

  const selectedUnitPrice = useMemo(() => {
    if (!deliverySolution) return "";
    const q = quoteByMethod.get(deliverySolution);
    if (!q || !q.unit_price) return "";
    return `+${fmtMoney(q.currency, q.unit_price)}/unit`;
  }, [deliverySolution, quoteByMethod]);

  const canAddToCart = useMemo(() => {
    const needsVariation = normalizedGroups.length > 0;
    const allSelected = normalizedGroups.every((g) => Boolean(selectedAttrs[g.key]));
    const variationOk = needsVariation ? allSelected && Boolean(selectedVariationId) : true;
    const stockOk = (product?.quantity_available ?? 0) >= qty;
    return variationOk && stockOk;
  }, [normalizedGroups, selectedAttrs, selectedVariationId, product?.quantity_available, qty]);

  const copyShareLink = useCallback(async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success(t("Link copied", "链接已复制"));
    } catch {
      toast.error(t("Could not copy link", "复制链接失败"));
    }
  }, [t]);

  const goPrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNextImage = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImage((i) => (i + 1) % images.length);
  }, [images.length]);

  const compareStorageKey = useMemo(() => `vehsl.compare.${productId}`, [productId]);

  useEffect(() => {
    if (!productId) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = (sp.get("compare") || "").trim();
      if (q) {
        const ids = q
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n) && n > 0 && n !== productId);
        const uniq = Array.from(new Set(ids)).slice(0, 3);
        setCompareIds(uniq);
        try {
          window.localStorage.setItem(compareStorageKey, JSON.stringify(uniq));
        } catch {}
        return;
      }
    } catch {}

    try {
      const raw = window.localStorage.getItem(compareStorageKey) || "";
      const arr = safeJsonParse<unknown>(raw, []);
      const ids = Array.isArray(arr) ? arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0) : [];
      const uniq = Array.from(new Set(ids)).filter((n) => n !== productId).slice(0, 3);
      setCompareIds(uniq);
    } catch {}
  }, [compareStorageKey, productId]);

  useEffect(() => {
    if (!productId) return;
    try {
      window.localStorage.setItem(compareStorageKey, JSON.stringify(compareIds));
    } catch {}
  }, [compareIds, compareStorageKey, productId]);

  useEffect(() => {
    if (!productId) return;
    const ids = [productId, ...compareIds].slice(0, 4);
    if (ids.length < 1) return;
    let cancelled = false;
    setCompareLoading(true);
    fetchJsonAuthed(`/api/v1/products/compare?ids=${ids.join(",")}`)
      .then((data: any) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.results) ? (data.results as Product[]) : Array.isArray(data) ? (data as Product[]) : [];
        setCompareProducts(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setCompareProducts(product ? [product] : []);
      })
      .finally(() => {
        if (cancelled) return;
        setCompareLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [compareIds, product, productId]);

  useEffect(() => {
    if (!compareOpen) return;
    const q = compareQuery.trim();
    const tmr = window.setTimeout(async () => {
      if (!q) {
        setCompareResults([]);
        return;
      }
      setCompareSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("search", q);
        params.set("page_size", "12");
        params.set("ordering", "-created_at");
        const data = (await fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)) as any;
        const rows = Array.isArray(data?.results) ? (data.results as Product[]) : Array.isArray(data) ? (data as Product[]) : [];
        const blocked = new Set([productId, ...compareIds]);
        setCompareResults(rows.filter((r) => !blocked.has(Number((r as any).id || 0))));
      } catch {
        setCompareResults([]);
      } finally {
        setCompareSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(tmr);
  }, [compareIds, compareOpen, compareQuery, productId]);

  const addCompare = useCallback(
    (id: number) => {
      if (!id || id === productId) return;
      setCompareIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id].slice(0, 3);
        return next;
      });
      setCompareOpen(false);
      setCompareQuery("");
      setCompareResults([]);
    },
    [productId],
  );

  const removeCompare = useCallback((id: number) => {
    setCompareIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const compareColumns = useMemo(() => {
    const base = product ? [product] : [];
    const map = new Map<number, Product>();
    for (const p of compareProducts) map.set(p.id, p);
    const order = [productId, ...compareIds].filter((x) => x && x !== productId ? true : true);
    const list: Product[] = [];
    for (const id of order) {
      const p = map.get(id);
      if (p) list.push(p);
    }
    if (!list.length) return base;
    return list;
  }, [compareIds, compareProducts, product, productId]);

  const productSpecGroupsFor = useCallback(
    (p: Product) => {
      const cfg = p.detail_config && typeof p.detail_config === "object" ? (p.detail_config as Record<string, unknown>) : {};
      const raw = (cfg as any)["specifications"];
      if (Array.isArray(raw) && raw.length) {
        const list = raw
          .map((g: any) => (g && typeof g === "object" ? g : null))
          .filter(Boolean)
          .map((g: any) => {
            const title = String(g.title || "").trim();
            const collapsed = Boolean(g.collapsed);
            const itemsRaw = g.items;
            const items = Array.isArray(itemsRaw)
              ? itemsRaw
                  .map((it: any) => (it && typeof it === "object" ? it : null))
                  .filter(Boolean)
                  .map((it: any) => ({ label: String(it.label || "").trim(), value: String(it.value || "").trim() }))
                  .filter((it: any) => it.label && it.value)
              : [];
            return title ? { title, collapsed, items } : null;
          })
          .filter(Boolean);
        return list as Array<{ title: string; collapsed: boolean; items: Array<{ label: string; value: string }> }>;
      }

      const items: Array<{ label: string; value: string }> = [];
      const add = (label: string, value: string | number | null | undefined) => {
        const v = value == null ? "" : String(value).trim();
        if (!v) return;
        items.push({ label, value: v });
      };
      add(t("SKU", "SKU"), p.sku);
      add(t("HS code", "HS 编码"), p.hs_code);
      if (typeof p.lead_time_days === "number" && p.lead_time_days > 0) add(t("Lead time", "交期"), t(`${p.lead_time_days} days`, `${p.lead_time_days} 天`));
      try {
        const origin = p.origin_location;
        if (origin && typeof origin === "object") {
          const country = String((origin as any).country || "").trim();
          const city = String((origin as any).city || "").trim();
          const region = String((origin as any).region || "").trim();
          const parts = [city, region, country].filter(Boolean);
          if (parts.length) add(t("Origin", "产地"), parts.join(", "));
        }
      } catch {}
      const title = t("General", "通用");
      return items.length ? [{ title, collapsed: false, items }] : [];
    },
    [t],
  );

  const compareMatrix = useMemo(() => {
    if (compareColumns.length < 2) return [];
    const byProduct = new Map<number, Array<{ title: string; items: Array<{ label: string; value: string }> }>>();
    for (const p of compareColumns) byProduct.set(p.id, productSpecGroupsFor(p));
    const titles = new Set<string>();
    for (const groups of byProduct.values()) for (const g of groups) titles.add(g.title);
    const titleList = Array.from(titles.values());
    const rows: Array<{
      title: string;
      labels: string[];
      valuesByProduct: Record<number, Record<string, string>>;
    }> = [];
    for (const title of titleList) {
      const labelSet = new Set<string>();
      const valuesByProduct: Record<number, Record<string, string>> = {};
      for (const p of compareColumns) {
        const groups = byProduct.get(p.id) || [];
        const g = groups.find((x) => x.title === title);
        const map: Record<string, string> = {};
        if (g) {
          for (const it of g.items) {
            labelSet.add(it.label);
            map[it.label] = it.value;
          }
        }
        valuesByProduct[p.id] = map;
      }
      const labels = Array.from(labelSet.values()).sort((a, b) => a.localeCompare(b));
      if (labels.length) rows.push({ title, labels, valuesByProduct });
    }
    rows.sort((a, b) => a.title.localeCompare(b.title));
    return rows;
  }, [compareColumns, productSpecGroupsFor]);

  return (
    <div className="min-h-dvh bg-white font-urbanist">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6 pb-12">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
          >
            <ArrowLeft size={14} />
            {t("Back to explore", "返回探索")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchProduct()}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {t("Refresh", "刷新")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="relative inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
              aria-label={t("Open cart", "打开购物车")}
            >
              <ShoppingCart size={14} className="text-[#1A1A1A]/55" />
              {t("Cart", "购物车")}
              {totalQuantity > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-extrabold text-white">
                  {totalQuantity}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-6 text-[13px] text-[#1A1A1A]/45">
            {t("Loading product…", "商品加载中…")}
          </div>
        ) : !product ? (
          <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-6">
            <div className="text-[16px] font-bold text-[#1A1A1A]/80">{t("Product not found", "未找到商品")}</div>
            <div className="mt-1 text-[13px] text-[#1A1A1A]/45">
              {t("This product may be unavailable or removed.", "该商品可能不可用或已下架。")}
            </div>
            <div className="mt-5">
              <Link href="/explore" className="text-[13px] font-semibold text-blue-600 hover:underline">
                {t("Go to explore", "前往探索")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[580px_1fr]">
              <div>
                <div className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-black/[0.02]">
                  {images[activeImage] ? (
                    <img
                      src={images[activeImage]}
                      alt={product.title || product.name}
                      className="h-[340px] w-full object-cover sm:h-[420px]"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-[340px] w-full sm:h-[420px]" />
                  )}

                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={goPrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-soft hover:bg-white"
                        aria-label={t("Previous image", "上一张")}
                      >
                        <ChevronLeft className="h-5 w-5 text-[#1A1A1A]/70" />
                      </button>
                      <button
                        type="button"
                        onClick={goNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-soft hover:bg-white"
                        aria-label={t("Next image", "下一张")}
                      >
                        <ChevronRight className="h-5 w-5 text-[#1A1A1A]/70" />
                      </button>

                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/20 px-3 py-2 backdrop-blur">
                        <div className="flex items-center gap-1.5">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImage(idx)}
                              className={`h-1.5 rounded-full transition ${idx === activeImage ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                              aria-label={`Go to image ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {images.length > 1 ? (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto">
                      {images.map((u, idx) => {
                        const selected = idx === activeImage;
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setActiveImage(idx)}
                            className={`h-[74px] w-[92px] shrink-0 overflow-hidden rounded-2xl border ${selected ? "border-[#0071e3] ring-2 ring-[#0071e3]/20" : "border-black/[0.08]"} bg-black/[0.02]`}
                            aria-label={`Image ${idx + 1}`}
                          >
                            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleWishlist()}
                        disabled={toggling}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                      >
                        <Heart
                          size={14}
                          className={wishlisted ? "text-[#ff2d55]" : "text-[#1A1A1A]/45"}
                          fill={wishlisted ? "#ff2d55" : "none"}
                        />
                        {t("Save", "收藏")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyShareLink()}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                      >
                        <Share2 size={14} className="text-[#1A1A1A]/55" />
                        {t("Share", "分享")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleWishlist()}
                      disabled={toggling}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                    >
                      <Heart
                        size={14}
                        className={wishlisted ? "text-[#ff2d55]" : "text-[#1A1A1A]/45"}
                        fill={wishlisted ? "#ff2d55" : "none"}
                      />
                      {t("Save", "收藏")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyShareLink()}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                    >
                      <Share2 size={14} className="text-[#1A1A1A]/55" />
                      {t("Share", "分享")}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-black/[0.06] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[#1A1A1A]/45 truncate">
                      {localizedCategory} / {localizedSeller}
                    </div>
                    <div className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#1A1A1A] leading-[1.05]">
                      {product.title || product.name}
                    </div>
                    <div className="mt-3 text-[16px] font-bold text-[#1A1A1A]/80">
                      {fmtMoney(product.currency, product.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#0a84ff]" fill="#0a84ff" />
                    <div className="text-[12px] font-extrabold text-[#0a84ff]">{ratingValue ? ratingValue.toFixed(2) : "0.00"}</div>
                    <div className="text-[11px] font-semibold text-[#1A1A1A]/35">
                      {reviewCount ? `${reviewCount} ${t("reviews", "评价")}` : t("No reviews", "暂无评价")}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-6 text-[12px] font-semibold text-[#1A1A1A]/45">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]/20" />
                    {t("Ships fast", "快速发货")}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]/20" />
                    {t("Verified seller", "认证卖家")}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]/20" />
                    {t("Secure checkout", "安全结算")}
                  </div>
                </div>

                <div className="mt-6 border-t border-black/[0.06] pt-6 space-y-6">
                  {normalizedGroups
                    .filter((g) => g.kind === "color")
                    .map((g) => {
                      const value = selectedAttrs[g.key] || "";
                      return (
                        <div key={g.key}>
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/70">
                            {t("Color.", "颜色。")}{" "}
                            <span className="font-medium text-[#1A1A1A]/40">{t("Which color do you want?", "你想要哪个颜色？")}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {g.values.map((v) => {
                              const selected = v === value;
                              const token = v.toLowerCase().replace(/\s+/g, "");
                              const isHex = /^#?[0-9a-f]{6}$/i.test(token);
                              const bg = isHex ? (token.startsWith("#") ? token : `#${token}`) : "";
                              const map: Record<string, string> = {
                                black: "#111827",
                                white: "#ffffff",
                                red: "#ef4444",
                                blue: "#3b82f6",
                                green: "#22c55e",
                                yellow: "#f59e0b",
                                orange: "#f97316",
                                purple: "#a855f7",
                                pink: "#ec4899",
                                gray: "#9ca3af",
                                grey: "#9ca3af",
                              };
                              const swatch = bg || map[token] || "#e5e7eb";
                              const previewVariationId = findVariationForChoice(g.key, v);
                              const previewImg = getVariationPreviewImage(previewVariationId);
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setSelectedAttrs((p) => ({ ...p, [g.key]: v }))}
                                  className={`h-9 w-9 rounded-full border ${selected ? "border-[#0a84ff] ring-4 ring-[#0a84ff]/15" : "border-black/[0.06]"}`}
                                  style={
                                    previewImg
                                      ? { backgroundImage: `url("${previewImg}")`, backgroundSize: "cover", backgroundPosition: "center" }
                                      : { backgroundColor: swatch }
                                  }
                                  aria-label={v}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  {normalizedGroups
                    .filter((g) => g.kind === "length")
                    .map((g) => {
                      const value = selectedAttrs[g.key] || "";
                      return (
                        <div key={g.key}>
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/70">
                            {t("Length.", "长度。")}{" "}
                            <span className="font-medium text-[#1A1A1A]/40">{t("How long do you need?", "你需要多长？")}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {g.values.map((v) => {
                              const selected = v === value;
                              const label = v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setSelectedAttrs((p) => ({ ...p, [g.key]: v }))}
                                  className={`h-10 rounded-full border px-4 text-[12px] font-semibold ${
                                    selected ? "border-black/40 bg-black/[0.03]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  {normalizedGroups
                    .filter((g) => g.kind === "speed")
                    .map((g) => {
                      const value = selectedAttrs[g.key] || "";
                      return (
                        <div key={g.key}>
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/70">
                            {t("Data Speed.", "数据速度。")}{" "}
                            <span className="font-medium text-[#1A1A1A]/40">{t("How fast do you need?", "你需要多快？")}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {g.values.slice(0, 2).map((v) => {
                              const selected = v === value;
                              const label = v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setSelectedAttrs((p) => ({ ...p, [g.key]: v }))}
                                  className={`rounded-3xl border px-5 py-4 text-left transition ${
                                    selected ? "border-black/30 bg-black/[0.02]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                                  }`}
                                >
                                  <div className="text-[14px] font-extrabold text-[#1A1A1A]/80">{label}</div>
                                  <div className="mt-1 text-[12px] text-[#1A1A1A]/40">
                                    {t("Best for your workflow", "适合你的使用场景")}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  {normalizedGroups
                    .filter((g) => g.kind === "other")
                    .map((g) => {
                      const value = selectedAttrs[g.key] || "";
                      return (
                        <div key={g.key}>
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/70">{g.key}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {g.values.map((v) => {
                              const selected = v === value;
                              const label = v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setSelectedAttrs((p) => ({ ...p, [g.key]: v }))}
                                  className={`h-10 rounded-full border px-4 text-[12px] font-semibold ${
                                    selected ? "border-black/40 bg-black/[0.03]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                                  }`}
                                >
                                  {selected ? <Check size={14} className="inline mr-2 text-[#1A1A1A]/55" /> : null}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  <div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A]/70">
                      {t("Quantity.", "数量。")}{" "}
                      <span className="font-medium text-[#1A1A1A]/40">{t("How many do you need?", "你需要多少？")}</span>
                    </div>
                    {tiers.length ? (
                      <div className="mt-3 rounded-3xl border border-black/[0.06] bg-[#ff2d55]/[0.06] p-4">
                        <div className="space-y-2">
                          {tiers.map((row) => {
                            const selected = row.id === selectedTierId;
                            const label = row.max_quantity
                              ? t(`${row.min_quantity}–${row.max_quantity} units`, `${row.min_quantity}–${row.max_quantity} 件`)
                              : t(`${row.min_quantity}+ units`, `${row.min_quantity}+ 件`);
                            return (
                              <button
                                key={row.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTierId(row.id);
                                  const nextQty = Math.max(1, row.min_quantity);
                                  setQty(nextQty);
                                  setQtyDraft(String(nextQty));
                                  setQtyEditing(false);
                                }}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/40"
                              >
                                <div
                                  className={`h-5 w-5 rounded-md border ${selected ? "border-black/40 bg-white" : "border-black/[0.12] bg-white/70"}`}
                                />
                                <div className="flex-1 text-[12px] font-semibold text-[#1A1A1A]/70">{label}</div>
                                <div className="text-[12px] font-extrabold text-[#1A1A1A]">
                                  {fmtMoney(row.currency || product.currency, row.unit_price)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/35">{t("or set exact", "或精确设置")}</div>
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => bumpQty(-1)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/[0.03]"
                              aria-label={t("Decrease quantity", "减少数量")}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              value={qtyEditing ? qtyDraft : String(qty)}
                              onFocus={() => setQtyEditing(true)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/[^\d]/g, "");
                                setQtyDraft(cleaned);
                                if (!cleaned) return;
                                const n = parseInt(cleaned, 10);
                                if (Number.isFinite(n) && n > 0) setQty(n);
                              }}
                              onBlur={() => {
                                setQtyEditing(false);
                                const cleaned = String(qtyDraft || "").replace(/[^\d]/g, "");
                                if (!cleaned) {
                                  setQtyDraft(String(Math.max(1, Number(qty) || 1)));
                                  return;
                                }
                                const n = parseInt(cleaned, 10);
                                const next = Number.isFinite(n) && n > 0 ? n : 1;
                                setQty(next);
                                setQtyDraft(String(next));
                              }}
                              inputMode="numeric"
                              className="min-w-[44px] bg-transparent text-center text-[12px] font-bold text-[#1A1A1A] outline-none"
                              aria-label={t("Quantity", "数量")}
                            />
                            <button
                              type="button"
                              onClick={() => bumpQty(1)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/[0.03]"
                              aria-label={t("Increase quantity", "增加数量")}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between gap-4 rounded-3xl border border-black/[0.06] bg-white p-4">
                        <div className="text-[12px] text-[#1A1A1A]/45">{t("No pricing tiers set.", "未设置阶梯价格。")}</div>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => bumpQty(-1)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/[0.03]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            value={qtyEditing ? qtyDraft : String(qty)}
                            onFocus={() => setQtyEditing(true)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const cleaned = raw.replace(/[^\d]/g, "");
                              setQtyDraft(cleaned);
                              if (!cleaned) return;
                              const n = parseInt(cleaned, 10);
                              if (Number.isFinite(n) && n > 0) setQty(n);
                            }}
                            onBlur={() => {
                              setQtyEditing(false);
                              const cleaned = String(qtyDraft || "").replace(/[^\d]/g, "");
                              if (!cleaned) {
                                setQtyDraft(String(Math.max(1, Number(qty) || 1)));
                                return;
                              }
                              const n = parseInt(cleaned, 10);
                              const next = Number.isFinite(n) && n > 0 ? n : 1;
                              setQty(next);
                              setQtyDraft(String(next));
                            }}
                            inputMode="numeric"
                            className="min-w-[44px] bg-transparent text-center text-[12px] font-bold text-[#1A1A1A] outline-none"
                            aria-label={t("Quantity", "数量")}
                          />
                          <button
                            type="button"
                            onClick={() => bumpQty(1)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/[0.03]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A]/70">{t("Delivery Location", "收货地址")}</div>
                    <div className="mt-2 text-[12px] text-[#1A1A1A]/40">
                      {t("Ship to your address, or store at a platform warehouse near you.", "配送到你的地址，或存放在平台附近仓库。")}
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        { key: "primary", title: t("Ship to my address", "寄送到我的地址"), tag: t("Primary", "主地址"), address: primaryAddress },
                        { key: "secondary", title: t("Ship to my address", "寄送到我的地址"), tag: t("Secondary", "次地址"), address: secondaryAddress },
                        { key: "storage", title: t("Vehsl storage", "Vehsl 仓储"), tag: t("Select a warehouse near your customers", "选择离客户更近的仓库"), address: null },
                      ].map((row) => {
                        const selected = deliveryLocation === (row.key as any);
                        const addrLine =
                          row.address && typeof row.address === "object"
                            ? [row.address.street1, row.address.street2, row.address.city, row.address.region, row.address.country, row.address.postal_code]
                                .map((x) => String(x || "").trim())
                                .filter(Boolean)
                                .join(", ")
                            : "";
                        const disabled =
                          row.key !== "storage" &&
                          (!hasAccessToken || addressesLoading || !row.address || !String(row.address.country || "").trim());
                        const cost = row.key === "storage" ? "" : selectedUnitPrice;
                        return (
                          <button
                            key={row.key}
                            type="button"
                            onClick={() => setDeliveryLocation(row.key as any)}
                            disabled={disabled}
                            className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                              selected ? "border-black/20 bg-black/[0.01]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[#1A1A1A]/70">
                                  {row.title} <span className="ml-2 text-[11px] font-semibold text-[#34c759]">{row.tag}</span>
                                </div>
                                <div className="mt-1 text-[12px] text-[#1A1A1A]/35 truncate">
                                  {row.key === "storage"
                                    ? t("Select a warehouse near your customers", "选择离客户更近的仓库")
                                    : addrLine || (addressesLoading ? t("Loading addresses…", "正在加载地址…") : t("Add your address in profile settings", "在个人设置中添加地址"))}
                                </div>
                              </div>
                              <div className="text-[12px] font-semibold text-[#ff3b30]">{cost}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddressModal("primary")}
                        disabled={!hasAccessToken}
                        className="h-9 rounded-full border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                      >
                        {primaryAddress ? t("Edit primary address", "编辑主地址") : t("Add primary address", "添加主地址")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddressModal("secondary")}
                        disabled={!hasAccessToken}
                        className="h-9 rounded-full border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                      >
                        {secondaryAddress ? t("Edit secondary address", "编辑次地址") : t("Add secondary address", "添加次地址")}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A]/70">{t("Select Delivery Solution", "选择配送方案")}</div>
                    <div className="mt-3 space-y-3">
                      {[
                        { key: "sea", title: t("Sea Freight", "海运") },
                        { key: "air", title: t("Air Freight", "空运") },
                        { key: "express", title: t("Express Air", "特快空运") },
                      ].map((row) => {
                        const selected = deliverySolution === (row.key as any);
                        const q = quoteByMethod.get(row.key as any);
                        const disabled =
                          deliveryLocation !== "storage" &&
                          (!selectedAddress?.id || quotesLoading || (!q && quotes.length > 0));
                        const meta = q
                          ? t(`${q.min_days}–${q.max_days} days`, `${q.min_days}–${q.max_days} 天`)
                          : quotesLoading
                            ? t("Loading quotes…", "正在获取运费…")
                            : deliveryLocation !== "storage" && !selectedAddress?.id
                              ? t("Select an address first", "请先选择地址")
                              : t("Quote unavailable", "暂无报价");
                        const badge = q ? `+${fmtMoney(q.currency, q.unit_price)}/unit` : "";
                        return (
                          <button
                            key={row.key}
                            type="button"
                            onClick={() => setDeliverySolution(row.key as any)}
                            disabled={disabled}
                            className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                              selected ? "border-[#34c759]/40 bg-[#34c759]/[0.04]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[#1A1A1A]/70">{row.title}</div>
                                <div className="mt-1 text-[12px] text-[#1A1A1A]/35">{meta}</div>
                              </div>
                              <div className="text-[12px] font-semibold text-[#1A1A1A]/35">{badge}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canAddToCart}
                    onClick={() => void addThisToCart()}
                    className="mt-2 h-11 w-full rounded-full bg-black px-6 text-[12px] font-semibold text-white disabled:bg-black/10 disabled:text-[#1A1A1A]/35"
                  >
                    {product.stock_status === "out_of_stock" || (product.quantity_available ?? 0) < qty
                      ? t("Out of Stock", "暂时缺货")
                      : canAddToCart
                        ? t("Add to cart", "加入购物车")
                        : t("Select options above", "请先选择规格")}
                  </button>

                  <div className="mt-2 text-center text-[11px] text-[#1A1A1A]/35">
                    {product.sample_available
                      ? t(
                          `Free sample available · Sample ships in ${Number(product.sample_ship_days ?? 0) || 0} days`,
                          `可申请免费样品 · ${Number(product.sample_ship_days ?? 0) || 0} 天内发货`,
                        )
                      : t(
                          `No free sample · Ships in ${Number(product.ship_time_min_days ?? 0) || 0}–${Number(product.ship_time_max_days ?? 0) || 0} days`,
                          `暂无免费样品 · ${Number(product.ship_time_min_days ?? 0) || 0}–${Number(product.ship_time_max_days ?? 0) || 0} 天内发货`,
                        )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white p-1">
                {[
                  { key: "overview", label: t("Overview", "概览") },
                  { key: "specs", label: t("Specifications", "规格") },
                  { key: "documents", label: t("Documents", "文件") },
                  { key: "compare", label: t("Compare", "对比") },
                ].map((it) => (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => setTab(it.key as any)}
                    className={`h-9 rounded-full px-4 text-[12px] font-semibold ${
                      tab === it.key ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    {it.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-black/[0.06] bg-white p-6">
                {tab === "overview" ? (
                  <div className="space-y-10">
                    <div className="text-[13px] leading-relaxed text-[#1A1A1A]/70 whitespace-pre-wrap">
                      {product.description?.trim() ? product.description : t("No description provided.", "暂无描述。")}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {detailHighlights.map((it) => (
                        <div key={it.title} className="rounded-3xl border border-black/[0.06] bg-black/[0.01] p-5">
                          <div className="text-[12px] font-semibold text-[#1A1A1A]/35">{t("IN REAL LIFE, THAT MEANS", "真实体验")}</div>
                          <div className="mt-3 text-[14px] font-extrabold text-[#1A1A1A]/80">{it.title}</div>
                          <div className="mt-1 text-[12px] text-[#1A1A1A]/40">{it.body}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-[12px] font-semibold text-[#1A1A1A]/35">{t("WHAT'S INSIDE", "产品结构")}</div>
                      <div className="mt-4 space-y-3">
                        {detailInside.map((row) => (
                          <div key={row.left} className="flex items-center gap-4">
                            <div className="w-[140px] text-[12px] font-semibold text-[#1A1A1A]/65">{row.left}</div>
                            <div className="flex-1">
                              <div className="h-8 rounded-full bg-black/[0.04]">
                                <div
                                  className="h-8 rounded-full bg-black/[0.08]"
                                  style={{ width: `${Math.min(95, Math.max(8, row.strengthPct || 0 || 0))}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-[220px] text-right text-[12px] text-[#1A1A1A]/40">{row.right}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[12px] font-semibold text-[#1A1A1A]/35">{t("WORKS WITH", "兼容设备")}</div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {detailWorksWith.map((x) => (
                          <div
                            key={x}
                            className="inline-flex h-9 items-center rounded-full border border-black/[0.06] bg-white px-4 text-[12px] font-semibold text-[#1A1A1A]/55"
                          >
                            {x}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-black/[0.06] bg-black/[0.02] p-4">
                      <div className="grid gap-3 sm:grid-cols-5">
                        {detailAssurances.map((x) => (
                          <div key={x} className="text-center text-[11px] font-semibold text-[#1A1A1A]/45">
                            {x}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : tab === "specs" ? (
                  <div className="space-y-5">
                    {!effectiveSpecGroups.length ? (
                      <div className="rounded-3xl border border-black/[0.06] bg-black/[0.01] p-5 text-[13px] text-[#1A1A1A]/55">
                        {t("Specifications will appear here once provided by the seller.", "卖家提供规格后将显示在这里。")}
                      </div>
                    ) : (
                      effectiveSpecGroups.map((g) => {
                        const open = specOpen[g.title] !== false;
                        return (
                          <div key={g.title} className="rounded-3xl border border-black/[0.06] bg-black/[0.01] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setSpecOpen((p) => ({ ...p, [g.title]: !open }))}
                              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                            >
                              <div className="text-[13px] font-extrabold text-[#1A1A1A]/75">{g.title}</div>
                              <div className={`text-[#1A1A1A]/35 transition ${open ? "rotate-180" : ""}`}>⌃</div>
                            </button>
                            {open ? (
                              <div className="border-t border-black/[0.06] bg-white">
                                {g.items.map((it, idx) => (
                                  <div
                                    key={`${it.label}-${idx}`}
                                    className={`flex items-center justify-between gap-4 px-5 py-3 text-[12px] ${
                                      idx % 2 === 0 ? "bg-black/[0.01]" : "bg-white"
                                    }`}
                                  >
                                    <div className="font-semibold text-[#1A1A1A]/35">{it.label}</div>
                                    <div className="font-semibold text-[#1A1A1A]/75 text-right">{it.value}</div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : tab === "documents" ? (
                  <div>
                    <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">
                      {t("DOCUMENTS & DOWNLOADS", "文件与下载")}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {documentSlots.map((s) => {
                        const d = s.doc;
                        const size = d ? fmtBytes(d.sizeBytes) : "";
                        const canDownload = Boolean(d?.url);
                        return (
                          <div
                            key={s.key}
                            className="rounded-3xl border border-black/[0.06] bg-black/[0.01] p-5 flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0a84ff]/10 text-[#0a84ff]">
                                <FileText className="h-4 w-4" />
                              </div>
                              {size ? <div className="text-[10px] font-semibold text-[#1A1A1A]/35">{size}</div> : null}
                            </div>
                            <div className="mt-4">
                              <div className="text-[13px] font-extrabold text-[#1A1A1A]/80">{s.title}</div>
                              <div className="mt-1 text-[12px] text-[#1A1A1A]/40">{s.desc}</div>
                            </div>
                            <div className="mt-5">
                              {canDownload ? (
                                <a
                                  href={d!.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#0a84ff]/25 bg-white px-4 text-[12px] font-bold text-[#0a84ff] hover:bg-[#0a84ff]/5"
                                >
                                  {t("Download", "下载")}
                                  <Download className="h-4 w-4" />
                                </a>
                              ) : (
                                <div className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-[12px] font-bold text-[#1A1A1A]/35">
                                  {t("Not uploaded", "未上传")}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">
                        {t("COMPARE WITH COMPETITORS", "与竞品对比")}
                      </div>
                      {compareLoading ? (
                        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#1A1A1A]/35">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          {t("Loading", "加载中")}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-[#0a84ff]/25 bg-[#0a84ff]/[0.03] p-6">
                        <div className="inline-flex rounded-full bg-[#0a84ff]/10 px-3 py-1 text-[10px] font-bold text-[#0a84ff]">
                          {t("THIS PRODUCT", "当前商品")}
                        </div>
                        <div className="mt-5 flex flex-col items-center text-center">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.02]">
                            {(product?.hero_image_url || images[0] || "").trim() ? (
                              <img
                                src={(product?.hero_image_url || images[0]) as string}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                          </div>
                          <div className="mt-3 text-[13px] font-extrabold text-[#0a84ff]">
                            {product.title || product.name}
                          </div>
                          <div className="mt-1 text-[13px] font-extrabold text-[#1A1A1A]/80">
                            {fmtMoney(product.currency, product.price)}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A]/40">
                            <Star className="h-3.5 w-3.5 text-[#f59e0b]" fill="#f59e0b" />
                            <span>{ratingValue ? ratingValue.toFixed(1) : "0.0"}</span>
                            <span className="text-[#1A1A1A]/25">({t("reviews", "评价")})</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-dashed border-black/[0.15] bg-white p-6">
                        {compareIds.length >= 3 ? (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="text-[12px] font-bold text-[#1A1A1A]/55">{t("Max products added", "已达到最大数量")}</div>
                            <div className="mt-1 text-[12px] text-[#1A1A1A]/35">{t("Compare up to 4 products", "最多对比 4 个商品")}</div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCompareOpen(true)}
                            className="flex h-full w-full flex-col items-center justify-center gap-2 text-center"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white">
                              <Plus className="h-5 w-5 text-[#1A1A1A]/55" />
                            </div>
                            <div className="text-[12px] font-bold text-[#1A1A1A]/60">{t("Add product", "添加商品")}</div>
                            <div className="text-[12px] text-[#1A1A1A]/35">{t("Compare up to 4", "最多对比 4 个")}</div>
                          </button>
                        )}
                      </div>
                    </div>

                    {compareIds.length === 0 ? (
                      <div className="text-center">
                        <div className="text-[13px] font-extrabold text-[#1A1A1A]/70">{t("Add a product to compare", "添加商品进行对比")}</div>
                        <div className="mt-1 text-[12px] text-[#1A1A1A]/35">
                          {t('Click "Add product" to see how this product stacks up.', '点击“添加商品”查看对比结果。')}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {compareColumns
                            .filter((p) => p.id !== productId)
                            .map((p) => (
                              <div key={p.id} className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-2">
                                <div className="text-[12px] font-semibold text-[#1A1A1A]/70">
                                  {p.title || p.name}
                                </div>
                                <button type="button" onClick={() => removeCompare(p.id)} className="text-[#1A1A1A]/35 hover:text-[#ff3b30]">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>

                        {compareMatrix.length ? (
                          <div className="overflow-auto rounded-3xl border border-black/[0.06] bg-white">
                            <div className="min-w-[720px]">
                              <div
                                className="grid border-b border-black/[0.06] bg-black/[0.01]"
                                style={{ gridTemplateColumns: `220px repeat(${compareColumns.length}, minmax(180px, 1fr))` }}
                              >
                                <div className="px-5 py-4 text-[12px] font-extrabold text-[#1A1A1A]/55">
                                  {t("Specifications", "规格参数")}
                                </div>
                                {compareColumns.map((p) => (
                                  <div key={p.id} className="px-5 py-4 text-[12px] font-extrabold text-[#1A1A1A]/75">
                                    {p.title || p.name}
                                  </div>
                                ))}
                              </div>

                              {compareMatrix.map((g) => (
                                <div key={g.title}>
                                  <div
                                    className="grid border-b border-black/[0.06] bg-white"
                                    style={{ gridTemplateColumns: `220px repeat(${compareColumns.length}, minmax(180px, 1fr))` }}
                                  >
                                    <div className="px-5 py-3 text-[12px] font-extrabold text-[#1A1A1A]/65">{g.title}</div>
                                    {compareColumns.map((p) => (
                                      <div key={p.id} className="px-5 py-3" />
                                    ))}
                                  </div>
                                  {g.labels.map((label, idx) => (
                                    <div
                                      key={label}
                                      className="grid border-b border-black/[0.06]"
                                      style={{
                                        gridTemplateColumns: `220px repeat(${compareColumns.length}, minmax(180px, 1fr))`,
                                        background: idx % 2 === 0 ? "rgba(0,0,0,0.01)" : "white",
                                      }}
                                    >
                                      <div className="px-5 py-3 text-[12px] font-semibold text-[#1A1A1A]/35">{label}</div>
                                      {compareColumns.map((p) => (
                                        <div key={p.id} className="px-5 py-3 text-[12px] font-semibold text-[#1A1A1A]/70">
                                          {g.valuesByProduct[p.id]?.[label] || "—"}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {compareOpen ? (
                      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/30"
                          onClick={() => setCompareOpen(false)}
                          aria-label="Close"
                        />
                        <div className="relative w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/70 bg-white/90 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
                          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
                            <div>
                              <div className="text-[14px] font-black text-[#1A1A1A]/85">{t("Add product", "添加商品")}</div>
                              <div className="text-[12px] font-medium text-[#1A1A1A]/40">
                                {t("Search and add competitors to compare.", "搜索并添加竞品进行对比。")}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCompareOpen(false)}
                              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                            >
                              {t("Close", "关闭")}
                            </button>
                          </div>
                          <div className="p-6">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/30" />
                              <input
                                value={compareQuery}
                                onChange={(e) => setCompareQuery(e.target.value)}
                                placeholder={t("Search products…", "搜索商品…")}
                                className="h-11 w-full rounded-2xl border border-black/[0.06] bg-black/[0.01] pl-11 pr-4 text-[13px] font-semibold text-[#1A1A1A]/80 outline-none"
                              />
                              {compareSearching ? (
                                <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#1A1A1A]/35" />
                              ) : null}
                            </div>
                            <div className="mt-4 max-h-[55dvh] overflow-auto space-y-2">
                              {compareQuery.trim() && !compareSearching && compareResults.length === 0 ? (
                                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                                  {t("No products found.", "未找到商品。")}
                                </div>
                              ) : null}
                              {compareResults.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => addCompare(r.id)}
                                  className="w-full rounded-2xl border border-black/[0.06] bg-white p-4 text-left hover:bg-black/[0.02]"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.02]">
                                      {(r.hero_image_url || "").trim() ? (
                                        <img src={r.hero_image_url as string} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                                      ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[13px] font-extrabold text-[#1A1A1A]/80 truncate">
                                        {(r.title || r.name) as string}
                                      </div>
                                      <div className="mt-1 text-[12px] font-semibold text-[#1A1A1A]/45">
                                        {fmtMoney(r.currency, r.price)}
                                      </div>
                                    </div>
                                    <div className="rounded-full border border-[#0a84ff]/25 bg-[#0a84ff]/[0.06] px-3 py-1.5 text-[11px] font-bold text-[#0a84ff]">
                                      {t("Add", "添加")}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {addressModalOpen ? (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
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
          </>
        )}
      </div>
    </div>
  );
}
