"use client";

function Elevator() {
  return <div className="bg-[#86868b] flex-[1_0_0] min-h-px min-w-px rounded-[50px] w-[12px]" data-name="Elevator" />;
}

function Spacer() {
  return <div className="flex-[1_0_0] min-h-px min-w-px rounded-[50px] w-[6px]" data-name="Spacer" />;
}

function Spacer1() {
  return <div className="flex-[1_0_0] min-h-px min-w-px rounded-[50px] w-[6px]" data-name="Spacer" />;
}

export default function Scrollbar() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(147,150,153,0.14)] content-stretch flex flex-col items-center justify-center relative rounded-[50px] size-full" data-name="Scrollbar">
      <Elevator />
      <Spacer />
      <Spacer1 />
    </div>
  );
}