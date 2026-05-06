"use client";

import svgPaths from "./svg-bhnnawsspr";

function Span() {
  return (
    <div className="h-[20.4px] relative shrink-0 w-[107.275px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[20.4px] left-0 not-italic text-[#6e6e73] text-[13.6px] top-[-0.4px] tracking-[0.272px] uppercase">Open requests</p>
      </div>
    </div>
  );
}

function Span1() {
  return (
    <div className="bg-[rgba(0,113,227,0.1)] flex-[1_0_0] h-[22px] min-h-px min-w-px relative rounded-[26843500px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[18px] left-[10px] not-italic text-[#0071e3] text-[12px] top-[1.6px]">2</p>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="ChevronDown">
      <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 5.33333">
            <path d={svgPaths.p32098840} id="Vector" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="motion.div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <ChevronDown />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[22px] relative shrink-0 w-[50.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Span1 />
        <MotionDiv1 />
      </div>
    </div>
  );
}

function Div1() {
  return (
    <div className="content-stretch flex h-[38px] items-center justify-between relative shrink-0 w-full" data-name="div">
      <Span />
      <Container />
    </div>
  );
}

function Clock() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Clock">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_352_3912)" id="Clock">
          <path d={svgPaths.p39ee6532} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 4V8L10.6667 9.33333" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_352_3912">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div3() {
  return (
    <div className="bg-[#f0f4f8] relative rounded-[26843500px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Clock />
      </div>
    </div>
  );
}

function P() {
  return (
    <div className="h-[21.275px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[21.28px] left-0 not-italic text-[#1d1d1f] text-[15.2px] top-[-1.2px]">Order #VH-28491 delivery issue</p>
    </div>
  );
}

function P1() {
  return (
    <div className="h-[19.2px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[19.2px] left-0 not-italic text-[#86868b] text-[12.8px] top-[-0.4px]">12th May 2026 at 7:32am</p>
    </div>
  );
}

function Div4() {
  return (
    <div className="flex-[1_0_0] h-[42.475px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <P />
        <P1 />
      </div>
    </div>
  );
}

function Span2() {
  return (
    <div className="bg-[#f5f5f7] h-[26px] relative rounded-[26843500px] shrink-0 w-[82.05px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[18px] left-[12px] not-italic text-[#86868b] text-[12px] top-[3.6px]">In progress</p>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="ChevronRight">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="ChevronRight">
          <path d="M6 12L10 8L6 4" id="Vector" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Div5() {
  return (
    <div className="h-[26px] relative shrink-0 w-[106.05px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Span2 />
        <ChevronRight />
      </div>
    </div>
  );
}

function MotionDiv2() {
  return (
    <div className="bg-[rgba(255,255,255,0.7)] h-[82.475px] relative rounded-[22px] shadow-[0px_1px_8px_0px_rgba(0,0,0,0.02)] shrink-0 w-[632px]" data-name="motion.div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center px-[24px] relative size-full">
        <Div3 />
        <Div4 />
        <Div5 />
      </div>
    </div>
  );
}

function Clock1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Clock">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_352_3912)" id="Clock">
          <path d={svgPaths.p39ee6532} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 4V8L10.6667 9.33333" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_352_3912">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div6() {
  return (
    <div className="bg-[#f0f4f8] relative rounded-[26843500px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Clock1 />
      </div>
    </div>
  );
}

function P2() {
  return (
    <div className="h-[21.275px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[21.28px] left-0 not-italic text-[#1d1d1f] text-[15.2px] top-[-1.2px]">Product quality review request</p>
    </div>
  );
}

function P3() {
  return (
    <div className="h-[19.2px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[19.2px] left-0 not-italic text-[#86868b] text-[12.8px] top-[-0.4px]">15th May 2026 at 3:32pm</p>
    </div>
  );
}

function Div7() {
  return (
    <div className="flex-[1_0_0] h-[42.475px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <P2 />
        <P3 />
      </div>
    </div>
  );
}

function Span3() {
  return (
    <div className="bg-[#f5f5f7] flex-[1_0_0] h-[26px] min-h-px min-w-px relative rounded-[26843500px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[18px] left-[12px] not-italic text-[#86868b] text-[12px] top-[3.6px]">Under review</p>
      </div>
    </div>
  );
}

function ChevronRight1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="ChevronRight">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="ChevronRight">
          <path d="M6 12L10 8L6 4" id="Vector" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Div8() {
  return (
    <div className="h-[26px] relative shrink-0 w-[118.625px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Span3 />
        <ChevronRight1 />
      </div>
    </div>
  );
}

function MotionDiv3() {
  return (
    <div className="bg-[rgba(255,255,255,0.7)] h-[82.475px] relative rounded-[22px] shadow-[0px_1px_8px_0px_rgba(0,0,0,0.02)] shrink-0 w-[632px]" data-name="motion.div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center px-[24px] relative size-full">
        <Div6 />
        <Div7 />
        <Div8 />
      </div>
    </div>
  );
}

function Div2() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] h-[176.95px] items-start overflow-clip relative shrink-0 w-full" data-name="div">
      <MotionDiv2 />
      <MotionDiv3 />
    </div>
  );
}

