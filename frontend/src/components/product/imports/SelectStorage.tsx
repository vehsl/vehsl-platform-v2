"use client";

import svgPaths from "./svg-rh9151het1";
import { imgGroup } from "./svg-56amt";

function Container1() {
  return <div className="absolute bg-gradient-to-b from-[#edf2f7] h-[1287px] left-0 to-[#e8eff8] top-0 via-1/2 via-[#f0f4fa] w-[1151px]" data-name="Container" />;
}

function Container2() {
  return <div className="absolute h-[553px] left-[563px] rounded-[26843500px] top-0 w-[588px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 588 553\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -39.103 -41.578 0 294 276.5)\\'><stop stop-color=\\'rgba(1,113,227,0.1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.7\\'/></radialGradient></defs></svg>')" }} />;
}

function Container3() {
  return <div className="absolute h-[463px] left-0 rounded-[26843500px] top-[267px] w-[365px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 365 463\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -32.739 -25.809 0 182.5 231.5)\\'><stop stop-color=\\'rgba(52,141,233,0.1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.7\\'/></radialGradient></defs></svg>')" }} />;
}

function Container4() {
  return <div className="absolute left-[693px] rounded-[26843500px] size-[525px] top-[87px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 525 525\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -37.123 -37.123 0 262.5 262.5)\\'><stop stop-color=\\'rgba(153,198,244,0.12)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(77,99,122,0.06)\\' offset=\\'0.35\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.7\\'/></radialGradient></defs></svg>')" }} />;
}

function Container() {
  return (
    <div className="absolute h-[1162px] left-0 overflow-clip top-0 w-[1151px]" data-name="Container">
      <Container1 />
      <Container2 />
      <Container3 />
      <Container4 />
    </div>
  );
}

function Container5() {
  return <div className="bg-[#0171e3] flex-[1_0_0] min-h-px min-w-px opacity-80 rounded-[26843500px] w-[4px]" data-name="Container" />;
}

function Container6() {
  return <div className="bg-[#0171e3] h-[6px] opacity-15 rounded-[26843500px] shrink-0 w-[4px]" data-name="Container" />;
}

function Container7() {
  return <div className="bg-[#0171e3] h-[6px] opacity-15 rounded-[26843500px] shrink-0 w-[4px]" data-name="Container" />;
}

function Container8() {
  return <div className="bg-[#0171e3] h-[6px] opacity-15 rounded-[26843500px] shrink-0 w-[4px]" data-name="Container" />;
}

function Container9() {
  return <div className="bg-[#0171e3] h-[6px] opacity-15 rounded-[26843500px] shrink-0 w-[4px]" data-name="Container" />;
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p203476e0} id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
          <path d="M12.6667 8H3.33333" id="Vector_2" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[21px] left-[14px] not-italic text-[#0171e3] text-[14px] text-center top-[-0.4px] tracking-[-0.35px] whitespace-nowrap">Back</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[21px] relative shrink-0 w-[50.75px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Icon />
        <Text />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[32px] relative shrink-0 w-[412px]" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="flex-[1_0_0] font-['Urbanist:Black',sans-serif] leading-[32px] min-h-px min-w-px not-italic relative text-[#002d5b] text-[26px] tracking-[-0.65px]">Select Location</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute h-[20px] left-0 top-0 w-[7.838px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[20px] left-0 not-italic text-[14px] text-[rgba(0,45,91,0.35)] top-[-0.4px] whitespace-nowrap">5</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[20px] left-0 top-[2.2px] w-[113.275px]" data-name="Paragraph">
      <Text1 />
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[20px] left-[7.84px] not-italic text-[14px] text-[rgba(0,45,91,0.35)] top-[-0.4px] whitespace-nowrap">{` options near you`}</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[8.35%_8.34%_8.31%_8.32%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.195px_-1.203px] mask-size-[14.4px_14.4px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <div className="absolute inset-[-3.75%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.9 12.9">
          <g id="Group">
            <path clipRule="evenodd" d={svgPaths.pe06ec80} fillRule="evenodd" id="Vector" stroke="var(--stroke-0, #0171E3)" strokeLinejoin="round" strokeOpacity="0.6" strokeWidth="0.9" />
            <path d={svgPaths.p7d88e80} id="Vector_2" stroke="var(--stroke-0, #0171E3)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" strokeWidth="0.9" />
            <path clipRule="evenodd" d={svgPaths.p1a1d5a80} fill="var(--fill-0, #0171E3)" fillOpacity="0.6" fillRule="evenodd" id="Vector_3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-0" data-name="Clip path group">
      <Group />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[14.4px]" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <ClipPathGroup />
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute bg-[rgba(1,113,227,0.08)] content-stretch flex items-center justify-center left-[123.27px] rounded-[26843500px] size-[24.4px] top-0" data-name="Container">
      <Icon1 />
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[24.4px] relative shrink-0 w-[412px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Paragraph />
        <Container14 />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[14px] relative shrink-0 w-[57.688px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.22)] whitespace-nowrap">Features for</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="bg-[rgba(1,113,227,0.06)] h-[21.6px] relative rounded-[26843500px] shrink-0 w-[74.125px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,113,227,0.1)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] left-[calc(50%-26.5px)] not-italic text-[11px] text-[rgba(1,113,227,0.6)] top-1/2 whitespace-nowrap">
          <p className="leading-[14px]">Electronics</p>
        </div>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[21.6px] relative shrink-0 w-[412px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Text2 />
        <Text3 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[94px] relative shrink-0 w-[412px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7px] items-start relative size-full">
        <Heading />
        <Container13 />
        <Container15 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[18px] h-[165px] items-start left-0 pl-[24px] pt-[32px] top-0 w-[460px]" data-name="Container">
      <Button />
      <Container12 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%_20.83%_20.83%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.5 13.5">
            <path d={svgPaths.p3cc22e00} id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[69.58%_12.5%_12.5%_69.58%]" data-name="Vector">
        <div className="absolute inset-[-23.26%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.72497 4.72497">
            <path d={svgPaths.p3d640e40} id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function TextInput() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="Text Input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">Search by name, address, or zip...</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[16.67%_12.5%_83.33%_58.33%]" data-name="Vector">
        <div className="absolute inset-[-0.75px_-14.29%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.74997 1.5">
            <path d="M5.99997 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[16.67%_58.33%_83.33%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-0.75px_-14.29%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.75 1.5">
            <path d="M6 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-1/2 right-[12.5%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-0.75px_-11.11%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.25 1.5">
            <path d="M7.5 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[12.5%] right-[66.67%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-0.75px_-20%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.25001 1.5">
            <path d="M4.5 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[83.33%_12.5%_16.67%_66.67%]" data-name="Vector">
        <div className="absolute inset-[-0.75px_-20%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.25003 1.5">
            <path d="M4.50003 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[16.67%] left-[12.5%] right-1/2 top-[83.33%]" data-name="Vector">
        <div className="absolute inset-[-0.75px_-11.11%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.25 1.5">
            <path d="M7.5 0.750001H0.750001" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3/4 left-[58.33%] right-[41.67%] top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.75px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 4.5">
            <path d="M0.750001 0.750001V3.75" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%_66.67%_41.67%_33.33%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.75px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 4.50004">
            <path d="M0.750001 0.750001V3.75003" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[8.33%] left-[66.67%] right-[33.33%] top-3/4" data-name="Vector">
        <div className="absolute inset-[-25%_-0.75px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 4.49997">
            <path d="M0.750001 0.750001V3.74997" id="Vector" stroke="var(--stroke-0, #C4CFDA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon3 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.5)] content-stretch flex gap-[10px] h-[46px] items-center left-[24px] px-[16.8px] py-[0.8px] rounded-[3000px] top-[181px] w-[412px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.6)] border-solid inset-0 pointer-events-none rounded-[3000px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.03)]" />
      <Text4 />
      <TextInput />
      <Text5 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(255,255,255,0.4)]" />
    </div>
  );
}

