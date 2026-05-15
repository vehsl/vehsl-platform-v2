"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { cn } from "@/components/ui/utils";
import { categories } from "@/lib/categories";

export function MegaMenu({
  activeCategoryId,
  open,
  onClose,
  onKeepOpen,
}: {
  activeCategoryId: string | null;
  open: boolean;
  onClose: () => void;
  onKeepOpen?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const category = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [activeCategoryId]
  );

  const [activeSubIndex, setActiveSubIndex] = useState(0);

  const activeSub = category?.subcategories[activeSubIndex] ?? null;

  // ✅ CLICK OUTSIDE CLOSE FIX
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // reset subcategory when category changes
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
          className="pointer-events-auto absolute left-1/2 top-92px z-40 w-[min(1100px,calc(100vw-48px))] -translate-x-1/2"
          onMouseEnter={onKeepOpen}
          onMouseLeave={onClose}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[28px] border border-white/50 bg-white/40 p-6 backdrop-blur-2xl shadow-soft " ,
              "bg-[radial-gradient(900px_420px_at_20%_0%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(900px_420px_at_80%_0%,rgba(236,72,153,0.12),transparent_55%)]"
            )}
          >
            {/* background text */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute bottom-60px left-1/2 -translate-x-1/2 text-[160px] font-extrabold text-black opacity-[0.08]">
                Vehsl
              </div>
            </div>

            {/* SUBCATEGORIES */}
            <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {category.subcategories.slice(0, 8).map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === activeSubIndex;

                return (
                  <button
                    key={s.name}
                    type="button"
                    onMouseEnter={() => setActiveSubIndex(idx)}
                    className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-white/35"
                  >
                    <div
                      className={cn(
                        "relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-md",
                        isActive && "ring-1 ring-blue-200 bg-blue-50"
                      )}
                    >
                      <Icon className="h-6 w-6 text-[#1f2330]" strokeWidth={1.5} />
                    </div>

                    <div
                      className={cn(
                        "max-w-72px text-center text-xs",
                        isActive
                          ? "font-semibold text-[#0f1115]"
                          : "text-gray-700"
                      )}
                    >
                      {s.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ITEMS */}
            <div className="relative mt-5 grid grid-cols-2 gap-3 opacity-60 md:grid-cols-4 lg:grid-cols-8">
              {(activeSub?.items ?? []).slice(0, 8).map((name) => (
                <div key={name} className="flex flex-col items-center gap-2 rounded-2xl p-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-md">
                    <Sparkles className="h-6 w-6 text-[#1f2330]" />
                  </div>
                  <div className="text-center text-xs text-gray-700">
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