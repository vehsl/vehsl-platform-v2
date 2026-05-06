"use client";

import { motion } from "motion/react";
import { ShoppingCart, Store } from "lucide-react";

type AccountTypeStepProps = {
  value: "buyer" | "seller" | "";
  onChange: (value: "buyer" | "seller") => void;
  onNext: () => void;
};

export function AccountTypeStep({
  value,
  onChange,
  onNext,
}: AccountTypeStepProps) {
  const handleSelect = (type: "buyer" | "seller") => {
    onChange(type);
    // Auto-proceed after selection with slight delay for visual feedback
    setTimeout(() => onNext(), 400);
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[500px] px-4"
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 text-center"
        >
          <h1 className="font-['Urbanist',sans-serif] font-semibold text-[32px] text-[#202425] leading-normal">
            Welcome.{" "}
            <span className="text-[#86868b]">Let's get started.</span>
          </h1>
          <p className="mt-3 font-['Urbanist',sans-serif] font-medium text-[18px] text-[#86868b]">
            What brings you here today?
          </p>
        </motion.div>

        {/* Account type options */}
        <div className="flex gap-6 justify-center">
          {/* Buyer */}
          <motion.button
            onClick={() => handleSelect("buyer")}
            className="relative w-[193px] h-[193px] rounded-full border border-[#86868b] bg-white overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-[#34C759]/10 to-transparent opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />

            <div className="relative flex flex-col items-center justify-center h-full gap-4">
              <ShoppingCart className="w-14 h-14 text-[#202425]" strokeWidth={1.5} />
              <span className="font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#202425]">
                Buyer
              </span>
            </div>

            {/* Active indicator */}
            {value === "buyer" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-4 right-4 w-10 h-6 rounded-full bg-[#34C759] flex items-center justify-center"
              >
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path
                    d="M1 6L6 11L15 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>

          {/* Seller */}
          <motion.button
            onClick={() => handleSelect("seller")}
            className="relative w-[193px] h-[193px] rounded-full border border-[#86868b] bg-white overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-[#0171e3]/10 to-transparent opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />

            <div className="relative flex flex-col items-center justify-center h-full gap-4">
              <Store className="w-14 h-14 text-[#202425]" strokeWidth={1.5} />
              <span className="font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#202425]">
                Seller
              </span>
            </div>

            {/* Active indicator */}
            {value === "seller" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-4 right-4 w-10 h-6 rounded-full bg-[#0171e3] flex items-center justify-center"
              >
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path
                    d="M1 6L6 11L15 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