function MotionDiv() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[226.95px] items-start left-[249.6px] px-[24px] top-[633.6px] w-[680px]" data-name="motion.div">
      <Div1 />
      <Div2 />
    </div>
  );
}

function H1() {
  return (
    <div className="content-stretch flex h-[38.4px] items-start relative shrink-0 w-full" data-name="h2">
      <p className="flex-[1_0_0] font-['Urbanist:Bold',sans-serif] leading-[38.4px] min-h-px min-w-px not-italic relative text-[#1d1d1f] text-[32px] text-center tracking-[-0.96px] whitespace-pre-wrap">Popular topics</p>
    </div>
  );
}

function P4() {
  return (
    <div className="h-[22.8px] relative shrink-0 w-full" data-name="p">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[22.8px] left-[565.69px] not-italic text-[#86868b] text-[15.2px] text-center top-[-1.4px] tracking-[-0.152px]">{`Everything you need, nothing you don't`}</p>
    </div>
  );
}

function MotionDiv4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[10px] h-[71.2px] items-start left-[24px] top-0 w-[1131.2px]" data-name="motion.div">
      <H1 />
      <P4 />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p1cbf8700} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p3e9e9000} id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p38d7a330} id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.pfd56880} id="Vector_4" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function H2() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[120.625px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Getting started</p>
      </div>
    </div>
  );
}

function Div9() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container3 />
      <H2 />
    </div>
  );
}

function MotionButton() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div9 />
    </div>
  );
}

function Span4() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">How Vehsl works</p>
      </div>
    </div>
  );
}

function Div11() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span4 />
        </div>
      </div>
    </div>
  );
}

function MotionButton1() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div11 />
      </div>
    </div>
  );
}

function Span5() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Creating your account</p>
      </div>
    </div>
  );
}

function Div12() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span5 />
        </div>
      </div>
    </div>
  );
}

function MotionButton2() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div12 />
      </div>
    </div>
  );
}

function Span6() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Placing your first order</p>
      </div>
    </div>
  );
}

function Div13() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span6 />
        </div>
      </div>
    </div>
  );
}

function MotionButton3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div13 />
      </div>
    </div>
  );
}

function Div10() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton1 />
      <MotionButton2 />
      <MotionButton3 />
    </div>
  );
}

function Span7() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight2() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv6() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight2 />
    </div>
  );
}

function MotionButton4() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span7 />
      <MotionDiv6 />
    </div>
  );
}

function MotionDiv5() {
  return (
    <div className="absolute bg-white h-[311.313px] left-0 rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-0 w-[357.325px]" data-name="motion.div">
      <MotionButton />
      <Div10 />
      <MotionButton4 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p2820d300} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9 16.5V9" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p32143100} id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M5.625 3.2025L12.375 7.065" id="Vector_4" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon1 />
      </div>
    </div>
  );
}

function H3() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[122.325px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Buying on Vehsl</p>
      </div>
    </div>
  );
}

function Div14() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container4 />
      <H3 />
    </div>
  );
}

function MotionButton5() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.337px]" data-name="motion.button">
      <Div14 />
    </div>
  );
}

function Span8() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">How to search and buy products</p>
      </div>
    </div>
  );
}

function Div16() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span8 />
        </div>
      </div>
    </div>
  );
}

function MotionButton6() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div16 />
      </div>
    </div>
  );
}

function Span9() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Order tracking and status updates</p>
      </div>
    </div>
  );
}

function Div17() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span9 />
        </div>
      </div>
    </div>
  );
}

function MotionButton7() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div17 />
      </div>
    </div>
  );
}

function Span10() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Cancelling or modifying an order</p>
      </div>
    </div>
  );
}

function Div18() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span10 />
        </div>
      </div>
    </div>
  );
}

function MotionButton8() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div18 />
      </div>
    </div>
  );
}

function Div15() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.337px]" data-name="div">
      <MotionButton6 />
      <MotionButton7 />
      <MotionButton8 />
    </div>
  );
}

function Span11() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight3() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv8() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.12px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight3 />
    </div>
  );
}

function MotionButton9() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span11 />
      <MotionDiv8 />
    </div>
  );
}

