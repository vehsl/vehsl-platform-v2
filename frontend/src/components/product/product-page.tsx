"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { fetchJsonAuthed } from "@/lib/api";
import { useCart } from "@/components/product/cart-context";
import { useLanguage } from "@/context/language";
import { categories as fallbackCategories } from "@/lib/categories";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localizeByDictionary(value: string, dict: Array<{ from: string; to: string }>) {
  let out = value;
  for (const pair of dict) {
    if (!pair.from || !pair.to) continue;
    const re = new RegExp(`\\b${escapeRegExp(pair.from)}\\b`, "gi");
    out = out.replace(re, pair.to);
  }
  return out;
}

type Product = {
  id: number;
  name: string;
  title: string;
  description: string;
  currency: string;
  price: string;
  category: number;
  category_name?: string;
  seller_id?: number;
  seller_name?: string;
  hero_image_url?: string;
};

function fmtMoney(currency: string, amount: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(num);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = useMemo(() => Number(params?.id || 0), [params?.id]);
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const t = useCallback((en: string, zh: string) => (language === "zh" ? zh : en), [language]);

  const productTitleDict = useMemo(() => {
    const pairs: Array<{ from: string; to: string }> = [];
    for (const c of fallbackCategories) {
      if (c.nameZh) pairs.push({ from: c.name, to: c.nameZh });
      for (const s of c.subcategories) {
        if (s.nameZh) pairs.push({ from: s.name, to: s.nameZh });
      }
    }
    pairs.sort((a, b) => b.from.length - a.from.length);
    return pairs;
  }, []);

  const localizeProductTitle = useCallback(
    (raw: string) => (language === "zh" ? localizeByDictionary(raw, productTitleDict) : raw),
    [language, productTitleDict],
  );

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [toggling, setToggling] = useState(false);

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
      await addToCart(product.id, 1, null);
      toast.success(t("Added to cart", "已加入购物车"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("Add to cart failed.", "加入购物车失败。");
      toast.error(msg);
    }
  }, [addToCart, product, t]);

  return (
    <div className="min-h-dvh bg-white font-urbanist">
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pt-10 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold bg-white/55 border border-black/[0.06] hover:bg-white/75 transition text-[#1A1A1A]/60"
          >
            <ArrowLeft size={14} />
            {t("Back to explore", "返回探索")}
          </button>
          <button
            type="button"
            onClick={() => void fetchProduct()}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/55 border border-black/[0.06] hover:bg-white/75 transition text-[#1A1A1A]/60"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t("Refresh", "刷新")}
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[26px] bg-white/55 border border-black/[0.06] p-6 text-[#1A1A1A]/45">
            {t("Loading product…", "商品加载中…")}
          </div>
        ) : !product ? (
          <div className="mt-8 rounded-[26px] bg-white/55 border border-black/[0.06] p-6">
            <div className="text-[16px] font-black text-[#1A1A1A]/75">{t("Product not found", "未找到商品")}</div>
            <div className="mt-1 text-[13px] font-medium text-[#1A1A1A]/40">
              {t("This product may be unavailable or removed.", "该商品可能不可用或已下架。")}
            </div>
            <div className="mt-5">
              <Link href="/explore" className="text-[13px] font-bold text-blue-600 hover:underline">
                {t("Go to explore", "前往探索")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
            <div className="rounded-[26px] bg-white/55 border border-black/[0.06] overflow-hidden">
              {product.hero_image_url ? (
                <img src={product.hero_image_url} alt={product.title || product.name} className="h-[340px] w-full object-cover" />
              ) : (
                <div className="h-[340px] w-full bg-black/[0.03]" />
              )}
            </div>

            <div className="rounded-[26px] bg-white/55 border border-black/[0.06] p-6">
              <div className="text-[12px] font-semibold text-[#1A1A1A]/40">
                {(product.category_name || "").trim() || t("Category", "分类")} ·{" "}
                {(product.seller_name || "").trim() || t("Seller", "卖家")}
              </div>
              <div className="mt-2 text-[28px] sm:text-[34px] font-black tracking-tight text-[#1A1A1A] leading-[1.05]">
                {localizeProductTitle(product.title || product.name)}
              </div>
              <div className="mt-3 text-[16px] font-black text-[#1A1A1A]/75">
                {fmtMoney(product.currency, product.price)}
              </div>
              {product.description ? (
                <div className="mt-4 text-[13px] font-medium text-[#1A1A1A]/45 whitespace-pre-wrap">
                  {product.description}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleWishlist()}
                  disabled={toggling}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/70 border border-black/[0.06] hover:bg-white transition"
                >
                  <Heart size={14} className={wishlisted ? "text-[#ff2d55]" : "text-[#1A1A1A]/45"} fill={wishlisted ? "#ff2d55" : "none"} />
                  {wishlisted ? t("Saved", "已收藏") : t("Save", "收藏")}
                </button>
                <button
                  type="button"
                  onClick={() => void addThisToCart()}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/70 border border-black/[0.06] hover:bg-white transition"
                >
                  <ShoppingCart size={14} className="text-[#1A1A1A]/55" />
                  {t("Add to cart", "加入购物车")}
                </button>
                <Link
                  href="/checkout"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-black text-white hover:bg-black/90 transition"
                >
                  {t("Continue to checkout", "去结算")}
                </Link>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/70 border border-black/[0.06] hover:bg-white transition"
                >
                  {t("Message", "消息")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
