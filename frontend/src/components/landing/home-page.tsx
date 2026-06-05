// @ts-nocheck -- legacy port; tighten incrementally
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Infinity,
  Package,
  Menu,
  X,
} from "lucide-react";
import { AliveButton } from "./alive-button";
import { AliveElement } from "./alive-element";
import { SectionReveal } from "./section-reveal";
import { ProductCard } from "./product-card";
import { CategoryNav } from "./category-nav";
import { SearchDropdown } from "./search-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { fetchJsonAuthed } from "@/lib/api";
import List from "./imports/List/List";
import List2 from "./imports/List-1/List-42170-461";
import Group419 from "./imports/Group419/Group419";
import Group433 from "./imports/Group433/Group433";
import Group433Full from "./imports/Group433-1/Group433-42170-1117";
import LeftArrow from "./imports/Component4/Component4";
import RightArrow from "./imports/Component4-1/Component4";
import LandingVehicle from "./imports/LandingVehicle-1-1/LandingVehicle-42170-750";
import LandingVehicleChart from "./imports/LandingVehicle-2-1/LandingVehicle-42170-809";
const imgGroup34 = "/figma/564ae6e1817616a8122689e548ae3ff7a8b68016.png";
const imgGroup156 = "/figma/4e89248f6eb96b8a036324fe6c4416f8c4b7b240.png";
const imgGroup12 = "/figma/9a2bdf5357c07a37ee9fc77e15a1c4ba555c7028.png";
const imgContainer = "/figma/543791b7fc107f3f79526bbee0eba3d4e89c94ec.png";
const imgRectangle4334 = "/figma/dda683c12880f18cd77465316d83d587a6073142.png";
const imgListitem = "/figma/193794502aaad732470740732256baca378067bd.png";
const imgInfinity = "/figma/fb07894e29491d47d200ef9196de845434b32e70.png";
const imgImageBlur = "/figma/4e89248f6eb96b8a036324fe6c4416f8c4b7b240.png";
import svgPaths from "./imports/LandingVehicle-2/svg-1nu26zbkv0";

// ─── Data ────────────────────────────────────────────────────────────────

const trustSteps = [
  {
    icon: ShieldCheck,
    title: "Sample verified",
    desc: "Every product sample is tested before listing",
  },
  {
    icon: CheckCircle2,
    title: "Quality graded",
    desc: "Rigorous checks ensure consistent standards",
  },
  {
    icon: Package,
    title: "Packed with care",
    desc: "Professional packaging protects every order",
  },
  {
    icon: Truck,
    title: "Delivered end-to-end",
    desc: "Full logistics handled, door to door",
  },
];

// ─── Navbar ──────────────────────────────────────────────────────────────

