"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { cn } from "@/components/ui/utils";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { categories, homeNavOrder } from "@/lib/categories";

export function TopNav({
  activeCategoryId,
  onCategoryEnter,
  onCategoryLeave,
  signInSlot,
}: {
  activeCategoryId: string | null;
  onCategoryEnter: (categoryId: string) => void;
  onCategoryLeave: () => void;
  signInSlot?: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navCategories = homeNavOrder
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="pointer-events-auto fixed left-2 right-2 top-2 z-50 mx-auto max-w-6xl sm:left-4 sm:right-4 sm:top-5">

      {/* Navbar */}
      <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-3 py-2 backdrop-blur-xl shadow-soft sm:px-6 sm:py-3">

        {/* Logo */}
        <div className="text-base font-semibold tracking-tight text-[#0f1115] sm:text-xl">
          Vehsl
        </div>

        {/* DESKTOP */}
        <div
          className="hidden lg:flex items-center gap-2"
          onMouseLeave={onCategoryLeave}
        >
          {navCategories.map((c) => {
            const Icon = c!.icon;
            const isActive = c!.id === activeCategoryId;

            return (
              <button
                key={c!.id}
                type="button"
                onMouseEnter={() => onCategoryEnter(c!.id)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition hover:scale-[1.05]",
                  isActive ? "ring-2 ring-blue-200" : "ring-1 ring-white/60"
                )}
              >
                <Icon className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
              </button>
            );
          })}

          <Link
            href="/explore"
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition hover:scale-[1.05] ring-1 ring-white/60 hover:ring-2 hover:ring-blue-200"
          >
            <Menu className="h-5 w-5 text-[#1f2330]" />
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          <div className="scale-90 sm:scale-100 origin-right">
            <LanguageToggle />
          </div>

          {signInSlot ?? (
            <Link
              href="/signup"
              className={cn(
                "rounded-full bg-white font-semibold tracking-tight text-[#ec4899] shadow-soft text-[10px] px-2 py-1 sm:text-xs sm:px-4 sm:py-2",
                "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding border border-transparent"
              )}
            >
              Sign In
            </Link>
          )}

          {/* MOBILE TOGGLE */}
          <button
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#1f2330]" />
            ) : (
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-[#1f2330]" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <>
          {/* Overlay (CLICK OUTSIDE CLOSE FIX) */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-50 mt-3 overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-3 backdrop-blur-xl shadow-soft sm:p-4 lg:hidden">

            <div className="grid grid-cols-3 place-items-center gap-2 xs:grid-cols-4 sm:grid-cols-5">
              {navCategories.map((c) => {
                const Icon = c!.icon;

                return (
                  <button
                    key={c!.id}
                    type="button"
                    onClick={() => {
                      onCategoryEnter(c!.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white ring-1 ring-white/60 transition hover:scale-[1.05]"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#1f2330]" />
                  </button>
                );
              })}

              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-full mt-2 flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
              >
                Explore All
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// "use client";

// import Link from "next/link";
// import { Menu, X } from "lucide-react";
// import type React from "react";
// import { useState } from "react";

// import { cn } from "@/components/ui/utils";
// import { LanguageToggle } from "@/components/common/LanguageToggle";
// import { categories, homeNavOrder } from "@/lib/categories";

// export function TopNav({
//   activeCategoryId,
//   onCategoryEnter,
//   onCategoryLeave,
//   signInSlot,
// }: {
//   activeCategoryId: string | null;
//   onCategoryEnter: (categoryId: string) => void;
//   onCategoryLeave: () => void;
//   signInSlot?: React.ReactNode;
// }) {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const navCategories = homeNavOrder
//     .map((id) => categories.find((c) => c.id === id))
//     .filter(Boolean);

//   return (
//     <div className="pointer-events-auto fixed left-3 right-3 top-3 z-50 mx-auto max-w-6xl sm:left-6 sm:right-6 sm:top-5">
//       <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-2.5 backdrop-blur-xl shadow-soft sm:px-6 sm:py-3">
        
//         {/* Logo */}
//         <div className="text-lg font-semibold tracking-tight text-[#0f1115] sm:text-xl">
//           Vehsl
//         </div>
         
//         {/* Desktop Menu */}
//         <div
//           className="hidden items-center gap-2 lg:flex"
//           onMouseLeave={onCategoryLeave}
//         >
//           {navCategories.map((c) => {
//             const Icon = c!.icon;
//             const isActive = c!.id === activeCategoryId;

//             return (
//               <button
//                 key={c!.id}
//                 type="button"
//                 onMouseEnter={() => onCategoryEnter(c!.id)}
//                 className={cn(
//                   "flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition",
//                   "hover:scale-[1.05]",
//                   isActive
//                     ? "ring-2 ring-blue-200"
//                     : "ring-1 ring-white/60"
//                 )}
//                 aria-label={c!.name}
//               >
//                 <Icon className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
//               </button>
//             );
//           })}
//            <Link
//               href="/explore"
//               className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-white/60"
//             >
//               <Menu className="h-5 w-5 text-[#1f2330]" />
//             </Link>
//         </div>

//         {/* Right Side */}
//         <div className="flex items-center gap-3">
//           <LanguageToggle />

//           {signInSlot ?? (
//             <button
//               type="button"
//               className={cn(
//                 "hidden lg:block rounded-full bg-white px-4 py-2 text-xs font-semibold tracking-tight text-[#ec4899] shadow-soft",
//                 "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding,border-box border border-transparent"
//               )}
//             >
//               sign in
//             </button>
//           )}

//           {/* Mobile + Tablet Toggle Button */}
//           <button
//             className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 lg:hidden"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//           >
//             {mobileMenuOpen ? (
//               <X className="h-5 w-5 text-[#1f2330]" />
//             ) : (
//               <Menu className="h-5 w-5 text-[#1f2330]" />
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Mobile + Tablet Dropdown */}
//       {mobileMenuOpen && (
//         <div className="mt-3 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur-xl shadow-soft lg:hidden">
          
//           <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
//             {navCategories.map((c) => {
//               const Icon = c!.icon;

//               return (
//                 <button
//                   key={c!.id}
//                   type="button"
//                   onClick={() => {
//                     onCategoryEnter(c!.id);
//                     setMobileMenuOpen(false);
//                   }}
//                   className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-white/60 transition hover:scale-105"
//                 >
//                   <Icon
//                     className="h-5 w-5 text-[#1f2330]"
//                     strokeWidth={1.5}
//                   />
//                 </button>
//               );
//             })}

//             <Link
//               href="/explore"
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-white/60 transition hover:scale-105"
//             >
//               <Menu className="h-5 w-5 text-[#1f2330]" />
//             </Link>
//           </div>

//           {/* Tablet Sign In */}
//           <div className="mt-4 sm:hidden md:hidden lg:hidden">
//              <Link
//               href="/explore"
//               className="flex items-center justify-center
//               bg-black text-white
//               px-6 py-4
//               w-full sm:w-auto md:w-50
//               rounded-md
//               ring-1 ring-white/60
//               transition duration-300
//               hover:scale-105
//               text-sm sm:text-base"
//             >
//               Explore All
//             </Link>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
