import Link from "next/link";
import { useLanguage } from "@/context/language";

export function Footer() {
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    return (
        <footer className="px-6 py-16 md:py-20 border-t border-black/[0.04]">
            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-16">
                    <div>
                        <Link href="/" className="text-[#19202b] text-[28px] tracking-[-0.5px] block mb-6" style={{ fontWeight: 700, fontFamily: "'Urbanist', sans-serif" }}>
                            Vehsl
                        </Link>
                        <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] leading-relaxed">
                            {t("Trust, quality, and care", "信任、品质与关怀")}<br />{t("in every transaction.", "贯穿每笔交易。")}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5" style={{ fontWeight: 600 }}>{t("Platform", "平台")}</h4>
                        <div className="flex flex-col gap-3">
                            {[t("B2B Trading", "B2B交易"), t("B2C Shopping", "B2C购物"), t("Quality Checks", "质量检验"), t("Logistics", "物流")].map((item) => (
                                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">{item}</a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5" style={{ fontWeight: 600 }}>{t("Sellers", "卖家")}</h4>
                        <div className="flex flex-col gap-3">
                            {[t("Become a Seller", "成为卖家"), t("Seller Dashboard", "卖家后台"), t("Pricing", "价格"), t("Support", "支持")].map((item) => (
                                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">{item}</a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5" style={{ fontWeight: 600 }}>{t("Company", "公司")}</h4>
                        <div className="flex flex-col gap-3">
                            {[t("About", "关于我们"), t("Careers", "招聘"), t("Privacy", "隐私"), t("Terms", "条款")].map((item) => (
                                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">{item}</a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-black/[0.04]">
                    <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px]">{t("Copyright 2026 Vehsl. All rights reserved.", "版权所有 2026 Vehsl。保留所有权利。")}</p>
                    <p className="font-['Urbanist',sans-serif] text-[#d2d2d7] text-[13px] mt-2 md:mt-0">{t("Designed with care, for everyone.", "用心设计，为所有人。")}</p>
                </div>
            </div>
        </footer>
    );
}