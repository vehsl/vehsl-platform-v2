"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Search, Package, Truck, CheckCircle2, XCircle, ChevronRight, RefreshCw, ArrowLeft } from "lucide-react";

type OrderStatus =
  | "created"
  | "accepted"
  | "rejected"
  | "shipped"
  | "delivered"
  | "disputed"
  | "completed"
  | "cancelled";

type OrderItem = {
  id: number;
  product: number;
  variation: number | null;
  product_name: string;
  variation_attributes: Record<string, unknown>;
  quantity: number;
  unit_price: string;
  line_total: string;
};

type ShipmentSummary = {
  id: number;
  status: string;
  tracking_number: string;
  estimated_delivery_at: string | null;
  actual_delivery_at: string | null;
} | null;

type Counterparty = { id: number; name: string };

type OrderRow = {
  id: number;
  status: OrderStatus;
  currency: string;
  total_amount: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  item_count: number;
  primary_item_name: string;
  counterparty: Counterparty;
  latest_shipment: ShipmentSummary;
  items: OrderItem[];
};

type SpecItem = { label: string; value: string };
type SpecGroup = { title: string; collapsed?: boolean; items: SpecItem[] };

type ProductMediaRow = {
  id: number;
  media_type: string;
  title?: string;
  content_type?: string;
  size_bytes?: number;
  public_url?: string;
  position?: number;
  variation?: number | null;
};

type PricingTierRow = {
  id: number;
  product: number;
  variation: number | null;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: string;
  currency: string;
};

type SellerProductRow = {
  id: number;
  title?: string;
  name?: string;
  status?: string;
};

type SellerProductDetail = SellerProductRow & {
  detail_config?: Record<string, unknown>;
  media?: ProductMediaRow[];
  origin_location?: Record<string, unknown>;
  weight_grams?: number;
  ship_time_min_days?: number;
  ship_time_max_days?: number;
  sample_available?: boolean;
  sample_ship_days?: number;
  variations?: Array<{ id: number; attributes: Record<string, unknown>; sku?: string }>;
  pricing_tiers?: PricingTierRow[];
};

type SellerProfileMe = {
  warehouse_location?: Record<string, unknown>;
  country?: string;
  region?: string;
};

function apiBase() {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  const normalize = (u: string) => u.replace(/\/$/, "");
  if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
  if (typeof window === "undefined") return "http://localhost:8000";
  const host = (window.location.hostname === "0.0.0.0" || window.location.hostname === "") ? "localhost" : window.location.hostname;
  return normalize(`${window.location.protocol}//${host}:8000`);
}

function readAccessToken() {
  try {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("vehsl.access") || "";
  } catch {
    return "";
  }
}

function readUser() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("vehsl.user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fmtMoney(currency: string, amount: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "created":
      return "Awaiting seller";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "disputed":
      return "Disputed";
    default:
      return status;
  }
}

function statusPill(status: OrderStatus) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold";
  if (status === "delivered" || status === "completed")
    return { className: `${base} bg-emerald-500/10 text-emerald-700`, dot: "bg-emerald-500" };
  if (status === "shipped") return { className: `${base} bg-blue-500/10 text-blue-700`, dot: "bg-blue-500" };
  if (status === "cancelled" || status === "rejected")
    return { className: `${base} bg-[#1A1A1A]/5 text-[#1A1A1A]/55`, dot: "bg-[#1A1A1A]/30" };
  if (status === "disputed") return { className: `${base} bg-red-500/10 text-red-700`, dot: "bg-red-500" };
  return { className: `${base} bg-amber-500/10 text-amber-700`, dot: "bg-amber-500" };
}

type FilterKey = "all" | "in_progress" | "shipped" | "delivered" | "cancelled";

