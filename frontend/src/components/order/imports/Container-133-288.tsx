"use client";

import svgPaths from "./svg-v5nteu4twa";

function Icon() {
  return (
    <div className="absolute left-0 size-[16px] top-[2.5px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p203476e0} id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M12.6667 8H3.33333" id="Vector_2" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[21px] relative shrink-0 w-[50.75px]" data-name="Button">
      <Icon />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[36px] not-italic text-[#0171e3] text-[14px] text-center top-[-0.4px] tracking-[-0.35px]">Back</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[31.988px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Urbanist:Bold',sans-serif] leading-[32px] left-0 not-italic text-[#18191a] text-[24px] top-[-0.2px] w-[376px] whitespace-pre-wrap">Select Location</p>
    </div>
  );
}

function HelpQuestionMark() {
  return (
    <div className="relative shrink-0 size-[14.4px]" data-name="Help Question mark">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.4 14.4">
        <g clipPath="url(#clip0_133_322)" id="Help Question mark">
          <g id="box" />
          <path clipRule="evenodd" d={svgPaths.p12075b00} fillRule="evenodd" id="circle" stroke="var(--stroke-0, #0171E3)" strokeLinejoin="round" strokeWidth="0.9" />
          <path d={svgPaths.p1ae83c0} id="question" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
          <path clipRule="evenodd" d={svgPaths.p36851d00} fill="var(--fill-0, #0171E3)" fillRule="evenodd" id="dot" />
        </g>
        <defs>
          <clipPath id="clip0_133_322">
            <rect fill="white" height="14.4" width="14.4" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function NeedHelp() {
  return (
    <div className="bg-[rgba(1,113,227,0.2)] content-stretch flex items-center p-[4.8px] relative rounded-[30px] shrink-0" data-name="Need help?">
      <HelpQuestionMark />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-center left-0 top-0">
      <p className="font-['Urbanist:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#4a5565] text-[16px] w-[168px] whitespace-pre-wrap">{`Find storage near you `}</p>
      <NeedHelp />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <Frame2 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[59.987px] items-start relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Paragraph />
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-start pt-[32px] px-[32px] relative w-full">
        <Button />
        <Container2 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.pcddfd00} id="Vector" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M17.5 17.5L13.9167 13.9167" id="Vector_2" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[279px]">
      <Icon1 />
      <p className="font-['Urbanist:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#abafb2] text-[16px] w-[221px] whitespace-pre-wrap">Search city, warehouse, or zip...</p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M17.5 3.33333H11.6667" id="Vector" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M8.33333 3.33333H2.5" id="Vector_2" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M17.5 10H10" id="Vector_3" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M6.66667 10H2.5" id="Vector_4" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M17.5 16.6667H13.3333" id="Vector_5" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 16.6667H2.5" id="Vector_6" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M11.6667 1.66667V5" id="Vector_7" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M6.66667 8.33333V11.6667" id="Vector_8" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M13.3333 15V18.3333" id="Vector_9" stroke="var(--stroke-0, #ABAFB2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white h-[40px] relative rounded-[72.025px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#0171e3] border-solid inset-0 pointer-events-none rounded-[72.025px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[11.524px] py-[8.643px] relative size-full">
          <Frame3 />
          <Icon2 />
        </div>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#18191a] text-[18px]">Greenstore G1 warehouse</p>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">1.2 miles away</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading1 />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#18191a] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$35</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container5 />
      <Frame4 />
    </div>
  );
}

function NeedHelp1() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp1 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">A</p>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[12.49%_8.32%_12.49%_8.34%]" data-name="Group">
      <div className="absolute inset-[-5.55%_-5%_-5.52%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.77775 8.88909">
          <g id="Group">
            <path d={svgPaths.p35d50e80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3d8ef830} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2cac6a80} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.peffb980} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p274dd000} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3a1cdf80} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p6ad380} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2f8283c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3c915840} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p251dd600} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p934d300} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p39d6a380} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Group />
      </div>
    </div>
  );
}

