function Group() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center leading-[0] left-0 not-italic text-[#202425] text-[24px] top-[18.5px] w-[400px]">
        <p>
          <span className="leading-[normal]">{`Bank details. `}</span>
          <span className="leading-[normal] text-[#86868b]">{`To get paid for sales and compensations. `}</span>
        </p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Bank Country</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">IBAN</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Confirm IBAN</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Swift/BIC Code</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Full Name in Bank</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="-translate-x-1/2 absolute bottom-0 contents left-1/2 top-[63px]">
      <div className="-translate-x-1/2 absolute bottom-[256px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[63px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame />
      </div>
      <div className="-translate-x-1/2 absolute bottom-[128px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[191px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame1 />
      </div>
      <div className="-translate-x-1/2 absolute bottom-[63px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[256px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame2 />
      </div>
      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[319px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame3 />
      </div>
      <div className="-translate-x-1/2 absolute bottom-[192px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[127px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame4 />
      </div>
    </div>
  );
}

export default function Group1() {
  return (
    <div className="relative size-full">
      <Group />
      <Group2 />
    </div>
  );
}