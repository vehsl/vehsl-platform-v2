"use client";

import { motion } from "motion/react";

type GenderStepProps = {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
};

const GENDERS = ["Male", "Female", "Other"];

export function GenderStep({ value, onChange, onNext, onPrev }: GenderStepProps) {
  const canProceed = value.length > 0;

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
            Gender.{" "}
            <span className="text-[#86868b]">How do you identify?</span>
          </h1>
        </motion.div>

        {/* Gender options */}
        <div className="flex gap-3 mb-8">
          {GENDERS.map((gender) => (
            <motion.button
              key={gender}
              onClick={() => onChange(gender)}
              className="flex-1 h-[50px] rounded-[20px] px-5 flex items-center justify-center"
              style={{
                background: "rgba(255, 255, 255, 0.07)",
                border:
                  value === gender
                    ? "2px solid #0171e3"
                    : "1px solid #86868b",
                boxShadow:
                  value === gender
                    ? "0px 0px 15px 0px rgba(1, 113, 227, 0.25)"
                    : "none",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span
                className={`font-['Urbanist',sans-serif] font-semibold text-[20px] ${
                  value === gender ? "text-[#202425]" : "text-[#86868b]"
                }`}
              >
                {gender}
              </span>
            </motion.button>
          ))}
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