function FeatureIcon() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[15.33px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon3 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_328)" id="Icon">
          <path d={svgPaths.p473e300} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_328">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon1() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[34px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon4 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_292)" id="Icon">
          <path d={svgPaths.p15074b00} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d={svgPaths.p62cab80} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d="M5.33268 9.77645V5.33203" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_292">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon2() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[52.67px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon />
        <FeatureIcon1 />
        <FeatureIcon2 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame6 />
      <Container7 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard />
        <Container6 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex items-center p-[20px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <Frame9 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#0171e3] text-[18px]">James ZS warehouse</p>
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">4 miles away</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading2 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#0171e3] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$45</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard1() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container9 />
      <Frame5 />
    </div>
  );
}

function NeedHelp2() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] h-[32px] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp2 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">A+</p>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#0171e3] h-[32px] relative rounded-[18px] shadow-[0px_8px_16px_0px_rgba(1,113,227,0.4)] shrink-0 w-[159px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-center px-[24px] relative size-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[21.352px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white w-[59px]">
          <p className="leading-[24px] whitespace-pre-wrap">Confirm</p>
        </div>
        <div className="h-[13.454px] relative shrink-0 w-[17.143px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1427 13.4541">
            <path d={svgPaths.p382d1880} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[14.222px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.2222 14.2222">
        <g id="Icon">
          <path d={svgPaths.p1e994000} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p22c69b40} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p3335d040} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p3047fbc0} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p155d5d80} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p3b181900} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p1e002b00} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p39e7e6c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p3be8de80} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p3bed0320} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p115d900} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p88a2000} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </g>
      </svg>
    </div>
  );
}

function FeatureIcon3() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[-4.89px] rounded-[23860892px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.889px_2.667px_0px_rgba(0,0,0,0.1),0px_0.889px_1.778px_0px_rgba(0,0,0,0.1)] size-[32px] top-[2px]" data-name="FeatureIcon">
      <Icon6 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[14.222px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.2222 14.2222">
        <g id="Icon">
          <path d={svgPaths.p11a96a80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </g>
      </svg>
    </div>
  );
}

function FeatureIcon4() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[20px] rounded-[23860892px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.889px_2.667px_0px_rgba(0,0,0,0.1),0px_0.889px_1.778px_0px_rgba(0,0,0,0.1)] size-[32px] top-[2px]" data-name="FeatureIcon">
      <Icon7 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative shrink-0 size-[14.222px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.2222 14.2222">
        <g id="Icon">
          <path d={svgPaths.p2ab85400} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d={svgPaths.p17835680} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
          <path d="M7.11003 13.0353V7.10938" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.18519" />
        </g>
      </svg>
    </div>
  );
}

function FeatureIcon5() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[44.89px] rounded-[23860892px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.889px_2.667px_0px_rgba(0,0,0,0.1),0px_0.889px_1.778px_0px_rgba(0,0,0,0.1)] size-[32px] top-[2px]" data-name="FeatureIcon">
      <Icon8 />
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon3 />
        <FeatureIcon4 />
        <FeatureIcon5 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame7 />
      <Button1 />
      <Container11 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard1 />
        <Container10 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[#f5faff] content-stretch flex h-[133px] items-end justify-center p-[21px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#0171e3] border-solid inset-0 pointer-events-none rounded-[25px]" />
      <Frame12 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#18191a] text-[18px]">Jack Rock warehouse</p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">7 miles away</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading3 />
        <Paragraph3 />
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#18191a] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$50</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard2() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container13 />
      <Frame8 />
    </div>
  );
}

function NeedHelp3() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp3 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">B</p>
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[12.49%_8.32%_12.49%_8.34%]" data-name="Group">
      <div className="absolute inset-[-5.55%_-5%_-5.52%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.77775 8.88909">
          <g id="Group">
            <path d={svgPaths.p35d50e80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3d8ef830} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2cac6a80} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.peffb980} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p274dd000} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3a1cdf80} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p6ad380} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2f8283c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3c915840} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p251dd600} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p934d300} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p39d6a380} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon9() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Group1 />
      </div>
    </div>
  );
}

function FeatureIcon6() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[15.33px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon9 />
    </div>
  );
}