function Navbar({
  activeCategory,
  onCategorySelect,
  onSubcategorySelect,
}: {
  activeCategory: string | null;
  onCategorySelect: (id: string | null) => void;
  onSubcategorySelect: (catId: string, subId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileCategories, setMobileCategories] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    fetchJsonAuthed("/api/v1/categories/explore/")
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.categories) ? (data as any).categories : [];
        const mapped = rows
          .map((c: any) => ({ id: String(c?.slug || c?.id || ""), label: String(c?.name || "").trim() }))
          .filter((c: any) => c.id && c.label);
        setMobileCategories(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setMobileCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
      >
        <div className="w-full max-w-[1200px] backdrop-blur-[20px] bg-white/20 rounded-full px-4 md:px-6 py-2 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[0.5px] border-white/24">
          <div className="absolute inset-[-0.25px] rounded-full shadow-[inset_0_15px_30px_rgba(255,255,255,0.8)] pointer-events-none" />
          
          {/* Brand */}
          <Link href="/" className="font-['Urbanist',sans-serif] text-[#19202b] text-[24px] tracking-[-0.5px] relative z-10" style={{ fontWeight: 600 }}>
            Vehslcc
          </Link>

          {/* Categories - desktop */}
          <div className="relative z-10">
            <CategoryNav
              activeCategory={activeCategory}
              onCategorySelect={onCategorySelect}
              onSubcategorySelect={onSubcategorySelect}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 relative z-10">
            <Link
              href="/explore"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/40 border border-white/50 text-[13px] text-[#56585D] hover:bg-white/70 hover:text-[#1d1d1f] transition-all shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              style={{ fontWeight: 500 }}
            >
              Explore
            </Link>
            <ProfileDropdown />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/60 border border-white/80 cursor-pointer"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-4 right-4 z-50 bg-white/90 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/80 lg:hidden"
          >
            <div className="grid grid-cols-3 gap-3">
              {mobileCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategorySelect(cat.id);
                    setMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/60 border border-white/40 cursor-pointer"
                >
                  <span className="font-['Urbanist',sans-serif] text-[12px] text-[#56585D]">{cat.label}</span>
                </button>
              ))}
            </div>
            <Link
              href="/explore"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1d1d1f] text-white text-[14px]"
              style={{ fontWeight: 600 }}
              onClick={() => setMenuOpen(false)}
            >
              Explore All <ChevronRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section ───────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 pt-28 pb-20"
      style={{
        backgroundImage:
          "linear-gradient(162deg, #d1e6f7 22%, #e4effe 47%, #f6fbf9 71%)",
      }}
    >
      {/* Soft ambient orbs */}
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-purple-200/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand name */}
      <SectionReveal delay={1}>
        <h1
          className="font-['Urbanist',sans-serif] text-[clamp(64px,12vw,96px)] tracking-[-2px] text-center mb-10 bg-clip-text text-transparent leading-[1.1] px-[0px] pt-[180px] pb-[0px]"
          style={{
            fontWeight: 800,
            backgroundImage:
              "linear-gradient(76deg, rgba(0,143,247,0.8) 10%, rgba(90,121,249,0.8) 31%, rgba(179,99,250,0.8) 43%, rgba(228,75,193,0.8) 56%, rgba(243,69,70,0.72) 85%, rgba(255,221,85,0.8) 94%)",
          }}
        >
          Vehsl
        </h1>
      </SectionReveal>

      {/* Search bar with dropdown */}
      <SectionReveal delay={2}>
        <SearchDropdown />
      </SectionReveal>

      {/* Contextual update line */}
      <SectionReveal delay={3}>
        <div className="mt-10 text-center font-['Urbanist',sans-serif] text-[13.5px] text-[#86868b] max-w-[400px] leading-relaxed">
          Your sweater arrives{" "}
          <span className="text-[#34c759] border-b border-[#34c759]/30 pb-px" style={{ fontWeight: 600 }}>Thursday</span>.{" "}
          <span className="text-[#0071e3] border-b border-[#0071e3]/30 pb-px" style={{ fontWeight: 600 }}>Priya replied</span>.{" "}
          You're saving{" "}
          <span className="text-[#ff9500] border-b border-[#ff9500]/30 pb-px" style={{ fontWeight: 600 }}>$24</span>.
        </div>
      </SectionReveal>

      {/* See all updates link */}
      <SectionReveal delay={4}>
        <div className="mt-3 flex items-center justify-center gap-1">
          <span className="font-['Urbanist',sans-serif] text-[11px] text-[#0071e3]" style={{ fontWeight: 500 }}>
            See all updates
          </span>
          <ChevronRight size={11} className="text-[#0071e3] rotate-0" />
        </div>
      </SectionReveal>
    </section>
  );
}

// ─── Suggested Products ──────────────────────────────────────────────────

function SuggestedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page_size", "8");
    params.set("ordering", "-created_at");
    fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? data : [];
        setProducts(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    return (products || []).slice(0, 8).map((p: any) => ({
      id: Number(p?.id || 0),
      name: String(p?.name || p?.title || "").trim(),
      price: `${String(p?.currency || "USD")} ${String(p?.price || "").trim()}`.trim(),
      rating: Number(p?.average_rating || 0),
      image: String(p?.hero_image_url || ""),
      stockStatus: p?.stock_status,
    })).filter((x: any) => x.id && x.name);
  }, [products]);

  return (
    <section className="px-6 py-24 md:py-32 max-w-[1200px] mx-auto">
      <SectionReveal>
        <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px] tracking-[0.5px] uppercase mb-3 text-center">
          Curated for you
        </p>
        <h2
          className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4vw,42px)] tracking-[-0.8px] text-center mb-16"
          style={{ fontWeight: 600 }}
        >
          Suggested <span style={{ fontWeight: 300 }}>products</span>
        </h2>
      </SectionReveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map((product: any, i: number) => (
          <SectionReveal key={`suggested-${product.id}-${i}`} delay={i + 1}>
            <Link href={`/products/${product.id}`}>
              <ProductCard name={product.name} price={product.price} rating={product.rating} image={product.image} index={i} stockStatus={product.stockStatus} />
            </Link>
          </SectionReveal>
        ))}
      </div>

      {/* Explore all link */}
      <SectionReveal delay={5}>
        <div className="mt-12 flex justify-center">
          <Link
            href="/explore"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-[14px] text-[#56585D] hover:bg-white hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:text-[#1d1d1f] transition-all"
            style={{ fontWeight: 550 }}
          >
            Explore all categories <ChevronRight size={15} />
          </Link>
        </div>
      </SectionReveal>
    </section>
  );
}

// ─── Trust Section ───────────────────────────────────────────────────────

