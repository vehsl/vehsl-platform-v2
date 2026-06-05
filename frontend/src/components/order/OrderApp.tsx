"use client";

import { useEffect, useState } from "react";
import { OrderDetailsView } from "./OrderDetailsView";
import { OrderHistoryList } from "./OrderHistoryList";
import { WarehouseView } from "./WarehouseView";
import { toast } from "sonner";
import { Package, Warehouse } from "lucide-react";
import { SettingsPopover } from "./SettingsPopover";
import { OrdersMetrics } from "./OrdersMetrics";
import { RoleProvider, useRole } from "./RoleContext";
import { SellerDashboard } from "./SellerDashboard";
import { authedFetch, fetchJsonAuthed } from "@/lib/api";
import type { ApiOrder } from "./order-types";

type Tab = "orders" | "warehouse";

function AppInner({ initialOrderId }: { initialOrderId?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { isSeller } = useRole();
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId ? Number(initialOrderId) : null);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!mounted) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = (params.get("tab") || "").toLowerCase();
      if (tab === "warehouse") setActiveTab("warehouse");
      if (tab === "orders") setActiveTab("orders");
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [activeTab, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      setHasAccessToken(Boolean(window.localStorage.getItem("vehsl.access")));
    } catch {
      setHasAccessToken(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (isSeller) return;
    if (!hasAccessToken) {
      setOrders([]);
      setSelectedOrderId(null);
      return;
    }
    (async () => {
      try {
        const data = await fetchJsonAuthed("/api/v1/orders/?page_size=50");
        const rows: ApiOrder[] = Array.isArray((data as any)?.results)
          ? (data as any).results
          : Array.isArray(data)
            ? (data as any)
            : [];
        setOrders(rows);
        if (!selectedOrderId && rows.length) setSelectedOrderId(rows[0].id);
        if (selectedOrderId && rows.length && !rows.some((o) => o.id === selectedOrderId)) {
          setSelectedOrderId(rows[0].id);
        }
      } catch {
        setOrders([]);
        setSelectedOrderId(null);
      }
    })();
  }, [mounted, isSeller, hasAccessToken]);

  if (!mounted) return null;

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null;

  const refreshOrders = async () => {
    const next = await fetchJsonAuthed("/api/v1/orders/?page_size=50");
    const rows: ApiOrder[] = Array.isArray((next as any)?.results)
      ? (next as any).results
      : Array.isArray(next)
        ? (next as any)
        : [];
    setOrders(rows);
    if (selectedOrderId && rows.length && !rows.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(rows[0]?.id ?? null);
    }
  };

  const handleCancelOrder = async (id: number) => {
    toast.promise(
      (async () => {
        const res = await authedFetch(`/api/v1/orders/${id}/cancel/`, { method: "POST" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && (data.detail || data.error)) || `Could not cancel order (${res.status})`;
          throw new Error(typeof msg === "string" ? msg : "Could not cancel order");
        }
        await refreshOrders();
      })(),
      {
        loading: "Processing cancellation...",
        success: "Order has been cancelled",
        error: (e) => (e instanceof Error ? e.message : "Could not cancel order"),
      },
    );
  };

  const handleConfirmDelivered = async (id: number) => {
    toast.promise(
      (async () => {
        const res = await authedFetch(`/api/v1/orders/${id}/confirm-delivered/`, { method: "POST" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && (data.detail || data.error)) || `Could not confirm delivery (${res.status})`;
          throw new Error(typeof msg === "string" ? msg : "Could not confirm delivery");
        }
        await refreshOrders();
      })(),
      {
        loading: "Confirming delivery...",
        success: "Marked as delivered",
        error: (e) => (e instanceof Error ? e.message : "Could not confirm delivery"),
      },
    );
  };

  const handleConfirmReceived = async (id: number) => {
    toast.promise(
      (async () => {
        const res = await authedFetch(`/api/v1/orders/${id}/confirm-received/`, { method: "POST" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && (data.detail || data.error)) || `Could not confirm receipt (${res.status})`;
          throw new Error(typeof msg === "string" ? msg : "Could not confirm receipt");
        }
        await refreshOrders();
      })(),
      {
        loading: "Confirming receipt...",
        success: "Order completed",
        error: (e) => (e instanceof Error ? e.message : "Could not confirm receipt"),
      },
    );
  };

  const handleRequestSample = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    const productId = order?.items?.[0]?.product;
    if (!productId) {
      toast.error("No product found for sample request.");
      return;
    }
    toast.promise(
      (async () => {
        const res = await authedFetch("/api/v1/sample-requests/", {
          method: "POST",
          body: JSON.stringify({ product: productId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (data && (data.detail || data.error)) || `Sample request failed (${res.status})`;
          throw new Error(typeof msg === "string" ? msg : "Sample request failed");
        }
      })(),
      {
        loading: "Requesting sample...",
        success: "Sample requested",
        error: (e) => (e instanceof Error ? e.message : "Sample request failed"),
      },
    );
  };

  const handleSelectOrder = (id: number) => {
    setSelectedOrderId(id || null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-dvh font-urbanist selection:bg-blue-500/15 selection:text-blue-600 relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#F2EDE7] via-[#EAECF2] to-[#E3E8F0]" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/15 blur-[100px] -z-10" />

      <nav className="sticky top-0 z-50 bg-white/50 backdrop-blur-2xl border-b border-white/50">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between px-4 py-3.5 sm:px-6">
          <span className="hidden sm:block text-[17px] font-black tracking-tight text-[#1A1A1A]">Store</span>
          <div className="flex items-center gap-1 bg-[#1A1A1A]/[0.03] rounded-full p-[3px]">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-250 text-[11px] font-bold ${
                activeTab === "orders"
                  ? "bg-white/80 text-[#1A1A1A]/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                  : "text-[#1A1A1A]/35 hover:text-[#1A1A1A]/55"
              }`}
            >
              <Package size={11} strokeWidth={2.5} />
              <span className="hidden sm:inline">{isSeller ? "Dashboard" : "Orders"}</span>
            </button>
            <button
              onClick={() => setActiveTab("warehouse")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-250 text-[11px] font-bold ${
                activeTab === "warehouse"
                  ? "bg-white/80 text-[#1A1A1A]/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                  : "text-[#1A1A1A]/35 hover:text-[#1A1A1A]/55"
              }`}
            >
              <Warehouse size={11} strokeWidth={2.5} />
              <span className="hidden sm:inline">Storage</span>
            </button>
          </div>
          <SettingsPopover />
        </div>
      </nav>

      <div className="px-4 sm:px-5 md:px-10">
        {isSeller && activeTab === "orders" ? (
          <SellerDashboard />
        ) : (
          <>
            <header className="max-w-[1120px] mx-auto pt-10 pb-8 md:pt-12 md:pb-10">
              <h1 className="text-[32px] sm:text-[38px] md:text-[46px] font-black tracking-tight text-[#1A1A1A] leading-[1.05]">
                {activeTab === "orders" ? "Orders" : "Storage"}
              </h1>
              {activeTab === "orders" && !isSeller && (
                <p className="text-[14px] font-medium text-[#1A1A1A]/30 mt-1">
                  Track shipments, containers, and deliveries
                </p>
              )}
              {activeTab === "warehouse" && (
                <p className="text-[14px] font-medium text-[#1A1A1A]/30 mt-1">
                  Your products, release requests, and activity
                </p>
              )}
            </header>

            <main>
              {activeTab === "orders" ? (
                <>
                  <OrdersMetrics orders={orders} />
                  {selectedOrder ? (
                    <>
                      <OrderDetailsView
                        key={selectedOrderId || undefined}
                        order={selectedOrder}
                        onCancelOrder={handleCancelOrder}
                        onRequestSample={handleRequestSample}
                        onConfirmDelivered={handleConfirmDelivered}
                        onConfirmReceived={handleConfirmReceived}
                      />
                      <OrderHistoryList
                        orders={orders}
                        currentOrderId={selectedOrderId}
                        onSelectOrder={handleSelectOrder}
                      />
                    </>
                  ) : (
                    <div className="max-w-[1120px] mx-auto pb-10">
                      <div className="rounded-[22px] border border-white/50 bg-white/45 backdrop-blur-2xl shadow-soft px-6 py-10 text-center">
                        <p className="text-[13px] font-medium text-[#1A1A1A]/45">
                          {hasAccessToken ? "No orders found." : "Sign in to view your orders."}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <WarehouseView />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export function OrderApp({ initialOrderId }: { initialOrderId?: string }) {
  return (
    <RoleProvider>
      <AppInner initialOrderId={initialOrderId} />
    </RoleProvider>
  );
}
