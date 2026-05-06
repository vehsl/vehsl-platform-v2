"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, ThumbsUp, X } from "lucide-react";

/* ───── Mock review data ─────────────────────────────── */

const reviewSummary = {
  average: 4.63,
  total: 413,
  breakdown: [
    { stars: 5, count: 278 },
    { stars: 4, count: 89 },
    { stars: 3, count: 28 },
    { stars: 2, count: 12 },
    { stars: 1, count: 6 },
  ],
};

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    title: "Genuinely the last cable I'll buy",
    body: "I've gone through so many USB-C cables. This one charges my MacBook Pro at full speed and the braided nylon feels incredibly premium. Worth every penny.",
    helpful: 47,
    verified: true,
    tag: "MacBook Pro",
    photos: [
      "https://images.unsplash.com/photo-1558965088-2e9062616292?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjaGFyZ2luZyUyMGNhYmxlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MzcwMzM2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    ],
  },
  {
    id: 2,
    name: "James K.",
    rating: 5,
    date: "1 month ago",
    title: "Fast data transfer, no joke",
    body: "Transferred 200GB of video footage in minutes. The 80Gbps spec is real. Also love that it works with my Samsung and my iPad without swapping cables.",
    helpful: 33,
    verified: true,
    tag: "Data Transfer",
    photos: [],
  },
  {
    id: 3,
    name: "Priya R.",
    rating: 4,
    date: "1 month ago",
    title: "Great cable, slightly stiff at first",
    body: "The build quality is outstanding — you can feel the Kevlar core. Only minor note: it's a bit stiff out of the box but loosens up after a few days of use.",
    helpful: 21,
    verified: true,
    tag: "Build Quality",
    photos: [
      "https://images.unsplash.com/photo-1696150874769-ea4f30453c2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpZGVkJTIwY2FibGUlMjBkZXRhaWwlMjBtYWNyb3xlbnwxfHx8fDE3NzM3MDMzNjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1719553914153-cf25e4c040fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBjYWJsZSUyMGNsb3NlJTIwdXAlMjBkZXNrfGVufDF8fHx8MTc3MzcwMzM2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    ],
  },
  {
    id: 4,
    name: "Tom L.",
    rating: 5,
    date: "2 months ago",
    title: "240W charging is a game changer",
    body: "My laptop goes from 0 to 50% in under 30 minutes. I used to carry multiple cables for different devices — now I just carry this one. Simplified my whole setup.",
    helpful: 18,
    verified: true,
    tag: "Charging",
    photos: [],
  },
  {
    id: 5,
    name: "Elena V.",
    rating: 4,
    date: "2 months ago",
    title: "Beautiful and functional",
    body: "Got the Space Blue color and it looks amazing. The connector housing is solid aluminum. Only reason for 4 stars is I wish they had a 0.5m option for tight desk setups.",
    helpful: 14,
    verified: false,
    tag: "Design",
    photos: [
      "https://images.unsplash.com/photo-1760348213270-7cd00b8c3405?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwc2V0dXAlMjBjYWJsZSUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzczNzAzMzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    ],
  },
  {
    id: 6,
    name: "Marcus D.",
    rating: 5,
    date: "3 months ago",
    title: "Survived my toddler",
    body: "My 2-year-old has bent, pulled, and chewed on this cable. Still works perfectly. The durability claims are legit. Already ordered two more.",
    helpful: 52,
    verified: true,
    tag: "Durability",
    photos: [],
  },
  {
    id: 7,
    name: "Aiko T.",
    rating: 3,
    date: "3 months ago",
    title: "Good cable, premium price",
    body: "The quality is undeniable �� charges fast, transfers fast, feels great. But at this price point I expected a carrying pouch or cable tie included. The cable itself is excellent though.",
    helpful: 9,
    verified: true,
    tag: "Value",
    photos: [],
  },
];

/* ───── Star Row ─────────────────────────────────────── */

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? "#0071e3" : "#e8e8ed"}
          stroke={s <= rating ? "#0071e3" : "#e8e8ed"}
        />
      ))}
    </div>
  );
}

/* ───── Component ────────────────────────────────────── */

