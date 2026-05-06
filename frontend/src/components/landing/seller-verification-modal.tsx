"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X, ArrowRight, ArrowLeft, Check, Camera, Building2, User, CreditCard,
  Users, Package, ShieldCheck, Truck, ChevronDown, ChevronRight, Plus,
  Trash2, Mail, Clock, MapPin, Star, Sparkles, FileText, ScanFace,
  BadgeCheck, Fingerprint, AlertCircle, Lock,
} from "lucide-react";

// ─── Spring configs ──────────────────────────────────────────────────────
const spring  = { type: "spring", bounce: 0.28, duration: 0.42 } as const;
const snappy  = { type: "spring", bounce: 0.45, duration: 0.28 } as const;
const bouncy  = { type: "spring", bounce: 0.55, duration: 0.36 } as const;

// ─── Shared atoms ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", optional,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[11.5px] mb-1.5" style={{ fontWeight: 520, fontFamily: "Urbanist, sans-serif", color: focused ? "#0071e3" : "#86868b" }}>
        {label}
        {optional && <span className="ml-1.5 text-[10px] text-[#c4c4c4]">optional</span>}
      </p>
      <motion.div
        animate={{
          boxShadow: focused ? "0 0 0 3px rgba(0,113,227,0.1), 0 1px 4px rgba(0,0,0,0.04)" : "0 1px 3px rgba(0,0,0,0.04)",
          borderColor: focused ? "rgba(0,113,227,0.35)" : "rgba(0,0,0,0.08)",
        }}
        transition={{ duration: 0.18 }}
        className="rounded-[13px] border overflow-hidden"
        style={{ background: "rgba(255,255,255,0.8)" }}
      >
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-3.5 py-2.5 bg-transparent outline-none text-[13.5px] text-[#1d1d1f] placeholder:text-[#c4c4c4]"
          style={{ fontWeight: 420, fontFamily: "Urbanist, sans-serif" }}
        />
      </motion.div>
    </div>
  );
}

function InfoBox({ icon: Icon, color, children }: { icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[13px]" style={{ background: `${color}09`, border: `1px solid ${color}1f` }}>
      <Icon size={12} className="mt-[2px] shrink-0" style={{ color }} strokeWidth={1.8} />
      <div className="text-[11.5px] text-[#56585d] leading-relaxed" style={{ fontWeight: 430 }}>{children}</div>
    </div>
  );
}

// ─── Upload button ───────────────────────────────────────────────────────

function UploadBtn({ file, onFile, label }: { file: File | null; onFile: (f: File) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={snappy}
        onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-3 py-2 rounded-[10px] cursor-pointer shrink-0"
        style={{
          background: file ? "rgba(52,199,89,0.08)" : "rgba(0,113,227,0.07)",
          border: file ? "1px solid rgba(52,199,89,0.22)" : "1px solid rgba(0,113,227,0.18)",
        }}
      >
        {file ? <Check size={12} className="text-[#34c759]" strokeWidth={2.5} /> : <Camera size={12} className="text-[#0071e3]" strokeWidth={1.8} />}
        <span className="text-[11.5px] whitespace-nowrap" style={{ fontWeight: 580, color: file ? "#34c759" : "#0071e3", fontFamily: "Urbanist, sans-serif" }}>
          {file ? "Uploaded" : (label ?? "Upload")}
        </span>
      </motion.button>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </>
  );
}

// ─── Accordion card shell ────────────────────────────────────────────────

