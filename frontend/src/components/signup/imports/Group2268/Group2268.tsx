import svgPaths from "./svg-8yk5yd36pk";

function Frame1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">{`Occupation `}</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[360px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] h-full justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Company Name</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-[298px]">
      <div className="flex flex-[1_0_0] flex-col font-['Urbanist:SemiBold',sans-serif] justify-center leading-[0] min-w-px not-italic relative text-[#86868b] text-[24px]">
        <p className="leading-[14.571px]">Company Address</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-0 top-[63px]">
      <div className="-translate-x-1/2 absolute bottom-[128px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[63px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame1 />
      </div>
      <div className="-translate-x-1/2 absolute bottom-[64px] content-stretch flex items-center left-1/2 max-h-[54px] max-w-[400px] min-h-[54px] min-w-[400px] px-[20px] py-[16px] rounded-[20px] top-[127px]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame2 />
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex items-center justify-between left-0 max-w-[400px] min-w-[400px] pl-[20px] pr-[10px] py-[10px] right-0 rounded-[20px] top-[calc(50%+95.5px)]" data-name="Data slots-signup">
        <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
        <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <Frame />
        <div className="bg-[#86868b] content-stretch flex h-[34px] items-center justify-center p-[10.2px] relative rounded-[41.65px] shrink-0 w-[52px]" data-name="Proceed Arrow Button">
          <div className="h-[13.342px] relative shrink-0 w-[17px]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.9998 13.342">
              <path d={svgPaths.p875c200} fill="var(--fill-0, white)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <Group1 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center leading-[0] left-0 not-italic text-[#202425] text-[24px] top-[18.5px] w-[400px]">
        <p>
          <span className="leading-[normal]">{`Work Details. `}</span>
          <span className="leading-[normal] text-[#86868b]">Employment</span>
        </p>
      </div>
    </div>
  );
}