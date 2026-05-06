// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import svgPaths from "./svg-u1tqkwai99";
import imgImageBlur from "./55451ec36cb2985fbacf356d0ed1bc1dcdce52b4.png";

function Heading() {
  return (
    <div className="absolute content-stretch flex flex-col h-[98px] items-start left-[calc(25%+78px)] py-[1.9px] right-[calc(16.67%+176px)] top-[129px]" data-name="Heading 3">
      <div className="absolute blur-[15px] inset-[-66.33%_-29.97%_-29.73%_-30.03%]" data-name="Image+Blur">
        <div className="absolute inset-0 opacity-80 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgImageBlur} />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[68.79%_46.22%_9.24%_46.19%]">
      <div className="absolute inset-[-3.69%_-2.5%_-2.12%_-4.16%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 135.946 146.016">
          <g id="Group 370">
            <path d={svgPaths.p2ec46500} id="Vector" stroke="url(#paint0_linear_42168_27)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="10.6154" />
            <path d={svgPaths.p2ff93080} id="Vector_2" stroke="url(#paint1_linear_42168_27)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="6.36923" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_42168_27" x1="5.3952" x2="119.723" y1="36.7289" y2="90.2495">
              <stop offset="0.000100017" stopColor="#008FF7" />
              <stop offset="0.25" stopColor="#008FF7" />
              <stop offset="0.45" stopColor="#2D84F8" />
              <stop offset="0.55" stopColor="#5A79F9" />
              <stop offset="0.72" stopColor="#866EF9" />
              <stop offset="0.8" stopColor="#B363FA" />
              <stop offset="0.85" stopColor="#E44BC1" />
              <stop offset="0.95" stopColor="#EC4884" />
              <stop offset="1" stopColor="#F34546" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_42168_27" x1="116.073" x2="93.3294" y1="89.7724" y2="132.534">
              <stop stopColor="#F34546" />
              <stop offset="0.5" stopColor="#E44BC1" />
              <stop offset="1" stopColor="#B363FA" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[68.79%_46.22%_9.24%_46.19%]">
      <Group />
    </div>
  );
}

export default function LandingVehicle() {
  return (
    <div className="bg-white relative size-full" data-name="Landing-Vehicle">
      <Heading />
      <Group1 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Urbanist:Bold',sans-serif] h-[139px] justify-center leading-[0] left-[calc(16.67%+559.5px)] not-italic text-[96px] text-[rgba(0,0,0,0.9)] text-center top-[157.5px] tracking-[-1.2px] w-[769px]">
        <p className="leading-[84px]">Trust at first sight.</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[132px] justify-center leading-[0] left-[calc(33.33%+279.5px)] not-italic text-[48px] text-[rgba(68,68,69,0.4)] text-center top-[60px] tracking-[0.231px] w-[293px]">
        <p className="leading-[84px]">Experience</p>
      </div>
    </div>
  );
}
