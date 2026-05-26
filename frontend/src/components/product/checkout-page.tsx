"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { fetchJsonAuthed } from "@/lib/api";
import { useCart } from "@/components/product/cart-context";
import { useLanguage } from "@/context/language";

function fmtMoney(currency: string, amount: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

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

export function CheckoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const { items, refresh, updateQuantity, removeItem, clearCart, totalPrice, totalQuantity, loading: cartLoading, lastError } = useCart();
  const [placing, setPlacing] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const hasAccessToken = useMemo(() => {
    try {
      return typeof window !== "undefined" && Boolean(window.localStorage.getItem("vehsl.access"));
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    setAddressesLoading(true);
    fetchJsonAuthed("/api/v1/auth/addresses/?page_size=50")
      .then((data) => {
        if (cancelled) return;
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
        const primary = parsed.find((a) => a.kind === "primary") || parsed[0] || null;
        setAddressId((prev) => prev ?? primary?.id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = useMemo(() => items[0]?.currency || "USD", [items]);

  const groups = useMemo(() => {
    const map = new Map<number, typeof items>();
    for (const it of items) {
      map.set(it.seller_id, [...(map.get(it.seller_id) || []), it]);
    }
    return [...map.entries()].map(([sellerId, rows]) => ({ sellerId, rows }));
  }, [items]);

  const placeOrders = useCallback(async () => {
    if (placing) return;
    if (items.length === 0) return;
    if (!addressId) {
      toast.error(t("Select a delivery address first.", "请先选择收货地址。"));
      return;
    }
    setPlacing(true);
    try {
      for (const g of groups) {
        const payload = {
          items: g.rows.map((it) => ({
            product_id: it.product_id,
            variation_id: it.variation || null,
            quantity: it.quantity,
          })),
          payment_method: paymentMethod,
          address_id: addressId,
        };
        await fetchJsonAuthed("/api/v1/orders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await clearCart();
      toast.success(t("Order placed.", "订单已提交。"));
      router.push("/orders");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Checkout failed.", "结算失败。");
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  }, [placing, items.length, addressId, groups, paymentMethod, clearCart, router, t]);

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === addressId) || null, [addressId, addresses]);
  const selectedAddressLine = useMemo(() => {
    const a = selectedAddress;
    if (!a) return "";
    const parts = [a.street1, a.street2, a.city, a.region, a.country, a.postal_code].map((x) => String(x || "").trim()).filter(Boolean);
    return parts.join(", ");
  }, [selectedAddress]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[22px] font-extrabold tracking-tight text-[#0f1115]">{t("Cart", "购物车")}</div>
          <Link href="/explore" className="text-[13px] font-semibold text-[#1f2330] hover:underline">
            {t("Continue shopping", "继续购物")}
          </Link>
        </div>

        {lastError ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[12px] text-red-700">
            <div className="font-bold">{t("Cart failed to load", "购物车加载失败")}</div>
            <div className="mt-1 break-words">{lastError}</div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-3 rounded-full border border-red-500/20 bg-white px-4 py-2 text-[12px] font-semibold text-red-700 hover:bg-black/[0.02]"
            >
              {t("Retry", "重试")}
            </button>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="rounded-2xl border border-black/[0.06] bg-white">
            {items.length === 0 ? (
              <div className="p-6 text-[13px] text-[#7c7f87]">
                <div>
                  {cartLoading
                    ? t("Loading cart…", "正在加载购物车…")
                    : hasAccessToken
                      ? t("Your cart is empty.", "你的购物车是空的。")
                      : t("Please sign in to view your cart.", "请先登录以查看购物车。")}
                </div>
                {hasAccessToken ? (
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="mt-4 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[12px] font-semibold text-[#0f1115] hover:bg-black/[0.02]"
                  >
                    {t("Refresh cart", "刷新购物车")}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {items.map((it) => (
                  <div key={it.id} className="flex gap-4 p-5">
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-black/[0.03]">
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.product_title || it.product_name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-[#0f1115] truncate">
                        {it.product_title || it.product_name}
                      </div>
                      <div className="mt-1 text-[12px] text-[#7c7f87] truncate">{it.seller_name || ""}</div>
                      <div className="mt-2 text-[12px] font-semibold text-[#0f1115]">
                        {fmtMoney(it.currency, it.unit_price_snapshot)}
                      </div>
                      <div className="mt-1 text-[12px] text-[#7c7f87]">
                        {t("Line total", "小计")}:{" "}
                        <span className="font-semibold text-[#0f1115]">
                          {fmtMoney(it.currency, String((Number(it.unit_price_snapshot) || 0) * (Number(it.quantity) || 0)))}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-2.5 py-1.5">
                          <button
                            type="button"
                            disabled={busyItemId === it.id || it.quantity <= 1}
                            onClick={async () => {
                              setBusyItemId(it.id);
                              try {
                                await updateQuantity(it.id, Math.max(1, it.quantity - 1));
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : t("Update failed.", "更新失败。");
                                toast.error(msg);
                              }
                              setBusyItemId(null);
                            }}
                            className="h-7 w-7 rounded-full hover:bg-black/[0.03] disabled:opacity-50 flex items-center justify-center"
                            aria-label={t("Decrease quantity", "减少数量")}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="min-w-[28px] text-center text-[12px] font-bold text-[#0f1115]">
                            {it.quantity}
                          </div>
                          <button
                            type="button"
                            disabled={busyItemId === it.id}
                            onClick={async () => {
                              setBusyItemId(it.id);
                              try {
                                await updateQuantity(it.id, it.quantity + 1);
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : t("Update failed.", "更新失败。");
                                toast.error(msg);
                              }
                              setBusyItemId(null);
                            }}
                            className="h-7 w-7 rounded-full hover:bg-black/[0.03] disabled:opacity-50 flex items-center justify-center"
                            aria-label={t("Increase quantity", "增加数量")}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={busyItemId === it.id}
                          onClick={async () => {
                            setBusyItemId(it.id);
                            try {
                              await removeItem(it.id);
                            } catch (e) {
                              const msg = e instanceof Error ? e.message : t("Remove failed.", "移除失败。");
                              toast.error(msg);
                            }
                            setBusyItemId(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold text-[#0f1115] hover:bg-black/[0.03] disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("Remove", "移除")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <div className="text-[14px] font-extrabold text-[#0f1115]">{t("Summary", "汇总")}</div>
              <div className="mt-3 text-[12px] text-[#7c7f87]">
                {t("Products", "商品种类")}: <span className="font-semibold text-[#0f1115]">{items.length}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-[12px] text-[#7c7f87]">
                <span>{t("Items", "商品数")}</span>
                <span className="font-semibold text-[#0f1115]">{totalQuantity}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#7c7f87]">
                <span>{t("Total", "合计")}</span>
                <span className="font-extrabold text-[#0f1115]">{fmtMoney(currency, String(totalPrice))}</span>
              </div>

              <div className="mt-5">
                <div className="text-[12px] font-bold text-[#0f1115]">{t("Delivery address", "收货地址")}</div>
                <div className="mt-2 space-y-2">
                  {addressesLoading ? (
                    <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3 text-[12px] text-[#7c7f87]">
                      {t("Loading addresses…", "正在加载地址…")}
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3 text-[12px] text-[#7c7f87]">
                      {t("No address found. Add one in Profile settings.", "未找到地址。请在个人设置中添加地址。")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((a) => {
                        const selected = a.id === addressId;
                        const line = [a.street1, a.street2, a.city, a.region, a.country, a.postal_code]
                          .map((x) => String(x || "").trim())
                          .filter(Boolean)
                          .join(", ");
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAddressId(a.id)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              selected ? "border-black/20 bg-black/[0.02]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                            }`}
                          >
                            <div className="text-[12px] font-bold text-[#0f1115]">
                              {(a.kind || "").toUpperCase()}
                              {a.contact_name ? ` · ${a.contact_name}` : ""}
                              {a.phone ? ` · ${a.phone}` : ""}
                            </div>
                            <div className="mt-1 text-[12px] text-[#7c7f87] truncate">{line || t("Address incomplete", "地址不完整")}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedAddressLine ? (
                  <div className="mt-2 text-[11px] text-[#7c7f87]">{selectedAddressLine}</div>
                ) : null}
              </div>

              <div className="mt-5">
                <div className="text-[12px] font-bold text-[#0f1115]">{t("Payment method", "支付方式")}</div>
                <div className="mt-2 space-y-2">
                  {[
                    { key: "cod", title: t("Cash on Delivery (COD)", "货到付款 (COD)"), body: t("Pay when the shipment arrives.", "到货后付款。") },
                    { key: "card", title: t("Card", "银行卡"), body: t("Pay online (integration can be added later).", "在线支付（后续可接入支付网关）。") },
                  ].map((pm) => {
                    const selected = paymentMethod === (pm.key as any);
                    return (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setPaymentMethod(pm.key as any)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          selected ? "border-black/20 bg-black/[0.02]" : "border-black/[0.06] bg-white hover:bg-black/[0.02]"
                        }`}
                      >
                        <div className="text-[12px] font-bold text-[#0f1115]">{pm.title}</div>
                        <div className="mt-1 text-[12px] text-[#7c7f87]">{pm.body}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {groups.length > 1 ? (
                <div className="mt-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3 text-[12px] text-[#7c7f87]">
                  {t(
                    "Your cart contains products from multiple sellers. Checkout will create one order per seller.",
                    "你的购物车包含多个卖家的商品。结算将为每个卖家创建一个订单。",
                  )}
                </div>
              ) : null}

              <button
                type="button"
                disabled={placing || items.length === 0 || !addressId}
                onClick={() => void placeOrders()}
                className="mt-5 w-full rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white hover:bg-black/90 disabled:opacity-60"
              >
                {placing ? t("Placing order…", "提交中…") : t("Place order", "提交订单")}
              </button>

              <button
                type="button"
                disabled={placing || items.length === 0}
                onClick={async () => {
                  try {
                    await clearCart();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : t("Clear failed.", "清空失败。");
                    toast.error(msg);
                  }
                }}
                className="mt-2 w-full rounded-full bg-white border border-black/[0.06] px-5 py-3 text-[12px] font-semibold text-[#0f1115] hover:bg-black/[0.02] disabled:opacity-60"
              >
                {t("Clear cart", "清空购物车")}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
