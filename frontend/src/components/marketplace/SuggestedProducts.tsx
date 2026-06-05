"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/language";
import { SectionReveal } from "../landing/section-reveal";
import { ProductCard } from "../landing/product-card";
import { fetchJsonAuthed } from "@/lib/api";

type ApiProductRow = {
  id: number;
  name: string;
  currency: string;
  price: string;
  hero_image_url?: string;
  average_rating?: number | null;
  stock_status?: string;
};

export function SuggestedProducts() {
  const { language } = useLanguage();

  // Fixed helper: no line break
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);

  const [products, setProducts] = useState<ApiProductRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchJsonAuthed("/api/v1/products/?page_size=8")
      .then((data) => {
        if (cancelled) return;
        const rows: ApiProductRow[] = Array.isArray((data as any)?.results) ? (data as any).results : [];
        setProducts(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    return (products || []).slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name || "",
      price: `${p.currency || "USD"} ${p.price || ""}`.trim(),
      rating: Number(p.average_rating || 0),
      image: p.hero_image_url || "",
      stockStatus: p.stock_status,
    }));
  }, [products]);

  return (
    <section className="w-full py-16 md:py-20 px-6" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-[1200px] mx-auto">
        <SectionReveal>
          <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px] tracking-[0.5px] uppercase mb-3 text-center">
            {t("Curated for you", "为您精选")}
          </p>
          <h2 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4vw,42px)] tracking-[-0.8px] text-center mb-16" style={{ fontWeight: 600 }}>
            {t("Suggested", "推荐")} <span style={{ fontWeight: 300 }}>{t("products", "商品")}</span>
          </h2>
        </SectionReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {cards.map((product, i) => (
            <SectionReveal key={`suggested-${product.id}-${i}`} delay={i + 1}>
              <Link href={`/products/${product.id}`}>
                <ProductCard name={product.name} price={product.price} rating={product.rating} image={product.image} index={i} stockStatus={product.stockStatus} />
              </Link>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={5}>
          <div className="mt-12 flex justify-center">
            <Link
              href="/explore"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-[14px] text-[#56585D] hover:bg-white hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:text-[#1d1d1f] transition-all"
              style={{ fontWeight: 550 }}
            >
              {t("Explore all categories", "浏览全部类别")} <ChevronRight size={15} />
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