function Text6() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[13px] text-center text-white whitespace-nowrap">All</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#348de9] h-[31.6px] relative rounded-[26843500px] shrink-0 w-[48.513px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[26843500px] shadow-[0px_4px_16px_0px_rgba(1,113,227,0.15)]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.8px] pt-[7.8px] px-[16.8px] relative size-full">
        <Text6 />
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(255,255,255,0.08)]" />
    </div>
  );
}

function Text7() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[13px] text-[rgba(0,45,91,0.45)] text-center whitespace-nowrap">Nearest</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[31.6px] relative rounded-[26843500px] shrink-0 w-[78.738px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.6)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.8px] pt-[7.8px] px-[16.8px] relative size-full">
        <Text7 />
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[13px] text-[rgba(0,45,91,0.45)] text-center whitespace-nowrap">Cheapest</p>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[31.6px] relative rounded-[26843500px] shrink-0 w-[89.775px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.6)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.8px] pt-[7.8px] px-[16.8px] relative size-full">
        <Text8 />
      </div>
    </div>
  );
}

function Text9() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[13px] text-[rgba(0,45,91,0.45)] text-center whitespace-nowrap">Top Rated</p>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[31.6px] relative rounded-[26843500px] shrink-0 w-[93.525px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.6)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.8px] pt-[7.8px] px-[16.8px] relative size-full">
        <Text9 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[31.6px] items-center left-0 pl-[24px] top-[243px] w-[460px]" data-name="Container">
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[15px] left-[24px] top-[288.6px] w-[412px]" data-name="Paragraph">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[10px] text-[rgba(0,45,91,0.18)] top-[-0.2px] tracking-[0.3px] whitespace-nowrap">Sorted by weekly rate, lowest first</p>
    </div>
  );
}

function Container19() {
  return <div className="absolute h-[152.2px] left-0 rounded-[26px] top-0 w-[428px]" data-name="Container" style={{ backgroundImage: "linear-gradient(160.424deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.55) 100%)" }} />;
}

function Container20() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border-[0.8px] border-[rgba(255,255,255,0.65)] border-solid h-[152.2px] left-0 rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03),0px_8px_28px_0px_rgba(0,0,0,0.04)] top-0 w-[428px]" data-name="Container">
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.7)]" />
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[19px] relative shrink-0 w-[102.525px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[19px] not-italic relative shrink-0 text-[#002d5b] text-[15px] tracking-[-0.2px] whitespace-nowrap">Junaid Logistics</p>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p6be9d00} fill="var(--fill-0, #E17100)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Nunito:Bold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[#e17100] text-[10px] whitespace-nowrap">+$20</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-[rgba(254,154,0,0.08)] h-[22.6px] relative rounded-[26843500px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(254,154,0,0.15)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] h-full items-center px-[10.8px] py-[0.8px] relative">
        <Icon4 />
        <Text10 />
      </div>
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[13px] relative shrink-0 w-[13.425px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10.5px] text-[rgba(0,45,91,0.35)] whitespace-nowrap">4.9</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center relative">
        <div className="h-[10.489px] relative shrink-0 w-[11px]" data-name="Vector">
          <div className="absolute inset-[-81.52%_-77.73%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.0999 27.5886">
              <g filter="url(#filter0_d_49_2071)" id="Vector">
                <path d={svgPaths.p48a7880} fill="var(--fill-0, #FFB900)" />
                <path d={svgPaths.p48a7880} stroke="var(--stroke-0, #FFB900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0999" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.5886" id="filter0_d_49_2071" width="28.0999" x="1.19209e-07" y="1.19209e-07">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.72549 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_49_2071" />
                  <feBlend in="SourceGraphic" in2="effect1_dropShadow_49_2071" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Text11 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[22.6px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center relative">
        <Container24 />
        <Container25 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex h-[22.6px] items-center justify-between left-[20px] top-[18px] w-[388px]" data-name="Container">
      <Heading1 />
      <Container23 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p11dc1c00} fill="var(--fill-0, #99ACBF)" id="Vector" stroke="var(--stroke-0, #99ACBF)" strokeOpacity="0.4" strokeWidth="0.5" />
          <path d={svgPaths.p181c0e00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[14px] relative shrink-0 w-[209.775px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[11px] text-[rgba(0,45,91,0.38)] top-[-0.2px] whitespace-nowrap">4501 Pleasanton Ave, Pleasanton, CA 94566</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[14px] items-start left-[20px] top-[47.6px] w-[388px]" data-name="Container">
      <Icon5 />
      <Text12 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_49_2035)" id="Icon">
          <path d={svgPaths.p6405180} id="Vector" stroke="var(--stroke-0, #00BC7D)" strokeOpacity="0.7" strokeWidth="0.916667" />
          <path d="M5 2.91667V5L6.25 6.25" id="Vector_2" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_49_2035">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text14() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-start left-[27px] opacity-50 top-0 w-[27.013px]" data-name="Text">
      <p className="flex-[1_0_0] font-['Urbanist:SemiBold',sans-serif] leading-[13px] min-h-px min-w-px not-italic relative text-[10px] text-[rgba(0,188,125,0.7)]">· 24/7</p>
    </div>
  );
}

function Text13() {
  return (
    <div className="flex-[1_0_0] h-[13px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-0 not-italic text-[10px] text-[rgba(0,188,125,0.7)] top-0 whitespace-nowrap">Open</p>
        <Text14 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="h-[13px] relative shrink-0 w-[65.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
        <Icon6 />
        <Text13 />
      </div>
    </div>
  );
}

function Text17() {
  return <div className="absolute bg-[rgba(26,26,26,0.08)] left-[0.43px] rounded-[26843500px] size-[3px] top-[10.5px]" data-name="Text" />;
}

function Text16() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[3.862px]" data-name="Text">
      <Text17 />
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[24px] relative shrink-0 w-[3.862px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text16 />
      </div>
    </div>
  );
}

