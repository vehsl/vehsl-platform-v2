"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language";
import { useEffect, useMemo, useState } from "react";
import { SectionReveal } from "@/components/landing/section-reveal";
import { ProductCard } from "@/components/landing/product-card";
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

export function WeeklyProducts() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    const [products, setProducts] = useState<ApiProductRow[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetchJsonAuthed("/api/v1/products/?page_size=4")
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
        return (products || []).slice(0, 4).map((p) => ({
            id: p.id,
            name: p.name || "",
            price: `${p.currency || "USD"} ${p.price || ""}`.trim(),
            rating: Number(p.average_rating || 0),
            image: p.hero_image_url || "",
            stockStatus: p.stock_status,
        }));
    }, [products]);
    return (
        <section className="px-6 py-16 md:py-20 max-w-[1200px] mx-auto">
            <SectionReveal>
                <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px] tracking-[0.5px] uppercase mb-3 text-center">
                    {t("This week's favorites", "本周精选")}
                </p>
                <h2 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4vw,42px)] tracking-[-0.8px] text-center mb-16" style={{ fontWeight: 600 }}>
                    {t("Weekly", "每周")} <span style={{ fontWeight: 300 }}>{t("top products", "热门商品")}</span>
                </h2>
            </SectionReveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {cards.map((product, i) => (
                    <SectionReveal key={`weekly-${product.id}-${i}`} delay={i + 1}>
                        <Link href={`/products/${product.id}`}>
                            <ProductCard name={product.name} price={product.price} rating={product.rating} image={product.image} index={i + 4} stockStatus={product.stockStatus} />
                        </Link>
                    </SectionReveal>
                ))}
            </div>
        </section>
    );
}
