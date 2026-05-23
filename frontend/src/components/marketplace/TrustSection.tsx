import { useLanguage } from "../../context/language";
import { SectionReveal } from "../ui/section-reveal";
import trustBlur from "../../assets/trust-blur.png";
import assuranceSvg from "../../assets/assurance.svg";
export function TrustSection() {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const trustBlurSrc = typeof trustBlur === "string" ? trustBlur : trustBlur.src;
  const assuranceSrc = typeof assuranceSvg === "string" ? assuranceSvg : assuranceSvg.src;
  
  return (
    <section className="relative px-6 overflow-hidden bg-white">
      <div className="relative max-w-[1200px] mx-auto min-h-[380px] md:min-h-[600px] flex flex-col justify-between items-center py-10 md:py-14">
        <SectionReveal>
          <div className="text-center">
            <p className="font-['Urbanist',sans-serif] text-center text-[clamp(24px,5vw,48px)] font-semibold leading-[1.5] tracking-[0.231px]" style={{ color: "rgba(68, 68, 69, 0.40)" }}>
              {t("Experience", "体验")}
            </p>
            <div className="relative w-full flex justify-center">
              {/* <img src={trustBlurSrc} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto pointer-events-none select-none" aria-hidden /> */}
              <h2 className="relative font-['Urbanist',sans-serif] text-center text-[clamp(36px,8vw,96px)] leading-[1] tracking-[-1.2px]" style={{ fontWeight: 700, color: "rgba(0, 0, 0, 0.90)" }}>
                {t("Trust at first sight", "一见即信赖")}
              </h2>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal delay={1}>
          <div className="flex justify-center mt-15 md:mt-0">
            <img src={assuranceSrc} alt="Assurance" className="w-full max-w-[448px] sm:max-w-[560px] h-auto" />
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
// "use client";

// import { useLanguage } from "@/context/language";
// import { SectionReveal } from "../landing/section-reveal";
// import trustBlur from "../../assets/trust-blur.png";
// import assurancePng from "../../assets/assurance.png";

// export function TrustSection() {
//   const { language } = useLanguage();
  
//   // Helper for localization
//   const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  
//   return (
//     <section className="relative px-6 overflow-hidden bg-white">
//       <div className="relative max-w-[1200px] mx-auto min-h-[380px] md:min-h-[600px] flex flex-col justify-between items-center py-10 md:py-14">
//         <SectionReveal>
//           <div className="text-center">
//             <p className="font-['Urbanist',sans-serif] text-center text-[clamp(24px,5vw,48px)] font-semibold leading-[1.5] tracking-[0.231px]" style={{ color: "rgba(68, 68, 69, 0.40)" }}>
//               {t("Experience", "体验")}
//             </p>
//             <div className="relative w-full flex justify-center">
//               <img 
//                 src={trustBlur.src || (trustBlur as any)} 
//                 alt="" 
//                 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto pointer-events-none select-none" 
//                 aria-hidden 
//               />
//               <h2 className="relative font-['Urbanist',sans-serif] text-center text-[clamp(36px,8vw,96px)] leading-[1] tracking-[-1.2px]" style={{ fontWeight: 700, color: "rgba(0, 0, 0, 0.90)" }}>
//                 {t("Trust at first sight", "一见即信赖")}
//               </h2>
//             </div>
//           </div>
//         </SectionReveal>

//         <SectionReveal delay={1}>
//           <div className="flex justify-center mt-15 md:mt-0">
//             <img 
//               src={assurancePng.src || (assurancePng as any)} 
//               alt="Assurance" 
//               className="w-full max-w-[448px] sm:max-w-[560px] h-auto" 
//             />
//           </div>
//         </SectionReveal>
//       </div>
//     </section>
//   );
// }