function Text20() {
  return <div className="absolute bg-[rgba(255,99,126,0.4)] left-[-1.89px] opacity-37 rounded-[26843500px] size-[9.774px] top-[-1.89px]" data-name="Text" />;
}

function Text21() {
  return <div className="absolute bg-[rgba(255,99,126,0.6)] left-0 rounded-[26843500px] size-[6px] top-0" data-name="Text" />;
}

function Text19() {
  return (
    <div className="absolute left-0 size-[6px] top-[3.5px]" data-name="Text">
      <Text20 />
      <Text21 />
    </div>
  );
}

function Text18() {
  return (
    <div className="h-[13px] relative shrink-0 w-[36.463px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-[10px] not-italic text-[10px] text-[rgba(255,32,86,0.7)] top-0 whitespace-nowrap">10 left</p>
        <Text19 />
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[20px] pl-[19px] top-[67.6px] w-[388px]" data-name="Container">
      <Container28 />
      <Text15 />
      <Text18 />
    </div>
  );
}

function Text22() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[31.55px]" data-name="Text">
      <p className="absolute font-['Urbanist:ExtraBold',sans-serif] leading-[22px] left-0 not-italic text-[#014488] text-[19px] top-[-0.8px] tracking-[-0.5px] whitespace-nowrap">$28</p>
    </div>
  );
}

function Text23() {
  return (
    <div className="absolute content-stretch flex h-[13px] items-start left-[35.55px] top-[8px] w-[42.688px]" data-name="Text">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">/spot · wk</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="h-[22px] relative shrink-0 w-[78.238px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text22 />
        <Text23 />
      </div>
    </div>
  );
}

function Text25() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🌡</p>
    </div>
  );
}

function Text24() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[59.788px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text25 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Climate</p>
      </div>
    </div>
  );
}

function Text27() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🔒</p>
    </div>
  );
}

function Text26() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[64.063px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text27 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Security</p>
      </div>
    </div>
  );
}

function Text29() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🏗</p>
    </div>
  );
}

function Text28() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[55.225px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text29 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Forklift</p>
      </div>
    </div>
  );
}

function Text30() {
  return (
    <div className="h-[13.5px] relative shrink-0 w-[10.2px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[13.5px] left-0 not-italic text-[9px] text-[rgba(0,45,91,0.16)] top-[-0.2px] whitespace-nowrap">+2</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="flex-[1_0_0] h-[19.6px] min-h-px min-w-px relative" data-name="Container">
      <div className="flex flex-row items-center justify-end size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-end relative size-full">
          <Text24 />
          <Text26 />
          <Text28 />
          <Text30 />
        </div>
      </div>
    </div>
  );
}

function Text31() {
  return (
    <div className="h-[14px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.35)] tracking-[0.11px] whitespace-nowrap">Select</p>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Arrow">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Arrow">
          <path d={svgPaths.p398ea600} fill="var(--fill-0, #A2B3C4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[28.6px] items-center left-[20px] top-[105.6px] w-[388px]" data-name="Container">
      <Container30 />
      <Container31 />
      <div className="bg-[rgba(255,255,255,0.55)] h-[28.6px] relative rounded-[26843500px] shrink-0" data-name="Select button">
        <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,68,136,0.08)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center justify-center px-[14.8px] py-[0.8px] relative">
          <Text31 />
          <Arrow />
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute h-[152.2px] left-0 top-0 w-[428px]" data-name="Container">
      <Container22 />
      <Container26 />
      <Container27 />
      <Container29 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute h-[152.2px] left-[16px] overflow-clip rounded-[26px] top-0 w-[428px]" data-name="Button">
      <Container19 />
      <Container20 />
      <Container21 />
    </div>
  );
}

function Container32() {
  return <div className="absolute h-[152.2px] left-0 rounded-[26px] top-0 w-[428px]" data-name="Container" style={{ backgroundImage: "linear-gradient(160.424deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.55) 100%)" }} />;
}

