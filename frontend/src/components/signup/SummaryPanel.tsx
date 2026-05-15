"use client";

import { motion, AnimatePresence } from "motion/react";
import { SignupData, SectionId } from "./SignupFlow";
import { Lock, ArrowRight } from "lucide-react";

type Props = {
  data: SignupData;
  completedSections: string[];
  onSectionEdit: (s: string) => void;
  applicableSections: readonly SectionId[];
};

const SECTION_LABELS: Record<string, string> = {
  accountType: "Account type",
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  birthday: "Date of birth",
  nationality: "Nationality",
  gender: "Gender",
  address: "Home address",
  employment: "Employment",
  workDetails: "Work details",
  bank: "Bank details",
  pep: "PEP status",
  verification: "Identity docs",
  businessDocs: "Business docs",
  password: "Create password",
};

const TIPS: Record<string, string> = {
  accountType: "Pick what fits. You can always switch later in settings.",
  name: "Use your legal name. It must match the ID you\u2019ll upload later.",
  email: "We\u2019ll send a code. No spam, no newsletters, nothing else.",
  phone: "Used for recovery codes. Stored locally in your region. Your data never leaves your country/region.",
  birthday: "You must be 18 or older to use Vehsl. This applies to all buyers, sellers, and business account holders. Never shown on your profile.",
  nationality: "Your country of citizenship, as shown on your ID.",
  gender: "Helps personalise your experience. Completely private.",
  address: "Only your city & country are used publicly for matching.",
  employment: "You can select multiple options that apply to you.",
  workDetails: "Helps us understand your financial profile.",
  bank: "Must be in your legal name. So we can pay you. Encrypted and never shared.",
  pep: "Standard regulatory check. Most people select No.",
  verification: "Encrypted end-to-end. Your personal data is stored locally in your country/region. JPG, PNG or PDF. Max 10MB.",
  businessDocs: "Proof of business ownership for seller verification. JPG, PNG or PDF. Max 10MB.",
  password: "Last step! Use a password manager if you can.",
};

/* Section-specific encouragements */
const SECTION_ENCOURAGEMENTS: Record<string, string> = {
  accountType: "Choose what best describes you.",
  name: "Double-check spelling carefully.",
  email: "Check your inbox shortly.",
  phone: "Keep your phone nearby.",
  birthday: "Format: DD/MM/YYYY.",
  nationality: "Select from the dropdown.",
  gender: "Your choice stays private.",
  address: "Only city & country are public.",
  employment: "Select all that apply.",
  workDetails: "Be as accurate as possible.",
  bank: "Triple-check account details.",
  pep: "Most people select No.",
  verification: "Clear photos work best.",
  businessDocs: "Ensure documents are legible.",
  password: "Make it strong and unique.",
};

export function SummaryPanel({
  data: _data,
  completedSections,
  applicableSections,
}: Props) {
  const total = applicableSections.length;
  const doneCount = completedSections.length;
  const currentStep =
    applicableSections.find((s) => !completedSections.includes(s)) ||
    applicableSections[applicableSections.length - 1];
  const allDone = doneCount >= total;
  const tip = TIPS[currentStep] || "";
  const percent = Math.round((doneCount / total) * 100);
  const currentLabel = SECTION_LABELS[currentStep] || currentStep;

  // Next step after current
  const currentIdx = applicableSections.indexOf(currentStep);
  const nextStep =
    currentIdx < applicableSections.length - 1
      ? applicableSections[currentIdx + 1]
      : null;
  const nextLabel = nextStep ? SECTION_LABELS[nextStep] || nextStep : null;

  // Pick encouragement based on current section
  const encouragement = SECTION_ENCOURAGEMENTS[currentStep] || "";

  return (
    <div className="flex flex-col h-full w-full px-7 py-8 overflow-hidden">
      {/* ── Brand ── minimal, quiet, top-left */}
      <div className="flex-shrink-0 mb-6">
        <span
          className="font-['Urbanist',sans-serif] font-semibold text-[16px] text-[#202425]"
          style={{ letterSpacing: "-0.01em" }}
        >
          Vehsl
        </span>
      </div>

      {/* ── Center: Guidance \u2014 the soul of the panel ── */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={allDone ? "__done__" : currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {allDone ? (
              /* ── All done state ── */
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(52,199,89,0.1)" }}
                >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-[#34C759]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M5 12l5 5L20 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </motion.svg>
                </motion.div>
                <p className="font-['Urbanist',sans-serif] font-bold text-[20px] text-[#202425] leading-[1.4] tracking-tight">
                  You&apos;re all set.
                  <br />
                  Welcome aboard.
                </p>
              </div>
            ) : (
              /* ── Active step guidance ── */
              <>
                {/* Step label */}
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-[7px] h-[7px] rounded-full bg-[#0171e3] flex-shrink-0"
                  />
                  <span className="font-['Urbanist',sans-serif] text-[11px] font-semibold text-[#0171e3] uppercase tracking-[0.08em]">
                    {currentLabel}
                  </span>
                </div>

                {/* Tip \u2014 the main content, warm & readable */}
                <p className="font-['Urbanist',sans-serif] font-bold text-[18px] text-[#202425] leading-[1.45] tracking-tight">
                  {tip}
                </p>

                {/* Encouragement \u2014 subtle warmth */}
                {doneCount > 0 && encouragement && (
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="font-['Urbanist',sans-serif] text-[11px] text-[#b0b0b5]"
                  >
                    {encouragement}
                  </motion.p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom: Progress + next step ── */}
      <div className="flex-shrink-0 space-y-4">
        {/* Next step hint */}
        {!allDone && nextLabel && (
          <motion.div
            key={nextLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-[10px] h-[10px] text-[#d0d0d5]" />
            <span className="font-['Urbanist',sans-serif] text-[10.5px] text-[#c0c0c5]">
              Next: {nextLabel}
            </span>
          </motion.div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd]">
              {doneCount} of {total}
            </span>
            <motion.span
              key={percent}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-['Urbanist',sans-serif] font-semibold text-[10px] text-[#202425]"
            >
              {percent}%
            </motion.span>
          </div>
          <div
            className="h-[2px] rounded-full overflow-hidden"
            style={{ background: "rgba(134,134,139,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: allDone ? "#34C759" : "#0171e3" }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Encryption badge */}
        <div className="flex items-center gap-1.5 pt-1">
          <Lock className="w-[9px] h-[9px] text-[#dcdce0]" />
          <span className="font-['Urbanist',sans-serif] text-[9px] text-[#dcdce0]">
            End-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
