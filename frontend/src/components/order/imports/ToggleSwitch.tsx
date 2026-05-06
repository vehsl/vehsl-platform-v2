"use client";

function Frame() {
  return (
    <div className="absolute h-[10px] left-[41px] top-[9px] w-[21px]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 10">
        <g id="Frame">
          <circle cx="10.5" cy="5" id="AX Label" r="4.5" stroke="var(--stroke-0, #ABAFB2)" />
        </g>
      </svg>
    </div>
  );
}

function Knob() {
  return <div className="absolute bg-white bottom-[7.14%] left-[2px] rounded-[100px] top-[7.14%] w-[39px]" data-name="Knob" />;
}

export default function ToggleSwitch() {
  return (
    <div className="bg-[rgba(60,60,67,0.3)] overflow-clip relative rounded-[100px] size-full" data-name="Toggle - Switch">
      <Frame />
      <Knob />
    </div>
  );
}