function Container33() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border-[0.8px] border-[rgba(255,255,255,0.65)] border-solid h-[152.2px] left-0 rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03),0px_8px_28px_0px_rgba(0,0,0,0.04)] top-0 w-[428px]" data-name="Container">
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.7)]" />
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[19px] relative shrink-0 w-[92.55px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[19px] not-italic relative shrink-0 text-[#002d5b] text-[15px] tracking-[-0.2px] whitespace-nowrap">Greenstore G1</p>
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p6be9d00} fill="var(--fill-0, #009966)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text32() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Nunito:Bold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[#096] text-[10px] whitespace-nowrap">+$2</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="bg-[rgba(0,188,125,0.08)] h-[22.6px] relative rounded-[26843500px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,188,125,0.15)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] h-full items-center px-[10.8px] py-[0.8px] relative">
        <Icon7 />
        <Text32 />
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="h-[13px] relative shrink-0 w-[13.637px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10.5px] text-[rgba(0,45,91,0.35)] whitespace-nowrap">4.2</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center relative">
        <div className="h-[10.489px] relative shrink-0 w-[11px]" data-name="Vector">
          <div className="absolute inset-[-81.52%_-77.73%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.0999 27.5886">
              <g filter="url(#filter0_d_49_2071)" id="Vector">
                <path d={svgPaths.p48a7880} fill="var(--fill-0, #FFB900)" />
                <path d={svgPaths.p48a7880} stroke="var(--stroke-0, #FFB900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0999" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.5886" id="filter0_d_49_2071" width="28.0999" x="1.19209e-07" y="1.19209e-07">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.72549 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_49_2071" />
                  <feBlend in="SourceGraphic" in2="effect1_dropShadow_49_2071" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Text33 />
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[22.6px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center relative">
        <Container37 />
        <Container38 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute content-stretch flex h-[22.6px] items-center justify-between left-[20px] top-[18px] w-[388px]" data-name="Container">
      <Heading2 />
      <Container36 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p11dc1c00} fill="var(--fill-0, #99ACBF)" id="Vector" stroke="var(--stroke-0, #99ACBF)" strokeOpacity="0.4" strokeWidth="0.5" />
          <path d={svgPaths.p181c0e00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Text34() {
  return (
    <div className="h-[15px] relative shrink-0 w-[174.788px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[11px] text-[rgba(0,45,91,0.38)] top-[-0.2px] whitespace-nowrap">142 Harbor Blvd, Oakland, CA 94607</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[15px] items-start left-[20px] top-[47.6px] w-[388px]" data-name="Container">
      <Icon8 />
      <Text34 />
    </div>
  );
}

function Icon9() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_49_2035)" id="Icon">
          <path d={svgPaths.p6405180} id="Vector" stroke="var(--stroke-0, #00BC7D)" strokeOpacity="0.7" strokeWidth="0.916667" />
          <path d="M5 2.91667V5L6.25 6.25" id="Vector_2" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_49_2035">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text36() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-start left-[27px] opacity-50 top-0 w-[54.763px]" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,188,125,0.7)] whitespace-nowrap">· Until 10 PM</p>
    </div>
  );
}

function Text35() {
  return (
    <div className="flex-[1_0_0] h-[13px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-0 not-italic text-[10px] text-[rgba(0,188,125,0.7)] top-0 whitespace-nowrap">Open</p>
        <Text36 />
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[13px] relative shrink-0 w-[93.5px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
        <Icon9 />
        <Text35 />
      </div>
    </div>
  );
}

function Text39() {
  return <div className="absolute bg-[rgba(26,26,26,0.08)] left-[0.43px] rounded-[26843500px] size-[3px] top-[10.5px]" data-name="Text" />;
}

function Text38() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[3.862px]" data-name="Text">
      <Text39 />
    </div>
  );
}

function Text37() {
  return (
    <div className="h-[24px] relative shrink-0 w-[3.862px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text38 />
      </div>
    </div>
  );
}

function Text40() {
  return (
    <div className="h-[13px] relative shrink-0 w-[36.463px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.22)] whitespace-nowrap">38 spots</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[20px] pl-[19px] top-[67.6px] w-[388px]" data-name="Container">
      <Container41 />
      <Text37 />
      <Text40 />
    </div>
  );
}

function Text41() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[30.938px]" data-name="Text">
      <p className="absolute font-['Urbanist:ExtraBold',sans-serif] leading-[22px] left-0 not-italic text-[#014488] text-[19px] top-[-0.8px] tracking-[-0.5px] whitespace-nowrap">$35</p>
    </div>
  );
}

function Text42() {
  return (
    <div className="absolute content-stretch flex h-[13px] items-start left-[34.94px] top-[8px] w-[42.688px]" data-name="Text">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">/spot · wk</p>
    </div>
  );
}

function Container43() {
  return (
    <div className="h-[22px] relative shrink-0 w-[77.625px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text41 />
        <Text42 />
      </div>
    </div>
  );
}

function Text44() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🌡</p>
    </div>
  );
}

function Text43() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[59.788px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text44 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Climate</p>
      </div>
    </div>
  );
}

function Text46() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🔒</p>
    </div>
  );
}

function Text45() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[64.063px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text46 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Security</p>
      </div>
    </div>
  );
}

function Text48() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🏗</p>
    </div>
  );
}

function Text47() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[55.225px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text48 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Forklift</p>
      </div>
    </div>
  );
}

function Text49() {
  return (
    <div className="h-[13.5px] relative shrink-0 w-[7.775px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[13.5px] left-0 not-italic text-[9px] text-[rgba(0,45,91,0.16)] top-[-0.2px] whitespace-nowrap">+1</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="flex-[1_0_0] h-[19.6px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-end relative size-full">
        <Text43 />
        <Text45 />
        <Text47 />
        <Text49 />
      </div>
    </div>
  );
}

function Text50() {
  return (
    <div className="h-[14px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.35)] tracking-[0.11px] whitespace-nowrap">Select</p>
      </div>
    </div>
  );
}

function Arrow1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Arrow">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Arrow">
          <path d={svgPaths.p398ea600} fill="var(--fill-0, #A2B3C4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[28.6px] items-center left-[20px] top-[105.6px] w-[388px]" data-name="Container">
      <Container43 />
      <Container44 />
      <div className="bg-[rgba(255,255,255,0.55)] h-[28.6px] relative rounded-[26843500px] shrink-0" data-name="Select button">
        <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,68,136,0.08)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center justify-center px-[14.8px] py-[0.8px] relative">
          <Text50 />
          <Arrow1 />
        </div>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute h-[152.2px] left-0 top-0 w-[428px]" data-name="Container">
      <Container35 />
      <Container39 />
      <Container40 />
      <Container42 />
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute h-[152.2px] left-[16px] overflow-clip rounded-[26px] top-[162.2px] w-[428px]" data-name="Button">
      <Container32 />
      <Container33 />
      <Container34 />
    </div>
  );
}

function Container45() {
  return <div className="absolute h-[152.2px] left-0 rounded-[26px] top-0 w-[428px]" data-name="Container" style={{ backgroundImage: "linear-gradient(160.424deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.55) 100%)" }} />;
}

