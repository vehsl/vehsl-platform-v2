"use client";

import svgPaths from "./svg-szvkoscmyj";

function Knob() {
  return <div className="absolute bg-white left-[631.25px] rounded-[85.536px] shadow-[0px_0px_13.686px_8.554px_rgba(94,94,94,0.4),0px_0px_13.686px_8.554px_rgba(255,255,255,0.2)] size-[5.132px] top-[34.21px]" data-name="Knob" />;
}

function Knob1() {
  return <div className="absolute bg-white left-[2.57px] rounded-[85.536px] shadow-[0px_0px_13.686px_8.554px_rgba(94,94,94,0.4),0px_0px_13.686px_8.554px_rgba(255,255,255,0.2)] size-[5.132px] top-[34.21px]" data-name="Knob" />;
}

function Knob2() {
  return <div className="absolute bg-white left-[1236.85px] rounded-[85.536px] shadow-[0px_0px_13.686px_8.554px_rgba(94,94,94,0.4),0px_0px_13.686px_8.554px_rgba(255,255,255,0.2)] size-[5.132px] top-[34.21px]" data-name="Knob" />;
}

function Group() {
  return (
    <div className="absolute contents left-0 top-[31.65px]">
      <div className="absolute h-[10.264px] left-1/2 -translate-x-1/2 top-[31.65px] w-[1244.546px]" data-name="Gradient">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1244.55 10.2643">
          <path d={svgPaths.p1e7a3500} fill="url(#paint0_linear_42168_2745)" id="Gradient" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_42168_2745" x1="1169.06" x2="4.9423" y1="5.13192" y2="5.13117">
              <stop stopColor="#0B57D0" />
              <stop offset="0.0935614" stopColor="#0A6CB6" />
              <stop offset="0.162743" stopColor="#08819C" />
              <stop offset="0.230749" stopColor="#06AB68" />
              <stop offset="0.345374" stopColor="#00FF00" />
              <stop offset="0.509158" stopColor="#FFFF00" />
              <stop offset="0.686841" stopColor="#FFA500" />
              <stop offset="0.835569" stopColor="#FF0000" stopOpacity="0.8" />
              <stop offset="1" stopColor="#800080" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="-translate-y-1/2 -translate-x-1/2 absolute flex flex-col font-['SF_Pro_Rounded:Medium',sans-serif] h-[59px] justify-center leading-[0] not-italic left-1/2 text-[#0b57d0] text-[96px] text-center top-[95.5px] w-[262px] px-[0px] pt-[40px] pb-[0px]">
        <p className="leading-[20.529px]">100%</p>
      </div>
      <Knob />
      <Knob1 />
      <Knob2 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-0 top-[31.65px]">
      <Group />
    </div>
  );
}

function Frame() {
  return <div className="-translate-x-1/2 absolute h-[95.8px] left-1/2 rounded-[200px] top-0 w-[147.977px]" data-name="Frame" />;
}

export default function Group2() {
  return (
    <div className="relative size-full scale-[0.65] origin-center">
      <Group1 />
      <div className="absolute bg-[rgba(0,0,0,0)] h-[72.705px] left-1/2 translate-x-[553.9px] overflow-clip rounded-[100px] shadow-[0px_2.566px_3.421px_0px_rgba(0,0,0,0.15)] top-0 w-[136.857px]" data-name="Menu component">
        <Frame />
      </div>
    </div>
  );
}