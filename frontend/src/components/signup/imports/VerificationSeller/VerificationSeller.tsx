import svgPaths from "./svg-iz4gu92qvi";

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
    <div className="absolute bg-[#86868b] content-stretch flex h-[32px] items-center justify-center left-[439px] p-[10.286px] rounded-[42.857px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] top-[373px] w-[50px]">
      <Group2 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[100px] top-[94.5px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center leading-[0] left-[100px] not-italic text-[#202425] text-[24px] top-[113px] w-[400px]">
        <p>
          <span className="leading-[normal]">{`Verifications. `}</span>
          <span className="leading-[normal] text-[#86868b]">Clear pictures.</span>
        </p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <ol>
          <li className="ms-[36px]">
            <span className="leading-[14.571px]">Select Verification Document</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <ol>
          <li className="ms-[36px]">
            <span className="leading-[14.571px]">Select Verification Document</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <ol>
          <li className="ms-[36px]">
            <span className="leading-[14.571px]">Business Verification Documents</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="-translate-x-1/2 absolute contents left-1/2 top-[159.5px]">
      <div className="-translate-x-1/2 absolute bottom-[225.5px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[159.5px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame1 />
      </div>
      <div className="-translate-x-1/2 absolute bottom-[157.5px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[227.5px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame2 />
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex h-[72px] items-center left-1/2 max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[295px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <div className="flex flex-row items-center self-stretch">
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[94.5px_100px_72px_100px]">
      <Group />
      <Group4 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[100px] top-[94.5px]">
      <Group1 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[100px] top-[94.5px]">
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