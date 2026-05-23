import { motion } from "motion/react";
import { useLanguage } from "@/context/language";
import { SectionReveal } from "@/components/landing/section-reveal";
import { AlarmCheckIcon } from "@/components/landing/alarm-check-icon";
import { blueGradient2, blueGradient2Style } from "@/components/landing/gradients";

export function ValueSection() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    return (
        <section className="relative px-6 py-10 md:py-16 overflow-hidden" style={{ backgroundColor: "#000000" }}>
            <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />

            <div className="relative max-w-[1000px] mx-auto">
                <SectionReveal>
                    <div className="flex justify-center mb-[63px]"><AlarmCheckIcon /></div>
                </SectionReveal>

                <SectionReveal delay={1}>
                    <h2 className="font-['Urbanist',sans-serif] text-center text-[clamp(32px,5vw,48px)] tracking-[-1px] mb-[18px] leading-[1.15]" style={{ fontWeight: 700 }}>
                        <span className="text-white">{t("Less Time, ", "更少时间，")}</span>
                        <span style={blueGradient2Style}>{t("More Value", "更多价值")}</span>
                    </h2>
                </SectionReveal>

                <SectionReveal delay={2}>
                    <p className="font-['Urbanist',sans-serif] text-[#86868B] text-[12px] sm:text-[15px] md:text-[16px] text-center max-w-[800px] mx-auto mb-[80px] leading-relaxed">
                        {t("Vehsl automates compliance, docs, and logistics, cutting trade time by 22%. A 60-day process becomes 48, with faster customs and less admin.", "Vehsl自动化合规、文档和物流，将贸易时间缩短22%。60天的流程缩短为48天，清关更快，行政工作更少。")}
                    </p>
                </SectionReveal>

                <SectionReveal delay={3}>
                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-[48px] p-4 sm:p-8 md:p-12 border border-white/10">
                        <h3 className="font-['Urbanist',sans-serif] text-white text-[24px] md:text-[28px] tracking-[-0.6px] mb-12">
                            <span style={{ fontWeight: 400 }}>{t("Administrative ", "行政")}</span>
                            <span style={{ fontWeight: 600, ...blueGradient2Style }}>{t("time efficiency", "时间效率")}</span>
                        </h3>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 sm:gap-6">
                                    <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "80%" }} viewport={{ once: true, amount: 0 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} className="absolute top-0 left-0 h-full rounded-full" style={{ background: blueGradient2 }} />
                                    </div>
                                    <div className="w-[90px] sm:w-[200px] text-right flex-shrink-0">
                                        <span className="font-['Urbanist',sans-serif] text-[11px] sm:text-[14px]" style={{ fontWeight: 600, ...blueGradient2Style }}>
                                            {t("Upto 22%", "最高快22%")}<br />{t("faster (48 days)", "（48天）")}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-['Urbanist',sans-serif] text-white text-[14px]" style={{ fontWeight: 500 }}>Vehsl</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 sm:gap-6">
                                    <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "64%" }} viewport={{ once: true, amount: 0 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} className="absolute top-0 left-0 h-full bg-white/65 rounded-full" />
                                    </div>
                                    <div className="w-[90px] sm:w-[200px] text-right flex-shrink-0">
                                        <span className="font-['Urbanist',sans-serif] text-white/65 text-[11px] sm:text-[14px]">{t("Average lead", "平均交货")}<br />{t("time (60 days)", "时间（60天）")}</span>
                                    </div>
                                </div>
                                <span className="font-['Urbanist',sans-serif] text-white/65 text-[14px]" style={{ fontWeight: 500 }}>{t("Average lead time", "平均交货时间")}</span>
                            </div>
                        </div>
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}