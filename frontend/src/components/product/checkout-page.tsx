"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  Shield,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./cart-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Bouncy } from "./bouncy";

/* ───── Helpers ─────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ───── Payment Method Icons (inline SVGs) ────────────── */

function VisaIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <rect x="1" y="4" width="22" height="16" rx="3" fill="none" stroke="#86868b" strokeWidth="1.2" />
      <text x="12" y="12" fill="#86868b" fontSize="8" fontWeight="700" fontFamily="'Urbanist', sans-serif" textAnchor="middle" dominantBaseline="central">VISA</text>
    </svg>
  );
}

function PaypalIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path
        d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.771.771 0 01.761-.654h6.198c2.043 0 3.496.466 4.319 1.384.793.885 1.027 2.108.696 3.633l-.017.078v.72l.56.316c.463.252.83.547 1.107.886.346.423.568.942.66 1.545.096.62.064 1.356-.094 2.186-.182.957-.478 1.793-.878 2.486a5.11 5.11 0 01-1.395 1.63 5.63 5.63 0 01-1.88.945c-.714.21-1.527.315-2.417.315H12.25a.93.93 0 00-.92.786l-.037.19-.614 3.893-.028.137a.93.93 0 01-.919.786H7.076z"
        fill="#86868b"
        fillOpacity={opacity}
      />
    </svg>
  );
}

function ApplePayIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path
        d="M17.178 10.29c-.026-2.618 2.136-3.877 2.233-3.94-1.215-1.778-3.107-2.022-3.781-2.05-1.61-.163-3.14.948-3.957.948-.816 0-2.08-.924-3.417-.9-1.759.026-3.38 1.024-4.286 2.6-1.826 3.17-.468 7.866 1.313 10.437.87 1.26 1.908 2.672 3.27 2.622 1.313-.053 1.808-.85 3.394-.85 1.586 0 2.032.85 3.418.823 1.413-.023 2.307-1.284 3.17-2.548.999-1.462 1.41-2.876 1.435-2.95-.031-.014-2.752-1.057-2.78-4.192z"
        fill="#86868b"
        fillOpacity={opacity}
      />
      <path
        d="M14.547 2.792c.723-.876 1.213-2.094 1.079-3.309-1.043.042-2.306.694-3.054 1.57-.672.778-1.26 2.02-1.102 3.213 1.164.09 2.353-.59 3.077-1.474z"
        fill="#86868b"
        fillOpacity={opacity}
      />
    </svg>
  );
}

function AlipayIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path
        d="M21.422 14.586c-1.191-.538-2.467-1.09-3.803-1.628.489-.98.878-2.058 1.116-3.203h-3.56V8.474h4.309V7.53h-4.309V5.2h-1.88s-.09.613-.233.613c-.148 0-.672 0-.672 0v1.717H8.244v.944h4.146v1.281H9.022v.944h7.133a14.476 14.476 0 01-.715 1.968c-1.8-.613-3.507-1.058-4.732-.764-1.832.44-2.893 1.726-2.94 3.135-.065 2.015 1.726 3.32 4.132 3.056 1.56-.171 2.963-1.03 4.186-2.543.001 0 2.085 1.149 3.306 1.902L21.422 14.586zM11.628 17.6c-1.94.425-3.272-.51-3.217-1.683.041-.879.654-1.903 2.34-2.11 1.15-.142 2.443.282 3.99.95a6.456 6.456 0 01-3.113 2.843z"
        fill="#86868b"
        fillOpacity={opacity}
      />
    </svg>
  );
}

function GooglePayIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 010-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" fill="#86868b" fillOpacity={opacity} />
    </svg>
  );
}

function BankIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" stroke="#86868b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={opacity} />
    </svg>
  );
}

function WireIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" style={{ opacity }}>
      <path d="M1 8h22M6 1v14M12 3v10M18 1v14" stroke="#86868b" strokeWidth="1.2" strokeLinecap="round" strokeOpacity={opacity} />
    </svg>
  );
}

/* ───── Payment Method Definitions ────────────────────── */

interface PaymentMethod {
  id: string;
  label: string;
  icon: (opacity?: number) => React.ReactNode;
  sampleOnly?: boolean; // only for sample orders
  bulkOnly?: boolean; // only for bulk orders
}

