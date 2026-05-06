"use client";

import svgPaths from "./svg-1bvazw7c48";

export default function AdjustButton() {
  return (
    <div className="bg-[rgba(46,170,87,0.1)] content-stretch flex gap-[6px] items-center pl-[16px] relative rounded-[1000px] size-full" data-name="Adjust button">
      <div className="relative shrink-0 size-[13px]" data-name="Icon">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
          <g clipPath="url(#clip0_472_16181)" id="Icon">
            <path d={svgPaths.p1d11280} id="Vector" stroke="var(--stroke-0, #2EAA57)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
            <path d={svgPaths.p332d1c70} id="Vector_2" stroke="var(--stroke-0, #2EAA57)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
          </g>
          <defs>
            <clipPath id="clip0_472_16181">
              <rect fill="white" height="13" width="13" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <div className="h-[18px] relative shrink-0 w-[33.987px]" data-name="SellerDashboard">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
          <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[18px] left-[17px] not-italic text-[#2eaa57] text-[12px] text-center top-[-0.4px] whitespace-nowrap">Adjust</p>
        </div>
      </div>
    </div>
  );
}