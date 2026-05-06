"use client";

import svgPaths from "./svg-ekercfieue";

function Span() {
  return (
    <div className="absolute bg-[rgba(232,232,237,0.6)] content-stretch flex h-[26.4px] items-start left-[327.84px] px-[16px] py-[6px] rounded-[26843500px] top-[24.4px] w-[64.325px]" data-name="span">
      <p className="font-['Urbanist:Medium',sans-serif] leading-[17.28px] not-italic relative shrink-0 text-[#86868b] text-[11.52px] text-center whitespace-nowrap">Today</p>
    </div>
  );
}

function Span1() {
  return (
    <div className="h-[15.6px] relative shrink-0 w-[7.763px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Bold',sans-serif] leading-[15.6px] left-0 not-italic text-[10.4px] text-white top-[0.6px] whitespace-nowrap">V</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute bg-gradient-to-b content-stretch flex from-[#0071e3] items-center justify-center left-0 pr-[0.013px] rounded-[26843500px] size-[32px] to-[#34a0ff] top-[4px]" data-name="Container">
      <Span1 />
    </div>
  );
}

function P() {
  return (
    <div className="h-[45.875px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[22.94px] left-0 not-italic text-[#1d1d1f] text-[14.8px] top-[-1.4px] tracking-[-0.074px] w-[387px]">{`Hi there! I'm from the Vehsl support team. How can I help you today?`}</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-white h-[73.875px] relative rounded-bl-[6px] rounded-br-[22px] rounded-tl-[22px] rounded-tr-[22px] shadow-[0px_1px_8px_0px_rgba(0,0,0,0.03)] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start pt-[14px] px-[20px] relative size-full">
        <P />
      </div>
    </div>
  );
}

function P1() {
  return (
    <div className="h-[16.313px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[16.32px] left-[8px] not-italic text-[#c7c7cc] text-[10.88px] top-[-0.4px] whitespace-nowrap">4:49 PM</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] h-[96.188px] items-start left-[42px] top-0 w-[462px]" data-name="Container">
      <Container3 />
      <P1 />
    </div>
  );
}

function Div1() {
  return (
    <div className="h-[96.188px] relative shrink-0 w-[504px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container1 />
        <Container2 />
      </div>
    </div>
  );
}

function MotionDiv1() {
  return (
    <div className="absolute content-stretch flex h-[96.188px] items-start left-[24px] top-[72px] w-[672px]" data-name="motion.div">
      <Div1 />
    </div>
  );
}

