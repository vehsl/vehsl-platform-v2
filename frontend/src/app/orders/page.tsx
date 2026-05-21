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

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [authUser, setAuthUser] = useState<any | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);

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