function Icon10() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_328)" id="Icon">
          <path d={svgPaths.p473e300} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_328">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon7() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[34px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon10 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_292)" id="Icon">
          <path d={svgPaths.p15074b00} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d={svgPaths.p62cab80} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d="M5.33268 9.77645V5.33203" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_292">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon8() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[52.67px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon11 />
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon6 />
        <FeatureIcon7 />
        <FeatureIcon8 />
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame14 />
      <Container15 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard2 />
        <Container14 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex items-center p-[20px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <Frame13 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#18191a] text-[18px]">Junaid Logistics Center</p>
      </div>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">10 miles away</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading4 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#18191a] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$55</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard3() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container17 />
      <Frame16 />
    </div>
  );
}

function NeedHelp4() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp4 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">A++</p>
        </div>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_8.32%_12.49%_8.34%]" data-name="Group">
      <div className="absolute inset-[-5.55%_-5%_-5.52%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.77775 8.88909">
          <g id="Group">
            <path d={svgPaths.p35d50e80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3d8ef830} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2cac6a80} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.peffb980} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p274dd000} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3a1cdf80} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p6ad380} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2f8283c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3c915840} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p251dd600} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p934d300} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p39d6a380} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon12() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Group2 />
      </div>
    </div>
  );
}

function FeatureIcon9() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[15.33px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon12 />
    </div>
  );
}

function Icon13() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_328)" id="Icon">
          <path d={svgPaths.p473e300} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_328">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon10() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[34px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon13 />
    </div>
  );
}

function Icon14() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_292)" id="Icon">
          <path d={svgPaths.p15074b00} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d={svgPaths.p62cab80} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d="M5.33268 9.77645V5.33203" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_292">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon11() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[52.67px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon14 />
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon9 />
        <FeatureIcon10 />
        <FeatureIcon11 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame17 />
      <Container19 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard3 />
        <Container18 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex items-center p-[20px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <Frame15 />
    </div>
  );
}

function Heading5() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#18191a] text-[18px]">Nordic Supply Depot</p>
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">10 miles away</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading5 />
        <Paragraph5 />
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#18191a] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$55</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard4() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container21 />
      <Frame19 />
    </div>
  );
}

function NeedHelp5() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp5 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">A-</p>
        </div>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[12.49%_8.32%_12.49%_8.34%]" data-name="Group">
      <div className="absolute inset-[-5.55%_-5%_-5.52%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.77775 8.88909">
          <g id="Group">
            <path d={svgPaths.p35d50e80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3d8ef830} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2cac6a80} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.peffb980} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p274dd000} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3a1cdf80} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p6ad380} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2f8283c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3c915840} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p251dd600} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p934d300} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p39d6a380} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon15() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Group3 />
      </div>
    </div>
  );
}

function FeatureIcon12() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[15.33px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon15 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_328)" id="Icon">
          <path d={svgPaths.p473e300} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_328">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon13() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[34px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon16 />
    </div>
  );
}

function Icon17() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_292)" id="Icon">
          <path d={svgPaths.p15074b00} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d={svgPaths.p62cab80} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d="M5.33268 9.77645V5.33203" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_292">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon14() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[52.67px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon17 />
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon12 />
        <FeatureIcon13 />
        <FeatureIcon14 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame20 />
      <Container23 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard4 />
        <Container22 />
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex items-center p-[20px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <Frame18 />
    </div>
  );
}