function Div2() {
  return (
    <div className="absolute bg-white border-[#e8e8ed] border-[0.8px] border-solid h-[45.6px] left-0 rounded-[26843500px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.02)] top-0 w-[177.938px]" data-name="div">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[19.68px] left-[88.5px] not-italic text-[#0071e3] text-[13.12px] text-center top-[11.8px] whitespace-nowrap">I need help with an order</p>
    </div>
  );
}

function MotionButton() {
  return (
    <div className="absolute h-[45.6px] left-[44px] top-0 w-[177.938px]" data-name="motion.button">
      <Div2 />
    </div>
  );
}

function Div3() {
  return (
    <div className="absolute bg-white border-[#e8e8ed] border-[0.8px] border-solid h-[45.6px] left-0 rounded-[26843500px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.02)] top-0 w-[182.863px]" data-name="div">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[19.68px] left-[91px] not-italic text-[#0071e3] text-[13.12px] text-center top-[11.8px] whitespace-nowrap">I have a shipping question</p>
    </div>
  );
}

function MotionButton1() {
  return (
    <div className="absolute h-[45.6px] left-[229.94px] top-0 w-[182.863px]" data-name="motion.button">
      <Div3 />
    </div>
  );
}

function Div4() {
  return (
    <div className="absolute bg-white border-[#e8e8ed] border-[0.8px] border-solid h-[45.6px] left-0 rounded-[26843500px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.02)] top-0 w-[181.813px]" data-name="div">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[19.68px] left-[90.5px] not-italic text-[#0071e3] text-[13.12px] text-center top-[11.8px] whitespace-nowrap">I want to return a product</p>
    </div>
  );
}

function MotionButton2() {
  return (
    <div className="absolute h-[45.6px] left-[420.8px] top-0 w-[181.813px]" data-name="motion.button">
      <Div4 />
    </div>
  );
}

function Div5() {
  return (
    <div className="absolute bg-white border-[#e8e8ed] border-[0.8px] border-solid h-[45.6px] left-0 rounded-[26843500px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.02)] top-0 w-[135.813px]" data-name="div">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[19.68px] left-[67.5px] not-italic text-[#0071e3] text-[13.12px] text-center top-[11.8px] whitespace-nowrap">I need help selling</p>
    </div>
  );
}

function MotionButton3() {
  return (
    <div className="absolute h-[45.6px] left-[44px] top-[53.6px] w-[135.813px]" data-name="motion.button">
      <Div5 />
    </div>
  );
}

function Div6() {
  return (
    <div className="absolute bg-white border-[#e8e8ed] border-[0.8px] border-solid h-[45.6px] left-0 rounded-[26843500px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.02)] top-0 w-[122.55px]" data-name="div">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Medium',sans-serif] leading-[19.68px] left-[60.5px] not-italic text-[#0071e3] text-[13.12px] text-center top-[11.8px] whitespace-nowrap">Something else</p>
    </div>
  );
}

function MotionButton4() {
  return (
    <div className="absolute h-[45.6px] left-[187.81px] top-[53.6px] w-[122.55px]" data-name="motion.button">
      <Div6 />
    </div>
  );
}

function MotionDiv2() {
  return (
    <div className="absolute h-[99.2px] left-[24px] top-[192.19px] w-[672px]" data-name="motion.div">
      <MotionButton />
      <MotionButton1 />
      <MotionButton2 />
      <MotionButton3 />
      <MotionButton4 />
    </div>
  );
}

function Container4() {
  return <div className="absolute h-0 left-[24px] top-[307.39px] w-[672px]" data-name="Container" />;
}

function Container() {
  return (
    <div className="h-[331.388px] relative shrink-0 w-full" data-name="Container">
      <Span />
      <MotionDiv1 />
      <MotionDiv2 />
      <Container4 />
    </div>
  );
}

function Div() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[1194.4px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip px-[237.2px] relative rounded-[inherit] size-full">
        <Container />
      </div>
    </div>
  );
}

function MotionDiv() {
  return (
    <div className="absolute bg-[#f5f5f7] content-stretch flex flex-col h-[729.6px] items-start left-0 pb-[113.113px] pt-[68px] top-0 w-[1194.4px]" data-name="motion.div">
      <Div />
    </div>
  );
}

function Paperclip() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Paperclip">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Paperclip">
          <path d="M9.9255 15.189L15.75 9.225" id="Vector" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p125c2100} id="Vector_2" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Div8() {
  return (
    <div className="h-[36px] relative rounded-[26843500px] shrink-0 w-full" data-name="div">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center relative size-full">
          <Paperclip />
        </div>
      </div>
    </div>
  );
}

function MotionButton5() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div8 />
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="flex-[1_0_0] h-[38.8px] min-h-px min-w-px relative" data-name="input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip py-[8px] relative rounded-[inherit] size-full">
        <p className="font-['Urbanist:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#c7c7cc] text-[15.2px] tracking-[-0.152px] whitespace-nowrap">knkl</p>
      </div>
    </div>
  );
}

function Smile() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Smile">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g clipPath="url(#clip0_87_6174)" id="Smile">
          <path d={svgPaths.p3dc49580} id="Vector" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d={svgPaths.p27e5c780} id="Vector_2" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6.75 6.75H6.7575" id="Vector_3" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M11.25 6.75H11.2575" id="Vector_4" stroke="var(--stroke-0, #86868B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_87_6174">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Div9() {
  return (
    <div className="content-stretch flex h-[36px] items-center justify-center relative rounded-[26843500px] shrink-0 w-full" data-name="div">
      <Smile />
    </div>
  );
}

function MotionButton6() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div9 />
      </div>
    </div>
  );
}