function MotionDiv7() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[381.33px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-0 w-[357.337px]" data-name="motion.div">
      <MotionButton5 />
      <Div15 />
      <MotionButton9 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p3c193bc0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M13.5 12.75V6.75" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9.75 12.75V3.75" id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6 12.75V10.5" id="Vector_4" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function H4() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[121.662px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Selling on Vehsl</p>
      </div>
    </div>
  );
}

function Div19() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container5 />
      <H4 />
    </div>
  );
}

function MotionButton10() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div19 />
    </div>
  );
}

function Span12() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Listing your first product</p>
      </div>
    </div>
  );
}

function Div21() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span12 />
        </div>
      </div>
    </div>
  );
}

function MotionButton11() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div21 />
      </div>
    </div>
  );
}

function Span13() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Inventory and stock management</p>
      </div>
    </div>
  );
}

function Div22() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span13 />
        </div>
      </div>
    </div>
  );
}

function MotionButton12() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div22 />
      </div>
    </div>
  );
}

function Span14() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Pricing, fees and commissions</p>
      </div>
    </div>
  );
}

function Div23() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span14 />
        </div>
      </div>
    </div>
  );
}

function MotionButton13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div23 />
      </div>
    </div>
  );
}

function Div20() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton11 />
      <MotionButton12 />
      <MotionButton13 />
    </div>
  );
}

function Span15() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight4() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv10() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight4 />
    </div>
  );
}

function MotionButton14() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span15 />
      <MotionDiv10 />
    </div>
  );
}

function MotionDiv9() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[762.66px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-0 w-[357.325px]" data-name="motion.div">
      <MotionButton10 />
      <Div20 />
      <MotionButton14 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.pb9add80} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M11.25 13.5H6.75" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p27fe380} id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.pa40c600} id="Vector_4" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p20a8dc00} id="Vector_5" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon3 />
      </div>
    </div>
  );
}

function H5() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[171.875px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Shipping and delivery</p>
      </div>
    </div>
  );
}

function Div24() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container6 />
      <H5 />
    </div>
  );
}

function MotionButton15() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div24 />
    </div>
  );
}

function Span16() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Worldwide delivery and timelines</p>
      </div>
    </div>
  );
}

function Div26() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span16 />
        </div>
      </div>
    </div>
  );
}

function MotionButton16() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div26 />
      </div>
    </div>
  );
}

function Span17() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Shipping rates and calculator</p>
      </div>
    </div>
  );
}

function Div27() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span17 />
        </div>
      </div>
    </div>
  );
}

function MotionButton17() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div27 />
      </div>
    </div>
  );
}

function Span18() {
  return (
    <div className="flex-[1_0_0] h-[44.875px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px] w-[213px] whitespace-pre-wrap">Customs, duties and international orders</p>
      </div>
    </div>
  );
}

function Div28() {
  return (
    <div className="h-[64.875px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span18 />
        </div>
      </div>
    </div>
  );
}

function MotionButton18() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div28 />
      </div>
    </div>
  );
}

function Div25() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[157.75px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton16 />
      <MotionButton17 />
      <MotionButton18 />
    </div>
  );
}

function Span19() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight5() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv12() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight5 />
    </div>
  );
}

function MotionButton19() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[284.15px] w-[131.125px]" data-name="motion.button">
      <Span19 />
      <MotionDiv12 />
    </div>
  );
}

function MotionDiv11() {
  return (
    <div className="absolute bg-white h-[333.75px] left-0 rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[335.31px] w-[357.325px]" data-name="motion.div">
      <MotionButton15 />
      <Div25 />
      <MotionButton19 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p22c79200} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p173d700} id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6.75 10.5L8.25 12L11.25 9" id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon4 />
      </div>
    </div>
  );
}

function H6() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[140.713px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Quality assurance</p>
      </div>
    </div>
  );
}

function Div29() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container7 />
      <H6 />
    </div>
  );
}

function MotionButton20() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.337px]" data-name="motion.button">
      <Div29 />
    </div>
  );
}

function Span20() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">How quality checks work</p>
      </div>
    </div>
  );
}

function Div31() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span20 />
        </div>
      </div>
    </div>
  );
}

function MotionButton21() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div31 />
      </div>
    </div>
  );
}

function Span21() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Default quality ratings explained</p>
      </div>
    </div>
  );
}

function Div32() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span21 />
        </div>
      </div>
    </div>
  );
}

function MotionButton22() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div32 />
      </div>
    </div>
  );
}

function Span22() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Reporting a product quality issue</p>
      </div>
    </div>
  );
}

function Div33() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span22 />
        </div>
      </div>
    </div>
  );
}

function MotionButton23() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div33 />
      </div>
    </div>
  );
}

