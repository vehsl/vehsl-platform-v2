"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { Heart, Search, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "@/components/landing/figma/ImageWithFallback";
import { authedFetch, fetchJsonAuthed } from "@/lib/api";
import { safeJsonParse, fmtMoney as fmtMoneyUtil } from "@/lib/utils";

type WishlistItem = {
  id: number;
  product_id: number;
  product_name: string;
  currency: string;
  price: string;
  seller_name: string;
  image_url: string;
  created_at: string;
};

type ProductSearchResult = {
  id: number;
  name: string;
  currency: string;
  price: string;
  seller_name: string;
  image_url: string;
  in_wishlist: boolean;
};

function fmtMoney(currency: string, amount: string) {
  return fmtMoneyUtil(amount, currency);
}

export default function Page() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);

  const goDashboard = useCallback(() => {
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      const user = safeJsonParse<{ account_type?: string; role?: string } | null>(raw, null);
      const acct = (user?.account_type || user?.role || "").toString().toLowerCase();
      if (acct === "seller") {
        window.location.href = "/orders";
        return;
      }
      window.location.href = "/orders";
    } catch {
      window.location.href = "/orders";
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const hay = `${i.product_name} ${i.seller_name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await fetchJsonAuthed(`/api/v1/wishlist/`)) as WishlistItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast("Could not load wishlist", { description: e?.message || "Try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  const fetchProductSearch = useCallback(async (q: string) => {
    setSearchingProducts(true);
    try {
      const data = await fetchJsonAuthed(`/api/v1/wishlist/search/?q=${encodeURIComponent(q)}&limit=12`);
      const results = Array.isArray(data?.results) ? (data.results as ProductSearchResult[]) : [];
      setProductResults(results);
    } catch (e: any) {
      setProductResults([]);
      toast("Search failed", { description: e?.message || "Try again." });
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }
    const t = window.setTimeout(() => {
      void fetchProductSearch(q);
    }, 280);
    return () => window.clearTimeout(t);
  }, [fetchProductSearch, search]);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      try {
        await fetchJsonAuthed(`/api/v1/wishlist/toggle/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        setProductResults((xs) => xs.map((x) => (x.id === productId ? { ...x, in_wishlist: !x.in_wishlist } : x)));
        await fetchWishlist();
      } catch (e: any) {
        toast("Could not update wishlist", { description: e?.message || "Try again." });
      }
    },
    [fetchWishlist]
  );

  const removeItem = useCallback(
    async (productId: number) => {
      const prev = items;
      setItems((xs) => xs.filter((x) => x.product_id !== productId));
      try {
        await fetchJsonAuthed(`/api/v1/wishlist/toggle/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        setProductResults((xs) => xs.map((x) => (x.id === productId ? { ...x, in_wishlist: false } : x)));
      } catch (e: any) {
        setItems(prev);
        toast("Could not remove item", { description: e?.message || "Try again." });
      }
    },
    [items]
  );

  const clearAll = useCallback(async () => {
    const prev = items;
    setItems([]);
    setProductResults((xs) => xs.map((x) => ({ ...x, in_wishlist: false })));
    try {
      const res = await authedFetch(`/api/v1/wishlist/clear/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      setItems(prev);
      toast("Could not clear wishlist", { description: e?.message || "Try again." });
    }
  }, [items]);

  return (
    <div className="min-h-dvh font-urbanist selection:bg-blue-500/15 selection:text-blue-600 relative overflow-x-hidden">
      <Toaster richColors />
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-10 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button
              onClick={goDashboard}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#1A1A1A]/60"
            >
              <ArrowLeft size={14} />
              Back to dashboard
            </button>
            <h1 className="text-[34px] sm:text-[42px] font-black tracking-tight text-[#1A1A1A] leading-[1.05] mt-4">
              Wishlist
            </h1>
            <p className="text-[13px] font-semibold text-[#1A1A1A]/35 mt-2">
              Saved products you can come back to anytime
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/55 border border-white/70 rounded-full px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <Search size={16} className="text-[#1A1A1A]/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or seller..."
                className="bg-transparent border-none outline-none text-[13px] font-semibold text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/30 w-[220px] sm:w-[280px]"
              />
            </div>
            <button
              onClick={() => void fetchWishlist()}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#1A1A1A]/60"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => void clearAll()}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#D64545]"
              disabled={loading || items.length === 0}
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="space-y-5">
            <div className="bg-white/55 border border-white/70 rounded-[26px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full bg-[#ff2d55]/10 border border-[#ff2d55]/15 flex items-center justify-center">
                  <Heart size={16} className="text-[#ff2d55]" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-[#1A1A1A]/85">Saved items</p>
                  <p className="text-[11px] font-semibold text-[#1A1A1A]/35">{filtered.length} items</p>
                </div>
              </div>
              </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-[14px] font-black text-[#1A1A1A]/75">No items in your wishlist</p>
                <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">
                  Search above to add products, or explore categories.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12px] font-black bg-white/70 border border-white/80 hover:bg-white transition text-[#1A1A1A]/70"
                  >
                    Browse products
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {filtered.map((it) => (
                  <div key={it.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="size-[54px] rounded-2xl bg-white/70 border border-white/70 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {it.image_url ? (
                        <ImageWithFallback src={it.image_url} alt={it.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Heart size={18} className="text-[#1A1A1A]/25" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-[#1A1A1A]/85 truncate">{it.product_name}</p>
                      <p className="text-[11px] font-semibold text-[#1A1A1A]/35 truncate">{it.seller_name || "Seller"}</p>
                      <p className="text-[12px] font-black text-[#1A1A1A]/70 mt-1">{fmtMoney(it.currency, it.price)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/products/${it.product_id}`}
                        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-black bg-white/70 border border-white/80 hover:bg-white transition text-[#1A1A1A]/70"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => void removeItem(it.product_id)}
                        className="inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition text-[#D64545]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            <div className="bg-white/55 border border-white/70 rounded-[26px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.04]">
                <div>
                  <p className="text-[13px] font-black text-[#1A1A1A]/85">Add products</p>
                  <p className="text-[11px] font-semibold text-[#1A1A1A]/35">
                    {search.trim().length < 2
                      ? "Type 2+ characters to search"
                      : searchingProducts
                      ? "Searching…"
                      : `${productResults.length} results`}
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition text-[#1A1A1A]/60"
                >
                  Explore
                </Link>
              </div>

              {search.trim().length < 2 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[12px] font-semibold text-[#1A1A1A]/35">
                    Search products by name, SKU, or description.
                  </p>
                </div>
              ) : productResults.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[13px] font-black text-[#1A1A1A]/70">No products found</p>
                  <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">Try a different keyword.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {productResults.map((p) => (
                    <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="size-[54px] rounded-2xl bg-white/70 border border-white/70 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.image_url ? (
                          <ImageWithFallback src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Heart size={18} className="text-[#1A1A1A]/25" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-[#1A1A1A]/85 truncate">{p.name}</p>
                        <p className="text-[11px] font-semibold text-[#1A1A1A]/35 truncate">{p.seller_name || "Seller"}</p>
                        <p className="text-[12px] font-black text-[#1A1A1A]/70 mt-1">{fmtMoney(p.currency, p.price)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/products/${p.id}`}
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-black bg-white/70 border border-white/80 hover:bg-white transition text-[#1A1A1A]/70"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => void toggleWishlist(p.id)}
                          className="inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition"
                          style={{ color: p.in_wishlist ? "#D64545" : "rgba(26,26,26,0.6)" }}
                        >
                          {p.in_wishlist ? "Remove" : "Save"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/55 border border-white/70 rounded-[26px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.04]">
              <p className="text-[13px] font-black text-[#1A1A1A]/85">Tips</p>
              <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">
                Use this list to track products you want to buy later. Items might change price or availability.
              </p>
            </div>
            <div className="px-5 py-5">
              <div className="rounded-2xl bg-white/60 border border-white/70 px-4 py-4">
                <p className="text-[12px] font-black text-[#1A1A1A]/75">Quick actions</p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/explore"
                    className="flex-1 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-black bg-white/70 border border-white/80 hover:bg-white transition text-[#1A1A1A]/70"
                  >
                    Explore
                  </Link>
                  <button
                    onClick={() => void clearAll()}
                    className="flex-1 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition text-[#D64545]"
                    disabled={items.length === 0}
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-[#1A1A1A]/28 mt-4">
                Wishlist is private by default.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
