import { motion } from "motion/react";
import { useLanguage } from "@/context/language";
import { SectionReveal } from "@/components/landing/section-reveal";
import { LeafIcon } from "@/components/landing/leaf-icon";
import { greenGradient, greenGradientStyle } from "@/components/landing/gradients";

export function SustainabilitySection() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    return (
        <section className="relative px-6 py-10 md:py-16 overflow-hidden" style={{ backgroundColor: "#F6F7EF" }}>
            <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

            <div className="relative max-w-[1000px] mx-auto">
                <SectionReveal>
                    <div className="flex justify-center mb-[63px]"><LeafIcon className="w-[74px] h-auto sm:w-[106px]" /></div>
                </SectionReveal>

                <SectionReveal delay={1}>
                    <h2 className="font-['Urbanist',sans-serif] text-center text-[clamp(32px,5vw,48px)] tracking-[-1px] mb-[18px] leading-[1.15]" style={{ fontWeight: 700 }}>
                        <span className="text-black">{t("Sustainable Logistics, Perfected", "可持续物流，臻于完善")}</span>
                    </h2>
                </SectionReveal>

                <SectionReveal delay={2}>
                    <p className="font-['Urbanist',sans-serif] text-[#86868B] text-[12px] sm:text-[15px] md:text-[16px] text-center max-w-[800px] mx-auto mb-[80px] leading-relaxed">
                        {t("Vehsl cuts carbon emissions 20–30% per shipment, eliminates paper use by up to 96%, and optimizes wasted shipping capacity for greener trade and a stronger reputation.", "Vehsl每次运输可减少20–30%碳排放，纸张使用量最高减少96%，并优化运输空间浪费，实现更绿色的贸易和更强的品牌声誉。")}
                    </p>
                </SectionReveal>

                <SectionReveal delay={3}>
                    <div className="backdrop-blur-sm rounded-[48px] p-4 sm:p-8 md:p-12 border border-white/10" style={{ backgroundColor: "#000100" }}>
                        <h3 className="font-['Urbanist',sans-serif] text-[24px] md:text-[28px] tracking-[-0.6px] mb-12">
                            <span style={{ fontWeight: 600, ...greenGradientStyle }}>{t("Carbon emission efficiency", "碳排放效率")}</span>
                        </h3>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 sm:gap-6">
                                    <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "76%" }} viewport={{ once: true, amount: 0 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} className="absolute top-0 left-0 h-full rounded-full" style={{ background: greenGradient }} />
                                    </div>
                                    <div className="w-[90px] sm:w-[200px] text-right flex-shrink-0">
                                        <span className="font-['Urbanist',sans-serif] text-[#1ECF4C] text-[11px] sm:text-[14px]" style={{ fontWeight: 600 }}>{t("Upto 23%", "最高减少23%")}<br />{t("less carbon emission", "碳排放")}</span>
                                    </div>
                                </div>
                                <span className="font-['Urbanist',sans-serif] text-white text-[14px]" style={{ fontWeight: 500 }} />
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 sm:gap-6">
                                    <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true, amount: 0 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} className="absolute top-0 left-0 h-full bg-white/65 rounded-full" />
                                    </div>
                                    <div className="w-[90px] sm:w-[200px] text-right flex-shrink-0">
                                        <span className="font-['Urbanist',sans-serif] text-white/65 text-[11px] sm:text-[14px]">{t("Average carbon", "平均碳")}<br />{t("emission", "排放量")}</span>
                                    </div>
                                </div>
                                <span className="font-['Urbanist',sans-serif] text-[#C7C7C8] text-[14px]" style={{ fontWeight: 500 }}>{t("Standard trans-Pacific shipment", "标准跨太平洋运输")}</span>
                            </div>
                        </div>
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}