function Div30() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[157.75px] items-start left-[32px] top-[96px] w-[293.337px]" data-name="div">
      <MotionButton21 />
      <MotionButton22 />
      <MotionButton23 />
    </div>
  );
}

function Span23() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight6() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv14() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.12px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight6 />
    </div>
  );
}

function MotionButton24() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[284.15px] w-[131.125px]" data-name="motion.button">
      <Span23 />
      <MotionDiv14 />
    </div>
  );
}

function MotionDiv13() {
  return (
    <div className="absolute bg-white h-[333.75px] left-[381.33px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[335.31px] w-[357.337px]" data-name="motion.div">
      <MotionButton20 />
      <Div30 />
      <MotionButton24 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g clipPath="url(#clip0_352_3932)" id="Icon">
          <path d={svgPaths.p21f70400} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6.75 9L8.25 10.5L11.25 7.5" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_352_3932">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon5 />
      </div>
    </div>
  );
}

function H7() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[163.963px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Verification and trust</p>
      </div>
    </div>
  );
}

function Div34() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container8 />
      <H7 />
    </div>
  );
}

function MotionButton25() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div34 />
    </div>
  );
}

function Span24() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Seller verification process</p>
      </div>
    </div>
  );
}

function Div36() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span24 />
        </div>
      </div>
    </div>
  );
}

function MotionButton26() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div36 />
      </div>
    </div>
  );
}

function Span25() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Buyer verification and KYC</p>
      </div>
    </div>
  );
}

function Div37() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span25 />
        </div>
      </div>
    </div>
  );
}

function MotionButton27() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div37 />
      </div>
    </div>
  );
}

function Span26() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Trust badges and what they mean</p>
      </div>
    </div>
  );
}

function Div38() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span26 />
        </div>
      </div>
    </div>
  );
}

function MotionButton28() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div38 />
      </div>
    </div>
  );
}

function Div35() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[157.75px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton26 />
      <MotionButton27 />
      <MotionButton28 />
    </div>
  );
}

function Span27() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight7() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv16() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight7 />
    </div>
  );
}

function MotionButton29() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[284.15px] w-[131.125px]" data-name="motion.button">
      <Span27 />
      <MotionDiv16 />
    </div>
  );
}

function MotionDiv15() {
  return (
    <div className="absolute bg-white h-[333.75px] left-[762.66px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[335.31px] w-[357.325px]" data-name="motion.div">
      <MotionButton25 />
      <Div35 />
      <MotionButton29 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p5eca500} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M1.5 7.5H16.5" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon6 />
      </div>
    </div>
  );
}

function H8() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[162.463px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Payments and billing</p>
      </div>
    </div>
  );
}

function Div39() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container9 />
      <H8 />
    </div>
  );
}

function MotionButton30() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div39 />
    </div>
  );
}

function Span28() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Accepted payment methods</p>
      </div>
    </div>
  );
}

function Div41() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span28 />
        </div>
      </div>
    </div>
  );
}

function MotionButton31() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div41 />
      </div>
    </div>
  );
}

function Span29() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Invoices and transaction history</p>
      </div>
    </div>
  );
}

function Div42() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span29 />
        </div>
      </div>
    </div>
  );
}

function MotionButton32() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div42 />
      </div>
    </div>
  );
}

function Span30() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Multi-currency payments</p>
      </div>
    </div>
  );
}

function Div43() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span30 />
        </div>
      </div>
    </div>
  );
}

function MotionButton33() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div43 />
      </div>
    </div>
  );
}

function Div40() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton31 />
      <MotionButton32 />
      <MotionButton33 />
    </div>
  );
}

function Span31() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight8() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv18() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight8 />
    </div>
  );
}

function MotionButton34() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span31 />
      <MotionDiv18 />
    </div>
  );
}

function MotionDiv17() {
  return (
    <div className="absolute bg-white h-[311.313px] left-0 rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[693.06px] w-[357.325px]" data-name="motion.div">
      <MotionButton30 />
      <Div40 />
      <MotionButton34 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p1722c40} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M2.25 2.25V6H6" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon7 />
      </div>
    </div>
  );
}

function H9() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[157.45px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Returns and refunds</p>
      </div>
    </div>
  );
}

function Div44() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container10 />
      <H9 />
    </div>
  );
}

function MotionButton35() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.337px]" data-name="motion.button">
      <Div44 />
    </div>
  );
}

function Span32() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Return policy and eligibility</p>
      </div>
    </div>
  );
}

function Div46() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span32 />
        </div>
      </div>
    </div>
  );
}

function MotionButton36() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div46 />
      </div>
    </div>
  );
}

function Span33() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">How to initiate a return</p>
      </div>
    </div>
  );
}

