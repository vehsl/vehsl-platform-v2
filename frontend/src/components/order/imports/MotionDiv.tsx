"use client";

import svgPaths from "./svg-b663wwcmqy";

function Phone() {
  return (
    <div className="absolute left-[20px] size-[14px] top-[12.75px]" data-name="Phone">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_356_2130)" id="Phone">
          <path d={svgPaths.p2c04e800} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
        <defs>
          <clipPath id="clip0_356_2130">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#0071e3] h-[39.5px] relative rounded-[26843500px] shrink-0 w-[163.688px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Phone />
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[19.5px] left-[93px] not-italic text-[13px] text-center text-white top-[10.6px]">+1 (800) 834-7571</p>
      </div>
    </div>
  );
}

function MessageSquare() {
  return (
    <div className="absolute left-[20px] size-[14px] top-[12.75px]" data-name="MessageSquare">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="MessageSquare">
          <path d={svgPaths.pff358a0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#1d1d1f] h-[39.5px] relative rounded-[26843500px] shrink-0 w-[117.138px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <MessageSquare />
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[19.5px] left-[70px] not-italic text-[13px] text-center text-white top-[10.6px]">New chat</p>
      </div>
    </div>
  );
}

export default function MotionDiv() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-center relative size-full" data-name="motion.div">
      <Button />
      <Button1 />
    </div>
  );
}