const allPaymentMethods: PaymentMethod[] = [
  { id: "bank", label: "Bank transfer", icon: (o) => <BankIcon opacity={o} />, bulkOnly: true },
  { id: "wire", label: "Wire transfer", icon: (o) => <WireIcon opacity={o} />, bulkOnly: true },
  { id: "card", label: "Credit or debit cards", icon: (o) => <VisaIcon opacity={o} /> },
  { id: "paypal", label: "PayPal", icon: (o) => <PaypalIcon opacity={o} /> },
  { id: "applepay", label: "Apple Pay", icon: (o) => <ApplePayIcon opacity={o} /> },
  { id: "alipay", label: "Alipay", icon: (o) => <AlipayIcon opacity={o} /> },
  { id: "googlepay", label: "Google Pay", icon: (o) => <GooglePayIcon opacity={o} /> },
];

/* ───── Order Review Card ─────────────────────────────── */

function OrderCard({ item }: { item: CartItem }) {
  const lineTotal = (item.pricePerUnit + item.deliverySurcharge) * item.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-5 p-5 rounded-[20px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      }}
    >
      {/* Image */}
      <div
        className="shrink-0 rounded-[16px] overflow-hidden"
        style={{ width: 80, height: 80, backgroundColor: "#fafaf8" }}
      >
        <ImageWithFallback
          src={item.imageUrl}
          alt={`${item.colorName} cable`}
          className="w-full h-full object-contain"
          style={{ mixBlendMode: "multiply" }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4
            style={{
              fontFamily: "'Urbanist', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#1d1d1f",
              letterSpacing: "-0.01em",
            }}
          >
            {item.productName}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f5f5f7" }}>
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: item.colorHex,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  border: item.colorHex === "#ffffff" || item.colorHex === "#e8e8ed" ? "1px solid #d4d4d4" : "none",
                }}
              />
              <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 600, color: "#6e6e73" }}>
                {item.colorName}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f5f5f7" }}>
              <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 600, color: "#6e6e73" }}>
                {item.sizeLabel}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f5f5f7" }}>
              <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, fontWeight: 600, color: "#6e6e73" }}>
                {item.speedLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 13, fontWeight: 500, color: "#86868b" }}>
            {item.quantity.toLocaleString()} pcs
            {item.deliveryMethod && (
              <span style={{ color: "#aeaeb2" }}> · {item.deliveryMethod}</span>
            )}
          </span>
          <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 17, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            ${formatCurrency(lineTotal)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ───── Card Form ─────────────────────────────────────── */

function CardForm({ total, onPay }: { total: number; onPay: () => void }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Urbanist', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: "#1d1d1f",
    backgroundColor: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(134,134,139,0.25)",
    borderRadius: 14,
    padding: "14px 16px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Urbanist', sans-serif",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#6e6e73",
    marginBottom: 6,
    display: "block",
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-4 pt-5 pb-2 px-1">
        {/* Card Number */}
        <div>
          <label style={labelStyle}>Card Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,113,227,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(134,134,139,0.25)";
                e.target.style.boxShadow = "none";
              }}
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c7c7cc]" />
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Cardholder Name</label>
          <input
            type="text"
            placeholder="Full name on card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(0,113,227,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(134,134,139,0.25)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Expiry + CVV row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,113,227,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(134,134,139,0.25)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>CVV</label>
            <div className="relative">
              <input
                type="password"
                placeholder="***"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,113,227,0.4)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(134,134,139,0.25)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <Shield size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c7c7cc]" />
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <Bouncy target="cart" className="w-full">
          <motion.button
            onClick={onPay}
            className="w-full py-4 mt-2 rounded-2xl cursor-pointer relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0071e3, #5856d6)",
              boxShadow: "0 4px 20px rgba(0,113,227,0.25)",
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock size={14} className="text-white/80" />
              <span
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "-0.01em",
                }}
              >
                Pay ${formatCurrency(total)}
              </span>
            </div>
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
          </motion.button>
        </Bouncy>
      </div>
    </motion.div>
  );
}

/* ───── Payment Success ───────────────────────────────── */

