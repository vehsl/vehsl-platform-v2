import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/language";
import { SectionReveal } from "../landing/section-reveal";
import { ProductCard } from "../landing/product-card";
import { suggestedProductsData } from "./data/product-data";

export function SuggestedProducts() {
  const { language } = useLanguage();

  // Fixed helper: no line break
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);

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
          {suggestedProductsData.map((product, i) => (
            <SectionReveal key={`${product.nameEn}-${i}`} delay={i + 1}>
              {/* Fix: use productId to link to a real product page */}
              <Link href={`/product/${product.productId}`}>
                <ProductCard
                  name={t(product.nameEn, product.nameZh)}
                  price={product.price}
                  rating={product.rating}
                  image={product.image}
                  index={i}
                />
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