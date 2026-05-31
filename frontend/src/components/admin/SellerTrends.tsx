"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, TrendingUp, ChevronDown, Flame, Zap, Star, ArrowUp, ArrowDown,
  Eye, ShoppingCart, Globe, Hash, Play, Heart,
  ChevronLeft, ChevronRight, Copy, ExternalLink, Award,
  Sparkles, Filter, X, Users, Package, DollarSign, ArrowRight,
  BarChart3, Calendar, MapPin, CircleDollarSign, Wallet, BadgeDollarSign
} from "lucide-react";
import { BounceButton } from "./BounceButton";
import { StatusPill } from "./StatusPill";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fmtMoney as fmtMoneyUtil } from "@/lib/utils";

// ── Images ─────────────────────────────────────────────────────

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1766482280244-afd07a7028fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1572714792868-c203eaf84b43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1610128361323-6e941c97f023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1723392197044-515b81ec57cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1643185720431-9c050eebbc9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1591923271591-478bb32b57ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1759766409687-7f624d6dc59e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1761702790943-82bb9ce2be14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1602143407151-7111542de6e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
];

const REEL_THUMBNAILS = [
  "https://images.unsplash.com/photo-1720190370264-15c444358c76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
  "https://images.unsplash.com/photo-1701518035740-a33935aeb3ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
  "https://images.unsplash.com/photo-1740819920986-8462590eccdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
  "https://images.unsplash.com/photo-1762994576926-b8268190a2c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
  "https://images.unsplash.com/photo-1601401032300-da7e3f5b1485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
  "https://images.unsplash.com/photo-1610442259563-e2c279eaf683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
];

// ── Filter options ─────────────────────────────────────────────

const industries = [
  { value: "all", label: "All Industries" },
  { value: "home", label: "Home & Living" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "beauty", label: "Beauty & Skincare" },
  { value: "food", label: "Food & Beverages" },
  { value: "health", label: "Health & Wellness" },
  { value: "sports", label: "Sports & Outdoors" },
];

const countries = [
  { code: "all", name: "All Regions", flag: "🌍" },
  { code: "pk", name: "Pakistan", flag: "🇵🇰" },
  { code: "bd", name: "Bangladesh", flag: "🇧🇩" },
  { code: "ae", name: "UAE", flag: "🇦🇪" },
  { code: "sa", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
  { code: "kw", name: "Kuwait", flag: "🇰🇼" },
];

const timeRanges = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "120d", label: "120 days" },
];

type BadgeType = "breakout" | "popular" | "new" | "rising";

// ── Product data (with transaction values) ─────────────────────

interface TrendProduct {
  id: string;
  rank: number;
  name: string;
  category: string;
  image: string;
  popularity: number;
  orders7d: number;
  views7d: number;
  revenue7d: number;
  avgPrice: number;
  change: number;
  badge: BadgeType;
  sparkline: number[];
  topMarkets: { name: string; flag: string; orders: number; revenue: number }[];
  weeklyData: { day: string; orders: number; revenue: number }[];
  relatedKeywords: string[];
  sellers: number;
}

const spark = (t: "up" | "down" | "stable"): number[] => {
  const b = t === "up" ? 30 : t === "down" ? 70 : 50;
  return Array.from({ length: 14 }, (_, i) => {
    const n = Math.random() * 20 - 10;
    if (t === "up") return Math.min(100, b + i * 4 + n);
    if (t === "down") return Math.max(10, b - i * 3 + n);
    return b + n;
  });
};