function Div47() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span33 />
        </div>
      </div>
    </div>
  );
}

function MotionButton37() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div47 />
      </div>
    </div>
  );
}

function Span34() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Refund timelines and process</p>
      </div>
    </div>
  );
}

function Div48() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span34 />
        </div>
      </div>
    </div>
  );
}

function MotionButton38() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div48 />
      </div>
    </div>
  );
}

function Div45() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.337px]" data-name="div">
      <MotionButton36 />
      <MotionButton37 />
      <MotionButton38 />
    </div>
  );
}

function Span35() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight9() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv20() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.12px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight9 />
    </div>
  );
}

function MotionButton39() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span35 />
      <MotionDiv20 />
    </div>
  );
}

function MotionDiv19() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[381.33px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[693.06px] w-[357.337px]" data-name="motion.div">
      <MotionButton35 />
      <Div45 />
      <MotionButton39 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p1d69e00} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p1150d400} id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M5.25 15.75H12.75" id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9 2.25V15.75" id="Vector_4" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.pc9a7e80} id="Vector_5" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container11() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon8 />
      </div>
    </div>
  );
}

function H10() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[185.6px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Disputes and protection</p>
      </div>
    </div>
  );
}

function Div49() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container11 />
      <H10 />
    </div>
  );
}

function MotionButton40() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div49 />
    </div>
  );
}

function Span36() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Raising a dispute</p>
      </div>
    </div>
  );
}

function Div51() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span36 />
        </div>
      </div>
    </div>
  );
}

function MotionButton41() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div51 />
      </div>
    </div>
  );
}

function Span37() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Buyer protection program</p>
      </div>
    </div>
  );
}

function Div52() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span37 />
        </div>
      </div>
    </div>
  );
}

function MotionButton42() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div52 />
      </div>
    </div>
  );
}

function Span38() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Seller protection program</p>
      </div>
    </div>
  );
}

function Div53() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span38 />
        </div>
      </div>
    </div>
  );
}

function MotionButton43() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div53 />
      </div>
    </div>
  );
}

function Div50() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton41 />
      <MotionButton42 />
      <MotionButton43 />
    </div>
  );
}

function Span39() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight10() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv22() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight10 />
    </div>
  );
}

function MotionButton44() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span39 />
      <MotionDiv22 />
    </div>
  );
}

function MotionDiv21() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[762.66px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[693.06px] w-[357.325px]" data-name="motion.div">
      <MotionButton40 />
      <Div50 />
      <MotionButton44 />
    </div>
  );
}

function Icon9() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p3840bd70} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6.75 9L8.25 10.5L11.25 7.5" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container12() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon9 />
      </div>
    </div>
  );
}

function H11() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[164.525px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Account and security</p>
      </div>
    </div>
  );
}

function Div54() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container12 />
      <H11 />
    </div>
  );
}

function MotionButton45() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div54 />
    </div>
  );
}

function Span40() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Managing your profile and settings</p>
      </div>
    </div>
  );
}

function Div56() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span40 />
        </div>
      </div>
    </div>
  );
}

function MotionButton46() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div56 />
      </div>
    </div>
  );
}

function Span41() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Two-factor authentication</p>
      </div>
    </div>
  );
}

function Div57() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span41 />
        </div>
      </div>
    </div>
  );
}

function MotionButton47() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div57 />
      </div>
    </div>
  );
}

function Span42() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Reporting fraud or suspicious activity</p>
      </div>
    </div>
  );
}

function Div58() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span42 />
        </div>
      </div>
    </div>
  );
}

function MotionButton48() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div58 />
      </div>
    </div>
  );
}

function Div55() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton46 />
      <MotionButton47 />
      <MotionButton48 />
    </div>
  );
}

function Span43() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight11() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv24() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight11 />
    </div>
  );
}

function MotionButton49() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span43 />
      <MotionDiv24 />
    </div>
  );
}

function MotionDiv23() {
  return (
    <div className="absolute bg-white h-[311.313px] left-0 rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[1028.38px] w-[357.325px]" data-name="motion.div">
      <MotionButton45 />
      <Div55 />
      <MotionButton49 />
    </div>
  );
}

function Icon10() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p305bd600} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12 5.25H16.5V9.75" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container13() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon10 />
      </div>
    </div>
  );
}

function H12() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[152.725px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Business tools (B2B)</p>
      </div>
    </div>
  );
}

function Div59() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container13 />
      <H12 />
    </div>
  );
}

function MotionButton50() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.337px]" data-name="motion.button">
      <Div59 />
    </div>
  );
}

function Span44() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Bulk ordering and quotes</p>
      </div>
    </div>
  );
}

