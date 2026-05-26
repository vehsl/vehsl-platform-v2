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
  const [productManagerTab, setProductManagerTab] = useState<"specs" | "docs" | "shipping">("specs");
  const [specDraft, setSpecDraft] = useState<SpecGroup[]>([]);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
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

  const deleteDocument = useCallback(
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
                    onClick={() => setProductManagerTab("shipping")}
                    className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                      productManagerTab === "shipping" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                    }`}
                  >
                    Shipping
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
                          onClick={() => setProductManagerTab("shipping")}
                          className={`h-9 rounded-full px-4 text-[12px] font-bold transition ${
                            productManagerTab === "shipping" ? "bg-black text-white" : "text-[#1A1A1A]/60 hover:bg-black/[0.02]"
                          }`}
                        >
                          Shipping
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
                                      onClick={() => void deleteDocument(d.id)}
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
