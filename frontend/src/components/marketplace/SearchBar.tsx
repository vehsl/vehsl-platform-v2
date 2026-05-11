"use client";

import { Camera, Mic, Search } from "lucide-react";

import { cn } from "@/components/ui/utils";
import { useLanguage } from "@/context/language";

export function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "mx-auto flex h-14 w-full max-w-[640px] items-center gap-3 rounded-full border border-white/70 bg-white/85 px-4 backdrop-blur-md shadow-soft sm:h-16 sm:px-5",
        "focus-within:ring-2 focus-within:ring-blue-200",
        className,
      )}
    >
      <Search className="h-5 w-5 text-[#7c7f87]" strokeWidth={1.5} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full bg-transparent text-sm text-[#0f1115] outline-none placeholder:text-[#7c7f87]/70"
      />
      <button
        type="button"
        className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#1f2330] backdrop-blur-md sm:flex"
        aria-label="Image search"
      >
        <Camera className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-soft"
        aria-label="Voice"
      >
        <Mic className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
