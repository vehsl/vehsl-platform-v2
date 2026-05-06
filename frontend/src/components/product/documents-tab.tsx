"use client";

import { motion } from "motion/react";
import { Download, FileText, ShieldCheck, BookOpen, Award, Wrench, ClipboardCheck } from "lucide-react";

const documents = [
  {
    name: "Vehsl test report and rating",
    description: "Independent lab results & performance scores",
    icon: ClipboardCheck,
    iconColor: "#34c759",
    iconBg: "#34c75912",
    size: "2.4 MB",
    primary: true,
  },
  {
    name: "Specifications",
    description: "Full technical specs & dimensions",
    icon: FileText,
    iconColor: "#0071e3",
    iconBg: "#0071e312",
    size: "1.1 MB",
    primary: false,
  },
  {
    name: "User manual",
    description: "Setup guide & usage instructions",
    icon: BookOpen,
    iconColor: "#ff9500",
    iconBg: "#ff950012",
    size: "890 KB",
    primary: false,
  },
  {
    name: "Safety & compliance documents",
    description: "CE, FCC, RoHS & REACH certifications",
    icon: ShieldCheck,
    iconColor: "#ff3b30",
    iconBg: "#ff3b3012",
    size: "3.2 MB",
    primary: false,
  },
  {
    name: "Warranty statement",
    description: "Coverage terms & claim process",
    icon: Award,
    iconColor: "#af52de",
    iconBg: "#af52de12",
    size: "780 KB",
    primary: false,
  },
  {
    name: "Technical files",
    description: "CAD drawings & integration guides",
    icon: Wrench,
    iconColor: "#86868b",
    iconBg: "#86868b12",
    size: "1.5 MB",
    primary: false,
  },
];

export function DocumentsTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#86868b",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Documents & downloads
      </motion.p>

      {/* Horizontal card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {documents.map((doc, i) => {
          const Icon = doc.icon;
          return (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="group relative flex flex-col justify-between p-5 rounded-[20px] bg-[#f8f8fa] hover:bg-[#f3f3f6] transition-colors cursor-pointer overflow-hidden"
              style={{ minHeight: 170 }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-4"
                style={{ backgroundColor: doc.iconBg }}
              >
                <Icon size={18} style={{ color: doc.iconColor }} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1 flex-1">
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f", lineHeight: 1.35 }}>
                  {doc.name}
                </p>
                <p style={{ fontSize: 12, color: "#aeaeb2", lineHeight: 1.45 }}>
                  {doc.description}
                </p>
              </div>

              {/* Download button */}
              <div className="mt-4">
                {doc.primary ? (
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071e3] text-white cursor-pointer"
                    style={{ fontSize: 13, fontWeight: 600 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Download
                    <Download size={14} />
                  </motion.button>
                ) : (
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0071e3] text-[#0071e3] cursor-pointer hover:bg-[#0071e3]/5 transition-colors"
                    style={{ fontSize: 13, fontWeight: 600 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Download
                    <Download size={14} />
                  </motion.button>
                )}
              </div>

              {/* File size badge */}
              <div
                className="absolute top-4 right-4 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "#00000008", fontSize: 10.5, fontWeight: 500, color: "#aeaeb2" }}
              >
                {doc.size}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}