function AccordionCard({
  number, title, subtitle, isOpen, isComplete, onToggle, children,
}: {
  number: number; title: string; subtitle: string;
  isOpen: boolean; isComplete: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      className="rounded-[18px] overflow-hidden"
      animate={{
        boxShadow: isOpen ? "0 0 0 2px #0071e3, 0 0 18px rgba(0,113,227,0.14)" : "0 0 0 1px rgba(0,0,0,0.07)",
        background: isOpen ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
      }}
      transition={{ duration: 0.22 }}
    >
      <motion.button
        whileTap={{ scale: 0.99 }} transition={snappy}
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer"
      >
        <motion.div
          animate={{ background: isComplete ? "#34c759" : isOpen ? "#0071e3" : "rgba(0,0,0,0.07)", scale: isOpen ? 1.05 : 1 }}
          transition={snappy}
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        >
          {isComplete
            ? <Check size={11} className="text-white" strokeWidth={2.8} />
            : <span className="text-[11px]" style={{ fontWeight: 700, color: isOpen ? "#fff" : "#86868b", fontFamily: "Urbanist, sans-serif" }}>{number}</span>
          }
        </motion.div>
        <div className="flex-1 text-left">
          <p className="text-[13.5px]" style={{ fontWeight: isOpen ? 620 : 520, color: isOpen ? "#1d1d1f" : "#56585d", fontFamily: "Urbanist, sans-serif" }}>{title}</p>
          <p className="text-[11px]" style={{ fontWeight: 420, color: isComplete ? "#34c759" : "#86868b", fontFamily: "Urbanist, sans-serif" }}>
            {isComplete ? "Verified ✓" : subtitle}
          </p>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={snappy}>
          <ChevronDown size={14} strokeWidth={1.8} style={{ color: isOpen ? "#0071e3" : "#86868b" }} />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", bounce: 0.1, duration: 0.4 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="mx-4 h-px mb-2" style={{ background: "rgba(0,113,227,0.08)" }} />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Doc option row ──────────────────────────────────────────────────────

function DocRow({
  opt, isSelected, isDisabled, onSelect,
}: {
  opt: { id: string; label: string; emoji: string };
  isSelected: boolean; isDisabled: boolean; onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{
        scale: hov && !isDisabled ? 1.02 : 1,
        background: isSelected ? "rgba(0,113,227,0.06)" : hov && !isDisabled ? "rgba(0,0,0,0.025)" : "rgba(0,0,0,0)",
        opacity: isDisabled ? 0.3 : 1,
      }}
      style={{ background: "rgba(0,0,0,0)", cursor: isDisabled ? "not-allowed" : "pointer" }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.24 }}
      onClick={isDisabled ? undefined : onSelect}
      className="flex items-center gap-3 px-3.5 py-2.5 mx-1 rounded-[11px]"
    >
      <motion.span animate={{ fontSize: hov && !isDisabled ? "19px" : "16px" }} transition={snappy} className="shrink-0 select-none" style={{ width: 22, textAlign: "center" }}>
        {opt.emoji}
      </motion.span>
      <motion.span
        animate={{ color: isSelected ? "#0071e3" : hov ? "#1d1d1f" : "#56585d", fontWeight: isSelected ? 620 : hov ? 540 : 460 }}
        className="flex-1 text-[13px]"
        style={{ fontFamily: "Urbanist, sans-serif" }}
      >
        {opt.label}
        {isDisabled && <span className="ml-2 text-[10px] text-[#c4c4c4]">(already used as Doc 1)</span>}
      </motion.span>
      <AnimatePresence>
        {isSelected && (
          <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy}
            className="w-4 h-4 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0">
            <Check size={8} className="text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── STEP 0: Welcome — no scroll, fits the modal ─────────────────────────

const JOURNEY = [
  { icon: Fingerprint, color: "#0071e3", bg: "rgba(0,113,227,0.08)", label: "Identity", sub: "2 gov. IDs + liveness" },
  { icon: FileText,    color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", label: "Business",  sub: "Docs & ownership"      },
  { icon: ShieldCheck, color: "#34c759", bg: "rgba(52,199,89,0.08)",   label: "Authorise", sub: "Bank + co-owners"      },
];

function StepWelcome() {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <motion.div
          initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ ...bouncy, delay: 0.04 }}
          className="relative"
        >
          <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #e8f4ff 0%, #f0e8ff 100%)", border: "0.8px solid rgba(0,113,227,0.14)" }}>
            <Package size={28} className="text-[#0071e3]" strokeWidth={1.4} />
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...bouncy, delay: 0.28 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center shadow-[0_2px_8px_rgba(52,199,89,0.38)]">
            <ShieldCheck size={10} className="text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.1 }} className="text-center">
          <h2 className="text-[22px] text-[#1d1d1f]" style={{ fontWeight: 720, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.45px" }}>
            Start selling on Vehsl
          </h2>
          <p className="text-[13px] text-[#86868b] mt-1" style={{ fontWeight: 420 }}>
            ~15 min setup · your first pickup is scheduled on approval
          </p>
        </motion.div>
      </div>

      {/* Journey — 3-column grid, very compact */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.2 }}
        className="grid grid-cols-3 gap-2.5">
        {JOURNEY.map(({ icon: Icon, color, bg, label, sub }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.24 + i * 0.07 }}
            className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-[16px] text-center"
            style={{ background: "rgba(255,255,255,0.7)", border: "0.8px solid rgba(0,0,0,0.05)" }}
          >
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: bg }}>
              <Icon size={15} strokeWidth={1.6} style={{ color }} />
            </div>
            <div>
              <p className="text-[12.5px] text-[#1d1d1f]" style={{ fontWeight: 620, fontFamily: "Urbanist, sans-serif" }}>{label}</p>
              <p className="text-[10.5px] text-[#86868b]" style={{ fontWeight: 420 }}>{sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* QA pickup note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.34, delay: 0.46 }}>
        <InfoBox icon={Truck} color="#34c759">
          <span style={{ fontWeight: 640, color: "#1d1d1f" }}>Storage photos?</span>{" "}
          Our driver photographs your storage during the first pickup — nothing to upload yourself.
        </InfoBox>
      </motion.div>
    </div>
  );
}

// ─── STEP 1: Business Type ───────────────────────────────────────────────

const BTYPES = [
  { id: "sole-trader", label: "Sole Trader",          desc: "Just you, your name",                      icon: User,      needsBank: false },
  { id: "limited",     label: "Limited Company",      desc: "Registered Ltd or LLC",                    icon: Building2, needsBank: true  },
  { id: "partnership", label: "Partnership",           desc: "Two or more registered owners",             icon: Users,     needsBank: true  },
  { id: "brand",       label: "Brand / Manufacturer", desc: "You produce or exclusively distribute",     icon: Star,      needsBank: true  },
  { id: "international",label: "International Seller", desc: "Registered business outside the UK",      icon: MapPin,    needsBank: true  },
];

