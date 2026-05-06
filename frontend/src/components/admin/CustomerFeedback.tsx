"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Star, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp,
  Heart, Frown, Meh, Smile, ChevronRight, ArrowRight,
  Package, Truck, Shield, Users, ChartBar, CheckCircle2
} from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusPill } from "./StatusPill";
import { BounceButton } from "./BounceButton";
import { useBounce } from "./BounceContext";

/*
 * ════════════════════════════════════════════════════════════
 *  CUSTOMER FEEDBACK — PLATONIC DESIGN
 *
 *  The Platonic question: "How do our customers FEEL?"
 *  A single glance should answer that. The face/mood is the 
 *  most universal signal — a child understands a smile.
 *
 *  Information hierarchy:
 *  1. THE FEELING — Overall sentiment (happy/neutral/sad)
 *  2. THE NUMBER — NPS or satisfaction score
 *  3. THE VOICES — Individual feedback, sorted by impact
 *  4. THE TRENDS — Getting better or worse?
 * ════════════════════════════════════════════════════════════
 */

interface FeedbackItem {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  category: "product" | "delivery" | "quality" | "support" | "platform";
  comment: string;
  date: string;
  orderId: string;
  sentiment: "positive" | "neutral" | "negative";
  responded: boolean;
}

const feedbackData: FeedbackItem[] = [
  {
    id: "FB-301",
    customerName: "Sarah Mitchell",
    avatar: "SM",
    rating: 5,
    category: "quality",
    comment: "The herbal tea blend exceeded our expectations. Packaging was perfect, freshness sealed in. Already placing a reorder for our café chain.",
    date: "2 hours ago",
    orderId: "ORD-4801",
    sentiment: "positive",
    responded: true,
  },
  {
    id: "FB-302",
    customerName: "James Rodriguez",
    avatar: "JR",
    rating: 4,
    category: "delivery",
    comment: "Delivery was on time, but the tracking updates could be more frequent. Would love real-time GPS tracking for our B2B orders.",
    date: "4 hours ago",
    orderId: "ORD-4795",
    sentiment: "positive",
    responded: false,
  },
  {
    id: "FB-303",
    customerName: "Emily Chen",
    avatar: "EC",
    rating: 2,
    category: "product",
    comment: "LED panels had different color temperatures than listed. The warm white was closer to neutral white. Need better color accuracy specs.",
    date: "6 hours ago",
    orderId: "ORD-4788",
    sentiment: "negative",
    responded: true,
  },
  {
    id: "FB-304",
    customerName: "Marcus Thompson",
    avatar: "MT",
    rating: 5,
    category: "support",
    comment: "Outstanding customer support! Sarah K. resolved my shipping issue within 30 minutes. This is why we keep coming back to TradeFlow.",
    date: "1 day ago",
    orderId: "ORD-4782",
    sentiment: "positive",
    responded: true,
  },
  {
    id: "FB-305",
    customerName: "Lisa Park",
    avatar: "LP",
    rating: 3,
    category: "platform",
    comment: "The B2B ordering process works but could be streamlined. Too many clicks to set up recurring orders. Good product, room for UX improvement.",
    date: "1 day ago",
    orderId: "ORD-4776",
    sentiment: "neutral",
    responded: false,
  },
  {
    id: "FB-306",
    customerName: "Hans Weber",
    avatar: "HW",
    rating: 1,
    category: "delivery",
    comment: "Third time this month with a delayed delivery. Our production line depends on timely materials. Need guaranteed delivery windows for industrial orders.",
    date: "2 days ago",
    orderId: "ORD-4770",
    sentiment: "negative",
    responded: true,
  },
  {
    id: "FB-307",
    customerName: "Aisha Rahman",
    avatar: "AR",
    rating: 5,
    category: "quality",
    comment: "Carbon fiber sheets arrived in pristine condition. The quality inspection report included with the shipment was a nice touch — gives us confidence.",
    date: "2 days ago",
    orderId: "ORD-4765",
    sentiment: "positive",
    responded: false,
  },
];

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  product: { icon: <Package size={12} />, color: "#3B82F6", label: "Product" },
  delivery: { icon: <Truck size={12} />, color: "#30A46C", label: "Delivery" },
  quality: { icon: <Shield size={12} />, color: "#0171E3", label: "Quality" },
  support: { icon: <Users size={12} />, color: "#8B5CF6", label: "Support" },
  platform: { icon: <ChartBar size={12} />, color: "#D97706", label: "Platform" },
};

