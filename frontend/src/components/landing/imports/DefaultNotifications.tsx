"use client";

import svgPaths from "./svg-5rc9ujs929";

function P() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="p">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[18.75px] not-italic relative shrink-0 text-[#1d1d1f] text-[15px] whitespace-nowrap">Good morning, Noah</p>
    </div>
  );
}

function Div() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="div">
      <P />
    </div>
  );
}

function MotionSpan() {
  return (
    <div className="absolute border-[rgba(0,0,0,0)] border-b-[0.8px] border-solid h-[21.725px] left-[161.4px] top-0 w-[57.112px]" data-name="motion.span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[20.925px] left-[29px] not-italic text-[#34c759] text-[13.5px] text-center top-[0.4px] whitespace-nowrap">Thursday</p>
    </div>
  );
}

function MotionSpan1() {
  return (
    <div className="absolute border-[rgba(0,0,0,0)] border-b-[0.8px] border-solid h-[21.725px] left-[36.63px] top-[21.73px] w-[74.55px]" data-name="motion.span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[20.925px] left-[37.5px] not-italic text-[#0071e3] text-[13.5px] text-center top-[0.4px] whitespace-nowrap">Priya replied</p>
    </div>
  );
}

function MotionSpan2() {
  return (
    <div className="absolute border-[rgba(0,0,0,0)] border-b-[0.8px] border-solid h-[21.725px] left-[196.39px] top-[21.73px] w-[22.938px]" data-name="motion.span">
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[20.925px] left-[11.5px] not-italic text-[#ff9500] text-[13.5px] text-center top-[0.4px] whitespace-nowrap">$24</p>
    </div>
  );
}

function P1() {
  return (
    <div className="h-[43.45px] relative shrink-0 w-full" data-name="p">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[20.925px] left-[99.95px] not-italic text-[#86868b] text-[13.5px] text-center top-[0.4px] whitespace-nowrap">{`Your sweater arrives `}</p>
      <MotionSpan />
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[20.925px] left-[220.01px] not-italic text-[#86868b] text-[13.5px] text-center top-[0.4px] whitespace-nowrap">{`. `}</p>
      <MotionSpan1 />
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[20.925px] left-[154.17px] not-italic text-[#86868b] text-[13.5px] text-center top-[22.13px] whitespace-nowrap">{`. You’re saving `}</p>
      <MotionSpan2 />
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[20.925px] left-[220.83px] not-italic text-[#86868b] text-[13.5px] text-center top-[22.13px] whitespace-nowrap">.</p>
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="relative size-[11px]" data-name="ChevronRight">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="ChevronRight">
          <path d={svgPaths.p1a78e480} id="Vector" stroke="var(--stroke-0, #0071E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.14583" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[24.5px] relative rounded-[8px] shrink-0 w-[105.875px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[16.5px] left-[45.5px] not-italic text-[#0071e3] text-[11px] text-center top-[3.6px] whitespace-nowrap">See all updates</p>
        <div className="absolute flex items-center justify-center left-[86.88px] size-[11px] top-[6.75px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
          <div className="flex-none rotate-90">
            <ChevronRight />
          </div>
        </div>
      </div>
    </div>
  );
}

function MotionDiv() {
  return (
    <div className="h-[24.5px] relative shrink-0 w-full" data-name="motion.div">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center relative size-full">
          <Button />
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <P1 />
      <MotionDiv />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-[258.4px]">
      <Div />
      <Frame />
    </div>
  );
}

function Container1() {
  return <div className="bg-[rgba(0,0,0,0.04)] h-px rounded-[26843500px] shrink-0 w-[258.4px]" data-name="Container" />;
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_42158_371)" id="svg">
          <path d={svgPaths.p2cb9d600} id="Vector" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.01587" />
          <path d={svgPaths.p39c43f00} id="Vector_2" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.491005" />
          <path d={svgPaths.p1ecccc00} id="Vector_3" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.491005" />
          <path d={svgPaths.p32c299c0} id="Vector_4" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.491005" />
        </g>
        <defs>
          <clipPath id="clip0_42158_371">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div1() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg />
      </div>
    </div>
  );
}

function Span() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">My orders</p>
      </div>
    </div>
  );
}

function Svg1() {
  return (
    <div className="h-[11.2px] relative shrink-0 w-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 11.2">
        <g clipPath="url(#clip0_42158_367)" id="svg">
          <path d={svgPaths.p27bfe800} fill="var(--fill-0, #99999A)" id="Vector" />
          <path d={svgPaths.p25924900} id="Vector_2" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19573" />
        </g>
        <defs>
          <clipPath id="clip0_42158_367">
            <rect fill="white" height="11.2" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div2() {
  return (
    <div className="h-[11.2px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg1 />
      </div>
    </div>
  );
}

function Span1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">Messages</p>
      </div>
    </div>
  );
}

function Svg2() {
  return (
    <div className="h-[14.075px] relative shrink-0 w-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 14.075">
        <g clipPath="url(#clip0_42158_357)" id="svg">
          <path d={svgPaths.p2dff8700} id="Vector" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.11628" />
        </g>
        <defs>
          <clipPath id="clip0_42158_357">
            <rect fill="white" height="14.075" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div3() {
  return (
    <div className="h-[14.075px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg2 />
      </div>
    </div>
  );
}

function Span2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">Wishlist</p>
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_42158_360)" id="svg">
          <path d={svgPaths.p1676c780} id="Vector" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.07865" />
          <path d={svgPaths.p14ea4680} fill="var(--fill-0, #99999A)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_42158_360">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div4() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg3 />
      </div>
    </div>
  );
}

function Span3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">Become seller</p>
      </div>
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_42158_353)" id="svg">
          <path d={svgPaths.p3d461180} id="Vector" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.11628" />
          <path d={svgPaths.p9a9f200} id="Vector_2" stroke="var(--stroke-0, #99999A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.11628" />
        </g>
        <defs>
          <clipPath id="clip0_42158_353">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div5() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg4 />
      </div>
    </div>
  );
}

