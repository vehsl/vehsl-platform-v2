"use client";

import { useLanguage, type AppLanguage } from "@/context/language";
import { cn } from "@/components/ui/utils";

const languages: Array<{ code: AppLanguage; label: string; flag: string }> = [
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-white/60 bg-white/55 px-2 py-1 backdrop-blur-xl shadow-soft",
        className,
      )}
    >
      {languages.map((l, idx) => {
        const active = l.code === language;
        return (
          <div key={l.code} className="flex items-center">
            <button
              type="button"
              onClick={() => setLanguage(l.code)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                active ? "text-[#0f1115]" : "text-[#7c7f87] hover:text-[#0f1115]",
              )}
            >
              <span className="leading-none">{l.flag}</span>
              <span className="leading-none">{l.label}</span>
            </button>
            {idx === 0 ? <div className="mx-1 h-4 w-px bg-black/10" /> : null}
          </div>
        );
      })}
    </div>
  );
}
