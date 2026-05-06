"use client";

import svgPaths from "./svg-7v07io1e3b";

function Frame() {
  return <div className="h-[22.286px] shrink-0 w-[383.143px]" />;
}

function Blur() {
  return <div className="absolute inset-[-22.29px] opacity-67" data-name="Blur" />;
}

function Fill() {
  return (
    <div className="absolute inset-0 rounded-[253.714px]" data-name="Fill">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[253.714px]">
        <div className="absolute bg-[#333] inset-0 mix-blend-color-dodge rounded-[253.714px]" />
        <div className="absolute inset-0 rounded-[253.714px]" style={{ backgroundImage: "linear-gradient(90deg, rgb(247, 247, 247) 0%, rgb(247, 247, 247) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%)" }} />
      </div>
    </div>
  );
}

function GlassEffect() {
  return <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[296px]" data-name="Glass Effect" />;
}

function Group1() {
  return (
    <div className="absolute inset-[8.33%_16.66%_8.34%_16.68%]">
      <div className="absolute inset-[-4.5%_-5.63%_-4.51%_-5.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.7143 15.5715">
          <g id="Group 314">
            <path d={svgPaths.p34dee80} id="Vector" stroke="var(--stroke-0, #0D1117)" strokeWidth="1.28571" />
            <path d={svgPaths.p154cc6e0} id="Vector_2" stroke="var(--stroke-0, #0D1117)" strokeLinecap="round" strokeWidth="1.28571" />
            <path d={svgPaths.p3f112a00} id="Vector_3" stroke="var(--stroke-0, #0D1117)" strokeLinecap="round" strokeWidth="1.28571" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Mic01StrokeRounded() {
  return (
    <div className="opacity-70 overflow-clip relative shrink-0 size-[17.143px]" data-name="mic-01-stroke-rounded 1">
      <Group1 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="col-1 content-stretch flex items-center ml-[5.14px] mt-[5.14px] relative row-1">
      <Mic01StrokeRounded />
    </div>
  );
}

function Group3() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 ml-0 mt-0 overflow-clip relative row-1 size-[26.571px]" data-name="Liquid Glass - Regular - Small">
        <Blur />
        <Fill />
        <GlassEffect />
      </div>
      <Frame10 />
    </div>
  );
}

function Blur1() {
  return <div className="absolute inset-[-22.29px] opacity-67" data-name="Blur" />;
}

function Fill1() {
  return (
    <div className="absolute inset-0 rounded-[253.714px]" data-name="Fill">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[253.714px]">
        <div className="absolute bg-[#333] inset-0 mix-blend-color-dodge rounded-[253.714px]" />
        <div className="absolute inset-0 rounded-[253.714px]" style={{ backgroundImage: "linear-gradient(90deg, rgb(247, 247, 247) 0%, rgb(247, 247, 247) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%)" }} />
      </div>
    </div>
  );
}

function GlassEffect1() {
  return <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[296px]" data-name="Glass Effect" />;
}