function statusesForFilter(key: FilterKey): OrderStatus[] | null {
  if (key === "all") return null;
  if (key === "in_progress") return ["created", "accepted", "disputed"];
  if (key === "shipped") return ["shipped"];
  if (key === "delivered") return ["delivered", "completed"];
  return ["cancelled", "rejected"];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function safeResults(data: any): { rows: OrderRow[]; count?: number } {
  if (Array.isArray(data)) return { rows: data as OrderRow[] };
  if (data && Array.isArray(data.results)) return { rows: data.results as OrderRow[], count: data.count };
  return { rows: [] };
}

function safeProducts(data: any): SellerProductRow[] {
  if (Array.isArray(data)) return data as SellerProductRow[];
  if (data && Array.isArray(data.results)) return data.results as SellerProductRow[];
  return [];
}

function safeList<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
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

function normalizeSpecGroups(raw: any): SpecGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: SpecGroup[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const title = String((g as any).title || "").trim();
    if (!title) continue;
    const itemsRaw = (g as any).items;
    const items: SpecItem[] = [];
    if (Array.isArray(itemsRaw)) {
      for (const it of itemsRaw) {
        if (!it || typeof it !== "object") continue;
        const label = String((it as any).label || "").trim();
        const value = String((it as any).value || "").trim();
        if (!label || !value) continue;
        items.push({ label, value });
      }
    }
    out.push({ title, collapsed: Boolean((g as any).collapsed), items });
  }
  return out;
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [authUser, setAuthUser] = useState<any | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const [productsOpen, setProductsOpen] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [activeProduct, setActiveProduct] = useState<SellerProductDetail | null>(null);
  const [productManagerTab, setProductManagerTab] = useState<
    "specs" | "variations" | "media" | "shipping" | "pricing" | "docs"
  >("specs");
  const [specDraft, setSpecDraft] = useState<SpecGroup[]>([]);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageVariationId, setImageVariationId] = useState<number | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [editingVariationId, setEditingVariationId] = useState<number | null>(null);
  const [variationDraft, setVariationDraft] = useState({
    sku: "",
    attrs: [{ key: "", value: "" }] as Array<{ key: string; value: string }>,
  });
  const [savingVariation, setSavingVariation] = useState(false);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tierDraft, setTierDraft] = useState({
    variation: "" as string,
    min_quantity: "",
    max_quantity: "",
    unit_price: "",
    currency: "USD",
  });
  const [savingTier, setSavingTier] = useState(false);
  const [shippingDraft, setShippingDraft] = useState({
    weight_grams: "",
    ship_time_min_days: "",
    ship_time_max_days: "",
    sample_available: false,
    sample_ship_days: "",
    origin_country: "",
    origin_region: "",
    origin_city: "",
  });
  const [savingShipping, setSavingShipping] = useState(false);
  const [warehouseDraft, setWarehouseDraft] = useState({ country: "", region: "", city: "" });
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
  const [shipmentDraft, setShipmentDraft] = useState({
    carrier_id: "",
    tracking_number: "",
    origin: "",
    destination: "",
  });

  const abortRef = useRef<AbortController | null>(null);
  const qDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mounted) return;
    setAuthUser(readUser());
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const access = readAccessToken();
    if (!access) return;

    let cancelled = false;
    fetch(`${apiBase()}/api/v1/kyc/requirements`, {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })).catch(() => ({ ok: res.ok, data: null })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        if (data?.can_access_dashboard !== true) {
          window.location.href = "/kyc";
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const isSeller = useMemo(() => {
    const t = (authUser?.account_type || authUser?.role || "").toString().toLowerCase();
    return t === "seller";
  }, [authUser]);

  const apiJson = useCallback(async (path: string, init?: RequestInit) => {
    const access = readAccessToken();
    if (!access) throw new Error("Not signed in.");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${access}`,
        ...(init?.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (data && (data.detail || data.error)) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }, []);

  const apiUpload = useCallback(async (path: string, form: FormData) => {
    const access = readAccessToken();
    if (!access) throw new Error("Not signed in.");
    const res = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (data && (data.detail || data.error)) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }, []);

  const hydrateShippingDraft = useCallback((detail: SellerProductDetail) => {
    const origin = detail?.origin_location && typeof detail.origin_location === "object" ? detail.origin_location : {};
    const country = String((origin as any).country || "").trim();
    const region = String((origin as any).region || "").trim();
    const city = String((origin as any).city || "").trim();
    setShippingDraft({
      weight_grams: String((detail as any).weight_grams ?? "").trim(),
      ship_time_min_days: String((detail as any).ship_time_min_days ?? "").trim(),
      ship_time_max_days: String((detail as any).ship_time_max_days ?? "").trim(),
      sample_available: Boolean((detail as any).sample_available),
      sample_ship_days: String((detail as any).sample_ship_days ?? "").trim(),
      origin_country: country,
      origin_region: region,
      origin_city: city,
    });
  }, []);

  const openProductsManager = useCallback(async () => {
    if (!isSeller) return;
    setProductsOpen(true);
    setProductsLoading(true);
    try {
      const data = await apiJson("/api/v1/products/?page_size=100&ordering=-created_at");
      const rows = safeProducts(data);
      setProducts(rows);
      if (!activeProduct && rows.length) {
        const firstId = rows[0].id;
        const detail = (await apiJson(`/api/v1/products/${firstId}/`)) as SellerProductDetail;
        setActiveProduct(detail);
        const cfg = detail?.detail_config && typeof detail.detail_config === "object" ? detail.detail_config : {};
        setSpecDraft(normalizeSpecGroups((cfg as any).specifications));
        hydrateShippingDraft(detail);
        setProductManagerTab("specs");
        setDocTitle("");
        setDocUrl("");
        setDocFile(null);
        setImageFile(null);
        setImageVariationId(null);
        setEditingVariationId(null);
        setVariationDraft({ sku: "", attrs: [{ key: "", value: "" }] });
        setEditingTierId(null);
        setTierDraft({ variation: "", min_quantity: "", max_quantity: "", unit_price: "", currency: "USD" });
      }
      try {
        const prof = (await apiJson("/api/v1/profiles/seller/me")) as SellerProfileMe;
        const w = prof?.warehouse_location && typeof prof.warehouse_location === "object" ? prof.warehouse_location : {};
        const wc = String((w as any).country || prof?.country || "").trim();
        const wr = String((w as any).region || prof?.region || "").trim();
        const wcity = String((w as any).city || "").trim();
        setWarehouseDraft({ country: wc, region: wr, city: wcity });
      } catch {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load products.";
      toast.error(msg);
    } finally {
      setProductsLoading(false);
    }
  }, [activeProduct, apiJson, hydrateShippingDraft, isSeller]);

  const selectProductForSpecs = useCallback(
    async (id: number) => {
      if (!id) return;
      setProductsLoading(true);
      try {
        const detail = (await apiJson(`/api/v1/products/${id}/`)) as SellerProductDetail;
        setActiveProduct(detail);
        const cfg = detail?.detail_config && typeof detail.detail_config === "object" ? detail.detail_config : {};
        setSpecDraft(normalizeSpecGroups((cfg as any).specifications));
        hydrateShippingDraft(detail);
        setDocTitle("");
        setDocUrl("");
        setDocFile(null);
        setImageFile(null);
        setImageVariationId(null);
        setEditingVariationId(null);
        setVariationDraft({ sku: "", attrs: [{ key: "", value: "" }] });
        setEditingTierId(null);
        setTierDraft({ variation: "", min_quantity: "", max_quantity: "", unit_price: "", currency: "USD" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load product.";
        toast.error(msg);
      } finally {
        setProductsLoading(false);
      }
    },
    [apiJson, hydrateShippingDraft],
  );

  const saveSpecifications = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingSpecs) return;
    setSavingSpecs(true);
    try {
      const currentCfg =
        activeProduct.detail_config && typeof activeProduct.detail_config === "object" ? activeProduct.detail_config : {};
      const payload = {
        detail_config: {
          ...(currentCfg as any),
          specifications: specDraft.map((g) => ({
            title: String(g.title || "").trim(),
            collapsed: Boolean(g.collapsed),
            items: (g.items || [])
              .map((it) => ({ label: String(it.label || "").trim(), value: String(it.value || "").trim() }))
              .filter((it) => it.label && it.value),
          })),
        },
      };
      const updated = (await apiJson(`/api/v1/products/${activeProduct.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })) as SellerProductDetail;
      setActiveProduct(updated);
      toast.success("Specifications saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingSpecs(false);
    }
  }, [activeProduct, apiJson, savingSpecs, specDraft]);

  const saveShipping = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingShipping) return;
    setSavingShipping(true);
    try {
      const toInt = (raw: string) => {
        const n = Number(String(raw || "").trim());
        if (!Number.isFinite(n)) return null;
        return Math.max(0, Math.floor(n));
      };
      const payload: any = {};
      const wg = toInt(shippingDraft.weight_grams);
      const mn = toInt(shippingDraft.ship_time_min_days);
      const mx = toInt(shippingDraft.ship_time_max_days);
      const ss = toInt(shippingDraft.sample_ship_days);
      if (wg != null) payload.weight_grams = wg;
      if (mn != null) payload.ship_time_min_days = mn;
      if (mx != null) payload.ship_time_max_days = mx;
      payload.sample_available = Boolean(shippingDraft.sample_available);
      if (ss != null) payload.sample_ship_days = ss;
      const origin_country = String(shippingDraft.origin_country || "").trim();
      const origin_region = String(shippingDraft.origin_region || "").trim();
      const origin_city = String(shippingDraft.origin_city || "").trim();
      payload.origin_location = [origin_country, origin_region, origin_city].some(Boolean)
        ? { country: origin_country, region: origin_region, city: origin_city }
        : {};
      const updated = (await apiJson(`/api/v1/products/${activeProduct.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })) as SellerProductDetail;
      setActiveProduct(updated);
      hydrateShippingDraft(updated);
      toast.success("Shipping & samples saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingShipping(false);
    }
  }, [activeProduct?.id, apiJson, hydrateShippingDraft, savingShipping, shippingDraft]);

  const saveWarehouse = useCallback(async () => {
    if (savingWarehouse) return;
    setSavingWarehouse(true);
    try {
      const country = String(warehouseDraft.country || "").trim();
      const region = String(warehouseDraft.region || "").trim();
      const city = String(warehouseDraft.city || "").trim();
      await apiJson("/api/v1/profiles/seller/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_location: { country, region, city } }),
      });
      toast.success("Warehouse location saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingWarehouse(false);
    }
  }, [apiJson, savingWarehouse, warehouseDraft.city, warehouseDraft.country, warehouseDraft.region]);

  const productDocuments = useMemo(() => {
    const rows = Array.isArray(activeProduct?.media) ? (activeProduct!.media as ProductMediaRow[]) : [];
    return rows
      .filter((m) => (m.media_type || "") === "document" && (m.public_url || "").trim())
      .map((m) => ({
        id: Number(m.id || 0),
        title: String(m.title || "").trim(),
        contentType: String(m.content_type || "").trim(),
        sizeBytes: Number(m.size_bytes || 0) || 0,
        url: String(m.public_url || "").trim(),
      }))
      .filter((d) => d.id && d.url);
  }, [activeProduct?.media]);

  const productImages = useMemo(() => {
    const rows = Array.isArray(activeProduct?.media) ? (activeProduct!.media as ProductMediaRow[]) : [];
    return rows
      .filter((m) => (m.media_type || "") === "image" && (m.public_url || "").trim())
      .map((m) => ({
        id: Number(m.id || 0),
        url: String(m.public_url || "").trim(),
        title: String(m.title || "").trim(),
        position: Number(m.position || 0) || 0,
        variation: (typeof m.variation === "number" ? m.variation : m.variation ? Number(m.variation) : null) as number | null,
      }))
      .filter((x) => x.id && x.url)
      .sort((a, b) => (a.position - b.position) || (a.id - b.id));
  }, [activeProduct?.media]);

  const variationLabel = useCallback((variationId: number | null, variations: SellerProductDetail["variations"] | undefined) => {
    if (!variationId) return "All variations";
    const row = (variations || []).find((v) => v.id === variationId);
    if (!row) return `Variation #${variationId}`;
    const attrs = row.attributes && typeof row.attributes === "object" ? row.attributes : {};
    const parts = Object.entries(attrs)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : `Variation #${variationId}`;
  }, []);

  const refreshActiveProduct = useCallback(async () => {
    if (!activeProduct?.id) return;
    const detail = (await apiJson(`/api/v1/products/${activeProduct.id}/`)) as SellerProductDetail;
    setActiveProduct(detail);
  }, [activeProduct?.id, apiJson]);

  const uploadDocument = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingDoc) return;
    const title = docTitle.trim();
    if (!docFile && !docUrl.trim()) {
      toast.error("Choose a file or enter a URL.");
      return;
    }
    setSavingDoc(true);
    try {
      if (docFile) {
        const form = new FormData();
        form.set("product", String(activeProduct.id));
        form.set("media_type", "document");
        if (title) form.set("title", title);
        form.set("file", docFile);
        await apiUpload("/api/v1/product-media/upload/", form);
      } else {
        await apiJson("/api/v1/product-media/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: activeProduct.id,
            media_type: "document",
            title: title || docUrl.trim(),
            url: docUrl.trim(),
          }),
        });
      }
      setDocTitle("");
      setDocUrl("");
      setDocFile(null);
      await refreshActiveProduct();
      toast.success("Document uploaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setSavingDoc(false);
    }
  }, [activeProduct?.id, apiJson, apiUpload, docFile, docTitle, docUrl, refreshActiveProduct, savingDoc]);

  const deleteMedia = useCallback(
    async (id: number) => {
      if (!id) return;
      try {
        await apiJson(`/api/v1/product-media/${id}/`, { method: "DELETE" });
        await refreshActiveProduct();
        toast.success("Deleted");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Delete failed.";
        toast.error(msg);
      }
    },
    [apiJson, refreshActiveProduct],
  );

  const uploadImage = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingImage) return;
    if (!imageFile) {
      toast.error("Choose an image file.");
      return;
    }
    if (productImages.length >= 8) {
      toast.error("This product already has 8 images (max). Delete one first.");
      return;
    }
    setSavingImage(true);
    try {
      const form = new FormData();
      form.set("product", String(activeProduct.id));
      form.set("media_type", "image");
      if (imageVariationId) form.set("variation", String(imageVariationId));
      form.set("file", imageFile);
      await apiUpload("/api/v1/product-media/upload/", form);
      setImageFile(null);
      setImageVariationId(null);
      await refreshActiveProduct();
      toast.success("Image uploaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setSavingImage(false);
    }
  }, [activeProduct?.id, apiUpload, imageFile, imageVariationId, productImages.length, refreshActiveProduct, savingImage]);

  const moveImage = useCallback(
    async (id: number, dir: "up" | "down") => {
      if (!activeProduct?.id) return;
      const idx = productImages.findIndex((x) => x.id === id);
      if (idx < 0) return;
      const otherIdx = dir === "up" ? idx - 1 : idx + 1;
      if (otherIdx < 0 || otherIdx >= productImages.length) return;
      const a = productImages[idx];
      const b = productImages[otherIdx];
      try {
        await apiJson(`/api/v1/product-media/${a.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: b.position }),
        });
        await apiJson(`/api/v1/product-media/${b.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: a.position }),
        });
        await refreshActiveProduct();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Reorder failed.";
        toast.error(msg);
      }
    },
    [activeProduct?.id, apiJson, productImages, refreshActiveProduct],
  );

  const tiers = useMemo(() => {
    const rows = Array.isArray(activeProduct?.pricing_tiers) ? (activeProduct!.pricing_tiers as PricingTierRow[]) : [];
    return rows
      .map((t) => ({
        id: Number(t.id || 0),
        variation: (typeof t.variation === "number" ? t.variation : t.variation ? Number(t.variation) : null) as number | null,
        min_quantity: Number(t.min_quantity || 0) || 0,
        max_quantity: t.max_quantity == null ? null : Number(t.max_quantity || 0) || null,
        unit_price: String(t.unit_price || "").trim(),
        currency: String(t.currency || "").trim() || "USD",
      }))
      .filter((t) => t.id && t.min_quantity >= 1 && t.unit_price)
      .sort((a, b) => {
        const av = a.variation || 0;
        const bv = b.variation || 0;
        if (av !== bv) return av - bv;
        if (a.min_quantity !== b.min_quantity) return a.min_quantity - b.min_quantity;
        return a.id - b.id;
      });
  }, [activeProduct?.pricing_tiers]);

  const startEditTier = useCallback((t: (typeof tiers)[number]) => {
    setEditingTierId(t.id);
    setTierDraft({
      variation: t.variation ? String(t.variation) : "",
      min_quantity: String(t.min_quantity),
      max_quantity: t.max_quantity == null ? "" : String(t.max_quantity),
      unit_price: t.unit_price,
      currency: t.currency || "USD",
    });
    setProductManagerTab("pricing");
  }, []);

  const cancelEditTier = useCallback(() => {
    setEditingTierId(null);
    setTierDraft({ variation: "", min_quantity: "", max_quantity: "", unit_price: "", currency: "USD" });
  }, []);

  const saveTier = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingTier) return;
    const minQ = Number(String(tierDraft.min_quantity || "").trim());
    const maxRaw = String(tierDraft.max_quantity || "").trim();
    const maxQ = maxRaw ? Number(maxRaw) : null;
    const unitPriceRaw = String(tierDraft.unit_price || "").trim();
    const unitPrice = Number(unitPriceRaw);
    const currency = String(tierDraft.currency || "USD").trim().toUpperCase();
    const variationRaw = String(tierDraft.variation || "").trim();
    const variation = variationRaw ? Number(variationRaw) : null;

    if (!Number.isFinite(minQ) || minQ < 1) {
      toast.error("Min qty must be at least 1.");
      return;
    }
    if (maxQ != null && (!Number.isFinite(maxQ) || maxQ < minQ)) {
      toast.error("Max qty must be empty or >= min qty.");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("Unit price must be a valid number.");
      return;
    }

    const overlaps = tiers
      .filter((t) => (t.variation || null) === (variation || null) && t.id !== (editingTierId || 0))
      .some((t) => {
        const a0 = minQ;
        const a1 = maxQ == null ? Number.POSITIVE_INFINITY : maxQ;
        const b0 = t.min_quantity;
        const b1 = t.max_quantity == null ? Number.POSITIVE_INFINITY : t.max_quantity;
        return Math.max(a0, b0) <= Math.min(a1, b1);
      });
    if (overlaps) {
      toast.error("This tier overlaps an existing tier for the same variation.");
      return;
    }

    setSavingTier(true);
    try {
      const payload: any = {
        product: activeProduct.id,
        variation: variation || null,
        min_quantity: Math.floor(minQ),
        max_quantity: maxQ == null ? null : Math.floor(maxQ),
        unit_price: unitPriceRaw,
        currency,
      };

      if (editingTierId) {
        await apiJson(`/api/v1/pricing-tiers/${editingTierId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/v1/pricing-tiers/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await refreshActiveProduct();
      cancelEditTier();
      toast.success("Pricing saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingTier(false);
    }
  }, [activeProduct?.id, apiJson, cancelEditTier, editingTierId, refreshActiveProduct, savingTier, tierDraft, tiers]);

  const deleteTier = useCallback(
    async (id: number) => {
      if (!id) return;
      try {
        await apiJson(`/api/v1/pricing-tiers/${id}/`, { method: "DELETE" });
        await refreshActiveProduct();
        if (editingTierId === id) cancelEditTier();
        toast.success("Deleted");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Delete failed.";
        toast.error(msg);
      }
    },
    [apiJson, cancelEditTier, editingTierId, refreshActiveProduct],
  );

  const variations = useMemo(() => {
    const rows = Array.isArray(activeProduct?.variations) ? (activeProduct!.variations as NonNullable<SellerProductDetail["variations"]>) : [];
    return rows
      .map((v) => ({
        id: Number(v.id || 0),
        sku: String(v.sku || "").trim(),
        attributes: v.attributes && typeof v.attributes === "object" ? (v.attributes as Record<string, unknown>) : {},
      }))
      .filter((v) => v.id)
      .sort((a, b) => a.id - b.id);
  }, [activeProduct?.variations]);

  const variationAttrsToList = useCallback((attrs: Record<string, unknown>) => {
    const out: Array<{ key: string; value: string }> = [];
    for (const [k, v] of Object.entries(attrs || {})) {
      const kk = String(k || "").trim();
      const vv = String(v ?? "").trim();
      if (!kk || !vv) continue;
      out.push({ key: kk, value: vv });
    }
    return out.length ? out : [{ key: "", value: "" }];
  }, []);

  const variationDraftToAttrs = useCallback((rows: Array<{ key: string; value: string }>) => {
    const out: Record<string, string> = {};
    for (const r of rows || []) {
      const k = String(r.key || "").trim();
      const v = String(r.value || "").trim();
      if (!k || !v) continue;
      out[k] = v;
    }
    return out;
  }, []);

  const startEditVariation = useCallback(
    (v: (typeof variations)[number]) => {
      setEditingVariationId(v.id);
      setVariationDraft({ sku: v.sku, attrs: variationAttrsToList(v.attributes) });
      setProductManagerTab("variations");
    },
    [variationAttrsToList],
  );

  const startNewVariation = useCallback(() => {
    setEditingVariationId(null);
    setVariationDraft({ sku: "", attrs: [{ key: "", value: "" }] });
    setProductManagerTab("variations");
  }, []);

  const saveVariation = useCallback(async () => {
    if (!activeProduct?.id) return;
    if (savingVariation) return;
    const sku = String(variationDraft.sku || "").trim();
    const attributes = variationDraftToAttrs(variationDraft.attrs);
    if (!Object.keys(attributes).length) {
      toast.error("Add at least one attribute (e.g. Color=Red).");
      return;
    }
    setSavingVariation(true);
    try {
      const payload = { product: activeProduct.id, sku, attributes };
      if (editingVariationId) {
        await apiJson(`/api/v1/product-variations/${editingVariationId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/v1/product-variations/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await refreshActiveProduct();
      setEditingVariationId(null);
      setVariationDraft({ sku: "", attrs: [{ key: "", value: "" }] });
      toast.success("Variation saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingVariation(false);
    }
  }, [activeProduct?.id, apiJson, editingVariationId, refreshActiveProduct, savingVariation, variationDraft, variationDraftToAttrs]);

  const deleteVariation = useCallback(
    async (id: number) => {
      if (!id) return;
      try {
        await apiJson(`/api/v1/product-variations/${id}/`, { method: "DELETE" });
        await refreshActiveProduct();
        if (editingVariationId === id) {
          setEditingVariationId(null);
          setVariationDraft({ sku: "", attrs: [{ key: "", value: "" }] });
        }
        toast.success("Deleted");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Delete failed.";
        toast.error(msg);
      }
    },
    [apiJson, editingVariationId, refreshActiveProduct],
  );

  const applyOrderUpdate = useCallback((updated: OrderRow) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  }, []);

  const orderAction = useCallback(
    async (action: "accept" | "reject" | "mark-shipped" | "mark-delivered" | "mark-completed") => {
      if (!selected?.id) return;
      if (orderActionLoading) return;
      setOrderActionLoading(true);
      try {
        const updated = (await apiJson(`/api/v1/orders/${selected.id}/${action}/`, { method: "POST" })) as OrderRow;
        applyOrderUpdate(updated);
        toast.success("Updated");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Action failed.";
        toast.error(msg);
      } finally {
        setOrderActionLoading(false);
      }
    },
    [apiJson, applyOrderUpdate, orderActionLoading, selected?.id],
  );

  type ShipmentRow = {
    id: number;
    order: number;
    carrier_id: string;
    tracking_number: string;
    status: string;
    origin: string;
    destination: string;
    estimated_delivery_at: string | null;
    actual_delivery_at: string | null;
    created_at: string;
  };

  useEffect(() => {
    if (!mounted) return;
    if (!selected?.id) return;
    if (!isSeller) return;
    let cancelled = false;
    setShipmentsLoading(true);
    setActiveShipmentId(null);
    setShipmentDraft({ carrier_id: "", tracking_number: "", origin: "", destination: "" });
    apiJson(`/api/v1/shipments/?order=${selected.id}`)
      .then((data) => {
        if (cancelled) return;
        const rows = safeList<ShipmentRow>(data)
          .filter((x) => x && typeof x === "object" && Number((x as any).id || 0))
          .sort((a, b) => {
            const ad = Date.parse(a.created_at || "");
            const bd = Date.parse(b.created_at || "");
            if (Number.isFinite(ad) && Number.isFinite(bd) && ad !== bd) return bd - ad;
            return (b.id || 0) - (a.id || 0);
          });
        const latest = rows[0];
        if (!latest) return;
        setActiveShipmentId(latest.id);
        setShipmentDraft({
          carrier_id: String(latest.carrier_id || "").trim(),
          tracking_number: String(latest.tracking_number || "").trim(),
          origin: String(latest.origin || "").trim(),
          destination: String(latest.destination || "").trim(),
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setShipmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiJson, isSeller, mounted, selected?.id]);

  const saveShipment = useCallback(async () => {
    if (!selected?.id) return;
    if (!isSeller) return;
    if (orderActionLoading) return;
    const payload = {
      order: selected.id,
      carrier_id: String(shipmentDraft.carrier_id || "").trim(),
      tracking_number: String(shipmentDraft.tracking_number || "").trim(),
      origin: String(shipmentDraft.origin || "").trim(),
      destination: String(shipmentDraft.destination || "").trim(),
    };
    if (!payload.tracking_number) {
      toast.error("Tracking number is required.");
      return;
    }
    setOrderActionLoading(true);
    try {
      if (activeShipmentId) {
        await apiJson(`/api/v1/shipments/${activeShipmentId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const created = (await apiJson("/api/v1/shipments/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })) as ShipmentRow;
        setActiveShipmentId(Number((created as any)?.id || 0) || null);
      }
      const updated = (await apiJson(`/api/v1/orders/${selected.id}/`)) as OrderRow;
      applyOrderUpdate(updated);
      toast.success("Shipment saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      toast.error(msg);
    } finally {
      setOrderActionLoading(false);
    }
  }, [activeShipmentId, apiJson, applyOrderUpdate, isSeller, orderActionLoading, selected?.id, shipmentDraft]);

  const fetchOrders = useCallback(async (query: string, key: FilterKey) => {
    if (!mounted) return;
    const access = readAccessToken();
    if (!access) {
      toast.error("Please sign in.");
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      const statuses = statusesForFilter(key);
      if (statuses) params.set("status", statuses.join(","));
      if (query.trim()) params.set("search", query.trim());
      params.set("ordering", "-created_at");

      const res = await fetch(`${apiBase()}/api/v1/orders/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${access}` },
        signal: controller.signal,
      });
      if (res.status === 401) {
        toast.error("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && (data.detail || data.error)) || "Could not load orders.";
        toast.error(typeof msg === "string" ? msg : "Could not load orders.");
        setLoading(false);
        return;
      }

      const { rows } = safeResults(data);
      setOrders(rows);
      if (rows.length && (!selected || !rows.find((o) => o.id === selected.id))) {
        setSelected(rows[0]);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    if (mounted) {
      fetchOrders(q, filter);
    }
    return () => abortRef.current?.abort();
  }, [fetchOrders, filter, mounted]);

  useEffect(() => {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      if (mounted) {
        fetchOrders(q, filter);
      }
    }, 350);
    return () => {
      if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    };
  }, [fetchOrders, filter, q, mounted]);

  const totals = useMemo(() => {
    const all = orders.length;
    const countBy = (s: OrderStatus[]) => orders.filter((o) => s.includes(o.status)).length;
    return {
      all,
      inProgress: countBy(["created", "accepted", "disputed"]),
      shipped: countBy(["shipped"]),
      delivered: countBy(["delivered", "completed"]),
      cancelled: countBy(["cancelled", "rejected"]),
    };
  }, [orders]);

  if (!mounted) return null;

  const filters: { key: FilterKey; label: string; count: number; icon: any }[] = [
    { key: "all", label: "All", count: totals.all, icon: Package },
    { key: "in_progress", label: "In progress", count: totals.inProgress, icon: RefreshCw },
    { key: "shipped", label: "Shipped", count: totals.shipped, icon: Truck },
    { key: "delivered", label: "Delivered", count: totals.delivered, icon: CheckCircle2 },
    { key: "cancelled", label: "Cancelled", count: totals.cancelled, icon: XCircle },
  ];

  return (
    <div className="min-h-dvh font-urbanist selection:bg-blue-500/15 selection:text-blue-600 relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#F2EDE7] via-[#EAECF2] to-[#E3E8F0]" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/15 blur-[100px] -z-10" />

      <Toaster
        position="top-center"
        richColors
        theme="light"
        toastOptions={{
          style: {
            fontFamily: "Urbanist, sans-serif",
            borderRadius: "16px",
            backdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.7)",
          },
        }}
      />

      {productsOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setProductsOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[26px] border border-white/70 bg-white/85 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
              <div>
                <div className="text-[14px] font-black text-[#1A1A1A]/85">Product content</div>
                <div className="text-[12px] font-medium text-[#1A1A1A]/40">Manage specifications and documents for your product page.</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:inline-flex items-center rounded-full border border-black/[0.08] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("specs")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "specs" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("variations")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "variations" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Variations
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("media")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "media" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("shipping")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "shipping" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("pricing")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "pricing" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Pricing
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductManagerTab("docs")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "docs" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Documents
                  </button>
                </div>
                {productManagerTab === "specs" ? (
                  <button
                    type="button"
                    onClick={() => void saveSpecifications()}
                    disabled={!activeProduct?.id || savingSpecs}
                    className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                  >
                    {savingSpecs ? "Saving…" : "Save"}
                  </button>
                ) : productManagerTab === "shipping" ? (
                  <button
                    type="button"
                    onClick={() => void saveShipping()}
                    disabled={!activeProduct?.id || savingShipping}
                    className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                  >
                    {savingShipping ? "Saving…" : "Save"}
                  </button>
                ) : productManagerTab === "pricing" ? (
                  <button
                    type="button"
                    onClick={() => void saveTier()}
                    disabled={!activeProduct?.id || savingTier}
                    className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                  >
                    {savingTier ? "Saving…" : editingTierId ? "Save tier" : "Add tier"}
                  </button>
                ) : productManagerTab === "variations" ? (
                  <button
                    type="button"
                    onClick={() => void saveVariation()}
                    disabled={!activeProduct?.id || savingVariation}
                    className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                  >
                    {savingVariation ? "Saving…" : editingVariationId ? "Save variation" : "Add variation"}
                  </button>
                ) : productManagerTab === "media" ? (
                  <button
                    type="button"
                    onClick={() => void uploadImage()}
                    disabled={!activeProduct?.id || savingImage}
                    className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                  >
                    {savingImage ? "Uploading…" : "Upload image"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setProductsOpen(false)}
                  className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0 md:grid-cols-[280px_1fr]">
              <div className="border-b border-black/[0.06] p-4 md:border-b-0 md:border-r">
                <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">YOUR PRODUCTS</div>
                <div className="mt-3 space-y-2 max-h-[70dvh] overflow-auto pr-1">
                  {productsLoading && !products.length ? (
                    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">Loading…</div>
                  ) : products.length === 0 ? (
                    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                      No products found.
                    </div>
                  ) : (
                    products.map((p) => {
                      const active = p.id === activeProduct?.id;
                      const label = (p.title || p.name || `Product #${p.id}`).toString();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => void selectProductForSpecs(p.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            active ? "bg-black/[0.03] border-black/20" : "bg-white border-black/[0.06] hover:bg-black/[0.02]"
                          }`}
                        >
                          <div className="text-[13px] font-bold text-[#1A1A1A]/80 truncate">{label}</div>
                          <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">ID: {p.id}</div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-5">
                {!activeProduct ? (
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5 text-[12px] text-[#1A1A1A]/45">
                    Select a product to edit specifications.
                  </div>
                ) : (
                  <div className="max-h-[70dvh] overflow-auto pr-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-bold text-[#1A1A1A]/80">
                        {(activeProduct.title || activeProduct.name || `Product #${activeProduct.id}`).toString()}
                      </div>
                      <div className="inline-flex sm:hidden items-center rounded-full border border-black/[0.08] bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("specs")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "specs" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Specs
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("variations")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "variations" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Variations
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("media")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "media" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Media
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("shipping")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "shipping" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Shipping
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("pricing")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "pricing" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Pricing
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductManagerTab("docs")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "docs" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Docs
                        </button>
                      </div>
                      {productManagerTab === "specs" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSpecDraft((prev) => [
                              ...prev,
                              { title: "New section", collapsed: false, items: [{ label: "New spec", value: "Value" }] },
                            ])
                          }
                          className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                        >
                          Add section
                        </button>
                      ) : null}
                    </div>

                    {productManagerTab === "specs" ? (
                      <div className="mt-4 space-y-4">
                        {specDraft.length === 0 ? (
                          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 text-[12px] text-[#1A1A1A]/45">
                            No specifications yet. Add a section to start.
                          </div>
                        ) : (
                          specDraft.map((g, gi) => (
                            <div key={`${g.title}-${gi}`} className="rounded-3xl border border-black/[0.06] bg-white overflow-hidden">
                              <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
                                <input
                                  value={g.title}
                                  onChange={(e) =>
                                    setSpecDraft((prev) => prev.map((x, i) => (i === gi ? { ...x, title: e.target.value } : x)))
                                  }
                                  className="w-full bg-transparent text-[13px] font-extrabold text-[#1A1A1A]/80 outline-none"
                                  placeholder="Section title"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSpecDraft((prev) => prev.map((x, i) => (i === gi ? { ...x, collapsed: !x.collapsed } : x)))
                                    }
                                    className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                                  >
                                    {g.collapsed ? "Collapsed" : "Open"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSpecDraft((prev) => prev.filter((_, i) => i !== gi))}
                                    className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="space-y-2">
                                  {g.items.map((it, ii) => (
                                    <div key={`${ii}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                      <input
                                        value={it.label}
                                        onChange={(e) =>
                                          setSpecDraft((prev) =>
                                            prev.map((x, i) =>
                                              i === gi
                                                ? {
                                                    ...x,
                                                    items: x.items.map((y, j) => (j === ii ? { ...y, label: e.target.value } : y)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                                        placeholder="Label"
                                      />
                                      <input
                                        value={it.value}
                                        onChange={(e) =>
                                          setSpecDraft((prev) =>
                                            prev.map((x, i) =>
                                              i === gi
                                                ? {
                                                    ...x,
                                                    items: x.items.map((y, j) => (j === ii ? { ...y, value: e.target.value } : y)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                                        placeholder="Value"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSpecDraft((prev) =>
                                            prev.map((x, i) =>
                                              i === gi ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x,
                                            ),
                                          )
                                        }
                                        className="h-10 rounded-2xl border border-black/[0.06] bg-white px-4 text-[12px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSpecDraft((prev) =>
                                        prev.map((x, i) =>
                                          i === gi ? { ...x, items: [...x.items, { label: "", value: "" }] } : x,
                                        ),
                                      )
                                    }
                                    className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                                  >
                                    Add row
                                  </button>
                                  <div className="text-[11px] font-semibold text-[#1A1A1A]/35">
                                    {(g.items || []).filter((x) => (x.label || "").trim() && (x.value || "").trim()).length} rows
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : productManagerTab === "variations" ? (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]/70">Product variations</div>
                              <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                Used for buyer selections (color/size/etc) and variation-bound images/pricing tiers.
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startNewVariation()}
                                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                              >
                                New
                              </button>
                              <button
                                type="button"
                                onClick={() => void saveVariation()}
                                disabled={savingVariation || !activeProduct?.id}
                                className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                              >
                                {savingVariation ? "Saving…" : editingVariationId ? "Save" : "Add"}
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <input
                              value={variationDraft.sku}
                              onChange={(e) => setVariationDraft((p) => ({ ...p, sku: e.target.value }))}
                              placeholder="SKU (optional)"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <div className="text-[11px] font-semibold text-[#1A1A1A]/35 flex items-center justify-between">
                              <span>Attributes</span>
                              <button
                                type="button"
                                onClick={() => setVariationDraft((p) => ({ ...p, attrs: [...p.attrs, { key: "", value: "" }] }))}
                                className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02]"
                              >
                                Add row
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {variationDraft.attrs.map((r, idx) => (
                              <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                <input
                                  value={r.key}
                                  onChange={(e) =>
                                    setVariationDraft((p) => ({
                                      ...p,
                                      attrs: p.attrs.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder="Key (e.g. Color)"
                                  className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                                />
                                <input
                                  value={r.value}
                                  onChange={(e) =>
                                    setVariationDraft((p) => ({
                                      ...p,
                                      attrs: p.attrs.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder="Value (e.g. Red)"
                                  className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVariationDraft((p) => ({ ...p, attrs: p.attrs.filter((_, i) => i !== idx) || [{ key: "", value: "" }] }))
                                  }
                                  className="h-10 rounded-2xl border border-black/[0.06] bg-white px-4 text-[12px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">CURRENT VARIATIONS</div>
                          <div className="mt-3 space-y-2">
                            {variations.length === 0 ? (
                              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                                No variations yet.
                              </div>
                            ) : (
                              variations.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-4"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-bold text-[#1A1A1A]/75 truncate">{variationLabel(v.id, activeProduct.variations)}</div>
                                    <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35 truncate">
                                      {v.sku ? `SKU: ${v.sku}` : "SKU: —"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditVariation(v)}
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void deleteVariation(v.id)}
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : productManagerTab === "media" ? (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]/70">Product images</div>
                              <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                Shows on buyer gallery. Max 8 images.
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-[#1A1A1A]/35 tabular-nums">{productImages.length}/8</div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                              className="block w-full text-[12px] text-[#1A1A1A]/60"
                            />
                            <select
                              value={imageVariationId ? String(imageVariationId) : ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setImageVariationId(raw ? Number(raw) : null);
                              }}
                              className="h-10 rounded-2xl border border-black/[0.06] bg-white px-3 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            >
                              <option value="">All variations</option>
                              {(activeProduct.variations || []).map((v) => (
                                <option key={v.id} value={String(v.id)}>
                                  {variationLabel(v.id, activeProduct.variations)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void uploadImage()}
                              disabled={!activeProduct?.id || savingImage}
                              className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                            >
                              {savingImage ? "Uploading…" : "Upload"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">CURRENT IMAGES</div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {productImages.length === 0 ? (
                              <div className="sm:col-span-2 rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                                No images yet.
                              </div>
                            ) : (
                              productImages.map((img, idx) => (
                                <div key={img.id} className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
                                  <div className="aspect-[4/3] bg-black/[0.02]">
                                    <img src={img.url} alt={img.title || `Image ${idx + 1}`} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="p-3">
                                    <div className="text-[11px] font-semibold text-[#1A1A1A]/40 truncate">
                                      {variationLabel(img.variation, activeProduct.variations)}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => void moveImage(img.id, "up")}
                                          disabled={idx === 0}
                                          className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02] disabled:opacity-50"
                                        >
                                          Up
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void moveImage(img.id, "down")}
                                          disabled={idx === productImages.length - 1}
                                          className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02] disabled:opacity-50"
                                        >
                                          Down
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => void deleteMedia(img.id)}
                                        className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : productManagerTab === "shipping" ? (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]/70">Product shipping & samples</div>
                              <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                These fields drive buyer shipping quotes and the sample banner.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void saveShipping()}
                              disabled={savingShipping || !activeProduct?.id}
                              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                            >
                              {savingShipping ? "Saving…" : "Save"}
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <input
                              value={shippingDraft.weight_grams}
                              onChange={(e) => setShippingDraft((p) => ({ ...p, weight_grams: e.target.value }))}
                              placeholder="Weight (grams) e.g. 500"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={shippingDraft.ship_time_min_days}
                                onChange={(e) => setShippingDraft((p) => ({ ...p, ship_time_min_days: e.target.value }))}
                                placeholder="Handling min days"
                                className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                              />
                              <input
                                value={shippingDraft.ship_time_max_days}
                                onChange={(e) => setShippingDraft((p) => ({ ...p, ship_time_max_days: e.target.value }))}
                                placeholder="Handling max days"
                                className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-4 py-2 text-[12px] font-semibold text-[#1A1A1A]/70">
                              <input
                                type="checkbox"
                                checked={shippingDraft.sample_available}
                                onChange={(e) => setShippingDraft((p) => ({ ...p, sample_available: e.target.checked }))}
                              />
                              Sample available
                            </label>
                            <input
                              value={shippingDraft.sample_ship_days}
                              onChange={(e) => setShippingDraft((p) => ({ ...p, sample_ship_days: e.target.value }))}
                              placeholder="Sample ships in (days)"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />

                            <input
                              value={shippingDraft.origin_country}
                              onChange={(e) => setShippingDraft((p) => ({ ...p, origin_country: e.target.value }))}
                              placeholder="Origin country"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={shippingDraft.origin_region}
                              onChange={(e) => setShippingDraft((p) => ({ ...p, origin_region: e.target.value }))}
                              placeholder="Origin region/state"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={shippingDraft.origin_city}
                              onChange={(e) => setShippingDraft((p) => ({ ...p, origin_city: e.target.value }))}
                              placeholder="Origin city"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]/70">Warehouse location</div>
                              <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                Used as fallback origin for shipping quotes when product origin is empty.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void saveWarehouse()}
                              disabled={savingWarehouse}
                              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02] disabled:opacity-60"
                            >
                              {savingWarehouse ? "Saving…" : "Save"}
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <input
                              value={warehouseDraft.country}
                              onChange={(e) => setWarehouseDraft((p) => ({ ...p, country: e.target.value }))}
                              placeholder="Country"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={warehouseDraft.region}
                              onChange={(e) => setWarehouseDraft((p) => ({ ...p, region: e.target.value }))}
                              placeholder="Region/state"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={warehouseDraft.city}
                              onChange={(e) => setWarehouseDraft((p) => ({ ...p, city: e.target.value }))}
                              placeholder="City"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : productManagerTab === "pricing" ? (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[12px] font-bold text-[#1A1A1A]/70">Pricing tiers</div>
                              <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                Used on buyer side to calculate unit price based on quantity.
                              </div>
                            </div>
                            {editingTierId ? (
                              <button
                                type="button"
                                onClick={() => cancelEditTier()}
                                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#1A1A1A]/70 hover:bg-black/[0.02]"
                              >
                                Cancel edit
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <select
                              value={tierDraft.variation}
                              onChange={(e) => setTierDraft((p) => ({ ...p, variation: e.target.value }))}
                              className="h-10 rounded-2xl border border-black/[0.06] bg-white px-3 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            >
                              <option value="">All variations</option>
                              {(activeProduct.variations || []).map((v) => (
                                <option key={v.id} value={String(v.id)}>
                                  {variationLabel(v.id, activeProduct.variations)}
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={tierDraft.min_quantity}
                                onChange={(e) => setTierDraft((p) => ({ ...p, min_quantity: e.target.value }))}
                                placeholder="Min qty"
                                className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                              />
                              <input
                                value={tierDraft.max_quantity}
                                onChange={(e) => setTierDraft((p) => ({ ...p, max_quantity: e.target.value }))}
                                placeholder="Max qty (optional)"
                                className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                              />
                            </div>
                            <input
                              value={tierDraft.unit_price}
                              onChange={(e) => setTierDraft((p) => ({ ...p, unit_price: e.target.value }))}
                              placeholder="Unit price"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={tierDraft.currency}
                              onChange={(e) => setTierDraft((p) => ({ ...p, currency: e.target.value }))}
                              placeholder="Currency (e.g. USD)"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void saveTier()}
                              disabled={savingTier || !activeProduct?.id}
                              className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                            >
                              {savingTier ? "Saving…" : editingTierId ? "Save" : "Add"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">CURRENT TIERS</div>
                          <div className="mt-3 space-y-2">
                            {tiers.length === 0 ? (
                              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                                No tiers yet. Add at least one tier.
                              </div>
                            ) : (
                              tiers.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-4"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-bold text-[#1A1A1A]/75 truncate">
                                      {variationLabel(t.variation, activeProduct.variations)}
                                    </div>
                                    <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35">
                                      Qty {t.min_quantity}
                                      {t.max_quantity == null ? "+" : `–${t.max_quantity}`} · {t.currency} {t.unit_price}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditTier(t)}
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void deleteTier(t.id)}
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-3xl border border-black/[0.06] bg-white p-5">
                          <div className="text-[12px] font-bold text-[#1A1A1A]/70">Upload document</div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <input
                              value={docTitle}
                              onChange={(e) => setDocTitle(e.target.value)}
                              placeholder="Document title (e.g. User manual)"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              value={docUrl}
                              onChange={(e) => setDocUrl(e.target.value)}
                              placeholder="Or paste a public URL"
                              className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                            />
                            <input
                              type="file"
                              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                              className="sm:col-span-2 block w-full text-[12px] text-[#1A1A1A]/60"
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="text-[11px] font-semibold text-[#1A1A1A]/35">
                              Use file upload now; later you can use cloud URLs and store them in DB.
                            </div>
                            <button
                              type="button"
                              onClick={() => void uploadDocument()}
                              disabled={savingDoc || !activeProduct?.id}
                              className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                            >
                              {savingDoc ? "Uploading…" : "Upload"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">CURRENT DOCUMENTS</div>
                          <div className="mt-3 space-y-2">
                            {productDocuments.length === 0 ? (
                              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-[12px] text-[#1A1A1A]/45">
                                No documents yet.
                              </div>
                            ) : (
                              productDocuments.map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-4"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-bold text-[#1A1A1A]/75 truncate">{d.title || `Document #${d.id}`}</div>
                                    <div className="mt-1 text-[11px] font-semibold text-[#1A1A1A]/35 truncate">
                                      {d.contentType || "document"} {d.sizeBytes ? `· ${fmtBytes(d.sizeBytes)}` : ""}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={d.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1A1A1A]/65 hover:bg-black/[0.02]"
                                    >
                                      Open
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => void deleteMedia(d.id)}
                                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ff3b30] hover:bg-black/[0.02]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-10 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => (window.location.href = "/orders/1?tab=warehouse")}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#1A1A1A]/60"
            >
              <ArrowLeft size={14} />
              Back to storage
            </button>
            <h1 className="text-[34px] sm:text-[42px] font-black tracking-tight text-[#1A1A1A] leading-[1.05]">
              My orders
            </h1>
            <p className="text-[13px] font-medium text-[#1A1A1A]/35 mt-1">
              {isSeller ? "Manage and track your sales" : "Track shipments, deliveries, and documents"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[320px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search product, email, phone…"
                className="w-full rounded-full pl-9 pr-3 py-2.5 text-[13px] font-semibold outline-none bg-white/60 border border-white/70 shadow-[0_1px_10px_rgba(0,0,0,0.04)]"
              />
            </div>
            {isSeller ? (
              <button
                onClick={() => void openProductsManager()}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold bg-white/70 border border-white/80 hover:bg-white/90 transition"
              >
                Products
              </button>
            ) : null}
            <button
              onClick={() => fetchOrders(q, filter)}
              className="rounded-full px-4 py-2.5 text-[12px] font-bold bg-white/70 border border-white/80 hover:bg-white/90 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold transition border ${
                  active
                    ? "bg-white/80 border-white/80 text-[#1A1A1A]/75 shadow-[0_1px_10px_rgba(0,0,0,0.06)]"
                    : "bg-white/40 border-white/60 text-[#1A1A1A]/40 hover:bg-white/60"
                }`}
              >
                <Icon size={14} className={active ? "text-blue-600/70" : "text-[#1A1A1A]/30"} />
                <span>{f.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/[0.04] text-[#1A1A1A]/45 tabular-nums">
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="rounded-[22px] bg-white/60 border border-white/70 p-6 text-[#1A1A1A]/45">
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[22px] bg-white/60 border border-white/70 p-6">
                <p className="text-[14px] font-bold text-[#1A1A1A]/70">No orders found</p>
                <p className="text-[12px] font-medium text-[#1A1A1A]/35 mt-1">
                  Try a different filter or search term.
                </p>
              </div>
            ) : (
              orders.map((o) => {
                const pill = statusPill(o.status);
                const active = selected?.id === o.id;
                const title = o.primary_item_name || (o.items[0]?.product_name ?? "Order");
                const subtitleCount = Math.max(0, (o.item_count || o.items.length || 1) - 1);
                const counterpartyLabel = isSeller ? "Buyer" : "Seller";
                const ship = o.latest_shipment;
                const shipmentLine = ship
                  ? `Tracking: ${ship.tracking_number || "—"} · ${ship.status?.replace(/_/g, " ") || ""}`
                  : "No shipment yet";
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={`w-full text-left rounded-[22px] p-5 border transition ${
                      active
                        ? "bg-white/85 border-white/90 shadow-[0_1px_14px_rgba(0,0,0,0.08)]"
                        : "bg-white/55 border-white/70 hover:bg-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">
                          ORD-{o.id}
                        </p>
                        <p className="text-[16px] font-black text-[#1A1A1A]/85 mt-1">
                          {title}
                          {subtitleCount > 0 ? (
                            <span className="text-[12px] font-bold text-[#1A1A1A]/35 ml-2">
                              +{subtitleCount} more
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">
                          {counterpartyLabel}: {o.counterparty?.name || `User #${o.counterparty?.id}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={pill.className}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                          {statusLabel(o.status)}
                        </span>
                        <p className="text-[13px] font-black text-[#1A1A1A]/80 tabular-nums">
                          {fmtMoney(o.currency, o.total_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-[12px] font-medium text-[#1A1A1A]/35">
                        {shipmentLine}
                      </p>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-blue-700/70">
                        View <ChevronRight size={14} />
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-[#1A1A1A]/28">
                      Placed {formatDate(o.created_at)} · Updated {formatDate(o.updated_at)}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-[22px] bg-white/65 border border-white/75 p-5 shadow-[0_1px_14px_rgba(0,0,0,0.05)]">
              {!selected ? (
                <div>
                  <p className="text-[14px] font-black text-[#1A1A1A]/75">Order details</p>
                  <p className="text-[12px] font-medium text-[#1A1A1A]/35 mt-1">Select an order to see details.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">ORD-{selected.id}</p>
                      <p className="text-[18px] font-black text-[#1A1A1A]/85 mt-1">{selected.primary_item_name || "Order"}</p>
                      <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">
                        {isSeller ? "Buyer" : "Seller"}: {selected.counterparty?.name || `User #${selected.counterparty?.id}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[#1A1A1A]/35">Total</p>
                      <p className="text-[16px] font-black text-[#1A1A1A]/85 tabular-nums">
                        {fmtMoney(selected.currency, selected.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                    <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">STATUS</p>
                    <p className="mt-1 text-[14px] font-black text-[#1A1A1A]/80">{statusLabel(selected.status)}</p>
                    <p className="mt-2 text-[12px] font-medium text-[#1A1A1A]/35">
                      Placed {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">ITEMS</p>
                    <div className="mt-2 space-y-2">
                      {selected.items.map((it) => (
                        <div key={it.id} className="rounded-[16px] bg-white/60 border border-white/70 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-black text-[#1A1A1A]/80">{it.product_name}</p>
                              <p className="text-[11px] font-semibold text-[#1A1A1A]/30 mt-0.5">
                                Qty {it.quantity} · {fmtMoney(selected.currency, it.unit_price)}
                              </p>
                            </div>
                            <p className="text-[12px] font-black text-[#1A1A1A]/75 tabular-nums">
                              {fmtMoney(selected.currency, it.line_total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                    <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">SHIPPING</p>
                    {selected.latest_shipment ? (
                      <div className="mt-2">
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/45">
                          Tracking: {selected.latest_shipment.tracking_number || "—"}
                        </p>
                        <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">
                          Status: {(selected.latest_shipment.status || "").replace(/_/g, " ")}
                        </p>
                        {selected.latest_shipment.estimated_delivery_at ? (
                          <p className="text-[12px] font-medium text-[#1A1A1A]/35 mt-1">
                            ETA: {formatDate(selected.latest_shipment.estimated_delivery_at)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-[12px] font-medium text-[#1A1A1A]/35">No shipment created yet.</p>
                    )}
                  </div>

                  {isSeller ? (
                    <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                      <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">PAYMENT</p>
                      <div className="mt-2 text-[12px] font-semibold text-[#1A1A1A]/45">
                        Method: {String(selected.payment_method || "—")}
                      </div>
                      <div className="mt-1 text-[12px] font-semibold text-[#1A1A1A]/35">
                        Status: {String(selected.payment_status || "—")}
                      </div>
                    </div>
                  ) : null}

                  {isSeller ? (
                    <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                      <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">DELIVERY ADDRESS</p>
                      <div className="mt-2 text-[12px] font-medium text-[#1A1A1A]/35 whitespace-pre-line">
                        {(() => {
                          const a = selected.shipping_address && typeof selected.shipping_address === "object" ? selected.shipping_address : {};
                          const name = [String((a as any).first_name || "").trim(), String((a as any).last_name || "").trim()].filter(Boolean).join(" ");
                          const phone = String((a as any).phone || "").trim();
                          const line1 = String((a as any).street1 || (a as any).line1 || "").trim();
                          const line2 = String((a as any).street2 || (a as any).line2 || "").trim();
                          const city = String((a as any).city || "").trim();
                          const region = String((a as any).region || (a as any).state || "").trim();
                          const postal = String((a as any).postal_code || (a as any).zip || "").trim();
                          const country = String((a as any).country || "").trim();
                          const lines = [
                            name || "",
                            phone ? `Phone: ${phone}` : "",
                            line1 || "",
                            line2 || "",
                            [city, region, postal].filter(Boolean).join(", "),
                            country || "",
                          ].filter((x) => String(x || "").trim());
                          return lines.length ? lines.join("\n") : "—";
                        })()}
                      </div>
                    </div>
                  ) : null}

                  {isSeller ? (
                    <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                      <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">SELLER ACTIONS</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {selected.status === "created" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void orderAction("accept")}
                              disabled={orderActionLoading}
                              className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => void orderAction("reject")}
                              disabled={orderActionLoading}
                              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-bold text-[#ff3b30] hover:bg-black/[0.02] disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : selected.status === "accepted" ? (
                          <button
                            type="button"
                            onClick={() => void orderAction("mark-shipped")}
                            disabled={orderActionLoading}
                            className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                          >
                            Mark shipped
                          </button>
                        ) : selected.status === "shipped" ? (
                          <button
                            type="button"
                            onClick={() => void orderAction("mark-delivered")}
                            disabled={orderActionLoading}
                            className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                          >
                            Mark delivered
                          </button>
                        ) : selected.status === "delivered" ? (
                          <button
                            type="button"
                            onClick={() => void orderAction("mark-completed")}
                            disabled={orderActionLoading}
                            className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                          >
                            Mark completed
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {isSeller ? (
                    <div className="mt-4 rounded-[18px] bg-black/[0.02] border border-black/[0.04] p-4">
                      <p className="text-[11px] font-bold text-[#1A1A1A]/35 tracking-widest">SHIPMENT DETAILS</p>
                      <div className="mt-2 text-[11px] font-semibold text-[#1A1A1A]/35">
                        {shipmentsLoading ? "Loading shipment…" : activeShipmentId ? `Shipment #${activeShipmentId}` : "No shipment yet"}
                      </div>
                      <div className="mt-3 grid gap-2">
                        <input
                          value={shipmentDraft.carrier_id}
                          onChange={(e) => setShipmentDraft((p) => ({ ...p, carrier_id: e.target.value }))}
                          placeholder="Carrier id (optional)"
                          className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                        />
                        <input
                          value={shipmentDraft.tracking_number}
                          onChange={(e) => setShipmentDraft((p) => ({ ...p, tracking_number: e.target.value }))}
                          placeholder="Tracking number"
                          className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                        />
                        <input
                          value={shipmentDraft.origin}
                          onChange={(e) => setShipmentDraft((p) => ({ ...p, origin: e.target.value }))}
                          placeholder="Origin (optional)"
                          className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                        />
                        <input
                          value={shipmentDraft.destination}
                          onChange={(e) => setShipmentDraft((p) => ({ ...p, destination: e.target.value }))}
                          placeholder="Destination (optional)"
                          className="h-10 rounded-2xl border border-black/[0.06] bg-black/[0.01] px-4 text-[12px] font-semibold text-[#1A1A1A]/70 outline-none"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => void saveShipment()}
                          disabled={orderActionLoading || shipmentsLoading}
                          className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white disabled:bg-black/20 disabled:text-white/70"
                        >
                          {orderActionLoading ? "Saving…" : "Save shipment"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
