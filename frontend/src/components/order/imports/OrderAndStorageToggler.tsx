"use client";

import svgPaths from "./svg-79qtpot0p4";

export default function OrderAndStorageToggler() {
  return (
    <div className="bg-[rgba(26,26,26,0.03)] content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[49796640px] size-full" data-name="Order and Storage toggler">
      <div className="relative rounded-[45210108px] shrink-0" data-name="Button">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[24px] py-[10px] relative">
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
            <div className="h-[18.055px] relative shrink-0 w-[18.53px]" data-name="Order">
              <div className="absolute inset-[-4.43%_-4.32%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.1303 19.6549">
                  <path d={svgPaths.p290b2300} id="Order" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" strokeWidth="1.6" />
                </svg>
              </div>
            </div>
            <p className="font-['Urbanist:Bold',sans-serif] leading-[27.789px] not-italic relative shrink-0 text-[18.526px] text-[rgba(26,26,26,0.35)] text-center whitespace-nowrap">Orders</p>
          </div>
        </div>
      </div>
      <div className="bg-[rgba(255,255,255,0.6)] relative rounded-[1000px] shrink-0 w-[143.526px]" data-name="Button">
        <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[1000px] shadow-[0px_1.684px_5.053px_0px_rgba(0,0,0,0.06),0px_0px_0px_0px_rgba(0,0,0,0.04)]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[24px] py-[10px] relative w-full">
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[18.526px]" data-name="Icon">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.5263 18.5263">
                <g id="Icon">
                  <path d={svgPaths.p27cdda80} id="Vector" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="1.6" />
                  <path d="M6.21 13.8984H12.31" id="Vector_2" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="square" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="1.6" />
                  <path d="M6.21316 10.8145H12.3132" id="Vector_3" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="square" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="1.6" />
                  <path d={svgPaths.p291a6e00} id="Vector_4" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="square" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="1.6" />
                </g>
              </svg>
            </div>
            <p className="font-['Urbanist:Bold',sans-serif] leading-[27.789px] not-italic relative shrink-0 text-[18.526px] text-[rgba(26,26,26,0.8)] text-center whitespace-nowrap">Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}