const trendingProducts: TrendProduct[] = [
  {
    id: "tp-1", rank: 1, name: "Organic Herbal Tea Blend", category: "Food & Beverages",
    image: PRODUCT_IMAGES[0], popularity: 98, orders7d: 12400, views7d: 890000, revenue7d: 309752, avgPrice: 24.98,
    change: 142, badge: "breakout", sparkline: spark("up"),
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", orders: 4200, revenue: 104916 },
      { name: "Bangladesh", flag: "🇧🇩", orders: 3100, revenue: 77438 },
      { name: "Kuwait", flag: "🇰🇼", orders: 1800, revenue: 44964 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 1600, revenue: 39968 },
      { name: "UAE", flag: "🇦🇪", orders: 1700, revenue: 42466 },
    ],
    weeklyData: [
      { day: "Mon", orders: 1400, revenue: 34972 }, { day: "Tue", orders: 1800, revenue: 44964 },
      { day: "Wed", orders: 2100, revenue: 52458 }, { day: "Thu", orders: 1900, revenue: 47462 },
      { day: "Fri", orders: 2400, revenue: 59952 }, { day: "Sat", orders: 1600, revenue: 39968 },
      { day: "Sun", orders: 1200, revenue: 29976 },
    ],
    relatedKeywords: ["herbal tea", "organic tea", "green tea", "wellness drink", "detox tea"],
    sellers: 34,
  },
  {
    id: "tp-2", rank: 2, name: "Smart LED Panel Light B200", category: "Electronics",
    image: PRODUCT_IMAGES[1], popularity: 92, orders7d: 8900, views7d: 620000, revenue7d: 800100, avgPrice: 89.90,
    change: 67, badge: "popular", sparkline: spark("up"),
    topMarkets: [
      { name: "UAE", flag: "🇦🇪", orders: 2800, revenue: 251720 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 2400, revenue: 215760 },
      { name: "Pakistan", flag: "🇵🇰", orders: 1500, revenue: 134850 },
      { name: "Kuwait", flag: "🇰🇼", orders: 1100, revenue: 98890 },
      { name: "UK", flag: "🇬🇧", orders: 1100, revenue: 98890 },
    ],
    weeklyData: [
      { day: "Mon", orders: 1100, revenue: 98890 }, { day: "Tue", orders: 1300, revenue: 116870 },
      { day: "Wed", orders: 1500, revenue: 134850 }, { day: "Thu", orders: 1200, revenue: 107880 },
      { day: "Fri", orders: 1600, revenue: 143840 }, { day: "Sat", orders: 1000, revenue: 89900 },
      { day: "Sun", orders: 1200, revenue: 107880 },
    ],
    relatedKeywords: ["led panel", "smart light", "home lighting", "rgb light", "ceiling panel"],
    sellers: 18,
  },
  {
    id: "tp-3", rank: 3, name: "Handmade Ceramic Vase Set", category: "Home & Living",
    image: PRODUCT_IMAGES[2], popularity: 87, orders7d: 6200, views7d: 480000, revenue7d: 278620, avgPrice: 44.94,
    change: 34, badge: "rising", sparkline: spark("up"),
    topMarkets: [
      { name: "United States", flag: "🇺🇸", orders: 1800, revenue: 80892 },
      { name: "UAE", flag: "🇦🇪", orders: 1500, revenue: 67410 },
      { name: "UK", flag: "🇬🇧", orders: 1200, revenue: 53928 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 900, revenue: 40446 },
      { name: "Pakistan", flag: "🇵🇰", orders: 800, revenue: 35952 },
    ],
    weeklyData: [
      { day: "Mon", orders: 800, revenue: 35952 }, { day: "Tue", orders: 900, revenue: 40446 },
      { day: "Wed", orders: 1000, revenue: 44940 }, { day: "Thu", orders: 850, revenue: 38199 },
      { day: "Fri", orders: 950, revenue: 42693 }, { day: "Sat", orders: 800, revenue: 35952 },
      { day: "Sun", orders: 900, revenue: 40446 },
    ],
    relatedKeywords: ["ceramic vase", "home decor", "artisan pottery", "minimalist vase", "handmade"],
    sellers: 12,
  },
  {
    id: "tp-4", rank: 4, name: "Natural Glow Skincare Kit", category: "Beauty & Skincare",
    image: PRODUCT_IMAGES[3], popularity: 84, orders7d: 5800, views7d: 440000, revenue7d: 202420, avgPrice: 34.90,
    change: 89, badge: "breakout", sparkline: spark("up"),
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", orders: 2200, revenue: 76780 },
      { name: "Bangladesh", flag: "🇧🇩", orders: 1500, revenue: 52350 },
      { name: "UAE", flag: "🇦🇪", orders: 900, revenue: 31410 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 700, revenue: 24430 },
      { name: "UK", flag: "🇬🇧", orders: 500, revenue: 17450 },
    ],
    weeklyData: [
      { day: "Mon", orders: 700, revenue: 24430 }, { day: "Tue", orders: 850, revenue: 29665 },
      { day: "Wed", orders: 920, revenue: 32108 }, { day: "Thu", orders: 800, revenue: 27920 },
      { day: "Fri", orders: 1100, revenue: 38390 }, { day: "Sat", orders: 750, revenue: 26175 },
      { day: "Sun", orders: 680, revenue: 23732 },
    ],
    relatedKeywords: ["skincare", "organic beauty", "glow serum", "face cream", "natural cosmetics"],
    sellers: 22,
  },
  {
    id: "tp-5", rank: 5, name: "Bamboo Kitchen Utensil Set", category: "Home & Living",
    image: PRODUCT_IMAGES[4], popularity: 79, orders7d: 4500, views7d: 320000, revenue7d: 130050, avgPrice: 28.90,
    change: 28, badge: "popular", sparkline: spark("stable"),
    topMarkets: [
      { name: "United States", flag: "🇺🇸", orders: 1400, revenue: 40460 },
      { name: "UK", flag: "🇬🇧", orders: 1100, revenue: 31790 },
      { name: "UAE", flag: "🇦🇪", orders: 800, revenue: 23120 },
      { name: "Pakistan", flag: "🇵🇰", orders: 650, revenue: 18785 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 550, revenue: 15895 },
    ],
    weeklyData: [
      { day: "Mon", orders: 600, revenue: 17340 }, { day: "Tue", orders: 650, revenue: 18785 },
      { day: "Wed", orders: 700, revenue: 20230 }, { day: "Thu", orders: 620, revenue: 17918 },
      { day: "Fri", orders: 680, revenue: 19652 }, { day: "Sat", orders: 580, revenue: 16762 },
      { day: "Sun", orders: 670, revenue: 19363 },
    ],
    relatedKeywords: ["bamboo utensils", "eco kitchen", "sustainable", "wooden spoons", "cooking set"],
    sellers: 15,
  },
  {
    id: "tp-6", rank: 6, name: "Wireless Pro Earbuds X3", category: "Electronics",
    image: PRODUCT_IMAGES[5], popularity: 76, orders7d: 4100, views7d: 290000, revenue7d: 286590, avgPrice: 69.90,
    change: -5, badge: "popular", sparkline: spark("stable"),
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", orders: 1400, revenue: 97860 },
      { name: "UAE", flag: "🇦🇪", orders: 1000, revenue: 69900 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 800, revenue: 55920 },
      { name: "Bangladesh", flag: "🇧🇩", orders: 500, revenue: 34950 },
      { name: "UK", flag: "🇬🇧", orders: 400, revenue: 27960 },
    ],
    weeklyData: [
      { day: "Mon", orders: 550, revenue: 38445 }, { day: "Tue", orders: 600, revenue: 41940 },
      { day: "Wed", orders: 620, revenue: 43338 }, { day: "Thu", orders: 580, revenue: 40542 },
      { day: "Fri", orders: 640, revenue: 44736 }, { day: "Sat", orders: 520, revenue: 36348 },
      { day: "Sun", orders: 590, revenue: 41241 },
    ],
    relatedKeywords: ["wireless earbuds", "bluetooth", "noise cancelling", "earphones", "audio"],
    sellers: 28,
  },
  {
    id: "tp-7", rank: 7, name: "Artisan Soy Wax Candle", category: "Home & Living",
    image: PRODUCT_IMAGES[6], popularity: 71, orders7d: 3600, views7d: 250000, revenue7d: 79200, avgPrice: 22.00,
    change: 45, badge: "new", sparkline: spark("up"),
    topMarkets: [
      { name: "United States", flag: "🇺🇸", orders: 1200, revenue: 26400 },
      { name: "UK", flag: "🇬🇧", orders: 900, revenue: 19800 },
      { name: "UAE", flag: "🇦🇪", orders: 600, revenue: 13200 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 500, revenue: 11000 },
      { name: "Pakistan", flag: "🇵🇰", orders: 400, revenue: 8800 },
    ],
    weeklyData: [
      { day: "Mon", orders: 450, revenue: 9900 }, { day: "Tue", orders: 520, revenue: 11440 },
      { day: "Wed", orders: 580, revenue: 12760 }, { day: "Thu", orders: 500, revenue: 11000 },
      { day: "Fri", orders: 550, revenue: 12100 }, { day: "Sat", orders: 480, revenue: 10560 },
      { day: "Sun", orders: 520, revenue: 11440 },
    ],
    relatedKeywords: ["soy candle", "aromatherapy", "handmade candle", "home fragrance", "gift"],
    sellers: 9,
  },
  {
    id: "tp-8", rank: 8, name: "Eco Cotton Tote Bag", category: "Fashion & Apparel",
    image: PRODUCT_IMAGES[7], popularity: 68, orders7d: 3200, views7d: 210000, revenue7d: 60800, avgPrice: 19.00,
    change: 18, badge: "rising", sparkline: spark("up"),
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", orders: 1100, revenue: 20900 },
      { name: "Bangladesh", flag: "🇧🇩", orders: 800, revenue: 15200 },
      { name: "UAE", flag: "🇦🇪", orders: 500, revenue: 9500 },
      { name: "UK", flag: "🇬🇧", orders: 400, revenue: 7600 },
      { name: "US", flag: "🇺🇸", orders: 400, revenue: 7600 },
    ],
    weeklyData: [
      { day: "Mon", orders: 400, revenue: 7600 }, { day: "Tue", orders: 460, revenue: 8740 },
      { day: "Wed", orders: 500, revenue: 9500 }, { day: "Thu", orders: 440, revenue: 8360 },
      { day: "Fri", orders: 490, revenue: 9310 }, { day: "Sat", orders: 420, revenue: 7980 },
      { day: "Sun", orders: 490, revenue: 9310 },
    ],
    relatedKeywords: ["tote bag", "eco bag", "cotton bag", "reusable bag", "fashion accessory"],
    sellers: 20,
  },
  {
    id: "tp-9", rank: 9, name: "Insulated Steel Bottle 750ml", category: "Sports & Outdoors",
    image: PRODUCT_IMAGES[8], popularity: 64, orders7d: 2800, views7d: 190000, revenue7d: 83720, avgPrice: 29.90,
    change: 12, badge: "popular", sparkline: spark("stable"),
    topMarkets: [
      { name: "UAE", flag: "🇦🇪", orders: 800, revenue: 23920 },
      { name: "Saudi Arabia", flag: "🇸🇦", orders: 700, revenue: 20930 },
      { name: "Pakistan", flag: "🇵🇰", orders: 550, revenue: 16445 },
      { name: "US", flag: "🇺🇸", orders: 400, revenue: 11960 },
      { name: "UK", flag: "🇬🇧", orders: 350, revenue: 10465 },
    ],
    weeklyData: [
      { day: "Mon", orders: 350, revenue: 10465 }, { day: "Tue", orders: 400, revenue: 11960 },
      { day: "Wed", orders: 430, revenue: 12857 }, { day: "Thu", orders: 380, revenue: 11362 },
      { day: "Fri", orders: 420, revenue: 12558 }, { day: "Sat", orders: 370, revenue: 11063 },
      { day: "Sun", orders: 450, revenue: 13455 },
    ],
    relatedKeywords: ["water bottle", "steel bottle", "insulated", "gym bottle", "eco bottle"],
    sellers: 14,
  },
];

