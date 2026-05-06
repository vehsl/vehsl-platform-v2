"use client";

import { motion, useAnimation } from "motion/react";
import { useBounce } from "./bounce-context";
import { type ReactNode, useCallback } from "react";

interface AliveButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "glass";
}

export function AliveButton({
  children,
  onClick,
  className = "",
  variant = "primary",
}: AliveButtonProps) {
  const { triggerBounce, bounceIntensity } = useBounce();
  const controls = useAnimation();

  const handleClick = useCallback(() => {
    triggerBounce();
    const intensity = Math.max(0.03, bounceIntensity * 0.02);
    controls.start({
      scale: [1, 1 - intensity, 1 + intensity * 0.5, 1],
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.2, 0.6, 1],
      },
    });
    onClick?.();
  }, [triggerBounce, bounceIntensity, controls, onClick]);

  const baseStyles: Record<string, string> = {
    primary:
      "bg-[#0d1117] text-white px-8 py-3.5 rounded-full",
    secondary:
      "bg-white/80 backdrop-blur-xl text-[#0d1117] px-8 py-3.5 rounded-full border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
    ghost:
      "text-[#0071e3] px-4 py-2 rounded-full",
    glass:
      "bg-white/40 backdrop-blur-xl text-[#404040] px-5 py-2.5 rounded-full border border-white/70 shadow-[0_1px_8px_rgba(0,0,0,0.03)]",
  };

  return (
    <motion.button
      animate={controls}
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={`cursor-pointer font-['Urbanist',sans-serif] transition-colors duration-300 ${baseStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
