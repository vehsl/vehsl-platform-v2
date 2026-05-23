import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/context/language";
import { AliveElement } from "@/components/landing/alive-element";
import { WalletIcon } from "@/components/landing/wallet-icon";
import { linearGradientStyle } from "@/components/landing/gradients";
import spiralSvg from "../../assets/spiral.svg";
import imgProductPacked from "../../assets/product-packed.png";
import imgProductVetting from "../../assets/product-vetting.png";
import giftSvg from "../../assets/gift.svg";
import magnifyingGlassSvg from "../../assets/magnifying-glass.svg";
import moonSvg from "../../assets/moon.svg";
import sunSvg from "../../assets/sun.svg";
import plusButtonGray from "../../assets/plus-button-gray.svg";
import plusButtonRed from "../../assets/plus-button-red.svg";
import plusButtonGradient from "../../assets/plus-button-gradient.svg";
import plusButtonWhite from "../../assets/plus-button-white.svg";

export function SavingsSection() {
    const [open, setOpen] = useState([false, false, false, false]);
    const toggle = (i: number) => setOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
    const { language } = useLanguage();
    const t = (en: string, zh: string) => (language === "zh" ? zh : en);
    const getImageSrc = (img: any) => typeof img === 'object' ? img.src : img;

    return (
        <section className="relative py-10 md:py-16 overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[160px]" />
                <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] bg-pink-100/25 rounded-full blur-[140px]" />
                <div className="absolute bottom-[10%] left-[50%] w-[400px] h-[400px] bg-amber-100/15 rounded-full blur-[120px]" />
            </div>

            <div className="mt-[60px] md:mt-[102px] px-6">
                <WalletIcon className="w-[89px] h-auto sm:w-[127px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full max-w-[800px] mx-auto text-center px-6"
            >
                <AliveElement sensitivity={2} className="inline-block mt-[63px]">
                    <span className="text-[#2997FF] font-['Open_Sans',sans-serif] text-[20px] md:text-[24px] block text-center md:text-left">{t("upto", "高达")}</span>
                    <span className="font-['Open_Sans',sans-serif] text-[clamp(80px,18vw,240px)] tracking-[-0.72px] block leading-[0.9] text-center md:text-right font-semibold" style={{ ...linearGradientStyle }}>
                        21%
                    </span>
                    <span className="text-[#2997FF] font-['Open_Sans',sans-serif] text-[18px] md:text-[24px] block text-center mt-10 md:mt-[90px]">{t("cost savings in trade costs", "贸易成本节省")}</span>
                </AliveElement>
                <p className="font-['SF_Pro_Text',sans-serif] text-[#86868B] text-[15px] md:text-[20px] max-w-[720px] mx-auto leading-relaxed font-semibold mt-[18px]">
                    {t("Vehsl cuts trade costs by up to 21%: fewer errors, less admin, no costly delays. Real savings for your business.", "Vehsl将贸易成本降低高达21%：减少错误、精简行政，避免昂贵延误。为您的业务带来真实节省。")}
                </p>
            </motion.div>

            <div className="relative w-full mt-20 mb-8">
                <img src={getImageSrc(spiralSvg)} alt="" className="block w-full pointer-events-none select-none" style={{ opacity: 0.3 }} />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
                    <h2 className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,5.5vw,72px)] text-center mb-3 md:mb-5 leading-tight font-bold">
                        {t("Quality that stays strong.", "始终如一的品质。")}
                    </h2>
                    <p className="font-['Urbanist',sans-serif] text-[#B8B8B8] text-[clamp(13px,1.8vw,22px)] text-center font-semibold">
                        {t("Vehsl class reliability with each sample and product", "Vehsl级别的可靠性，贯穿每一件样品和产品")}
                    </p>
                </div>
            </div>

            <div className="w-full max-w-[1060px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left column */}
                <div className="flex flex-col gap-5">
                    {/* Card 0 */}
                    <div className="flex flex-col gap-3">
                        <div className="relative overflow-hidden flex flex-col w-full rounded-[34px] border-[2.137px] border-[#D9D9D9] cursor-pointer [@media(max-width:744px)]:h-[200px]" onClick={() => toggle(0)}>
                            <img src={getImageSrc(imgProductPacked)} alt="Product blocks" className="object-cover w-full h-[200px] md:h-[270px] [@media(max-width:744px)]:h-[110px] shrink-0" />
                            <div className="flex items-center gap-3 px-6 py-4 flex-1 min-h-[90px] items-center [@media(max-width:400px)]:items-start [@media(max-width:400px)]:px-0">
                                <p className="font-['SF_Pro_Display',sans-serif] text-[clamp(18px,2.5vw,26px)] text-center [@media(max-width:400px)]:text-center [@media(max-width:400px)]:mx-auto [@media(max-width:400px)]:pl-0 [@media(max-width:400px)]:max-w-[180px] font-semibold tracking-[0.209px] flex-1">
                                    <span className="[display:none] [@media(max-width:1030px)]:!inline">{t("Products are self", "产品自行")}<span className="[@media(max-width:768px)]:hidden"><br /></span><span className="hidden [@media(max-width:768px)]:inline"> </span>{t("collected.", "收集。")}</span>
                                    <span className="[@media(max-width:1030px)]:!hidden">{t("Products are self collected to maintain standard quality.", "产品自行收集以保持标准质量。")}</span>
                                </p>
                            </div>
                            <motion.div className="absolute bottom-[17px] right-[17px]" animate={{ rotate: open[0] ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                                <img src={getImageSrc(plusButtonGray)} alt={open[0] ? "Close" : "Add"} width="54" height="54" />
                            </motion.div>
                        </div>
                        <AnimatePresence initial={false}>
                            {open[0] && (
                                <motion.div key="popup-0" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: 'rgba(245, 245, 245, 0.60)', backdropFilter: 'blur(76px)', borderRadius: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full">
                                    <div className="px-[15px] py-[9.5px]"><div className="px-[7.5px] py-[10.5px]"><p className="font-['SF_Pro',_'SF_Pro_Display',_sans-serif] text-[14.3px] leading-[1.35] text-black" style={{ letterSpacing: '0.013em' }}>{t("Selected at random by our team, this ensures consistent quality and simplifies operations, allowing you to focus on your areas of expertise.", "由我们的团队随机抽选，确保质量一致性，简化运营，让您专注于自己的专业领域。")}</p></div></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Card 1 */}
                    <div className="flex flex-col gap-3">
                        <div className="relative flex items-center justify-center gap-4 px-8 pt-8 pb-[46px] md:py-8 cursor-pointer w-full rounded-[33.526px] border-[0.958px] border-[#F35A7B] bg-[#FFE1FC] min-h-[200px] [@media(max-width:744px)]:h-[200px]" onClick={() => toggle(1)}>
                            <div className="absolute left-[21px] top-[7px]"><img src={getImageSrc(moonSvg)} alt="Moon" className="w-10 h-10 md:w-12 md:h-12" /></div>
                            <div className="absolute top-[7px] right-[21px]"><img src={getImageSrc(sunSvg)} alt="Sun" className="w-10 h-10 md:w-12 md:h-12" /></div>
                            <div className="flex-shrink-0"><img src={getImageSrc(giftSvg)} alt="Gift" className="w-12 h-12 md:w-16 md:h-16" /></div>
                            <p className="font-['SF_Pro_Display',sans-serif] text-[clamp(18px,2.5vw,29.924px)] leading-tight font-semibold text-[#FF2D55]">{t("Mid-Order QC. Frequent Samples. Zero Surprises.", "订单中质检。频繁抽样。零意外。")}</p>
                            <motion.div className="absolute bottom-[17px] right-[17px]" animate={{ rotate: open[1] ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                                <img src={getImageSrc(plusButtonRed)} alt={open[1] ? "Close" : "Add"} width="54" height="54" />
                            </motion.div>
                        </div>
                        <AnimatePresence initial={false}>
                            {open[1] && (
                                <motion.div key="popup-1" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: 'rgba(245, 245, 245, 0.60)', backdropFilter: 'blur(76px)', borderRadius: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full">
                                    <div className="px-[15px] py-[9.5px]"><div className="px-[7.5px] py-[10.5px]"><p className="font-['SF_Pro',_'SF_Pro_Display',_sans-serif] text-[14.3px] leading-[1.35] bg-clip-text text-transparent" style={{ letterSpacing: '0.013em', backgroundImage: 'linear-gradient(90deg, rgba(0,143,247,1) 0%, rgba(45,132,248,1) 13%, rgba(90,121,249,1) 25%, rgba(134,110,249,1) 38%, rgba(179,99,250,1) 50%, rgba(228,75,193,1) 75%, rgba(235,72,131,1) 88%, rgba(243,69,70,1) 100%)' }}>{t("During production, product quality is cross-checked against approved samples, and buyers can adjust the number of verifications to balance reliability and cost, keeping full control in their hands.", "生产过程中，产品质量与已批准样品交叉核对，买家可调整验证次数以平衡可靠性与成本，全程掌控在买家手中。")}</p></div></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                    {/* Card 2 */}
                    <div className="flex flex-col gap-3">
                        <div className="relative flex items-center justify-center gap-4 px-8 pt-8 pb-[46px] md:py-8 cursor-pointer w-full rounded-[33.526px] min-h-[200px] [@media(max-width:744px)]:h-[200px]" style={{ background: 'linear-gradient(138deg, #D1E6F7 22.9%, #E4EFFE 47.93%, #F6FBF9 71.9%)', boxShadow: '0 1.916px 19.158px 0 #FFF inset, 1.916px 7.663px 19.158px 0 rgba(0, 0, 0, 0.10)', backdropFilter: 'blur(14.368132591247559px)' }} onClick={() => toggle(2)}>
                            <div className="flex-shrink-0"><img src={getImageSrc(magnifyingGlassSvg)} alt="Magnifying glass" className="w-12 h-12 md:w-16 md:h-16" /></div>
                            <p className="font-['SF_Pro_Display',sans-serif] text-[clamp(18px,2.5vw,29px)] leading-tight font-semibold" style={{ background: 'linear-gradient(90deg, #0894FF, #C959DD, #FF2E54, #FF9004)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t("Each product tested & rated so you don't have to guess.", "每款产品均经测试和评级，让您无需猜测。")}</p>
                            <motion.div className="absolute bottom-[17px] right-[17px]" animate={{ rotate: open[2] ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                                <img src={getImageSrc(plusButtonGradient)} alt={open[2] ? "Close" : "Add"} width="54" height="54" />
                            </motion.div>
                        </div>
                        <AnimatePresence initial={false}>
                            {open[2] && (
                                <motion.div key="popup-2" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: 'rgba(245, 245, 245, 0.60)', backdropFilter: 'blur(76px)', borderRadius: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full">
                                    <div className="px-[15px] py-[9.5px]"><div className="px-[7.5px] py-[10.5px]"><p className="font-['SF_Pro',_'SF_Pro_Display',_sans-serif] text-[14.3px] leading-[1.35] text-[#333333]" style={{ letterSpacing: '0.013em' }}>{t("Vehsl tests each product for general quality and real-use experience, ensuring that every listed item is reliably rated. This helps eliminate the risk of fake reviews and ratings.", "Vehsl对每款产品进行综合质量和实际使用体验测试，确保每件上架商品都有可靠的评级，有效消除虚假评价和评分的风险。")}</p></div></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Card 3 */}
                    <div className="flex flex-col gap-3">
                        <div className="relative cursor-pointer w-full" onClick={() => toggle(3)}>
                            <div className="rounded-[32px] overflow-hidden w-full aspect-[4/5] md:aspect-auto md:h-[406.139px] [@media(max-width:744px)]:aspect-auto [@media(max-width:744px)]:h-[200px]" style={{ backgroundColor: '#0F0F0F' }}>
                                <img src={getImageSrc(imgProductVetting)} alt="Product vetting" className="w-full h-full object-contain" />
                            </div>
                            <motion.div className="absolute bottom-[17px] right-[17px]" animate={{ rotate: open[3] ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                                <img src={getImageSrc(plusButtonWhite)} alt={open[3] ? "Close" : "Add"} width="54" height="54" />
                            </motion.div>
                        </div>
                        <AnimatePresence initial={false}>
                            {open[3] && (
                                <motion.div key="popup-3" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: 'rgba(245, 245, 245, 0.60)', backdropFilter: 'blur(76px)', borderRadius: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full">
                                    <div className="px-[15px] py-[9.5px]"><div className="px-[7.5px] py-[10.5px]"><p className="font-['SF_Pro',_'SF_Pro_Display',_sans-serif] text-[14.3px] leading-[1.35] text-[#333333]" style={{ letterSpacing: '0.013em' }}>{t("When sellers request a listing, each product enters a defined process, selected for review, then tested, rated, approved, and finally listed on the platform.", "当卖家申请上架时，每款产品将进入既定流程：审核选品、测试、评级、审批，最终上架平台。")}</p></div></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}