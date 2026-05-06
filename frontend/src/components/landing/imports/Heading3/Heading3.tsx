// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import imgImageBlur from "./55451ec36cb2985fbacf356d0ed1bc1dcdce52b4.png";

export default function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start py-[1.9px] relative size-full" data-name="Heading 3">
      <div className="absolute blur-[15px] inset-[-66.33%_-29.97%_-29.73%_-30.03%]" data-name="Image+Blur">
        <div className="absolute inset-0 opacity-80 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgImageBlur} />
        </div>
      </div>
    </div>
  );
}