function Image() {
  return (
    <div className="absolute inset-[11.46%]" data-name="Image">
      <div className="absolute inset-[-4.42%_-4.42%_-4.43%_-4.42%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8214 15.8214">
          <g id="Image">
            <path d={svgPaths.p1eb78380} id="Stroke 1" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.28571" />
            <path clipRule="evenodd" d={svgPaths.p31420780} fillRule="evenodd" id="Stroke 3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.28571" />
            <path clipRule="evenodd" d={svgPaths.pecd6800} fillRule="evenodd" id="Stroke 5" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.28571" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 content-stretch flex gap-[3.429px] h-[26.571px] items-center justify-center ml-0 mt-0 px-[17.143px] py-[5.143px] relative rounded-[1000px] row-1 w-[40.286px]" data-name="Button - Liquid Glass - Text">
        <Blur1 />
        <Fill1 />
        <GlassEffect1 />
        <div className="content-stretch flex h-[30.857px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Text">
          <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[#404040] text-[14.57px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'ss16'" }}>
            <p className="leading-[normal]">&nbsp;</p>
          </div>
        </div>
      </div>
      <div className="col-1 ml-[11.14px] mt-[4.29px] relative row-1 size-[18.857px]" data-name="Iconly/Curved/Light/Image">
        <Image />
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#f4faff] content-stretch flex gap-[8.571px] items-center pl-[20.571px] pr-[46.286px] py-[6.857px] relative rounded-[42.857px] shrink-0 w-[498.857px]">
      <div aria-hidden="true" className="absolute border-[#008ff7] border-[0.429px] border-solid inset-[-0.214px] pointer-events-none rounded-[43.071px] shadow-[0.857px_0.857px_4.286px_0px_rgba(0,0,0,0.25)]" />
      <p className="absolute font-['SF_Pro_Rounded:Regular',sans-serif] leading-[1.6] left-[21px] not-italic opacity-56 text-[#0d1117] text-[13.714px] top-[9px] whitespace-nowrap">Search here...</p>
      <Frame />
      <Group3 />
      <Group2 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[20.571px] items-center justify-center relative shrink-0 w-full">
      <p className="bg-clip-text font-['Urbanist:ExtraBold',sans-serif] h-[81.429px] leading-[1.2] not-italic relative shrink-0 text-[82.286px] text-[transparent] text-center w-[209.143px]" dir="auto" style={{ backgroundImage: "linear-gradient(75.5174deg, rgba(0, 143, 247, 0.8) 9.9891%, rgba(45, 132, 248, 0.8) 20.466%, rgba(90, 121, 249, 0.8) 30.943%, rgba(179, 99, 250, 0.8) 42.629%, rgba(228, 75, 193, 0.8) 55.524%, rgba(235, 72, 131, 0.8) 67.21%, rgba(243, 69, 70, 0.72) 85.423%, rgba(255, 221, 85, 0.8) 93.805%)" }}>
        Vehsl
      </p>
      <Frame6 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-start left-[calc(50%-6px)] top-[147.43px] w-[498.857px]">
      <Frame11 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="absolute content-stretch flex h-[37.714px] items-center justify-between left-[19.58px] top-[5.08px] w-[913.846px]">
      <p className="font-['Urbanist:SemiBold',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#19202b] text-[20.31px] whitespace-nowrap" dir="auto">
        Vehsl
      </p>
      <div className="relative shrink-0 size-[37.714px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 37.7143 37.7143">
          <g id="Ellipse 60">
            <circle cx="18.8571" cy="18.8571" fill="var(--fill-0, #CCDAEE)" r="18.8571" />
            <circle cx="18.8571" cy="18.8571" r="18.4286" stroke="url(#paint0_linear_6_1086)" strokeOpacity="0.7" strokeWidth="0.857143" />
            <circle cx="18.8571" cy="18.8571" r="18.4286" stroke="url(#paint1_radial_6_1086)" strokeOpacity="0.05" strokeWidth="0.857143" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6_1086" x1="0" x2="37.7143" y1="18.8571" y2="18.8571">
              <stop stopColor="#008FF7" />
              <stop offset="0.125" stopColor="#2D84F8" />
              <stop offset="0.25" stopColor="#5A79F9" />
              <stop offset="0.375" stopColor="#866EF9" />
              <stop offset="0.5" stopColor="#B363FA" />
              <stop offset="0.75" stopColor="#E44BC1" />
              <stop offset="0.875" stopColor="#EC4884" />
              <stop offset="1" stopColor="#F34546" />
            </linearGradient>
            <radialGradient cx="0" cy="0" gradientTransform="matrix(50.7752 -36.9203 5.14775 46.702 12.3653 25.209)" gradientUnits="userSpaceOnUse" id="paint1_radial_6_1086" r="1">
              <stop stopColor="#FFDD55" />
              <stop offset="0.1" stopColor="#FFDD55" />
              <stop offset="0.5" stopColor="#FF543E" />
              <stop offset="1" stopColor="#C837AB" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[34.813px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-[-0.725px] pointer-events-none rounded-[30.725px]" />
    </div>
  );
}

function FactoryIndustrialRobotArm1StreamlineUltimateRegularFree() {
  return (
    <div className="relative shrink-0 size-[17.407px]" data-name="Factory Industrial Robot Arm 1 Streamline Ultimate Regular - Free">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4066 17.4066">
        <g id="Factory Industrial Robot Arm 1 Streamline Ultimate Regular - Free">
          <path d={svgPaths.p2ed5d900} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p2c23e500} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p822d3f0} id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.pb242e80} id="Vector_4" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p3c5345c0} id="Vector_5" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p2a7f6e80} id="Vector_6" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p37798680} id="Vector_7" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p1eb42280} id="Vector_8" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p372f2c00} id="Vector_9" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p3d4dc800} id="Vector_10" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M1.05769 16.5234H16.3489" id="Vector_11" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p2caa2780} id="Vector_12" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <FactoryIndustrialRobotArm1StreamlineUltimateRegularFree />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[12.33%_8.33%_12.52%_12.52%]" data-name="Group">
      <div className="absolute inset-[-3.33%_-3.16%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6464 13.9502">
          <g id="Group">
            <path d={svgPaths.p323cd840} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.87033" />
            <path d={svgPaths.p3e292f00} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.87033" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LucideHammer() {
  return (
    <div className="overflow-clip relative shrink-0 size-[17.407px]" data-name="lucide:hammer">
      <Group />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <LucideHammer />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[34.813px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-[-0.362px] pointer-events-none rounded-[30.362px]" />
    </div>
  );
}

