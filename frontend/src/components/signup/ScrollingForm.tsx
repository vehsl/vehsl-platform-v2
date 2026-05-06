"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Store,
  Upload,
  FileText,
  CreditCard,
  FileCheck,
  Home,
  Eye,
  EyeOff,
  Check,
  Shield,
  Lock,
  Camera,
  MoveRight,
  Hand,
  Scan,
  Sparkles,
  Building2,
  FileSignature,
  Pencil,
  MailCheck,
  Landmark,
  Receipt,
  MapPin,
  Globe,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Smile,
  X,
} from "lucide-react";
import { SignupData, SectionId } from "./SignupFlow";

/* ═══════════════════════════════════════
   Constants
   ═══════════════════════════════════════ */

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 100 }, (_, i) => String(2008 - i));
const GENDERS = ["Male", "Female", "Other"];

const COUNTRIES = [
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "South Korea", code: "+82", flag: "🇰🇷" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "Sweden", code: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭" },
  { name: "UAE", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳" },
  { name: "Argentina", code: "+54", flag: "🇦🇷" },
  { name: "Colombia", code: "+57", flag: "🇨🇴" },
  { name: "Poland", code: "+48", flag: "🇵🇱" },
  { name: "Russia", code: "+7", flag: "🇷🇺" },
  { name: "Ukraine", code: "+380", flag: "🇺🇦" },
  { name: "Israel", code: "+972", flag: "🇮🇱" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
];

const EMPLOYMENT_OPTIONS = [
  "Business Owner", "Employed", "Self-Employed", "Unemployed",
  "Homemaker", "Student", "Retired", "Other",
];

const ID_TYPES = [
  { id: "passport", label: "Passport", icon: FileText, hint: "Photo page of your passport" },
  { id: "id-card", label: "National ID Card", icon: CreditCard, hint: "Front and back of your ID" },
  { id: "drivers-license", label: "Driver's License", icon: FileCheck, hint: "Front side with your photo" },
  { id: "residence-permit", label: "Residence Permit", icon: Home, hint: "Valid, non-expired permit" },
];

const BIZ_DOC_TYPES = [
  { id: "registration", label: "Business Registration", icon: Building2, hint: "Certificate of incorporation or registration" },
  { id: "tax-certificate", label: "Tax Certificate", icon: FileSignature, hint: "Valid tax registration document" },
  { id: "ownership-proof", label: "Proof of Ownership", icon: FileText, hint: "Share certificate or partnership deed" },
  { id: "license", label: "Business License", icon: FileCheck, hint: "Operating or trade license" },
];

const PROOF_OF_ADDRESS_TYPES = [
  { id: "utility-bill", label: "Utility Bill", icon: Receipt, hint: "Gas, electricity or water — dated within 3 months" },
  { id: "bank-statement", label: "Bank Statement", icon: Landmark, hint: "Official statement showing your address" },
  { id: "rental-agreement", label: "Rental / Lease Agreement", icon: FileText, hint: "Signed agreement with your current address" },
  { id: "govt-letter", label: "Government Letter", icon: MailCheck, hint: "Official correspondence from a government body" },
];

const ALL_SECTIONS: SectionId[] = [
  "accountType","name","email","phone","birthday","nationality","gender","address",
  "employment","workDetails","bank","pep","verification","businessDocs","liveness","password",
];

/* ═══════════════════════════════════════
   Validation helpers
   ═══════════════════════════════════════ */
function isValidEmail(e: string) {
  const p = e.split("@");
  if (p.length !== 2) return false;
  return p[1].includes(".") && p[1].split(".").every((s) => s.length > 0);
}
function getPasswordChecks(pw: string) {
  return [
    { label: "8 characters minimum", met: pw.length >= 8 },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(pw) },
    { label: "One lowercase letter (a–z)", met: /[a-z]/.test(pw) },
    { label: "One number (0–9)", met: /[0-9]/.test(pw) },
    { label: "One special character (!@#$…)", met: /[^A-Za-z0-9]/.test(pw) },
  ];
}
function isPasswordStrong(pw: string) {
  return getPasswordChecks(pw).every((c) => c.met);
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

type Props = {
  data: SignupData;
  updateData: (u: Partial<SignupData>) => void;
  completedSections: string[];
  onSectionComplete: (s: string) => void;
  onSectionEdit: (s: string) => void;
  applicableSections: readonly SectionId[];
};

export function ScrollingForm({
  data, updateData, completedSections, onSectionComplete, onSectionEdit, applicableSections,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [interactionCount, setInteractionCount] = useState(0);
  const bounceIntensity = Math.min(1 + interactionCount * 0.04, 1.6);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [showLivenessModal, setShowLivenessModal] = useState(false);

  const scrollTo = useCallback((s: string) => {
    const el = sectionRefs.current[s];
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const containerHeight = container.clientHeight;
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const targetScroll = elTop - (containerHeight / 2) + (elHeight / 2);
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }
  }, []);

  const visibleSections = useMemo(
    () => applicableSections.filter((_, i) => {
      const prev = applicableSections.slice(0, i);
      return i === 0 || prev.every((ps) => completedSections.includes(ps));
    }),
    [completedSections, applicableSections]
  );

  const done = (s: string) => completedSections.includes(s);
  const vis = (s: string) => visibleSections.includes(s as SectionId);

  // Find current (first non-completed) section
  const currentSection = useMemo(
    () => visibleSections.find((s) => !completedSections.includes(s)) ?? visibleSections[visibleSections.length - 1],
    [visibleSections, completedSections]
  );

  // Auto-center current section on mount and when it changes
  useEffect(() => {
    if (currentSection) {
      setTimeout(() => scrollTo(currentSection), 150);
    }
  }, [currentSection, scrollTo]);

  const handleDone = useCallback((section: string) => {
    setInteractionCount((c) => c + 1);
    onSectionComplete(section);
    const idx = applicableSections.indexOf(section as SectionId);
    if (idx < applicableSections.length - 1) {
      const next = applicableSections[idx + 1];
      setTimeout(() => scrollTo(next), 200);
      // Auto-focus the first focusable input in the next section
      setTimeout(() => {
        const el = sectionRefs.current[next];
        if (el) {
          // First try to find any clickable custom component (like CountrySelect)
          const clickable = el.querySelector<HTMLElement>(
            'div[class*="cursor-text"]:not([disabled])'
          );
          if (clickable) {
            clickable.click();
            return;
          }
          // Otherwise, focus standard inputs
          const focusable = el.querySelector<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          );
          if (focusable) focusable.focus();
        }
      }, 500);
    }
  }, [onSectionComplete, applicableSections, scrollTo]);

  const handleEdit = useCallback((s: string) => {
    onSectionEdit(s);
    setTimeout(() => scrollTo(s), 100);
  }, [onSectionEdit, scrollTo]);

  // Auto-complete verification section when all documents are uploaded
  useEffect(() => {
    if (data.doc1Uploaded && data.doc2Uploaded && data.proofUploaded && !completedSections.includes("verification")) {
      setTimeout(() => handleDone("verification"), 500);
    }
  }, [data.doc1Uploaded, data.doc2Uploaded, data.proofUploaded, completedSections, handleDone]);

  // Auto-complete business documents section when all documents are uploaded
  useEffect(() => {
    if (data.bizDoc1Uploaded && data.bizDoc2Uploaded && !completedSections.includes("businessDocs") && data.accountType === "seller") {
      setTimeout(() => handleDone("businessDocs"), 500);
    }
  }, [data.bizDoc1Uploaded, data.bizDoc2Uploaded, data.accountType, completedSections, handleDone]);

  const hasBusinessOwner = data.employmentStatuses.includes("Business Owner");
  const hasSelfEmployed = data.employmentStatuses.includes("Self-Employed");
  const hasEmployed = data.employmentStatuses.includes("Employed");
  const needsWorkDetails = hasBusinessOwner || hasSelfEmployed || hasEmployed;

  const mobilePercent = Math.round((completedSections.length / applicableSections.length) * 100);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overflow-x-visible scroll-smooth" style={{ scrollbarWidth: "none" }}>
      <style>{`
        .cscroll::-webkit-scrollbar{width:3px}
        .cscroll::-webkit-scrollbar-track{background:transparent}
        .cscroll::-webkit-scrollbar-thumb{background:rgba(134,134,139,0.15);border-radius:100px}
        .cscroll::-webkit-scrollbar-thumb:hover{background:rgba(134,134,139,0.25)}
        .cscroll{scrollbar-width:thin;scrollbar-color:rgba(134,134,139,0.15) transparent}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spin-slow{animation:spin-slow 1s linear infinite}
      `}</style>

      {/* ── Mobile progress header (hidden on lg+) ── */}
      <div className="lg:hidden sticky top-0 z-40 px-5 py-3" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(134,134,139,0.07)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-[20px] h-[20px] rounded-[5px] bg-[#0171e3] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 14 14" className="w-[10px] h-[10px]" fill="none">
                <path d="M7 2L11.5 10.5H2.5L7 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-['Urbanist',sans-serif] font-semibold text-[14px] text-[#202425]">Vehsl</span>
          </div>
          <span className="font-['Urbanist',sans-serif] text-[11px] text-[#86868b]">
            {completedSections.length} / {applicableSections.length} · {mobilePercent}%
          </span>
        </div>
        <div className="h-[1.5px] rounded-full overflow-hidden" style={{ background: "rgba(134,134,139,0.07)" }}>
          <motion.div
            className="h-full bg-[#0171e3] rounded-full"
            animate={{ width: `${mobilePercent}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="max-w-[520px] mx-auto px-6" style={{ paddingTop: "40vh", paddingBottom: "40vh" }}>

        {/* ═══ Account Type ═══ */}
        <Sec id="accountType" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Account type." m="Buyer or seller?" />
          <div className="flex gap-4 mt-5">
            {(["buyer","seller"] as const).map((t) => {
              const sel = data.accountType === t;
              const Ic = t === "buyer" ? ShoppingCart : Store;
              return (
                <motion.button key={t} onClick={() => { updateData({ accountType: t }); setTimeout(() => handleDone("accountType"), 300); }}
                  className="relative flex-1 h-[115px] rounded-[20px] flex flex-col items-center justify-center gap-2 cursor-pointer"
                  style={{ border: sel ? "2px solid #0171e3" : "1.5px solid rgba(134,134,139,0.12)", background: sel ? "rgba(1,113,227,0.025)" : "transparent" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  <Ic className={`w-6 h-6 ${sel ? "text-[#0171e3]" : "text-[#86868b]"}`} strokeWidth={1.5} />
                  <span className={`font-['Urbanist',sans-serif] font-semibold text-[15px] capitalize ${sel ? "text-[#0171e3]" : "text-[#86868b]"}`}>{t}</span>
                  {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0171e3] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></motion.div>}
                </motion.button>
              );
            })}
          </div>
        </Sec>

        {/* ═══ Name ═══ */}
        <Sec id="name" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Name." m="As on your legal ID." />
          <div className="mt-5 space-y-3">
            <Inp label="First Name" value={data.firstName} onChange={(v) => updateData({ firstName: v })} onEnter={() => { if (data.firstName.trim() && data.lastName.trim()) handleDone("name") }} />
            <Inp label="Last Name" value={data.lastName} onChange={(v) => updateData({ lastName: v })} onEnter={() => { if (data.firstName.trim() && data.lastName.trim()) handleDone("name") }} />
          </div>
          <Btn disabled={!data.firstName.trim() || !data.lastName.trim()} onClick={() => handleDone("name")} />
        </Sec>

        {/* ═══ Email ═══ */}
        <Sec id="email" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Email." m="We'll verify it's you." />
          <div className="mt-5 space-y-3">
            <InpWithAction
              label="your@email.com"
              value={data.email}
              onChange={(v) => { updateData({ email: v, emailVerified: false }); setEmailCodeSent(false); }}
              type="email"
              actionLabel="Send Code"
              actionActive={isValidEmail(data.email)}
              actionDone={emailCodeSent}
              onAction={() => setEmailCodeSent(true)}
            />
            <AnimatePresence>
              {emailCodeSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-visible">
                  <AutoCodeInp
                    label="6-digit verification code"
                    value={data.emailCode || ""}
                    onChange={(v) => updateData({ emailCode: v })}
                    onComplete={() => { updateData({ emailVerified: true }); handleDone("email"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Sec>

        {/* ═══ Phone ═══ */}
        <Sec id="phone" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Phone." m="For account recovery and local data storage" />
          <div className="mt-5 space-y-3">
            <div className="flex gap-3">
              <div className="w-[100px] flex-shrink-0">
                <CodePicker value={data.countryCode || "+1"} flag={data.countryFlag || "🇺🇸"} onChange={(c, f) => updateData({ countryCode: c, countryFlag: f })} />
              </div>
              <div className="flex-1">
                <InpWithAction
                  label="Phone number"
                  value={data.phone}
                  onChange={(v) => { updateData({ phone: v }); setPhoneCodeSent(false); }}
                  type="tel"
                  actionLabel="Send"
                  actionActive={data.phone.replace(/\D/g, "").length >= 7}
                  actionDone={phoneCodeSent}
                  onAction={() => setPhoneCodeSent(true)}
                />
              </div>
            </div>
            <AnimatePresence>
              {phoneCodeSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-visible">
                  <AutoCodeInp
                    label="6-digit verification code"
                    value={data.phoneCode || ""}
                    onChange={(v) => updateData({ phoneCode: v })}
                    onComplete={() => { updateData({ phoneVerified: true }); handleDone("phone"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Sec>

        {/* ═══ Birthday ═══ */}
        <Sec id="birthday" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Birthday." m="For age verification." />
          <div className="flex gap-3 mt-5">
            <div className="w-[70px] flex-shrink-0"><Drop label="Day" value={data.day} options={DAYS} onChange={(v) => { updateData({ day: v }); if (data.month && data.year) setTimeout(() => handleDone("birthday"), 300); }} /></div>
            <div className="flex-[2.2] min-w-0"><Drop label="Month" value={data.month} options={MONTHS} onChange={(v) => { updateData({ month: v }); if (data.day && data.year) setTimeout(() => handleDone("birthday"), 300); }} /></div>
            <div className="flex-1 min-w-0"><Drop label="Year" value={data.year} options={YEARS} onChange={(v) => { updateData({ year: v }); if (data.day && data.month) setTimeout(() => handleDone("birthday"), 300); }} /></div>
          </div>
        </Sec>

        {/* ═══ Nationality (new) ═══ */}
        <Sec id="nationality" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Nationality." m="Country of citizenship." />
          <div className="mt-5">
            <CountrySelect
              value={data.nationality || ""}
              flag={data.nationalityFlag}
              onChange={(n, f) => {
                updateData({ nationality: n, nationalityFlag: f });
                setTimeout(() => handleDone("nationality"), 300);
              }}
              placeholder="Select nationality"
            />
          </div>
          <p className="mt-2.5 font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd] text-center">
            Must match the nationality on your ID document.
          </p>
        </Sec>

        {/* ═══ Gender ═══ */}
        <Sec id="gender" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Gender." m="How do you identify?" />
          <div className="flex gap-3 mt-5">
            {GENDERS.map((g) => (
              <motion.button key={g} onClick={() => { updateData({ gender: g }); setTimeout(() => handleDone("gender"), 250); }}
                className="flex-1 h-[44px] rounded-[14px] flex items-center justify-center font-['Urbanist',sans-serif] font-semibold text-[13px] cursor-pointer"
                style={{ border: data.gender === g ? "2px solid #0171e3" : "1.5px solid rgba(134,134,139,0.12)", color: data.gender === g ? "#0171e3" : "#86868b", background: data.gender === g ? "rgba(1,113,227,0.025)" : "transparent" }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>{g}</motion.button>
            ))}
          </div>
        </Sec>

        {/* ═══ Address ═══ */}
        <Sec id="address" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Address." m="Where you currently live." />
          <div className="mt-5 space-y-3">
            <CountrySelect value={data.country || ""} flag={data.countryFlag} onChange={(n, f) => updateData({ country: n, countryFlag: f })} />
            <div className="flex gap-3">
              <div className="flex-1"><Inp label="Province / State" value={data.province || ""} onChange={(v) => updateData({ province: v })} onEnter={() => { if (data.country?.trim() && data.city?.trim() && data.street?.trim()) handleDone("address") }} /></div>
              <div className="flex-1"><Inp label="City" value={data.city || ""} onChange={(v) => updateData({ city: v })} onEnter={() => { if (data.country?.trim() && data.city?.trim() && data.street?.trim()) handleDone("address") }} /></div>
            </div>
            <Inp label="Street / Avenue" value={data.street || ""} onChange={(v) => updateData({ street: v })} onEnter={() => { if (data.country?.trim() && data.city?.trim() && data.street?.trim()) handleDone("address") }} />
            <Inp label="Apt / Floor / P.O. Box (optional)" value={data.address || ""} onChange={(v) => updateData({ address: v })} onEnter={() => { if (data.country?.trim() && data.city?.trim() && data.street?.trim()) handleDone("address") }} />
          </div>
          <Btn disabled={!data.country?.trim() || !data.city?.trim() || !data.street?.trim()} onClick={() => handleDone("address")} />
        </Sec>

        {/* ═══ Employment Status ═══ */}
        <Sec id="employment" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Work." m="Select all that apply." />
          <div className="grid grid-cols-2 gap-2 mt-5">
            {EMPLOYMENT_OPTIONS.map((opt) => {
              const sel = data.employmentStatuses.includes(opt);
              return (
                <motion.button key={opt} onClick={() => {
                  const next = sel ? data.employmentStatuses.filter((s) => s !== opt) : [...data.employmentStatuses, opt];
                  updateData({ employmentStatuses: next });
                }}
                  className="h-[44px] rounded-[14px] flex items-center justify-center font-['Urbanist',sans-serif] font-semibold text-[13px] cursor-pointer"
                  style={{ border: sel ? "2px solid #0171e3" : "1.5px solid rgba(134,134,139,0.12)", color: sel ? "#0171e3" : "#86868b", background: sel ? "rgba(1,113,227,0.025)" : "transparent" }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>{opt}</motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {data.employmentStatuses.includes("Other") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                <Inp
                  label="Please specify"
                  value={data.position || ""}
                  onChange={(v) => updateData({ position: v })}
                  onEnter={() => { if (data.employmentStatuses.includes("Other") && data.position?.trim()) handleDone("employment"); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Btn disabled={data.employmentStatuses.length === 0 || (data.employmentStatuses.includes("Other") && !data.position?.trim())} onClick={() => handleDone("employment")} />
        </Sec>

        {/* ═══ Work Details ═══ */}
        {needsWorkDetails && (
          <Sec id="workDetails" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
            {hasBusinessOwner && (
              <div className="mb-6">
                <H b="Work Details." m="Business ownership" />
                <div className="mt-4 space-y-3">
                  <Inp label="Industry" value={data.industry || ""} onChange={(v) => updateData({ industry: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Business Name" value={data.businessName || ""} onChange={(v) => updateData({ businessName: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Business Address" value={data.businessAddress || ""} onChange={(v) => updateData({ businessAddress: v })} onEnter={() => handleDone("workDetails")} />
                  <PercentInp label="Your Beneficial Ownership %" value={data.ownershipPercent || ""} onChange={(v) => updateData({ ownershipPercent: v })} onEnter={() => handleDone("workDetails")} />
                </div>
              </div>
            )}
            {hasSelfEmployed && (
              <div className="mb-6">
                <H b="Work Details." m="Self employed" />
                <div className="mt-4 space-y-3">
                  <Inp label="Occupation" value={data.occupation || ""} onChange={(v) => updateData({ occupation: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Position / Job Title" value={data.position || ""} onChange={(v) => updateData({ position: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Industry" value={data.industry || ""} onChange={(v) => updateData({ industry: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Work Address" value={data.workAddress || ""} onChange={(v) => updateData({ workAddress: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Doing business as (optional)" value={data.doingBusinessAs || ""} onChange={(v) => updateData({ doingBusinessAs: v })} onEnter={() => handleDone("workDetails")} />
                </div>
              </div>
            )}
            {hasEmployed && (
              <div className="mb-6">
                <H b="Work Details." m="Employment" />
                <div className="mt-4 space-y-3">
                  <Inp label="Occupation" value={data.occupation || ""} onChange={(v) => updateData({ occupation: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Position / Job Title" value={data.position || ""} onChange={(v) => updateData({ position: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Company Name" value={data.companyName || ""} onChange={(v) => updateData({ companyName: v })} onEnter={() => handleDone("workDetails")} />
                  <Inp label="Company Address" value={data.companyAddress || ""} onChange={(v) => updateData({ companyAddress: v })} onEnter={() => handleDone("workDetails")} />
                </div>
              </div>
            )}
            <Btn
              disabled={Boolean(
                (hasBusinessOwner && (!data.industry?.trim() || !data.businessName?.trim() || !data.businessAddress?.trim() || !data.ownershipPercent?.trim())) ||
                (hasSelfEmployed && (!data.occupation?.trim() || !data.position?.trim() || !data.industry?.trim() || !data.workAddress?.trim())) ||
                (hasEmployed && (!data.occupation?.trim() || !data.position?.trim() || !data.companyName?.trim() || !data.companyAddress?.trim()))
              )}
              onClick={() => handleDone("workDetails")}
            />
          </Sec>
        )}

        {/* ═══ Bank ═══ */}
        <Sec id="bank" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Bank details." m="To get paid for sales and compensations." />
          <div className="mt-5 space-y-3">
            <CountrySelect value={data.bankCountry || ""} flag={data.bankCountryFlag} onChange={(n, f) => updateData({ bankCountry: n, bankCountryFlag: f })} placeholder="Bank Country" />
            <Inp label="Full Name in Bank" value={data.bankName || ""} onChange={(v) => updateData({ bankName: v })} onEnter={() => { if (data.iban?.trim() && data.bankName?.trim() && data.iban === data.confirmIban) handleDone("bank") }} />
            <IBANInp label="IBAN" value={data.iban || ""} onChange={(v) => updateData({ iban: v })} onEnter={() => { if (data.iban?.trim() && data.bankName?.trim() && data.iban === data.confirmIban) handleDone("bank"); }} />
            <IBANInp label="Confirm IBAN" value={data.confirmIban || ""} onChange={(v) => updateData({ confirmIban: v })} matchValue={data.iban} onEnter={() => { if (data.iban?.trim() && data.bankName?.trim() && data.iban === data.confirmIban) handleDone("bank"); }} />
            <SwiftBicInp label="Swift / BIC Code" value={data.swiftBic || ""} onChange={(v) => updateData({ swiftBic: v })} onEnter={() => { if (data.iban?.trim() && data.bankName?.trim() && data.iban === data.confirmIban) handleDone("bank"); }} />
          </div>
          <Btn disabled={!data.iban?.trim() || !data.bankName?.trim() || data.iban !== data.confirmIban} onClick={() => handleDone("bank")} />
        </Sec>

        {/* ═══ PEP ═══ */}
        <Sec id="pep" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <div className="bg-[rgba(218,218,218,0.2)] rounded-[18px] px-5 py-4 mb-4">
            <h3 className="font-['Urbanist',sans-serif] font-semibold text-[15px] text-[#202425] text-center mb-1.5">Politically Exposed Person</h3>
            <p className="font-['Urbanist',sans-serif] text-[12px] text-center leading-[1.5]">
              <span className="text-[#202425]">Select "Yes" only if you or a close family member hold a prominent public position</span>{" "}
              <span className="text-[#86868b]">(e.g., senior government, judicial, or military official).</span>
            </p>
          </div>
          <H b="PEP status." m="Regulatory requirement." />
          <div className="flex gap-3 mt-3">
            {(["No","Yes"] as const).map((o) => {
              const sel = data.pepCheck === o;
              const c = o === "No" ? "#34C759" : "#0171e3";
              return (
                <motion.button key={o} onClick={() => { updateData({ pepCheck: o }); setTimeout(() => handleDone("pep"), 300); }}
                  className="flex-1 h-[44px] rounded-[14px] flex items-center justify-center font-['Urbanist',sans-serif] font-semibold text-[13px] cursor-pointer"
                  style={{ border: sel ? `2px solid ${c}` : "1.5px solid rgba(134,134,139,0.12)", color: sel ? c : "#86868b", background: sel ? `${c}08` : "transparent" }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>{o === "No" ? "No, I'm not" : "Yes, I am"}</motion.button>
              );
            })}
          </div>
        </Sec>

        {/* ═══ Verification (2 ID docs + proof of address) — progressive upload flow ═══ */}
        <Sec id="verification" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Documents." m="Three required for verification." />
          <TrustBanner />

          {/* ── ID Document 1 ── */}
          <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425] mb-2 mt-3">
            ID Document 1{" "}
            {data.doc1Uploaded && <Check className="inline w-3 h-3 text-[#34C759] ml-1" />}
          </p>
          <div className="space-y-1.5">
            {ID_TYPES.map((t) => (
              <DocOption key={t.id} {...t}
                selected={data.verificationType === t.id}
                disabled={data.verificationType2 === t.id}
                onSelect={() => updateData({ verificationType: t.id, doc1Uploaded: false })}
                bounce={bounceIntensity}
                uploaded={data.verificationType === t.id && data.doc1Uploaded}
                onUpload={data.verificationType === t.id ? () => updateData({ doc1Uploaded: true }) : undefined}
              />
            ))}
          </div>

          {/* ── ID Document 2 — unlocks after doc1 upload ── */}
          <AnimatePresence>
            {data.doc1Uploaded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-visible"
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425] mb-2 mt-4">
                  ID Document 2{" "}
                  {data.doc2Uploaded && <Check className="inline w-3 h-3 text-[#34C759] ml-1" />}
                </p>
                <div className="space-y-1.5">
                  {ID_TYPES.filter((t) => t.id !== data.verificationType).map((t) => (
                    <DocOption key={t.id} {...t}
                      selected={data.verificationType2 === t.id}
                      disabled={false}
                      onSelect={() => updateData({ verificationType2: t.id, doc2Uploaded: false })}
                      bounce={bounceIntensity}
                      uploaded={data.verificationType2 === t.id && data.doc2Uploaded}
                      onUpload={data.verificationType2 === t.id ? () => updateData({ doc2Uploaded: true }) : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Proof of Address — unlocks after doc2 upload ── */}
          <AnimatePresence>
            {data.doc2Uploaded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-visible"
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mt-4 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#0171e3]" />
                  <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425]">
                    Proof of Address{" "}
                    {data.proofUploaded && <Check className="inline w-3 h-3 text-[#34C759] ml-1" />}
                  </p>
                  <span className="font-['Urbanist',sans-serif] text-[9px] text-white bg-[#0171e3] rounded-full px-1.5 py-0.5">Required</span>
                </div>
                <p className="font-['Urbanist',sans-serif] text-[10px] text-[#b0b0b5] mb-2">Must show your full address and be dated within the last 3 months.</p>
                <div className="space-y-1.5">
                  {PROOF_OF_ADDRESS_TYPES.map((t) => (
                    <DocOption key={t.id} {...t}
                      selected={data.proofOfAddress === t.id}
                      disabled={false}
                      onSelect={() => updateData({ proofOfAddress: t.id, proofUploaded: false })}
                      bounce={bounceIntensity}
                      uploaded={data.proofOfAddress === t.id && data.proofUploaded}
                      onUpload={data.proofOfAddress === t.id ? () => updateData({ proofUploaded: true }) : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Btn
            disabled={!data.doc1Uploaded || !data.doc2Uploaded || !data.proofUploaded}
            onClick={() => handleDone("verification")}
          />
          <p className="mt-2 font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd] text-center">Verification typically takes 3-6 hours.</p>
        </Sec>

        {/* ═══ Business Docs (seller only) — progressive upload flow ═══ */}
        {data.accountType === "seller" && (
          <Sec id="businessDocs" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
            <H b="Business documents." m="Evidence of ownership." />
            <TrustBanner />

            {/* Business Doc 1 */}
            <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425] mb-2 mt-3">
              Business Document 1{" "}
              {data.bizDoc1Uploaded && <Check className="inline w-3 h-3 text-[#34C759] ml-1" />}
            </p>
            <div className="space-y-1.5">
              {BIZ_DOC_TYPES.map((t) => (
                <DocOption key={t.id} {...t}
                  selected={data.businessDoc1 === t.id}
                  disabled={data.businessDoc2 === t.id}
                  onSelect={() => updateData({ businessDoc1: t.id, bizDoc1Uploaded: false })}
                  bounce={bounceIntensity}
                  uploaded={data.businessDoc1 === t.id && data.bizDoc1Uploaded}
                  onUpload={data.businessDoc1 === t.id ? () => updateData({ bizDoc1Uploaded: true }) : undefined}
                />
              ))}
            </div>

            {/* Business Doc 2 — unlocks after doc1 upload */}
            <AnimatePresence>
              {data.bizDoc1Uploaded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-visible"
                >
                  <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425] mb-2 mt-4">
                    Business Document 2{" "}
                    {data.bizDoc2Uploaded && <Check className="inline w-3 h-3 text-[#34C759] ml-1" />}
                  </p>
                  <div className="space-y-1.5">
                    {BIZ_DOC_TYPES.filter((t) => t.id !== data.businessDoc1).map((t) => (
                      <DocOption key={t.id} {...t}
                        selected={data.businessDoc2 === t.id}
                        disabled={false}
                        onSelect={() => updateData({ businessDoc2: t.id, bizDoc2Uploaded: false })}
                        bounce={bounceIntensity}
                        uploaded={data.businessDoc2 === t.id && data.bizDoc2Uploaded}
                        onUpload={data.businessDoc2 === t.id ? () => updateData({ bizDoc2Uploaded: true }) : undefined}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Btn disabled={!data.bizDoc1Uploaded || !data.bizDoc2Uploaded} onClick={() => handleDone("businessDocs")} />
          </Sec>
        )}

        {/* ═══ Liveness ═══ */}
        <Sec id="liveness" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Liveness check." m="Quick face verification." />
          <div className="mt-5 p-5 rounded-[18px] border border-[rgba(134,134,139,0.1)] bg-[rgba(134,134,139,0.015)]">
            <div className="w-full aspect-[4/3] rounded-[12px] bg-[#f5f5f7] flex items-center justify-center mb-4 relative overflow-hidden">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#86868b]/25 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#86868b]/35" />
                </div>
                <p className="font-['Urbanist',sans-serif] text-[12px] text-[#b0b0b5]">Camera opens here</p>
              </div>
              <motion.div className="absolute inset-0 border-2 border-[#0171e3]/15 rounded-[12px]" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>
            <p className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#202425] mb-2.5">During the check:</p>
            <div className="space-y-2">
              {[{ icon: Scan, text: "Look straight at the camera" }, { icon: MoveRight, text: "Follow visual instructions" }, { icon: Hand, text: "Place your hand briefly in front of your face" }].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-[7px] bg-[#0171e3]/5 flex items-center justify-center flex-shrink-0"><s.icon className="w-3 h-3 text-[#0171e3]" /></div>
                  <span className="font-['Urbanist',sans-serif] text-[12px] text-[#86868b]">{s.text}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd] leading-[1.5]">Liveness is verified by AI and reviewed by real humans. Verification typically takes 3-6 hours.</p>
          </div>
          <motion.button onClick={() => setShowLivenessModal(true)}
            className="mt-5 w-full h-[48px] rounded-[14px] bg-[#202425] text-white font-['Urbanist',sans-serif] font-semibold text-[13px] cursor-pointer flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}><Camera className="w-4 h-4" />Start Liveness Check</motion.button>

          <AnimatePresence>
            {showLivenessModal && (
              <LivenessCheckModal
                onComplete={() => {
                  updateData({ livenessComplete: true });
                  handleDone("liveness");
                }}
                onClose={() => setShowLivenessModal(false)}
              />
            )}
          </AnimatePresence>
        </Sec>

        {/* ═══ Password ═══ */}
        <Sec id="password" refs={sectionRefs} vis={vis} done={done} onEdit={handleEdit}>
          <H b="Password." m="Last step — secure your account." />
          <div className="mt-5 space-y-3">
            <PwInp label="Password" value={data.password || ""} onChange={(v) => updateData({ password: v })} onEnter={() => { if (isPasswordStrong(data.password || "") && data.password === data.rePassword) handleDone("password") }} />
            <PwInp label="Confirm password" value={data.rePassword || ""} onChange={(v) => updateData({ rePassword: v })} onEnter={() => { if (isPasswordStrong(data.password || "") && data.password === data.rePassword) handleDone("password") }} />
          </div>
          <PwStrength pw={data.password || ""} confirm={data.rePassword || ""} />
          <motion.button
            disabled={!isPasswordStrong(data.password || "") || data.password !== data.rePassword}
            onClick={() => handleDone("password")}
            className="mt-5 w-full h-[48px] rounded-[14px] bg-[#0171e3] text-white font-['Urbanist',sans-serif] font-semibold text-[14px] disabled:opacity-15 disabled:cursor-not-allowed cursor-pointer"
            whileHover={isPasswordStrong(data.password || "") && data.password === data.rePassword ? { scale: 1.01 } : {}}
            whileTap={isPasswordStrong(data.password || "") && data.password === data.rePassword ? { scale: 0.98 } : {}}>
            Create Account
          </motion.button>
        </Sec>

        {/* ═══ Success + CEO Note ═══ */}
        <AnimatePresence>
          {completedSections.includes("password") && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="py-16 text-center">
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#34C759]/10 mb-5">
                <Sparkles className="w-8 h-8 text-[#34C759]" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="font-['Urbanist',sans-serif] font-semibold text-[24px] text-[#202425] mb-2">
                Welcome{data.firstName ? `, ${data.firstName}` : ""}!
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="font-['Urbanist',sans-serif] text-[14px] text-[#86868b] max-w-[300px] mx-auto mb-1">
                Your account is ready. Documents will be verified within minutes.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="font-['Urbanist',sans-serif] text-[11px] text-[#c8c8cd] mb-10">
                You'll receive an email once verification is complete.
              </motion.p>

              {/* CEO handwritten note */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[340px] mx-auto p-6 rounded-[20px] bg-[#fafafa] border border-[rgba(134,134,139,0.08)] text-left relative">
                <div className="absolute -top-3 left-6 bg-[#fafafa] px-2">
                  <span className="font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd] uppercase tracking-[0.08em]">A note from our CEO</span>
                </div>
                <p className="font-['Georgia',serif] italic text-[14px] text-[#5a5a5e] leading-[1.7] mt-1">
                  "Thank you for trusting us with your journey. We built Vehsl believing that everyone deserves access to a fair, safe, and beautiful marketplace.
                </p>
                <p className="font-['Georgia',serif] italic text-[14px] text-[#5a5a5e] leading-[1.7] mt-2">
                  You're not just a user — you're part of what we're building together. Welcome home."
                </p>
                {/* Handwritten signature */}
                <div className="mt-5 mb-1">
                  <svg viewBox="0 0 200 56" className="w-[160px] h-[44px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* J */}
                    <path d="M10 14 C10 14, 10 36, 10 40 C10 46, 5 48, 3 45" stroke="#202425" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* u */}
                    <path d="M18 28 C18 40, 22 40, 24 40 C26 40, 28 28, 28 28" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* n */}
                    <path d="M28 28 C28 40, 32 40, 34 40 C36 28, 40 28, 40 40" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* a */}
                    <path d="M50 30 C48 23, 52 22, 56 26 C60 30, 56 40, 52 40 C54 40, 58 40, 60 40" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* i + dot */}
                    <path d="M64 27 L64 40" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <circle cx="64" cy="22" r="1.7" fill="#202425"/>
                    {/* d */}
                    <path d="M74 13 L74 40 M74 27 C72 22, 68 22, 66 27 C65 32, 68 40, 74 38" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* I */}
                    <path d="M88 13 L88 40" stroke="#202425" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                    {/* q */}
                    <path d="M100 27 C100 22, 96 22, 94 27 C92 32, 94 40, 98 40 C102 40, 102 27, 102 40 C102 46, 100 48, 97 49" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* b */}
                    <path d="M108 13 L108 40 M108 27 C110 22, 114 22, 116 28 C118 34, 114 40, 108 38" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* a */}
                    <path d="M126 30 C124 23, 128 22, 132 26 C136 30, 132 40, 128 40 C130 40, 134 40, 136 40" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    {/* l */}
                    <path d="M141 13 L141 40" stroke="#202425" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    {/* flourish underline */}
                    <path d="M3 48 C45 51, 95 53, 143 49 C158 47, 166 48, 174 47" stroke="#202425" strokeWidth="0.7" strokeLinecap="round" opacity="0.22"/>
                  </svg>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0171e3]/8 flex items-center justify-center">
                    <span className="font-['Urbanist',sans-serif] font-semibold text-[10px] text-[#0171e3]">JI</span>
                  </div>
                  <div>
                    <p className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#202425]">Junaid Iqbal</p>
                    <p className="font-['Urbanist',sans-serif] text-[10px] text-[#b0b0b5]">Founder & CEO, Vehsl</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-8" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Reusable sub-components
   ═══════════════════════════════════════ */

/* Section wrapper */
const Sec = forwardRef<HTMLDivElement, {
  id: string;
  refs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  vis: (s: string) => boolean;
  done: (s: string) => boolean;
  onEdit: (s: string) => void;
  children: React.ReactNode;
}>(function Sec({ id, refs, vis, done, onEdit, children }, _ref) {
  if (!vis(id)) return null;

  return (
    <motion.div
      ref={(el) => { refs.current[id] = el; }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-6 overflow-visible"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#86868b]/5 to-transparent" />
      {done(id) ? (
        <div className="relative">
          <div className="opacity-30 pointer-events-none select-none" style={{ transform: "scale(0.98)", transformOrigin: "top left" }}>{children}</div>
          <motion.button onClick={() => onEdit(id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute top-0 right-0 p-2 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5 text-[#86868b]" />
          </motion.button>
        </div>
      ) : children}
    </motion.div>
  );
});

/* Heading */
function H({ b, m }: { b: string; m: string }) {
  return (
    <h2 className="font-['Urbanist',sans-serif] font-semibold text-[19px] leading-[1.3]">
      <span className="text-[#202425]">{b}</span>{" "}
      <span className="text-[#b0b0b5]">{m}</span>
    </h2>
  );
}

/* Input with inline right-side action button */
function InpWithAction({ label, value, onChange, type = "text", actionLabel, actionActive, actionDone, onAction }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  actionLabel: string; actionActive: boolean; actionDone: boolean; onAction: () => void;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;

  return (
    <div onClick={() => ref.current?.focus()} className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{ border: f ? "1.5px solid #0171e3" : has ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", background: f ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}>
      <motion.span initial={{ color: "#b0b0b5", fontSize: 13 }} animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: f ? "#0171e3" : "#b0b0b5" }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none">{label}</motion.span>
      <input ref={(el) => {
          if (ref) { (ref as any).current = el; }
          if (el) {
            const prev = el.dataset.actionDone === 'true';
            if (actionDone && !prev) {
              setTimeout(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const idx = inputs.indexOf(el);
                if (idx > -1 && inputs[idx + 1]) {
                  (inputs[idx + 1] as HTMLElement).focus();
                }
              }, 100);
            }
            el.dataset.actionDone = String(actionDone);
          }
        }} type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && actionActive && !actionDone) { e.preventDefault(); onAction(); } }}
        aria-label={label} className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-28 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[16px] text-[#202425]" style={{ outline: "none" }} />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10">
        {actionDone ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#34C759]/10">
            <Check className="w-3 h-3 text-[#34C759]" />
            <span className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#34C759]">Sent</span>
          </motion.div>
        ) : (
          <motion.button
            disabled={!actionActive}
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="px-3 h-[34px] rounded-[10px] font-['Urbanist',sans-serif] font-semibold text-[12px] whitespace-nowrap cursor-pointer disabled:cursor-not-allowed transition-all"
            style={{ background: actionActive ? "rgba(1,113,227,0.09)" : "rgba(134,134,139,0.05)", color: actionActive ? "#0171e3" : "#c8c8cd" }}
            whileHover={actionActive ? { scale: 1.03 } : {}} whileTap={actionActive ? { scale: 0.96 } : {}}>
            {actionLabel}
          </motion.button>
        )}
      </div>
    </div>
  );
}

/* Auto-completing 6-digit code input */
function AutoCodeInp({ label, value, onChange, onComplete }: {
  label: string; value: string; onChange: (v: string) => void; onComplete: () => void;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const complete = digits.length === 6;

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, 6);
    onChange(cleaned);
    if (cleaned.length === 6) setTimeout(() => onComplete(), 350);
  };

  return (
    <div onClick={() => ref.current?.focus()} className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{ border: complete ? "1.5px solid #34C759" : f ? "1.5px solid #0171e3" : digits.length > 0 ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", background: complete ? "rgba(52,199,89,0.02)" : f ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}>
      <motion.span initial={{ color: "#b0b0b5", fontSize: 13 }} animate={{ top: digits.length > 0 || f ? 6 : 15, fontSize: digits.length > 0 || f ? 10 : 13, color: complete ? "#34C759" : f ? "#0171e3" : "#b0b0b5" }}
        transition={{ duration: 0.15 }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none">{label}</motion.span>
      <input ref={ref} type="text" inputMode="numeric" pattern="[0-9]*" value={digits}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && complete) { e.preventDefault(); onComplete(); } }}
        aria-label={label} className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-12 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[16px] tracking-[0.15em] text-[#202425]" style={{ outline: "none" }} />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {complete ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </motion.div>
        ) : (
          <span className="font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd]">{digits.length}/6</span>
        )}
      </div>
    </div>
  );
}

/* Floating input */
function Inp({ label, value, onChange, type = "text", onEnter }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; onEnter?: () => void;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;

  return (
    <div onClick={() => ref.current?.focus()} className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{ border: f ? "1.5px solid #0171e3" : has ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", background: f ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}>
      <motion.span initial={{ color: "#b0b0b5", fontSize: 13 }} animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: f ? "#0171e3" : "#b0b0b5" }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none">{label}</motion.span>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
        aria-label={label} className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[16px] text-[#202425]" style={{ outline: "none" }} />
    </div>
  );
}

/* Password input with toggle */
function PwInp({ label, value, onChange, onEnter }: { label: string; value: string; onChange: (v: string) => void; onEnter?: () => void; }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;

  return (
    <div onClick={() => ref.current?.focus()} className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{ border: f ? "1.5px solid #0171e3" : has ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", background: f ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}>
      <motion.span initial={{ color: "#b0b0b5", fontSize: 13 }} animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: f ? "#0171e3" : "#b0b0b5" }}
        transition={{ duration: 0.15 }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none">{label}</motion.span>
      <input ref={ref} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)} aria-label={label}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
        className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-10 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[13px] text-[#202425]" style={{ outline: "none" }} />
      <button type="button" onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8c8cd] hover:text-[#86868b] transition-colors z-20 p-1 cursor-pointer">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* Password strength meter */
function PwStrength({ pw, confirm }: { pw: string; confirm: string }) {
  const checks = getPasswordChecks(pw);
  const met = checks.filter((c) => c.met).length;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const is16 = pw.length >= 16;
  if (!pw) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-visible">
      <div className="flex gap-1 mb-2.5">
        {[1,2,3,4,5].map((i) => (
          <motion.div key={i} className="h-[2px] flex-1 rounded-full"
            initial={{ backgroundColor: "rgba(134,134,139,0.08)" }}
            animate={{ backgroundColor: i <= met ? (met <= 2 ? "#FF3B30" : met <= 3 ? "#FF9500" : "#34C759") : "rgba(134,134,139,0.08)" }}
            transition={{ duration: 0.25 }} />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${c.met ? "bg-[#34C759]/10" : "bg-[#86868b]/5"}`}>
              {c.met && <Check className="w-2 h-2 text-[#34C759]" />}
            </div>
            <span className={`font-['Urbanist',sans-serif] text-[10px] ${c.met ? "text-[#34C759]" : "text-[#c8c8cd]"}`}>{c.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${is16 ? "bg-[#0171e3]/10" : "bg-[#86868b]/3"}`}>
            {is16 ? <Sparkles className="w-2 h-2 text-[#0171e3]" /> : <Lock className="w-2 h-2 text-[#d8d8dd]" />}
          </div>
          <span className={`font-['Urbanist',sans-serif] text-[10px] ${is16 ? "text-[#0171e3]" : "text-[#d8d8dd]"}`}>
            16+ characters {is16 ? "— extra secure!" : "(optional)"}
          </span>
        </div>
        {mismatch && (
          <motion.div initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-[#FF3B30]/8 flex items-center justify-center flex-shrink-0">
              <span className="text-[#FF3B30] text-[7px]">✕</span>
            </div>
            <span className="font-['Urbanist',sans-serif] text-[10px] text-[#FF3B30]">Passwords don't match yet</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* Dropdown with smart scroll arrows */
function Drop({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const r = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (r.current && !r.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setAtTop(el.scrollTop <= 2);
    setAtBottom(el.scrollTop >= el.scrollHeight - el.clientHeight - 2);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => checkScroll(), 30);
  }, [open, checkScroll]);

  return (
    <div ref={r} className="relative w-full overflow-visible">
      <motion.button onClick={() => setOpen(!open)}
        className="w-full h-[52px] rounded-[14px] px-3.5 flex items-center justify-between cursor-pointer"
        style={{ border: open ? "1.5px solid #0171e3" : value ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", background: open ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}
        whileTap={{ scale: 0.99 }}>
        <div className="flex flex-col items-start min-w-0">
          {value && <span className="font-['Urbanist',sans-serif] font-medium text-[9px] text-[#b0b0b5]">{label}</span>}
          <span className={`font-['Urbanist',sans-serif] font-semibold text-[13px] truncate ${value ? "text-[#202425]" : "text-[#b0b0b5]"}`}>{value || label}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 ml-1"><ChevronDown className="w-3 h-3 text-[#c8c8cd]" /></motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 right-0 rounded-[10px] border border-[rgba(134,134,139,0.08)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-50 overflow-hidden">
            {!atTop && (
              <button onClick={() => { listRef.current?.scrollBy({ top: -72, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center py-1.5 hover:bg-[#f5f5f7] transition-colors border-b border-[rgba(134,134,139,0.05)] cursor-pointer">
                <ChevronUp className="w-3.5 h-3.5 text-[#b0b0b5]" />
              </button>
            )}
            <div ref={listRef} onScroll={checkScroll} className="max-h-[168px] overflow-y-auto p-1" style={{ scrollbarWidth: "none" }}>
              {options.map((o) => (
                <button key={o} onClick={() => { onChange(o); setOpen(false); }}
                  className="w-full px-2.5 py-1.5 text-left rounded-[6px] font-['Urbanist',sans-serif] font-medium text-[12px] text-[#86868b] hover:text-[#202425] hover:bg-[#f5f5f7] transition-colors cursor-pointer">{o}</button>
              ))}
            </div>
            {!atBottom && (
              <button onClick={() => { listRef.current?.scrollBy({ top: 72, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center py-1.5 hover:bg-[#f5f5f7] transition-colors border-t border-[rgba(134,134,139,0.05)] cursor-pointer">
                <ChevronDown className="w-3.5 h-3.5 text-[#b0b0b5]" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Country code picker */
function CodePicker({ value, flag, onChange }: { value: string; flag: string; onChange: (c: string, f: string) => void }) {
  const [open, setOpen] = useState(false);
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (r.current && !r.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div ref={r} className="relative overflow-visible">
      <motion.button onClick={() => setOpen(!open)}
        className="w-full h-[52px] rounded-[14px] px-2.5 flex items-center justify-center gap-1 cursor-pointer"
        style={{ border: open ? "1.5px solid #0171e3" : "1.5px solid rgba(134,134,139,0.12)", transition: "border-color .2s" }}
        whileTap={{ scale: 0.98 }}>
        {flag && (
          <img
            src={`https://flagcdn.com/w20/${Array.from(flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w40/${Array.from(flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase()}.png 2x`}
            alt="flag"
            className="w-[18px] h-[13px] rounded-[2px] object-cover flex-shrink-0"
          />
        )}
        <span className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#202425]">{value}</span>
        <ChevronDown className="w-2.5 h-2.5 text-[#c8c8cd]" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 w-[220px] max-h-[220px] overflow-y-auto rounded-[10px] border border-[rgba(134,134,139,0.08)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-50 p-1 cscroll">
            {COUNTRIES.map((c) => {
              const iso = Array.from(c.flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase();
              return (
                <button key={c.name} onClick={() => { onChange(c.code, c.flag); setOpen(false); }}
                  className="w-full px-2.5 py-1.5 text-left rounded-[6px] flex items-center gap-2 hover:bg-[#f5f5f7] transition-colors cursor-pointer">
                  <img src={`https://flagcdn.com/w20/${iso}.png`} srcSet={`https://flagcdn.com/w40/${iso}.png 2x`} alt={c.name} className="w-[18px] h-[13px] rounded-[2px] object-cover flex-shrink-0" />
                  <span className="font-['Urbanist',sans-serif] font-medium text-[11px] text-[#202425] flex-1 truncate">{c.name}</span>
                  <span className="font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd]">{c.code}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Country select with search */
function CountrySelect({ value, flag, onChange, placeholder = "Country" }: { value: string; flag?: string; onChange: (n: string, f: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const r = useRef<HTMLDivElement>(null);
  const ir = useRef<HTMLInputElement>(null);
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { const h = (e: MouseEvent) => { if (r.current && !r.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div ref={r} className="relative w-full overflow-visible">
      <div onClick={() => { setOpen(true); setTimeout(() => ir.current?.focus(), 50); }}
        className="relative w-full h-[52px] rounded-[14px] cursor-text flex items-center px-4 gap-2"
        style={{ border: open ? "1.5px solid #0171e3" : value ? "1.5px solid rgba(1,113,227,0.18)" : "1.5px solid rgba(134,134,139,0.12)", transition: "border-color .2s" }}>
        {value && flag && (
          <img
            src={`https://flagcdn.com/w20/${Array.from(flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w40/${Array.from(flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase()}.png 2x`}
            alt="flag"
            className="w-[18px] h-[13px] rounded-[2px] object-cover flex-shrink-0"
          />
        )}
        {!open && !value && <Globe className="w-4 h-4 text-[#c8c8cd]" />}
        {!open && !value && <span className="font-['Urbanist',sans-serif] font-medium text-[13px] text-[#b0b0b5]">{placeholder}</span>}
        {!open && value && <span className="font-['Urbanist',sans-serif] font-semibold text-[13px] text-[#202425]">{value}</span>}
        {open && <input ref={ir} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${placeholder.toLowerCase()}…`}
          className="flex-1 bg-transparent border-none font-['Urbanist',sans-serif] font-medium text-[13px] text-[#202425] placeholder:text-[#c8c8cd]" style={{ outline: "none" }} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 right-0 max-h-[200px] overflow-y-auto rounded-[10px] border border-[rgba(134,134,139,0.08)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-50 p-1 cscroll">
            {filtered.length === 0 && <p className="px-2.5 py-1.5 text-[11px] text-[#c8c8cd] font-['Urbanist',sans-serif]">No results</p>}
            {filtered.map((c) => {
              const iso = Array.from(c.flag).map(ch => String.fromCharCode(ch.codePointAt(0)! - 127397)).join('').toLowerCase();
              return (
                <button key={c.name} onClick={() => { onChange(c.name, c.flag); setOpen(false); setSearch(""); }}
                  className="w-full px-2.5 py-1.5 text-left rounded-[6px] flex items-center gap-2 hover:bg-[#f5f5f7] transition-colors cursor-pointer">
                  <img src={`https://flagcdn.com/w20/${iso}.png`} srcSet={`https://flagcdn.com/w40/${iso}.png 2x`} alt={c.name} className="w-[18px] h-[13px] rounded-[2px] object-cover flex-shrink-0" />
                  <span className="font-['Urbanist',sans-serif] font-medium text-[12px] text-[#202425]">{c.name}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Document option button with inline upload */
function DocOption({ id, label, hint, icon: Icon, selected, disabled, onSelect, bounce, uploaded, onUpload }: {
  id: string; label: string; hint: string; icon: any; selected: boolean; disabled: boolean; onSelect: () => void; bounce: number; uploaded?: boolean; onUpload?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!selected) {
      onSelect();
      setTimeout(() => fileInputRef.current?.click(), 150);
    } else if (!uploaded) {
      fileInputRef.current?.click();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload();
    }
  };

  return (
    <div className="w-full">
      <motion.button onClick={handleClick} disabled={disabled}
        className="w-full px-4 py-3 rounded-[14px] flex items-center gap-3 text-left cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed overflow-visible"
        style={{ border: selected ? "2px solid #0171e3" : "1.5px solid rgba(134,134,139,0.08)", background: selected ? "rgba(1,113,227,0.025)" : "transparent" }}
        whileHover={!disabled ? { scale: 1.008 + bounce * 0.002 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}>
        <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 ${selected ? "bg-[#0171e3]/6" : "bg-[#86868b]/4"}`}>
          <Icon className={`w-4 h-4 ${selected ? "text-[#0171e3]" : "text-[#86868b]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`font-['Urbanist',sans-serif] font-semibold text-[13px] block ${selected ? "text-[#202425]" : "text-[#86868b]"}`}>{label}</span>
          <span className="font-['Urbanist',sans-serif] text-[10px] text-[#c8c8cd]">{hint}</span>
        </div>
        {selected && !uploaded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#0171e3]/8 flex-shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-[#0171e3]" />
            <span className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#0171e3]">Select file</span>
          </motion.div>
        )}
        {uploaded && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleEditClick}
              className="w-6 h-6 rounded-full bg-[#0171e3]/8 flex items-center justify-center hover:bg-[#0171e3]/15 transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3 text-[#0171e3]" />
            </motion.div>
          </div>
        )}
      </motion.button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

/* Trust banner */
function TrustBanner() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
      className="mt-3 mb-3 flex items-start gap-2.5 p-3 rounded-[12px] bg-[rgba(52,199,89,0.03)] border border-[rgba(52,199,89,0.08)]">
      <Shield className="w-3.5 h-3.5 text-[#34C759] mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-['Urbanist',sans-serif] font-semibold text-[11px] text-[#202425] mb-0.5">Sandboxed & encrypted</p>
        <p className="font-['Urbanist',sans-serif] text-[10px] text-[#86868b] leading-[1.5]">AES-256 encryption. Personal data is processed and stored securely & locally. </p>
      </div>
    </motion.div>
  );
}

/* Liveness Check Modal */
function LivenessCheckModal({ onComplete, onClose }: { onComplete: () => void; onClose: () => void }) {
  const [stage, setStage] = useState<'positioning' | 'ready' | 'instructions' | 'hand' | 'flash' | 'complete'>('positioning');
  const [positionFeedback, setPositionFeedback] = useState<'move-closer' | 'perfect' | 'look-center'>('move-closer');
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [flashColor, setFlashColor] = useState<'blue' | 'green' | 'red'>('blue');
  const [instructions, setInstructions] = useState<Array<{ icon: any; text: string; detail: string }>>([]);
  const [stageComplete, setStageComplete] = useState(false);

  const allInstructions = useMemo(() => [
    { icon: ArrowRight, text: "Turn your head right", detail: "Look to the right side" },
    { icon: ArrowLeft, text: "Turn your head left", detail: "Look to the left side" },
    { icon: ArrowUp, text: "Tilt your head up", detail: "Look up slowly" },
    { icon: Smile, text: "Smile", detail: "Give us a smile" },
    { icon: Eye, text: "Blink twice", detail: "Blink your eyes twice" },
  ], []);

  useEffect(() => {
    const shuffled = [...allInstructions].sort(() => Math.random() - 0.5).slice(0, 3);
    setInstructions(shuffled);
  }, [allInstructions]);

  // Simulate positioning feedback
  useEffect(() => {
    if (stage === 'positioning') {
      const feedbackSteps = ['move-closer', 'look-center', 'perfect'] as const;
      let step = 0;
      const interval = setInterval(() => {
        if (step < feedbackSteps.length) {
          setPositionFeedback(feedbackSteps[step]);
          step++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setStageComplete(true);
            setTimeout(() => {
              setStage('ready');
              setStageComplete(false);
            }, 800);
          }, 500);
        }
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'ready') {
      const timer = setTimeout(() => setStage('instructions'), 1500);
      return () => clearTimeout(timer);
    }
    if (stage === 'instructions' && instructions.length > 0) {
      const timer = setTimeout(() => {
        setStageComplete(true);
        setTimeout(() => {
          if (currentInstruction === instructions.length - 1) {
            setStage('hand');
            setCurrentInstruction(0);
          } else {
            setCurrentInstruction(currentInstruction + 1);
          }
          setStageComplete(false);
        }, 600);
      }, 2500);
      return () => clearTimeout(timer);
    }
    if (stage === 'hand') {
      const timer = setTimeout(() => {
        setStageComplete(true);
        setTimeout(() => {
          setStage('flash');
          setStageComplete(false);
        }, 600);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (stage === 'flash') {
      const colors: Array<'blue' | 'green' | 'red'> = ['blue', 'green', 'red'];
      let index = 0;
      const interval = setInterval(() => {
        index++;
        if (index < colors.length) {
          setFlashColor(colors[index]);
        } else {
          clearInterval(interval);
          setStage('complete');
        }
      }, 800);
      return () => clearInterval(interval);
    }
    if (stage === 'complete') {
      const timer = setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, currentInstruction, instructions, onComplete, onClose]);

  const flashColors = {
    blue: '#0171e3',
    green: '#34C759',
    red: '#FF3B30'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: '#000000'
      }}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
        {stage === 'positioning' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-8"
          >
            <motion.div
              className="relative w-72 h-72 rounded-full flex items-center justify-center"
              style={{
                border: stageComplete ? '4px solid #34C759' : '4px solid #0171e3',
                transition: 'border-color 0.3s ease'
              }}
              animate={stageComplete ? { scale: 1 } : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: stageComplete ? 0 : Infinity }}
            >
              <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-16 h-16 text-white/60" />
              </div>
              {stageComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={positionFeedback}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="font-['Urbanist',sans-serif] font-bold text-[24px] text-white mb-2">
                  {positionFeedback === 'move-closer' && 'Move closer'}
                  {positionFeedback === 'look-center' && 'Look at the camera'}
                  {positionFeedback === 'perfect' && 'Perfect!'}
                </p>
                <p className="font-['Urbanist',sans-serif] text-[14px] text-white/70">
                  {positionFeedback === 'move-closer' && 'Position your face in the circle'}
                  {positionFeedback === 'look-center' && 'Keep your face centered'}
                  {positionFeedback === 'perfect' && 'Hold still for a moment'}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {stage === 'ready' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-[#34C759] flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>
            <div className="text-center">
              <p className="font-['Urbanist',sans-serif] font-bold text-[24px] text-white mb-2">
                Ready!
              </p>
              <p className="font-['Urbanist',sans-serif] text-[14px] text-white/70">
                Follow the instructions
              </p>
            </div>
          </motion.div>
        )}

        {stage === 'instructions' && instructions[currentInstruction] && (
          <motion.div
            key={currentInstruction}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <motion.div
                className="w-32 h-32 rounded-full bg-[#0171e3] flex items-center justify-center"
                animate={stageComplete ? { scale: 1 } : { scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: stageComplete ? 0 : Infinity }}
              >
                {(() => {
                  const Icon = instructions[currentInstruction].icon;
                  return <Icon className="w-16 h-16 text-white" />;
                })()}
              </motion.div>
              <AnimatePresence>
                {stageComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 w-32 h-32 rounded-full bg-[#34C759] flex items-center justify-center"
                  >
                    <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-center">
              <motion.p
                className="font-['Urbanist',sans-serif] font-bold text-[28px] text-white mb-2"
              >
                {instructions[currentInstruction].text}
              </motion.p>
              <motion.p
                className="font-['Urbanist',sans-serif] text-[16px] text-white/70"
              >
                {instructions[currentInstruction].detail}
              </motion.p>
            </div>
            <div className="flex gap-2 mt-4">
              {instructions.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: i <= currentInstruction ? '#fff' : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'hand' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <motion.div
                className="w-32 h-32 rounded-full bg-[#0171e3] flex items-center justify-center"
                animate={stageComplete ? { scale: 1 } : { scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: stageComplete ? 0 : Infinity }}
              >
                <Hand className="w-16 h-16 text-white" />
              </motion.div>
              <AnimatePresence>
                {stageComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 w-32 h-32 rounded-full bg-[#34C759] flex items-center justify-center"
                  >
                    <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-center">
              <motion.p
                className="font-['Urbanist',sans-serif] font-bold text-[28px] text-white mb-2"
              >
                {stageComplete ? 'Perfect!' : 'Place your hand in front of your face'}
              </motion.p>
              <motion.p
                className="font-['Urbanist',sans-serif] text-[16px] text-white/70"
              >
                {stageComplete ? 'Hand gesture detected' : 'Cover your face briefly with your hand'}
              </motion.p>
            </div>
          </motion.div>
        )}

        {stage === 'flash' && (
          <>
            <motion.div
              key={flashColor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle, ${flashColors[flashColor]}40 0%, ${flashColors[flashColor]} 100%)`,
                border: `20px solid ${flashColors[flashColor]}`,
                boxShadow: `inset 0 0 100px ${flashColors[flashColor]}`
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 flex flex-col items-center gap-8"
            >
              <motion.div
                className="relative w-64 h-64 rounded-full border-4 flex items-center justify-center"
                style={{ borderColor: flashColors[flashColor] }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <div className="w-48 h-48 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-16 h-16 text-white/60" />
                </div>
              </motion.div>
              <div className="text-center">
                <p className="font-['Urbanist',sans-serif] font-bold text-[28px] text-white mb-2">
                  Keep yourself closer to screen
                </p>
                <p className="font-['Urbanist',sans-serif] text-[16px] text-white/70">
                  Verifying authenticity...
                </p>
              </div>
            </motion.div>
          </>
        )}

        {stage === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-32 h-32 rounded-full bg-[#34C759] flex items-center justify-center"
            >
              <Check className="w-16 h-16 text-white" strokeWidth={3} />
            </motion.div>
            <div className="text-center">
              <p className="font-['Urbanist',sans-serif] font-bold text-[28px] text-white mb-2">
                Verified!
              </p>
              <p className="font-['Urbanist',sans-serif] text-[16px] text-white/70">
                You're all set
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* Continue button */
function Btn({ disabled, onClick, label = "Continue" }: { disabled: boolean; onClick: () => void; label?: string }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      className="mt-5 w-full h-[46px] rounded-[14px] bg-[#0171e3] text-white font-['Urbanist',sans-serif] font-semibold text-[13px] disabled:opacity-12 disabled:cursor-not-allowed cursor-pointer"
      whileHover={!disabled ? { scale: 1.01 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}>{label}</motion.button>
  );
}

/* ═══════════════════════════════════════
   NEW: Percentage input
   ═══════════════════════════════════════ */
function PercentInp({ label, value, onChange, onEnter }: {
  label: string; value: string; onChange: (v: string) => void; onEnter?: () => void;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;
  const num = parseInt(value, 10);
  const isOver = has && !isNaN(num) && num > 100;
  const isValid = has && !isNaN(num) && num >= 1 && num <= 100;

  return (
    <div
      onClick={() => ref.current?.focus()}
      className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{
        border: f
          ? (isOver ? "1.5px solid #FF3B30" : "1.5px solid #0171e3")
          : isOver
            ? "1.5px solid rgba(255,59,48,0.28)"
            : isValid
              ? "1.5px solid rgba(52,199,89,0.28)"
              : has
                ? "1.5px solid rgba(1,113,227,0.18)"
                : "1.5px solid rgba(134,134,139,0.12)",
        background: f ? "rgba(1,113,227,0.01)" : "transparent",
        transition: "border-color .2s",
      }}
    >
      <motion.span
        initial={{ color: "#b0b0b5", fontSize: 13 }}
        animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: f ? (isOver ? "#FF3B30" : "#0171e3") : isOver ? "#FF3B30" : "#b0b0b5" }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none"
      >{label}</motion.span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const val = e.target.value.replace(/[^\d.]/g, "");
          const parts = val.split(".");
          const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : val;
          onChange(cleaned);
        }}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(); } }}
        aria-label={label}
        className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-14 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[16px] text-[#202425]"
        style={{ outline: "none" }}
      />
      {has && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <span className={`font-['Urbanist',sans-serif] font-semibold text-[16px] ${isOver ? "text-[#FF3B30]" : "text-[#202425]"}`}>%</span>
          {isOver && (
            <motion.span initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
              className="font-['Urbanist',sans-serif] text-[9px] text-[#FF3B30] whitespace-nowrap">max 100</motion.span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   NEW: IBAN input with formatting
   ═══════════════════════════════════════ */
function IBANInp({ label, value, onChange, onEnter, matchValue }: {
  label: string; value: string; onChange: (v: string) => void; onEnter?: () => void; matchValue?: string;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;

  // Display with spaces every 4 characters
  const displayValue = value.replace(/[^A-Z0-9]/g, "").match(/.{1,4}/g)?.join(" ") ?? value;

  const isMatch = matchValue !== undefined ? (value.length > 0 && value === matchValue) : null;
  const isMismatch = matchValue !== undefined && value.length > 2 && value !== matchValue;

  let borderColor: string;
  if (f) {
    borderColor = "1.5px solid #0171e3";
  } else if (isMismatch) {
    borderColor = "1.5px solid rgba(255,59,48,0.28)";
  } else if (isMatch) {
    borderColor = "1.5px solid rgba(52,199,89,0.28)";
  } else if (has) {
    borderColor = "1.5px solid rgba(1,113,227,0.18)";
  } else {
    borderColor = "1.5px solid rgba(134,134,139,0.12)";
  }

  const labelColor = f ? "#0171e3" : isMismatch ? "#FF3B30" : isMatch ? "#34C759" : "#b0b0b5";

  return (
    <div>
      <div
        onClick={() => ref.current?.focus()}
        className="relative w-full h-[52px] rounded-[14px] cursor-text"
        style={{ border: borderColor, background: f ? "rgba(1,113,227,0.01)" : "transparent", transition: "border-color .2s" }}
      >
        <motion.span
          initial={{ color: "#b0b0b5", fontSize: 13 }}
          animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: labelColor }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none"
        >{label}</motion.span>
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={(e) => {
            // Strip spaces, uppercase, only alphanumeric, max 34 chars
            const clean = e.target.value.replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34);
            onChange(clean);
          }}
          onFocus={() => setF(true)}
          onBlur={() => setF(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(); } }}
          aria-label={label}
          className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-11 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[13px] text-[#202425] tracking-[0.05em]"
          style={{ outline: "none" }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isMatch && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(52,199,89,0.1)" }}
            >
              <Check className="w-3 h-3 text-[#34C759]" />
            </motion.div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isMismatch && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="mt-1 ml-1 font-['Urbanist',sans-serif] text-[10px] text-[#FF3B30]"
          >
            IBANs don't match
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════
   NEW: SWIFT / BIC input
   ═══════════════════════════════════════ */
function SwiftBicInp({ label, value, onChange, onEnter }: {
  label: string; value: string; onChange: (v: string) => void; onEnter?: () => void;
}) {
  const [f, setF] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const has = value.length > 0;
  const up = f || has;
  const isValid = has && (value.length === 8 || value.length === 11);
  const remaining = has && value.length < 8 ? 8 - value.length : 0;
  const hint = has && !isValid
    ? (value.length < 8 ? `${remaining} more` : value.length === 9 ? "9 chars — need 8 or 11" : value.length === 10 ? "10 chars — need 11" : "")
    : "";

  return (
    <div
      onClick={() => ref.current?.focus()}
      className="relative w-full h-[52px] rounded-[14px] cursor-text"
      style={{
        border: f
          ? "1.5px solid #0171e3"
          : isValid
            ? "1.5px solid rgba(52,199,89,0.28)"
            : has
              ? "1.5px solid rgba(1,113,227,0.18)"
              : "1.5px solid rgba(134,134,139,0.12)",
        background: f ? "rgba(1,113,227,0.01)" : "transparent",
        transition: "border-color .2s",
      }}
    >
      <motion.span
        initial={{ color: "#b0b0b5", fontSize: 13 }}
        animate={{ top: up ? 6 : 15, fontSize: up ? 10 : 13, color: f ? "#0171e3" : "#b0b0b5" }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-4 pointer-events-none font-['Urbanist',sans-serif] font-medium select-none"
      >{label}</motion.span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => {
          const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
          onChange(clean);
        }}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(); } }}
        aria-label={label}
        className="absolute inset-0 w-full h-full px-4 pt-5 pb-1 pr-24 bg-transparent border-none rounded-[14px] font-['Urbanist',sans-serif] font-semibold text-[16px] text-[#202425] tracking-[0.06em]"
        style={{ outline: "none" }}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isValid ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(52,199,89,0.1)" }}
          >
            <Check className="w-3 h-3 text-[#34C759]" />
          </motion.div>
        ) : hint ? (
          <span className="font-['Urbanist',sans-serif] text-[9px] text-[#c8c8cd] whitespace-nowrap">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Document upload zone — real file input,
   auto-opens picker, left-aligned layout
   ═══════════════════════════════════════ */
function UploadZone({ label, uploaded, onUpload }: {
  label: string; uploaded: boolean; onUpload: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [progress, setProgress] = useState(0);

  // Auto-open the file picker as soon as this zone mounts
  // (safe: fires immediately after the user's DocOption click gesture)
  useEffect(() => {
    if (!uploaded) {
      const t = setTimeout(() => fileInputRef.current?.click(), 120);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mb = file.size / 1_048_576;
    setFileName(file.name);
    setFileSize(mb < 1 ? `${Math.round(file.size / 1024)} KB` : `${mb.toFixed(1)} MB`);
    setUploading(true);
    setProgress(0);
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18 + 7;
      if (p >= 100) {
        clearInterval(tick);
        setProgress(100);
        setTimeout(() => { setUploading(false); onUpload(); }, 320);
      } else {
        setProgress(p);
      }
    }, 130);
  };

  const openPicker = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  return (
    <div className="mt-2 mb-1">
      {/* Hidden real file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="sr-only"
        onChange={handleFileChange}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      <motion.div
        className="w-full rounded-[13px] overflow-hidden"
        style={{
          border: uploaded
            ? "1.5px solid rgba(52,199,89,0.22)"
            : uploading
              ? "1.5px solid rgba(1,113,227,0.2)"
              : "1.5px dashed rgba(134,134,139,0.22)",
          background: uploaded
            ? "rgba(52,199,89,0.03)"
            : uploading
              ? "rgba(1,113,227,0.02)"
              : "rgba(249,249,251,0.8)",
        }}
      >
        <AnimatePresence mode="wait">

          {/* ── Uploading state ── */}
          {uploading && (
            <motion.div key="uploading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-4 py-3.5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(1,113,227,0.07)" }}>
                  <div className="w-3.5 h-3.5 rounded-full spin-slow"
                    style={{ border: "1.5px solid rgba(1,113,227,0.18)", borderTopColor: "#0171e3" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#202425] truncate mb-0.5">
                    {fileName}
                  </p>
                  <p className="font-['Urbanist',sans-serif] text-[10px] text-[#86868b] mb-2">
                    {fileSize} · Uploading {Math.round(progress)}%
                  </p>
                  {/* Progress bar */}
                  <div className="h-[2px] rounded-full overflow-hidden"
                    style={{ background: "rgba(134,134,139,0.1)" }}>
                    <motion.div
                      className="h-full bg-[#0171e3] rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Uploaded / done state ── */}
          {!uploading && uploaded && (
            <motion.div key="done"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(52,199,89,0.09)" }}>
                  <Check className="w-4 h-4 text-[#34C759]" />
                </div>
                {/* Left-aligned file info */}
                <div className="flex-1 min-w-0">
                  <p className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#202425] truncate">
                    {fileName || label}
                  </p>
                  <p className="font-['Urbanist',sans-serif] text-[10px] text-[#34C759]">
                    {fileSize ? `${fileSize} · ` : ""}Ready
                  </p>
                </div>
                <button
                  onClick={openPicker}
                  className="font-['Urbanist',sans-serif] text-[10px] text-[#b0b0b5] hover:text-[#0171e3] transition-colors cursor-pointer flex-shrink-0 px-2.5 py-1 rounded-[7px] hover:bg-white"
                >
                  Change
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Idle state (shown briefly before auto-open, or if picker was dismissed) ── */}
          {!uploading && !uploaded && (
            <motion.button key="idle"
              onClick={openPicker}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full px-4 py-3.5 flex items-center gap-3 cursor-pointer text-left"
              whileHover={{ background: "rgba(1,113,227,0.025)" }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(1,113,227,0.06)" }}>
                <Upload className="w-3.5 h-3.5" style={{ color: "rgba(1,113,227,0.5)" }} />
              </div>
              {/* Left-aligned format + size info */}
              <div className="flex-1 min-w-0">
                <p className="font-['Urbanist',sans-serif] font-semibold text-[12px] text-[#0171e3]">
                  Select your {label.toLowerCase()}
                </p>
                <p className="font-['Urbanist',sans-serif] text-[10px] text-[#b0b0b5]">
                  JPG, PNG or PDF · Max 10 MB
                </p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(1,113,227,0.06)" }}>
                <ChevronDown className="w-3 h-3 text-[#0171e3]/40" style={{ transform: "rotate(-90deg)" }} />
              </div>
            </motion.button>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
