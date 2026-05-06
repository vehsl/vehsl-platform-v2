"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, ShieldCheck, Zap, Wifi, Minus, Plus, AlertTriangle } from "lucide-react";
import { useBounce } from "./bounce-context";
import { Bouncy } from "./bouncy";
import { DeliverySection } from "./delivery-section";
import { LocationSection } from "./location-section";
import { QuantityTiers, tiers, getTierForQuantity, type Tier } from "./quantity-tiers";
import { useProductSelection } from "./product-selection-context";
import { ReviewsPopover } from "./reviews-popover";
import { useCart, getImageForColor } from "./cart-context";
import { useRouter } from "next/navigation";

/* ───── Data ────────────────────────────────────────── */

const colors = [
  { name: "Silver", hex: "#e8e8ed", context: "Minimal, blends in" },
  { name: "Space Blue", hex: "#2997ff", context: "Easy to spot" },
  { name: "Forest", hex: "#34a853", context: "Earthy, calm" },
  { name: "Sunshine", hex: "#fbbc04", context: "Bright, playful" },
  { name: "Rose", hex: "#fed7d2", context: "Soft, warm" },
  { name: "Midnight", hex: "#09090b", context: "Sleek, professional" },
  { name: "White", hex: "#ffffff", context: "Clean, classic" },
];

const sizes = [
  { label: "1M", value: "1m", context: "Phone to laptop" },
  { label: "2M", value: "2m", context: "Couch to charger" },
  { label: "3M", value: "3m", context: "Across a desk" },
  { label: "5M", value: "5m", context: "Room to room" },
  { label: "8M", value: "8m", context: "Office or studio" },
];

const speeds = [
  { label: "40 Gbps", value: "40", context: "8K video, fast file transfers" },
  { label: "80 Gbps", value: "80", context: "Pro workflows, dual 8K displays" },
];

export { colors, sizes, speeds };

/* ───── Helpers ─────────────────────────────────────── */