function Container46() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border-[0.8px] border-[rgba(255,255,255,0.65)] border-solid h-[152.2px] left-0 rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03),0px_8px_28px_0px_rgba(0,0,0,0.04)] top-0 w-[428px]" data-name="Container">
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.7)]" />
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[19px] relative shrink-0 w-[134.713px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[19px] not-italic relative shrink-0 text-[#002d5b] text-[15px] tracking-[-0.2px] whitespace-nowrap">Nordic Supply Depot</p>
      </div>
    </div>
  );
}

function Icon10() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p6be9d00} fill="var(--fill-0, #FC6188)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text51() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Nunito:Bold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[#fc6188] text-[10px] whitespace-nowrap">+$204</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="bg-[rgba(255,32,86,0.08)] h-[22.6px] relative rounded-[26843500px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,32,86,0.15)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] h-full items-center px-[10.8px] py-[0.8px] relative">
        <Icon10 />
        <Text51 />
      </div>
    </div>
  );
}

function Text52() {
  return (
    <div className="h-[13px] relative shrink-0 w-[14.113px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10.5px] text-[rgba(0,45,91,0.35)] whitespace-nowrap">4.0</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center relative">
        <div className="h-[10.489px] relative shrink-0 w-[11px]" data-name="Vector">
          <div className="absolute inset-[-81.52%_-77.73%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.0999 27.5886">
              <g filter="url(#filter0_d_49_2071)" id="Vector">
                <path d={svgPaths.p48a7880} fill="var(--fill-0, #FFB900)" />
                <path d={svgPaths.p48a7880} stroke="var(--stroke-0, #FFB900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0999" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.5886" id="filter0_d_49_2071" width="28.0999" x="1.19209e-07" y="1.19209e-07">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.72549 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_49_2071" />
                  <feBlend in="SourceGraphic" in2="effect1_dropShadow_49_2071" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Text52 />
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="h-[22.6px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center relative">
        <Container50 />
        <Container51 />
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute content-stretch flex h-[22.6px] items-center justify-between left-[20px] top-[18px] w-[388px]" data-name="Container">
      <Heading3 />
      <Container49 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p11dc1c00} fill="var(--fill-0, #99ACBF)" id="Vector" stroke="var(--stroke-0, #99ACBF)" strokeOpacity="0.4" strokeWidth="0.5" />
          <path d={svgPaths.p181c0e00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Text53() {
  return (
    <div className="h-[15px] relative shrink-0 w-[200.6px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[11px] text-[rgba(0,45,91,0.38)] top-[-0.2px] whitespace-nowrap">775 Estudillo Ave, San Leandro, CA 94577</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[15px] items-start left-[20px] top-[47.6px] w-[388px]" data-name="Container">
      <Icon11 />
      <Text53 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_49_2035)" id="Icon">
          <path d={svgPaths.p6405180} id="Vector" stroke="var(--stroke-0, #00BC7D)" strokeOpacity="0.7" strokeWidth="0.916667" />
          <path d="M5 2.91667V5L6.25 6.25" id="Vector_2" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_49_2035">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text55() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-start left-[27px] opacity-50 top-0 w-[51.825px]" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,188,125,0.7)] whitespace-nowrap">· Until 11 PM</p>
    </div>
  );
}

function Text54() {
  return (
    <div className="flex-[1_0_0] h-[13px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-0 not-italic text-[10px] text-[rgba(0,188,125,0.7)] top-0 whitespace-nowrap">Open</p>
        <Text55 />
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="h-[13px] relative shrink-0 w-[90.563px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
        <Icon12 />
        <Text54 />
      </div>
    </div>
  );
}

function Text58() {
  return <div className="absolute bg-[rgba(26,26,26,0.08)] left-[0.43px] rounded-[26843500px] size-[3px] top-[10.5px]" data-name="Text" />;
}

function Text57() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[3.862px]" data-name="Text">
      <Text58 />
    </div>
  );
}

function Text56() {
  return (
    <div className="h-[24px] relative shrink-0 w-[3.862px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text57 />
      </div>
    </div>
  );
}

function Text59() {
  return (
    <div className="h-[13px] relative shrink-0 w-[37.425px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.22)] whitespace-nowrap">40 spots</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[20px] pl-[19px] top-[67.6px] w-[388px]" data-name="Container">
      <Container54 />
      <Text56 />
      <Text59 />
    </div>
  );
}

function Text60() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[32.237px]" data-name="Text">
      <p className="absolute font-['Urbanist:ExtraBold',sans-serif] leading-[22px] left-0 not-italic text-[#014488] text-[19px] top-[-0.8px] tracking-[-0.5px] whitespace-nowrap">$40</p>
    </div>
  );
}

function Text61() {
  return (
    <div className="absolute content-stretch flex h-[13px] items-start left-[36.24px] top-[8px] w-[42.688px]" data-name="Text">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">/spot · wk</p>
    </div>
  );
}

function Container56() {
  return (
    <div className="h-[22px] relative shrink-0 w-[78.925px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text60 />
        <Text61 />
      </div>
    </div>
  );
}

function Text63() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🔒</p>
    </div>
  );
}

function Text62() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[64.063px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text63 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Security</p>
      </div>
    </div>
  );
}

function Text65() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">📍</p>
    </div>
  );
}

function Text64() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[65.613px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text65 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Tracking</p>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="flex-[1_0_0] h-[19.6px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-end relative size-full">
        <Text62 />
        <Text64 />
      </div>
    </div>
  );
}

function Text66() {
  return (
    <div className="h-[14px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.35)] tracking-[0.11px] whitespace-nowrap">Select</p>
      </div>
    </div>
  );
}

function Arrow2() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Arrow">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Arrow">
          <path d={svgPaths.p398ea600} fill="var(--fill-0, #A2B3C4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[28.6px] items-center left-[20px] top-[105.6px] w-[388px]" data-name="Container">
      <Container56 />
      <Container57 />
      <div className="bg-[rgba(255,255,255,0.55)] h-[28.6px] relative rounded-[26843500px] shrink-0" data-name="Select button">
        <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,68,136,0.08)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center justify-center px-[14.8px] py-[0.8px] relative">
          <Text66 />
          <Arrow2 />
        </div>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute h-[152.2px] left-0 top-0 w-[428px]" data-name="Container">
      <Container48 />
      <Container52 />
      <Container53 />
      <Container55 />
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute h-[152.2px] left-[16px] overflow-clip rounded-[26px] top-[324.4px] w-[428px]" data-name="Button">
      <Container45 />
      <Container46 />
      <Container47 />
    </div>
  );
}

