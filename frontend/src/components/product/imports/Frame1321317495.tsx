"use client";

function Frame1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <div className="bg-[rgba(229,195,227,0.9)] rounded-[5px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[23px] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black w-[221px]">
        <p>
          <span className="leading-[24px] text-[20px]">$16.1</span>
          <span className="leading-[24px] text-[16px]">{` - Lowest price per unit`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <div className="bg-[rgba(229,195,227,0.9)] rounded-[5px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[23px] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black w-[281px]">
        <p>
          <span className="leading-[24px] text-[20px]">$17.9</span>
          <span className="leading-[24px] text-[16px]">{` - 10 units`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <div className="bg-[rgba(0,0,0,0.9)] rounded-[30px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[23px] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black w-[343px]">
        <p>
          <span className="leading-[24px] text-[20px]">$17.5</span>
          <span className="leading-[24px] text-[16px]">{` - 4 Cartons (80 units)`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <div className="bg-[rgba(229,195,227,0.9)] rounded-[5px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[23px] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black w-[294px]">
        <p>
          <span className="leading-[24px] text-[20px]">$16.9</span>
          <span className="leading-[24px] text-[16px]">{` - Full pallet (12 cartons)`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <div className="bg-[rgba(229,195,227,0.9)] rounded-[5px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black whitespace-nowrap">
        <p>
          <span className="leading-[24px] text-[20px]">$16.4</span>
          <span className="leading-[24px] text-[16px]">{` - Full container load (20ft) (6 pallets)`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
      <div className="bg-[rgba(229,195,227,0.9)] rounded-[5px] shrink-0 size-[24px]" />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[23px] justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-black w-[355px]">
        <p>
          <span className="leading-[24px] text-[20px]">$16.1</span>
          <span className="leading-[24px] text-[16px]">{` - Full container load (HC 40ft)(12 pallets)`}</span>
        </p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="col-1 content-stretch flex flex-col gap-[16px] items-start justify-center ml-0 mt-0 relative row-1 w-[376px]">
      <Frame1 />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
      <Frame6 />
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
      <Frame7 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full">
      <Group />
    </div>
  );
}

export default function Frame8() {
  return (
    <div className="bg-[rgba(254,217,251,0.9)] content-stretch flex flex-col items-start p-[26px] relative rounded-[25px] shadow-[0px_4px_15px_0px_rgba(254,217,251,0.5)] size-full">
      <Frame />
    </div>
  );
}