function ContextHint({ text }: { text: string | null }) {
  return (
    <div style={{ minHeight: 20 }}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 12.5,
              fontWeight: 500,
              color: "#aeaeb2",
              letterSpacing: "0.01em",
            }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Apple-style section gating.
 * Disabled sections are readable but clearly dormant:
 * muted opacity, no blur, pointer-events disabled.
 */
function SectionGate({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{ opacity: enabled ? 1 : 0.38 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{
        pointerEvents: enabled ? "auto" : "none",
        userSelect: enabled ? "auto" : "none",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ───── Main component ──────────────────────────────── */

export function ProductConfig() {
  const { selection, setColor, setSize, setSpeed, selectedTier, setSelectedTier, manualQty, setManualQty, selectedDelivery, midOrderSamples, setMidOrderSamples } = useProductSelection();
  const selectedColor = selection.color;
  const selectedSize = selection.size;
  const selectedSpeed = selection.speed;

  const inputRef = useRef<HTMLInputElement>(null);
  const { cartCount, setCartCount, triggerBounce } = useBounce();
  const { addItem, openCart, setCheckoutItemIds } = useCart();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  // Progressive unlock
  const lengthUnlocked = selectedColor !== null;
  const speedUnlocked = selectedSize !== null;
  const quantityUnlocked = selectedSpeed !== null;
  const deliveryUnlocked = selectedTier !== null || cartCount > 1;
  const locationUnlocked = selectedTier !== null || cartCount > 1;
  const allReady =
    selectedColor !== null &&
    selectedSize !== null &&
    selectedSpeed !== null &&
    (selectedTier !== null || cartCount > 1);

  const handleSelectTier = (tier: Tier) => {
    setSelectedTier(tier);
    setCartCount(tier.units);
    setManualQty(String(tier.units));
    triggerBounce("price");
  };

  const applyManualQty = (qty: number) => {
    const clamped = Math.max(1, qty);
    setManualQty(String(clamped));
    setCartCount(clamped);
    const matchedTier = getTierForQuantity(clamped);
    setSelectedTier(matchedTier);
    triggerBounce("price");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setManualQty(raw);
    if (raw.length > 0) {
      const qty = parseInt(raw, 10);
      if (!isNaN(qty) && qty > 0) {
        setCartCount(qty);
        const matchedTier = getTierForQuantity(qty);
        setSelectedTier(matchedTier);
        triggerBounce("price");
      }
    }
  };

  const handleInputBlur = () => {
    if (!manualQty || parseInt(manualQty, 10) < 1) {
      setManualQty("1");
      applyManualQty(1);
    }
  };

  const currentTier = selectedTier ?? tiers[0];
  const deliverySurcharge = selectedDelivery?.extraCostPerUnit ?? 0;
  const locationSurcharge = useProductSelection().selectedLocation?.locationSurcharge ?? 0;
  const selectedLocation = useProductSelection().selectedLocation;
  const isLargeOrder = cartCount > 480; // more than 2 pallets (240 units each)
  const showSpaceWarning = isLargeOrder && selectedLocation?.type === "address";
  const currentPrice = currentTier.price + deliverySurcharge + locationSurcharge;
  const totalPrice = currentPrice * cartCount;

  // Mid-order sample eligibility: container tiers or total > $10,000
  const SAMPLE_COST = 18.50; // per sample: QC inspection + express shipping
  const isContainerTier = selectedTier?.id === "container20" || selectedTier?.id === "container40";
  const showMidOrderSamples = isContainerTier || isLargeOrder;
  const sampleTotal = midOrderSamples * SAMPLE_COST;
  const suggestedSamples = cartCount >= 2880 ? 3 : 2;

  const highestPrice = tiers[0].price;
  const lowestPrice = tiers[tiers.length - 1].price;
  const priceProgress =
    highestPrice === lowestPrice
      ? 1
      : (highestPrice - currentPrice) / (highestPrice - lowestPrice);

  return (
    <div className="flex flex-col gap-8">
      {/* Product Title & Rating */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[#86868b] mb-1" style={{ fontSize: 14 }}>
              Anker Innovations
            </p>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "#1d1d1f",
              }}
            >
              USB-C to USB-C Cable
            </h1>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1.5">
              <Star size={16} fill="#0071e3" stroke="#0071e3" />
              <span style={{ fontSize: 16, fontWeight: 600, color: "#0071e3" }}>4.63</span>
            </div>
            <ReviewsPopover />
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {[
            { icon: <Zap size={13} />, label: "240W" },
            { icon: <Wifi size={13} />, label: "40-80 Gbps" },
            { icon: <ShieldCheck size={13} />, label: "USB 4.0" },
          ].map((spec) => (
            <div
              key={spec.label}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[#86868b]"
              style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "0.01em" }}
            >
              <span className="text-[#c7c7cc]">{spec.icon}</span>
              {spec.label}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#e8e8ed]" />

      {/* ── Color ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>
            Color.{" "}
            <span style={{ fontWeight: 400, color: "#6e6e73" }}>
              {selectedColor !== null
                ? colors[selectedColor].name
                : "Which color do you want?"}
            </span>
          </label>
        </div>
        <div className="flex gap-2.5">
          {colors.map((color, i) => (
            <motion.button
              key={color.name}
              onClick={() => {
                setColor(i);
                triggerBounce("color");
              }}
              className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-200 ${
                i === selectedColor
                  ? "ring-2 ring-[#0071e3] ring-offset-2"
                  : "ring-1 ring-black/8"
              }`}
              style={{ backgroundColor: color.hex }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
        <ContextHint text={selectedColor !== null ? colors[selectedColor].context : null} />
      </div>

      {/* ── Length ─────────────────────────────────────── */}
      <SectionGate enabled={lengthUnlocked}>
        <div className="flex flex-col gap-3">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>
            Length.{" "}
            <span style={{ fontWeight: 400, color: "#6e6e73" }}>
              {selectedSize !== null
                ? sizes[selectedSize].label
                : "How long do you need?"}
            </span>
          </label>
          <div className="flex gap-2">
            {sizes.map((size, i) => (
              <motion.button
                key={size.value}
                onClick={() => {
                  setSize(i);
                  triggerBounce("size");
                }}
                className={`px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 ${
                  i === selectedSize
                    ? "bg-[#1d1d1f] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                }`}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  border: i === selectedSize ? "none" : "1px solid transparent",
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {size.label}
              </motion.button>
            ))}
          </div>
          <ContextHint text={selectedSize !== null ? sizes[selectedSize].context : null} />
        </div>
      </SectionGate>

      {/* ── Speed ─────────────────────────────────────── */}
      <SectionGate enabled={speedUnlocked}>
        <div className="flex flex-col gap-3">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>
            Data Speed.{" "}
            <span style={{ fontWeight: 400, color: "#6e6e73" }}>
              {selectedSpeed !== null
                ? speeds[selectedSpeed].label
                : "How fast do you need?"}
            </span>
          </label>
          <div className="flex gap-2">
            {speeds.map((speed, i) => (
              <motion.button
                key={speed.value}
                onClick={() => {
                  setSpeed(i);
                  triggerBounce("speed");
                }}
                className={`flex-1 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-left ${
                  i === selectedSpeed
                    ? "bg-[#1d1d1f] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                }`}
                style={{
                  border:
                    i === selectedSpeed ? "2px solid #1d1d1f" : "1px solid #e8e8ed",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, display: "block" }}>
                  {speed.label}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 400,
                    color: i === selectedSpeed ? "rgba(255,255,255,0.7)" : "#86868b",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {speed.context}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </SectionGate>

      <div className="h-px bg-[#e8e8ed]" />

      {/* ── Quantity ──────────────────────────────────── */}
      <SectionGate enabled={quantityUnlocked}>
        <div className="flex flex-col gap-6">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>
            Quantity.{" "}
            <span style={{ fontWeight: 400, color: "#6e6e73" }}>
              How many do you need?
            </span>
          </label>

          <QuantityTiers
            selectedTierId={selectedTier?.id ?? ""}
            onSelectTier={handleSelectTier}
          />

          {/* Manual quantity — sober pill with +/- */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#86868b",
                whiteSpace: "nowrap",
              }}
            >
              or set exact
            </span>

            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{
                backgroundColor: "#f5f5f7",
                border: "1px solid #e8e8ed",
                height: 40,
              }}
            >
              <motion.button
                onClick={() => applyManualQty(cartCount - 1)}
                className="flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#eaeaec] transition-colors"
                style={{ width: 40, height: "100%" }}
                whileTap={{ scale: 0.88 }}
              >
                <Minus size={14} strokeWidth={1.8} />
              </motion.button>

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={manualQty}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="—"
                className="text-center bg-transparent outline-none"
                style={{
                  width: 68,
                  height: "100%",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1d1d1f",
                  fontFamily: "'Urbanist', sans-serif",
                  borderLeft: "1px solid #e8e8ed",
                  borderRight: "1px solid #e8e8ed",
                }}
              />

              <motion.button
                onClick={() => applyManualQty(cartCount + 1)}
                className="flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#eaeaec] transition-colors"
                style={{ width: 40, height: "100%" }}
                whileTap={{ scale: 0.88 }}
              >
                <Plus size={14} strokeWidth={1.8} />
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {manualQty && cartCount > 0 && (
                <motion.span
                  key={currentTier.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 12, fontWeight: 500, color: "#aeaeb2" }}
                >
                  {currentTier.id === "container40"
                    ? "Best price tier"
                    : `Next tier at ${
                        tiers[
                          tiers.findIndex((t) => t.id === currentTier.id) + 1
                        ]?.minUnits.toLocaleString() ?? "—"
                      } pcs`}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionGate>

      <div className="h-px bg-[#e8e8ed]" />

      {/* ── Delivery Location ──────────────────────────── */}
      <SectionGate enabled={locationUnlocked}>
        <LocationSection />
        <AnimatePresence>
          {showSpaceWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div
                className="flex items-start gap-3 mt-3"
                style={{
                  padding: "14px 18px",
                  borderRadius: 18,
                  backgroundColor: "rgba(255, 149, 0, 0.06)",
                  border: "1.2px solid rgba(255, 149, 0, 0.18)",
                }}
              >
                <AlertTriangle
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: "#ff9500" }}
                />
                <div className="flex flex-col gap-1">
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#8a5a00",
                    }}
                  >
                    This order requires significantly large space
                  </span>
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#a0783a",
                      lineHeight: 1.5,
                    }}
                  >
                    Make sure you have ample space at your address for a{" "}
                    {selectedTier?.label?.toLowerCase() || "large shipment"}. Alternatively, you
                    can use <strong style={{ fontWeight: 700, color: "#8a5a00" }}>Vehsl's storage</strong> for
                    a stress-free experience.
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionGate>

      <div className="h-px bg-[#e8e8ed]" />

      {/* ── Delivery ─────────────────────────────────── */}
      <SectionGate enabled={deliveryUnlocked}>
        <DeliverySection />
      </SectionGate>

      {/* ── Mid-Order Samples (big orders only) ──────── */}
      <AnimatePresence>
        {showMidOrderSamples && deliveryUnlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="h-px bg-[#e8e8ed] mb-8" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#2c2c2e",
                    letterSpacing: "-0.4px",
                  }}
                >
                  Mid-Order Samples
                </h3>
                {midOrderSamples !== suggestedSamples && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setMidOrderSamples(suggestedSamples)}
                    className="cursor-pointer"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0071e3",
                      background: "none",
                      border: "none",
                      padding: "4px 0",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Suggested: {suggestedSamples}
                  </motion.button>
                )}
              </div>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#c7c7cc",
                  lineHeight: 1.5,
                  marginTop: -4,
                }}
              >
                Samples are collected during production and shipped to you for verification.
              </p>

              <motion.div
                className="flex items-center justify-between"
                style={{
                  padding: "16px 20px",
                  borderRadius: 22,
                  backgroundColor: midOrderSamples === 0 ? "#fef8f6" : "#f9f8f5",
                  border: midOrderSamples === 0 ? "1.6px solid #f0ddd8" : "1.6px solid #eff1f2",
                  transition: "background-color 0.3s, border-color 0.3s",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      style={{
                        fontFamily: "'Urbanist', sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: midOrderSamples === 0 ? "#c0695a" : "#202425",
                      }}
                    >
                      {midOrderSamples === 0
                        ? "No samples"
                        : `${midOrderSamples} sample${midOrderSamples !== 1 ? "s" : ""}`}
                    </span>
                    {midOrderSamples > 0 && (
                      <span
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#8e8e93",
                        }}
                      >
                        · ${SAMPLE_COST.toFixed(2)} each
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#aeaeb2",
                    }}
                  >
                    {midOrderSamples === 0
                      ? "No quality check before delivery"
                      : "QC inspection + express shipping"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {midOrderSamples > 0 && (
                    <motion.span
                      key={sampleTotal}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontFamily: "'Urbanist', sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#c0695a",
                      }}
                    >
                      +${sampleTotal.toFixed(2)}
                    </motion.span>
                  )}

                  <div
                    className="flex items-center rounded-[14px] overflow-hidden"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #e8e8ed",
                      height: 36,
                    }}
                  >
                    <motion.button
                      onClick={() => setMidOrderSamples(Math.max(0, midOrderSamples - 1))}
                      className="flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-[color]"
                      style={{ width: 36, height: "100%" }}
                      whileTap={{ scale: 0.88 }}
                    >
                      <Minus size={13} strokeWidth={1.8} />
                    </motion.button>
                    <span
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: "100%",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1d1d1f",
                        fontFamily: "'Urbanist', sans-serif",
                        borderLeft: "1px solid #e8e8ed",
                        borderRight: "1px solid #e8e8ed",
                      }}
                    >
                      {midOrderSamples}
                    </span>
                    <motion.button
                      onClick={() => setMidOrderSamples(Math.min(10, midOrderSamples + 1))}
                      className="flex items-center justify-center cursor-pointer text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-[color]"
                      style={{ width: 36, height: "100%" }}
                      whileTap={{ scale: 0.88 }}
                    >
                      <Plus size={13} strokeWidth={1.8} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Risk disclaimer when 0 samples */}
              <AnimatePresence>
                {midOrderSamples === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex flex-col gap-1.5"
                      style={{
                        padding: "14px 18px",
                        borderRadius: 18,
                        backgroundColor: "#fef5f2",
                        border: "1.5px solid #f5ddd6",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#b85c4a",
                        }}
                      >
                        Proceeding without samples
                      </span>
                      <span
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#c08272",
                          lineHeight: 1.55,
                        }}
                      >
                        Without mid-order samples, the final order may not match your expectations in quality or finish. Vehsl will not be responsible for discrepancies if no samples were requested.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-[#e8e8ed]" />

      {/* ── CTA ─────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Bouncy target="continue" className="flex-1">
          <motion.button
            className={`w-full py-4 rounded-full transition-all duration-300 ${
              allReady
                ? "bg-[#0071e3] text-white cursor-pointer hover:bg-[#0077ed]"
                : "bg-[#f5f5f7] text-[#c7c7cc] cursor-default"
            }`}
            style={{ fontSize: 16, fontWeight: 600 }}
            whileTap={allReady ? { scale: 0.97 } : {}}
            onClick={() => {
              if (allReady) {
                triggerBounce("continue");
                // Add configured item to cart
                const color = colors[selectedColor!];
                const size = sizes[selectedSize!];
                const speed = speeds[selectedSpeed!];
                const newId = addItem({
                  productName: "USB-C to USB-C Cable",
                  colorIndex: selectedColor!,
                  colorName: color.name,
                  colorHex: color.hex,
                  sizeLabel: size.label,
                  speedLabel: speed.label,
                  quantity: cartCount,
                  pricePerUnit: currentPrice,
                  deliveryMethod: selectedDelivery?.label ?? null,
                  deliverySurcharge: deliverySurcharge,
                  imageUrl: getImageForColor(color.name),
                });
                // Set this item for checkout and navigate
                setCheckoutItemIds([newId]);
                setTimeout(() => {
                  navigate("/checkout");
                }, 300);
              }
            }}
          >
            {allReady
              ? `Continue  ·  $${(totalPrice + (showMidOrderSamples ? sampleTotal : 0)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "Configure your cable above"}
          </motion.button>
        </Bouncy>
      </div>

      <motion.p
        className="text-center text-[#86868b]"
        style={{ fontSize: 12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Free sample available  ·  Ships in 2-3 days
      </motion.p>
    </div>
  );
}