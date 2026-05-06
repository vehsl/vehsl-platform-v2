"use client";

import { motion } from "motion/react";
import { Smile } from "lucide-react";

export function FeedbackButton() {
  return (
    <motion.button
      className="fixed bottom-8 right-8 w-[50px] h-[32px] bg-[#86868b] rounded-[42.857px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={() => {
        // Feedback functionality
        alert("Thank you for your feedback! We're here to help.");
      }}
    >
      <Smile className="w-[14px] h-[14px] text-white" />
    </motion.button>
  );
}
