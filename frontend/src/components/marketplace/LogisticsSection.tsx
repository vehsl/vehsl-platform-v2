import { useLanguage } from "@/context/language";
import { SectionReveal } from "@/components/landing/section-reveal";
import infinityIcon from "@/assets/infinity-icon.png";


export function LogisticsSection() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    return (
        <section className="w-full px-6 py-12 md:py-18 lg:py-24 pb-0 md:pb-0 lg:pb-0" style={{ paddingBottom: 0 }}>
            <div className="max-w-[1200px] mx-auto text-center">
                <SectionReveal delay={1}>
                    <h2 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4.5vw,46px)] tracking-[-1px] text-center mb-6 leading-[1.15]" style={{ fontWeight: 700 }}>
                        {t("One Platform.", "一个平台。")}<br />{t("Complete Logistics.", "完整物流。")}
                    </h2>
                    <p className="text-black font-[Urbanist] text-[clamp(13px,2.1vw,22px)] font-semibold leading-[1.3] tracking-[-0.96px] text-center mb-4">
                        {t("So you can focus on what you're best at.", "让您专注于您最擅长的事。")}
                    </p>
                    <p className="text-[#B8B8B8] text-center font-[Urbanist] text-[clamp(13px,2.1vw,22px)] font-semibold leading-[1.3] tracking-[-0.96px] max-w-[810px] w-full mx-auto mb-[80px] md:mb-[150px]">
                        {t("B2B or B2C, Vehsl delivers end-to-end. Pickup, packaging, documentation, customs, duties, domestic ond cross-border shipping, warehousing, and final delivery with transparency.", "无论B2B还是B2C，Vehsl提供端到端服务。包含取货、包装、文件、清关、关税、国内及跨境运输、仓储以及透明的最终交付。")}
                    </p>
                    <img src={typeof infinityIcon === "object" ? (infinityIcon as any).src : infinityIcon} alt="Infinity" className="w-full max-w-[462px] sm:max-w-[594px] h-auto object-contain mx-auto block" />
                </SectionReveal>
            </div>
            <div style={{ height: 4, background: 'linear-gradient(96deg, #0894FF 0%, #C959DD 34%, #FF2E54 68%, #FF9004 100%)', marginTop: 82, marginLeft: -24, marginRight: -24 }} />
        </section>
    );
}