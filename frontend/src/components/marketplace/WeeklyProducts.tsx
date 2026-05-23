import { useLanguage } from "@/context/language";
import { SectionReveal } from "@/components/landing/section-reveal";
import { ProductCard } from "@/components/landing/product-card";
import { weeklyProductsData } from "@/components/marketplace/data/product-data";

export function WeeklyProducts() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
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
                {weeklyProductsData.map((product, i) => (
                    <SectionReveal key={`weekly-${product.nameEn}-${i}`} delay={i + 1}>
                        <ProductCard
                            name={t(product.nameEn, product.nameZh)}
                            price={product.price}
                            rating={product.rating}
                            image={product.image}
                            index={i + 4}
                            productId={product.productId}
                        />
                    </SectionReveal>
                ))}
            </div>
        </section>
    );
}