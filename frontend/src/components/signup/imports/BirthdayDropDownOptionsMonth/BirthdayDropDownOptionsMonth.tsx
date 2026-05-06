function GlassEffect() {
  return (
    <div className="absolute inset-[333px_100px_482px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] h-[21px] leading-[14.571px] left-[21px] not-italic text-[#86868b] text-[24px] top-[18px] w-[186px]">Place of birth</p>
    </div>
  );
}

function GlassEffect1() {
  return (
    <div className="absolute inset-[269px_376px_546px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[62px] not-italic text-[#86868b] text-[24px] text-center top-[17px] w-[60px]">Male</p>
    </div>
  );
}

function GlassEffect2() {
  return (
    <div className="absolute inset-[269px_238px_546px_238px] rounded-[12px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[12px]" />
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[61.5px] not-italic text-[#86868b] text-[24px] text-center top-[17px] w-[85px]">Female</p>
    </div>
  );
}

function GlassEffect3() {
  return (
    <div className="absolute inset-[269px_100px_546px_376px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[61.5px] not-italic text-[#86868b] text-[24px] text-center top-[17px] w-[95px]">Other</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[100px] top-[140px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[37px] justify-center leading-[0] left-[100px] not-italic text-[#202425] text-[24px] top-[158.5px] w-[100px]">
        <p className="leading-[normal]">Birthday.</p>
      </div>
    </div>
  );
}

function GlassEffect4() {
  return (
    <div className="absolute inset-[205px_100px_610px_376px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div aria-hidden="true" className="absolute border border-[#86868b] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[36px] not-italic text-[#86868b] text-[24px] top-[17px] w-[51px]">Year</p>
    </div>
  );
}

function GlassEffect5() {
  return (
    <div className="absolute inset-[205px_438px_610px_100px] rounded-[20px]" data-name="Glass Effect">
      <div aria-hidden="true" className="absolute bg-[rgba(255,255,255,0.07)] inset-0 mix-blend-screen pointer-events-none rounded-[20px]" />
      <div aria-hidden="true" className="absolute border-2 border-[#0171e3] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[31px] not-italic text-[#202425] text-[24px] text-center top-[17px] w-[32px]">17</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[205px_100px_610px_100px]">
      <GlassEffect4 />
      <GlassEffect5 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[100px] top-[140px]">
      <Group />
      <Group1 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[-1px] top-[119px]">
      <div className="absolute bg-[#d9d9d9] h-[40px] left-px rounded-[1px] top-[121px] w-[184px]" />
      <div className="absolute bg-[#d9d9d9] h-[40px] left-px rounded-[1px] top-[201px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-px rounded-[1px] top-[241px] w-[184px]" />
      <div className="absolute bg-[#d9d9d9] h-[40px] left-px rounded-[1px] top-[281px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-px rounded-[1px] top-[161px] w-[184px]" />
      <div className="absolute bg-[#d9d9d9] h-[40px] left-px rounded-[1px] top-[361px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-px rounded-[1px] top-[401px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-px rounded-[1px] top-[321px] w-[184px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[133px] w-[85.592px]">March</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[173px] w-[85.592px]">April</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[213px] w-[85.592px]">May</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[253px] w-[85.592px]">June</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[293px] w-[85.592px]">July</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.14px] not-italic text-[#86868b] text-[24px] text-center top-[333px] w-[85.592px]">August</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.64px] not-italic text-[#86868b] text-[24px] text-center top-[373px] w-[134.933px]">September</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[92.13px] not-italic text-[#86868b] text-[24px] text-center top-[413px] w-[113.787px]">October</p>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[-1px] top-[439px]">
      <div className="absolute bg-[#d9d9d9] h-[40px] left-px rounded-[1px] top-[441px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-px rounded-[1px] top-[481px] w-[184px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[93.64px] not-italic text-[#86868b] text-[24px] text-center top-[453px] w-[120.836px]">November</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[95.15px] not-italic text-[#86868b] text-[24px] text-center top-[493px] w-[117.815px]">December</p>
    </div>
  );
}

function GlassEffect6() {
  return (
    <div className="absolute bg-gradient-to-b border-2 border-[#0171e3] border-solid from-[12.092%] from-[rgba(181,229,255,0.1)] inset-[205px_238px_140px_176px] overflow-clip rounded-[20px] shadow-[0px_0px_15px_0px_rgba(1,113,227,0.25)] to-[rgba(249,171,231,0.05)] via-[78.202%] via-[rgba(225,169,246,0.05)]" data-name="Glass Effect">
      <div className="absolute bg-[#d9d9d9] h-[40px] left-[-1px] rounded-[1px] top-[39px] w-[184px]" />
      <div className="absolute bg-[rgba(217,217,217,0.4)] h-[40px] left-[-1px] rounded-[1px] top-[79px] w-[184px]" />
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[20px] leading-[14.571px] left-[90px] not-italic text-[#202425] text-[24px] text-center top-[15px] w-[116px]">Month</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] h-[16px] leading-[14.571px] left-[90px] not-italic text-[#86868b] text-[24px] text-center top-[51px] w-[100px]">January</p>
      <p className="-translate-x-1/2 absolute font-['Urbanist:SemiBold',sans-serif] leading-[14.571px] left-[90px] not-italic text-[#86868b] text-[24px] text-center top-[92px] w-[100px]">February</p>
      <Group3 />
      <Group4 />
    </div>
  );
}

export default function BirthdayDropDownOptionsMonth() {
  return (
    <div className="bg-white relative size-full" data-name="Birthday drop down options - month">
      <GlassEffect />
      <GlassEffect1 />
      <GlassEffect2 />
      <GlassEffect3 />
      <Group2 />
      <GlassEffect6 />
    </div>
  );
}