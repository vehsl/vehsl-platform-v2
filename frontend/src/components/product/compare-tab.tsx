"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Plus, Star, StarHalf, Trash2, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

/* ───── Product catalog for comparison ────────────────── */

interface Product {
  id: string;
  name: string;
  price: string;
  rating: number;
  reviewCount: number;
  image: string;
  speed: string;
  power: string;
  usb: string;
  thunderbolt: boolean;
  kevlar: boolean;
  emarker: boolean;
  warranty: string;
  weight: string;
  current?: boolean;
}

const currentProduct: Product = {
  id: "vehsl",
  name: "Vehsl USB-C Cable",
  price: "$18.50",
  rating: 4.8,
  reviewCount: 2341,
  image:
    "https://images.unsplash.com/photo-1751846545116-838fe2e7e815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBDJTIwY2FibGUlMjB3aGl0ZSUyMG1pbmltYWx8ZW58MXx8fHwxNzczNTc3OTEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  speed: "80 Gbps",
  power: "240W",
  usb: "USB 4.0",
  thunderbolt: true,
  kevlar: true,
  emarker: true,
  warranty: "3 years",
  weight: "42g",
  current: true,
};

const competitors: Product[] = [
  {
    id: "anker",
    name: "Anker 765 USB-C",
    price: "$15.99",
    rating: 4.5,
    reviewCount: 8720,
    image:
      "https://images.unsplash.com/photo-1756043827134-dcc8ac7462f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVU0IlMjBjYWJsZSUyMGNvbm5lY3RvciUyMGNsb3NlJTIwdXB8ZW58MXx8fHwxNzczNTc3OTExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    speed: "40 Gbps",
    power: "140W",
    usb: "USB 4.0",
    thunderbolt: true,
    kevlar: false,
    emarker: true,
    warranty: "18 months",
    weight: "38g",
  },
  {
    id: "apple",
    name: "Apple TB4 Pro Cable",
    price: "$69.00",
    rating: 4.3,
    reviewCount: 3102,
    image:
      "https://images.unsplash.com/photo-1770238586572-3f3887b0dfd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyZ2luZyUyMGNhYmxlJTIwdGVjaG5vbG9neSUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNTc3OTE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    speed: "40 Gbps",
    power: "100W",
    usb: "USB 4.0",
    thunderbolt: true,
    kevlar: false,
    emarker: true,
    warranty: "1 year",
    weight: "55g",
  },
  {
    id: "belkin",
    name: "Belkin Connect USB-C",
    price: "$24.99",
    rating: 4.1,
    reviewCount: 1456,
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGNhYmxlJTIwbWluaW1hbCUyMHRlY2h8ZW58MXx8fHwxNzczNjA3NjQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    speed: "20 Gbps",
    power: "100W",
    usb: "USB 3.2",
    thunderbolt: false,
    kevlar: false,
    emarker: true,
    warranty: "2 years",
    weight: "35g",
  },
  {
    id: "budget",
    name: "Generic USB-C",
    price: "$4.50",
    rating: 3.2,
    reviewCount: 562,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW5lcmljJTIwY2hhcmdpbmclMjBjYWJsZSUyMGNoZWFwfGVufDF8fHx8MTc3MzYwNzY0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    speed: "480 Mbps",
    power: "30W",
    usb: "USB 2.0",
    thunderbolt: false,
    kevlar: false,
    emarker: false,
    warranty: "90 days",
    weight: "28g",
  },
];

/* ───── Feature definitions ───────────────────────────── */

interface Feature {
  key: keyof Product;
  label: string;
}

const features: Feature[] = [
  { key: "speed", label: "Max Speed" },
  { key: "power", label: "Power Delivery" },
  { key: "usb", label: "USB Standard" },
  { key: "thunderbolt", label: "Thunderbolt" },
  { key: "kevlar", label: "Kevlar Core" },
  { key: "emarker", label: "E-Marker Chip" },
  { key: "warranty", label: "Warranty" },
  { key: "weight", label: "Weight" },
];

/* ───── Star rating component ─────────────────────────── */

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3 && rating - full < 0.8;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill="#fbbc04" stroke="none" />
      ))}
      {half && <StarHalf size={size} fill="#fbbc04" stroke="none" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={size} fill="#e8e8ed" stroke="none" />
      ))}
    </div>
  );
}

/* ───── Boolean cell ──────────────────────────────────── */

