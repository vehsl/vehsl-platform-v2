"use client";

const imgCustomIconDefault = "/figma/9ee404c0ae57001eef8b631f83a9acce5f986f38.png";

function GlassEffect() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function TitleAndDescription() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative self-stretch text-[15px] text-white tracking-[-0.23px]" data-name="Title and Description">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] h-[17.5px] leading-[17px] relative shrink-0 w-[235.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Title
      </p>
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[17.5px] leading-[18px] relative shrink-0 w-[309.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Description
      </p>
    </div>
  );
}

function TimeAndImage() {
  return (
    <div className="content-stretch flex flex-col gap-[5.5px] items-end relative shrink-0" data-name="Time and Image">
      <div className="content-stretch flex items-center justify-center mix-blend-plus-lighter relative shrink-0" data-name="Time">
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[17px] relative shrink-0 text-[#4d4d4d] text-[15px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          9:41 AM
        </p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-center min-h-px min-w-px relative" data-name="Frame">
      <TitleAndDescription />
      <TimeAndImage />
    </div>
  );
}

function GlassEffect1() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function TitleAndDescription1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative self-stretch text-[15px] text-white tracking-[-0.23px]" data-name="Title and Description">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] h-[17.5px] leading-[17px] relative shrink-0 w-[235.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Title
      </p>
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[17.5px] leading-[18px] relative shrink-0 w-[309.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Description
      </p>
    </div>
  );
}

function TimeAndImage1() {
  return (
    <div className="content-stretch flex flex-col gap-[5.5px] items-end relative shrink-0" data-name="Time and Image">
      <div className="content-stretch flex items-center justify-center mix-blend-plus-lighter relative shrink-0" data-name="Time">
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[17px] relative shrink-0 text-[#4d4d4d] text-[15px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          9:41 AM
        </p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-center min-h-px min-w-px relative" data-name="Frame">
      <TitleAndDescription1 />
      <TimeAndImage1 />
    </div>
  );
}

function GlassEffect2() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function Banner() {
  return (
    <div className="absolute bottom-[0.33px] content-stretch flex flex-col h-[8px] items-center justify-end left-0 opacity-90 overflow-clip px-[20px] right-0 rounded-[24px]" data-name="Banner">
      <div className="h-[64px] relative shrink-0 w-full" data-name="Clear Glass">
        <GlassEffect2 />
      </div>
    </div>
  );
}

function GlassEffect3() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function TitleAndDescription2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-h-px min-w-px relative text-[15px] text-white tracking-[-0.23px]" data-name="Title and Description">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[17px] relative shrink-0 w-[235.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Title
      </p>
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[18px] min-w-full relative shrink-0 w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Description
      </p>
    </div>
  );
}

function TimeAndImage2() {
  return (
    <div className="content-stretch flex flex-col gap-[5.5px] items-end relative shrink-0" data-name="Time and Image">
      <div className="content-stretch flex items-center justify-center mix-blend-plus-lighter relative shrink-0 w-full" data-name="Time">
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[17px] relative shrink-0 text-[#4d4d4d] text-[15px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          9:41 AM
        </p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-start justify-center min-h-px min-w-px relative" data-name="Frame">
      <TitleAndDescription2 />
      <TimeAndImage2 />
    </div>
  );
}

function GlassEffect4() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function Banner1() {
  return (
    <div className="absolute bottom-[-1.67px] content-stretch flex flex-col h-[8px] items-center justify-end left-0 opacity-80 overflow-clip px-[40px] right-0 rounded-[24px]" data-name="Banner">
      <div className="h-[64px] relative shrink-0 w-full" data-name="Clear Glass">
        <GlassEffect4 />
      </div>
    </div>
  );
}

function GlassEffect5() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function Banner2() {
  return (
    <div className="absolute bottom-[6.33px] content-stretch flex flex-col h-[8px] items-center justify-end left-0 opacity-90 overflow-clip px-[20px] right-0 rounded-[24px]" data-name="Banner">
      <div className="h-[64px] relative shrink-0 w-full" data-name="Clear Glass">
        <GlassEffect5 />
      </div>
    </div>
  );
}

function GlassEffect6() {
  return <div className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen rounded-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)]" data-name="Glass Effect" />;
}