function Icon13() {
  return (
    <div className="h-[12px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-20%_-10%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.2 4.2">
            <path d="M0.6 0.6L3.6 3.6L6.6 0.6" id="Vector" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" strokeWidth="1.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon13 />
      </div>
    </div>
  );
}

function Text67() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[18px] left-[41px] not-italic text-[12px] text-[rgba(26,26,26,0.4)] text-center top-[-0.4px] tracking-[0.2px] whitespace-nowrap">Scroll for more</p>
      </div>
    </div>
  );
}

function Icon14() {
  return (
    <div className="h-[12px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-20%_-10%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.2 4.2">
            <path d="M0.6 0.6L3.6 3.6L6.6 0.6" id="Vector" stroke="var(--stroke-0, #1A1A1A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" strokeWidth="1.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon14 />
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="-translate-x-1/2 absolute backdrop-blur-[2px] bg-[rgba(255,255,255,0.7)] content-stretch flex gap-[6px] h-[37.6px] items-center left-[calc(50%+0.26px)] px-[18.8px] py-[0.8px] rounded-[26843500px] top-[424.7px] w-[154.875px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.6)] border-solid inset-0 pointer-events-none rounded-[26843500px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.08)]" />
      <Container58 />
      <Text67 />
      <Container59 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(255,255,255,0.3)]" />
    </div>
  );
}

function Container60() {
  return <div className="absolute h-[152.2px] left-0 rounded-[26px] top-0 w-[428px]" data-name="Container" style={{ backgroundImage: "linear-gradient(160.424deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.55) 100%)" }} />;
}

function Container61() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border-[0.8px] border-[rgba(255,255,255,0.65)] border-solid h-[152.2px] left-0 rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03),0px_8px_28px_0px_rgba(0,0,0,0.04)] top-0 w-[428px]" data-name="Container">
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.7)]" />
    </div>
  );
}

function Heading4() {
  return (
    <div className="h-[19px] relative shrink-0 w-[94.7px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[19px] not-italic relative shrink-0 text-[#002d5b] text-[15px] tracking-[-0.2px] whitespace-nowrap">James ZS Hub</p>
      </div>
    </div>
  );
}

function Icon15() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p6be9d00} fill="var(--fill-0, #0084D1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text68() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Nunito:Bold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[#0084d1] text-[10px] whitespace-nowrap">+$8</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="bg-[rgba(0,166,244,0.08)] h-[22.6px] relative rounded-[26843500px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,166,244,0.12)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center px-[10.8px] py-[0.8px] relative">
        <Icon15 />
        <Text68 />
      </div>
    </div>
  );
}

function Text69() {
  return (
    <div className="h-[13px] relative shrink-0 w-[13.425px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10.5px] text-[rgba(0,45,91,0.35)] whitespace-nowrap">4.8</p>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center relative">
        <div className="h-[10.489px] relative shrink-0 w-[11px]" data-name="Vector">
          <div className="absolute inset-[-81.52%_-77.73%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.0999 27.5886">
              <g filter="url(#filter0_d_49_2071)" id="Vector">
                <path d={svgPaths.p48a7880} fill="var(--fill-0, #FFB900)" />
                <path d={svgPaths.p48a7880} stroke="var(--stroke-0, #FFB900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0999" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.5886" id="filter0_d_49_2071" width="28.0999" x="1.19209e-07" y="1.19209e-07">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.72549 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_49_2071" />
                  <feBlend in="SourceGraphic" in2="effect1_dropShadow_49_2071" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Text69 />
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="h-[22.6px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center relative">
        <Container65 />
        <Container66 />
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute content-stretch flex h-[22.6px] items-center justify-between left-[20px] top-[18px] w-[388px]" data-name="Container">
      <Heading4 />
      <Container64 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p11dc1c00} fill="var(--fill-0, #99ACBF)" id="Vector" stroke="var(--stroke-0, #99ACBF)" strokeOpacity="0.4" strokeWidth="0.5" />
          <path d={svgPaths.p181c0e00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Text70() {
  return (
    <div className="h-[15px] relative shrink-0 w-[212.6px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[11px] text-[rgba(0,45,91,0.38)] top-[-0.2px] whitespace-nowrap">890 Industrial Pkwy, San Leandro, CA 94577</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[15px] items-start left-[20px] top-[47.6px] w-[388px]" data-name="Container">
      <Icon16 />
      <Text70 />
    </div>
  );
}

function Icon17() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_49_2035)" id="Icon">
          <path d={svgPaths.p6405180} id="Vector" stroke="var(--stroke-0, #00BC7D)" strokeOpacity="0.7" strokeWidth="0.916667" />
          <path d="M5 2.91667V5L6.25 6.25" id="Vector_2" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_49_2035">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text72() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-start left-[27px] opacity-50 top-0 w-[51.088px]" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,188,125,0.7)] whitespace-nowrap">· Until 9 PM</p>
    </div>
  );
}

function Text71() {
  return (
    <div className="flex-[1_0_0] h-[13px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-0 not-italic text-[10px] text-[rgba(0,188,125,0.7)] top-0 whitespace-nowrap">Open</p>
        <Text72 />
      </div>
    </div>
  );
}

function Container69() {
  return (
    <div className="h-[13px] relative shrink-0 w-[89.825px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
        <Icon17 />
        <Text71 />
      </div>
    </div>
  );
}

function Text75() {
  return <div className="absolute bg-[rgba(26,26,26,0.08)] left-[0.43px] rounded-[26843500px] size-[3px] top-[10.5px]" data-name="Text" />;
}

function Text74() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[3.862px]" data-name="Text">
      <Text75 />
    </div>
  );
}

function Text73() {
  return (
    <div className="h-[24px] relative shrink-0 w-[3.862px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text74 />
      </div>
    </div>
  );
}

