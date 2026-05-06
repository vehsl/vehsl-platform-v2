export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute bg-[rgba(218,218,218,0.5)] h-[386px] left-0 rounded-[40px] top-0 w-[609px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Urbanist:SemiBold',sans-serif] h-[290px] justify-center leading-[0] left-[305px] not-italic text-[#202425] text-[0px] text-center top-[201px] w-[474px] whitespace-pre-wrap">
        <p className="leading-[normal] mb-0 text-[24px]">{`Politically Exposed Person `}</p>
        <p className="leading-[normal] mb-0 text-[24px]">​</p>
        <p className="mb-0 text-[20px]">
          <span className="leading-[normal] text-[#202425]">{`Select "Yes" only if you, your family member, or your close associate hold (or have held) a prominent public position`}</span>
          <span className="leading-[normal] text-[#86868b]">{` (e.g., a senior government, judicial, or military official, or a Member of Parliament).`}</span>
        </p>
        <p className="leading-[normal] text-[24px]">​</p>
      </div>
    </div>
  );
}