function Span4() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">Settings</p>
      </div>
    </div>
  );
}

function Svg5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_42158_339)" id="svg">
          <path d={svgPaths.p251df00} id="Vector" stroke="var(--stroke-0, #99999A)" strokeMiterlimit="10" strokeWidth="1.11628" />
          <path d={svgPaths.p28bfdb80} id="Vector_2" stroke="var(--stroke-0, #99999A)" strokeMiterlimit="10" strokeWidth="1.11628" />
          <path d={svgPaths.p1615e700} fill="var(--fill-0, #99999A)" id="Vector_3" />
          <path d={svgPaths.p1c7ed620} id="Vector_4" stroke="var(--stroke-0, #99999A)" strokeMiterlimit="10" strokeWidth="1.11628" />
          <path d={svgPaths.p3c107940} fill="var(--fill-0, #99999A)" id="Vector_5" />
          <path d={svgPaths.p2830b7f0} fill="var(--fill-0, #99999A)" id="Vector_6" />
          <path d={svgPaths.p16ebe880} id="Vector_7" stroke="var(--stroke-0, #99999A)" strokeMiterlimit="10" strokeWidth="1.11628" />
          <path d={svgPaths.p216af080} fill="var(--fill-0, #99999A)" id="Vector_8" />
        </g>
        <defs>
          <clipPath id="clip0_42158_339">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div6() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg5 />
      </div>
    </div>
  );
}

function Span5() {
  return (
    <div className="relative shrink-0 w-[200.4px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative w-full">
        <p className="font-['Nunito:Medium',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(29,29,31,0.8)] whitespace-nowrap">Help</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col h-[270px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="My orders">
        <Div1 />
        <Span />
      </div>
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="Messages button">
        <Div2 />
        <Span1 />
      </div>
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="Wishlist button">
        <Div3 />
        <Span2 />
      </div>
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="Become Seller">
        <Div4 />
        <Span3 />
      </div>
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="Settings button">
        <Div5 />
        <Span4 />
      </div>
      <div className="content-stretch flex gap-[14px] h-[45px] items-center px-[12px] relative rounded-[20px] shrink-0" data-name="Help notification button">
        <Div6 />
        <Span5 />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Container3() {
  return <div className="bg-[rgba(0,0,0,0.04)] h-px rounded-[26843500px] shrink-0 w-[258.4px]" data-name="Container" />;
}

function Svg6() {
  return (
    <div className="h-[16.25px] relative shrink-0 w-[13px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16.25">
        <g clipPath="url(#clip0_42158_335)" id="svg">
          <path d={svgPaths.p29f8f780} id="Vector" stroke="var(--stroke-0, #FF3B30)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.73" strokeWidth="1.43945" />
          <path d={svgPaths.p393e74b8} id="Vector_2" stroke="var(--stroke-0, #FF3B30)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.73" strokeWidth="1.43945" />
        </g>
        <defs>
          <clipPath id="clip0_42158_335">
            <rect fill="white" height="16.25" width="13" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div7() {
  return (
    <div className="h-[16.25px] relative shrink-0 w-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg6 />
      </div>
    </div>
  );
}

function Span6() {
  return (
    <div className="relative shrink-0" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[14px] text-[rgba(255,59,48,0.73)] whitespace-nowrap">Sign Out</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-[258.4px]">
      <Frame2 />
      <Container3 />
      <div className="content-stretch flex gap-[14px] h-[45px] items-center pl-[12px] relative rounded-[20px] shrink-0 w-[258.4px]" data-name="Sign out">
        <Div7 />
        <Span6 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[20px] relative w-full">
        <Frame1 />
        <Frame3 />
      </div>
    </div>
  );
}

export default function DefaultNotifications() {
  return (
    <div className="backdrop-blur-[4px] bg-[rgba(255,255,255,0.8)] content-stretch flex flex-col items-start overflow-clip p-[0.8px] relative rounded-[38px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.03),0px_2px_4px_0px_rgba(0,0,0,0.02),0px_12px_32px_-8px_rgba(0,0,0,0.08),0px_40px_80px_-24px_rgba(0,0,0,0.12)] size-full" data-name="Default notifications">
      <Container />
    </div>
  );
}