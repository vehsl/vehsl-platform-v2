"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { categories } from "@/lib/categories";
import { useLanguage } from "@/context/language";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function MegaMenu({
  activeCategoryId,
  open,
  onClose,
  onKeepOpen,
}: {
  activeCategoryId: string | null;
  open: boolean;
  onClose: () => void;
  onKeepOpen: () => void;
}) {
  const { language } = useLanguage();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const category = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [activeCategoryId]
  );

  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const activeSub = category?.subcategories[activeSubIndex] ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setActiveSubIndex(0);
  }, [activeCategoryId]);

  return (
    <AnimatePresence>
      {open && category && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onMouseEnter={onKeepOpen}
          className="pointer-events-auto fixed left-1/2 top-[68px] sm:top-[76px] z-40 w-[min(1100px,calc(100vw-24px))] sm:w-[min(1100px,calc(100vw-48px))] -translate-x-1/2"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-white/50 bg-white/40 p-3 sm:p-4 lg:p-6 backdrop-blur-2xl shadow-soft",
              "bg-[radial-gradient(900px_420px_at_20%_0%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(900px_420px_at_80%_0%,rgba(236,72,153,0.12),transparent_55%)]"
            )}
          >
            {/* background text — hide on small screens */}
            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-[160px] font-extrabold text-black opacity-[0.08]">
                Vehsl
              </div>
            </div>

            {/* SUBCATEGORIES — show ALL, no slice */}
            <div className="relative grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 lg:grid-cols-8 lg:gap-3">
              {category.subcategories.map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === activeSubIndex;

                return (
                  <Link
                    key={s.name}
                    href={`/explore/${activeCategoryId}/${toSlug(s.name)}`}
                    onMouseEnter={() => setActiveSubIndex(idx)}
                    onClick={onClose}
                    className="group flex flex-col items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 lg:p-3 transition hover:bg-white/35"
                  >
                    <div
                      className={cn(
                        "relative flex h-9 w-9 sm:h-11 sm:w-11 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-md",
                        isActive && "ring-1 ring-blue-200 bg-blue-50"
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-[#1f2330]" strokeWidth={1.5} />
                    </div>

                    <div
                      className={cn(
                        "w-full text-center text-[10px] sm:text-xs leading-tight",
                        isActive ? "font-semibold text-[#0f1115]" : "text-gray-700"
                      )}
                    >
                      {language === "zh" && s.nameZh ? s.nameZh : s.name}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ITEMS — show ALL, no slice */}
            <div className="relative mt-2 sm:mt-4 lg:mt-5 grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 lg:grid-cols-8 lg:gap-3 opacity-60">
              {((language === "zh" && activeSub?.itemsZh ? activeSub.itemsZh : activeSub?.items) ?? []).map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 lg:p-3"
                >
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-md">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-[#1f2330]" />
                  </div>
                  <div className="w-full text-center text-[10px] sm:text-xs leading-tight text-gray-700">
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

