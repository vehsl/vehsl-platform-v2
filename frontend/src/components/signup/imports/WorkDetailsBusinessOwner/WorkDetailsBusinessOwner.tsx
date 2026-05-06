function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center ml-0 mt-0 not-italic relative row-1 text-[#202425] text-[24px] w-[400px]">
        <p>
          <span className="leading-[normal]">{`Work Details. `}</span>
          <span className="leading-[normal] text-[#86868b]">Business ownership</span>
        </p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Industry</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Business Name</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Business Address</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="col-1 content-stretch flex h-[54px] items-center max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] ml-0 mt-0 px-[20px] py-[16px] relative rounded-[20px] row-1" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame />
      </div>
      <div className="col-1 content-stretch flex h-[54px] items-center max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] ml-0 mt-[68px] px-[20px] py-[16px] relative rounded-[20px] row-1" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame1 />
      </div>
      <div className="col-1 content-stretch flex h-[54px] items-center max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] ml-0 mt-[136px] px-[20px] py-[16px] relative rounded-[20px] row-1" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame2 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Your Beneficial Ownership %</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
      <Group1 />
      <div className="h-[54px] max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] relative rounded-[20px] shrink-0 w-full" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <div className="flex flex-row items-center max-h-[inherit] max-w-[inherit] min-h-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex items-center max-h-[inherit] max-w-[inherit] min-h-[inherit] min-w-[inherit] px-[20px] py-[16px] relative size-full">
            <Frame3 />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[28px] items-start left-[100px] top-[58px] w-[400px]">
      <Group />
      <Frame4 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[100px] top-[58px]">
      <Frame5 />
    </div>
  );
}

export default function WorkDetailsBusinessOwner() {
  return (
    <div className="bg-white relative size-full" data-name="Work Details- Business owner">
      <Group2 />
    </div>
  );
}