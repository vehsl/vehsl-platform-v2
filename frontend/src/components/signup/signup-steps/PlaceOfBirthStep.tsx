"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FloatingInput } from "@/components/ui/FloatingInput";

type PlaceOfBirthStepProps = {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function PlaceOfBirthStep({
  value,
  onChange,
  onNext,
  onPrev,
}: PlaceOfBirthStepProps) {
  const [focused, setFocused] = useState(false);

  const canProceed = value.trim().length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canProceed) {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canProceed, onNext]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-[400px] px-4"
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-7"
        >
          <h1 className="font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#202425] leading-normal">
            Place of birth.{" "}
            <span className="text-[#86868b]">Where were you born?</span>
          </h1>
        </motion.div>

        {/* Input field */}
        <div className="mb-8">
          <FloatingInput
            label="Place of birth"
            value={value}
            onChange={onChange}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={onPrev}
            className="flex-1 h-14 rounded-[20px] border-2 border-[#86868b] text-[#202425] font-['Urbanist',sans-serif] font-semibold text-[18px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>

          <motion.button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 h-14 rounded-[20px] bg-[#0171e3] text-white font-['Urbanist',sans-serif] font-semibold text-[18px] disabled:opacity-40"
            whileHover={canProceed ? { scale: 1.02 } : {}}
            whileTap={canProceed ? { scale: 0.98 } : {}}
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
