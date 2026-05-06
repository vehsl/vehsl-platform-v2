"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import svgPaths from "./imports/svg-a6dqvd9wn8";
const imgGroup34 = "/figma/564ae6e1817616a8122689e548ae3ff7a8b68016.png";

interface SharePopupProps {
  open: boolean;
  onClose: () => void;
  linkCopied: boolean;
}

/* ── Chevron arrow for each row ─────────────────────── */
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18L15 12L9 6"
        stroke="#b0b0b4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/* ── Share option row ────────────────────────────────── */
function ShareRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-between w-full px-2 py-3 rounded-[16px] hover:bg-[#f7f6f3] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#f0efec]">
          {icon}
        </div>
        <span
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 16,
            color: "#6e6e73",
            letterSpacing: -0.1,
          }}
        >
          Share with{" "}
          <span style={{ color: "#1d1d1f", fontWeight: 700 }}>{label}</span>
        </span>
      </div>
      <ChevronRight />
    </motion.button>
  );
}

/* ── Main Share Popup ────────────────────────────────── */
export function SharePopup({ open, onClose, linkCopied }: SharePopupProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = "Check out this USB-C cable from Vehsl";

  /* Safe clipboard helper — falls back silently if blocked by permissions policy */
  const safeCopyToClipboard = (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // Clipboard API blocked — ignore
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px] max-w-[90vw]"
          >
            <div
              className="flex flex-col bg-white rounded-[28px] overflow-hidden"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 2px 12px rgba(0,0,0,0.06)" }}
            >
              {/* ── Header ───────────────────────────────── */}
              <div className="flex items-center gap-4 px-7 pt-7 pb-5">
                {/* Product thumbnail */}
                <div
                  className="w-[52px] h-[52px] rounded-[15px] bg-[#f5f5f7] flex items-center justify-center overflow-hidden shrink-0"
                >
                  <img
                    src={imgGroup34}
                    alt="USB-C Cable"
                    className="h-[34px] object-contain"
                  />
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 22,
                      letterSpacing: -0.4,
                      color: "#1d1d1f",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Share. </span>
                    <span style={{ color: "#86868b", fontWeight: 600 }}>
                      {linkCopied ? "Link copied!" : "Copy a link"}
                    </span>
                  </p>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.88 }}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#eeeef0] transition-colors cursor-pointer shrink-0"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16.2488 16.2488"
                    fill="none"
                  >
                    <path
                      d={svgPaths.p1d9c0100}
                      stroke="#1d1d1f"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.4"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#e8e6e3] mx-6" />

              {/* ── Share options ─────────────────────────── */}
              <div className="flex flex-col gap-0.5 px-6 py-4">
                {/* Email */}
                <ShareRow
                  label="Email"
                  onClick={() => {
                    window.open(
                      `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`,
                      "_blank"
                    );
                  }}
                  icon={
                    <svg width="22" height="22" viewBox="-1 -2 24 22" fill="none">
                      <path
                        d={svgPaths.p3e421000}
                        stroke="#1d1d1f"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                      />
                    </svg>
                  }
                />

                {/* WhatsApp */}
                <ShareRow
                  label="WhatsApp"
                  onClick={() => {
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
                      "_blank"
                    );
                  }}
                  icon={
                    <svg width="22" height="22" viewBox="18 18 28 28" fill="none">
                      <path
                        d={svgPaths.p3799cd80}
                        fill="#1d1d1f"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />

                {/* WeChat */}
                <ShareRow
                  label="WeChat"
                  onClick={() => {
                    safeCopyToClipboard(shareUrl);
                    onClose();
                  }}
                  icon={
                    <svg width="22" height="22" viewBox="18 19 28 28" fill="none">
                      <path d={svgPaths.p34fbe800} fill="#1d1d1f" />
                    </svg>
                  }
                />

                {/* Instagram */}
                <ShareRow
                  label="Instagram"
                  onClick={() => {
                    safeCopyToClipboard(shareUrl);
                    window.open("https://www.instagram.com/", "_blank");
                  }}
                  icon={
                    <svg width="22" height="22" viewBox="0 0 22.2984 22.2984" fill="none">
                      <path
                        d={svgPaths.p38f36180}
                        stroke="#1d1d1f"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                      <path
                        d={svgPaths.p2df80b00}
                        stroke="#1d1d1f"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                      <path
                        d={svgPaths.p26b08280}
                        stroke="#1d1d1f"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                      <path
                        d={svgPaths.p172af800}
                        stroke="#1d1d1f"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-[#e8e6e3] mx-6" />

              {/* ── Done button ───────────────────────────── */}
              <div className="px-6 pt-5 pb-6">
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-[50px] rounded-full bg-[#348de9] hover:bg-[#2d7fd4] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <span
                    style={{
                      fontFamily: "'Urbanist', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: -0.2,
                    }}
                  >
                    done
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}