"use client";

import { useState } from "react";
import { mockOrders } from "./data/mockOrders";
import { OrderDetailsView } from "./OrderDetailsView";
import { OrderHistoryList } from "./OrderHistoryList";
import { WarehouseView } from "./WarehouseView";
import { Toaster, toast } from "sonner";
import { Package, Warehouse } from "lucide-react";
import { SettingsPopover } from "./SettingsPopover";
import { OrdersMetrics } from "./OrdersMetrics";
import { RoleProvider, useRole } from "./RoleContext";
import { SellerDashboard } from "./SellerDashboard";

type Tab = "orders" | "warehouse";

function AppInner() {
  const { isSeller } = useRole();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(mockOrders[0].id);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const handleCancelOrder = (id: string) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 800)), {
      loading: "Processing cancellation...",
      success: "Order has been cancelled",
      error: "Could not cancel order",
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" as const } : o)),
    );
  };

  const handleRequestSample = (_id: string) => {
    toast.success("Sample requested", {
      description: "The seller will be notified of your request.",
    });
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-urbanist selection:bg-blue-500/15 selection:text-blue-600 relative overflow-x-hidden">
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

      <nav className="sticky top-0 z-50 bg-white/50 backdrop-blur-2xl border-b border-white/50">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between px-6 py-3.5">
          <span className="text-[17px] font-black tracking-tight text-[#1A1A1A]">Store</span>
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
              {isSeller ? "Dashboard" : "Orders"}
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
              Storage
            </button>
          </div>
          <SettingsPopover />
        </div>
      </nav>

      <div className="px-5 md:px-10">
        {isSeller && activeTab === "orders" ? (
          <SellerDashboard />
        ) : (
          <>
            <header className="max-w-[1120px] mx-auto pt-10 pb-8 md:pt-12 md:pb-10">
              <h1 className="text-[38px] md:text-[46px] font-black tracking-tight text-[#1A1A1A] leading-[1.05]">
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
                  <OrderDetailsView
                    key={selectedOrderId}
                    order={selectedOrder}
                    onCancelOrder={handleCancelOrder}
                    onRequestSample={handleRequestSample}
                  />
                  <OrderHistoryList
                    orders={orders}
                    currentOrderId={selectedOrderId}
                    onSelectOrder={handleSelectOrder}
                  />
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

export function OrderApp() {
  return (
    <RoleProvider>
      <AppInner />
    </RoleProvider>
  );
}