function Div61() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span44 />
        </div>
      </div>
    </div>
  );
}

function MotionButton51() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div61 />
      </div>
    </div>
  );
}

function Span45() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">API and integrations</p>
      </div>
    </div>
  );
}

function Div62() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span45 />
        </div>
      </div>
    </div>
  );
}

function MotionButton52() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div62 />
      </div>
    </div>
  );
}

function Span46() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Custom invoicing and contracts</p>
      </div>
    </div>
  );
}

function Div63() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span46 />
        </div>
      </div>
    </div>
  );
}

function MotionButton53() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.337px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div63 />
      </div>
    </div>
  );
}

function Div60() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.337px]" data-name="div">
      <MotionButton51 />
      <MotionButton52 />
      <MotionButton53 />
    </div>
  );
}

function Span47() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight12() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv26() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.12px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight12 />
    </div>
  );
}

function MotionButton54() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span47 />
      <MotionDiv26 />
    </div>
  );
}

function MotionDiv25() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[381.33px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[1028.38px] w-[357.337px]" data-name="motion.div">
      <MotionButton50 />
      <Div60 />
      <MotionButton54 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g clipPath="url(#clip0_352_3877)" id="Icon">
          <path d={svgPaths.p3dc49580} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p30a14380} id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M1.5 9H16.5" id="Vector_3" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_352_3877">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[14px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon11 />
      </div>
    </div>
  );
}

function H13() {
  return (
    <div className="h-[23.913px] relative shrink-0 w-[133.575px]" data-name="h3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[23.92px] not-italic relative shrink-0 text-[#1d1d1f] text-[18.4px] tracking-[-0.368px]">Plans and pricing</p>
      </div>
    </div>
  );
}

function Div64() {
  return (
    <div className="content-stretch flex gap-[14px] h-[40px] items-center relative shrink-0 w-full" data-name="div">
      <Container14 />
      <H13 />
    </div>
  );
}

function MotionButton55() {
  return (
    <div className="absolute content-stretch flex flex-col h-[64px] items-start left-[32px] top-[32px] w-[293.325px]" data-name="motion.button">
      <Div64 />
    </div>
  );
}

function Span48() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Vehsl plans overview</p>
      </div>
    </div>
  );
}

function Div66() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span48 />
        </div>
      </div>
    </div>
  );
}

function MotionButton56() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div66 />
      </div>
    </div>
  );
}

function Span49() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Free vs. Pro vs. Enterprise</p>
      </div>
    </div>
  );
}

function Div67() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span49 />
        </div>
      </div>
    </div>
  );
}

function MotionButton57() {
  return (
    <div className="h-[42.438px] relative shrink-0 w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div67 />
      </div>
    </div>
  );
}

function Span50() {
  return (
    <div className="flex-[1_0_0] h-[22.438px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.44px] left-0 not-italic text-[#6e6e73] text-[14.96px] top-[-0.4px] tracking-[-0.1496px]">Upgrading or downgrading your plan</p>
      </div>
    </div>
  );
}

function Div68() {
  return (
    <div className="h-[42.438px] relative rounded-[14px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[12px] pr-[34px] relative size-full">
          <Span50 />
        </div>
      </div>
    </div>
  );
}

function MotionButton58() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[293.325px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div68 />
      </div>
    </div>
  );
}

function Div65() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[135.313px] items-start left-[32px] top-[96px] w-[293.325px]" data-name="div">
      <MotionButton56 />
      <MotionButton57 />
      <MotionButton58 />
    </div>
  );
}

function Span51() {
  return (
    <div className="absolute h-[21px] left-0 top-0 w-[108.125px]" data-name="span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[54px] not-italic text-[#6e6e73] text-[14px] text-center top-[-0.4px]">View all 4 articles</p>
    </div>
  );
}

function ChevronRight13() {
  return (
    <div className="h-[15px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8.75">
            <path d={svgPaths.p36e7aaa0} id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MotionDiv28() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[116.13px] size-[15px] top-[3px]" data-name="motion.div">
      <ChevronRight13 />
    </div>
  );
}

function MotionButton59() {
  return (
    <div className="absolute h-[21px] left-[32px] top-[261.71px] w-[131.125px]" data-name="motion.button">
      <Span51 />
      <MotionDiv28 />
    </div>
  );
}