function StepBusinessType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.4px" }}>
          What kind of business?
        </h2>
        <p className="text-[12.5px] text-[#86868b] mt-0.5" style={{ fontWeight: 420 }}>
          Determines which documents we'll ask for.
        </p>
      </div>
      <div className="space-y-2">
        {BTYPES.map(({ id, label, desc, icon: Icon }) => {
          const active = value === id;
          return (
            <motion.button key={id} whileTap={{ scale: 0.985 }} transition={snappy}
              onClick={() => onChange(id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[14px] text-left cursor-pointer transition-all duration-200"
              style={{
                background: active ? "rgba(0,113,227,0.055)" : "rgba(255,255,255,0.6)",
                border: active ? "1.5px solid rgba(0,113,227,0.28)" : "1px solid rgba(0,0,0,0.07)",
                boxShadow: active ? "0 0 0 3px rgba(0,113,227,0.06)" : "none",
              }}
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ background: active ? "rgba(0,113,227,0.1)" : "rgba(0,0,0,0.04)" }}>
                <Icon size={15} strokeWidth={1.6} style={{ color: active ? "#0071e3" : "#86868b" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-[#1d1d1f]" style={{ fontWeight: active ? 620 : 500, fontFamily: "Urbanist, sans-serif" }}>{label}</p>
                <p className="text-[11.5px] text-[#86868b]" style={{ fontWeight: 420 }}>{desc}</p>
              </div>
              <motion.div animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }} transition={bouncy}
                className="w-4 h-4 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0">
                <Check size={8} className="text-white" strokeWidth={3} />
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP 2: Identity — 2 gov IDs + Liveness Check ──────────────────────

const GOV_ID_OPTIONS = [
  { id: "passport",         label: "Passport",              emoji: "🛂" },
  { id: "national-id",      label: "National Identity Card", emoji: "🪪" },
  { id: "driving-licence",  label: "Driver's Licence",       emoji: "🚗" },
  { id: "residence-permit", label: "Residence Permit",       emoji: "🏠" },
];

const LIVENESS_PHASES = [
  "Look straight into the camera",
  "Slowly turn your head left",
  "Slowly turn your head right",
  "Smile naturally",
  "Hold still…",
];

function LivenessCard({ isOpen, isComplete, onToggle, onComplete }: {
  isOpen: boolean; isComplete: boolean; onToggle: () => void; onComplete: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "checking" | "done">("idle");
  const [instrIdx, setInstrIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCheck = () => {
    setPhase("checking");
    setInstrIdx(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      if (i < LIVENESS_PHASES.length) {
        setInstrIdx(i);
      } else {
        clearInterval(timerRef.current!);
        setPhase("done");
        setTimeout(onComplete, 400);
      }
    }, 1100);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <AccordionCard number={3} title="Liveness Check" subtitle="AI-guided · camera only · ~20 sec" isOpen={isOpen} isComplete={isComplete} onToggle={onToggle}>
      <div className="px-4 pb-4">
        {/* Camera viewfinder */}
        <motion.div
          className="relative rounded-[16px] overflow-hidden flex flex-col items-center justify-center mb-3"
          style={{ height: 140, background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,113,227,0.15)" }}
          animate={{ borderColor: phase === "checking" ? "rgba(0,113,227,0.5)" : phase === "done" ? "rgba(52,199,89,0.5)" : "rgba(0,113,227,0.15)" }}
          transition={{ duration: 0.3 }}
        >
          {/* Corner brackets */}
          {["top-2 left-2 border-t-2 border-l-2","top-2 right-2 border-t-2 border-r-2","bottom-2 left-2 border-b-2 border-l-2","bottom-2 right-2 border-b-2 border-r-2"].map((cls, i) => (
            <div key={i} className={`absolute w-5 h-5 rounded-sm ${cls}`}
              style={{ borderColor: phase === "done" ? "rgba(52,199,89,0.6)" : "rgba(0,113,227,0.4)" }} />
          ))}

          {/* Scan line when checking */}
          <AnimatePresence>
            {phase === "checking" && (
              <motion.div key="scan"
                initial={{ top: "10%" }} animate={{ top: ["10%", "85%", "10%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-4 right-4 h-[1.5px] rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(0,113,227,0), rgba(0,113,227,0.6), rgba(0,113,227,0))" }}
              />
            )}
          </AnimatePresence>

          {/* Content */}
          {phase === "idle" && (
            <div className="flex flex-col items-center gap-2">
              <ScanFace size={32} className="text-[#0071e3]" strokeWidth={1.2} />
              <p className="text-[12px] text-[#86868b] text-center" style={{ fontWeight: 480 }}>Position your face in the frame</p>
            </div>
          )}
          {phase === "checking" && (
            <AnimatePresence mode="wait">
              <motion.p key={instrIdx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-[13px] text-[#1d1d1f] text-center px-4"
                style={{ fontWeight: 600, fontFamily: "Urbanist, sans-serif" }}
              >
                {LIVENESS_PHASES[instrIdx]}
              </motion.p>
            </AnimatePresence>
          )}
          {phase === "done" && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={bouncy}
              className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-[#34c759] flex items-center justify-center shadow-[0_3px_12px_rgba(52,199,89,0.4)]">
                <Check size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[12px] text-[#34c759]" style={{ fontWeight: 620 }}>Liveness confirmed</p>
            </motion.div>
          )}
        </motion.div>

        {/* Start / status */}
        {phase === "idle" && (
          <motion.button whileTap={{ scale: 0.97 }} transition={snappy} onClick={startCheck}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] cursor-pointer"
            style={{ background: "rgba(0,113,227,0.08)", border: "1px solid rgba(0,113,227,0.18)" }}>
            <Camera size={14} className="text-[#0071e3]" strokeWidth={1.8} />
            <span className="text-[13px] text-[#0071e3]" style={{ fontWeight: 580, fontFamily: "Urbanist, sans-serif" }}>Start Liveness Check</span>
          </motion.button>
        )}
        {phase === "checking" && (
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
            ))}
            <span className="text-[12px] text-[#0071e3] ml-1" style={{ fontWeight: 540 }}>AI is verifying…</span>
          </div>
        )}
        <InfoBox icon={Lock} color="#86868b">
          <span style={{ fontWeight: 640, color: "#1d1d1f" }}>100% private.</span>{" "}
          No video is stored. The AI checks liveness in real-time and discards all data immediately.
        </InfoBox>
      </div>
    </AccordionCard>
  );
}

interface IdentityState {
  id1Type: string; id1File: File | null;
  id2Type: string; id2File: File | null;
  livenessComplete: boolean;
}

function StepIdentity({ state, onChange }: {
  state: IdentityState;
  onChange: (patch: Partial<IdentityState>) => void;
}) {
  const [openCard, setOpenCard] = useState<"id1" | "id2" | "liveness">("id1");
  const toggle = (card: "id1" | "id2" | "liveness") => setOpenCard(p => p === card ? "id1" : card);

  const id1Done = !!state.id1Type && !!state.id1File;
  const id2Done = !!state.id2Type && !!state.id2File;

  const advanceTo = (next: "id2" | "liveness") => setTimeout(() => setOpenCard(next), 350);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.4px" }}>
          Identity.{" "}
          <span style={{ color: "#86868b", fontWeight: 420 }}>Two IDs + face.</span>
        </h2>
        <p className="text-[12.5px] text-[#86868b] mt-0.5" style={{ fontWeight: 420 }}>
          Choose a different document for each. Both must be government-issued.
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Primary ID */}
        <AccordionCard number={1} title="Primary Government ID" subtitle="Passport, National ID, Licence…"
          isOpen={openCard === "id1"} isComplete={id1Done} onToggle={() => toggle("id1")}>
          <div className="pb-3">
            {GOV_ID_OPTIONS.map(opt => (
              <DocRow key={opt.id} opt={opt}
                isSelected={state.id1Type === opt.id}
                isDisabled={false}
                onSelect={() => onChange({ id1Type: opt.id })}
              />
            ))}
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <p className="text-[11px] text-[#b4b4b4]" style={{ fontWeight: 440 }}>
                {state.id1Type ? `Selected: ${GOV_ID_OPTIONS.find(o => o.id === state.id1Type)?.label}` : "Select a type above, then upload"}
              </p>
              <UploadBtn file={state.id1File} onFile={f => { onChange({ id1File: f }); if (state.id1Type) advanceTo("id2"); }} />
            </div>
          </div>
        </AccordionCard>

        {/* Secondary ID */}
        <AccordionCard number={2} title="Secondary Government ID" subtitle="Must be a different document type"
          isOpen={openCard === "id2"} isComplete={id2Done} onToggle={() => toggle("id2")}>
          <div className="pb-3">
            {GOV_ID_OPTIONS.map(opt => (
              <DocRow key={opt.id} opt={opt}
                isSelected={state.id2Type === opt.id}
                isDisabled={state.id1Type === opt.id}
                onSelect={() => { if (state.id1Type !== opt.id) onChange({ id2Type: opt.id }); }}
              />
            ))}
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <p className="text-[11px] text-[#b4b4b4]" style={{ fontWeight: 440 }}>
                {state.id2Type ? `Selected: ${GOV_ID_OPTIONS.find(o => o.id === state.id2Type)?.label}` : "Select a different type, then upload"}
              </p>
              <UploadBtn file={state.id2File} onFile={f => { onChange({ id2File: f }); advanceTo("liveness"); }} />
            </div>
          </div>
        </AccordionCard>

        {/* Liveness check */}
        <LivenessCard
          isOpen={openCard === "liveness"}
          isComplete={state.livenessComplete}
          onToggle={() => toggle("liveness")}
          onComplete={() => onChange({ livenessComplete: true })}
        />
      </div>

      <InfoBox icon={ShieldCheck} color="#0071e3">
        <span style={{ fontWeight: 640, color: "#1d1d1f" }}>Why two IDs?</span>{" "}
        Cross-referencing two government documents protects you and every buyer on the platform from fraud.
      </InfoBox>
    </div>
  );
}

// ─── STEP 3: Ownership & Business Documents ──────────────────────────────

const CERT_OPTIONS = [
  { id: "cert-uk",   label: "Certificate of Incorporation (UK)",    emoji: "🏛" },
  { id: "cert-us",   label: "Articles of Incorporation (US)",        emoji: "🏛" },
  { id: "cert-eu",   label: "Kamer van Koophandel / Trade Register", emoji: "🏛" },
  { id: "cert-other",label: "Other official registration document",   emoji: "📋" },
];

const ADDRESS_OPTIONS = [
  { id: "utility",   label: "Utility Bill (last 3 months)",          emoji: "💡" },
  { id: "bank-stmt", label: "Business Bank Statement",               emoji: "🏦" },
  { id: "council",   label: "Council Tax / Rates Letter",            emoji: "✉️" },
  { id: "lease",     label: "Commercial Lease Agreement",            emoji: "🏢" },
];

const OWNERSHIP_OPTIONS = [
  { id: "share-cert", label: "Share Certificate",                    emoji: "📜" },
  { id: "reg-members",label: "Register of Members / Partners",       emoji: "📋" },
  { id: "partnership",label: "Partnership Agreement",                emoji: "🤝" },
  { id: "director",   label: "Director Appointment Letter",          emoji: "📄" },
];

interface OwnershipDocsState {
  certType: string;   certFile: File | null;
  addressType: string; addressFile: File | null;
  ownershipType: string; ownershipFile: File | null;
}

function OwnershipDocCard({ number, title, subtitle, options, selectedType, file, isOpen, isComplete, onToggle, onSelect, onFile, onNext }: {
  number: number; title: string; subtitle: string;
  options: { id: string; label: string; emoji: string }[];
  selectedType: string; file: File | null;
  isOpen: boolean; isComplete: boolean;
  onToggle: () => void; onSelect: (id: string) => void;
  onFile: (f: File) => void; onNext?: () => void;
}) {
  return (
    <AccordionCard number={number} title={title} subtitle={subtitle} isOpen={isOpen} isComplete={isComplete} onToggle={onToggle}>
      <div className="pb-3">
        {options.map(opt => (
          <DocRow key={opt.id} opt={opt}
            isSelected={selectedType === opt.id}
            isDisabled={false}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <p className="text-[11px] text-[#b4b4b4]" style={{ fontWeight: 440 }}>
            {selectedType ? options.find(o => o.id === selectedType)?.label : "Select type, then upload"}
          </p>
          <UploadBtn file={file} onFile={f => { onFile(f); onNext?.(); }} />
        </div>
      </div>
    </AccordionCard>
  );
}

function StepOwnershipDocs({ state, onChange }: {
  state: OwnershipDocsState;
  onChange: (patch: Partial<OwnershipDocsState>) => void;
}) {
  const [openCard, setOpenCard] = useState<"cert" | "address" | "ownership">("cert");

  const certDone     = !!state.certType     && !!state.certFile;
  const addressDone  = !!state.addressType  && !!state.addressFile;
  const ownershipDone= !!state.ownershipType && !!state.ownershipFile;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.4px" }}>
          Business documents.
        </h2>
        <p className="text-[12.5px] text-[#86868b] mt-0.5" style={{ fontWeight: 420 }}>
          Three proofs: your company exists, its address, and who owns it.
        </p>
      </div>

      <div className="space-y-2.5">
        <OwnershipDocCard
          number={1} title="Certificate of Incorporation" subtitle="Proves your company is legally registered"
          options={CERT_OPTIONS} selectedType={state.certType} file={state.certFile}
          isOpen={openCard === "cert"} isComplete={certDone}
          onToggle={() => setOpenCard(p => p === "cert" ? "cert" : "cert")}
          onSelect={id => onChange({ certType: id })}
          onFile={f => { onChange({ certFile: f }); setTimeout(() => setOpenCard("address"), 350); }}
        />
        <OwnershipDocCard
          number={2} title="Business Address Proof" subtitle="Utility bill, bank statement — last 3 months"
          options={ADDRESS_OPTIONS} selectedType={state.addressType} file={state.addressFile}
          isOpen={openCard === "address"} isComplete={addressDone}
          onToggle={() => setOpenCard(p => p === "address" ? "cert" : "address")}
          onSelect={id => onChange({ addressType: id })}
          onFile={f => { onChange({ addressFile: f }); setTimeout(() => setOpenCard("ownership"), 350); }}
        />
        <OwnershipDocCard
          number={3} title="Ownership Documents" subtitle="Who owns and controls this business"
          options={OWNERSHIP_OPTIONS} selectedType={state.ownershipType} file={state.ownershipFile}
          isOpen={openCard === "ownership"} isComplete={ownershipDone}
          onToggle={() => setOpenCard(p => p === "ownership" ? "cert" : "ownership")}
          onSelect={id => onChange({ ownershipType: id })}
          onFile={f => onChange({ ownershipFile: f })}
        />
      </div>

      <InfoBox icon={Lock} color="#8b5cf6">
        <span style={{ fontWeight: 640, color: "#1d1d1f" }}>All documents encrypted.</span>{" "}
        Stored with 256-bit AES. Only our compliance team can access them — never buyers.
      </InfoBox>
    </div>
  );
}

// ─── STEP 4: Bank Account (registered companies only) ────────────────────

function StepBankDetails({ data, onChange }: {
  data: { accountName: string; sortCode: string; accountNumber: string };
  onChange: (patch: Partial<typeof data>) => void;
}) {
  const fmtSort = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 6);
    return d.replace(/(\d{2})(\d{2})?(\d{2})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join("-"));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[20px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.4px" }}>
          Business bank account.
        </h2>
        <p className="text-[12.5px] text-[#86868b] mt-0.5" style={{ fontWeight: 420 }}>
          Must be a registered business account — not personal.
        </p>
      </div>

      <div className="space-y-3">
        <Field label="Account holder name" value={data.accountName} onChange={v => onChange({ accountName: v })} placeholder="Name as it appears on your account" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort code" value={data.sortCode}
            onChange={v => onChange({ sortCode: fmtSort(v) })} placeholder="00-00-00" />
          <Field label="Account number" value={data.accountNumber}
            onChange={v => onChange({ accountNumber: v.replace(/\D/g, "").slice(0, 8) })} placeholder="12345678" />
        </div>
      </div>

      <InfoBox icon={ShieldCheck} color="#34c759">
        <span style={{ fontWeight: 640, color: "#1d1d1f" }}>Why a business account?</span>{" "}
        Regulatory requirements (FCA / PSD2) mean payouts can only be sent to accounts matching your registered business name.
      </InfoBox>

      <InfoBox icon={Lock} color="#86868b">
        Bank details are encrypted and <span style={{ fontWeight: 640, color: "#1d1d1f" }}>never visible to buyers</span>.
      </InfoBox>
    </div>
  );
}

// ─── STEP 5: Co-Owner Authorization ──────────────────────────────────────

const CO_ROLES = ["Director", "Shareholder", "Partner", "Signatory"];

interface CoOwner { id: string; name: string; email: string; role: string; }

interface CoOwnerState {
  hasCoOwners: boolean | null;
  coOwnerMethod: "invite" | "board-resolution";
  coOwners: CoOwner[];
  boardResolutionFile: File | null;
}

function StepCoOwnerAuth({ state, onChange }: {
  state: CoOwnerState;
  onChange: (patch: Partial<CoOwnerState>) => void;
}) {
  const updateOwner = (id: string, p: Partial<CoOwner>) =>
    onChange({ coOwners: state.coOwners.map(o => o.id === id ? { ...o, ...p } : o) });

  const addOwner = () =>
    onChange({ coOwners: [...state.coOwners, { id: `${Date.now()}`, name: "", email: "", role: "Director" }] });

  const removeOwner = (id: string) =>
    onChange({ coOwners: state.coOwners.filter(o => o.id !== id) });

  const isBoardRes = state.coOwnerMethod === "board-resolution";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
          style={{ background: "rgba(0,113,227,0.07)", border: "1px solid rgba(0,113,227,0.15)" }}>
          <Clock size={10} strokeWidth={2} style={{ color: "#0071e3" }} />
          <span className="text-[10.5px]" style={{ fontWeight: 600, fontFamily: "Urbanist, sans-serif", color: "#0071e3" }}>
            Required within 7 days of submission
          </span>
        </div>
        <h2 className="text-[20px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.4px" }}>
          Other business owners?
        </h2>
        <p className="text-[12.5px] text-[#86868b] mt-0.5" style={{ fontWeight: 420 }}>
          Directors, shareholders, or partners who have control of this business must authorize Vehsl.
        </p>
      </div>

      {/* Yes / No */}
      <div className="grid grid-cols-2 gap-2.5">
        {([{ val: false, label: "Just me", sub: "I'm the sole owner" }, { val: true, label: "Yes, others too", sub: "Directors / shareholders" }] as const).map(({ val, label, sub }) => {
          const active = state.hasCoOwners === val;
          return (
            <motion.button key={String(val)} whileTap={{ scale: 0.97 }} transition={snappy}
              onClick={() => onChange({ hasCoOwners: val })}
              className="py-3 px-3.5 rounded-[14px] text-left cursor-pointer"
              style={{
                background: active ? "rgba(0,113,227,0.06)" : "rgba(255,255,255,0.6)",
                border: active ? "1.5px solid rgba(0,113,227,0.28)" : "1px solid rgba(0,0,0,0.08)",
                boxShadow: active ? "0 0 0 3px rgba(0,113,227,0.06)" : "none",
              }}>
              <p className="text-[13px]" style={{ fontWeight: active ? 640 : 500, color: active ? "#0071e3" : "#1d1d1f", fontFamily: "Urbanist, sans-serif" }}>{label}</p>
              <p className="text-[11px] text-[#86868b]" style={{ fontWeight: 420 }}>{sub}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Expanded section when "Yes" */}
      <AnimatePresence>
        {state.hasCoOwners === true && (
          <motion.div key="co-owner-body"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ height: { type: "spring", bounce: 0.1, duration: 0.4 }, opacity: { duration: 0.22 } }}
            className="overflow-hidden space-y-3"
          >
            {/* Method toggle pill */}
            <div className="flex gap-1.5 p-1 rounded-[13px]" style={{ background: "rgba(0,0,0,0.04)" }}>
              {([
                { id: "invite",           label: "Send requests",    icon: Mail     },
                { id: "board-resolution", label: "Board resolution", icon: FileText },
              ] as const).map(({ id, label, icon: Icon }) => {
                const active = state.coOwnerMethod === id;
                return (
                  <motion.button key={id} whileTap={{ scale: 0.97 }}
                    onClick={() => onChange({ coOwnerMethod: id })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] cursor-pointer"
                    animate={{
                      background: active ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0)",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.09)" : "none",
                    }}
                    style={{ background: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.18 }}
                  >
                    <Icon size={11} strokeWidth={1.8} style={{ color: active ? "#0071e3" : "#86868b" }} />
                    <span className="text-[11.5px]" style={{ fontWeight: active ? 620 : 440, color: active ? "#1d1d1f" : "#86868b", fontFamily: "Urbanist, sans-serif" }}>
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* ── INVITE MODE ── */}
            <AnimatePresence mode="wait">
              {!isBoardRes && (
                <motion.div key="invite-mode"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  {state.coOwners.map((owner, i) => (
                    <motion.div key={owner.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}
                      className="p-3.5 rounded-[14px] space-y-2.5"
                      style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-[#0071e3]" style={{ fontWeight: 620, fontFamily: "Urbanist, sans-serif" }}>Owner {i + 1}</span>
                        {state.coOwners.length > 1 && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeOwner(owner.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ background: "rgba(255,59,48,0.08)" }}>
                            <Trash2 size={11} className="text-red-400" strokeWidth={1.8} />
                          </motion.button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Full name" value={owner.name} onChange={v => updateOwner(owner.id, { name: v })} placeholder="Legal name" />
                        <Field label="Email" value={owner.email} onChange={v => updateOwner(owner.id, { email: v })} placeholder="Their email" type="email" />
                      </div>
                      <div>
                        <p className="text-[11.5px] text-[#86868b] mb-1.5" style={{ fontWeight: 520, fontFamily: "Urbanist, sans-serif" }}>Role</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {CO_ROLES.map(role => (
                            <button key={role} onClick={() => updateOwner(owner.id, { role })}
                              className="px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-all duration-150"
                              style={{
                                background: owner.role === role ? "rgba(0,113,227,0.09)" : "rgba(0,0,0,0.04)",
                                border: owner.role === role ? "1px solid rgba(0,113,227,0.25)" : "1px solid rgba(0,0,0,0.06)",
                                color: owner.role === role ? "#0071e3" : "#86868b",
                                fontWeight: owner.role === role ? 620 : 440,
                                fontFamily: "Urbanist, sans-serif",
                              }}>
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 px-3 py-2 rounded-[10px]"
                        style={{ background: "rgba(0,113,227,0.05)", border: "1px solid rgba(0,113,227,0.12)" }}>
                        <Clock size={11} className="text-[#0071e3] shrink-0 mt-[1px]" strokeWidth={2} />
                        <p className="text-[11px] text-[#0071e3]" style={{ fontWeight: 540, fontFamily: "Urbanist, sans-serif" }}>
                          An authorization request will be sent to{" "}
                          <span style={{ fontWeight: 680 }}>{owner.email || "their email"}</span> — they must complete their own Vehsl identity check.
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {state.coOwners.length < 6 && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={addOwner}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[13px] cursor-pointer"
                      style={{ background: "rgba(0,113,227,0.04)", border: "1px dashed rgba(0,113,227,0.25)" }}>
                      <Plus size={13} strokeWidth={2} className="text-[#0071e3]" />
                      <span className="text-[12.5px] text-[#0071e3]" style={{ fontWeight: 540, fontFamily: "Urbanist, sans-serif" }}>Add another owner</span>
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* ── BOARD RESOLUTION MODE ── */}
              {isBoardRes && (
                <motion.div key="board-res-mode"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  {/* Explainer */}
                  <div className="px-3.5 py-3 rounded-[14px] space-y-1"
                    style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.14)" }}>
                    <p className="text-[12.5px] text-[#1d1d1f]" style={{ fontWeight: 640, fontFamily: "Urbanist, sans-serif" }}>
                      What is a Board Resolution?
                    </p>
                    <p className="text-[11.5px] text-[#56585d] leading-relaxed" style={{ fontWeight: 420 }}>
                      A signed document — on company letterhead — confirming all directors and shareholders collectively authorise this business to trade on Vehsl. Must be dated within the last 6 months.
                    </p>
                  </div>

                  {/* Upload card */}
                  <motion.div
                    animate={{
                      background: state.boardResolutionFile ? "rgba(52,199,89,0.04)" : "rgba(255,255,255,0.7)",
                      border: state.boardResolutionFile ? "1.5px solid rgba(52,199,89,0.28)" : "1.5px dashed rgba(0,0,0,0.14)",
                    }}
                    style={{ background: "rgba(255,255,255,0.7)", border: "1.5px dashed rgba(0,0,0,0.14)" }}
                    transition={{ duration: 0.22 }}
                    className="rounded-[14px] px-4 py-4 flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                      style={{ background: state.boardResolutionFile ? "rgba(52,199,89,0.1)" : "rgba(0,0,0,0.05)" }}>
                      {state.boardResolutionFile
                        ? <Check size={18} className="text-[#34c759]" strokeWidth={2.2} />
                        : <FileText size={18} className="text-[#86868b]" strokeWidth={1.5} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#1d1d1f] truncate" style={{ fontWeight: 560, fontFamily: "Urbanist, sans-serif" }}>
                        {state.boardResolutionFile ? state.boardResolutionFile.name : "Board Resolution Document"}
                      </p>
                      <p className="text-[11px] text-[#86868b]" style={{ fontWeight: 420 }}>
                        {state.boardResolutionFile ? "Uploaded · tap to replace" : "PDF or image · signed by all directors"}
                      </p>
                    </div>
                    <UploadBtn file={state.boardResolutionFile} onFile={f => onChange({ boardResolutionFile: f })} label="Upload" />
                  </motion.div>

                  {/* Checklist — turns green on upload */}
                  {[
                    "Signed by all directors / shareholders",
                    "On official company letterhead",
                    "Dated within the last 6 months",
                    "States intent to trade on Vehsl as seller",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: state.boardResolutionFile ? "rgba(52,199,89,0.15)" : "rgba(0,0,0,0.07)" }}>
                        <Check size={7} strokeWidth={3} style={{ color: state.boardResolutionFile ? "#34c759" : "#b4b4b4" }} />
                      </div>
                      <span className="text-[11.5px]" style={{ fontWeight: 440, color: state.boardResolutionFile ? "#34c759" : "#86868b", fontFamily: "Urbanist, sans-serif" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <InfoBox icon={AlertCircle} color="#ff9500">
        <span style={{ fontWeight: 640, color: "#1d1d1f" }}>All owners must authorize.</span>{" "}
        Your account goes live only after every listed owner is verified — individually or via a valid board resolution.
      </InfoBox>
    </div>
  );
}

// ─── STEP 6: Done ────────────────────────────────────────────────────────

function StepDone({ onClose }: { onClose: () => void }) {
  const TIMELINE = [
    { icon: ShieldCheck, text: "Identity under review",      sub: "Usually within 2 hours",      color: "#0071e3", done: true  },
    { icon: FileText,    text: "Documents being verified",   sub: "1–2 business days",            color: "#8b5cf6", done: false },
    { icon: Truck,       text: "QA pickup being scheduled",  sub: "3–5 business days",            color: "#34c759", done: false },
    { icon: Package,     text: "First listing goes live",    sub: "After sample is approved",     color: "#ff9500", done: false },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-5">
      <motion.div initial={{ scale: 0, rotate: -16 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...bouncy, delay: 0.04 }} className="relative mt-1">
        <div className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #e8f4ff 0%, #f0e8ff 100%)", border: "0.8px solid rgba(0,113,227,0.14)" }}>
          <Sparkles size={32} className="text-[#0071e3]" strokeWidth={1.3} />
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...bouncy, delay: 0.34 }}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#34c759] flex items-center justify-center shadow-[0_3px_12px_rgba(52,199,89,0.42)]">
          <Check size={12} className="text-white" strokeWidth={2.8} />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.16 }}>
        <h2 className="text-[26px] text-[#1d1d1f]" style={{ fontWeight: 720, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.55px" }}>
          Submitted!
        </h2>
        <p className="text-[13.5px] text-[#86868b] mt-1 max-w-[280px] mx-auto leading-relaxed" style={{ fontWeight: 420 }}>
          Our compliance team will review everything. You'll hear from us within 2 hours.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.28 }}
        className="w-full space-y-2">
        {TIMELINE.map(({ icon: Icon, text, sub, color, done }, i) => (
          <motion.div key={text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26, delay: 0.36 + i * 0.08 }}
            className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] text-left"
            style={{ background: "rgba(255,255,255,0.65)", border: "0.8px solid rgba(0,0,0,0.05)" }}>
            <div className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
              <Icon size={13} strokeWidth={1.6} style={{ color }} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-[#1d1d1f]" style={{ fontWeight: 560 }}>{text}</p>
              <p className="text-[11px] text-[#86868b]" style={{ fontWeight: 420 }}>{sub}</p>
            </div>
            {done && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...bouncy, delay: 0.7 }}
                className="w-4 h-4 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0">
                <Check size={8} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.button whileTap={{ scale: 0.97 }} transition={bouncy} onClick={onClose}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-white cursor-pointer"
        style={{
          background: "linear-gradient(172deg, #0071e3 0%, #0058b0 100%)",
          boxShadow: "0 4px 20px rgba(0,113,227,0.28)",
          fontWeight: 620, fontFamily: "Urbanist, sans-serif", fontSize: 14,
        }}>
        Go to Seller Dashboard
        <ChevronRight size={15} strokeWidth={2.2} />
      </motion.button>
      <button onClick={onClose} className="text-[12.5px] text-[#b4b4b4] cursor-pointer hover:text-[#56585d] transition-colors"
        style={{ fontWeight: 480, fontFamily: "Urbanist, sans-serif" }}>
        Back to browsing
      </button>
    </div>
  );
}

// ─── Form state ──────────────────────────────────────────────────────────

interface FormState {
  businessType: string;
  // Identity
  id1Type: string; id1File: File | null;
  id2Type: string; id2File: File | null;
  livenessComplete: boolean;
  // Ownership docs
  certType: string;      certFile: File | null;
  addressType: string;   addressFile: File | null;
  ownershipType: string; ownershipFile: File | null;
  // Bank (conditional)
  accountName: string; sortCode: string; accountNumber: string;
  // Co-owner auth
  hasCoOwners: boolean | null;
  coOwnerMethod: "invite" | "board-resolution";
  coOwners: CoOwner[];
  boardResolutionFile: File | null;
}

const INIT: FormState = {
  businessType: "",
  id1Type: "", id1File: null, id2Type: "", id2File: null, livenessComplete: false,
  certType: "", certFile: null, addressType: "", addressFile: null, ownershipType: "", ownershipFile: null,
  accountName: "", sortCode: "", accountNumber: "",
  hasCoOwners: null, coOwnerMethod: "invite", coOwners: [{ id: "1", name: "", email: "", role: "Director" }], boardResolutionFile: null,
};

// Steps: 0=welcome, 1=btype, 2=identity, 3=ownershipdocs, 4=bank(conditional), 5=coowners, 6=done
const TOTAL = 7;

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

// ─── CTAs per step ───────────────────────────────────────────────────────

const STEP_CTA: Record<number, string> = {
  0: "Let's go",
  1: "Continue",
  2: "Continue",
  3: "Continue",
  4: "Continue",
  5: "Submit & Verify",
  6: "",
};

// ─── Main Modal ──────────────────────────────────────────────────────────

export function SellerVerificationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);
  const [form, setForm] = useState<FormState>(INIT);

  const patch = useCallback((p: Partial<FormState>) => setForm(prev => ({ ...prev, ...p })), []);

  const needsBank = ["limited", "partnership", "brand", "international"].includes(form.businessType);

  const next = useCallback(() => {
    setDir(1);
    setStep(s => {
      const n = s + 1;
      if (n === 4 && !needsBank) return 5; // skip bank for sole traders
      return Math.min(n, TOTAL - 1);
    });
  }, [needsBank]);

  const back = useCallback(() => {
    setDir(-1);
    setStep(s => {
      const n = s - 1;
      if (n === 4 && !needsBank) return 3; // skip bank going back
      return Math.max(n, 0);
    });
  }, [needsBank]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => { setStep(0); setDir(1); setForm(INIT); }, 450);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, handleClose]);

  // ── canProceed per step ──────────────────────────────────────────────
  const canProceed = (() => {
    switch (step) {
      case 0: return true;
      case 1: return form.businessType !== "";
      case 2: return !!form.id1Type && !!form.id1File && !!form.id2Type && !!form.id2File && form.livenessComplete;
      case 3: return !!form.certFile && !!form.addressFile && !!form.ownershipFile;
      case 4: return form.accountName.trim().length > 0 && form.sortCode.replace(/\D/g,"").length === 6 && form.accountNumber.length === 8;
      case 5: return form.hasCoOwners === false
        || (form.hasCoOwners === true && form.coOwnerMethod === "board-resolution" && !!form.boardResolutionFile)
        || (form.hasCoOwners === true && form.coOwnerMethod === "invite" && form.coOwners.every(o => o.name.trim() && o.email.includes("@")));
      default: return true;
    }
  })();

  // ── Progress ─────────────────────────────────────────────────────────
  const showProgress = step >= 1 && step <= 5;
  const totalSteps = needsBank ? 5 : 4; // steps 1-5 or 1-4
  const getProgressPct = () => {
    if (!showProgress) return 0;
    let idx = step - 1; // 0-indexed
    // if no bank, steps 5 becomes effectively step 4 of 4
    if (!needsBank && step >= 5) idx = step - 2;
    return ((idx + 1) / totalSteps) * 100;
  };

  const getStepLabel = () => {
    const labelMap: Record<number, string> = { 1: "Business type", 2: "Identity", 3: "Documents", 4: "Bank account", 5: "Authorisation" };
    return labelMap[step] ?? "";
  };

  // ─── Content per step ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return <StepWelcome />;
      case 1: return <StepBusinessType value={form.businessType} onChange={v => patch({ businessType: v })} />;
      case 2: return <StepIdentity state={form} onChange={patch} />;
      case 3: return <StepOwnershipDocs state={form} onChange={patch} />;
      case 4: return <StepBankDetails data={form} onChange={patch} />;
      case 5: return <StepCoOwnerAuth state={{ hasCoOwners: form.hasCoOwners, coOwnerMethod: form.coOwnerMethod, coOwners: form.coOwners, boardResolutionFile: form.boardResolutionFile }} onChange={patch} />;
      case 6: return <StepDone onClose={handleClose} />;
    }
  };

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.93, y: 22, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.93, y: 22, opacity: 0 }}
            transition={spring}
            className="relative w-full max-w-[456px] rounded-[30px] overflow-hidden flex flex-col"
            style={{
              background: "rgba(246,250,255,0.98)",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              border: "0.5px solid rgba(255,255,255,0.85)",
              boxShadow: "0 0 0 0.5px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08), 0 32px 80px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3.5 shrink-0"
              style={{ borderBottom: "0.5px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] text-[#1d1d1f]" style={{ fontWeight: 700, fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.3px" }}>Vehsl</span>
                {showProgress && (
                  <span className="text-[11px] text-[#86868b]" style={{ fontWeight: 500, fontFamily: "Urbanist, sans-serif" }}>
                    · {getStepLabel()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showProgress && (
                  <span className="text-[10.5px] text-[#b4b4b4]" style={{ fontWeight: 540, fontFamily: "Urbanist, sans-serif" }}>
                    {step - ((!needsBank && step >= 5) ? 2 : 1) + 1} / {totalSteps}
                  </span>
                )}
                <motion.button whileTap={{ scale: 0.88 }} transition={snappy} onClick={handleClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.05)" }}>
                  <X size={12} className="text-[#86868b]" strokeWidth={2.2} />
                </motion.button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] shrink-0 bg-black/[0.05]">
              <motion.div
                animate={{ width: `${getProgressPct()}%` }}
                transition={spring}
                className="h-full"
                style={{ background: "linear-gradient(90deg, #0071e3, #8b5cf6)" }}
              />
            </div>

            {/* ── Scrollable content ── */}
            <div className="overflow-y-auto flex-1 px-5 pt-5 pb-2" style={{ scrollbarWidth: "none" }}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={spring}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Sticky action bar — always visible ── */}
            {step !== 6 && (
              <div className="shrink-0 px-5 pb-5 pt-3"
                style={{ background: "linear-gradient(to bottom, rgba(246,250,255,0) 0%, rgba(246,250,255,1) 28%)" }}>
                <motion.button
                  whileTap={canProceed ? { scale: 0.97 } : {}}
                  transition={bouncy}
                  onClick={next}
                  disabled={!canProceed}
                  className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[16px] text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
                  style={{
                    background: "linear-gradient(172deg, #0071e3 0%, #0058b0 100%)",
                    boxShadow: canProceed ? "0 4px 20px rgba(0,113,227,0.28), 0 1px 4px rgba(0,0,0,0.08)" : "none",
                    fontWeight: 640, fontFamily: "Urbanist, sans-serif", fontSize: 14,
                    letterSpacing: "-0.1px",
                  }}
                >
                  {STEP_CTA[step]}
                  {step < 5 && <ArrowRight size={15} strokeWidth={2.2} />}
                </motion.button>

                {step > 0 && (
                  <motion.button whileTap={{ scale: 0.97 }} transition={snappy} onClick={back}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-[12.5px] text-[#b4b4b4] cursor-pointer hover:text-[#56585d] transition-colors select-none"
                    style={{ fontWeight: 480, fontFamily: "Urbanist, sans-serif" }}>
                    <ArrowLeft size={12} strokeWidth={1.8} />
                    Back
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
