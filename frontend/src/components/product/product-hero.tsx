"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useProductSelection } from "./product-selection-context";

/* ───── Image sets keyed by color name ───────────────── */

const colorImages: Record<string, string> = {
  Silver:
    "https://images.unsplash.com/photo-1728981393845-fcb9cdba94b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBDJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzczNzUyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Space Blue":
    "https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwVVNCJTIwQyUyMGNoYXJnaW5nJTIwY2FibGUlMjBwcm9kdWN0fGVufDF8fHx8MTc3Mzc1MjU3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Forest:
    "https://images.unsplash.com/photo-1674401223616-b4629a516aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGNoYXJnaW5nJTIwY2FibGUlMjBueWxvbiUyMGJyYWlkZWQlMjBwcm9kdWN0fGVufDF8fHx8MTc3Mzc1MjU4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Sunshine:
    "https://images.unsplash.com/photo-1754604031339-f65c62a55aaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3clMjBjYWJsZSUyMHdpcmUlMjB0ZWNoJTIwbWluaW1hbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNzUyNTgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Rose:
    "https://images.unsplash.com/photo-1641945993433-e5550263ac48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcm9zZSUyMGdvbGQlMjBjYWJsZSUyMHRlY2glMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzczNzUyNTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Midnight:
    "https://images.unsplash.com/photo-1648522168443-101452948e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMFVTQiUyMGNhYmxlJTIwY29pbGVkJTIwc3R1ZGlvJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzM3NTI1ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  White:
    "https://images.unsplash.com/photo-1751846545116-838fe2e7e815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGJyYWlkZWQlMjBVU0IlMjBjYWJsZSUyMGNvaWxlZCUyMG1pbmltYWx8ZW58MXx8fHwxNzczNzUyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

/** Contextual image for the connector detail */
const connectorImage =
  "https://images.unsplash.com/photo-1741666998073-7df07563d4d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBjYWJsZSUyMGNvbm5lY3RvciUyMHRpcCUyMGRldGFpbCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzM3NTI1ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/** Contextual image when length is selected */
const lengthContextImage =
  "https://images.unsplash.com/photo-1732716286592-996f9e08a296?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJsZSUyMHBsdWdnZWQlMjBpbnRvJTIwbGFwdG9wJTIwVVNCJTIwcG9ydCUyMGNsb3NldXB8ZW58MXx8fHwxNzczNzUyNTg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/** Contextual image when speed is selected */
const speedContextImage =
  "https://images.unsplash.com/photo-1760112783577-c76fcab43695?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwdHJhbnNmZXIlMjBzcGVlZCUyMHRlY2hub2xvZ3klMjBhYnN0cmFjdCUyMGxpZ2h0fGVufDF8fHx8MTc3Mzc1MjU4M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/** Default hero images before any selection */
const defaultImages = [
  "https://images.unsplash.com/photo-1728981393845-fcb9cdba94b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBDJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzczNzUyNTc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1676704417835-9692cd7847c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjB0eXBlJTIwQyUyMGNvbm5lY3RvciUyMGNsb3NlJTIwdXAlMjBtYWNybyUyMHdoaXRlfGVufDF8fHx8MTc3Mzc1MjU3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1679840896468-a9b1f9b42307?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwY2FibGUlMjBhY2Nlc3NvcnklMjBwcm9kdWN0JTIwbWluaW1hbCUyMHN0dWRpb3xlbnwxfHx8fDE3NzM3NTI1ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1625461291092-13d0c45608b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjaGFyZ2luZyUyMGNhYmxlJTIwY29ubmVjdGVkJTIwbWluaW1hbCUyMGRlc2t8ZW58MXx8fHwxNzczNzUyNTc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
];

const colorNames = ["Silver", "Space Blue", "Forest", "Sunshine", "Rose", "Midnight", "White"];
const colorHexes = ["#e8e8ed", "#2997ff", "#34a853", "#fbbc04", "#fed7d2", "#09090b", "#ffffff"];

const sizeLabels = ["1M", "2M", "3M", "5M", "8M"];
const sizeContexts = ["Phone to laptop", "Couch to charger", "Across a desk", "Room to room", "Office or studio"];

const speedLabels = ["40 Gbps", "80 Gbps"];
const speedContexts = ["8K video, fast transfers", "Pro workflows, dual 8K"];

export function ProductHero() {
  const { selection } = useProductSelection();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build dynamic image list based on current selections
  const images = useMemo(() => {
    const hasColor = selection.color !== null;
    const hasSize = selection.size !== null;
    const hasSpeed = selection.speed !== null;

    if (!hasColor) return defaultImages;

    const colorName = colorNames[selection.color!];
    const list: string[] = [colorImages[colorName] ?? defaultImages[0]];
    list.push(connectorImage);
    if (hasSize) list.push(lengthContextImage);
    if (hasSpeed) list.push(speedContextImage);

    // Pad to at least 3 if needed
    if (list.length < 3) list.push(defaultImages[2]);
    return list;
  }, [selection.color, selection.size, selection.speed]);

  // Reset index when images change
  const safeIndex = currentIndex >= images.length ? 0 : currentIndex;

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const hasColor = selection.color !== null;
  const selectedColorHex = hasColor ? colorHexes[selection.color!] : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Main Image */}
      <div
        className="relative overflow-hidden rounded-[28px] aspect-[4/3] group"
        style={{ backgroundColor: "#ffffff" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${safeIndex}-${selection.color}-${selection.size}-${selection.speed}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 p-6"
          >
            <ImageWithFallback
              src={images[safeIndex]}
              alt="USB-C Cable product view"
              className="w-full h-full object-cover rounded-[18px]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gentle color accent — bottom edge glow when color is selected */}
        <AnimatePresence>
          {selectedColorHex && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{
                background: `linear-gradient(to top, ${selectedColorHex}18, transparent)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Selection badges — top left */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <AnimatePresence>
            {hasColor && (
              <motion.div
                key={`color-${selection.color}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="w-3 h-3 rounded-full ring-1 ring-black/8"
                  style={{ backgroundColor: selectedColorHex! }}
                />
                <span style={{ fontSize: 11.5, fontWeight: 500, color: "#1d1d1f" }}>
                  {colorNames[selection.color!]}
                </span>
              </motion.div>
            )}
            {selection.size !== null && (
              <motion.div
                key={`size-${selection.size}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1d1d1f" }}>
                  {sizeLabels[selection.size]}
                </span>
                <span style={{ fontSize: 10.5, color: "#86868b" }}>
                  {sizeContexts[selection.size]}
                </span>
              </motion.div>
            )}
            {selection.speed !== null && (
              <motion.div
                key={`speed-${selection.speed}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1d1d1f" }}>
                  {speedLabels[selection.speed]}
                </span>
                <span style={{ fontSize: 10.5, color: "#86868b" }}>
                  {speedContexts[selection.speed]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        <motion.button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-[#1d1d1f]" />
        </motion.button>
        <motion.button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={18} className="text-[#1d1d1f]" />
        </motion.button>

        {/* Image counter dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                i === safeIndex ? "bg-[#1d1d1f] w-6" : "bg-[#1d1d1f]/20 w-1.5"
              }`}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3">
        {images.map((img, i) => (
          <motion.button
            key={`${i}-${img.slice(-20)}`}
            onClick={() => setCurrentIndex(i)}
            className={`relative flex-1 aspect-square rounded-[16px] overflow-hidden cursor-pointer transition-all duration-300 p-2 ${
              i === safeIndex
                ? "ring-2 ring-[#0071e3] ring-offset-2"
                : "opacity-60 hover:opacity-90"
            }`}
            style={{ backgroundColor: "#ffffff" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ImageWithFallback
              src={img}
              alt={`Product thumbnail ${i + 1}`}
              className="w-full h-full object-cover rounded-[10px]"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}