// ── Seller data (enriched with full sales data) ────────────────

interface SellerData {
  rank: number;
  name: string;
  avatar: string;
  orders: number;
  revenue: number;
  products: number;
  rating: number;
  change: number;
  avgOrderValue: number;
  joinedMonthsAgo: number;
  topProducts: { name: string; image: string; orders: number; revenue: number }[];
  monthlySales: { month: string; orders: number; revenue: number }[];
  topMarkets: { name: string; flag: string; revenue: number }[];
  returnRate: number;
  repeatBuyerRate: number;
}

const topSellers: SellerData[] = [
  {
    rank: 1, name: "GreenLeaf Organics", avatar: "GO", orders: 15400, revenue: 384692,
    products: 12, rating: 4.9, change: 18, avgOrderValue: 24.98, joinedMonthsAgo: 14,
    topProducts: [
      { name: "Organic Herbal Tea Blend", image: PRODUCT_IMAGES[0], orders: 12400, revenue: 309752 },
      { name: "Green Matcha Powder", image: PRODUCT_IMAGES[4], orders: 2100, revenue: 52458 },
      { name: "Dried Chamomile Buds", image: PRODUCT_IMAGES[6], orders: 900, revenue: 22482 },
    ],
    monthlySales: [
      { month: "Oct", orders: 8200, revenue: 204836 }, { month: "Nov", orders: 9400, revenue: 234812 },
      { month: "Dec", orders: 11200, revenue: 279776 }, { month: "Jan", orders: 12800, revenue: 319744 },
      { month: "Feb", orders: 14100, revenue: 352218 }, { month: "Mar", orders: 15400, revenue: 384692 },
    ],
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", revenue: 142600 },
      { name: "Bangladesh", flag: "🇧🇩", revenue: 98400 },
      { name: "Kuwait", flag: "🇰🇼", revenue: 62800 },
      { name: "UAE", flag: "🇦🇪", revenue: 48200 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 32692 },
    ],
    returnRate: 1.2, repeatBuyerRate: 68,
  },
  {
    rank: 2, name: "Meridian Corp", avatar: "MC", orders: 12800, revenue: 1150720,
    products: 8, rating: 4.8, change: 12, avgOrderValue: 89.90, joinedMonthsAgo: 22,
    topProducts: [
      { name: "Smart LED Panel B200", image: PRODUCT_IMAGES[1], orders: 8900, revenue: 800100 },
      { name: "Industrial Filter Set", image: PRODUCT_IMAGES[5], orders: 2400, revenue: 215760 },
      { name: "Modular Shelf System", image: PRODUCT_IMAGES[2], orders: 1500, revenue: 134850 },
    ],
    monthlySales: [
      { month: "Oct", orders: 7800, revenue: 701220 }, { month: "Nov", orders: 8900, revenue: 800100 },
      { month: "Dec", orders: 10200, revenue: 916980 }, { month: "Jan", orders: 11000, revenue: 988900 },
      { month: "Feb", orders: 12000, revenue: 1078800 }, { month: "Mar", orders: 12800, revenue: 1150720 },
    ],
    topMarkets: [
      { name: "UAE", flag: "🇦🇪", revenue: 412600 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 298200 },
      { name: "Pakistan", flag: "🇵🇰", revenue: 208400 },
      { name: "Kuwait", flag: "🇰🇼", revenue: 138400 },
      { name: "UK", flag: "🇬🇧", revenue: 93120 },
    ],
    returnRate: 2.1, repeatBuyerRate: 55,
  },
  {
    rank: 3, name: "BrightStar Electronics", avatar: "BE", orders: 11200, revenue: 783440,
    products: 15, rating: 4.7, change: -3, avgOrderValue: 69.95, joinedMonthsAgo: 18,
    topProducts: [
      { name: "Wireless Pro Earbuds X3", image: PRODUCT_IMAGES[5], orders: 4100, revenue: 286590 },
      { name: "USB-C Hub Pro", image: PRODUCT_IMAGES[1], orders: 3800, revenue: 265810 },
      { name: "Portable Charger 20K", image: PRODUCT_IMAGES[8], orders: 3300, revenue: 230835 },
    ],
    monthlySales: [
      { month: "Oct", orders: 10800, revenue: 755460 }, { month: "Nov", orders: 11500, revenue: 804425 },
      { month: "Dec", orders: 12200, revenue: 853390 }, { month: "Jan", orders: 11800, revenue: 825410 },
      { month: "Feb", orders: 11400, revenue: 797430 }, { month: "Mar", orders: 11200, revenue: 783440 },
    ],
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", revenue: 298200 },
      { name: "UAE", flag: "🇦🇪", revenue: 198400 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 148200 },
      { name: "Bangladesh", flag: "🇧🇩", revenue: 82400 },
      { name: "UK", flag: "🇬🇧", revenue: 56240 },
    ],
    returnRate: 3.4, repeatBuyerRate: 42,
  },
  {
    rank: 4, name: "FreshPack Foods", avatar: "FF", orders: 9800, revenue: 322412,
    products: 6, rating: 4.9, change: 25, avgOrderValue: 32.90, joinedMonthsAgo: 10,
    topProducts: [
      { name: "Protein Energy Bars 24pk", image: PRODUCT_IMAGES[3], orders: 5800, revenue: 190820 },
      { name: "Trail Mix Variety Pack", image: PRODUCT_IMAGES[0], orders: 2400, revenue: 78960 },
      { name: "Organic Granola Bites", image: PRODUCT_IMAGES[4], orders: 1600, revenue: 52640 },
    ],
    monthlySales: [
      { month: "Oct", orders: 5200, revenue: 171080 }, { month: "Nov", orders: 6400, revenue: 210560 },
      { month: "Dec", orders: 7200, revenue: 236880 }, { month: "Jan", orders: 8000, revenue: 263200 },
      { month: "Feb", orders: 9000, revenue: 296100 }, { month: "Mar", orders: 9800, revenue: 322412 },
    ],
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", revenue: 128400 },
      { name: "Bangladesh", flag: "🇧🇩", revenue: 82800 },
      { name: "UAE", flag: "🇦🇪", revenue: 52400 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 38200 },
      { name: "Kuwait", flag: "🇰🇼", revenue: 20612 },
    ],
    returnRate: 0.8, repeatBuyerRate: 74,
  },
  {
    rank: 5, name: "Atlas Materials", avatar: "AM", orders: 8400, revenue: 587160,
    products: 10, rating: 4.6, change: 8, avgOrderValue: 69.90, joinedMonthsAgo: 26,
    topProducts: [
      { name: "Composite Sheet A4", image: PRODUCT_IMAGES[2], orders: 3200, revenue: 223680 },
      { name: "Industrial Adhesive Kit", image: PRODUCT_IMAGES[8], orders: 2800, revenue: 195720 },
      { name: "Thermal Insulation Roll", image: PRODUCT_IMAGES[1], orders: 2400, revenue: 167760 },
    ],
    monthlySales: [
      { month: "Oct", orders: 7400, revenue: 517260 }, { month: "Nov", orders: 7600, revenue: 531240 },
      { month: "Dec", orders: 7800, revenue: 545220 }, { month: "Jan", orders: 8000, revenue: 559200 },
      { month: "Feb", orders: 8200, revenue: 573180 }, { month: "Mar", orders: 8400, revenue: 587160 },
    ],
    topMarkets: [
      { name: "UAE", flag: "🇦🇪", revenue: 218200 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 168400 },
      { name: "Pakistan", flag: "🇵🇰", revenue: 108200 },
      { name: "Kuwait", flag: "🇰🇼", revenue: 58400 },
      { name: "Bahrain", flag: "🇧🇭", revenue: 33960 },
    ],
    returnRate: 1.8, repeatBuyerRate: 61,
  },
  {
    rank: 6, name: "Luna Artisan Co.", avatar: "LA", orders: 7200, revenue: 323640,
    products: 18, rating: 4.8, change: 42, avgOrderValue: 44.95, joinedMonthsAgo: 8,
    topProducts: [
      { name: "Handmade Ceramic Vase", image: PRODUCT_IMAGES[2], orders: 3200, revenue: 143840 },
      { name: "Artisan Soy Candle", image: PRODUCT_IMAGES[6], orders: 2400, revenue: 107880 },
      { name: "Woven Wall Hanging", image: PRODUCT_IMAGES[7], orders: 1600, revenue: 71920 },
    ],
    monthlySales: [
      { month: "Oct", orders: 3200, revenue: 143840 }, { month: "Nov", orders: 4100, revenue: 184295 },
      { month: "Dec", orders: 5200, revenue: 233740 }, { month: "Jan", orders: 5800, revenue: 260710 },
      { month: "Feb", orders: 6500, revenue: 292175 }, { month: "Mar", orders: 7200, revenue: 323640 },
    ],
    topMarkets: [
      { name: "United States", flag: "🇺🇸", revenue: 124200 },
      { name: "UK", flag: "🇬🇧", revenue: 82400 },
      { name: "UAE", flag: "🇦🇪", revenue: 58200 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 38400 },
      { name: "Pakistan", flag: "🇵🇰", revenue: 20440 },
    ],
    returnRate: 1.5, repeatBuyerRate: 58,
  },
  {
    rank: 7, name: "EcoWare Solutions", avatar: "ES", orders: 6800, revenue: 196520,
    products: 9, rating: 4.7, change: 15, avgOrderValue: 28.90, joinedMonthsAgo: 12,
    topProducts: [
      { name: "Bamboo Kitchen Set", image: PRODUCT_IMAGES[4], orders: 3200, revenue: 92480 },
      { name: "Eco Cotton Tote Bag", image: PRODUCT_IMAGES[7], orders: 2000, revenue: 57800 },
      { name: "Reusable Food Wraps", image: PRODUCT_IMAGES[0], orders: 1600, revenue: 46240 },
    ],
    monthlySales: [
      { month: "Oct", orders: 4200, revenue: 121380 }, { month: "Nov", orders: 4800, revenue: 138720 },
      { month: "Dec", orders: 5400, revenue: 156060 }, { month: "Jan", orders: 5900, revenue: 170510 },
      { month: "Feb", orders: 6400, revenue: 184960 }, { month: "Mar", orders: 6800, revenue: 196520 },
    ],
    topMarkets: [
      { name: "Pakistan", flag: "🇵🇰", revenue: 72400 },
      { name: "Bangladesh", flag: "🇧🇩", revenue: 48200 },
      { name: "UAE", flag: "🇦🇪", revenue: 32800 },
      { name: "UK", flag: "🇬🇧", revenue: 24400 },
      { name: "US", flag: "🇺🇸", revenue: 18720 },
    ],
    returnRate: 2.0, repeatBuyerRate: 52,
  },
  {
    rank: 8, name: "Zenith Home", avatar: "ZH", orders: 5900, revenue: 265310,
    products: 22, rating: 4.5, change: 6, avgOrderValue: 44.97, joinedMonthsAgo: 20,
    topProducts: [
      { name: "Decorative Throw Pillows", image: PRODUCT_IMAGES[2], orders: 2200, revenue: 98934 },
      { name: "Macramé Plant Hanger", image: PRODUCT_IMAGES[6], orders: 1800, revenue: 80946 },
      { name: "LED String Lights", image: PRODUCT_IMAGES[1], orders: 1900, revenue: 85443 },
    ],
    monthlySales: [
      { month: "Oct", orders: 5000, revenue: 224850 }, { month: "Nov", orders: 5200, revenue: 233844 },
      { month: "Dec", orders: 5500, revenue: 247335 }, { month: "Jan", orders: 5600, revenue: 251832 },
      { month: "Feb", orders: 5800, revenue: 260826 }, { month: "Mar", orders: 5900, revenue: 265310 },
    ],
    topMarkets: [
      { name: "UAE", flag: "🇦🇪", revenue: 92400 },
      { name: "Saudi Arabia", flag: "🇸🇦", revenue: 68200 },
      { name: "Pakistan", flag: "🇵🇰", revenue: 48400 },
      { name: "US", flag: "🇺🇸", revenue: 32400 },
      { name: "UK", flag: "🇬🇧", revenue: 23910 },
    ],
    returnRate: 2.8, repeatBuyerRate: 45,
  },
];

