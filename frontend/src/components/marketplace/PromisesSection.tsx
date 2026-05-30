import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AliveElement } from "@/components/landing/alive-element";
import { promisesData, type PromiseItem } from "@/components/marketplace/data/promisesData";
import { useLanguage } from "@/context/language";
import { fetchJsonAuthed } from "@/lib/api";

export function PromisesSection() {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => (language === "zh" ? zh : en);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [items, setItems] = useState<PromiseItem[]>(promisesData);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 4;
    setNeedsScroll(overflows);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    updateScrollState();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchJsonAuthed("/api/v1/marketing/promises/")
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray((data as any)?.promises) ? (data as any).promises : Array.isArray(data) ? data : [];
        const mapped: PromiseItem[] = rows
          .map((r: any) => {
            const id = String(r?.id || "").trim();
            return {
              id,
              imageUrl: String(r?.image_url || r?.imageUrl || "").trim(),
              titleEn: String(r?.title_en || r?.titleEn || "").trim(),
              titleZh: String(r?.title_zh || r?.titleZh || "").trim(),
              descriptionEn: String(r?.description_en || r?.descriptionEn || "").trim(),
              descriptionZh: String(r?.description_zh || r?.descriptionZh || "").trim(),
            };
          })
          .filter((x: PromiseItem) => x.id && x.titleEn);
        if (mapped.length > 0) setItems(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const inner = el.firstElementChild as HTMLElement | null;
    const firstCard = inner?.firstElementChild as HTMLElement | null;
    const amount = firstCard ? firstCard.offsetWidth + 16 : 276;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="px-6 py-16 md:py-20" style={{ backgroundColor: "#E7ECF3" }}>
      <div className="max-w-[1200px] mx-auto">
        <div ref={scrollRef} onScroll={updateScrollState} className="-mx-6 overflow-x-scroll [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          <div className={`flex items-start px-6${needsScroll ? '' : ' justify-center'}`} style={{ gap: "16px", paddingBottom: "8px" }}>
            {items.map((promise, i) => (
              <div key={promise.id} className="flex-shrink-0">
                <AliveElement delay={i} sensitivity={0.5}>
                  <div>
                    <div className="mb-4 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-shadow duration-300" style={{ width: "clamp(140px, 16vw, 260px)", height: "clamp(224px, 25.56vw, 415.36px)", borderRadius: "clamp(18px, 2.2vw, 35.83px)", background: i === 3 ? "linear-gradient(180deg, #F6F6F6 0%, #DEDEDE 100%)" : "#FFF" }}>
                      {promise.imageUrl ? (
                        <img src={promise.imageUrl} alt={t(promise.titleEn, promise.titleZh)} className="w-full h-full object-cover" style={{ borderRadius: "clamp(18px, 2.2vw, 35.83px)", display: "block" }} />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex flex-col" style={{ width: "clamp(130px, 14.1vw, 230px)", minHeight: "clamp(52px, 5.2vw, 84px)" }}>
                      <p className="font-['Urbanist',sans-serif] text-[clamp(12px,1.5vw,16.564px)] font-semibold leading-[1.3]">
                        <span className="text-black" style={{ letterSpacing: "-0.364px" }}>{t(promise.titleEn, promise.titleZh)}</span>{" "}
                        <span className="text-[#86868B]" style={{ letterSpacing: "-0.364px" }}>{t(promise.descriptionEn, promise.descriptionZh)}</span>
                      </p>
                    </div>
                  </div>
                </AliveElement>
              </div>
            ))}
          </div>
        </div>

        {needsScroll && (
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => scroll('left')} style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(210, 210, 215, 0.64)', border: 'none', cursor: canScrollLeft ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canScrollLeft ? 1 : 0.42, transition: 'opacity 0.2s', flexShrink: 0 }}>
              <ChevronLeft size={14} style={{ color: 'rgba(0,0,0,0.56)' }} />
            </button>
            <button onClick={() => scroll('right')} style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(210, 210, 215, 0.64)', border: 'none', cursor: canScrollRight ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canScrollRight ? 1 : 0.42, transition: 'opacity 0.2s', flexShrink: 0 }}>
              <ChevronRight size={14} style={{ color: 'rgba(0,0,0,0.56)' }} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
