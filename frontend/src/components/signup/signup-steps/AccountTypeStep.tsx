"use client";

import { motion } from "motion/react";
import { ShoppingCart, Store } from "lucide-react";
import { useLanguage } from "@/context/language";

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
  const { t } = useLanguage();

  const handleSelect = (type: "buyer" | "seller") => {
    onChange(type);
    // Auto-proceed after selection with slight delay for visual feedback
    setTimeout(() => onNext(), 400);
  };

  return (
    <div className="flex items-center justify-center w-full h-full px-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[720px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 text-center"
        >
          <h1 className="font-['Urbanist',sans-serif] font-semibold text-[28px] text-[#202425] leading-normal">
            {t("accountTypeTitle")}{" "}
            <span className="text-[#86868b]">{t("accountTypeSubtitle")}</span>
          </h1>
        </motion.div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.button
            onClick={() => handleSelect("buyer")}
            className={[
              "flex w-full max-w-[280px] items-center gap-4 rounded-2xl border bg-white px-6 py-6 text-left transition",
              value === "buyer" ? "border-[#0171e3]" : "border-black/10 hover:border-black/20",
            ].join(" ")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <div
              className={[
                "flex h-12 w-12 items-center justify-center rounded-xl",
                value === "buyer" ? "bg-[#0171e3]/10 text-[#0171e3]" : "bg-black/5 text-black/70",
              ].join(" ")}
            >
              <ShoppingCart className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <div className="flex flex-col">
              <span className="font-['Urbanist',sans-serif] text-[18px] font-semibold text-[#202425]">
                {t("buyer")}
              </span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => handleSelect("seller")}
            className={[
              "flex w-full max-w-[280px] items-center gap-4 rounded-2xl border bg-white px-6 py-6 text-left transition",
              value === "seller" ? "border-[#0171e3]" : "border-black/10 hover:border-black/20",
            ].join(" ")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <div
              className={[
                "flex h-12 w-12 items-center justify-center rounded-xl",
                value === "seller" ? "bg-[#0171e3]/10 text-[#0171e3]" : "bg-black/5 text-black/70",
              ].join(" ")}
            >
              <Store className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <div className="flex flex-col">
              <span className="font-['Urbanist',sans-serif] text-[18px] font-semibold text-[#202425]">
                {t("seller")}
              </span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
