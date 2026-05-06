"use client";

import { motion } from "motion/react";
import { useBounce } from "./bounce-context";
import { type ReactNode, useEffect, useState } from "react";

interface AliveElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  sensitivity?: number;
}

/**
 * An element that responds to global bounce interactions.
 * It subtly "breathes" with the page activity, creating conversational feel.
 */
export function AliveElement({
  children,
  className = "",
  delay = 0,
  sensitivity = 1,
}: AliveElementProps) {
  const { lastClickTime, bounceIntensity } = useBounce();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (lastClickTime > 0) {
      const timeout = setTimeout(() => {
        setShouldAnimate(true);
        setTimeout(() => setShouldAnimate(false), 600);
      }, delay * 50);
      return () => clearTimeout(timeout);
    }
  }, [lastClickTime, delay]);

  const intensity = bounceIntensity * sensitivity * 0.008;

  return (
    <motion.div
      className={className}
      animate={
        shouldAnimate
          ? {
              y: [0, -intensity * 10, intensity * 4, 0],
              scale: [1, 1 + intensity * 0.3, 1 - intensity * 0.1, 1],
            }
          : {}
      }
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
