"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Heart, MessageCircle, Share2, Music2, Plus, X,
  ChevronLeft, ChevronRight, Eye, ShoppingCart, Star,
  Upload, Video, Sparkles, TrendingUp, Bookmark, MoreHorizontal
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const REEL_DATA = [
  {
    id: "r1",
    thumbnail: "https://images.unsplash.com/photo-1720190370264-15c444358c76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "GreenLeaf Organics",
    avatar: "GO",
    title: "How we source our organic herbal teas straight from the hills",
    likes: 21400,
    comments: 1820,
    shares: 4500,
    views: 180000,
    product: "Organic Herbal Tea Blend",
    productPrice: "$24.99",
    sound: "Original Sound — GreenLeaf",
    tags: ["#organictea", "#herbal", "#wellness"],
    verified: true,
    duration: "0:45",
  },
  {
    id: "r2",
    thumbnail: "https://images.unsplash.com/photo-1701518035740-a33935aeb3ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "BrightStar Electronics",
    avatar: "BE",
    title: "LED Panel B200 installation in under 5 minutes — watch!",
    likes: 18200,
    comments: 950,
    shares: 3200,
    views: 142000,
    product: "Smart LED Panel B200",
    productPrice: "$89.99",
    sound: "Trending Beat — Tech Vibes",
    tags: ["#smartlight", "#ledpanel", "#homedecor"],
    verified: true,
    duration: "1:12",
  },
  {
    id: "r3",
    thumbnail: "https://images.unsplash.com/photo-1740819920986-8462590eccdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "Luna Artisan Co.",
    avatar: "LA",
    title: "The making of our handcrafted ceramic vase — from clay to art",
    likes: 42300,
    comments: 3100,
    shares: 8900,
    views: 320000,
    product: "Handmade Ceramic Vase Set",
    productPrice: "$45.00",
    sound: "Original Sound — Luna Artisan",
    tags: ["#handmade", "#ceramic", "#artisan"],
    verified: false,
    duration: "0:58",
  },
  {
    id: "r4",
    thumbnail: "https://images.unsplash.com/photo-1762994576926-b8268190a2c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "FreshPack Foods",
    avatar: "FF",
    title: "Behind the scenes: Making our protein energy bars fresh daily",
    likes: 15800,
    comments: 720,
    shares: 2100,
    views: 98000,
    product: "Protein Energy Bars (24pk)",
    productPrice: "$32.99",
    sound: "Kitchen Vibes — FreshPack",
    tags: ["#proteinbar", "#healthyfood", "#fitness"],
    verified: true,
    duration: "0:35",
  },
  {
    id: "r5",
    thumbnail: "https://images.unsplash.com/photo-1601401032300-da7e3f5b1485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "EcoWare Solutions",
    avatar: "ES",
    title: "Spring lookbook: Styling our eco cotton tote bags 5 ways",
    likes: 36100,
    comments: 2400,
    shares: 6700,
    views: 265000,
    product: "Eco Cotton Tote Bag",
    productPrice: "$18.99",
    sound: "Chill Lo-fi — Eco Beats",
    tags: ["#ecofashion", "#totebag", "#sustainable"],
    verified: false,
    duration: "1:20",
  },
  {
    id: "r6",
    thumbnail: "https://images.unsplash.com/photo-1610442259563-e2c279eaf683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    seller: "Zenith Home",
    avatar: "ZH",
    title: "Transform your living room with these 3 simple decor hacks",
    likes: 28500,
    comments: 1650,
    shares: 5200,
    views: 210000,
    product: "Artisan Soy Wax Candle",
    productPrice: "$22.00",
    sound: "Cozy Home — Zenith",
    tags: ["#homedecor", "#interior", "#cozyhome"],
    verified: true,
    duration: "0:52",
  },
];

const formatNum = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