function PaymentSuccess({
  onBackToShop,
  paymentMethod,
  referenceCode,
}: {
  onBackToShop: () => void;
  paymentMethod: string | null;
  referenceCode: string;
}) {
  const isTransfer = paymentMethod === "bank" || paymentMethod === "wire";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center gap-8 py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: isTransfer
            ? "linear-gradient(135deg, #ff9f0a, #ffb340)"
            : "linear-gradient(135deg, #34c759, #30d158)",
          boxShadow: isTransfer
            ? "0 8px 40px rgba(255,159,10,0.25)"
            : "0 8px 40px rgba(52,199,89,0.25)",
        }}
      >
        {isTransfer ? (
          <Clock size={40} strokeWidth={2.5} className="text-white" />
        ) : (
          <Check size={40} strokeWidth={3} className="text-white" />
        )}
      </motion.div>

      <div className="text-center flex flex-col gap-3">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: "-0.03em",
          }}
        >
          {isTransfer ? "Awaiting payment" : "Payment successful"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15,
            fontWeight: 500,
            color: "#86868b",
            lineHeight: 1.6,
            maxWidth: 380,
            margin: "0 auto",
          }}
        >
          {isTransfer
            ? "We're waiting to receive your transfer. Your order will be confirmed once the payment clears — usually within 1–3 business days."
            : "Your order has been confirmed. You'll receive a confirmation email with tracking details shortly."}
        </motion.p>
      </div>

      {/* Reference Code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col items-center gap-2 px-8 py-5 rounded-[20px]"
        style={{
          backgroundColor: "rgba(255,255,255,0.8)",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          minWidth: 260,
        }}
      >
        <span
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: "#aeaeb2",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Payment Reference
        </span>
        <span
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: "0.04em",
          }}
        >
          {referenceCode}
        </span>
        {isTransfer && (
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11.5,
              fontWeight: 500,
              color: "#aeaeb2",
              marginTop: 2,
            }}
          >
            Include this reference in your transfer
          </span>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        onClick={onBackToShop}
        className="px-8 py-3.5 rounded-2xl cursor-pointer"
        style={{
          backgroundColor: "#f5f5f7",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        whileHover={{ scale: 1.02, backgroundColor: "#eeeef0" }}
        whileTap={{ scale: 0.97 }}
      >
        <span
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "#1d1d1f",
          }}
        >
          Continue Shopping
        </span>
      </motion.button>
    </motion.div>
  );
}

/* ───── Main Checkout Page ─────────────────────────────── */

export function CheckoutPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { items, checkoutItemIds } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Stable reference code generated once on mount
  const [referenceCode] = useState(
    () => `VH-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );

  // Get checkout items
  const checkoutItems = useMemo(
    () => items.filter((i) => checkoutItemIds.includes(i.id)),
    [items, checkoutItemIds]
  );

  const totalPrice = useMemo(
    () =>
      checkoutItems.reduce(
        (sum, item) => sum + (item.pricePerUnit + item.deliverySurcharge) * item.quantity,
        0
      ),
    [checkoutItems]
  );

  const totalQuantity = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
    [checkoutItems]
  );

  // For sample orders (< 100 qty), hide bank/wire transfer
  const isSampleOrder = totalQuantity < 100;
  const availableMethods = useMemo(
    () => allPaymentMethods.filter((m) => (isSampleOrder ? !m.bulkOnly : true)),
    [isSampleOrder]
  );

  const handlePay = () => {
    setIsPaid(true);
  };

  if (checkoutItems.length === 0 && !isPaid) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ backgroundColor: "#fcfaf7", fontFamily: "'Urbanist', sans-serif" }}
      >
        <p style={{ fontSize: 17, fontWeight: 600, color: "#86868b" }}>
          No items selected for checkout
        </p>
        <motion.button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-2xl cursor-pointer"
          style={{ backgroundColor: "#f5f5f7", border: "1px solid rgba(0,0,0,0.06)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>Back to shop</span>
        </motion.button>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#fcfaf7", fontFamily: "'Urbanist', sans-serif" }}
      >
        <PaymentSuccess onBackToShop={() => navigate("/")} paymentMethod={selectedMethod} referenceCode={referenceCode} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#fcfaf7", fontFamily: "'Urbanist', sans-serif" }}
    >
      {/* ── Top Bar ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 px-6 lg:px-10 py-5"
        style={{
          backgroundColor: "rgba(252,250,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer group"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={18} className="text-[#86868b] group-hover:text-[#1d1d1f]" style={{ transition: "color 0.2s" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#86868b", transition: "color 0.2s" }} className="group-hover:text-[#1d1d1f]">
              Back
            </span>
          </motion.button>

          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1d1d1f",
              letterSpacing: "-0.02em",
            }}
          >
            Confirm & Pay
          </h1>

          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-[#34c759]" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#34c759" }}>Secure</span>
          </div>
        </div>
      </motion.div>

      {/* ── Content ────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
          {/* ── Left: Order Review ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1d1d1f",
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Order Review
            </h2>

            <div className="flex flex-col gap-4">
              {checkoutItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <OrderCard item={item} />
                </motion.div>
              ))}
            </div>

            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 rounded-[20px] p-5"
              style={{
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <button
                onClick={() => setBreakdownOpen(!breakdownOpen)}
                className="flex items-center justify-between w-full cursor-pointer"
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f" }}>
                  Price breakdown
                </span>
                <motion.div animate={{ rotate: breakdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-[#86868b]" />
                </motion.div>
              </button>

              <AnimatePresence>
                {breakdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-black/5">
                      {checkoutItems.map((item) => {
                        const subtotal = item.pricePerUnit * item.quantity;
                        return (
                          <div key={item.id} className="flex items-center justify-between">
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#6e6e73" }}>
                              {item.colorName} {item.sizeLabel} x{item.quantity.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
                              ${formatCurrency(subtotal)}
                            </span>
                          </div>
                        );
                      })}

                      {/* Delivery & Taxes */}
                      <div className="flex flex-col gap-2 mt-1 pt-2.5 border-t border-black/5">
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#6e6e73" }}>
                            Delivery & handling
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
                            ${formatCurrency(checkoutItems.reduce((s, i) => s + i.deliverySurcharge * i.quantity, 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#6e6e73" }}>
                            Est. taxes
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}>
                            ${formatCurrency(totalPrice * 0.0875)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f" }}>
                  Total
                  <span style={{ fontWeight: 400, color: "#aeaeb2", fontSize: 12, marginLeft: 6 }}>
                    {totalQuantity.toLocaleString()} pcs
                  </span>
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                  ${formatCurrency(totalPrice + totalPrice * 0.0875)}
                </span>
              </div>
            </motion.div>

            {/* Delivery estimate */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mt-5 px-5 py-4 rounded-2xl"
              style={{ backgroundColor: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.12)" }}
            >
              <Check size={16} className="text-[#34c759] shrink-0" />
              <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 13, fontWeight: 500, color: "#1d1d1f" }}>
                Estimated delivery: <span style={{ fontWeight: 600 }}>April 6, 2026</span> around 6pm
              </span>
            </motion.div>
          </motion.div>

          {/* ── Right: Payment Methods ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1d1d1f",
                letterSpacing: "-0.03em",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Select payment method
            </h2>

            <div className="flex flex-col gap-3">
              {availableMethods.map((method, i) => {
                const isActive = selectedMethod === method.id;
                const isDisabledLook = selectedMethod !== null && !isActive;
                const effectiveOpacity = isDisabledLook ? 0.4 : 1;

                return (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.35 }}
                  >
                    <motion.button
                      onClick={() => setSelectedMethod(isActive ? null : method.id)}
                      className="w-full text-left cursor-pointer relative overflow-hidden"
                      style={{
                        borderRadius: isActive ? 24 : 20,
                        backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0)",
                        border: isActive
                          ? "2px solid #0071e3"
                          : `1px solid rgba(134,134,139,${isDisabledLook ? 0.15 : 0.3})`,
                        padding: isActive ? "18px 20px" : "14px 20px",
                        boxShadow: isActive ? "0 4px 15px rgba(0,113,227,0.12)" : "none",
                        transition: "all 0.3s",
                      }}
                      whileHover={!isActive ? { scale: 1.01, backgroundColor: "rgba(255,255,255,0.5)" } : undefined}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {method.icon(effectiveOpacity)}
                          <span
                            style={{
                              fontFamily: "'Urbanist', sans-serif",
                              fontSize: 15,
                              fontWeight: 600,
                              color: isDisabledLook ? "rgba(134,134,139,0.4)" : "#86868b",
                              transition: "color 0.3s",
                            }}
                          >
                            {method.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "'Urbanist', sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                            color: isDisabledLook ? "rgba(134,134,139,0.4)" : "#86868b",
                            transition: "color 0.3s",
                          }}
                        >
                          ${formatCurrency(totalPrice)}
                        </span>
                      </div>
                    </motion.button>

                    {/* Card form expands inside card method */}
                    <AnimatePresence>
                      {isActive && method.id === "card" && (
                        <CardForm total={totalPrice} onPay={handlePay} />
                      )}
                      {isActive && method.id !== "card" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 px-1">
                            <p
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 13,
                                fontWeight: 500,
                                color: "#86868b",
                                lineHeight: 1.6,
                                marginBottom: 16,
                              }}
                            >
                              {method.id === "paypal"
                                ? "You'll be redirected to PayPal to complete your payment securely."
                                : method.id === "applepay"
                                  ? "Confirm payment with Face ID or Touch ID on your Apple device."
                                  : method.id === "alipay"
                                    ? "You'll be redirected to Alipay to complete your payment."
                                    : method.id === "googlepay"
                                      ? "Confirm payment through Google Pay on your device."
                                      : null}
                            </p>
                            {(method.id === "bank" || method.id === "wire") && (
                              <div
                                className="rounded-[14px] p-4 flex flex-col gap-3 mb-4"
                                style={{ backgroundColor: "#f9f8f5", border: "1px solid rgba(0,0,0,0.04)" }}
                              >
                                <p
                                  style={{
                                    fontFamily: "'Nunito', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 500,
                                    color: "#86868b",
                                    lineHeight: 1.5,
                                    marginBottom: 4,
                                  }}
                                >
                                  {method.id === "bank"
                                    ? "Transfer the exact amount below to complete your order."
                                    : "Send the exact amount via wire using the details below."}
                                </p>
                                {[
                                  { label: "Beneficiary", value: "Vehsl Technologies Ltd." },
                                  { label: "Bank", value: method.id === "bank" ? "HSBC Hong Kong" : "Citibank N.A." },
                                  { label: "Account No.", value: method.id === "bank" ? "808-209431-838" : "36820971" },
                                  { label: "SWIFT / BIC", value: method.id === "bank" ? "HSBCHKHHHKH" : "CITIUS33" },
                                  ...(method.id === "wire" ? [{ label: "Routing No.", value: "021000089" }] : []),
                                  { label: "Reference", value: referenceCode },
                                  { label: "Amount", value: `$${formatCurrency(totalPrice)} USD` },
                                ].map((row) => (
                                  <div key={row.label} className="flex items-start justify-between gap-4">
                                    <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 12, fontWeight: 500, color: "#aeaeb2", whiteSpace: "nowrap" }}>
                                      {row.label}
                                    </span>
                                    <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 12.5, fontWeight: 600, color: "#1d1d1f", textAlign: "right" }}>
                                      {row.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p style={{ display: "none" }}>
                            </p>
                            <Bouncy target="cart" className="w-full">
                              <motion.button
                                onClick={handlePay}
                                className="w-full py-4 rounded-2xl cursor-pointer relative overflow-hidden"
                                style={{
                                  background: "linear-gradient(135deg, #0071e3, #5856d6)",
                                  boxShadow: "0 4px 20px rgba(0,113,227,0.25)",
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span
                                    style={{
                                      fontFamily: "'Urbanist', sans-serif",
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "white",
                                    }}
                                  >
                                    {method.id === "bank" || method.id === "wire"
                                      ? `I've sent the transfer · $${formatCurrency(totalPrice)}`
                                      : `Pay with ${method.label} · $${formatCurrency(totalPrice)}`}
                                  </span>
                                </div>
                              </motion.button>
                            </Bouncy>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Security disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              <Shield size={13} className="text-[#c7c7cc]" />
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: "#c7c7cc",
                  lineHeight: 1.5,
                }}
              >
                256-bit SSL encrypted. Your payment info is never stored.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}