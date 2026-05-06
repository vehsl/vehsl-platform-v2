"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

type BirthdayStepProps = {
  day: string;
  month: string;
  year: string;
  onChange: (data: { day?: string; month?: string; year?: string }) => void;
  onNext: () => void;
  onPrev: () => void;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 100 }, (_, i) => String(2008 - i));

export function BirthdayStep({
  day,
  month,
  year,
  onChange,
  onNext,
  onPrev,
}: BirthdayStepProps) {
  const [openDropdown, setOpenDropdown] = useState<"day" | "month" | "year" | null>(null);

  const canProceed = day && month && year;

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
            Birthday.
          </h1>
        </motion.div>

        {/* Dropdowns */}
        <div className="flex gap-3 mb-8">
          <DropdownSelect
            label="Day"
            value={day}
            options={DAYS}
            onChange={(value) => onChange({ day: value })}
            isOpen={openDropdown === "day"}
            onToggle={() =>
              setOpenDropdown(openDropdown === "day" ? null : "day")
            }
          />

          <DropdownSelect
            label="Month"
            value={month}
            options={MONTHS}
            onChange={(value) => onChange({ month: value })}
            isOpen={openDropdown === "month"}
            onToggle={() =>
              setOpenDropdown(openDropdown === "month" ? null : "month")
            }
          />

          <DropdownSelect
            label="Year"
            value={year}
            options={YEARS}
            onChange={(value) => onChange({ year: value })}
            isOpen={openDropdown === "year"}
            onToggle={() =>
              setOpenDropdown(openDropdown === "year" ? null : "year")
            }
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

function DropdownSelect({
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={containerRef} className="relative flex-1">
      <motion.button
        onClick={onToggle}
        className="w-full h-[54px] rounded-[20px] px-5 flex items-center justify-between"
        style={{
          background: "rgba(255, 255, 255, 0.07)",
          border: isOpen
            ? "2px solid #0171e3"
            : value
            ? "2px solid #0171e3"
            : "1px solid #86868b",
          boxShadow: isOpen ? "0px 0px 15px 0px rgba(1, 113, 227, 0.25)" : "none",
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span
          className={`font-['Urbanist',sans-serif] font-semibold ${
            value ? "text-[#202425] text-[24px]" : "text-[#86868b] text-[24px]"
          }`}
        >
          {value || label}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[#86868b]" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-[300px] overflow-y-auto rounded-[20px] border-2 border-[#0171e3] bg-white shadow-[0px_0px_15px_0px_rgba(1,113,227,0.25)] z-50 scrollbar-thin scrollbar-thumb-[#86868b]/30 scrollbar-track-transparent"
            style={{
              background:
                "linear-gradient(180deg, rgba(181, 229, 255, 0.1) 12.092%, rgba(225, 169, 246, 0.05) 78.202%, rgba(249, 171, 231, 0.05) 100%)",
              scrollBehavior: "smooth",
            }}
          >
            <div className="p-2">
              {options.map((option, index) => (
                <motion.button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    onToggle();
                  }}
                  className="w-full px-4 py-2.5 text-left rounded-lg font-['Urbanist',sans-serif] font-semibold text-[20px] text-[#86868b] hover:text-[#202425] hover:bg-[#d9d9d9] transition-colors"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15 }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(option);
                      onToggle();
                    }
                  }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
