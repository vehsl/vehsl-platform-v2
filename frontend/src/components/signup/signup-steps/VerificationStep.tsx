"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, CreditCard, Home, FileCheck } from "lucide-react";

type VerificationStepProps = {
  accountType: "buyer" | "seller" | "";
  value: string;
  onChange: (value: string) => void;
  onPrev: () => void;
  onComplete: () => void;
};

const VERIFICATION_TYPES = [
  { id: "passport", label: "Passport", icon: FileText },
  { id: "id-card", label: "National Identity Card", icon: CreditCard },
  { id: "drivers-license", label: "Driver's License", icon: FileCheck },
  { id: "residence-permit", label: "Residence Permit", icon: Home },
];

const BUSINESS_DOCS = [
  { id: "business-license", label: "Business License" },
  { id: "tax-id", label: "Tax ID Certificate" },
  { id: "incorporation", label: "Certificate of Incorporation" },
];

export function VerificationStep({
  accountType,
  value,
  onChange,
  onPrev,
  onComplete,
}: VerificationStepProps) {
  const [expandedSection, setExpandedSection] = useState<
    "personal" | "business" | null
  >(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSeller = accountType === "seller";

  const handleDocumentSelect = (docId: string) => {
    onChange(docId);
    // Trigger file upload
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload and complete
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

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
            Verifications.{" "}
            <span className="text-[#86868b]">Clear pictures.</span>
          </h1>
        </motion.div>

        {/* Verification sections */}
        <div className="space-y-3 mb-8">
          {/* Personal verification */}
          <VerificationSection
            title="Select Verification Document"
            isExpanded={expandedSection === "personal"}
            onToggle={() =>
              setExpandedSection(
                expandedSection === "personal" ? null : "personal"
              )
            }
          >
            {VERIFICATION_TYPES.map((type) => {
              const Icon = type.icon;
              const isHovered = hoveredItem === type.id;

              return (
                <motion.button
                  key={type.id}
                  onClick={() => handleDocumentSelect(type.id)}
                  onHoverStart={() => setHoveredItem(type.id)}
                  onHoverEnd={() => setHoveredItem(null)}
                  className="w-full px-5 py-3 text-left rounded-lg flex items-center gap-3 transition-colors"
                  style={{
                    backgroundColor: isHovered
                      ? "#d9d9d9"
                      : "rgba(217, 217, 217, 0.4)",
                  }}
                  whileHover={{ x: 4, scale: isHovered ? 1.02 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isHovered ? "text-[#202425]" : "text-[#86868b]"
                    }`}
                  />
                  <span
                    className={`font-['Urbanist',sans-serif] font-semibold ${
                      isHovered
                        ? "text-[24px] text-[#202425]"
                        : "text-[20px] text-[#86868b]"
                    }`}
                  >
                    {type.label}
                  </span>

                  {isHovered && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="ml-auto w-8 h-8 rounded-full bg-[#0171e3] flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </VerificationSection>

          {/* Business verification (only for sellers) */}
          {isSeller && (
            <>
              <VerificationSection
                title="Select Verification Document"
                isExpanded={expandedSection === "business"}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === "business" ? null : "business"
                  )
                }
              >
                {BUSINESS_DOCS.map((doc) => (
                  <motion.button
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc.id)}
                    className="w-full px-5 py-3 text-left rounded-lg font-['Urbanist',sans-serif] font-semibold text-[20px] text-[#86868b] hover:text-[#202425] hover:bg-[#d9d9d9] transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    {doc.label}
                  </motion.button>
                ))}
              </VerificationSection>

              <motion.div
                className="w-full h-[72px] rounded-[20px] px-5 flex items-center"
                style={{
                  background: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid #86868b",
                }}
              >
                <span className="font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#86868b]">
                  Business Verification Documents
                </span>
              </motion.div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Back button */}
        <motion.button
          onClick={onPrev}
          className="w-full h-14 rounded-[20px] border-2 border-[#86868b] text-[#202425] font-['Urbanist',sans-serif] font-semibold text-[18px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
      </motion.div>
    </div>
  );
}

function VerificationSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="overflow-hidden rounded-[20px]"
      style={{
        background: isExpanded
          ? "linear-gradient(180deg, rgba(181, 229, 255, 0.1) 12.092%, rgba(225, 169, 246, 0.05) 78.202%, rgba(249, 171, 231, 0.05) 100%)"
          : "rgba(255, 255, 255, 0.07)",
        border: isExpanded ? "2px solid #0171e3" : "1px solid #86868b",
        boxShadow: isExpanded
          ? "0px 0px 15px 0px rgba(1, 113, 227, 0.25)"
          : "none",
      }}
      animate={{
        height: isExpanded ? "auto" : "54px",
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        onClick={onToggle}
        className="w-full h-[54px] px-5 flex items-center justify-between"
      >
        <span
          className={`font-['Urbanist',sans-serif] font-semibold ${
            isExpanded ? "text-[24px] text-[#202425]" : "text-[24px] text-[#86868b]"
          }`}
        >
          {title}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