function Text76() {
  return (
    <div className="h-[13px] relative shrink-0 w-[37.638px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.22)] whitespace-nowrap">116 spots</p>
      </div>
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[20px] pl-[19px] top-[67.6px] w-[388px]" data-name="Container">
      <Container69 />
      <Text73 />
      <Text76 />
    </div>
  );
}

function Text77() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[32.313px]" data-name="Text">
      <p className="absolute font-['Urbanist:ExtraBold',sans-serif] leading-[22px] left-0 not-italic text-[#014488] text-[19px] top-[-0.8px] tracking-[-0.5px] whitespace-nowrap">$45</p>
    </div>
  );
}

function Text78() {
  return (
    <div className="absolute content-stretch flex h-[13px] items-start left-[36.31px] top-[8px] w-[42.688px]" data-name="Text">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">/spot · wk</p>
    </div>
  );
}

function Container71() {
  return (
    <div className="h-[22px] relative shrink-0 w-[79px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text77 />
        <Text78 />
      </div>
    </div>
  );
}

function Text80() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🌡</p>
    </div>
  );
}

function Text79() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[59.788px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text80 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Climate</p>
      </div>
    </div>
  );
}

function Text82() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🔒</p>
    </div>
  );
}

function Text81() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[64.063px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text82 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Security</p>
      </div>
    </div>
  );
}

function Text84() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">⏰</p>
    </div>
  );
}

function Text83() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[49.45px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text84 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">24hr</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="flex-[1_0_0] h-[19.6px] min-h-px min-w-px relative" data-name="Container">
      <div className="flex flex-row items-center justify-end size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-end relative size-full">
          <Text79 />
          <Text81 />
          <Text83 />
        </div>
      </div>
    </div>
  );
}

function Text85() {
  return (
    <div className="h-[14px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.35)] tracking-[0.11px] whitespace-nowrap">Select</p>
      </div>
    </div>
  );
}

function Arrow3() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Arrow">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Arrow">
          <path d={svgPaths.p398ea600} fill="var(--fill-0, #A2B3C4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[28.6px] items-center left-[20px] top-[105.6px] w-[388px]" data-name="Container">
      <Container71 />
      <Container72 />
      <div className="bg-[rgba(255,255,255,0.55)] h-[28.6px] relative rounded-[26843500px] shrink-0" data-name="Select button">
        <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,68,136,0.08)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center justify-center px-[14.8px] py-[0.8px] relative">
          <Text85 />
          <Arrow3 />
        </div>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="absolute h-[152.2px] left-0 top-0 w-[428px]" data-name="Container">
      <Container63 />
      <Container67 />
      <Container68 />
      <Container70 />
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute h-[152.2px] left-[16px] overflow-clip rounded-[26px] top-[486.6px] w-[428px]" data-name="Button">
      <Container60 />
      <Container61 />
      <Container62 />
    </div>
  );
}

function Container73() {
  return <div className="absolute h-[152.2px] left-0 rounded-[26px] top-0 w-[428px]" data-name="Container" style={{ backgroundImage: "linear-gradient(160.424deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.55) 100%)" }} />;
}

function Container74() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] border-[0.8px] border-[rgba(255,255,255,0.65)] border-solid h-[152.2px] left-0 rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03),0px_8px_28px_0px_rgba(0,0,0,0.04)] top-0 w-[428px]" data-name="Container">
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.7)]" />
    </div>
  );
}

function Heading5() {
  return (
    <div className="h-[19px] relative shrink-0 w-[120.988px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Bold',sans-serif] leading-[19px] not-italic relative shrink-0 text-[#002d5b] text-[15px] tracking-[-0.2px] whitespace-nowrap">Jack Rock Storage</p>
      </div>
    </div>
  );
}

function Icon18() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p6be9d00} fill="var(--fill-0, #E17100)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text86() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Nunito:Bold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[#e17100] text-[10px] whitespace-nowrap">+$14</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="bg-[rgba(254,154,0,0.08)] h-[22.6px] relative rounded-[26843500px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(254,154,0,0.15)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center px-[10.8px] py-[0.8px] relative">
        <Icon18 />
        <Text86 />
      </div>
    </div>
  );
}

function Text87() {
  return (
    <div className="h-[13px] relative shrink-0 w-[12.925px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10.5px] text-[rgba(0,45,91,0.35)] whitespace-nowrap">3.6</p>
      </div>
    </div>
  );
}

function Container79() {
  return (
    <div className="h-[13px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center relative">
        <div className="h-[10.489px] relative shrink-0 w-[11px]" data-name="Vector">
          <div className="absolute inset-[-81.52%_-77.73%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.0999 27.5886">
              <g filter="url(#filter0_d_49_2071)" id="Vector">
                <path d={svgPaths.p48a7880} fill="var(--fill-0, #FFB900)" />
                <path d={svgPaths.p48a7880} stroke="var(--stroke-0, #FFB900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0999" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.5886" id="filter0_d_49_2071" width="28.0999" x="1.19209e-07" y="1.19209e-07">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.72549 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_49_2071" />
                  <feBlend in="SourceGraphic" in2="effect1_dropShadow_49_2071" mode="normal" result="shape" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Text87 />
      </div>
    </div>
  );
}

function Container77() {
  return (
    <div className="h-[22.6px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center relative">
        <Container78 />
        <Container79 />
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div className="absolute content-stretch flex h-[22.6px] items-center justify-between left-[20px] top-[18px] w-[388px]" data-name="Container">
      <Heading5 />
      <Container77 />
    </div>
  );
}

function Icon19() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p11dc1c00} fill="var(--fill-0, #99ACBF)" id="Vector" stroke="var(--stroke-0, #99ACBF)" strokeOpacity="0.4" strokeWidth="0.5" />
          <path d={svgPaths.p181c0e00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Text88() {
  return (
    <div className="h-[15px] relative shrink-0 w-[177.8px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[15px] left-0 not-italic text-[11px] text-[rgba(0,45,91,0.38)] top-[-0.2px] whitespace-nowrap">2210 Webster St, Alameda, CA 94501</p>
      </div>
    </div>
  );
}

function Container80() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[15px] items-start left-[20px] top-[47.6px] w-[388px]" data-name="Container">
      <Icon19 />
      <Text88 />
    </div>
  );
}