function MotionDiv27() {
  return (
    <div className="absolute bg-white h-[311.313px] left-[762.66px] rounded-[28px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.02),0px_1px_4px_0px_rgba(0,0,0,0.01)] top-[1028.38px] w-[357.325px]" data-name="motion.div">
      <MotionButton55 />
      <Div65 />
      <MotionButton59 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[1339.688px] left-[29.6px] top-[127.2px] w-[1120px]" data-name="Container">
      <MotionDiv5 />
      <MotionDiv7 />
      <MotionDiv9 />
      <MotionDiv11 />
      <MotionDiv13 />
      <MotionDiv15 />
      <MotionDiv17 />
      <MotionDiv19 />
      <MotionDiv21 />
      <MotionDiv23 />
      <MotionDiv25 />
      <MotionDiv27 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[1578.888px] left-0 top-[924.55px] w-[1179.2px]" data-name="Container">
      <MotionDiv4 />
      <Container2 />
    </div>
  );
}

function H() {
  return (
    <div className="h-[48.4px] relative shrink-0 w-full" data-name="h1">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Bold',sans-serif] leading-[48.4px] left-[565.76px] not-italic text-[#1d1d1f] text-[44px] text-center top-[-0.4px] tracking-[-1.76px]">Support</p>
    </div>
  );
}

function MotionP() {
  return (
    <div className="h-[25.2px] relative shrink-0 w-full" data-name="motion.p">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[25.2px] left-[566.15px] not-italic text-[#86868b] text-[16.8px] text-center top-[0.4px] tracking-[-0.168px]">{`We're here for you. Always.`}</p>
    </div>
  );
}

function MotionDiv29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[85.6px] items-start left-[24px] top-[80px] w-[1131.2px]" data-name="motion.div">
      <H />
      <MotionP />
    </div>
  );
}

function Phone() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Phone">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_351_523)" id="Phone">
          <path d={svgPaths.p2a44c680} id="Vector" stroke="var(--stroke-0, #0071E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_351_523">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Span52() {
  return (
    <div className="h-[22.8px] relative shrink-0 w-[26.063px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[22.8px] left-[13.5px] not-italic text-[#0071e3] text-[15.2px] text-center top-[-1.4px]">Call</p>
      </div>
    </div>
  );
}

function Div69() {
  return (
    <div className="h-[54px] relative rounded-[26843500px] shrink-0 w-full" data-name="div">
      <div aria-hidden="true" className="absolute border-[#0071e3] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[10px] items-center pl-[33.6px] pr-[1.6px] py-[1.6px] relative size-full">
          <Phone />
          <Span52 />
        </div>
      </div>
    </div>
  );
}

function MotionButton60() {
  return (
    <div className="absolute content-stretch flex flex-col h-[54px] items-start left-[412.73px] top-0 w-[119.263px]" data-name="motion.button">
      <Div69 />
    </div>
  );
}

function MessageCircle() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="MessageCircle">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="MessageCircle">
          <path d={svgPaths.p1db90b80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Span53() {
  return (
    <div className="h-[22.8px] relative shrink-0 w-[64.475px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[22.8px] left-[32.5px] not-italic text-[15.2px] text-center text-white top-[-1.4px]">New chat</p>
      </div>
    </div>
  );
}

function Div70() {
  return (
    <div className="bg-[#0071e3] flex-[1_0_0] min-h-px min-w-px relative rounded-[26843500px] shadow-[0px_4px_16px_0px_rgba(0,113,227,0.25)] w-full" data-name="div">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[10px] items-center pl-[40px] relative size-full">
          <MessageCircle />
          <Span53 />
        </div>
      </div>
    </div>
  );
}

function MotionButton61() {
  return (
    <div className="absolute content-stretch flex flex-col h-[54px] items-start left-[547.99px] top-0 w-[170.475px]" data-name="motion.button">
      <Div70 />
    </div>
  );
}

function MotionDiv30() {
  return (
    <div className="absolute h-[54px] left-[24px] top-[507.6px] w-[1131.2px]" data-name="motion.div">
      <MotionButton60 />
      <MotionButton61 />
    </div>
  );
}

function Search() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Search">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Search">
          <path d={svgPaths.p126da180} id="Vector" stroke="var(--stroke-0, #0171E2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M15.75 15.75L12.525 12.525" id="Vector_2" stroke="var(--stroke-0, #0171E2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Input() {
  return (
    <div className="h-[25.2px] relative shrink-0 w-[518px]" data-name="input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#c7c7cc] text-[16.8px] tracking-[-0.168px]">fir</p>
      </div>
    </div>
  );
}

function X() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="X">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="X">
          <path d="M9 3L3 9" id="Vector" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 3L9 9" id="Vector_2" stroke="var(--stroke-0, #6E6E73)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function MotionButton62() {
  return (
    <div className="bg-[#e8e8ed] relative rounded-[26843500px] shrink-0 size-[24px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <X />
      </div>
    </div>
  );
}

function Div71() {
  return (
    <div className="h-[58px] relative shrink-0 w-full" data-name="div">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.04)] border-b-[0.8px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center pb-[0.8px] pl-[28px] relative size-full">
          <Search />
          <Input />
          <MotionButton62 />
        </div>
      </div>
    </div>
  );
}

