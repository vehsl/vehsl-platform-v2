"use client";

import svgPaths from "./svg-0bid4nzjhz";

function Clock() {
  return (
    <div className="absolute left-0 size-[14px] top-[2px]" data-name="Clock">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_436_52)" id="Clock">
          <path d={svgPaths.pc012c00} id="Vector" stroke="var(--stroke-0, #E67E22)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d="M7 3.5V7L9.33333 8.16667" id="Vector_2" stroke="var(--stroke-0, #E67E22)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
        <defs>
          <clipPath id="clip0_436_52">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Span() {
  return (
    <div className="absolute h-[18px] left-[24px] top-0 w-[92.55px]" data-name="span">
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[18px] left-0 not-italic text-[12px] text-[rgba(26,26,26,0.7)] top-[-0.4px] whitespace-nowrap">Need more time?</p>
    </div>
  );
}

function Span1() {
  return <div className="absolute h-[16.5px] left-[586.02px] top-[0.75px] w-[124.375px]" data-name="span" />;
}

function Container2() {
  return (
    <div className="h-[18px] relative shrink-0 w-[122px]" data-name="Container">
      <Clock />
      <Span />
      <Span1 />
    </div>
  );
}

function Span2() {
  return (
    <div className="absolute h-[14px] left-0 top-0 w-[16.513px]" data-name="span">
      <p className="absolute font-['Urbanist:Bold',sans-serif] leading-[14px] left-0 not-italic text-[#e67e22] text-[14px] top-[-0.6px] whitespace-nowrap">$5</p>
    </div>
  );
}

function Span3() {
  return (
    <div className="absolute h-[13.5px] left-[20.51px] top-[2.4px] w-[13.038px]" data-name="span">
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13.5px] left-0 not-italic text-[9px] text-[rgba(230,126,34,0.5)] top-[-0.2px] whitespace-nowrap">fee</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[15.9px] relative shrink-0 w-[33.55px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Span2 />
        <Span3 />
      </div>
    </div>
  );
}

function Container5() {
  return <div className="bg-[rgba(0,0,0,0.08)] h-[16px] shrink-0 w-px" data-name="Container" />;
}

function Span4() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[18.75px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[16.5px] left-0 not-italic text-[11px] text-[rgba(26,26,26,0.35)] top-[-0.4px] whitespace-nowrap">day</p>
      </div>
    </div>
  );
}

function Span5() {
  return (
    <div className="h-[14px] relative shrink-0 w-[8.125px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:Bold',sans-serif] leading-[14px] left-[4.5px] not-italic text-[14px] text-[rgba(26,26,26,0.15)] text-center top-[-0.6px] whitespace-nowrap">−</p>
      </div>
    </div>
  );
}

function MotionButton() {
  return (
    <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[26843500px] shrink-0 size-[26px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span5 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:Black',sans-serif] leading-[18px] left-[18px] not-italic text-[18px] text-[rgba(26,26,26,0.9)] text-center top-[3px] whitespace-nowrap">1</p>
      </div>
    </div>
  );
}

function Span6() {
  return (
    <div className="h-[14px] relative shrink-0 w-[8.125px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:Bold',sans-serif] leading-[14px] left-[4.5px] not-italic text-[14px] text-[rgba(26,26,26,0.6)] text-center top-[-0.6px] whitespace-nowrap">+</p>
      </div>
    </div>
  );
}

function MotionButton1() {
  return (
    <div className="bg-[rgba(0,0,0,0.06)] relative rounded-[26843500px] shrink-0 size-[26px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span6 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[26px] relative shrink-0 w-[92px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[2px] items-center relative size-full">
        <MotionButton />
        <Container7 />
        <MotionButton1 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[12px] h-[26px] items-center relative shrink-0 w-[181.3px]" data-name="Container">
      <Container4 />
      <Container5 />
      <Span4 />
      <Container6 />
    </div>
  );
}

function Frame() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Span7() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[124.375px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[16.5px] left-0 not-italic text-[11px] text-[rgba(26,26,26,0.35)] top-[-0.4px] whitespace-nowrap">0.19%/day auto-deducted</p>
      </div>
    </div>
  );
}

function Span8() {
  return (
    <div className="h-[15px] relative shrink-0 w-[112.787px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[0] left-0 not-italic text-[0px] text-[10px] text-[rgba(26,26,26,0.35)] top-[-0.2px] whitespace-nowrap">
          <span className="leading-[15px]">{`New deadline: `}</span>
          <span className="font-['Urbanist:SemiBold',sans-serif] leading-[15px] text-[rgba(26,26,26,0.55)]">Sun, Mar 8</span>
        </p>
      </div>
    </div>
  );
}

function MotionButton2() {
  return (
    <div className="h-[30.1px] relative rounded-[26843500px] shrink-0 w-[59.35px]" data-name="motion.button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[16.5px] left-[29.8px] not-italic text-[11px] text-[rgba(26,26,26,0.4)] text-center top-[6.4px] whitespace-nowrap">Cancel</p>
      </div>
    </div>
  );
}

function Clock1() {
  return (
    <div className="absolute left-[14px] size-[11px] top-[8.75px]" data-name="Clock">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g clipPath="url(#clip0_436_48)" id="Clock">
          <path d={svgPaths.p1f658e00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.14583" />
          <path d={svgPaths.p105d7900} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.14583" />
        </g>
        <defs>
          <clipPath id="clip0_436_48">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function MotionButton3() {
  return (
    <div className="bg-[#e67e22] h-[28.5px] relative rounded-[26843500px] shrink-0 w-[93.088px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Clock1 />
        <p className="-translate-x-1/2 absolute font-['Urbanist:Bold',sans-serif] leading-[16.5px] left-[55.5px] not-italic text-[11px] text-center text-white top-[5.6px] whitespace-nowrap">Extend 1d</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[30px] relative shrink-0 w-[711px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center justify-end relative size-full">
        <Span7 />
        <Span8 />
        <MotionButton2 />
        <MotionButton3 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[66.1px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end relative size-full">
          <Frame />
          <Container8 />
        </div>
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start pt-[12.8px] relative size-full">
        <Container1 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(230,126,34,0.1)] border-solid border-t-[0.8px] inset-0 pointer-events-none" />
    </div>
  );
}