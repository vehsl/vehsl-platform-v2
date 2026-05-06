"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { useBounce } from "./bounce-context";
import { NavBar } from "./nav-bar";
import { ProductHero } from "./product-hero";
import { ProductConfig, colors, sizes, speeds } from "./product-config";
import { ProductTabs } from "./product-tabs";
import { OverviewTab } from "./overview-tab";
import { SpecsTab } from "./specs-tab";
import { CompareTab } from "./compare-tab";
import { DocumentsTab } from "./documents-tab";
import { useProductSelection } from "./product-selection-context";
import { PriceGauge } from "./price-gauge";
import { Bouncy } from "./bouncy";
import { tiers } from "./quantity-tiers";
import { SharePopup } from "./share-popup";

const tabs = [
  { id: "overview", label: "Overview", content: <OverviewTab /> },
  { id: "specs", label: "Specifications", content: <SpecsTab /> },
  { id: "documents", label: "Documents", content: <DocumentsTab /> },
  { id: "compare", label: "Compare", content: <CompareTab /> },
];

export function ProductPage() {
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { selection, selectedTier, selectedDelivery, selectedLocation } = useProductSelection();
  const { cartCount } = useBounce();

  const quantityActive =
    selection.color !== null && selection.size !== null && selection.speed !== null;

  const currentTier = selectedTier ?? tiers[0];
  const deliverySurcharge = selectedDelivery?.extraCostPerUnit ?? 0;
  const locationSurcharge = selectedLocation?.locationSurcharge ?? 0;
  const currentPrice = currentTier.price + deliverySurcharge + locationSurcharge;
  const highestPrice = tiers[0].price + 3.85 + 1.0;
  const lowestPrice = tiers[tiers.length - 1].price;
  const priceProgress =
    highestPrice === lowestPrice ? 1 : (highestPrice - currentPrice) / (highestPrice - lowestPrice);

  const handleFavorite = () => setIsFavorited((f) => !f);
  const handleShare = () => {
    if (!shareOpen) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 4000);
    }
    setShareOpen((o) => !o);
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Urbanist', system-ui, -apple-system, sans-serif" }}
    >
      <NavBar />

      <main className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 py-5 text-[#86868b]"
          style={{ fontSize: 13 }}
        >
          <span className="hover:text-[#1d1d1f] cursor-pointer transition-colors">Electronics</span>
          <span>/</span>
          <span className="hover:text-[#1d1d1f] cursor-pointer transition-colors">Cables</span>
          <span>/</span>
          <span className="text-[#1d1d1f]">USB-C to USB-C</span>
        </motion.div>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 pb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="lg:sticky lg:top-24">
              <AnimatePresence>
                {(selection.color !== null || selection.size !== null || selection.speed !== null) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {selection.color !== null && (
                        <motion.div
                          key={`color-${selection.color}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                          style={{ backgroundColor: "#f9f8f5", border: "1px solid #eee9e2" }}
                        >
                          <div
                            className="rounded-full shrink-0"
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: colors[selection.color].hex,
                              border:
                                colors[selection.color].hex === "#ffffff"
                                  ? "1.5px solid #d4d4d4"
                                  : "1.5px solid transparent",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6e6e73",
                              fontFamily: "'Urbanist', sans-serif",
                            }}
                          >
                            {colors[selection.color].name}
                          </span>
                        </motion.div>
                      )}
                      {selection.size !== null && (
                        <motion.div
                          key={`size-${selection.size}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                          style={{ backgroundColor: "#f9f8f5", border: "1px solid #eee9e2" }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6e6e73",
                              fontFamily: "'Urbanist', sans-serif",
                            }}
                          >
                            {sizes[selection.size].label} cable
                          </span>
                        </motion.div>
                      )}
                      {selection.speed !== null && (
                        <motion.div
                          key={`speed-${selection.speed}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                          style={{ backgroundColor: "#f9f8f5", border: "1px solid #eee9e2" }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6e6e73",
                              fontFamily: "'Urbanist', sans-serif",
                            }}
                          >
                            {speeds[selection.speed].label}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <AnimatePresence mode="wait">
                  {quantityActive ? (
                    <motion.div
                      key="price-gauge"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                      className="relative overflow-hidden rounded-[28px] aspect-[4/3] flex items-center justify-center"
                      style={{ background: "linear-gradient(145deg, #fef9f4, #f5f0eb, #fdf6f0)" }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 50%, rgba(86,215,234,0.08) 0%, transparent 65%)",
                        }}
                      />
                      <div className="flex flex-col items-center gap-4">
                        <Bouncy target="price">
                          <PriceGauge price={currentPrice} totalUnits={cartCount} progress={priceProgress} />
                        </Bouncy>
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          style={{ fontSize: 13, fontWeight: 500, color: "#86868b", textAlign: "center" }}
                        >
                          {locationSurcharge > 0 && deliverySurcharge > 0
                            ? `${selectedTier ? selectedTier.label : "Base"} + $${deliverySurcharge.toFixed(2)} delivery + $${locationSurcharge.toFixed(2)} inland`
                            : locationSurcharge > 0
                              ? `${selectedTier ? selectedTier.label : "Base"} + $${locationSurcharge.toFixed(2)} inland transport`
                              : deliverySurcharge > 0
                                ? `${selectedTier ? selectedTier.label : "Base"} + $${deliverySurcharge.toFixed(2)} delivery`
                                : selectedTier
                                  ? `${selectedTier.label} pricing`
                                  : "Select quantity to see pricing"}
                        </motion.p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="product-hero"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <ProductHero />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center justify-end gap-2 mt-4"
              >
                <motion.button
                  onClick={handleFavorite}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isFavorited ? "#ff2d5514" : "#f5f5f7",
                    border: isFavorited ? "1px solid #ff2d5525" : "1px solid transparent",
                  }}
                >
                  <motion.div
                    animate={isFavorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Heart
                      size={16}
                      fill={isFavorited ? "#ff2d55" : "none"}
                      stroke={isFavorited ? "#ff2d55" : "#86868b"}
                      strokeWidth={1.8}
                    />
                  </motion.div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isFavorited ? "#ff2d55" : "#6e6e73",
                    }}
                  >
                    {isFavorited ? "Saved" : "Save"}
                  </span>
                </motion.button>

                <motion.button
                  onClick={handleShare}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#eeeef0] transition-colors cursor-pointer"
                >
                  <Share2 size={15} className="text-[#86868b]" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6e6e73" }}>Share</span>
                </motion.button>

                <SharePopup open={shareOpen} onClose={() => setShareOpen(false)} linkCopied={linkCopied} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
            className="lg:pt-2"
          >
            <ProductConfig />
          </motion.div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e8e8ed] to-transparent" />

        <section className="py-16">
          <ProductTabs tabs={tabs} />
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e8e8ed] to-transparent" />

        <footer className="py-10 border-t border-black/5">
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 text-[#86868b]"
            style={{ fontSize: 13 }}
          >
            <span>Vehsl  ·  Making sourcing simple</span>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#1d1d1f] cursor-pointer transition-colors">Help</span>
              <span className="hover:text-[#1d1d1f] cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-[#1d1d1f] cursor-pointer transition-colors">Privacy</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
