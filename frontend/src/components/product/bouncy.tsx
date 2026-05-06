"use client";

import { motion, useAnimation } from "motion/react";
import { useEffect, ReactNode } from "react";
import { useBounce } from "./bounce-context";

interface BouncyProps {
  children: ReactNode;
  target: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Bouncy({ children, target, className = "", onClick, style }: BouncyProps) {
  const { bounceTargets, interactionCount } = useBounce();
  const controls = useAnimation();

  // Scale bounce intensity based on interaction count (gentle at first, more alive over time)
  const intensity = Math.min(0.04 + interactionCount * 0.003, 0.12);

  useEffect(() => {
    const lastBounce = bounceTargets[target];
    if (lastBounce) {
      controls.start({
        scale: [1, 1 + intensity, 1 - intensity * 0.5, 1 + intensity * 0.3, 1],
        transition: {
          duration: 0.5 + intensity * 2,
          ease: "easeOut",
          times: [0, 0.2, 0.4, 0.7, 1],
        },
      });
    }
  }, [bounceTargets[target]]);

  return (
    <motion.div
      animate={controls}
      className={className}
      onClick={onClick}
      style={style}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
