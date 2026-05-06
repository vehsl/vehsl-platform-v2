"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface SpecGroup {
  title: string;
  specs: { label: string; value: string }[];
}

const specGroups: SpecGroup[] = [
  {
    title: "General",
    specs: [
      { label: "Power Delivery", value: "30W, 60W, 100W, and 240W" },
      { label: "Data Transfer Speed", value: "20Gbps and 40Gbps" },
      { label: "Length Options", value: "1, 2, 3, 5, 10 meters" },
      { label: "Video Output", value: "4K and 8K" },
      { label: "Generation", value: "USB 4 and Thunderbolt 4/5" },
      { label: "Lane Structure", value: "2 lane" },
      { label: "Encoding", value: "PAM-3" },
      { label: "Colors", value: "Gray, Blue, Green, Yellow, Pink, Mustard, Black" },
    ],
  },
  {
    title: "Durability",
    specs: [
      { label: "Bend Lifespan", value: "20,000 bends" },
      { label: "Tensile Strength", value: "60 Kgs force" },
      { label: "Connector Durability", value: "15,000 insertion cycles" },
      { label: "Outer Jacket", value: "Braided nylon" },
      { label: "Crack Resistance", value: "Yes, at low temperatures" },
      { label: "Internal Structure", value: "Aluminum foil and braid" },
      { label: "Fiber Reinforcement", value: "Kevlar" },
      { label: "Copper Core", value: "24 AWG" },
      { label: "Heat Resistance", value: "60-80°C" },
    ],
  },
  {
    title: "Compliance & Certifications",
    specs: [
      { label: "CE (EU)", value: "Yes" },
      { label: "FCC (USA)", value: "Yes" },
      { label: "UL", value: "Yes, UL 9990 and UL 1581" },
      { label: "USB-IF", value: "Yes, including Safe E-marker chip" },
      { label: "RoHS", value: "Yes" },
      { label: "REACH", value: "Yes" },
      { label: "CP 65 (USA)", value: "Yes" },
      { label: "WEEE Labeling", value: "Yes" },
      { label: "ISO 9001", value: "Yes" },
    ],
  },
  {
    title: "Seller Information",
    specs: [
      { label: "Manufacturer", value: "Anker Innovations Co., Ltd" },
      { label: "Monthly Capacity", value: "5,000 wires" },
      { label: "Origin", value: "China" },
      { label: "Experience", value: "7 years" },
    ],
  },
];

function SpecSection({ group, defaultOpen }: { group: SpecGroup; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[20px] bg-[#f8f8fa] overflow-hidden">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 cursor-pointer"
        whileTap={{ scale: 0.995 }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "#1d1d1f" }}>{group.title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-[#86868b]" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 flex flex-col gap-0">
              {group.specs.map((spec, i) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start justify-between py-3.5 px-3 -mx-3 rounded-lg"
                  style={{
                    backgroundColor: i % 2 === 0 ? "rgba(0,0,0,0.025)" : "transparent",
                  }}
                >
                  <span className="text-[#86868b] shrink-0 pr-6" style={{ fontSize: 14 }}>
                    {spec.label}
                  </span>
                  <span className="text-right" style={{ fontSize: 14, fontWeight: 500, color: "#1d1d1f" }}>
                    {spec.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SpecsTab() {
  return (
    <div className="flex flex-col gap-4">
      {specGroups.map((group, i) => (
        <SpecSection key={group.title} group={group} defaultOpen={i === 0} />
      ))}
    </div>
  );
}