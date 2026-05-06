"use client";

import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Undo2, Package, Sparkles, Check } from "lucide-react";
import { useCart, type CartItem } from "./cart-context";
import { useBounce } from "./bounce-context";
import { Bouncy } from "./bouncy";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useRouter } from "next/navigation";

/* ───── Helpers ────────────────────────────────────────── */

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ───── Animated Number ────────────────────────────────── */

function AnimatedPrice({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    const duration = 400;
    const startTime = Date.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (end - start) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  return (
    <span>
      {prefix}
      {formatCurrency(displayValue)}
    </span>
  );
}

/* ───── Selection Indicator ────────────────────────────── */

function SelectionCircle({ selected }: { selected: boolean }) {
  return (
    <motion.div
      className="shrink-0 flex items-center justify-center rounded-full cursor-pointer"
      style={{
        width: 24,
        height: 24,
        backgroundColor: selected ? "#0071e3" : "rgba(0,113,227,0)",
        border: selected ? "2px solid #0071e3" : "2px solid #d1d1d6",
        transition: "background-color 0.25s, border-color 0.25s",
      }}
      whileTap={{ scale: 0.85 }}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check size={13} strokeWidth={3} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ───── Undo Toast ─────────────────────────────────────── */

function UndoToast({
  item,
  onUndo,
  onDismiss,
}: {
  item: CartItem;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute bottom-28 left-6 right-6 z-10"
    >
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
        style={{
          backgroundColor: "rgba(29, 29, 31, 0.92)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg overflow-hidden shrink-0"
          style={{ backgroundColor: item.colorHex + "20" }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{ backgroundColor: item.colorHex, opacity: 0.6 }}
          />
        </div>
        <span
          className="flex-1 truncate"
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {item.colorName} {item.sizeLabel} removed
        </span>
        <motion.button
          onClick={onUndo}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        >
          <Undo2 size={12} className="text-white/80" />
          <span
            style={{
              fontFamily: "'Urbanist', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "white",
            }}
          >
            Undo
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ───── Cart Item Card ─────────────────────────────────── */

const CartItemCard = forwardRef<
  HTMLDivElement,
  {
    item: CartItem;
    index: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onRemove: (id: string) => void;
  }
>(function CartItemCard({ item, index, isSelected, onToggleSelect, onRemove }, ref) {
  const [isHovered, setIsHovered] = useState(false);
  const lineTotal = (item.pricePerUnit + item.deliverySurcharge) * item.quantity;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        boxShadow: isSelected
          ? "0 4px 24px rgba(0,113,227,0.12)"
          : "0 2px 12px rgba(0,0,0,0.04)",
      }}
      exit={{
        opacity: 0,
        y: -30,
        scale: 0.92,
        filter: "blur(4px)",
        transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
      }}
      transition={{
        layout: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
        delay: index * 0.04,
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onToggleSelect(item.id)}
      className="relative overflow-hidden cursor-pointer"
      style={{
        borderRadius: 24,
        backgroundColor: isSelected ? "rgba(0,113,227,0.04)" : "#ffffff",
        border: isSelected
          ? "1.5px solid rgba(0,113,227,0.25)"
          : "1.5px solid rgba(0,0,0,0.04)",
        transition: "background-color 0.25s, border-color 0.25s",
      }}
    >
      {/* Subtle color accent stripe */}
      <motion.div
        className="absolute top-0 left-0 w-1 h-full rounded-l-full"
        animate={{
          opacity: isSelected ? 0.7 : 0.3,
          width: isSelected ? 3 : 2,
        }}
        transition={{ duration: 0.25 }}
        style={{
          backgroundColor: isSelected ? "#0071e3" : item.colorHex,
        }}
      />

      <div className="p-4 pl-5">
        <div className="flex gap-3.5 items-start">
          {/* Selection circle */}
          <div className="pt-5">
            <SelectionCircle selected={isSelected} />
          </div>

          {/* Product Image */}
          <motion.div
            className="shrink-0 rounded-[16px] overflow-hidden"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "#fafaf8",
            }}
            animate={{ scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.25 }}
          >
            <ImageWithFallback
              src={item.imageUrl}
              alt={`${item.colorName} cable`}
              className="w-full h-full object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Top row: name + remove */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4
                  className="truncate"
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1d1d1f",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {item.productName}
                </h4>
                <p
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#aeaeb2",
                    marginTop: 1,
                  }}
                >
                  Added {timeAgo(item.addedAt)}
                </p>
              </div>

              {/* Remove button — appears on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#ff3b3015] transition-colors"
                    whileTap={{ scale: 0.85 }}
                  >
                    <Trash2
                      size={13}
                      className="text-[#c7c7cc] hover:text-[#ff3b30]"
                      style={{ transition: "color 0.2s" }}
                    />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Config chips */}
            <div className="flex flex-wrap items-center gap-1">
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f5f5f7" }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: item.colorHex,
                    border:
                      item.colorHex === "#ffffff" ? "1px solid #d4d4d4" : "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#6e6e73",
                  }}
                >
                  {item.colorName}
                </span>
              </div>
              <div
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f5f5f7" }}
              >
                <span
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#6e6e73",
                  }}
                >
                  {item.sizeLabel}
                </span>
              </div>
              <div
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f5f5f7" }}
              >
                <span
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#6e6e73",
                  }}
                >
                  {item.speedLabel}
                </span>
              </div>
            </div>

            {/* Bottom row: quantity · delivery · price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#1d1d1f",
                  }}
                >
                  {item.quantity.toLocaleString()} pcs
                </span>
                {item.deliveryMethod && (
                  <>
                    <span style={{ fontSize: 9, color: "#d1d1d6" }}>·</span>
                    <span
                      style={{
                        fontFamily: "'Urbanist', sans-serif",
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: "#86868b",
                      }}
                    >
                      {item.deliveryMethod}
                    </span>
                  </>
                )}
              </div>

              <motion.span
                key={lineTotal}
                initial={{ opacity: 0.5, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1d1d1f",
                  letterSpacing: "-0.02em",
                }}
              >
                ${formatCurrency(lineTotal)}
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ───── Empty State ────────────────────────────────────── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="w-20 h-20 rounded-[28px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #f5f5f7, #eff0f2)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <Package size={28} className="text-[#c7c7cc]" />
        </div>
      </motion.div>

      <div className="text-center flex flex-col gap-2">
        <h3
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 19,
            fontWeight: 600,
            color: "#1d1d1f",
            letterSpacing: "-0.02em",
          }}
        >
          Nothing here yet
        </h3>
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13.5,
            fontWeight: 500,
            color: "#aeaeb2",
            lineHeight: 1.6,
            maxWidth: 240,
          }}
        >
          Your perfect setup is waiting. Configure a cable and add it to start
          building your order.
        </p>
      </div>
    </motion.div>
  );
}

/* ───── Main Cart Drawer ───────────────────────────────── */

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, restoreItem, totalPrice, setCheckoutItemIds } =
    useCart();
  const { triggerBounce } = useBounce();
  const [undoItem, setUndoItem] = useState<CartItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  // ─── Selection logic ───────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  // Clean up stale selections when items change
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(items.map((i) => i.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [items]);

  // Computed selected totals
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );
  const selectedTotalPrice = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum + (item.pricePerUnit + item.deliverySurcharge) * item.quantity,
        0
      ),
    [selectedItems]
  );
  const selectedTotalQuantity = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  // ─── Cart actions ──────────────────────────────────
  const handleRemove = useCallback(
    (id: string) => {
      const removed = removeItem(id);
      if (removed) {
        setUndoItem(removed);
        triggerBounce("cart");
      }
    },
    [removeItem, triggerBounce]
  );

  const handleUndo = useCallback(() => {
    if (undoItem) {
      restoreItem(undoItem);
      setUndoItem(null);
      triggerBounce("cart");
    }
  }, [undoItem, restoreItem, triggerBounce]);

  const handleDismissUndo = useCallback(() => {
    setUndoItem(null);
  }, []);

  const handleProceedSelected = useCallback(() => {
    if (!someSelected || isProcessing) return;
    setIsProcessing(true);
    triggerBounce("cart");
    // Set checkout items and navigate after brief animation
    const ids = Array.from(selectedIds);
    setTimeout(() => {
      setCheckoutItemIds(ids);
      closeCart();
      navigate("/checkout");
      setIsProcessing(false);
    }, 600);
  }, [someSelected, isProcessing, triggerBounce, selectedIds, setCheckoutItemIds, closeCart, navigate]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeCart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeCart]);

  const itemCount = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  // The price/quantity shown in the summary: selected if some selected, else all
  const displayPrice = someSelected ? selectedTotalPrice : totalPrice;
  const displayQuantity = someSelected ? selectedTotalQuantity : totalQuantity;
  const displayItems = someSelected ? selectedItems : items;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100]"
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={closeCart}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed top-0 right-0 bottom-0 z-[101] flex flex-col"
            style={{
              width: "min(440px, 92vw)",
              backgroundColor: "rgba(252,250,247,0.92)",
              backdropFilter: "blur(40px) saturate(1.5)",
              WebkitBackdropFilter: "blur(40px) saturate(1.5)",
              borderLeft: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "-20px 0 80px rgba(0,0,0,0.08)",
            }}
          >
            {/* ── Header ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="flex items-center justify-between px-7 pt-7 pb-4"
            >
              <div className="flex items-center gap-3">
                <h2
                  style={{
                    fontFamily: "'Urbanist', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1d1d1f",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Your Cart
                </h2>
                <AnimatePresence mode="wait">
                  {itemCount > 0 && (
                    <motion.div
                      key={itemCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 26,
                        height: 26,
                        backgroundColor: "#1d1d1f",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {itemCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={closeCart}
                whileHover={{
                  scale: 1.08,
                  backgroundColor: "rgba(0,0,0,0.06)",
                }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <X size={18} className="text-[#86868b]" />
              </motion.button>
            </motion.div>

            {/* ── Select All / Deselect bar ───────────── */}
            {items.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between px-7 pb-3"
              >
                <AnimatePresence mode="wait">
                  {someSelected ? (
                    <motion.span
                      key="selected-count"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontFamily: "'Urbanist', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0071e3",
                      }}
                    >
                      {selectedCount} of {itemCount} selected
                    </motion.span>
                  ) : (
                    <motion.span
                      key="tap-hint"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "#aeaeb2",
                      }}
                    >
                      Tap orders to select for checkout
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={allSelected ? deselectAll : selectAll}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer px-3 py-1.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: allSelected
                      ? "rgba(0,113,227,0.08)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: allSelected ? "#0071e3" : "#86868b",
                    }}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </span>
                </motion.button>
              </motion.div>
            )}

            {/* Subtle divider */}
            <div className="mx-7 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent" />

            {/* ── Cart Items ──────────────────────────── */}
            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-4 cart-scroll"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
                  .cart-scroll::-webkit-scrollbar { display: none; }
                `}</style>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleSelect}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Undo Toast ──────────────────────────── */}
            <AnimatePresence>
              {undoItem && (
                <UndoToast
                  item={undoItem}
                  onUndo={handleUndo}
                  onDismiss={handleDismissUndo}
                />
              )}
            </AnimatePresence>

            {/* ── Footer / Summary ─────────────────────── */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="px-6 pb-7 pt-2"
              >
                {/* Summary breakdown */}
                <div
                  className="rounded-[20px] p-4 mb-4"
                  style={{
                    backgroundColor: someSelected
                      ? "rgba(0,113,227,0.03)"
                      : "rgba(255,255,255,0.7)",
                    border: someSelected
                      ? "1px solid rgba(0,113,227,0.1)"
                      : "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                    transition: "background-color 0.3s, border-color 0.3s",
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Section label */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={someSelected ? "selected" : "all"}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 11,
                          fontWeight: 600,
                          color: someSelected ? "#0071e3" : "#aeaeb2",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {someSelected
                          ? `${selectedCount} order${selectedCount !== 1 ? "s" : ""} selected`
                          : "All orders"}
                      </motion.span>
                    </AnimatePresence>

                    {/* Line items */}
                    <AnimatePresence mode="popLayout">
                      {displayItems.map((item) => {
                        const lineTotal =
                          (item.pricePerUnit + item.deliverySurcharge) *
                          item.quantity;
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span
                                className="truncate"
                                style={{
                                  fontFamily: "'Urbanist', sans-serif",
                                  fontSize: 12.5,
                                  fontWeight: 500,
                                  color: "#6e6e73",
                                }}
                              >
                                {item.colorName} {item.sizeLabel}{" "}
                                <span style={{ color: "#aeaeb2" }}>
                                  x{item.quantity.toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <span
                              style={{
                                fontFamily: "'Urbanist', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: "#1d1d1f",
                              }}
                            >
                              ${formatCurrency(lineTotal)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="h-px bg-black/5 my-0.5" />

                    {/* Total */}
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#1d1d1f",
                        }}
                      >
                        {someSelected ? "Selected total" : "Total"}
                        <span
                          style={{
                            fontWeight: 400,
                            color: "#aeaeb2",
                            fontSize: 11.5,
                            marginLeft: 6,
                          }}
                        >
                          {displayQuantity.toLocaleString()} pcs
                        </span>
                      </span>
                      <span
                        style={{
                          fontFamily: "'Urbanist', sans-serif",
                          fontSize: 17,
                          fontWeight: 700,
                          color: someSelected ? "#0071e3" : "#1d1d1f",
                          letterSpacing: "-0.02em",
                          transition: "color 0.3s",
                        }}
                      >
                        <AnimatedPrice value={displayPrice} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Bouncy target="cart" className="w-full">
                  <motion.button
                    onClick={handleProceedSelected}
                    disabled={!someSelected || isProcessing}
                    className="w-full py-4 rounded-2xl relative overflow-hidden"
                    style={{
                      background: isProcessing
                        ? "linear-gradient(135deg, #34c759, #30d158)"
                        : someSelected
                          ? "linear-gradient(135deg, #0071e3, #5856d6)"
                          : "#e8e8ed",
                      boxShadow: isProcessing
                        ? "0 4px 20px rgba(52,199,89,0.3)"
                        : someSelected
                          ? "0 4px 20px rgba(0,113,227,0.25)"
                          : "none",
                      cursor: someSelected ? "pointer" : "default",
                      transition: "background 0.4s, box-shadow 0.4s",
                    }}
                    whileHover={someSelected ? { scale: 1.01 } : {}}
                    whileTap={someSelected ? { scale: 0.97 } : {}}
                  >
                    <div className="flex items-center justify-center gap-2.5">
                      <AnimatePresence mode="wait">
                        {isProcessing ? (
                          <motion.div
                            key="sparkle"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                            }}
                          >
                            <Sparkles size={16} className="text-white" />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={
                            isProcessing
                              ? "processing"
                              : someSelected
                                ? `checkout-${selectedCount}`
                                : "none"
                          }
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: "'Urbanist', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: someSelected ? "white" : "#c7c7cc",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {isProcessing
                            ? `Processing ${selectedCount} order${selectedCount !== 1 ? "s" : ""}...`
                            : someSelected
                              ? selectedCount === itemCount
                                ? `Checkout All ${itemCount}  ·  $${formatCurrency(displayPrice)}`
                                : `Checkout ${selectedCount} order${selectedCount !== 1 ? "s" : ""}  ·  $${formatCurrency(displayPrice)}`
                              : "Select orders to checkout"}
                        </motion.span>
                      </AnimatePresence>
                    </div>

                    {/* Shimmer effect */}
                    {someSelected && !isProcessing && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
                        }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.button>
                </Bouncy>

                {/* Disclaimer */}
                <p
                  className="text-center mt-3"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#c7c7cc",
                    lineHeight: 1.5,
                  }}
                >
                  Pricing may vary based on final inspection. Secure checkout.
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}