"use client";

import { useState, ReactNode } from "react";
import { motion } from "motion/react";
import { useBounce } from "./bounce-context";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const { triggerBounce } = useBounce();

  return (
    <div className="flex flex-col gap-10">
      {/* Tab Headers */}
      <div className="flex gap-2 p-1.5 bg-[#f5f5f7] rounded-full w-fit">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              triggerBounce(`tab-${tab.id}`);
            }}
            className={`relative px-5 py-2.5 rounded-full cursor-pointer transition-colors duration-200 ${
              activeTab === tab.id ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
            style={{ fontSize: 14, fontWeight: 500 }}
            whileTap={{ scale: 0.97 }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {tabs.find((t) => t.id === activeTab)?.content}
      </motion.div>
    </div>
  );
}