const trendingKeywords = [
  { keyword: "organic tea", volume: 45200, change: 34, competition: "low" as const },
  { keyword: "sustainable packaging", volume: 38400, change: 67, competition: "medium" as const },
  { keyword: "handmade pottery", volume: 32100, change: 22, competition: "low" as const },
  { keyword: "smart home lighting", volume: 28900, change: 15, competition: "high" as const },
  { keyword: "natural skincare", volume: 26500, change: 89, competition: "medium" as const },
  { keyword: "bamboo products", volume: 24300, change: 41, competition: "low" as const },
  { keyword: "wireless earbuds", volume: 22800, change: -3, competition: "high" as const },
  { keyword: "soy candle set", volume: 19600, change: 55, competition: "low" as const },
  { keyword: "cotton tote bag", volume: 17200, change: 28, competition: "medium" as const },
  { keyword: "steel water bottle", volume: 15800, change: 12, competition: "medium" as const },
];

const relatedVideos = [
  { id: "v1", thumbnail: REEL_THUMBNAILS[0], title: "How I source organic teas", views: "21K", seller: "GreenLeaf" },
  { id: "v2", thumbnail: REEL_THUMBNAILS[1], title: "LED panel installation", views: "18K", seller: "BrightStar" },
  { id: "v3", thumbnail: REEL_THUMBNAILS[2], title: "Handmade jewelry process", views: "42K", seller: "Luna Artisan" },
  { id: "v4", thumbnail: REEL_THUMBNAILS[3], title: "Behind the kitchen", views: "15K", seller: "FreshPack" },
  { id: "v5", thumbnail: REEL_THUMBNAILS[4], title: "Fashion lookbook spring", views: "36K", seller: "EcoWare" },
  { id: "v6", thumbnail: REEL_THUMBNAILS[5], title: "Home decor tips", views: "28K", seller: "Zenith Home" },
];

