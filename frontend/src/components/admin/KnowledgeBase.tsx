"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Search, BookOpen, FileText, HelpCircle, ChevronRight,
  Package, Truck, Shield, Users, CreditCard, Settings,
  Play, Clock, ThumbsUp, Eye, ArrowRight, Lightbulb,
  MessageCircle
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { useBounce } from "./BounceContext";

/*
 * ════════════════════════════════════════════════════════════
 *  KNOWLEDGE BASE — PLATONIC DESIGN
 *
 *  Jony Ive: "We try to develop products that seem somehow
 *  inevitable." — Help should feel inevitable, not hunted for.
 *
 *  The Platonic ideal: Answers should FIND the user,
 *  not the other way around. The search is king.
 *  Categories are visual, warm, inviting.
 *  Articles feel like conversations, not documents.
 * ════════════════════════════════════════════════════════════
 */

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  views: number;
  helpful: number;
  updated: string;
  popular: boolean;
}

interface Category {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  description: string;
}

const categories: Category[] = [
  { key: "getting-started", label: "Getting Started", icon: <Play size={20} />, color: "#0171E3", count: 12, description: "First steps on TradeFlow" },
  { key: "orders", label: "Orders & Shipping", icon: <Package size={20} />, color: "#3B82F6", count: 24, description: "Order management & tracking" },
  { key: "delivery", label: "Delivery & Logistics", icon: <Truck size={20} />, color: "#30A46C", count: 18, description: "Routing, carriers, ETAs" },
  { key: "quality", label: "Quality & Inspections", icon: <Shield size={20} />, color: "#D97706", count: 15, description: "QC processes & standards" },
  { key: "billing", label: "Billing & Payments", icon: <CreditCard size={20} />, color: "#8B5CF6", count: 20, description: "Invoices, refunds, credits" },
  { key: "account", label: "Account & Settings", icon: <Settings size={20} />, color: "#7A7D80", count: 10, description: "Profile, preferences, security" },
];

const articles: Article[] = [
  { id: "KB-001", title: "How to set up recurring B2B orders", excerpt: "Learn how to create automated recurring purchase orders for your regular suppliers, including frequency settings and quantity management.", category: "orders", readTime: "3 min", views: 1240, helpful: 95, updated: "2 days ago", popular: true },
  { id: "KB-002", title: "Understanding quality inspection reports", excerpt: "A complete guide to reading and acting on quality inspection reports, including pass/fail criteria, severity levels, and escalation procedures.", category: "quality", readTime: "5 min", views: 890, helpful: 91, updated: "1 week ago", popular: true },
  { id: "KB-003", title: "Tracking your delivery in real-time", excerpt: "How to use the live tracking feature, understanding ETAs, and what to do if your delivery shows unexpected delays.", category: "delivery", readTime: "2 min", views: 2100, helpful: 97, updated: "3 days ago", popular: true },
  { id: "KB-004", title: "Filing a dispute — step by step", excerpt: "When and how to file a dispute, what evidence to gather, and what to expect during the resolution process.", category: "orders", readTime: "4 min", views: 670, helpful: 88, updated: "5 days ago", popular: false },
  { id: "KB-005", title: "How refunds and credits work", excerpt: "Understanding the refund timeline, credit policies, and how to check the status of your refund request.", category: "billing", readTime: "3 min", views: 1560, helpful: 93, updated: "1 day ago", popular: true },
  { id: "KB-006", title: "Setting up your seller account", excerpt: "Everything you need to get started as a seller on TradeFlow — verification, product listings, and first sale.", category: "getting-started", readTime: "6 min", views: 3200, helpful: 96, updated: "4 days ago", popular: true },
  { id: "KB-007", title: "Packaging standards and requirements", excerpt: "Required packaging materials, labeling standards, and best practices for different product categories.", category: "quality", readTime: "4 min", views: 420, helpful: 85, updated: "2 weeks ago", popular: false },
  { id: "KB-008", title: "Managing multiple delivery addresses", excerpt: "How to add, edit, and prioritize delivery addresses for both individual and B2B accounts.", category: "delivery", readTime: "2 min", views: 780, helpful: 90, updated: "1 week ago", popular: false },
];