function CouchFurnitureStreamlineAtlasLine() {
  return (
    <div className="h-[15.956px] relative shrink-0 w-[23.209px]" data-name="Couch Furniture Streamline Atlas Line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.2088 15.956">
        <g id="Couch Furniture Streamline Atlas Line">
          <path d={svgPaths.p30343b80} id="Vector" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p1ff1d400} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p272bf70} id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d="M2.94643 12.7524V11.5619" id="Vector_4" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d="M19.392 12.7524V11.5619" id="Vector_5" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex h-[34.813px] items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <CouchFurnitureStreamlineAtlasLine />
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[34.813px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-solid border-white inset-0 pointer-events-none rounded-[30px]" />
    </div>
  );
}

function ShirtTankTopStreamlineIconoirRegular() {
  return (
    <div className="h-[17.407px] relative shrink-0 w-[15.956px]" data-name="Shirt Tank Top Streamline Iconoir Regular">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.956 17.4066">
        <g id="Shirt Tank Top Streamline Iconoir Regular">
          <path d={svgPaths.p2521d300} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.87033" />
          <path d="M4.59497 3.7826V1.32222" id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.87033" />
          <path d="M11.361 3.7826V1.32222" id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.87033" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <ShirtTankTopStreamlineIconoirRegular />
    </div>
  );
}

function LipstickFashionBeautyLipLipstickMakeupShopping() {
  return (
    <div className="h-[16.32px] relative shrink-0 w-[15.957px]" data-name="lipstick--fashion-beauty-lip-lipstick-makeup-shopping">
      <div className="absolute inset-[-2.22%_-2.27%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6822 17.0454">
          <g id="lipstick--fashion-beauty-lip-lipstick-makeup-shopping">
            <path d={svgPaths.p2e7020b0} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            <path d={svgPaths.p2c190800} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            <path d={svgPaths.p2e245000} id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex h-[34.813px] items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-solid border-white inset-0 pointer-events-none rounded-[30px]" />
      <LipstickFashionBeautyLipLipstickMakeupShopping />
    </div>
  );
}