function P5() {
  return (
    <div className="absolute h-[18px] left-0 top-0 w-[600px]" data-name="p">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[18px] left-[8px] not-italic text-[#86868b] text-[12px] top-[-0.4px] tracking-[0.36px] uppercase">Suggestions</p>
    </div>
  );
}

function Icon12() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p26265d80} id="Vector" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2bf2d100} id="Vector_2" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pd918280} id="Vector_3" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pcbc4a80} id="Vector_4" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Div73() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[10px] shrink-0 size-[32px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon12 />
      </div>
    </div>
  );
}

function P6() {
  return (
    <div className="absolute h-[18px] left-0 overflow-clip top-[25px] w-[506px]" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#c7c7cc] text-[12px] top-[-0.4px]">Getting started</p>
    </div>
  );
}

function Div74() {
  return (
    <div className="flex-[1_0_0] h-[43px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[0] left-0 not-italic text-[#1d1d1f] text-[0px] text-[14px] top-px">
          <span className="leading-[21px]">{`Placing your `}</span>
          <span className="font-['Urbanist:SemiBold',sans-serif] leading-[21px] text-[#0071e3]">fir</span>
          <span className="leading-[21px]">st order</span>
        </p>
        <P6 />
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="ArrowRight">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="ArrowRight">
          <path d="M2.91667 7H11.0833" id="Vector" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.pf23dd00} id="Vector_2" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function MotionButton63() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[67px] items-center left-0 px-[12px] rounded-[14px] top-[26px] w-[600px]" data-name="motion.button">
      <Div73 />
      <Div74 />
      <ArrowRight />
    </div>
  );
}

function Icon13() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p90824c0} id="Vector" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M12 11.3333V6" id="Vector_2" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8.66667 11.3333V3.33333" id="Vector_3" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M5.33333 11.3333V9.33333" id="Vector_4" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Div75() {
  return (
    <div className="bg-[#f5f5f7] relative rounded-[10px] shrink-0 size-[32px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon13 />
      </div>
    </div>
  );
}

function P7() {
  return (
    <div className="absolute h-[18px] left-0 overflow-clip top-[25px] w-[506px]" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#c7c7cc] text-[12px] top-[-0.4px]">Selling on Vehsl</p>
    </div>
  );
}

function Div76() {
  return (
    <div className="flex-[1_0_0] h-[43px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[0] left-0 not-italic text-[#1d1d1f] text-[0px] text-[14px] top-px">
          <span className="leading-[21px]">{`Listing your `}</span>
          <span className="font-['Urbanist:SemiBold',sans-serif] leading-[21px] text-[#0071e3]">fir</span>
          <span className="leading-[21px]">st product</span>
        </p>
        <P7 />
      </div>
    </div>
  );
}

function ArrowRight1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="ArrowRight">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="ArrowRight">
          <path d="M2.91667 7H11.0833" id="Vector" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.pf23dd00} id="Vector_2" stroke="var(--stroke-0, #C7C7CC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function MotionButton64() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[67px] items-center left-0 px-[12px] rounded-[14px] top-[93px] w-[600px]" data-name="motion.button">
      <Div75 />
      <Div76 />
      <ArrowRight1 />
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[160px] relative shrink-0 w-full" data-name="Container">
      <P5 />
      <MotionButton63 />
      <MotionButton64 />
    </div>
  );
}

function Div72() {
  return (
    <div className="h-[188px] relative shrink-0 w-full" data-name="div">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pt-[12px] px-[20px] relative size-full">
          <Container17 />
        </div>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col h-[188px] items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <Div72 />
    </div>
  );
}

function MotionDiv31() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[246px] items-start left-[269.6px] overflow-clip rounded-[24px] shadow-[0px_12px_60px_0px_rgba(0,0,0,0.08),0px_4px_20px_0px_rgba(0,0,0,0.04)] top-[221.6px] w-[640px]" data-name="motion.div">
      <Div71 />
      <Container16 />
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute h-[633.6px] left-0 top-0 w-[1179.2px]" data-name="Container">
      <MotionDiv29 />
      <MotionDiv30 />
      <MotionDiv31 />
    </div>
  );
}

function Div() {
  return (
    <div className="bg-gradient-to-b from-[#f5f5f7] h-[2503.438px] overflow-clip relative shrink-0 to-[#f5f5f7] via-[#fafafa] via-[40%] w-full" data-name="div">
      <MotionDiv />
      <Container1 />
      <Container15 />
    </div>
  );
}

export default function Typing() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Typing">
      <Div />
    </div>
  );
}