function Send() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Send">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_87_6180)" id="Send">
          <path d={svgPaths.p22f0380} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M14.5693 1.43133L7.276 8.724" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_87_6180">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function MotionDiv3() {
  return (
    <div className="bg-[#0071e3] content-stretch flex h-[36px] items-center justify-center relative rounded-[26843500px] shadow-[0px_2px_8px_0px_rgba(0,113,227,0.3)] shrink-0 w-full" data-name="motion.div">
      <Send />
    </div>
  );
}

function MotionButton7() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <MotionDiv3 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-white h-[54.8px] relative rounded-[22px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.04),0px_1px_4px_0px_rgba(0,0,0,0.02)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[16px] relative size-full">
          <MotionButton5 />
          <Input />
          <MotionButton6 />
          <MotionButton7 />
        </div>
      </div>
    </div>
  );
}

function P2() {
  return (
    <div className="h-[16.313px] relative shrink-0 w-full" data-name="p">
      <p className="-translate-x-1/2 absolute font-['Urbanist:Regular',sans-serif] leading-[16.32px] left-[360.49px] not-italic text-[#c7c7cc] text-[10.88px] text-center top-[-0.4px] whitespace-nowrap">Vehsl support team typically responds within 2 minutes</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[81.113px] items-start relative shrink-0 w-full" data-name="Container">
      <Container6 />
      <P2 />
    </div>
  );
}

function Div7() {
  return (
    <div className="absolute bg-[rgba(245,245,247,0.8)] content-stretch flex flex-col h-[113.113px] items-start left-0 pt-[8px] px-[237.2px] shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.03)] top-[616.49px] w-[1194.4px]" data-name="div">
      <Container5 />
    </div>
  );
}

function ArrowLeft() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="ArrowLeft">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="ArrowLeft">
          <path d="M9 14.25L3.75 9L9 3.75" id="Vector" stroke="var(--stroke-0, #1D1D1F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M14.25 9H3.75" id="Vector_2" stroke="var(--stroke-0, #1D1D1F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Div11() {
  return (
    <div className="bg-[#f5f5f7] content-stretch flex h-[40px] items-center justify-center relative rounded-[26843500px] shrink-0 w-full" data-name="div">
      <ArrowLeft />
    </div>
  );
}

function MotionButton8() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="motion.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Div11 />
      </div>
    </div>
  );
}

function Span2() {
  return (
    <div className="h-[19.2px] relative shrink-0 w-[9.55px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Bold',sans-serif] leading-[19.2px] left-0 not-italic text-[12.8px] text-white top-[-0.4px] whitespace-nowrap">V</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-gradient-to-b from-[#0071e3] relative rounded-[26843500px] shrink-0 size-[36px] to-[#34a0ff]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span2 />
      </div>
    </div>
  );
}

function P3() {
  return (
    <div className="content-stretch flex h-[19.238px] items-start overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="flex-[1_0_0] font-['Urbanist:SemiBold',sans-serif] leading-[19.24px] min-h-px min-w-px not-italic relative text-[#1d1d1f] text-[14.8px]">Vehsl Support</p>
    </div>
  );
}

function Container12() {
  return <div className="bg-[#34c759] rounded-[26843500px] shrink-0 size-[8px]" data-name="Container" />;
}

function P4() {
  return (
    <div className="flex-[1_0_0] h-[17.288px] min-h-px min-w-px relative" data-name="p">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Urbanist:Regular',sans-serif] leading-[17.28px] left-0 not-italic text-[#86868b] text-[11.52px] top-[-1.2px] whitespace-nowrap">Usually replies in 2 minutes</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[6px] h-[17.288px] items-center relative shrink-0 w-full" data-name="Container">
      <Container12 />
      <P4 />
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[36.525px] relative shrink-0 w-[147.375px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P3 />
        <Container11 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="flex-[1_0_0] h-[36.525px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container9 />
        <Container10 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[24px] relative size-full">
          <MotionButton8 />
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function Div10() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex flex-col h-[68px] items-start left-0 px-[237.2px] shadow-[0px_1px_0px_0px_rgba(0,0,0,0.04)] top-0 w-[1194.4px]" data-name="div">
      <Container7 />
    </div>
  );
}

export default function TypingInChat() {
  return (
    <div className="bg-white relative size-full" data-name="typing in chat">
      <MotionDiv />
      <Div7 />
      <Div10 />
    </div>
  );
}