function MineCart2OutdoorConstructionCartTravelPlaces() {
  return (
    <div className="h-[13.554px] relative shrink-0 w-[13.206px]" data-name="mine-cart-2--outdoor-construction-cart-travel-places">
      <div className="absolute inset-[-1.42%_-1.02%_-2.68%_-1.02%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.4747 14.1085">
          <g id="mine-cart-2--outdoor-construction-cart-travel-places">
            <path d={svgPaths.p2df18000} id="Ellipse 1176" stroke="var(--stroke-0, #56585D)" strokeWidth="0.725275" />
            <path d={svgPaths.p35bfe800} id="Ellipse 1177" stroke="var(--stroke-0, #56585D)" strokeWidth="0.725275" />
            <path d={svgPaths.pcbd3fc0} id="Vector 3463" stroke="var(--stroke-0, #56585D)" strokeWidth="0.725275" />
            <path d="M4.30468 12.0083H9.17006" id="Vector 3464" stroke="var(--stroke-0, #56585D)" strokeWidth="0.725275" />
            <path d={svgPaths.pb553880} id="Vector 3452" stroke="var(--stroke-0, #56585D)" strokeWidth="0.725275" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] content-stretch flex h-[34.813px] items-center justify-center px-[14.505px] py-[8.703px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <MineCart2OutdoorConstructionCartTravelPlaces />
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[34.813px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
    </div>
  );
}

function Frame15() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[34.813px] relative rounded-[30px] shrink-0 w-[46.418px]">
      <div aria-hidden="true" className="absolute border-[0.725px] border-[rgba(255,255,255,0.9)] border-solid inset-0 pointer-events-none rounded-[30px]" />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex gap-[9.429px] items-center left-[174.07px] top-[6.53px]">
      <Frame1 />
      <Frame2 />
      <Frame4 />
      <Frame5 />
      <Frame7 />
      <Frame8 />
      <Frame9 />
      <Frame12 />
      <Frame13 />
      <Frame14 />
      <Frame15 />
    </div>
  );
}

function TransparentRectangle() {
  return (
    <div className="absolute inset-[32.31%_54.46%_30.77%_43.69%]" data-name="_Transparent_Rectangle_">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4066 17.4066">
        <g id="_Transparent_Rectangle_">
          <g id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function MonitorStreamlineLucideLine() {
  return (
    <div className="absolute left-[354.66px] size-[20.308px] top-[14.51px]" data-name="Monitor Streamline Lucide Line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.3077 20.3077">
        <g id="Monitor Streamline Lucide Line">
          <path d={svgPaths.p203cb700} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M6.91026 17.4519H13.3974" id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M10.1538 14.2083V17.4519" id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function WheatHarvestStreamlineAtlasLine() {
  return (
    <div className="absolute left-[692.64px] size-[14.505px] top-[15.23px]" data-name="Wheat Harvest Streamline Atlas Line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.5055 14.5055">
        <g id="Wheat Harvest Streamline Atlas Line">
          <path d={svgPaths.p207d6200} id="Vector" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p35b88300} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p1b4a4a00} id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p64a4800} id="Vector_4" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p2ac873f2} id="Vector_5" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p17783780} id="Vector_6" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.p3c45d600} id="Vector_7" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
          <path d={svgPaths.pbf0f580} id="Vector_8" stroke="var(--stroke-0, #56585D)" strokeMiterlimit="10" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function SolarPanel2StreamlineTablerLine() {
  return (
    <div className="absolute left-[466.35px] size-[20.308px] top-[13.05px]" data-name="Solar Panel 2 Streamline Tabler Line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.3077 20.3077">
        <g id="Solar Panel 2 Streamline Tabler Line">
          <path d={svgPaths.p240298c0} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M3.66667 2.85577H4.47756" id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M15.8301 2.85577H16.641" id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M10.1538 7.72115V8.53205" id="Vector_4" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p82d4600} id="Vector_5" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p34b25340} id="Vector_6" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.paf53670} id="Vector_7" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M3.66667 14.2083H16.641" id="Vector_8" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p33428c00} id="Vector_9" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p6280700} id="Vector_10" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function CarStreamlineLucideLine() {
  return (
    <div className="absolute left-[186.4px] size-[21.758px] top-[13.05px]" data-name="Car Streamline Lucide Line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.7582 21.7582">
        <g id="Car Streamline Lucide Line">
          <path d={svgPaths.p3a5b7548} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p1eb89180} id="Vector_2" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d="M8.27267 15.2232H13.4856" id="Vector_3" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
          <path d={svgPaths.p23d6ff20} id="Vector_4" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
        </g>
      </svg>
    </div>
  );
}