function BoolCell({ val, highlight }: { val: boolean; highlight?: boolean }) {
  return val ? (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{ backgroundColor: highlight ? "#34c75918" : "#34c75910" }}
    >
      <Check size={14} className="text-[#34c759]" />
    </div>
  ) : (
    <div className="w-7 h-7 rounded-full bg-[#ff3b30]/6 flex items-center justify-center">
      <X size={14} className="text-[#ff3b30]/40" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */

export function CompareTab() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addProduct = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds((prev) => [...prev, id]);
    }
    setPickerOpen(false);
  };

  const removeProduct = (id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
  };

  const comparedProducts: Product[] = [
    currentProduct,
    ...selectedIds.map((id) => competitors.find((c) => c.id === id)!),
  ];

  const availableToAdd = competitors.filter((c) => !selectedIds.includes(c.id));
  const canAdd = selectedIds.length < 3;

  // Grid columns: always has current + selected + optional add-slot
  const colCount = comparedProducts.length + (canAdd ? 1 : 0);
  const gridCols =
    colCount === 2
      ? "grid-cols-[1fr_1fr]"
      : colCount === 3
        ? "grid-cols-[1fr_1fr_1fr]"
        : "grid-cols-[1fr_1fr_1fr_1fr]";

  return (
    <div className="flex flex-col gap-6">
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#86868b",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Compare with competitors
      </motion.p>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[480px]">
          {/* ── Product headers ───────────────────────── */}
          <div className={`grid ${gridCols} gap-3 mb-6`}>
            {comparedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative flex flex-col items-center text-center p-5 rounded-[20px]"
                style={{
                  backgroundColor: product.current ? "#0071e308" : "#f8f8fa",
                  border: product.current
                    ? "1.5px solid #0071e325"
                    : "1.5px solid transparent",
                }}
              >
                {/* Remove button for non-current */}
                {!product.current && (
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={12} className="text-[#86868b]" />
                  </button>
                )}

                {/* "This product" label */}
                {product.current && (
                  <span
                    className="mb-2 px-2.5 py-0.5 rounded-full"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#0071e3",
                      backgroundColor: "#0071e312",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    This product
                  </span>
                )}

                <div className="w-16 h-16 rounded-[14px] overflow-hidden mb-3 bg-white">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: product.current ? "#0071e3" : "#1d1d1f",
                    lineHeight: 1.3,
                  }}
                >
                  {product.name}
                </p>

                <p className="mt-1" style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f" }}>
                  {product.price}
                </p>

                {/* Rating */}
                <div className="flex flex-col items-center gap-1 mt-2">
                  <Stars rating={product.rating} />
                  <span style={{ fontSize: 11, color: "#86868b" }}>
                    {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
                  </span>
                </div>
              </motion.div>
            ))}

            {/* ── Add product slot ─────────────────────── */}
            {canAdd && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: comparedProducts.length * 0.08, duration: 0.4 }}
                className="relative flex flex-col items-center justify-center p-5 rounded-[20px] border-2 border-dashed border-[#d2d2d7] hover:border-[#86868b] transition-colors cursor-pointer"
                style={{ minHeight: 190 }}
                onClick={() => setPickerOpen(!pickerOpen)}
              >
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-3">
                  <Plus size={20} className="text-[#86868b]" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#86868b" }}>
                  Add product
                </p>
                <p style={{ fontSize: 11, color: "#aeaeb2" }} className="mt-0.5">
                  Compare up to 4
                </p>

                {/* Dropdown picker */}
                <AnimatePresence>
                  {pickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] shadow-lg border border-black/8 z-20 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-2 flex flex-col gap-0.5">
                        {availableToAdd.length === 0 ? (
                          <p
                            className="text-center py-4"
                            style={{ fontSize: 13, color: "#aeaeb2" }}
                          >
                            No more products
                          </p>
                        ) : (
                          availableToAdd.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => addProduct(product.id)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[#f5f5f7] transition-colors cursor-pointer text-left w-full"
                            >
                              <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-[#f8f8fa] shrink-0">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="truncate"
                                  style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}
                                >
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#86868b" }}>
                                    {product.price}
                                  </span>
                                  <Stars rating={product.rating} size={10} />
                                </div>
                              </div>
                              <Plus size={14} className="text-[#0071e3] shrink-0" />
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── Feature comparison rows ────────────────── */}
          {comparedProducts.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col gap-0 rounded-[20px] overflow-hidden"
            >
              {features.map((feature, i) => (
                <div
                  key={feature.key}
                  className={`grid ${gridCols} gap-3 py-3.5 px-1`}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#f8f8fa" : "transparent",
                  }}
                >
                  {comparedProducts.map((product) => {
                    const val = product[feature.key];
                    const isBest = getBestForFeature(feature.key, comparedProducts) === product.id;
                    return (
                      <div key={product.id} className="flex flex-col items-center text-center gap-1">
                        <span style={{ fontSize: 10.5, color: "#aeaeb2", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
                          {feature.label}
                        </span>
                        {typeof val === "boolean" ? (
                          <BoolCell val={val} highlight={product.current} />
                        ) : (
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: isBest ? 700 : 500,
                              color: isBest
                                ? product.current
                                  ? "#0071e3"
                                  : "#34c759"
                                : "#1d1d1f",
                            }}
                          >
                            {val as string}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {/* Empty cell for add slot */}
                  {canAdd && <div />}
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Empty state ───────────────────────────── */}
          {comparedProducts.length === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1d1d1f" }}>
                Add a product to compare
              </p>
              <p className="mt-1 max-w-[300px]" style={{ fontSize: 14, color: "#aeaeb2", lineHeight: 1.5 }}>
                Click "Add product" to see how this cable stacks up against the competition
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Helpers ────────────────────────────────────────── */

function getBestForFeature(key: keyof Product, products: Product[]): string | null {
  if (products.length < 2) return null;

  const numericOrder: Record<string, number> = {
    "480 Mbps": 1,
    "5 Gbps": 2,
    "10 Gbps": 3,
    "20 Gbps": 4,
    "40 Gbps": 5,
    "80 Gbps": 6,
    "30W": 30,
    "60W": 60,
    "100W": 100,
    "140W": 140,
    "240W": 240,
  };

  if (key === "speed" || key === "power") {
    let best: Product | null = null;
    let bestVal = -1;
    for (const p of products) {
      const v = numericOrder[p[key] as string] ?? 0;
      if (v > bestVal) {
        bestVal = v;
        best = p;
      }
    }
    return best?.id ?? null;
  }

  if (key === "price") {
    let best: Product | null = null;
    let bestVal = Infinity;
    for (const p of products) {
      const v = parseFloat(p.price.replace("$", ""));
      if (v < bestVal) {
        bestVal = v;
        best = p;
      }
    }
    return best?.id ?? null;
  }

  return null;
}