function Icon20() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_50_3665)" id="Icon">
          <path d={svgPaths.p6405180} id="Vector" stroke="var(--stroke-0, #FF637E)" strokeOpacity="0.7" strokeWidth="0.916667" />
          <path d="M5 2.91667V5L6.25 6.25" id="Vector_2" stroke="var(--stroke-0, #FF637E)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_50_3665">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text90() {
  return (
    <div className="absolute content-stretch flex h-[12px] items-start left-[33px] opacity-50 top-0 w-[61.838px]" data-name="Text">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(255,99,126,0.7)] whitespace-nowrap">· Opens 9 AM</p>
    </div>
  );
}

function Text89() {
  return (
    <div className="flex-[1_0_0] h-[13px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] leading-[13px] left-0 not-italic text-[10px] text-[rgba(255,99,126,0.7)] top-0 whitespace-nowrap">Closed</p>
        <Text90 />
      </div>
    </div>
  );
}

function Container82() {
  return (
    <div className="h-[13px] relative shrink-0 w-[106.412px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
        <Icon20 />
        <Text89 />
      </div>
    </div>
  );
}

function Text93() {
  return <div className="absolute bg-[rgba(26,26,26,0.08)] left-[0.43px] rounded-[26843500px] size-[3px] top-[10.5px]" data-name="Text" />;
}

function Text92() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[3.862px]" data-name="Text">
      <Text93 />
    </div>
  );
}

function Text91() {
  return (
    <div className="h-[24px] relative shrink-0 w-[3.862px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text92 />
      </div>
    </div>
  );
}

function Text94() {
  return (
    <div className="h-[13px] relative shrink-0 w-[37.237px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.22)] whitespace-nowrap">55 spots</p>
      </div>
    </div>
  );
}

function Container81() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[20px] pl-[19px] top-[67.6px] w-[388px]" data-name="Container">
      <Container82 />
      <Text91 />
      <Text94 />
    </div>
  );
}

function Text95() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[32.075px]" data-name="Text">
      <p className="absolute font-['Urbanist:ExtraBold',sans-serif] leading-[22px] left-0 not-italic text-[#014488] text-[19px] top-[-0.8px] tracking-[-0.5px] whitespace-nowrap">$50</p>
    </div>
  );
}

function Text96() {
  return (
    <div className="absolute content-stretch flex h-[13px] items-start left-[36.08px] top-[8px] w-[42.688px]" data-name="Text">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[13px] not-italic relative shrink-0 text-[10px] text-[rgba(0,45,91,0.2)] whitespace-nowrap">/spot · wk</p>
    </div>
  );
}

function Container84() {
  return (
    <div className="h-[22px] relative shrink-0 w-[78.763px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text95 />
        <Text96 />
      </div>
    </div>
  );
}

function Text98() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[8px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">🌡</p>
    </div>
  );
}

function Text97() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[59.788px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text98 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[19.8px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Climate</p>
      </div>
    </div>
  );
}

function Text100() {
  return (
    <div className="absolute h-[12px] left-[8.8px] top-[3.8px] w-[10.988px]" data-name="Text">
      <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-0 not-italic text-[8px] text-[rgba(0,45,91,0.28)] top-[-0.2px] whitespace-nowrap">📍</p>
    </div>
  );
}

function Text99() {
  return (
    <div className="bg-[rgba(255,255,255,0.5)] h-[19.6px] relative rounded-[26843500px] shrink-0 w-[65.613px]" data-name="Text">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.7)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text100 />
        <p className="absolute font-['Urbanist:Medium',sans-serif] leading-[12px] left-[22.79px] not-italic text-[9px] text-[rgba(0,45,91,0.28)] top-[3.8px] whitespace-nowrap">Tracking</p>
      </div>
    </div>
  );
}

function Container85() {
  return (
    <div className="flex-[1_0_0] h-[19.6px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center justify-end relative size-full">
        <Text97 />
        <Text99 />
      </div>
    </div>
  );
}

function Text101() {
  return (
    <div className="h-[14px] relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-start relative">
        <p className="font-['Urbanist:SemiBold',sans-serif] leading-[14px] not-italic relative shrink-0 text-[11px] text-[rgba(0,45,91,0.35)] tracking-[0.11px] whitespace-nowrap">Select</p>
      </div>
    </div>
  );
}

function Arrow4() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Arrow">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Arrow">
          <path d={svgPaths.p398ea600} fill="var(--fill-0, #A2B3C4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container83() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[28.6px] items-center left-[20px] top-[105.6px] w-[388px]" data-name="Container">
      <Container84 />
      <Container85 />
      <div className="bg-[rgba(255,255,255,0.55)] h-[28.6px] relative rounded-[26843500px] shrink-0" data-name="Select button">
        <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(1,68,136,0.08)] border-solid inset-0 pointer-events-none rounded-[26843500px]" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-center justify-center px-[14.8px] py-[0.8px] relative">
          <Text101 />
          <Arrow4 />
        </div>
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="absolute h-[152.2px] left-0 top-0 w-[428px]" data-name="Container">
      <Container76 />
      <Container80 />
      <Container81 />
      <Container83 />
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute h-[152.2px] left-[16px] overflow-clip rounded-[26px] top-[648.8px] w-[428px]" data-name="Button">
      <Container73 />
      <Container74 />
      <Container75 />
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[801px] left-0 top-[311.6px] w-[460px]" data-name="Container">
      <Button5 />
      <Button6 />
      <Button7 />
      <Button8 />
      <Button9 />
      <Button10 />
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute h-[1160.6px] left-[365px] top-px w-[460px]" data-name="Container">
      <Container11 />
      <Container16 />
      <Container17 />
      <Paragraph1 />
      <Container18 />
    </div>
  );
}

export default function SelectStorage() {
  return (
    <div className="bg-white relative size-full" data-name="Select Storage">
      <Container />
      <div className="absolute content-stretch flex flex-col gap-[7px] h-[70px] items-center left-[1141.2px] top-[329.8px] w-[8px]" data-name="Container">
        <Container5 />
        <Container6 />
        <Container7 />
        <Container8 />
        <Container9 />
      </div>
      <Container10 />
    </div>
  );
}