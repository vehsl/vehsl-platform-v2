"use client";

import { useState, useCallback } from "react";
import { SummaryPanel } from "./SummaryPanel";
import { ScrollingForm } from "./ScrollingForm";

export type SignupData = {
  firstName: string;
  lastName: string;
  email: string;
  emailCode?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  phone: string;
  day: string;
  month: string;
  year: string;
  // Nationality (new section)
  nationality?: string;
  nationalityFlag?: string;
  gender: string;
  country?: string;
  countryFlag?: string;
  province?: string;
  city?: string;
  street?: string;
  address: string;
  accountType: "buyer" | "seller" | "";
  // Employment
  employmentStatuses: string[];
  position?: string;
  // Work details
  occupation?: string;
  companyName?: string;
  companyAddress?: string;
  industry?: string;
  businessName?: string;
  businessAddress?: string;
  ownershipPercent?: string;
  doingBusinessAs?: string;
  workAddress?: string;
  // Bank
  bankCountry?: string;
  bankCountryFlag?: string;
  bankName?: string;
  iban?: string;
  confirmIban?: string;
  swiftBic?: string;
  // PEP
  pepCheck?: string;
  // Verification (with upload tracking)
  verificationType: string;
  doc1Uploaded?: boolean;
  doc1File?: File | null;
  verificationType2: string;
  doc2Uploaded?: boolean;
  doc2File?: File | null;
  proofOfAddress?: string;
  proofUploaded?: boolean;
  proofFile?: File | null;
  // Seller business docs (with upload tracking)
  businessDoc1?: string;
  bizDoc1Uploaded?: boolean;
  bizDoc1File?: File | null;
  businessDoc2?: string;
  bizDoc2Uploaded?: boolean;
  bizDoc2File?: File | null;
  // Liveness
  // livenessComplete?: boolean;
  // Password
  password?: string;
  rePassword?: string;
};

export const ALL_SECTIONS = [
  "accountType",
  "name",
  "email",
  "phone",
  "birthday",
  "nationality",
  "gender",
  "address",
  "employment",
  "workDetails",
  "bank",
  "pep",
  "verification",
  "businessDocs",
  // "liveness",
  "password",
] as const;

export type SectionId = (typeof ALL_SECTIONS)[number];

export function SignupFlow() {
  const [data, setData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    day: "",
    month: "",
    year: "",
    gender: "",
    address: "",
    accountType: "",
    employmentStatuses: [],
    verificationType: "",
    verificationType2: "",
  });

  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const updateData = useCallback((updates: Partial<SignupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const onSectionComplete = useCallback((section: string) => {
    setCompletedSections((prev) =>
      prev.includes(section) ? prev : [...prev, section]
    );
  }, []);

  const onSectionEdit = useCallback((section: string) => {
    setCompletedSections((prev) => prev.filter((s) => s !== section));
  }, []);

  // Compute applicable sections (businessDocs only for sellers, workDetails only if needed)
  const applicableSections = ALL_SECTIONS.filter((s) => {
    if (s === "businessDocs") return data.accountType === "seller";
    if (s === "workDetails") {
      const needsWorkDetails = data.employmentStatuses.includes("Business Owner") ||
                               data.employmentStatuses.includes("Self-Employed") ||
                               data.employmentStatuses.includes("Employed");
      return needsWorkDetails;
    }
    return true;
  });

  return (
    <div className="flex w-full h-full">
      {/* Left: assistant panel — narrow */}
      <div className="hidden lg:flex w-[272px] xl:w-[292px] h-full bg-[#fafafa] border-r border-[rgba(134,134,139,0.06)] flex-shrink-0 relative overflow-x-hidden">
        <SummaryPanel
          data={data}
          completedSections={completedSections}
          onSectionEdit={onSectionEdit}
          applicableSections={applicableSections}
        />
      </div>

      {/* Right: scrolling form */}
      <div className="flex-1 h-full bg-white relative overflow-x-hidden">
        <ScrollingForm
          data={data}
          updateData={updateData}
          completedSections={completedSections}
          onSectionComplete={onSectionComplete}
          onSectionEdit={onSectionEdit}
          applicableSections={applicableSections}
        />
      </div>
    </div>
  );
}