export function ProductReels() {
  const [selectedReel, setSelectedReel] = useState<typeof REEL_DATA[0] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "popular">("trending");

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedReels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedReels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openReel = (reel: typeof REEL_DATA[0], index: number) => {
    setSelectedReel(reel);
    setCurrentIndex(index);
  };

  const navigateReel = (dir: "prev" | "next") => {
    const newIndex = dir === "prev" ? Math.max(0, currentIndex - 1) : Math.min(REEL_DATA.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    setSelectedReel(REEL_DATA[newIndex]);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Product Reels</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Short product videos from approved sellers — discover, engage, buy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BounceButton variant="primary" size="sm" icon={<Upload size={14} />}>
            Upload Reel
          </BounceButton>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border/40 w-fit">
        {[
          { id: "trending" as const, label: "Trending", icon: <TrendingUp size={13} /> },
          { id: "recent" as const, label: "Recent", icon: <Sparkles size={13} /> },
          { id: "popular" as const, label: "Most Liked", icon: <Heart size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSortBy(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] transition-all cursor-pointer ${
              sortBy === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {REEL_DATA.map((reel, i) => (
          <motion.div
            key={reel.id}
            className="cursor-pointer group"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            onClick={() => openReel(reel, i)}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-muted/30">
              <ImageWithFallback src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Duration badge */}
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md text-[0.625rem]">
                {reel.duration}
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <Play size={20} className="text-white ml-0.5" />
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[0.5rem] text-white">
                    {reel.avatar}
                  </div>
                  <span className="text-[0.6875rem] text-white/90 truncate">{reel.seller}</span>
                  {reel.verified && <span className="text-[0.5rem]">✓</span>}
                </div>
                <p className="text-[0.625rem] text-white/80 line-clamp-2">{reel.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-0.5 text-[0.5625rem] text-white/70">
                    <Play size={8} />{formatNum(reel.views)}
                  </span>
                  <span className="flex items-center gap-0.5 text-[0.5625rem] text-white/70">
                    <Heart size={8} />{formatNum(reel.likes)}
                  </span>
                </div>
              </div>

              {/* Right side action buttons */}
              <div className="absolute right-1.5 bottom-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => toggleLike(reel.id, e)}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/50 transition-all"
                >
                  <Heart size={14} className={likedReels.has(reel.id) ? "text-[#E5484D] fill-[#E5484D]" : "text-white"} />
                </button>
                <button
                  onClick={(e) => toggleSave(reel.id, e)}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/50 transition-all"
                >
                  <Bookmark size={14} className={savedReels.has(reel.id) ? "text-[#FFB224] fill-[#FFB224]" : "text-white"} />
                </button>
              </div>
            </div>

            {/* Product tag below */}
            <div className="mt-2 flex items-center gap-2 px-1">
              <ShoppingCart size={11} className="text-muted-foreground flex-shrink-0" />
              <span className="text-[0.6875rem] text-muted-foreground truncate">{reel.product}</span>
              <span className="text-[0.6875rem] text-primary ml-auto flex-shrink-0">{reel.productPrice}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Full-Screen Reel Viewer ─────────────────────────────── */}
      <AnimatePresence>
        {selectedReel && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedReel(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Nav arrows */}
            <button
              onClick={() => navigateReel("prev")}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer ${
                currentIndex === 0 ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateReel("next")}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer ${
                currentIndex === REEL_DATA.length - 1 ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <ChevronRight size={20} />
            </button>

            {/* Reel content */}
            <div className="flex items-center gap-6 h-full py-8">
              {/* Video */}
              <motion.div
                key={selectedReel.id}
                className="relative w-[340px] h-[604px] rounded-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <ImageWithFallback src={selectedReel.thumbnail} alt={selectedReel.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[0.6875rem] text-white">
                      {selectedReel.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[0.8125rem] text-white">{selectedReel.seller}</span>
                        {selectedReel.verified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#0171E3] flex items-center justify-center text-[0.375rem] text-white">✓</span>
                        )}
                      </div>
                    </div>
                    <button className="ml-auto px-3 py-1 rounded-full border border-white/30 text-[0.75rem] text-white hover:bg-white/10 cursor-pointer">
                      Follow
                    </button>
                  </div>

                  <p className="text-[0.75rem] text-white/90 mb-2">{selectedReel.title}</p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedReel.tags.map(tag => (
                      <span key={tag} className="text-[0.625rem] text-white/70">{tag}</span>
                    ))}
                  </div>

                  {/* Product card */}
                  <div className="flex items-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <ShoppingCart size={14} className="text-white/80" />
                    <span className="text-[0.6875rem] text-white/90 flex-1 truncate">{selectedReel.product}</span>
                    <span className="text-[0.6875rem] text-[#FFB224]">{selectedReel.productPrice}</span>
                  </div>

                  {/* Sound */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Music2 size={10} className="text-white/60" />
                    <span className="text-[0.5625rem] text-white/60 truncate">{selectedReel.sound}</span>
                  </div>
                </div>
              </motion.div>

              {/* Side actions */}
              <div className="flex flex-col items-center gap-5">
                <button
                  onClick={(e) => toggleLike(selectedReel.id, e)}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Heart size={20} className={likedReels.has(selectedReel.id) ? "text-[#E5484D] fill-[#E5484D]" : "text-white"} />
                  </div>
                  <span className="text-[0.625rem] text-white/70">{formatNum(selectedReel.likes)}</span>
                </button>

                <button className="flex flex-col items-center gap-1 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <span className="text-[0.625rem] text-white/70">{formatNum(selectedReel.comments)}</span>
                </button>

                <button
                  onClick={(e) => toggleSave(selectedReel.id, e)}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Bookmark size={20} className={savedReels.has(selectedReel.id) ? "text-[#FFB224] fill-[#FFB224]" : "text-white"} />
                  </div>
                  <span className="text-[0.625rem] text-white/70">Save</span>
                </button>

                <button className="flex flex-col items-center gap-1 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Share2 size={20} className="text-white" />
                  </div>
                  <span className="text-[0.625rem] text-white/70">{formatNum(selectedReel.shares)}</span>
                </button>

                <button className="flex flex-col items-center gap-1 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <MoreHorizontal size={20} className="text-white" />
                  </div>
                </button>
              </div>
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.75rem] text-white/50">
              {currentIndex + 1} / {REEL_DATA.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