// ── Helpers ────────────────────────────────────────────────────

const formatNum = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const formatMoney = (n: number) => fmtMoneyUtil(n);

// ── Reusable Components ────────────────────────────────────────

function TrendBadge({ type }: { type: BadgeType }) {
  const c: Record<BadgeType, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    breakout: { bg: "bg-[#E5484D]/10", text: "text-[#E5484D]", icon: <Flame size={11} />, label: "Breakout" },
    popular: { bg: "bg-[#0171E3]/10", text: "text-[#0171E3]", icon: <TrendingUp size={11} />, label: "Popular" },
    new: { bg: "bg-[#30A46C]/10", text: "text-[#30A46C]", icon: <Sparkles size={11} />, label: "New" },
    rising: { bg: "bg-[#FFB224]/10", text: "text-[#D97706]", icon: <Zap size={11} />, label: "Rising" },
  };
  const cfg = c[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function MiniSparkline({ data, color = "#30A46C", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  // Gradient fill
  const fill = pts + ` ${width},${height} 0,${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SimpleBarChart({ data, xKey, yKeys, colors }: { data: any[]; xKey: string; yKeys: string[]; colors: string[] }) {
  const maxVal = Math.max(...data.flatMap(d => yKeys.map(k => d[k])));
  return (
    <div className="flex items-end gap-1.5 h-[120px]">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-end gap-0.5 h-[100px] w-full">
            {yKeys.map((k, ki) => (
              <motion.div
                key={k}
                className="flex-1 rounded-t-md"
                style={{ backgroundColor: colors[ki], minWidth: 4 }}
                initial={{ height: 0 }}
                animate={{ height: `${(item[k] / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
              />
            ))}
          </div>
          <span className="text-[0.5625rem] text-muted-foreground">{item[xKey]}</span>
        </div>
      ))}
    </div>
  );
}

