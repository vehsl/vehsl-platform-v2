"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

export function KeyboardHint() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide hint after 5 seconds or on first interaction
    const timer = setTimeout(() => setShow(false), 5000);

    const handleInteraction = () => setShow(false);
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#202425]/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-['Urbanist',sans-serif] font-medium shadow-lg z-40"
        >
          Press <kbd className="inline-block px-2 py-0.5 mx-1 bg-white/20 rounded">Enter</kbd> to continue
        </motion.div>
      )}
    </AnimatePresence>
  );
}
