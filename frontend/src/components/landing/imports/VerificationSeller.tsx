"use client";

import svgPaths from "./svg-8k4rogd95l";

function Group() {
  return (
    <div className="absolute contents left-[100px] top-[66px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center leading-[0] left-[100px] not-italic text-[#202425] text-[24px] top-[84.5px] w-[400px]">
        <p>
          <span className="leading-[normal]">{`Verifications. `}</span>
          <span className="leading-[normal] text-[#86868b]">Clear pictures.</span>
        </p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[100px] top-[66px]">
      <Group />
    </div>
  );
}

function Group2() {
  return (
    <div className="relative shrink-0 size-[14px]">
      <div className="absolute inset-[-5.36%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.5 15.5">
          <g id="Group 2247">
            <path d="M5.75 5.75H5.75762" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.75 5.75H9.75762" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
            <path d={svgPaths.p15a3ef18} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
            <path d={svgPaths.p12a72800} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-[#86868b] content-stretch flex h-[32px] items-center justify-center left-[444px] p-[10.286px] rounded-[42.857px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] top-[316px] w-[50px]">
      <Group2 />
    </div>
  );
}

function GlassEffect() {
  return (
    <div className="absolute inset-[131px_100px_258px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] h-[21px] leading-[14.571px] left-[21px] not-italic text-[#86868b] text-[24px] top-[18px] w-[334px]">1. Select Verification Document</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function GlassEffect1() {
  return (
    <div className="absolute inset-[195px_100px_194px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] h-[21px] leading-[14.571px] left-[21px] not-italic text-[#86868b] text-[24px] top-[18px] w-[340px]">2. Select Verification Document</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[131px_100px_194px_100px]">
      <GlassEffect />
      <GlassEffect1 />
    </div>
  );
}

function GlassEffect2() {
  return (
    <div className="absolute inset-[259px_100px_130px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Urbanist:SemiBold',sans-serif] h-[21px] leading-[14.571px] left-[21px] not-italic text-[#86868b] text-[24px] top-[18px] w-[373px]">3. Business Verification Documents</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents inset-[131px_100px_130px_100px]">
      <Group4 />
      <GlassEffect2 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[100px] top-[66px]">
      <Group1 />
      <Frame />
      <Group5 />
    </div>
  );
}

export default function VerificationSeller() {
  return (
    <div className="bg-white relative size-full" data-name="Verification Seller">
      <Group3 />
    </div>
  );
}