function TrustSection() {
  const [currentPoster, setCurrentPoster] = useState(0);
  const totalPosters = 5;

  const handleNext = () => {
    setCurrentPoster((prev) => (prev + 1) % totalPosters);
  };

  const handlePrev = () => {
    setCurrentPoster((prev) => (prev - 1 + totalPosters) % totalPosters);
  };

  return (
    <section className="relative px-6 py-28 md:py-36 overflow-hidden">
      {/* Soft pink-to-blue ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f6fbf9] via-[#fef7f7] to-[#f4f8fe] pointer-events-none" />
      <div className="absolute top-[30%] right-[5%] w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-blue-100/25 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto">
        <SectionReveal>
          {/* Experience label */}
          <div className="flex flex-col justify-center items-center text-center mb-8">
            <p
              className="font-['Urbanist',sans-serif] text-[48px] tracking-[0.231px] leading-[84px] not-italic m-[0px] px-[0px] pt-[0px] pb-[20px]"
              style={{ fontWeight: 600, color: 'rgba(68,68,69,0.4)' }}
            >
              Experience
            </p>
          </div>

          {/* Trust at first sight with blur background */}
          <div className="relative flex justify-center items-center mb-24">
            {/* Colorful gradient blur background */}
            <div 
              className="absolute blur-[60px] opacity-90 pointer-events-none"
              style={{
                width: '800px',
                height: '120px',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.6) 0%, rgba(147, 51, 234, 0.5) 50%, rgba(236, 72, 153, 0.6) 100%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            {/* Main heading */}
            <h2
              className="relative font-['Urbanist',sans-serif] text-[96px] tracking-[-1.2px] leading-[84px] not-italic text-center"
              style={{ fontWeight: 700, color: '#1d1d1f' }}
            >
              Trust at first sight.
            </h2>
          </div>

          {/* Shield with heart icon */}
          <div className="flex justify-center mx-[0px] my-[60px]">
            <div className="relative w-[130px] h-[140px]">
              <svg className="block w-full h-full m-[0px]" fill="none" preserveAspectRatio="none" viewBox="0 0 135.946 146.016">
                <g id="Group 370">
                  <path d={svgPaths.p2ec46500} id="Vector" stroke="url(#paint0_linear_42168_27)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="10.6154" />
                  <path d={svgPaths.p2ff93080} id="Vector_2" stroke="url(#paint1_linear_42168_27)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" strokeWidth="6.36923" />
                </g>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_42168_27" x1="5.3952" x2="119.723" y1="36.7289" y2="90.2495">
                    <stop offset="0.000100017" stopColor="#008FF7" />
                    <stop offset="0.25" stopColor="#008FF7" />
                    <stop offset="0.45" stopColor="#2D84F8" />
                    <stop offset="0.55" stopColor="#5A79F9" />
                    <stop offset="0.72" stopColor="#866EF9" />
                    <stop offset="0.8" stopColor="#B363FA" />
                    <stop offset="0.85" stopColor="#E44BC1" />
                    <stop offset="0.95" stopColor="#EC4884" />
                    <stop offset="1" stopColor="#F34546" />
                  </linearGradient>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_42168_27" x1="116.073" x2="93.3294" y1="89.7724" y2="132.534">
                    <stop stopColor="#F34546" />
                    <stop offset="0.5" stopColor="#E44BC1" />
                    <stop offset="1" stopColor="#B363FA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </SectionReveal>

        {/* Gradient slider with 100% */}
        <SectionReveal delay={1}>
          <div className="flex justify-center mb-20">
            <AliveElement sensitivity={1.5}>
              <div className="relative w-auto h-[200px] flex items-center">
                <Group419 />
              </div>
            </AliveElement>
          </div>
        </SectionReveal>

        {/* Trust visual with Figma images */}
        <SectionReveal delay={2}>
          <div className="relative flex justify-center mb-20">
            <div className="scale-[0.8] origin-center">
              <div style={{ transform: `translateX(-${currentPoster * 373}px)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} className="flex">
                <List />
              </div>
            </div>
            
            {/* Navigation arrows - bottom right */}
            <div className="absolute bottom-6 right-6 flex gap-3 z-10">
              <button
                onClick={handlePrev}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                aria-label="Previous poster"
              >
                <LeftArrow />
              </button>
              <button
                onClick={handleNext}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                aria-label="Next poster"
              >
                <RightArrow />
              </button>
            </div>
          </div>
        </SectionReveal>

        {/* Trust steps */}
        <SectionReveal delay={3}>
          <div className="overflow-x-auto -mx-6 px-6 pb-4">
            <div className="scale-[0.8] origin-left inline-block">
              <List2 />
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// ─── Logistics Section ──────────────────────────────────────────────────

function LogisticsSection() {
  return (
    <section className="px-6 py-28 md:py-36 max-w-[1200px] mx-auto">
      <SectionReveal>
        <div className="flex justify-center mb-10">
          <AliveElement sensitivity={2}>
            <motion.div
              animate={{
                rotateY: [0, 180, 360],
              }}
              transition={{ duration: 12, ease: "linear", repeat: Infinity }}
              style={{ perspective: 600 }}
            >
              <img 
                src={imgInfinity} 
                alt="" 
                className="w-[600px] h-auto md:w-[800px] drop-shadow-[0_8px_32px_rgba(0,143,247,0.15)]" 
              />
            </motion.div>
          </AliveElement>
        </div>
      </SectionReveal>

      <SectionReveal delay={1}>
        <h2
          className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4.5vw,46px)] tracking-[-1px] text-center mb-6 leading-[1.15]"
          style={{ fontWeight: 700 }}
        >
          One Platform.
          <br />
          Complete Logistics.
        </h2>
        <p className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[16px] md:text-[18px] text-center max-w-[560px] mx-auto mb-4 leading-relaxed">
          So you can focus on what you're best at.
        </p>
        <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[16px] md:text-[18px] text-center max-w-[700px] mx-auto mb-16 leading-relaxed">
          B2B or B2C. Vehsl delivers end-to-end. Pickup, packaging, documentation, customs, duties, domestic and cross-border shipping, warehousing, and final delivery with transparency.
        </p>
      </SectionReveal>

      {/* Visual flow */}
      <SectionReveal delay={2}>
        <div className="flex justify-center">
          <div className="scale-[0.9] origin-center">
            <LandingVehicle />
          </div>
        </div>
      </SectionReveal>

      {/* Figma visual panel */}
      <SectionReveal delay={3}>
        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-[1000px]">
            <LandingVehicleChart />
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}

// ─── Savings Stat ────────────────────────────────────────────────────────

function SavingsSection() {
  return (
    <section className="relative px-6 py-32 md:py-44 overflow-hidden">
      {/* Chart component */}
      <div className="flex justify-center">
        <LandingVehicleChart />
      </div>
    </section>
  );
}

// ─── Cost Savings Stats ──────────────────────────────────────────────────

function CostSavingsStats() {
  return (
    <section className="relative px-6 py-32 md:py-44 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-[800px] mx-auto text-center"
      >
        <AliveElement sensitivity={2}>
          <span
            className="font-['Urbanist',sans-serif] text-[clamp(80px,18vw,200px)] tracking-[-6px] bg-clip-text text-transparent block leading-[0.95]"
            style={{
              fontWeight: 800,
              backgroundImage:
                "linear-gradient(76deg, rgba(0,143,247,0.9) 10%, rgba(90,121,249,0.85) 31%, rgba(179,99,250,0.8) 60%, rgba(228,75,193,0.75) 90%)",
            }}
          >
            21%
          </span>
        </AliveElement>
        <p
          className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(18px,2.5vw,24px)] tracking-[-0.5px] mt-6 mb-4"
          style={{ fontWeight: 600 }}
        >
          Average savings for sellers
        </p>
        <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[16px] max-w-[460px] mx-auto leading-relaxed">
          By handling logistics, packaging, and quality verification in one place,
          sellers save time and money on every order.
        </p>
      </motion.div>
    </section>
  );
}

// ─── Quality Section ─────────────────────────────────────────────────────

function QualitySection() {
  return (
    <section className="relative px-6 py-32 md:py-44 overflow-hidden">
      <div className="flex justify-center">
        <Group433Full />
      </div>
    </section>
  );
}

// ─── Weekly Top Products ────────────────────────────────────────────────

function WeeklyProducts() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page_size", "4");
    params.set("ordering", "-created_at");
    fetchJsonAuthed(`/api/v1/products/?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? data : [];
        setProducts(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    return (products || []).slice(0, 4).map((p: any) => ({
      id: Number(p?.id || 0),
      name: String(p?.name || p?.title || "").trim(),
      price: `${String(p?.currency || "USD")} ${String(p?.price || "").trim()}`.trim(),
      rating: Number(p?.average_rating || 0),
      image: String(p?.hero_image_url || ""),
      stockStatus: p?.stock_status,
    })).filter((x: any) => x.id && x.name);
  }, [products]);

  return (
    <section className="px-6 py-24 md:py-32 max-w-[1200px] mx-auto">
      <SectionReveal>
        <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px] tracking-[0.5px] uppercase mb-3 text-center">
          This week's favorites
        </p>
        <h2
          className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[clamp(28px,4vw,42px)] tracking-[-0.8px] text-center mb-16"
          style={{ fontWeight: 600 }}
        >
          Weekly <span style={{ fontWeight: 300 }}>top products</span>
        </h2>
      </SectionReveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map((product: any, i: number) => (
          <SectionReveal key={`weekly-${product.id}-${i}`} delay={i + 1}>
            <Link href={`/products/${product.id}`}>
              <ProductCard name={product.name} price={product.price} rating={product.rating} image={product.image} index={i + 4} stockStatus={product.stockStatus} />
            </Link>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
}

// ─── Seller CTA ──────────────────────────────────────────────────────────

function SellerCTA() {
  return (
    <section className="px-6 py-24 md:py-32 max-w-[1200px] mx-auto">
      <SectionReveal>
        <div className="relative bg-gradient-to-br from-[#0d1117] to-[#1a2332] rounded-[32px] p-10 md:p-16 overflow-hidden text-center">
          {/* Ambient glow */}
          <div className="absolute top-[-50%] left-[20%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-30%] right-[15%] w-[350px] h-[350px] bg-purple-500/6 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <p className="font-['Urbanist',sans-serif] text-white/30 text-[12px] tracking-[1.5px] uppercase mb-5">
              For sellers
            </p>
            <h2
              className="font-['Urbanist',sans-serif] text-white text-[clamp(24px,4vw,40px)] tracking-[-0.8px] mb-5 leading-[1.2]"
              style={{ fontWeight: 700 }}
            >
              Focus on what you do best.
              <br />
              <span className="text-white/50">We'll handle the rest.</span>
            </h2>
            <p className="font-['Urbanist',sans-serif] text-white/40 text-[15px] md:text-[16px] max-w-[480px] mx-auto mb-10 leading-relaxed">
              Quality checks, sample verification, packaging, logistics, and delivery.
              All managed. You just make great products.
            </p>

            {/* Figma list item visual */}
            <div className="mb-10">
              <img src={imgListitem} alt="" className="mx-auto max-w-[300px] w-full h-auto opacity-80" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AliveButton variant="secondary" className="!bg-white !text-[#0d1117]">
                Become a seller
              </AliveButton>
              <AliveButton variant="ghost" className="!text-white/60">
                Learn more <ChevronRight size={14} className="inline ml-1" />
              </AliveButton>
            </div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-6 py-16 md:py-20 border-t border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-16">
          <div>
            <Link
              href="/"
              className="font-['Urbanist',sans-serif] text-[#19202b] text-[28px] tracking-[-0.5px] block mb-6"
              style={{ fontWeight: 700 }}
            >
              Vehsl
            </Link>
            <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] leading-relaxed">
              Trust, quality, and care
              <br />
              in every transaction.
            </p>
          </div>

          <div>
            <h4
              className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5"
              style={{ fontWeight: 600 }}
            >
              Platform
            </h4>
            <div className="flex flex-col gap-3">
              {["B2B Trading", "B2C Shopping", "Quality Checks", "Logistics"].map((item) => (
                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5"
              style={{ fontWeight: 600 }}
            >
              Sellers
            </h4>
            <div className="flex flex-col gap-3">
              {["Become a Seller", "Seller Dashboard", "Pricing", "Support"].map((item) => (
                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[14px] tracking-[-0.2px] mb-5"
              style={{ fontWeight: 600 }}
            >
              Company
            </h4>
            <div className="flex flex-col gap-3">
              {["About", "Careers", "Privacy", "Terms"].map((item) => (
                <a key={item} href="#" className="font-['Urbanist',sans-serif] text-[#86868b] text-[14px] hover:text-[#0071e3] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-black/[0.04]">
          <p className="font-['Urbanist',sans-serif] text-[#86868b] text-[13px]">
            Copyright 2026 Vehsl. All rights reserved.
          </p>
          <p className="font-['Urbanist',sans-serif] text-[#d2d2d7] text-[13px] mt-2 md:mt-0">
            Designed with care, for everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const handleCategorySelect = (id: string | null) => {
    setActiveCategory(id);
    setActiveSubcategory(null);
  };

  const handleSubcategorySelect = (catId: string, subId: string) => {
    setActiveCategory(catId);
    setActiveSubcategory(subId);
  };

  return (
    <div className="min-h-screen bg-white font-['Urbanist',sans-serif] overflow-x-hidden">
      <Navbar
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
      />
      <HeroSection />
      <SuggestedProducts />
      <TrustSection />
      <LogisticsSection />
      <SavingsSection />
      <CostSavingsStats />
      <QualitySection />
      <WeeklyProducts />
      <SellerCTA />
      <Footer />
    </div>
  );
}