export function ReviewsPopover() {
  const [open, setOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <p
        onClick={() => setOpen(true)}
        className="text-[#0071e3] hover:text-[#0077ed] cursor-pointer transition-colors"
        style={{ fontSize: 12, textDecoration: "underline", textDecorationColor: "#0071e340", textUnderlineOffset: 2 }}
      >
        {reviewSummary.total} reviews
      </p>

      {/* Backdrop + Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
              style={{ fontFamily: "'Urbanist', system-ui, -apple-system, sans-serif" }}
            />

            {/* Slide-in Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col"
              style={{ fontFamily: "'Urbanist', system-ui, -apple-system, sans-serif" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f3]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Star size={20} fill="#0071e3" stroke="#0071e3" />
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#1d1d1f" }}>
                      {reviewSummary.average}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: "#86868b" }}>
                    {reviewSummary.total} reviews
                  </span>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} className="text-[#86868b]" />
                </motion.button>
              </div>

              {/* Rating Breakdown */}
              <div className="px-6 py-5 border-b border-[#f0f0f3]">
                <div className="flex flex-col gap-2">
                  {reviewSummary.breakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span
                        className="shrink-0"
                        style={{ fontSize: 12, fontWeight: 600, color: "#86868b", width: 12, textAlign: "right" }}
                      >
                        {row.stars}
                      </span>
                      <Star size={10} fill="#0071e3" stroke="#0071e3" className="shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-[#f5f5f7] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: "#0071e3" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(row.count / reviewSummary.total) * 100}%` }}
                          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <span
                        className="shrink-0"
                        style={{ fontSize: 11, color: "#aeaeb2", width: 28, textAlign: "right" }}
                      >
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="flex-1 overflow-y-auto px-8 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-col gap-10">
                  {reviews.slice(0, visibleCount).map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="flex flex-col gap-4 relative"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: `hsl(${review.id * 47}, 65%, 95%)`,
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: `hsl(${review.id * 47}, 40%, 45%)`,
                                fontFamily: 'Urbanist, sans-serif'
                              }}
                            >
                              {review.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f", fontFamily: 'Urbanist, sans-serif', letterSpacing: '-0.01em' }}>
                                {review.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRow rating={review.rating} size={12} />
                              <span style={{ fontSize: 12, color: "#aeaeb2", fontFamily: 'Nunito, sans-serif' }}>· {review.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-2 pl-[54px]">
                        {/* Title */}
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#1d1d1f", lineHeight: 1.3, fontFamily: 'Urbanist, sans-serif', letterSpacing: '-0.02em' }}>
                          {review.title}
                        </p>

                        {/* Body */}
                        <p style={{ fontSize: 15, lineHeight: 1.65, color: "#6e6e73", fontFamily: 'Urbanist, sans-serif', fontWeight: 500 }}>
                          {review.body}
                        </p>

                        {/* Photos */}
                        {review.photos.length > 0 && (
                          <div className="flex gap-3 mt-3">
                            {review.photos.map((photo, pi) => (
                              <motion.button
                                key={pi}
                                onClick={() => setLightboxImg(photo)}
                                className="cursor-pointer overflow-hidden rounded-[20px] shrink-0 relative group border-none p-0"
                                style={{
                                  width: 86,
                                  height: 86,
                                }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="absolute inset-0 rounded-[20px] border border-black/5 z-10 pointer-events-none" />
                                <img
                                  src={photo}
                                  alt={`Photo by ${review.name}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 mt-4">
                          <span
                            className="px-3 py-1.5 rounded-full"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#86868b",
                              backgroundColor: "#f5f5f7",
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          >
                            {review.tag}
                          </span>
                          <button className="flex items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-transparent border-none cursor-pointer p-1">
                            <ThumbsUp size={14} strokeWidth={2.5} />
                            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Nunito, sans-serif' }}>{review.helpful}</span>
                          </button>
                        </div>
                      </div>

                      {/* Soft Separator instead of harsh border */}
                      {i < reviews.length - 1 && (
                        <div className="absolute -bottom-5 left-[54px] right-0 h-[1px] bg-gradient-to-r from-black/5 to-transparent" />
                      )}
                    </motion.div>
                  ))}
                </div>
                {visibleCount < reviews.length && (
                  <div className="flex justify-center mt-8">
                    <motion.button
                      onClick={() => setVisibleCount((c) => Math.min(c + 4, reviews.length))}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer border-none"
                      style={{
                        padding: "10px 28px",
                        borderRadius: 999,
                        backgroundColor: "#f5f5f7",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1d1d1f",
                        fontFamily: "'Urbanist', sans-serif",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Load more reviews
                    </motion.button>
                  </div>
                )}
                {visibleCount >= reviews.length && (
                  <p
                    className="text-center mt-8"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#aeaeb2",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    You've seen all {reviews.length} reviews
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[80vh] rounded-[20px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImg}
                alt="Review photo"
                className="w-full h-full object-contain"
                style={{ maxHeight: "80vh" }}
              />
              <motion.button
                onClick={() => setLightboxImg(null)}
                whileTap={{ scale: 0.9 }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} className="text-white" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}