"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type React from "react";

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
  const navCategories = homeNavOrder
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="pointer-events-auto fixed left-3 right-3 top-3 z-50 mx-auto max-w-6xl sm:left-6 sm:right-6 sm:top-5">
      <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-2.5 backdrop-blur-xl shadow-soft sm:px-6 sm:py-3">
        <div className="text-lg font-semibold tracking-tight text-[#0f1115] sm:text-xl">Vehsl</div>

        <div className="hidden items-center gap-2 md:flex" onMouseLeave={onCategoryLeave}>
          {navCategories.map((c) => {
            const Icon = c!.icon;
            const isActive = c!.id === activeCategoryId;
            return (
              <button
                key={c!.id}
                type="button"
                onMouseEnter={() => onCategoryEnter(c!.id)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition",
                  "hover:scale-[1.05]",
                  isActive ? "ring-2 ring-blue-200" : "ring-1 ring-white/60",
                )}
                aria-label={c!.name}
              >
                <Icon className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
              </button>
            );
          })}

          <Link
            href="/explore"
            className={cn(
              "ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition",
              "hover:scale-[1.05] ring-1 ring-white/60 hover:ring-2 hover:ring-blue-200",
            )}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {signInSlot ?? (
            <button
              type="button"
              className={cn(
                "rounded-full bg-white px-4 py-2 text-xs font-semibold tracking-tight text-[#ec4899] shadow-soft",
                "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding,border-box border border-transparent",
              )}
            >
              sign in
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end md:hidden" onMouseLeave={onCategoryLeave}>
        <Link
          href="/explore"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/55 backdrop-blur-xl shadow-soft"
          aria-label="Explore"
        >
          <Menu className="h-5 w-5 text-[#1f2330]" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
