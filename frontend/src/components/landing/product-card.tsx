"use client";

import { motion } from "motion/react";
import { AliveElement } from "./alive-element";
import { Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  name: string;
  price: string;
  rating: number;
  image: string;
  index: number;
  productId?: string;
  stockStatus?: string;
}

export function ProductCard({
  name,
  price,
  rating,
  image,
  index,
  stockStatus,
}: ProductCardProps) {
  const isOutOfStock = stockStatus === "out_of_stock";

  return (
    <AliveElement delay={index} sensitivity={0.6}>
      <motion.div
        whileHover={!isOutOfStock ? { y: -6, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } : {}}
        className={`group relative cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}`}
      >
        {/* Card body */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-[28px] overflow-hidden border border-white/80 shadow-[0_2px_20px_rgba(0,0,0,0.03)] transition-shadow duration-500 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          {/* Out of stock badge */}
          {isOutOfStock && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Out of Stock</span>
            </div>
          )}

          {/* Image area */}
          <div className={`relative aspect-square p-6 flex items-center justify-center bg-gradient-to-b from-[#f8fafe] to-white/40 ${isOutOfStock ? 'grayscale' : ''}`}>
            <ImageWithFallback
              src={image}
              alt={name}
              className="w-[70%] h-[70%] object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Info area */}
          <div className="px-5 pb-5 pt-1">
            <p className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[15px] tracking-[-0.2px] mb-1.5 truncate">
              {name}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-['Urbanist',sans-serif] text-[#1d1d1f] text-[15px] tracking-[-0.3px] opacity-80">
                {price}
              </span>
              <div className="flex items-center gap-1">
                <Star size={12} fill="#FFB800" stroke="#FFB800" />
                <span className="font-['Urbanist',sans-serif] text-[12px] text-[#86868b]">
                  {rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AliveElement>
  );
}