function TitleAndDescription3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-center min-h-px min-w-px relative text-[15px] text-white tracking-[-0.23px]" data-name="Title and Description">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[17px] relative shrink-0 w-[235.667px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Title
      </p>
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[18px] min-w-full relative shrink-0 w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Description
      </p>
    </div>
  );
}

function TimeAndImage3() {
  return (
    <div className="content-stretch flex flex-col gap-[5.5px] items-end relative shrink-0" data-name="Time and Image">
      <div className="content-stretch flex items-center justify-center mix-blend-plus-lighter relative shrink-0" data-name="Time">
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[17px] relative shrink-0 text-[#4d4d4d] text-[15px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          9:41 AM
        </p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-start justify-center min-h-px min-w-px relative" data-name="Frame">
      <TitleAndDescription3 />
      <TimeAndImage3 />
    </div>
  );
}

export default function NotificationCollapsedNotificationList() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex flex-col gap-[20px] items-start p-[20px] relative rounded-[5px] size-full" data-name="Notification - Collapsed/Notification - List">
      <div aria-hidden="true" className="absolute border border-[#6155f5] border-dashed inset-0 pointer-events-none rounded-[5px]" />
      <div className="absolute bg-[rgba(0,0,0,0.05)] blur-[50px] inset-[-10px_0_-17.33px_0]" data-name="Shadow" />
      <div className="min-h-[64px] relative rounded-[24px] shrink-0 w-full" data-name="Notification - Collapsed">
        <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center min-h-[inherit] px-[14px] py-[12px] relative w-full">
            <GlassEffect />
            <div className="overflow-clip relative shrink-0 size-[38.333px]" data-name="Icon">
              <div className="-translate-x-1/2 absolute aspect-[256/256] bottom-0 left-1/2 top-0" data-name="Custom-Icon-Default">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCustomIconDefault} />
              </div>
            </div>
            <Frame />
          </div>
        </div>
      </div>
      <div className="min-h-[64px] relative rounded-[24px] shrink-0 w-full" data-name="Notification - Collapsed">
        <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center min-h-[inherit] px-[14px] py-[12px] relative w-full">
            <GlassEffect1 />
            <div className="overflow-clip relative shrink-0 size-[38.333px]" data-name="Icon">
              <div className="-translate-x-1/2 absolute aspect-[256/256] bottom-0 left-1/2 top-0" data-name="Custom-Icon-Default">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCustomIconDefault} />
              </div>
            </div>
            <Frame1 />
          </div>
        </div>
      </div>
      <div className="relative rounded-[24px] shrink-0 w-full" data-name="Notification - Collapsed">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center pb-[21px] pt-[12px] px-[14px] relative w-full">
            <Banner />
            <div className="absolute inset-[0_0_8.33px_0]" data-name="Clear Glass">
              <GlassEffect3 />
            </div>
            <div className="overflow-clip relative shrink-0 size-[38.333px]" data-name="Icon">
              <div className="-translate-x-1/2 absolute aspect-[256/256] bottom-0 left-1/2 top-0" data-name="Custom-Icon-Default">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCustomIconDefault} />
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
              <Frame2 />
            </div>
          </div>
        </div>
      </div>
      <div className="relative rounded-[24px] shrink-0 w-full" data-name="Notification - Collapsed">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[10px] items-center justify-center pb-[27px] pt-[12px] px-[14px] relative w-full">
            <Banner1 />
            <Banner2 />
            <div className="absolute inset-[0_0_14.33px_0]" data-name="Clear Glass">
              <GlassEffect6 />
            </div>
            <div className="overflow-clip relative shrink-0 size-[38.333px]" data-name="Icon">
              <div className="-translate-x-1/2 absolute aspect-[256/256] bottom-0 left-1/2 top-0" data-name="Custom-Icon-Default">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCustomIconDefault} />
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
              <Frame3 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}