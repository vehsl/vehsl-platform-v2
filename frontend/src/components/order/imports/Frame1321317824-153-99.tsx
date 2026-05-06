"use client";

import svgPaths from "./svg-zrrhymybp4";

function Group() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[calc(50%-27px)] mt-[calc(50%-14.5px)] place-items-start relative row-1">
      <div className="col-1 flex flex-col font-['Urbanist:SemiBold',sans-serif] justify-center ml-0 mt-0 not-italic relative row-1 text-[#b4ef78] text-[24px] text-center tracking-[0.0365px] whitespace-nowrap">
        <p className="leading-[normal]">100%</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute left-0 size-[100.001px] top-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100.001 100.001">
        <g id="Group 2444">
          <g clipPath="url(#paint0_angular_152_17_clip_path)" data-figma-skip-parse="true">
            <g transform="matrix(0 0.0500006 -0.0500006 0 50.0006 50.0006)" />
          </g>
          <path d={svgPaths.p3bf79100} data-figma-gradient-fill="{'type':'GRADIENT_ANGULAR','stops':[{'color':{'r':0.99215686321258545,'g':0.76470589637756348,'b':0.74901962280273438,'a':1.0},'position':0.096153847873210907},{'color':{'r':0.33725491166114807,'g':0.84313726425170898,'b':0.91764706373214722,'a':1.0},'position':0.30288460850715637},{'color':{'r':0.80000001192092896,'g':0.93725490570068359,'b':0.65882354974746704,'a':1.0},'position':0.94999998807907104}],'stopsVar':[{'color':{'r':0.99215686321258545,'g':0.76470589637756348,'b':0.74901962280273438,'a':1.0},'position':0.096153847873210907},{'color':{'r':0.33725491166114807,'g':0.84313726425170898,'b':0.91764706373214722,'a':1.0},'position':0.30288460850715637},{'color':{'r':0.80000001192092896,'g':0.93725490570068359,'b':0.65882354974746704,'a':1.0},'position':0.94999998807907104}],'transform':{'m00':6.1233049372373758e-15,'m01':-100.00115203857422,'m02':100.00115203857422,'m10':100.00115203857422,'m11':6.1233049372373758e-15,'m12':1.1640920172251157e-10},'opacity':1.0,'blendMode':'NORMAL','visible':true}" id="Union" />
        </g>
        <defs>
          <clipPath id="paint0_angular_152_17_clip_path">
            <path d={svgPaths.p3bf79100} id="Union" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[11.444px] items-center justify-center px-[27.466px] py-[33.189px] relative size-full">
      <Group1 />
      <Group2 />
    </div>
  );
}