function Frame3() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-px relative size-full">
          <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#86868b] text-[11px] w-[175px]">
            <p className="leading-[14.571px]">First Name</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-px items-start justify-center min-w-px relative">
      <Frame3 />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-end leading-[0] min-h-[18px] not-italic relative shrink-0 text-[#202425] text-[24px] w-full">
        <p className="leading-[14.571px]">Muhammad Junaid Iqbal</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-px relative size-full">
          <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#86868b] text-[11px] w-[175px]">
            <p className="leading-[14.571px]">Last Name</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-px items-start justify-center min-w-px relative">
      <Frame5 />
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-end leading-[0] min-h-[18px] not-italic relative shrink-0 text-[#202425] text-[24px] w-full">
        <p className="leading-[14.571px]">Khan</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0">
      <div className="content-stretch flex items-start max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] pb-[16px] pt-[4px] px-[20px] relative rounded-[20px] shrink-0 w-[400px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#0071e3] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame2 />
      </div>
      <div className="content-stretch flex items-start max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] pb-[16px] pt-[4px] px-[20px] relative rounded-[20px] shrink-0 w-[400px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border-2 border-[#0071e3] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame4 />
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex flex-col gap-[28px] items-start left-[100px] top-[calc(50%-0.5px)] w-[400px]">
      <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#202425] text-[24px] w-[min-content]">
        <p>
          <span className="leading-[normal]">Name.</span>
          <span className="leading-[normal] text-[#86868b]">{` Your legal name.`}</span>
          <span className="leading-[normal]">{` `}</span>
        </p>
      </div>
      <Frame1 />
    </div>
  );
}

export default function SignUpEnteringLastNameColorChangeAndSoftAnnimation() {
  return (
    <div className="bg-white relative size-full" data-name="Sign up-entering last name-color change and soft annimation">
      <Frame />
    </div>
  );
}