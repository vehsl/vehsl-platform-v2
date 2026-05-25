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

export function CheckoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const { items, refresh, updateQuantity, removeItem, clearCart, totalPrice, totalQuantity } = useCart();
  const [placing, setPlacing] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    setPlacing(true);
    try {
      for (const g of groups) {
        const payload = {
          items: g.rows.map((it) => ({
            product_id: it.product_id,
            variation_id: it.variation || null,
            quantity: it.quantity,
          })),
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
  }, [placing, items.length, groups, clearCart, router, t]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[22px] font-extrabold tracking-tight text-[#0f1115]">{t("Cart", "购物车")}</div>
          <Link href="/explore" className="text-[13px] font-semibold text-[#1f2330] hover:underline">
            {t("Continue shopping", "继续购物")}
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6 text-[13px] text-[#7c7f87]">
            {t("Your cart is empty.", "你的购物车是空的。")}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="rounded-2xl border border-black/[0.06] bg-white">
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

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-2.5 py-1.5">
                          <button
                            type="button"
                            disabled={busyItemId === it.id || it.quantity <= 1}
                            onClick={async () => {
                              setBusyItemId(it.id);
                              await updateQuantity(it.id, Math.max(1, it.quantity - 1));
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
                              await updateQuantity(it.id, it.quantity + 1);
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
                            await removeItem(it.id);
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
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <div className="text-[14px] font-extrabold text-[#0f1115]">{t("Summary", "汇总")}</div>
              <div className="mt-4 flex items-center justify-between text-[12px] text-[#7c7f87]">
                <span>{t("Items", "商品数")}</span>
                <span className="font-semibold text-[#0f1115]">{totalQuantity}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#7c7f87]">
                <span>{t("Total", "合计")}</span>
                <span className="font-extrabold text-[#0f1115]">{fmtMoney(currency, String(totalPrice))}</span>
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
                disabled={placing || items.length === 0}
                onClick={() => void placeOrders()}
                className="mt-5 w-full rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white hover:bg-black/90 disabled:opacity-60"
              >
                {placing ? t("Placing order…", "提交中…") : t("Place order", "提交订单")}
              </button>

              <button
                type="button"
                disabled={placing || items.length === 0}
                onClick={() => void clearCart()}
                className="mt-2 w-full rounded-full bg-white border border-black/[0.06] px-5 py-3 text-[12px] font-semibold text-[#0f1115] hover:bg-black/[0.02] disabled:opacity-60"
              >
                {t("Clear cart", "清空购物车")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
