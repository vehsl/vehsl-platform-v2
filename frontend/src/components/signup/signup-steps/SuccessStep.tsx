"use client";

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

type SuccessStepProps = {
  accountType: "buyer" | "seller" | "";
  firstName: string;
};

export function SuccessStep({ accountType, firstName }: SuccessStepProps) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[500px] px-4 text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-[#34C759]"
            />
            <CheckCircle2 className="relative w-24 h-24 text-[#34C759]" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-['Urbanist',sans-serif] font-semibold text-[32px] text-[#202425] leading-normal mb-3">
            Welcome aboard, {firstName}!
          </h1>
          <p className="font-['Urbanist',sans-serif] font-medium text-[20px] text-[#86868b] mb-8">
            {accountType === "seller"
              ? "Your seller account is being set up. We'll notify you once everything is ready."
              : "You're all set! Start exploring and find what you're looking for."}
          </p>
        </motion.div>

        {/* Action button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => window.location.reload()}
          className="w-full max-w-[300px] h-14 rounded-[20px] bg-[#0171e3] text-white font-['Urbanist',sans-serif] font-semibold text-[18px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>

        {/* Decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex justify-center gap-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-[#86868b]/30"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