function Heading6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[202.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[22.5px] not-italic relative shrink-0 text-[#18191a] text-[18px]">Scandinavian Goods Warehouse</p>
      </div>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[21px] relative shrink-0 w-[202.738px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#7a7d80] text-[14px] top-[-0.4px] tracking-[0.35px]">10 miles away</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="h-[49.5px] relative shrink-0 w-[202.738px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Heading6 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="relative shrink-0 w-[67px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end not-italic py-[2px] relative tracking-[-0.4px] w-full">
        <div className="flex flex-col font-['Urbanist:Bold',sans-serif] h-[17.688px] justify-center leading-[0] relative shrink-0 text-[#18191a] text-[16px] text-right w-[35.111px]">
          <p className="leading-[24px] whitespace-pre-wrap">$55</p>
        </div>
        <p className="font-['Urbanist:Medium',sans-serif] h-[13px] leading-[18px] relative shrink-0 text-[#939699] text-[12px] w-[32px] whitespace-pre-wrap">/week</p>
      </div>
    </div>
  );
}

function WarehouseCard5() {
  return (
    <div className="content-stretch flex h-[49px] items-start justify-between relative shrink-0 w-full" data-name="WarehouseCard">
      <Container25 />
      <Frame22 />
    </div>
  );
}

function NeedHelp6() {
  return (
    <div className="h-[21.042px] relative shrink-0 w-[21.6px]" data-name="Need help?">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6 21.0422">
        <g id="Need help?">
          <rect fill="var(--fill-0, #0171E3)" fillOpacity="0.1" height="21.0422" rx="10.5211" width="21.6" />
          <path d={svgPaths.p87a2900} fill="var(--fill-0, #0171E3)" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.19989" />
        </g>
      </svg>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-[rgba(1,113,227,0.1)] relative rounded-[60px] shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[4px] pr-[8px] py-[4px] relative">
        <NeedHelp6 />
        <div className="flex flex-col font-['Nunito:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0171e3] text-[14px] whitespace-nowrap">
          <p className="leading-[18px]">B</p>
        </div>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[12.49%_8.32%_12.49%_8.34%]" data-name="Group">
      <div className="absolute inset-[-5.55%_-5%_-5.52%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.77775 8.88909">
          <g id="Group">
            <path d={svgPaths.p35d50e80} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3d8ef830} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2cac6a80} id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.peffb980} id="Vector_4" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p274dd000} id="Vector_5" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3a1cdf80} id="Vector_6" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p6ad380} id="Vector_7" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p2f8283c0} id="Vector_8" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p3c915840} id="Vector_9" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p251dd600} id="Vector_10" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p934d300} id="Vector_11" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
            <path d={svgPaths.p39d6a380} id="Vector_12" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon18() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Group4 />
      </div>
    </div>
  );
}

function FeatureIcon15() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[15.33px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon18 />
    </div>
  );
}

function Icon19() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_328)" id="Icon">
          <path d={svgPaths.p473e300} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_328">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon16() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[34px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon19 />
    </div>
  );
}

function Icon20() {
  return (
    <div className="relative shrink-0 size-[10.667px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
        <g clipPath="url(#clip0_133_292)" id="Icon">
          <path d={svgPaths.p15074b00} id="Vector" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d={svgPaths.p62cab80} id="Vector_2" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
          <path d="M5.33268 9.77645V5.33203" id="Vector_3" stroke="var(--stroke-0, #626466)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.888891" />
        </g>
        <defs>
          <clipPath id="clip0_133_292">
            <rect fill="white" height="10.6667" width="10.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FeatureIcon17() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[52.67px] rounded-[17895668px] shadow-[0px_0px_0px_0px_#f3f4f6,0px_0.667px_2px_0px_rgba(0,0,0,0.1),0px_0.667px_1.333px_0px_rgba(0,0,0,0.1)] size-[24px] top-[6px]" data-name="FeatureIcon">
      <Icon20 />
    </div>
  );
}

function Container27() {
  return (
    <div className="h-[36px] relative shrink-0 w-[78px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FeatureIcon15 />
        <FeatureIcon16 />
        <FeatureIcon17 />
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Frame23 />
      <Container27 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start justify-center relative w-full">
        <WarehouseCard5 />
        <Container26 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex items-center p-[20px] relative rounded-[25px] shrink-0 w-[378px]" data-name="Container">
      <Frame21 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <Frame1 />
      <Container4 />
      <Container8 />
      <Container12 />
      <Container16 />
      <Container20 />
      <Container24 />
    </div>
  );
}

function Frame() {
  return (
    <div className="h-[231px] relative shrink-0 w-[6px]" data-name="Frame">
      <div className="-translate-x-1/2 absolute bg-[rgba(0,0,0,0.15)] bottom-[86.21%] left-1/2 rounded-[1000px] top-0 w-[6px]" data-name="Thumb" />
    </div>
  );
}

function ScrollbarVertical() {
  return (
    <div className="content-stretch flex items-center overflow-clip pb-[3px] pt-[64px] px-[3px] relative shrink-0" data-name="Scrollbar - Vertical">
      <Frame />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-center relative shrink-0">
      <Frame10 />
      <ScrollbarVertical />
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-white h-[683px] relative shrink-0 w-[442px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center overflow-clip pb-[32px] pl-[32px] pr-[10px] pt-[24px] relative rounded-[inherit] size-full">
        <Frame11 />
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[32px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Container">
      <Container1 />
      <Container3 />
    </div>
  );
}