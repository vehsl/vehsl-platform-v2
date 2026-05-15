"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { KeyboardHint } from "@/components/ui/KeyboardHint";

type NameStepProps = {
  firstName: string;
  lastName: string;
  onChange: (data: { firstName?: string; lastName?: string }) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function NameStep({
  firstName,
  lastName,
  onChange,
  onNext,
  onPrev: _onPrev,
}: NameStepProps) {
  const [focusedField, setFocusedField] = useState<"firstName" | "lastName" | null>(null);

  const canProceed = firstName.trim().length > 0 && lastName.trim().length > 0;

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
        transition={{ duration: 0.3 }}
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
            Name.{" "}
            <span className="text-[#86868b]">Your legal name.</span>
          </h1>
        </motion.div>

        {/* Input fields */}
        <div className="flex flex-col gap-[14px]">
          <FloatingInput
            label="First Name"
            value={firstName}
            onChange={(value) => onChange({ firstName: value })}
            focused={focusedField === "firstName"}
            onFocus={() => setFocusedField("firstName")}
            onBlur={() => setFocusedField(null)}
            autoFocus
          />

          <FloatingInput
            label="Last Name"
            value={lastName}
            onChange={(value) => onChange({ lastName: value })}
            focused={focusedField === "lastName"}
            onFocus={() => setFocusedField("lastName")}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Next button */}
        <motion.button
          onClick={onNext}
          disabled={!canProceed}
          className="mt-8 w-full h-14 rounded-[20px] bg-[#0171e3] text-white font-['Urbanist',sans-serif] font-semibold text-[18px] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Continue
        </motion.button>

        {/* Keyboard hint */}
        {canProceed && <KeyboardHint />}
      </motion.div>
    </div>
  );
}