export function KnowledgeBase() {
  const { addEnergy } = useBounce();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = articles.filter(a => {
    if (selectedCategory && a.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
    }
    return true;
  });

  const popularArticles = articles.filter(a => a.popular).slice(0, 4);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground tracking-tight mb-1">Knowledge Base</h1>
          <p className="text-muted-foreground text-[0.875rem]">
            Guides, tutorials, and answers — everything you need in one place.
          </p>
        </div>
        <BounceButton variant="primary" size="sm" icon={<FileText size={15} />} energyWeight={1.5}>
          New Article
        </BounceButton>
      </div>

      {/* Search — THE KING */}
      <motion.div
        className="bg-card rounded-[1.5rem] p-8 sm:p-10
          shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.03)]
          relative overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Warm gradient */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(1,113,227,0.04) 0%, transparent 70%)" }}
        />

        <div className="text-center mb-6">
          <motion.p
            className="text-[1.125rem] text-foreground/70"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            How can we help you today?
          </motion.p>
        </div>

        <motion.div
          className="relative max-w-[560px] mx-auto"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers, guides, tutorials..."
            className="w-full bg-background/60 border border-black/[0.04] rounded-2xl
              pl-13 pr-5 py-4 text-[0.9375rem] text-foreground
              placeholder:text-muted-foreground/30
              focus:outline-none focus:border-primary/20 focus:shadow-[0_0_0_3px_rgba(1,113,227,0.06)]
              transition-all duration-300"
          />
        </motion.div>

        {/* Quick suggestion tags */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <span className="text-[0.6875rem] text-muted-foreground/30">Popular:</span>
          {["recurring orders", "tracking", "refunds", "quality reports"].map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="text-[0.6875rem] text-primary/50 hover:text-primary px-2.5 py-1 rounded-lg
                hover:bg-primary/[0.04] transition-all duration-200 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Categories — warm, inviting cards */}
      <div>
        <p className="text-muted-foreground/40 text-[0.6875rem] tracking-[0.05em] uppercase mb-5">
          Browse by topic
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.key}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 cursor-pointer ${
                selectedCategory === cat.key
                  ? "bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)]"
                  : "bg-card/50 hover:bg-card hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.03)]"
              }`}
              onClick={() => {
                addEnergy(0.4);
                setSelectedCategory(selectedCategory === cat.key ? null : cat.key);
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${cat.color}08`, color: `${cat.color}AA` }}>
                {cat.icon}
              </div>
              <div className="text-center">
                <p className="text-[0.8125rem] text-foreground/70">{cat.label}</p>
                <p className="text-[0.625rem] text-muted-foreground/30 mt-0.5">{cat.count} articles</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-muted-foreground/40 text-[0.6875rem] tracking-[0.05em] uppercase">
            {selectedCategory
              ? `${categories.find(c => c.key === selectedCategory)?.label || ""} Articles`
              : searchQuery
              ? `Results for "${searchQuery}"`
              : "Popular Articles"}
          </p>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[0.6875rem] text-primary/50 hover:text-primary cursor-pointer transition-colors"
            >
              Show all
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {(searchQuery || selectedCategory ? filtered : popularArticles).map((article, i) => {
            const cat = categories.find(c => c.key === article.category);

            return (
              <motion.div
                key={article.id}
                className="bg-card rounded-2xl p-5 cursor-pointer group
                  shadow-[0_0_0_1px_rgba(0,0,0,0.02)]
                  hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)]
                  transition-all duration-300"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${cat?.color || "#7A7D80"}08`, color: `${cat?.color || "#7A7D80"}80` }}>
                    {cat?.icon || <FileText size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[0.9375rem] text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-[0.8125rem] text-muted-foreground/45 mt-1 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/20 group-hover:text-muted-foreground/50
                        transition-colors flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[0.6875rem] text-muted-foreground/30">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {article.readTime} read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {article.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={11} />
                        {article.helpful}% helpful
                      </span>
                      <span className="text-muted-foreground/20">
                        Updated {article.updated}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (searchQuery || selectedCategory) && (
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <HelpCircle size={40} className="text-muted-foreground/15 mb-4" />
              <p className="text-[0.9375rem] text-foreground/50">No articles found</p>
              <p className="text-[0.75rem] text-muted-foreground/35 mt-1">
                Try a different search term or browse by category
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact support CTA — warmth */}
      <motion.div
        className="bg-card rounded-[1.5rem] p-8
          shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.02)]
          flex flex-col sm:flex-row items-center gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center flex-shrink-0">
          <Lightbulb size={24} className="text-primary/50" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[0.9375rem] text-foreground/70">Can't find what you're looking for?</p>
          <p className="text-[0.8125rem] text-muted-foreground/40 mt-0.5">
            Our support team is here to help — average response time is under 24 minutes.
          </p>
        </div>
        <BounceButton variant="primary" size="md" icon={<MessageCircle size={16} />} energyWeight={1.5}>
          Contact Support
        </BounceButton>
      </motion.div>
    </div>
  );
}