// ─── Satisfaction Mood Ring ─────────────────────────────
// THE PLATONIC FORM: How do customers feel? A face tells all.

function SatisfactionMood({ score }: { score: number }) {
  const getMood = () => {
    if (score >= 4.5) return { icon: <Heart size={28} />, label: "Loved", color: "#30A46C", bg: "rgba(48,164,108,0.06)" };
    if (score >= 4.0) return { icon: <Smile size={28} />, label: "Happy", color: "#30A46C", bg: "rgba(48,164,108,0.04)" };
    if (score >= 3.0) return { icon: <Meh size={28} />, label: "Neutral", color: "#FFB224", bg: "rgba(255,178,36,0.04)" };
    if (score >= 2.0) return { icon: <Frown size={28} />, label: "Concerned", color: "#D97706", bg: "rgba(217,119,6,0.04)" };
    return { icon: <Frown size={28} />, label: "Unhappy", color: "#E5484D", bg: "rgba(229,72,77,0.04)" };
  };

  const mood = getMood();

  return (
    <motion.div
      className="bg-card rounded-[1.5rem] p-8 sm:p-9
        shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.03)]
        relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${mood.bg}, transparent 70%)`, transform: "scale(1.5)" }}
      />

      <p className="text-muted-foreground/45 text-[0.6875rem] tracking-[0.05em] uppercase mb-6">
        Customer Sentiment
      </p>

      <div className="flex items-center gap-7">
        {/* Mood face — instant understanding */}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: mood.bg }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
        >
          <span style={{ color: mood.color, opacity: 0.7 }}>{mood.icon}</span>
        </motion.div>

        <div>
          {/* THE NUMBER */}
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-[2.5rem] tracking-[-0.03em] leading-none tabular-nums"
              style={{ color: mood.color }}>
              {score.toFixed(1)}
            </span>
            <span className="text-[0.8125rem] text-muted-foreground/40">/ 5.0</span>
          </motion.div>

          <motion.p
            className="text-[0.8125rem] mt-2"
            style={{ color: `${mood.color}AA` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Customers are {mood.label.toLowerCase()}
          </motion.p>

          <motion.p
            className="text-[0.6875rem] text-muted-foreground/35 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Based on {feedbackData.length} reviews this week
          </motion.p>
        </div>
      </div>

      {/* Star distribution — the shape of sentiment */}
      <motion.div
        className="mt-8 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = feedbackData.filter(f => f.rating === stars).length;
          const pct = feedbackData.length > 0 ? (count / feedbackData.length) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 w-14 justify-end">
                <span className="text-[0.6875rem] text-muted-foreground/40 tabular-nums">{stars}</span>
                <Star size={10} className="text-[#FFB224]/50" fill="currentColor" />
              </div>
              <div className="flex-1 h-[6px] rounded-full bg-black/[0.02] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: stars >= 4 ? "#30A46C" : stars === 3 ? "#FFB224" : "#E5484D", opacity: 0.5 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + (5 - stars) * 0.06 }}
                />
              </div>
              <span className="text-[0.625rem] text-muted-foreground/30 w-6 text-right tabular-nums">{count}</span>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Customer Feedback ─────────────────────────────

export function CustomerFeedback() {
  const { addEnergy } = useBounce();
  const [filterSentiment, setFilterSentiment] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");

  const filtered = feedbackData.filter(f => {
    if (filterSentiment !== "all" && f.sentiment !== filterSentiment) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    return true;
  });

  const avgRating = feedbackData.reduce((s, f) => s + f.rating, 0) / feedbackData.length;
  const positiveCount = feedbackData.filter(f => f.sentiment === "positive").length;
  const negativeCount = feedbackData.filter(f => f.sentiment === "negative").length;
  const responseRate = Math.round(
    (feedbackData.filter(f => f.responded).length / feedbackData.length) * 100
  );

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Customer Feedback</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            The voice of our customers — what they love, what we can improve.
          </p>
        </div>
        <BounceButton variant="primary" size="sm" icon={<MessageCircle size={15} />} energyWeight={1.5}>
          Request Feedback
        </BounceButton>
      </div>

      {/* Mood Ring + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SatisfactionMood score={avgRating} />

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StatCard
            label="Positive Reviews"
            value={positiveCount.toString()}
            change={`${Math.round((positiveCount / feedbackData.length) * 100)}% of total`}
            changeType="positive"
            icon={<ThumbsUp size={20} className="text-[#30A46C]" />}
            iconBg="bg-[#30A46C]/8"
            index={0}
            subtitle="Happy customers"
            accentColor="#30A46C"
          />
          <StatCard
            label="Needs Attention"
            value={negativeCount.toString()}
            change="Requires follow-up"
            changeType="negative"
            icon={<ThumbsDown size={20} className="text-[#E5484D]" />}
            iconBg="bg-[#E5484D]/8"
            index={1}
            subtitle="Unhappy experiences"
            accentColor="#E5484D"
          />
          <StatCard
            label="Response Rate"
            value={`${responseRate}%`}
            change="+5% vs last week"
            changeType="positive"
            icon={<MessageCircle size={20} className="text-primary" />}
            iconBg="bg-primary/8"
            index={2}
            subtitle="Feedback responded to"
            sparklineData={[60, 62, 65, 68, 70, 72, responseRate]}
            sparklineColor="#0171E3"
            accentColor="#0171E3"
          />
          <StatCard
            label="NPS Score"
            value="72"
            change="+8 this quarter"
            changeType="positive"
            icon={<TrendingUp size={20} className="text-[#8B5CF6]" />}
            iconBg="bg-[#8B5CF6]/8"
            index={3}
            subtitle="Net Promoter Score"
            sparklineData={[58, 60, 63, 65, 68, 70, 72]}
            sparklineColor="#8B5CF6"
            accentColor="#8B5CF6"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 bg-muted/20 rounded-xl p-1">
          {(["all", "positive", "neutral", "negative"] as const).map((sent) => (
            <button
              key={sent}
              onClick={() => setFilterSentiment(sent)}
              className={`px-3.5 py-2 rounded-lg text-[0.8125rem] transition-all cursor-pointer capitalize ${
                filterSentiment === sent
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {sent === "all" ? "All" :
               sent === "positive" ? "Positive" :
               sent === "neutral" ? "Neutral" : "Negative"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "product", "delivery", "quality", "support", "platform"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-[0.6875rem] transition-all cursor-pointer capitalize ${
                filterCategory === cat
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              {cat === "all" ? "All Topics" : categoryConfig[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-3">
        {filtered.map((feedback, i) => {
          const cat = categoryConfig[feedback.category];
          const sentimentColor = feedback.sentiment === "positive" ? "#30A46C"
            : feedback.sentiment === "negative" ? "#E5484D" : "#FFB224";

          return (
            <motion.div
              key={feedback.id}
              className="bg-card rounded-2xl p-6
                shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_4px_rgba(0,0,0,0.02)]
                hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)]
                transition-all duration-300"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6]/80 to-[#0171E3]/80
                  flex items-center justify-center text-white text-[0.625rem] flex-shrink-0">
                  {feedback.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-[0.875rem] text-foreground">{feedback.customerName}</span>
                        <span className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
                          style={{ background: `${cat.color}08`, color: `${cat.color}AA` }}>
                          {cat.icon} {cat.label}
                        </span>
                        {!feedback.responded && (
                          <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary">
                            Needs reply
                          </span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mb-2.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            className={s <= feedback.rating ? "text-[#FFB224]" : "text-black/[0.06]"}
                            fill={s <= feedback.rating ? "currentColor" : "currentColor"}
                          />
                        ))}
                        <span className="text-[0.6875rem] text-muted-foreground/35 ml-1.5 tabular-nums">
                          {feedback.rating}.0
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[0.6875rem] text-muted-foreground/35">{feedback.date}</span>
                      <p className="text-[0.625rem] text-muted-foreground/25 mt-0.5">{feedback.orderId}</p>
                    </div>
                  </div>

                  {/* Comment — the voice */}
                  <p className="text-[0.8125rem] text-foreground/60 leading-relaxed">{feedback.comment}</p>

                  {/* Sentiment indicator + response status */}
                  <div className="flex items-center justify-between mt-3.5">
                    <div className="flex items-center gap-1.5 text-[0.6875rem]"
                      style={{ color: `${sentimentColor}88` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sentimentColor, opacity: 0.5 }} />
                      <span className="capitalize">{feedback.sentiment}</span>
                    </div>
                    {feedback.responded ? (
                      <span className="flex items-center gap-1 text-[0.6875rem] text-[#30A46C]/50">
                        <CheckCircle2 size={11} /> Responded
                      </span>
                    ) : (
                      <BounceButton variant="ghost" size="sm" icon={<ArrowRight size={12} />} energyWeight={0.5}>
                        Reply
                      </BounceButton>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}