function Dropdown({ value, options, onChange, icon }: {
  value: string;
  options: { value: string; label: string; flag?: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all text-[0.8125rem] text-foreground cursor-pointer"
      >
        {icon}
        {selected?.flag && <span>{selected.flag}</span>}
        <span>{selected?.label}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full left-0 mt-1.5 bg-card border border-border/50 rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden"
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {options.map(opt => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-[0.8125rem] text-left hover:bg-muted/40 transition-colors cursor-pointer ${opt.value === value ? "text-primary bg-primary/5" : "text-foreground"}`}>
                {opt.flag && <span>{opt.flag}</span>}{opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Big Number Card (Platonic: ONE number, ONE meaning) ────────

function BigStat({ icon, iconBg, label, value, sub, delay = 0 }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; sub: string; delay?: number;
}) {
  return (
    <motion.div
      className="bg-card rounded-3xl p-6 border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    >
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[0.75rem] text-muted-foreground mb-1">{label}</p>
      <p className="text-[1.75rem] text-foreground tracking-tight leading-none mb-1.5">{value}</p>
      <p className="text-[0.6875rem] text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export function SellerTrends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState<"trending" | "breakout" | "sellers" | "keywords">("trending");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerData | null>(null);
  const [videoScrollIndex, setVideoScrollIndex] = useState(0);

  const tabs = [
    { id: "trending" as const, label: "Trending Products", icon: <TrendingUp size={15} />, emoji: "🔥" },
    { id: "breakout" as const, label: "Breakout", icon: <Flame size={15} />, emoji: "🚀" },
    { id: "sellers" as const, label: "Top Sellers", icon: <Award size={15} />, emoji: "🏆" },
    { id: "keywords" as const, label: "Keywords", icon: <Hash size={15} />, emoji: "🔍" },
  ];

  const filteredProducts = trendingProducts.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedIndustry !== "all") {
      const lbl = industries.find(i => i.value === selectedIndustry)?.label || "";
      if (!p.category.toLowerCase().includes(lbl.toLowerCase().split(" ")[0])) return false;
    }
    return true;
  });

  const breakoutProducts = filteredProducts.filter(p => p.change >= 25);

  // Totals for hero cards
  const totalOrders = filteredProducts.reduce((s, p) => s + p.orders7d, 0);
  const totalRevenue = filteredProducts.reduce((s, p) => s + p.revenue7d, 0);
  const totalViews = filteredProducts.reduce((s, p) => s + p.views7d, 0);
  const totalSellers = new Set(topSellers.map(s => s.name)).size;

  return (
    <div className="space-y-7 max-w-[1400px]">

      {/* ══ HERO: The 4 numbers that matter most ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat
          icon={<CircleDollarSign size={22} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/10"
          label="Total Sales Value"
          value={formatMoney(totalRevenue)}
          sub={`From ${formatNum(totalOrders)} orders this week`}
          delay={0}
        />
        <BigStat
          icon={<ShoppingCart size={22} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/10"
          label="Total Orders"
          value={formatNum(totalOrders)}
          sub={`Avg ${formatMoney(totalRevenue / totalOrders)} per order`}
          delay={0.04}
        />
        <BigStat
          icon={<Eye size={22} className="text-[#D97706]" />}
          iconBg="bg-[#FFB224]/10"
          label="Total Views"
          value={formatNum(totalViews)}
          sub={`${(totalOrders / totalViews * 100).toFixed(1)}% buy rate`}
          delay={0.08}
        />
        <BigStat
          icon={<Users size={22} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/10"
          label="Active Sellers"
          value={totalSellers.toString()}
          sub={`Across ${filteredProducts.length} trending products`}
          delay={0.12}
        />
      </div>

      {/* ══ SEARCH + FILTERS (clean, single row) ═════════════════ */}
      <div className="bg-card rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/40">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-xl px-4 py-2.5 focus-within:bg-card focus-within:shadow-[0_0_0_2px_rgba(1,113,227,0.15)] transition-all">
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input type="text" placeholder="Search products, categories, keywords..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[0.8125rem] text-foreground placeholder:text-muted-foreground w-full" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="cursor-pointer p-0.5 hover:bg-muted/40 rounded-lg">
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown value={selectedIndustry} options={industries.map(i => ({ value: i.value, label: i.label }))} onChange={setSelectedIndustry} icon={<Filter size={13} className="text-muted-foreground" />} />
            <Dropdown value={selectedCountry} options={countries.map(c => ({ value: c.code, label: c.name, flag: c.flag }))} onChange={setSelectedCountry} icon={<Globe size={13} className="text-muted-foreground" />} />
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
              {timeRanges.map(t => (
                <button key={t.value} onClick={() => setSelectedTimeRange(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-all cursor-pointer ${selectedTimeRange === t.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS ═════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 p-1.5 bg-card rounded-2xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[0.8125rem] transition-all flex-1 justify-center cursor-pointer ${
              activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}>
            <span className="text-[0.875rem]">{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══ TAB: TRENDING PRODUCTS ══════════════════════════════ */}
      {activeTab === "trending" && (
        <div className="space-y-3">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              className={`bg-card rounded-2xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer transition-all hover:shadow-md ${expandedProduct === product.id ? "ring-2 ring-primary/15" : ""}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
            >
              <div className="flex items-center gap-4 p-4 sm:p-5">
                {/* Rank — big & clear */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <span className="text-[1.5rem] text-foreground leading-none">{product.rank}</span>
                  {product.change > 0 ? (
                    <span className="flex items-center gap-0.5 text-[0.625rem] text-[#30A46C] mt-0.5"><ArrowUp size={9} />{product.change}%</span>
                  ) : product.change < 0 ? (
                    <span className="flex items-center gap-0.5 text-[0.625rem] text-[#E5484D] mt-0.5"><ArrowDown size={9} />{Math.abs(product.change)}%</span>
                  ) : <span className="text-[0.625rem] text-muted-foreground mt-0.5">—</span>}
                </div>

                {/* Product image & name */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                  <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.875rem] text-foreground truncate">{product.name}</p>
                  <p className="text-[0.6875rem] text-muted-foreground">{product.category}</p>
                </div>

                {/* THE KEY NUMBER: Revenue — biggest visual weight */}
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-[1.125rem] text-foreground tracking-tight">{formatMoney(product.revenue7d)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">in sales (7d)</p>
                </div>

                {/* Orders */}
                <div className="hidden md:block text-right flex-shrink-0 w-[80px]">
                  <p className="text-[0.875rem] text-foreground">{formatNum(product.orders7d)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">orders</p>
                </div>

                {/* Sparkline */}
                <div className="hidden lg:block flex-shrink-0">
                  <MiniSparkline data={product.sparkline} color={product.change >= 0 ? "#30A46C" : "#E5484D"} />
                </div>

                {/* Badge */}
                <div className="flex-shrink-0">
                  <TrendBadge type={product.badge} />
                </div>
              </div>

              {/* ── Expanded: Platonic detail card ────────────── */}
              <AnimatePresence>
                {expandedProduct === product.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="border-t border-border/30 p-5 sm:p-6 space-y-6">
                      {/* 5 big stat cards — Platonic simplicity */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { emoji: "💰", label: "Total Sales", value: formatMoney(product.revenue7d), color: "#30A46C" },
                          { emoji: "📦", label: "Orders", value: formatNum(product.orders7d), color: "#0171E3" },
                          { emoji: "👁️", label: "Views", value: formatNum(product.views7d), color: "#D97706" },
                          { emoji: "🏷️", label: "Avg Price", value: `$${product.avgPrice.toFixed(2)}`, color: "#8B5CF6" },
                          { emoji: "🏪", label: "Sellers", value: product.sellers.toString(), color: "#E5484D" },
                        ].map(s => (
                          <div key={s.label} className="rounded-2xl p-4 border border-border/20 bg-muted/8 text-center">
                            <span className="text-[1.25rem] block mb-1">{s.emoji}</span>
                            <p className="text-[1.125rem] text-foreground tracking-tight">{s.value}</p>
                            <p className="text-[0.625rem] text-muted-foreground mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Weekly chart + Top Markets side by side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-muted/8 rounded-2xl p-5 border border-border/20">
                          <p className="text-[0.875rem] text-foreground mb-1">📊 Weekly Sales</p>
                          <p className="text-[0.6875rem] text-muted-foreground mb-4">How much money came in each day</p>
                          <div className="flex items-center gap-4 mb-3 text-[0.6875rem]">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#30A46C]" />Revenue</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0171E3]" />Orders</span>
                          </div>
                          <SimpleBarChart
                            data={product.weeklyData.map(d => ({ ...d, revenueNorm: d.revenue / 30 }))}
                            xKey="day" yKeys={["orders", "revenueNorm"]} colors={["#0171E3", "#30A46C"]}
                          />
                        </div>

                        <div className="bg-muted/8 rounded-2xl p-5 border border-border/20">
                          <p className="text-[0.875rem] text-foreground mb-1">🌍 Where buyers are</p>
                          <p className="text-[0.6875rem] text-muted-foreground mb-4">Top countries buying this product</p>
                          <div className="space-y-3">
                            {product.topMarkets.map((m, mi) => (
                              <div key={m.name} className="flex items-center gap-3">
                                <span className="text-[1rem]">{m.flag}</span>
                                <span className="text-[0.8125rem] text-foreground w-[100px] truncate">{m.name}</span>
                                <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                                  <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0171E3] to-[#348DE9]"
                                    initial={{ width: 0 }} animate={{ width: `${(m.revenue / product.topMarkets[0].revenue) * 100}%` }}
                                    transition={{ duration: 0.6, delay: mi * 0.08 }} />
                                </div>
                                <span className="text-[0.75rem] text-foreground w-[60px] text-right">{formatMoney(m.revenue)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Keywords */}
                      <div>
                        <p className="text-[0.875rem] text-foreground mb-2">🔗 Related searches</p>
                        <div className="flex flex-wrap gap-2">
                          {product.relatedKeywords.map(kw => (
                            <span key={kw} className="px-3 py-1.5 rounded-full bg-muted/30 text-[0.75rem] text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-all">
                              #{kw.replace(/\s/g, "")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* ══ TAB: BREAKOUT ═══════════════════════════════════════ */}
      {activeTab === "breakout" && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[1.125rem]">🚀</span>
              <h3 className="text-foreground">Flying off the shelves!</h3>
            </div>
            <p className="text-[0.75rem] text-muted-foreground mb-5">Products growing 25%+ — people love these right now</p>

            {breakoutProducts.length === 0 ? (
              <p className="text-muted-foreground text-[0.875rem] py-8 text-center">No breakout products match your filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {breakoutProducts.map((product, i) => (
                  <motion.div key={product.id}
                    className="rounded-2xl border border-border/30 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -3 }}>
                    <div className="relative h-[140px] overflow-hidden">
                      <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2.5 left-2.5"><TrendBadge type={product.badge} /></div>
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[0.6875rem] flex items-center gap-1">
                        <ArrowUp size={10} />+{product.change}%
                      </div>
                      {/* Revenue overlay — Platonic: THE number */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <p className="text-[1.125rem] text-white tracking-tight">{formatMoney(product.revenue7d)}</p>
                        <p className="text-[0.5625rem] text-white/70">sales this week</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[0.8125rem] text-foreground mb-0.5">{product.name}</p>
                      <p className="text-[0.6875rem] text-muted-foreground mb-3">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75rem] text-muted-foreground">{formatNum(product.orders7d)} orders</span>
                        <MiniSparkline data={product.sparkline} color="#30A46C" width={60} height={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: TOP SELLERS (with clickable detail) ════════════ */}
      {activeTab === "sellers" && (
        <div className="bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[1.125rem]">🏆</span>
              <h3 className="text-foreground">Top Sellers</h3>
            </div>
            <p className="text-[0.75rem] text-muted-foreground">Tap any seller to see their full sales story</p>
          </div>
          <div>
            {topSellers.map((seller, i) => (
              <motion.div key={seller.rank}
                className="flex items-center gap-4 px-5 sm:px-6 py-5 border-b border-border/15 last:border-b-0 hover:bg-muted/15 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedSeller(seller)}
              >
                {/* Medal */}
                <div className="w-10 flex items-center justify-center flex-shrink-0">
                  {seller.rank <= 3 ? (
                    <span className="text-[1.5rem]">{seller.rank === 1 ? "🥇" : seller.rank === 2 ? "🥈" : "🥉"}</span>
                  ) : (
                    <span className="text-[1.125rem] text-muted-foreground">{seller.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/35 flex items-center justify-center text-[0.875rem] text-primary flex-shrink-0">
                  {seller.avatar}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[0.875rem] text-foreground truncate">{seller.name}</p>
                  <div className="flex items-center gap-3 text-[0.6875rem] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><Package size={10} />{seller.products} products</span>
                    <span className="flex items-center gap-0.5"><Star size={10} className="text-[#FFB224]" />{seller.rating}</span>
                    <span className="hidden sm:inline flex items-center gap-0.5"><Calendar size={10} />{seller.joinedMonthsAgo}mo</span>
                  </div>
                </div>

                {/* Revenue — THE big number */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-[1.25rem] text-foreground tracking-tight">{formatMoney(seller.revenue)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">total sales</p>
                </div>

                {/* Orders */}
                <div className="text-right flex-shrink-0 hidden md:block w-[70px]">
                  <p className="text-[0.875rem] text-foreground">{formatNum(seller.orders)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">orders</p>
                </div>

                {/* Change */}
                <div className={`flex items-center gap-0.5 text-[0.8125rem] flex-shrink-0 ${seller.change > 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                  {seller.change > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(seller.change)}%
                </div>

                <ArrowRight size={16} className="text-muted-foreground/40 flex-shrink-0 hidden sm:block" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: KEYWORDS ══════════════════════════════════════ */}
      {activeTab === "keywords" && (
        <div className="bg-card rounded-3xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[1.125rem]">🔍</span>
              <h3 className="text-foreground">What buyers search for</h3>
            </div>
            <p className="text-[0.75rem] text-muted-foreground">The words people type when they want to buy something</p>
          </div>
          <div>
            {trendingKeywords.map((kw, i) => (
              <motion.div key={kw.keyword}
                className="flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-border/15 last:border-b-0 hover:bg-muted/15 transition-all"
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <span className="text-[0.9375rem] text-muted-foreground w-6 text-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-[0.875rem] text-foreground truncate">{kw.keyword}</span>
                  {kw.change > 50 && <TrendBadge type="breakout" />}
                  {kw.change > 20 && kw.change <= 50 && <TrendBadge type="rising" />}
                </div>
                <div className="hidden sm:block text-right flex-shrink-0 w-[80px]">
                  <p className="text-[0.875rem] text-foreground">{formatNum(kw.volume)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">searches</p>
                </div>
                <div className={`flex items-center gap-0.5 text-[0.8125rem] flex-shrink-0 w-[50px] justify-end ${kw.change > 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                  {kw.change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(kw.change)}%
                </div>
                <div className="hidden md:block flex-shrink-0">
                  <StatusPill
                    status={kw.competition === "low" ? "success" : kw.competition === "medium" ? "warning" : "error"}
                    label={kw.competition === "low" ? "Easy" : kw.competition === "medium" ? "Medium" : "Competitive"}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RELATED VIDEOS ═══════════════════════════════════════ */}
      <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[1rem]">🎬</span>
              <h3 className="text-foreground">Seller Videos</h3>
            </div>
            <p className="text-[0.6875rem] text-muted-foreground mt-0.5">Watch sellers show off their products</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setVideoScrollIndex(Math.max(0, videoScrollIndex - 1))}
            className={`absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-all ${videoScrollIndex === 0 ? "opacity-30 pointer-events-none" : ""}`}>
            <ChevronLeft size={18} />
          </button>
          <div className="overflow-hidden">
            <motion.div className="flex gap-3" animate={{ x: -(videoScrollIndex * 280) }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              {relatedVideos.map(video => (
                <motion.div key={video.id} className="flex-shrink-0 w-[160px] sm:w-[200px] cursor-pointer group" whileHover={{ y: -3 }}>
                  <div className="relative rounded-xl overflow-hidden aspect-[9/16] bg-muted/30">
                    <ImageWithFallback src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/50 transition-all">
                        <Play size={18} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[0.6875rem] text-white/90 truncate">{video.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Play size={9} className="text-white/70" />
                        <span className="text-[0.625rem] text-white/70">{video.views}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <button onClick={() => setVideoScrollIndex(Math.min(Math.ceil(relatedVideos.length / 4) - 1, videoScrollIndex + 1))}
            className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-all ${videoScrollIndex >= Math.ceil(relatedVideos.length / 4) - 1 ? "opacity-30 pointer-events-none" : ""}`}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
           SELLER DETAIL SLIDE-OUT PANEL
           — Platonic: each section = ONE clear question answered
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedSeller && (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedSeller(null)} />
            <motion.div
              className="relative w-full max-w-[560px] h-full bg-card shadow-2xl overflow-y-auto"
              initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* ── Header ─────────────────────────────────────── */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/40 flex items-center justify-center text-[1.125rem] text-primary">
                      {selectedSeller.avatar}
                    </div>
                    <div>
                      <h2 className="text-foreground">{selectedSeller.name}</h2>
                      <div className="flex items-center gap-3 text-[0.6875rem] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Star size={10} className="text-[#FFB224]" />{selectedSeller.rating}</span>
                        <span>{selectedSeller.products} products</span>
                        <span>Joined {selectedSeller.joinedMonthsAgo} months ago</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSeller(null)} className="p-2 rounded-xl hover:bg-muted/40 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">

                {/* ── Section 1: How much did they sell? ────────── */}
                <div>
                  <p className="text-[0.75rem] text-muted-foreground mb-3 uppercase tracking-wider">💰 How much did they sell?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#30A46C]/8 border border-[#30A46C]/15 p-5 text-center">
                      <p className="text-[2rem] text-foreground tracking-tight leading-none">{formatMoney(selectedSeller.revenue)}</p>
                      <p className="text-[0.6875rem] text-muted-foreground mt-2">Total Revenue</p>
                    </div>
                    <div className="rounded-2xl bg-[#0171E3]/8 border border-[#0171E3]/15 p-5 text-center">
                      <p className="text-[2rem] text-foreground tracking-tight leading-none">{formatNum(selectedSeller.orders)}</p>
                      <p className="text-[0.6875rem] text-muted-foreground mt-2">Total Orders</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl bg-muted/10 border border-border/20 p-3 text-center">
                      <p className="text-[1rem] text-foreground">${selectedSeller.avgOrderValue.toFixed(2)}</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Avg Order</p>
                    </div>
                    <div className="rounded-xl bg-muted/10 border border-border/20 p-3 text-center">
                      <p className="text-[1rem] text-foreground">{selectedSeller.repeatBuyerRate}%</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Repeat Buyers</p>
                    </div>
                    <div className="rounded-xl bg-muted/10 border border-border/20 p-3 text-center">
                      <p className="text-[1rem] text-foreground">{selectedSeller.returnRate}%</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Return Rate</p>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Are they growing? ──────────────── */}
                <div>
                  <p className="text-[0.75rem] text-muted-foreground mb-3 uppercase tracking-wider">📈 Are they growing?</p>
                  <div className="rounded-2xl bg-muted/8 border border-border/20 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`flex items-center gap-1 text-[1rem] ${selectedSeller.change > 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                        {selectedSeller.change > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        {selectedSeller.change > 0 ? "Yes!" : "Slowing down"} — {Math.abs(selectedSeller.change)}% this month
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3 text-[0.6875rem]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#30A46C]" />Revenue</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0171E3]" />Orders</span>
                    </div>
                    <SimpleBarChart
                      data={selectedSeller.monthlySales.map(m => ({ ...m, revenueNorm: m.revenue / 80 }))}
                      xKey="month" yKeys={["orders", "revenueNorm"]} colors={["#0171E3", "#30A46C"]}
                    />
                    {/* Monthly values below chart */}
                    <div className="flex gap-1.5 mt-3">
                      {selectedSeller.monthlySales.map(m => (
                        <div key={m.month} className="flex-1 text-center">
                          <p className="text-[0.5625rem] text-muted-foreground">{formatMoney(m.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Section 3: What do they sell best? ────────── */}
                <div>
                  <p className="text-[0.75rem] text-muted-foreground mb-3 uppercase tracking-wider">🌟 What do they sell best?</p>
                  <div className="space-y-2.5">
                    {selectedSeller.topProducts.map((prod, pi) => (
                      <motion.div key={prod.name}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/8 border border-border/20"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.06 }}>
                        <span className="text-[1.125rem]">{pi === 0 ? "🥇" : pi === 1 ? "🥈" : "🥉"}</span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                          <ImageWithFallback src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.8125rem] text-foreground truncate">{prod.name}</p>
                          <p className="text-[0.6875rem] text-muted-foreground">{formatNum(prod.orders)} orders</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[1rem] text-foreground tracking-tight">{formatMoney(prod.revenue)}</p>
                          <p className="text-[0.5625rem] text-muted-foreground">revenue</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ── Section 4: Where are their buyers? ────────── */}
                <div>
                  <p className="text-[0.75rem] text-muted-foreground mb-3 uppercase tracking-wider">🌍 Where are their buyers?</p>
                  <div className="rounded-2xl bg-muted/8 border border-border/20 p-5 space-y-3">
                    {selectedSeller.topMarkets.map((m, mi) => {
                      const maxRev = selectedSeller.topMarkets[0].revenue;
                      return (
                        <div key={m.name} className="flex items-center gap-3">
                          <span className="text-[1.125rem]">{m.flag}</span>
                          <span className="text-[0.8125rem] text-foreground w-[100px] truncate">{m.name}</span>
                          <div className="flex-1 h-3.5 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0171E3] to-[#348DE9]"
                              initial={{ width: 0 }} animate={{ width: `${(m.revenue / maxRev) * 100}%` }}
                              transition={{ duration: 0.6, delay: mi * 0.08 }} />
                          </div>
                          <span className="text-[0.8125rem] text-foreground w-[65px] text-right">{formatMoney(m.revenue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Section 5: Quick verdict ──────────────────── */}
                <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15 p-5">
                  <p className="text-[0.75rem] text-muted-foreground mb-2 uppercase tracking-wider">📋 Quick Summary</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[0.875rem] mt-0.5">💰</span>
                      <p className="text-[0.8125rem] text-foreground">
                        <span className="text-primary">{selectedSeller.name}</span> earned{" "}
                        <span className="text-[#30A46C]">{formatMoney(selectedSeller.revenue)}</span> from{" "}
                        <span className="text-[#0171E3]">{formatNum(selectedSeller.orders)} orders</span> across{" "}
                        {selectedSeller.products} products.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[0.875rem] mt-0.5">{selectedSeller.change > 0 ? "📈" : "📉"}</span>
                      <p className="text-[0.8125rem] text-foreground">
                        Sales are{" "}
                        <span className={selectedSeller.change > 0 ? "text-[#30A46C]" : "text-[#E5484D]"}>
                          {selectedSeller.change > 0 ? "growing" : "declining"} by {Math.abs(selectedSeller.change)}%
                        </span>{" "}
                        this month.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[0.875rem] mt-0.5">❤️</span>
                      <p className="text-[0.8125rem] text-foreground">
                        {selectedSeller.repeatBuyerRate}% of buyers come back again — {selectedSeller.repeatBuyerRate > 60 ? "that's excellent!" : selectedSeller.repeatBuyerRate > 40 ? "that's good." : "room to improve."}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[0.875rem] mt-0.5">📦</span>
                      <p className="text-[0.8125rem] text-foreground">
                        Only {selectedSeller.returnRate}% of products are returned — {selectedSeller.returnRate < 2 ? "very reliable!" : "within normal range."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
