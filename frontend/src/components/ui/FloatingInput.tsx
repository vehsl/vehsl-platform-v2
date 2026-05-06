"use client";

import { motion, useAnimation } from "motion/react";
import { useEffect } from "react";

type FloatingInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoFocus?: boolean;
};

export function FloatingInput({
  label,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  autoFocus,
}: FloatingInputProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (focused) {
      // Subtle bounce on focus
      controls.start({
        scale: [1, 1.01, 1],
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      });
    }
  }, [focused, controls]);

  const hasValue = value.length > 0;
  const isActive = focused || hasValue;

  return (
    <motion.div
      animate={controls}
      className="relative w-full h-[54px] rounded-[20px] px-5 pt-1 pb-4 flex items-end"
      style={{
        background: "rgba(255, 255, 255, 0.07)",
        border: focused
          ? "2px solid #0071e3"
          : hasValue
          ? "2px solid #0071e3"
          : "1px solid #86868b",
        boxShadow: focused ? "0px 0px 15px 0px rgba(1, 113, 227, 0.25)" : "none",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Label */}
      <motion.label
        initial={false}
        animate={{
          y: isActive ? -14 : 0,
          fontSize: isActive ? "11px" : "24px",
          color: isActive ? "#86868b" : "#86868b",
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute left-5 pointer-events-none font-['Urbanist',sans-serif] font-semibold leading-[14.571px]"
      >
        {label}
      </motion.label>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        aria-label={label}
        className="w-full bg-transparent border-none outline-none font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#202425] leading-[14.571px] placeholder-transparent"
      />
    </motion.div>
  );
}
