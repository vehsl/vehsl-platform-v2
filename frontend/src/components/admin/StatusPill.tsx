"use client";

import React from "react";

/*
 * PLATONIC StatusPill
 * A status should communicate instantly through color and shape.
 * The dot is the signal. The text is confirmation.
 * Gentler colors — nothing should scream.
 */

type StatusType = "success" | "warning" | "error" | "info" | "pending" | "neutral";

interface StatusPillProps {
  status: StatusType;
  label: string;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-[#30A46C]/8", text: "text-[#30A46C]/80", dot: "bg-[#30A46C]" },
  warning: { bg: "bg-[#FFB224]/8", text: "text-[#D97706]/80", dot: "bg-[#FFB224]" },
  error: { bg: "bg-[#E5484D]/8", text: "text-[#E5484D]/80", dot: "bg-[#E5484D]" },
  info: { bg: "bg-[#3B82F6]/8", text: "text-[#3B82F6]/80", dot: "bg-[#3B82F6]" },
  pending: { bg: "bg-[#0171E3]/8", text: "text-[#0171E3]/80", dot: "bg-[#0171E3]" },
  neutral: { bg: "bg-muted/40", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export function StatusPill({ status, label, pulse = false }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.6875rem] ${config.bg} ${config.text}`}
    >
      <span className="relative flex h-[5px] w-[5px]">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-30`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-[5px] w-[5px] ${config.dot} opacity-70`} />
      </span>
      {label}
    </span>
  );
}
