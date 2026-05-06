"use client";

import React from "react";
import { motion } from "motion/react";
import { useBounce } from "./BounceContext";

/*
 * PLATONIC BounceButton
 * 
 * Every button is a conversation starter. When pressed,
 * the whole UI gently acknowledges the interaction — like
 * touching water and watching ripples.
 * 
 * Jony Ive: "True simplicity derives from so much more 
 * than just the absence of clutter."
 */

interface BounceButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  energyWeight?: number;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_1px_8px_rgba(1,113,227,0.2)] hover:shadow-[0_2px_16px_rgba(1,113,227,0.3)]",
  secondary:
    "bg-black/[0.03] text-foreground/70 hover:bg-black/[0.05] hover:text-foreground",
  ghost:
    "bg-transparent text-foreground/60 hover:bg-black/[0.03] hover:text-foreground",
  success:
    "bg-[#30A46C] text-white shadow-[0_1px_8px_rgba(48,164,108,0.2)]",
  warning:
    "bg-[#FFB224] text-[#1C1B2E] shadow-[0_1px_8px_rgba(255,178,36,0.2)]",
};

const sizeStyles: Record<string, string> = {
  sm: "px-4 py-2 text-[0.75rem] rounded-xl gap-1.5",
  md: "px-6 py-3 text-[0.8125rem] rounded-2xl gap-2",
  lg: "px-8 py-4 text-[0.875rem] rounded-2xl gap-2.5",
};

export function BounceButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  icon,
  energyWeight = 1,
}: BounceButtonProps) {
  const { addEnergy, getIntensity } = useBounce();

  const handleClick = () => {
    addEnergy(energyWeight);
    onClick?.();
  };

  const intensity = getIntensity();

  return (
    <motion.button
      className={`inline-flex items-center justify-center cursor-pointer transition-all duration-400 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={handleClick}
      whileTap={{
        scale: 1 - 0.03 * intensity,
      }}
      whileHover={{
        scale: 1 + 0.01 * intensity,
        y: -0.5,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 18 + 8 / intensity,
        mass: 0.6 * intensity,
      }}
    >
      {icon && <span className="flex-shrink-0 opacity-70">{icon}</span>}
      {children}
    </motion.button>
  );
}