function Image1() {
  return (
    <div className="absolute inset-[8.33%_8.5%_8.54%_8.34%]" data-name="Image">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9596 19.9498">
        <g id="Image">
          <g id="Group 3">
            <mask height="20" id="mask0_1_2599" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="20" x="0" y="0">
              <path clipRule="evenodd" d="M0 0H19.9596V19.9498H0V0Z" fill="var(--fill-0, white)" fillRule="evenodd" id="Clip 2" />
            </mask>
            <g mask="url(#mask0_1_2599)">
              <path clipRule="evenodd" d={svgPaths.p6e1500} fill="var(--fill-0, black)" fillRule="evenodd" id="Fill 1" />
            </g>
          </g>
          <path clipRule="evenodd" d={svgPaths.p1b39c638} fill="var(--fill-0, black)" fillRule="evenodd" id="Fill 4" />
          <path clipRule="evenodd" d={svgPaths.p249f1500} fill="var(--fill-0, black)" fillRule="evenodd" id="Fill 6" />
        </g>
      </svg>
    </div>
  );
}

function Mic01StrokeRounded1() {
  return <div className="opacity-70 shrink-0 size-[17.143px]" data-name="mic-01-stroke-rounded 1" />;
}

function Frame16() {
  return (
    <div className="absolute content-stretch flex items-center left-[calc(66.67%+7.71px)] top-[512.57px]">
      <Mic01StrokeRounded1 />
    </div>
  );
}

export default function LandingNotLoggedIn() {
  return (
    <div className="relative size-full" data-name="Landing- not logged in" style={{ backgroundImage: "linear-gradient(160.167deg, rgb(209, 230, 247) 21.897%, rgb(228, 239, 254) 46.759%, rgb(246, 251, 249) 70.561%)" }}>
      <Frame17 />
      <div className="absolute bg-[rgba(0,0,0,0)] h-[47.143px] left-[220.29px] overflow-clip rounded-[100px] shadow-[0px_1.451px_4.352px_0px_rgba(0,0,0,0.05)] top-[8.57px] w-[942.857px]" data-name="Menu component">
        <Frame18 />
        <Frame3 />
        <TransparentRectangle />
        <div className="absolute inset-[33.85%_19.08%_33.85%_79.31%]" data-name="Vector">
          <div className="absolute inset-[-2.38%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.956 15.956">
              <path d={svgPaths.p2244d00} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[38.46%_19.31%_38.46%_79.54%]" data-name="Vector">
          <div className="absolute inset-[-3.33%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6044 11.6044">
              <path d={svgPaths.pf74dd52} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[38.46%_19.31%_38.46%_79.54%]" data-name="Vector">
          <div className="absolute inset-[-3.33%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6044 11.6044">
              <path d={svgPaths.p223af540} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[33.85%_19.08%_49.23%_80.15%]" data-name="Vector">
          <div className="absolute inset-[-4.55%_-5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.97802 8.7033">
              <path d={svgPaths.p1ece3c00} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[50.77%_19.85%_33.85%_79.31%]" data-name="Vector">
          <div className="absolute inset-[-5%_-4.55%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.7033 7.97802">
              <path d={svgPaths.p18338550} id="Vector" stroke="var(--stroke-0, #56585D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.725275" />
            </svg>
          </div>
        </div>
        <MonitorStreamlineLucideLine />
        <WheatHarvestStreamlineAtlasLine />
        <SolarPanel2StreamlineTablerLine />
        <CarStreamlineLucideLine />
      </div>
      <div className="absolute left-[calc(66.67%+0.86px)] size-[20.571px] top-[507.43px]" data-name="Iconly/Regular/Outline/Image">
        <Image1 />
      </div>
      <Frame16 />
      <p className="absolute bg-clip-text font-['Urbanist:SemiBold',sans-serif] h-[16.286px] leading-[1.2] left-[calc(83.33%-83.14px)] not-italic text-[12.857px] text-[transparent] top-[24px] w-[36.857px]" style={{ backgroundImage: "linear-gradient(103.815deg, rgb(8, 148, 255) 0%, rgb(201, 89, 221) 34%, rgb(255, 46, 84) 68%, rgb(255, 144, 4) 100%)" }}>
        sign in
      </p>
    </div>
  );
}