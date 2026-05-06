"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    TrendingUp, TrendingDown, ChevronDown, ChevronUp, Flame, Globe2,
    Search, X, ArrowUpRight, Sparkles, Zap, Star, Crown, Eye,
    ShoppingBag, BarChart3, Hash, Filter, SlidersHorizontal, RefreshCw,
    Bookmark, Share2, ExternalLink, ChevronRight, Package, ArrowRight,
    Clock, Info,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ImageWithFallback } from './figma/ImageWithFallback';

const FONT = "'Urbanist', sans-serif";
/* Chart + animation easing */
const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

/* ═══════════════════════════════════════ */
/*  MOCK DATA                              */
/* ═══════════════════════════════════════ */

const INDUSTRIES = [
    { id: 'all', label: 'All Industries' },
    { id: 'home', label: 'Home & Living' },
    { id: 'electronics', label: 'Electronics & Gadgets' },
    { id: 'fashion', label: 'Fashion & Accessories' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'outdoor', label: 'Outdoor & Sports' },
    { id: 'office', label: 'Office & Stationery' },
    { id: 'food', label: 'Food & Beverage' },
];

const COUNTRIES = [
    { id: 'all', label: 'All Countries', flag: '' },
    { id: 'us', label: 'United States', flag: 'us' },
    { id: 'gb', label: 'United Kingdom', flag: 'gb' },
    { id: 'ae', label: 'UAE', flag: 'ae' },
    { id: 'de', label: 'Germany', flag: 'de' },
    { id: 'ca', label: 'Canada', flag: 'ca' },
    { id: 'fr', label: 'France', flag: 'fr' },
    { id: 'jp', label: 'Japan', flag: 'jp' },
    { id: 'kr', label: 'South Korea', flag: 'kr' },
    { id: 'au', label: 'Australia', flag: 'au' },
];

type BadgeType = 'breakout' | 'popular' | 'new' | 'rising' | 'steady' | null;

interface TrendingProduct {
    id: string;
    name: string;
    image: string;
    category: string;
    industry: string;
    popularityScore: number; // 0-100
    change: number;
    badge: BadgeType;
    sparkline: number[];
    orders7d: number;
    avgPrice: number;
    topMarkets: string[];
    buyerInterest: number;
    competitorCount: number;
    relatedKeywords: string[];
    weeklyData: { day: string; orders: number; views: number }[];
}

const TRENDING_PRODUCTS: TrendingProduct[] = [
    {
        id: 'tp1', name: 'Handmade Ceramic Vase — Matte', category: 'Home Décor',
        industry: 'home',
        image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdmFzZSUyMGhhbmRtYWRlJTIwbWluaW1hbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNDA0NTU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 94, change: +47, badge: 'breakout',
        sparkline: [12, 18, 22, 35, 42, 55, 68, 78, 85, 90, 92, 94],
        orders7d: 1240, avgPrice: 89, topMarkets: ['us', 'gb', 'ae'],
        buyerInterest: 3200, competitorCount: 18,
        relatedKeywords: ['matte ceramic', 'minimalist vase', 'japandi decor', 'handcrafted pottery'],
        weeklyData: [
            { day: 'Mon', orders: 145, views: 420 }, { day: 'Tue', orders: 162, views: 480 },
            { day: 'Wed', orders: 198, views: 560 }, { day: 'Thu', orders: 210, views: 610 },
            { day: 'Fri', orders: 185, views: 540 }, { day: 'Sat', orders: 170, views: 490 },
            { day: 'Sun', orders: 170, views: 500 },
        ],
    },
    {
        id: 'tp2', name: 'Bamboo Kitchen Utensil Set', category: 'Kitchen & Dining',
        industry: 'home',
        image: 'https://images.unsplash.com/photo-1674676043851-dfb5553afa8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW1ib28lMjBraXRjaGVuJTIwdXRlbnNpbHMlMjBlY28lMjBwcm9kdWN0fGVufDF8fHx8MTc3MzQwNDU1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 88, change: +31, badge: 'popular',
        sparkline: [30, 35, 38, 45, 52, 58, 65, 72, 78, 82, 85, 88],
        orders7d: 980, avgPrice: 34, topMarkets: ['us', 'ca', 'au'],
        buyerInterest: 2800, competitorCount: 42,
        relatedKeywords: ['eco utensils', 'bamboo cooking', 'sustainable kitchen', 'zero waste'],
        weeklyData: [
            { day: 'Mon', orders: 120, views: 380 }, { day: 'Tue', orders: 135, views: 410 },
            { day: 'Wed', orders: 148, views: 450 }, { day: 'Thu', orders: 152, views: 470 },
            { day: 'Fri', orders: 140, views: 430 }, { day: 'Sat', orders: 145, views: 440 },
            { day: 'Sun', orders: 140, views: 420 },
        ],
    },
    {
        id: 'tp3', name: 'LED Desk Lamp — Dimmable', category: 'Office & Lighting',
        industry: 'electronics',
        image: 'https://images.unsplash.com/photo-1571406487954-dc11b0c0767d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMRUQlMjBkZXNrJTIwbGFtcCUyMG1vZGVybiUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3MzQwNDU1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 82, change: +18, badge: 'rising',
        sparkline: [40, 42, 48, 50, 55, 58, 62, 68, 72, 76, 80, 82],
        orders7d: 760, avgPrice: 65, topMarkets: ['de', 'us', 'jp'],
        buyerInterest: 2100, competitorCount: 35,
        relatedKeywords: ['desk lamp dimmable', 'LED office light', 'modern lamp', 'eye care lamp'],
        weeklyData: [
            { day: 'Mon', orders: 95, views: 290 }, { day: 'Tue', orders: 108, views: 320 },
            { day: 'Wed', orders: 112, views: 340 }, { day: 'Thu', orders: 118, views: 360 },
            { day: 'Fri', orders: 110, views: 330 }, { day: 'Sat', orders: 105, views: 310 },
            { day: 'Sun', orders: 112, views: 330 },
        ],
    },
    {
        id: 'tp4', name: 'Canvas Tote Bag — Organic', category: 'Bags & Accessories',
        industry: 'fashion',
        image: 'https://images.unsplash.com/photo-1542957057-debadce4ce81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW5lbiUyMHRvdGUlMjBiYWclMjBtaW5pbWFsJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzMzODMzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 78, change: +12, badge: 'popular',
        sparkline: [35, 38, 42, 44, 50, 55, 58, 62, 68, 72, 75, 78],
        orders7d: 620, avgPrice: 28, topMarkets: ['gb', 'fr', 'us'],
        buyerInterest: 1900, competitorCount: 58,
        relatedKeywords: ['organic tote', 'canvas bag', 'eco bag', 'market bag'],
        weeklyData: [
            { day: 'Mon', orders: 78, views: 260 }, { day: 'Tue', orders: 85, views: 280 },
            { day: 'Wed', orders: 92, views: 310 }, { day: 'Thu', orders: 96, views: 320 },
            { day: 'Fri', orders: 90, views: 300 }, { day: 'Sat', orders: 88, views: 290 },
            { day: 'Sun', orders: 91, views: 300 },
        ],
    },
    {
        id: 'tp5', name: 'Soy Wax Candle — Lavender', category: 'Home Fragrance',
        industry: 'home',
        image: 'https://images.unsplash.com/photo-1757688525739-8d1e13daf44f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3klMjBjYW5kbGUlMjBtaW5pbWFsaXN0JTIwcHJvZHVjdHxlbnwxfHx8fDE3NzM0MDQ1NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 75, change: +8, badge: 'steady',
        sparkline: [50, 52, 55, 54, 58, 60, 62, 65, 68, 70, 73, 75],
        orders7d: 540, avgPrice: 22, topMarkets: ['us', 'ca', 'gb'],
        buyerInterest: 1700, competitorCount: 72,
        relatedKeywords: ['soy candle', 'lavender scent', 'natural candle', 'home fragrance'],
        weeklyData: [
            { day: 'Mon', orders: 68, views: 230 }, { day: 'Tue', orders: 75, views: 250 },
            { day: 'Wed', orders: 80, views: 270 }, { day: 'Thu', orders: 82, views: 280 },
            { day: 'Fri', orders: 78, views: 260 }, { day: 'Sat', orders: 80, views: 270 },
            { day: 'Sun', orders: 77, views: 260 },
        ],
    },
    {
        id: 'tp6', name: 'Wireless Earbuds — Pro', category: 'Audio & Wearables',
        industry: 'electronics',
        image: 'https://images.unsplash.com/photo-1755182529034-189a6051faae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGVhcmJ1ZHMlMjBjYXNlJTIwcHJvZHVjdCUyMHdoaXRlfGVufDF8fHx8MTc3MzQwNDU1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 71, change: -5, badge: null,
        sparkline: [80, 78, 76, 74, 75, 72, 70, 72, 70, 69, 72, 71],
        orders7d: 480, avgPrice: 149, topMarkets: ['kr', 'jp', 'us'],
        buyerInterest: 1500, competitorCount: 28,
        relatedKeywords: ['wireless earbuds', 'ANC earbuds', 'bluetooth audio', 'premium earphones'],
        weeklyData: [
            { day: 'Mon', orders: 70, views: 210 }, { day: 'Tue', orders: 68, views: 200 },
            { day: 'Wed', orders: 72, views: 220 }, { day: 'Thu', orders: 66, views: 195 },
            { day: 'Fri', orders: 68, views: 205 }, { day: 'Sat', orders: 72, views: 215 },
            { day: 'Sun', orders: 64, views: 190 },
        ],
    },
    {
        id: 'tp7', name: 'Wooden Desk Organizer', category: 'Office & Stationery',
        industry: 'office',
        image: 'https://images.unsplash.com/photo-1633434986226-503e8fbdc6d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwb3JnYW5pemVyJTIwbWluaW1hbCUyMHdvb2QlMjBwcm9kdWN0fGVufDF8fHx8MTc3MzQwNDU1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 67, change: +22, badge: 'new',
        sparkline: [10, 15, 20, 28, 35, 42, 48, 52, 58, 62, 65, 67],
        orders7d: 390, avgPrice: 42, topMarkets: ['de', 'us', 'gb'],
        buyerInterest: 1200, competitorCount: 24,
        relatedKeywords: ['desk organizer', 'wood office', 'minimal desk', 'workspace tidy'],
        weeklyData: [
            { day: 'Mon', orders: 45, views: 160 }, { day: 'Tue', orders: 52, views: 180 },
            { day: 'Wed', orders: 58, views: 200 }, { day: 'Thu', orders: 62, views: 210 },
            { day: 'Fri', orders: 55, views: 190 }, { day: 'Sat', orders: 60, views: 200 },
            { day: 'Sun', orders: 58, views: 195 },
        ],
    },
    {
        id: 'tp8', name: 'Reusable Water Bottle — 750ml', category: 'Drinkware',
        industry: 'health',
        image: 'https://images.unsplash.com/photo-1583779470321-a3009b348218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXVzYWJsZSUyMHdhdGVyJTIwYm90dGxlJTIwbWluaW1hbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNDA0NTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 63, change: +15, badge: 'rising',
        sparkline: [25, 28, 32, 35, 40, 44, 48, 52, 55, 58, 61, 63],
        orders7d: 350, avgPrice: 18, topMarkets: ['au', 'us', 'ca'],
        buyerInterest: 1100, competitorCount: 65,
        relatedKeywords: ['water bottle', 'reusable bottle', 'eco bottle', 'gym bottle'],
        weeklyData: [
            { day: 'Mon', orders: 42, views: 150 }, { day: 'Tue', orders: 48, views: 165 },
            { day: 'Wed', orders: 52, views: 180 }, { day: 'Thu', orders: 55, views: 190 },
            { day: 'Fri', orders: 50, views: 175 }, { day: 'Sat', orders: 52, views: 180 },
            { day: 'Sun', orders: 51, views: 175 },
        ],
    },
    {
        id: 'tp9', name: 'Leather Phone Case — Slim', category: 'Phone Accessories',
        industry: 'electronics',
        image: 'https://images.unsplash.com/photo-1760443728263-e77345f61eb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG9uZSUyMGNhc2UlMjBsZWF0aGVyJTIwbWluaW1hbGlzdCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNDA0NTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 58, change: +6, badge: 'steady',
        sparkline: [40, 42, 44, 43, 46, 48, 50, 52, 54, 55, 57, 58],
        orders7d: 290, avgPrice: 35, topMarkets: ['us', 'kr', 'jp'],
        buyerInterest: 900, competitorCount: 48,
        relatedKeywords: ['phone case', 'leather case', 'slim phone cover', 'premium case'],
        weeklyData: [
            { day: 'Mon', orders: 38, views: 130 }, { day: 'Tue', orders: 40, views: 140 },
            { day: 'Wed', orders: 42, views: 145 }, { day: 'Thu', orders: 44, views: 150 },
            { day: 'Fri', orders: 42, views: 142 }, { day: 'Sat', orders: 40, views: 138 },
            { day: 'Sun', orders: 44, views: 148 },
        ],
    },
    {
        id: 'tp10', name: 'Concrete Plant Pot — Set of 3', category: 'Garden & Planters',
        industry: 'home',
        image: 'https://images.unsplash.com/photo-1745566589051-db20710ef1f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMHBvdCUyMGNvbmNyZXRlJTIwbW9kZXJuJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzM0MDQ1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        popularityScore: 52, change: +38, badge: 'breakout',
        sparkline: [8, 12, 15, 22, 28, 32, 38, 42, 46, 48, 50, 52],
        orders7d: 210, avgPrice: 56, topMarkets: ['gb', 'de', 'fr'],
        buyerInterest: 800, competitorCount: 15,
        relatedKeywords: ['concrete planter', 'modern pot', 'cement planter set', 'indoor pot'],
        weeklyData: [
            { day: 'Mon', orders: 22, views: 95 }, { day: 'Tue', orders: 28, views: 110 },
            { day: 'Wed', orders: 32, views: 125 }, { day: 'Thu', orders: 35, views: 135 },
            { day: 'Fri', orders: 30, views: 120 }, { day: 'Sat', orders: 32, views: 125 },
            { day: 'Sun', orders: 31, views: 120 },
        ],
    },
];

type TabId = 'trending' | 'breakout' | 'top' | 'keywords' | 'portfolio' | 'buyers';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'portfolio', label: 'My Products', icon: <Package size={12} strokeWidth={2.2} /> },
    { id: 'buyers', label: 'Buyers', icon: <Globe2 size={12} strokeWidth={2.2} /> },
    { id: 'trending', label: 'Trending', icon: <Flame size={12} strokeWidth={2.2} /> },
    { id: 'breakout', label: 'Breakout', icon: <Zap size={12} strokeWidth={2.2} /> },
    { id: 'top', label: 'Top Sellers', icon: <Crown size={12} strokeWidth={2.2} /> },
    { id: 'keywords', label: 'Keywords', icon: <Hash size={12} strokeWidth={2.2} /> },
];

const BADGE_STYLES: Record<string, { label: string; bg: string; color: string; glow?: string }> = {
    breakout: { label: 'Breakout', bg: 'rgba(230,68,68,0.08)', color: '#e74444', glow: '0 0 8px rgba(231,68,68,0.15)' },
    popular: { label: 'Popular', bg: 'rgba(1,113,227,0.07)', color: '#0171E3' },
    new: { label: 'New', bg: 'rgba(46,170,87,0.07)', color: '#2eaa57' },
    rising: { label: 'Rising', bg: 'rgba(230,126,34,0.07)', color: '#e67e22' },
    steady: { label: 'Steady', bg: 'rgba(142,142,147,0.07)', color: '#8e8e93' },
};

const ALL_KEYWORDS = TRENDING_PRODUCTS.flatMap(p => p.relatedKeywords.map(kw => ({
    keyword: kw,
    product: p.name,
    volume: Math.round(p.buyerInterest * (0.2 + Math.random() * 0.3)),
    change: Math.round(p.change * (0.5 + Math.random() * 1)),
    competition: p.competitorCount > 40 ? 'High' : p.competitorCount > 20 ? 'Medium' : 'Low',
}))).sort((a, b) => b.volume - a.volume).slice(0, 15);

/* ── Seller's own product portfolio ── */
type PortfolioStatus = 'active' | 'review' | 'draft';
interface SellerProduct {
    id: string;
    name: string;
    image: string;
    price: number;
    status: PortfolioStatus;
    sold: number;
    revenue: number;
    views7d: number;
    convRate: number;
    rating: number;
    reviews: number;
    stock: number;
    category: string;
    sparkline: number[];
    topBuyers: { iso: string; pct: number }[];
}

const SELLER_PORTFOLIO: SellerProduct[] = [
    { id: 'sp1', name: 'Wireless NC Headphones', image: 'https://images.unsplash.com/photo-1761005653827-9cd95fa1faee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwcHJvZHVjdCUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDF8fHx8MTc3MzQwNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', price: 269, status: 'active', sold: 48, revenue: 12912, views7d: 2340, convRate: 4.2, rating: 4.8, reviews: 36, stock: 120, category: 'Electronics', sparkline: [8, 12, 10, 14, 18, 22, 20, 16, 24, 22, 26, 28], topBuyers: [{ iso: 'us', pct: 38 }, { iso: 'gb', pct: 24 }, { iso: 'ae', pct: 18 }, { iso: 'de', pct: 12 }, { iso: 'ca', pct: 8 }] },
    { id: 'sp2', name: 'USB C Wire — Green 2m', image: 'https://images.unsplash.com/photo-1670341445838-57d1bc01340e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGFja2FnaW5nJTIwdW5ib3hpbmclMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzczNDA2NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', price: 32, status: 'active', sold: 136, revenue: 4352, views7d: 890, convRate: 6.8, rating: 4.5, reviews: 89, stock: 500, category: 'Cables', sparkline: [20, 22, 18, 26, 30, 28, 32, 34, 30, 36, 38, 40], topBuyers: [{ iso: 'us', pct: 42 }, { iso: 'ca', pct: 22 }, { iso: 'au', pct: 18 }, { iso: 'gb', pct: 12 }, { iso: 'jp', pct: 6 }] },
    { id: 'sp3', name: 'Aluminum Laptop Stand', image: 'https://images.unsplash.com/photo-1633434986226-503e8fbdc6d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwb3JnYW5pemVyJTIwbWluaW1hbCUyMHdvb2QlMjBwcm9kdWN0fGVufDF8fHx8MTc3MzQwNDU1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', price: 45, status: 'active', sold: 24, revenue: 1080, views7d: 560, convRate: 3.1, rating: 4.7, reviews: 18, stock: 85, category: 'Office', sparkline: [4, 6, 5, 8, 7, 10, 9, 12, 11, 14, 12, 16], topBuyers: [{ iso: 'de', pct: 35 }, { iso: 'us', pct: 28 }, { iso: 'jp', pct: 20 }, { iso: 'gb', pct: 10 }, { iso: 'fr', pct: 7 }] },
    { id: 'sp4', name: 'Handmade Ceramic Vase', image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdmFzZSUyMGhhbmRtYWRlJTIwbWluaW1hbCUyMHByb2R1Y3R8ZW58MXx8fHwxNzczNDA0NTU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', price: 89, status: 'review', sold: 0, revenue: 0, views7d: 0, convRate: 0, rating: 0, reviews: 0, stock: 400, category: 'Home Décor', sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], topBuyers: [] },
];

const PORTFOLIO_STATUS_STYLES: Record<PortfolioStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Active', bg: 'rgba(46,170,87,0.08)', color: '#2eaa57' },
    review: { label: 'In Review', bg: 'rgba(230,126,34,0.08)', color: '#e67e22' },
    draft: { label: 'Draft', bg: 'rgba(142,142,147,0.08)', color: '#8e8e93' },
};

/* ── Buyer country import data ── */
interface BuyerCountry {
    id: string;
    name: string;
    flag: string;
    totalImports: number;
    orders7d: number;
    growth: number;
    topCategories: { name: string; value: number }[];
    avgOrderValue: number;
    repeatRate: number;
    monthlyTrend: number[];
}

const BUYER_COUNTRIES: BuyerCountry[] = [
    { id: 'us', name: 'United States', flag: 'us', totalImports: 284000, orders7d: 3420, growth: 18, topCategories: [{ name: 'Electronics', value: 98000 }, { name: 'Home Décor', value: 72000 }, { name: 'Fashion', value: 54000 }, { name: 'Kitchen', value: 38000 }], avgOrderValue: 145, repeatRate: 34, monthlyTrend: [240, 255, 248, 270, 265, 278, 284] },
    { id: 'gb', name: 'United Kingdom', flag: 'gb', totalImports: 186000, orders7d: 2180, growth: 22, topCategories: [{ name: 'Home Décor', value: 62000 }, { name: 'Fashion', value: 48000 }, { name: 'Office', value: 36000 }, { name: 'Health', value: 24000 }], avgOrderValue: 118, repeatRate: 38, monthlyTrend: [152, 160, 158, 172, 168, 178, 186] },
    { id: 'ae', name: 'United Arab Emirates', flag: 'ae', totalImports: 142000, orders7d: 1650, growth: 31, topCategories: [{ name: 'Home Décor', value: 52000 }, { name: 'Electronics', value: 42000 }, { name: 'Fashion', value: 28000 }, { name: 'Health', value: 12000 }], avgOrderValue: 198, repeatRate: 28, monthlyTrend: [98, 108, 112, 125, 128, 136, 142] },
    { id: 'de', name: 'Germany', flag: 'de', totalImports: 128000, orders7d: 1420, growth: 14, topCategories: [{ name: 'Electronics', value: 48000 }, { name: 'Office', value: 35000 }, { name: 'Home Décor', value: 28000 }, { name: 'Kitchen', value: 12000 }], avgOrderValue: 132, repeatRate: 42, monthlyTrend: [112, 118, 115, 122, 120, 125, 128] },
    { id: 'ca', name: 'Canada', flag: 'ca', totalImports: 96000, orders7d: 1080, growth: 12, topCategories: [{ name: 'Kitchen', value: 32000 }, { name: 'Health', value: 28000 }, { name: 'Home Décor', value: 22000 }, { name: 'Outdoor', value: 10000 }], avgOrderValue: 92, repeatRate: 36, monthlyTrend: [82, 85, 88, 90, 92, 94, 96] },
    { id: 'fr', name: 'France', flag: 'fr', totalImports: 88000, orders7d: 980, growth: 16, topCategories: [{ name: 'Fashion', value: 35000 }, { name: 'Home Décor', value: 26000 }, { name: 'Kitchen', value: 18000 }, { name: 'Health', value: 6000 }], avgOrderValue: 108, repeatRate: 32, monthlyTrend: [72, 75, 78, 82, 84, 86, 88] },
    { id: 'jp', name: 'Japan', flag: 'jp', totalImports: 76000, orders7d: 860, growth: 8, topCategories: [{ name: 'Electronics', value: 32000 }, { name: 'Office', value: 22000 }, { name: 'Home Décor', value: 14000 }, { name: 'Kitchen', value: 6000 }], avgOrderValue: 156, repeatRate: 45, monthlyTrend: [68, 70, 72, 72, 74, 75, 76] },
    { id: 'kr', name: 'South Korea', flag: 'kr', totalImports: 64000, orders7d: 720, growth: 24, topCategories: [{ name: 'Electronics', value: 28000 }, { name: 'Fashion', value: 18000 }, { name: 'Health', value: 12000 }, { name: 'Home Décor', value: 4000 }], avgOrderValue: 124, repeatRate: 30, monthlyTrend: [48, 52, 54, 58, 60, 62, 64] },
    { id: 'au', name: 'Australia', flag: 'au', totalImports: 52000, orders7d: 580, growth: 20, topCategories: [{ name: 'Health', value: 18000 }, { name: 'Outdoor', value: 14000 }, { name: 'Kitchen', value: 12000 }, { name: 'Home Décor', value: 6000 }], avgOrderValue: 86, repeatRate: 33, monthlyTrend: [38, 42, 44, 46, 48, 50, 52] },
];

/* ── ISO code → country name mapping ── */
const ISO_TO_COUNTRY: Record<string, string> = {
    'us': 'United States', 'gb': 'United Kingdom', 'ae': 'UAE',
    'de': 'Germany', 'ca': 'Canada', 'fr': 'France',
    'jp': 'Japan', 'kr': 'South Korea', 'au': 'Australia',
};

/* ── Deterministic seeded market breakdowns from topMarkets ── */
const MARKET_SPLITS: Record<string, number[]> = {
    tp1:  [38, 27, 18, 11, 6],
    tp2:  [35, 28, 20, 12, 5],
    tp3:  [32, 28, 22, 12, 6],
    tp4:  [34, 30, 20, 10, 6],
    tp5:  [36, 25, 22, 11, 6],
    tp6:  [33, 29, 21, 11, 6],
    tp7:  [35, 27, 20, 12, 6],
    tp8:  [34, 26, 22, 12, 6],
    tp9:  [37, 28, 19, 10, 6],
    tp10: [36, 30, 18, 10, 6],
};

/* Expand topMarkets ISO codes into 5 buying countries with value */
function getMarketBreakdown(product: TrendingProduct) {
    const totalValue = product.orders7d * product.avgPrice;
    const splits = MARKET_SPLITS[product.id] || [40, 25, 18, 10, 7];
    // Pad topMarkets to 5 with extra countries
    const allCodes = [...product.topMarkets];
    const extras = ['us', 'gb', 'de', 'fr', 'ca', 'au', 'jp'].filter(c => !allCodes.includes(c));
    while (allCodes.length < 5) allCodes.push(extras.shift()!);
    return allCodes.slice(0, 5).map((iso, i) => {
        const pct = splits[i];
        const orders = Math.round(product.orders7d * pct / 100);
        const value = Math.round(totalValue * pct / 100);
        return { country: ISO_TO_COUNTRY[iso] || iso, iso, orders, value, pct };
    });
}

function fmtValue(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n}`;
}

/* ── Generate extended data sets (up to 100 items) ── */
const EXTRA_PRODUCT_NAMES = [
    'Smart LED Strip Lights', 'Organic Cotton Towel Set', 'Portable Bluetooth Speaker', 'Bamboo Cutting Board — XL',
    'Stainless Steel Tumbler', 'Macrame Wall Hanging', 'Yoga Mat — Cork', 'Essential Oil Diffuser',
    'Linen Throw Pillow Set', 'Glass Storage Containers', 'Silicone Baking Mat', 'Ceramic Coffee Mug — Speckled',
    'Desk Cable Organizer', 'Plant Propagation Station', 'Natural Soy Candle Set', 'Borosilicate Glass Teapot',
    'Wooden Phone Stand', 'Copper Measuring Cups', 'Woven Storage Basket', 'Recycled Notebook Set',
    'Smart Plug — WiFi', 'Herb Garden Kit', 'Acacia Wood Salad Bowl', 'Microfiber Cleaning Set',
    'Portable Garment Steamer', 'Cast Iron Skillet — 10in', 'Organic Lip Balm Set', 'Desk LED Ring Light',
    'Cotton Market Tote', 'Ceramic Soap Dispenser', 'Stainless Steel Straws', 'Leather Journal — A5',
    'Resistance Band Set', 'Insulated Lunch Bag', 'Marble Coaster Set', 'Mini Humidifier — USB',
    'Wooden Coat Rack', 'Bamboo Toothbrush Set', 'Porcelain Dinner Set', 'Solar Garden Lights',
    'Canvas Art Print', 'Silicone Spatula Set', 'Wicker Laundry Basket', 'LED Vanity Mirror',
    'Cork Yoga Block', 'Stoneware Baking Dish', 'Floating Wall Shelf', 'Cotton Rope Basket',
    'Electric Milk Frother', 'Glass Water Carafe', 'Terracotta Planter', 'Wooden Spice Rack',
    'Velvet Cushion Cover', 'Rattan Serving Tray', 'Digital Kitchen Scale', 'Ceramic Oil Burner',
    'Linen Table Runner', 'Copper Plant Mister', 'Acrylic Organizer Box', 'Wool Throw Blanket',
    'Titanium Chopsticks', 'Enamel Camping Mug', 'Ceramic Butter Dish', 'Cork Bulletin Board',
    'Glass Terrarium Kit', 'Bamboo Shoe Rack', 'Cotton Napkin Set', 'Wooden Puzzle Box',
    'Brass Candle Holder', 'Jute Doormat', 'Porcelain Tea Set', 'Leather Mouse Pad',
    'Ceramic Ring Dish', 'Woven Wall Art', 'Steel Bento Box', 'Glass Apothecary Jar',
    'Marble Rolling Pin', 'Linen Apron', 'Copper Wire Lights', 'Wooden Picture Frame',
    'Ceramic Plant Pot', 'Bamboo Utensil Holder', 'Cotton Shower Curtain', 'Stone Mortar & Pestle',
    'Glass Candle Jar', 'Rattan Mirror', 'Ceramic Incense Holder', 'Wooden Bookmark Set',
    'Brass Picture Hook', 'Linen Bread Bag',
];
const EXTRA_CATEGORIES = ['Home Décor', 'Kitchen & Dining', 'Office & Lighting', 'Bags & Accessories', 'Home Fragrance', 'Audio & Wearables', 'Health & Wellness', 'Garden & Planters', 'Drinkware', 'Fashion'];
const EXTRA_INDUSTRIES = ['home', 'electronics', 'fashion', 'health', 'outdoor', 'office', 'food'];
const EXTRA_BADGES: BadgeType[] = ['breakout', 'popular', 'new', 'rising', 'steady', null, null, null];
const COUNTRY_ISOS = ['us', 'gb', 'ae', 'de', 'ca', 'fr', 'jp', 'kr', 'au'];

function seededRandom(seed: number) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateExtendedProducts(base: TrendingProduct[], total: number): TrendingProduct[] {
    if (base.length >= total) return base;
    const extended = [...base];
    for (let i = base.length; i < total; i++) {
        const rand = seededRandom(i * 137 + 42);
        const nameIdx = (i - base.length) % EXTRA_PRODUCT_NAMES.length;
        const score = Math.round(30 + rand() * 65);
        const change = Math.round(-10 + rand() * 55);
        const orders = Math.round(80 + rand() * 1200);
        const price = Math.round(15 + rand() * 200);
        const spark = Array.from({ length: 12 }, () => Math.round(10 + rand() * 90));
        const markets = [COUNTRY_ISOS[Math.floor(rand() * 9)], COUNTRY_ISOS[Math.floor(rand() * 9)], COUNTRY_ISOS[Math.floor(rand() * 9)]];
        extended.push({
            id: `tp${i + 1}`,
            name: EXTRA_PRODUCT_NAMES[nameIdx],
            image: `https://picsum.photos/seed/tp${i + 1}/200/200`,
            category: EXTRA_CATEGORIES[Math.floor(rand() * EXTRA_CATEGORIES.length)],
            industry: EXTRA_INDUSTRIES[Math.floor(rand() * EXTRA_INDUSTRIES.length)],
            popularityScore: score, change,
            badge: EXTRA_BADGES[Math.floor(rand() * EXTRA_BADGES.length)],
            sparkline: spark, orders7d: orders, avgPrice: price,
            topMarkets: [...new Set(markets)].slice(0, 3),
            buyerInterest: Math.round(500 + rand() * 4000),
            competitorCount: Math.round(5 + rand() * 60),
            relatedKeywords: [EXTRA_PRODUCT_NAMES[nameIdx].split(' ')[0].toLowerCase(), 'trending', 'wholesale'],
            weeklyData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
                day, orders: Math.round(orders / 7 * (0.7 + rand() * 0.6)), views: Math.round(orders / 7 * (2 + rand() * 2)),
            })),
        });
    }
    return extended;
}

function generateExtendedPortfolio(base: SellerProduct[], total: number): SellerProduct[] {
    if (base.length >= total) return base;
    const extended = [...base];
    const statuses: PortfolioStatus[] = ['active', 'active', 'active', 'active', 'review', 'draft'];
    for (let i = base.length; i < total; i++) {
        const rand = seededRandom(i * 251 + 73);
        const nameIdx = (i - base.length) % EXTRA_PRODUCT_NAMES.length;
        const status = statuses[Math.floor(rand() * statuses.length)];
        const price = Math.round(15 + rand() * 300);
        const sold = status === 'active' ? Math.round(5 + rand() * 200) : 0;
        const revenue = sold * price;
        const spark = Array.from({ length: 12 }, () => Math.round(rand() * 50));
        extended.push({
            id: `sp${i + 1}`, name: EXTRA_PRODUCT_NAMES[nameIdx],
            image: `https://picsum.photos/seed/sp${i + 1}/200/200`,
            price, status, sold, revenue,
            views7d: Math.round(100 + rand() * 3000),
            convRate: +(1 + rand() * 8).toFixed(1),
            rating: status === 'active' ? +(3.5 + rand() * 1.5).toFixed(1) : 0,
            reviews: status === 'active' ? Math.round(rand() * 120) : 0,
            stock: Math.round(10 + rand() * 500),
            category: EXTRA_CATEGORIES[Math.floor(rand() * EXTRA_CATEGORIES.length)],
            sparkline: spark,
            topBuyers: status === 'active' ? [
                { iso: COUNTRY_ISOS[Math.floor(rand() * 9)], pct: 35 },
                { iso: COUNTRY_ISOS[Math.floor(rand() * 9)], pct: 25 },
                { iso: COUNTRY_ISOS[Math.floor(rand() * 9)], pct: 20 },
            ] : [],
        });
    }
    return extended;
}

const EXTRA_COUNTRY_NAMES: [string, string][] = [
    ['in', 'India'], ['br', 'Brazil'], ['mx', 'Mexico'], ['id', 'Indonesia'], ['ng', 'Nigeria'],
    ['za', 'South Africa'], ['th', 'Thailand'], ['vn', 'Vietnam'], ['ph', 'Philippines'], ['eg', 'Egypt'],
    ['tr', 'Turkey'], ['sa', 'Saudi Arabia'], ['my', 'Malaysia'], ['sg', 'Singapore'], ['pk', 'Pakistan'],
    ['cl', 'Chile'], ['ar', 'Argentina'], ['co', 'Colombia'], ['pe', 'Peru'], ['bd', 'Bangladesh'],
    ['ke', 'Kenya'], ['gh', 'Ghana'], ['tz', 'Tanzania'], ['et', 'Ethiopia'], ['ma', 'Morocco'],
    ['il', 'Israel'], ['no', 'Norway'], ['se', 'Sweden'], ['dk', 'Denmark'], ['fi', 'Finland'],
    ['nl', 'Netherlands'], ['be', 'Belgium'], ['ch', 'Switzerland'], ['at', 'Austria'], ['pt', 'Portugal'],
    ['es', 'Spain'], ['it', 'Italy'], ['pl', 'Poland'], ['cz', 'Czechia'], ['ro', 'Romania'],
    ['hu', 'Hungary'], ['ie', 'Ireland'], ['nz', 'New Zealand'], ['tw', 'Taiwan'], ['hk', 'Hong Kong'],
    ['kw', 'Kuwait'], ['qa', 'Qatar'], ['bh', 'Bahrain'], ['om', 'Oman'], ['jo', 'Jordan'],
    ['lb', 'Lebanon'], ['ua', 'Ukraine'], ['rs', 'Serbia'], ['hr', 'Croatia'], ['bg_c', 'Bulgaria'],
    ['sk', 'Slovakia'], ['lt', 'Lithuania'], ['lv', 'Latvia'], ['ee', 'Estonia'], ['si', 'Slovenia'],
    ['is', 'Iceland'], ['lu', 'Luxembourg'], ['mt', 'Malta'], ['cy', 'Cyprus'], ['ge', 'Georgia'],
    ['am', 'Armenia'], ['az', 'Azerbaijan'], ['kz', 'Kazakhstan'], ['uz', 'Uzbekistan'], ['mn', 'Mongolia'],
    ['mm', 'Myanmar'], ['kh', 'Cambodia'], ['la', 'Laos'], ['np', 'Nepal'], ['lk', 'Sri Lanka'],
    ['ug', 'Uganda'], ['cm', 'Cameroon'], ['sn', 'Senegal'], ['ci', "Côte d'Ivoire"], ['dz', 'Algeria'],
    ['tn', 'Tunisia'], ['ly', 'Libya'], ['iq', 'Iraq'], ['af', 'Afghanistan'], ['ye', 'Yemen'],
    ['sy', 'Syria'], ['sd', 'Sudan'], ['bo', 'Bolivia'], ['ec', 'Ecuador'], ['py', 'Paraguay'],
    ['uy', 'Uruguay'],
];

function generateExtendedCountries(base: BuyerCountry[], total: number): BuyerCountry[] {
    if (base.length >= total) return base;
    const extended = [...base];
    for (let i = base.length; i < total; i++) {
        const rand = seededRandom(i * 311 + 59);
        const extraIdx = (i - base.length) % EXTRA_COUNTRY_NAMES.length;
        const [iso, name] = EXTRA_COUNTRY_NAMES[extraIdx];
        const imports = Math.round(5000 + rand() * 80000);
        const orders = Math.round(50 + rand() * 2000);
        extended.push({
            id: iso, name, flag: iso, totalImports: imports, orders7d: orders,
            growth: Math.round(rand() * 35),
            topCategories: [
                { name: 'Electronics', value: Math.round(imports * (0.2 + rand() * 0.2)) },
                { name: 'Home Décor', value: Math.round(imports * (0.1 + rand() * 0.15)) },
                { name: 'Fashion', value: Math.round(imports * (0.05 + rand() * 0.15)) },
            ],
            avgOrderValue: Math.round(40 + rand() * 180),
            repeatRate: Math.round(10 + rand() * 40),
            monthlyTrend: Array.from({ length: 7 }, () => Math.round(imports / 12 * (0.7 + rand() * 0.6))),
        });
    }
    return extended;
}

function generateExtendedKeywords(base: typeof ALL_KEYWORDS, total: number) {
    if (base.length >= total) return base;
    const extended = [...base];
    const kwBases = ['wholesale', 'bulk buy', 'eco friendly', 'handmade', 'organic', 'premium', 'minimalist', 'custom', 'luxury', 'vintage', 'modern', 'industrial', 'rustic', 'boho', 'artisan'];
    const kwSuffixes = ['decor', 'supplies', 'accessories', 'set', 'collection', 'bundle', 'kit', 'tools', 'essentials', 'gifts'];
    for (let i = base.length; i < total; i++) {
        const rand = seededRandom(i * 197 + 31);
        extended.push({
            keyword: `${kwBases[Math.floor(rand() * kwBases.length)]} ${kwSuffixes[Math.floor(rand() * kwSuffixes.length)]}`,
            product: EXTRA_PRODUCT_NAMES[Math.floor(rand() * EXTRA_PRODUCT_NAMES.length)],
            volume: Math.round(200 + rand() * 5000),
            change: Math.round(-15 + rand() * 50),
            competition: rand() < 0.33 ? 'Low' : rand() < 0.66 ? 'Medium' : 'High',
        });
    }
    return extended.sort((a, b) => b.volume - a.volume);
}

const EXTENDED_PRODUCTS = generateExtendedProducts(TRENDING_PRODUCTS, 100);
const EXTENDED_PORTFOLIO = generateExtendedPortfolio(SELLER_PORTFOLIO, 100);
const EXTENDED_COUNTRIES = generateExtendedCountries(BUYER_COUNTRIES, 100);
const EXTENDED_KEYWORDS = generateExtendedKeywords(ALL_KEYWORDS, 100);

const INITIAL_VISIBLE = 10;
const LOAD_MORE_INCREMENT = 10;
const MAX_VISIBLE = 100;

/* ── Sparkline ── */
let _sparkId = 0;
function MiniSparkline({ data, color, height = 28, width = 72 }: { data: number[]; color: string; height?: number; width?: number }) {
    const uid = useMemo(() => `sg-${++_sparkId}`, []);
    const chartData = data.map((v, i) => ({ v, i }));
    return (
        <div style={{ width, height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs key="defs">
                        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area key="area" type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${uid})`} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Popularity bar ── */
function PopularityBar({ score }: { score: number }) {
    const color = score >= 80 ? '#0171E3' : score >= 60 ? '#2eaa57' : score >= 40 ? '#e67e22' : '#8e8e93';
    return (
        <div className="flex items-center gap-2">
            <div className="w-[48px] h-[4px] rounded-full bg-black/[0.04] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: EASE }}
                />
            </div>
            <span className="text-[10px] font-bold tabular-nums" style={{ color, opacity: 0.8 }}>{score}</span>
        </div>
    );
}

/* ── Dropdown select ── */
function DropdownSelect({ options, value, onChange, icon }: {
    options: { id: string; label: string; flag?: string }[];
    value: string;
    onChange: (v: string) => void;
    icon?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.id === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] border border-black/[0.06] bg-white/80 text-[11px] font-semibold text-[#1A1A1A]/55 cursor-pointer hover:bg-white hover:border-black/[0.1] transition-all duration-200 whitespace-nowrap"
            >
                {icon}
                {selected?.flag && <img src={`https://flagcdn.com/w40/${selected.flag}.png`} alt="" className="w-[16px] h-[11px] rounded-[2px] object-cover" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />}
                <span className="max-w-[100px] truncate">{selected?.label}</span>
                <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-1 left-0 z-50 min-w-[180px] max-h-[240px] overflow-y-auto rounded-[14px] bg-white/95 backdrop-blur-2xl border border-white/50 py-1.5"
                        style={{
                            boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)',
                        }}
                    >
                        {options.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setOpen(false); }}
                                className={`w-full text-left px-3.5 py-2 text-[12px] font-medium border-none cursor-pointer transition-all duration-150 flex items-center gap-2 ${
                                    value === opt.id
                                        ? 'bg-[#0171E3]/[0.06] text-[#0171E3] font-semibold'
                                        : 'bg-transparent text-[#1A1A1A]/60 hover:bg-black/[0.03]'
                                }`}
                            >
                                {opt.flag && <img src={`https://flagcdn.com/w40/${opt.flag}.png`} alt="" className="w-[18px] h-[12px] rounded-[2px] object-cover" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />}
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


/* ═══════════════════════════════════════ */
/*  MAIN COMPONENT                         */
/* ═══════════════════════════════════════ */
export function SellerTrends() {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('portfolio');
    const [timeRange, setTimeRange] = useState('7d');
    const [industry, setIndustry] = useState('all');
    const [country, setCountry] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
    const [visibleCounts, setVisibleCounts] = useState<Record<TabId, number>>({
        portfolio: INITIAL_VISIBLE, buyers: INITIAL_VISIBLE, trending: INITIAL_VISIBLE,
        breakout: INITIAL_VISIBLE, top: INITIAL_VISIBLE, keywords: INITIAL_VISIBLE,
    });
    const searchRef = useRef<HTMLInputElement>(null);

    const loadMore = (tab: TabId) => {
        setVisibleCounts(prev => ({
            ...prev,
            [tab]: Math.min(prev[tab] + LOAD_MORE_INCREMENT, MAX_VISIBLE),
        }));
    };

    /* ── Filtered products ── */
    const filteredProducts = useMemo(() => {
        let filtered = EXTENDED_PRODUCTS as TrendingProduct[];
        if (industry !== 'all') filtered = filtered.filter(p => p.industry === industry);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.relatedKeywords.some(kw => kw.toLowerCase().includes(q))
            );
        }
        return filtered;
    }, [industry, searchQuery]);

    const breakoutProducts = useMemo(() =>
        EXTENDED_PRODUCTS.filter(p => p.badge === 'breakout' || (p.change >= 25)).sort((a, b) => b.change - a.change),
    []);

    const topProducts = useMemo(() =>
        [...EXTENDED_PRODUCTS].sort((a, b) => b.orders7d - a.orders7d),
    []);

    const filteredKeywords = useMemo(() => {
        if (!searchQuery.trim()) return EXTENDED_KEYWORDS;
        const q = searchQuery.toLowerCase();
        return EXTENDED_KEYWORDS.filter(k => k.keyword.toLowerCase().includes(q) || k.product.toLowerCase().includes(q));
    }, [searchQuery]);

    const toggleSave = (id: string) => {
        setSavedProducts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    /* ── Collapsed summary stats ── */
    const topItem = EXTENDED_PRODUCTS[0];
    const totalOrders7d = EXTENDED_PRODUCTS.reduce((s, p) => s + p.orders7d, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: EASE }}
            className="mb-10"
            style={{ fontFamily: FONT }}
        >
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]/30 tracking-wide">
                        Trends & insights
                    </p>
                    <span className="text-[9px] font-bold text-[#0171E3]/40 bg-[#0171E3]/[0.05] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Live
                    </span>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#1A1A1A]/25 uppercase tracking-wider border-none bg-transparent cursor-pointer hover:text-[#1A1A1A]/40 transition-colors px-0"
                >
                    {expanded ? 'Collapse' : 'Explore'}
                    {expanded ? <ChevronUp size={10} strokeWidth={2.5} /> : <ChevronDown size={10} strokeWidth={2.5} />}
                </button>
            </div>

            {/* ── Collapsed: compact preview strip ── */}
            {!expanded && (
                <motion.div
                    layout
                    className="rounded-[20px] bg-white/70 backdrop-blur-2xl border border-white/40 overflow-hidden cursor-pointer"
                    style={{
                        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.75), 0 0 0 0.5px rgba(0,0,0,0.02), 0 1px 3px 0 rgba(0,0,0,0.018), 0 6px 24px -6px rgba(0,0,0,0.04)',
                    }}
                    onClick={() => setExpanded(true)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.995 }}
                >
                    <div className="px-5 py-4">
                        {/* Top row: headline metric */}
                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-[36px] h-[36px] rounded-[10px] overflow-hidden">
                                <ImageWithFallback src={topItem.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-[#1A1A1A]/25 uppercase tracking-wider mb-0.5">Top trending</p>
                                <p className="text-[13px] font-bold text-[#1A1A1A]/70 truncate">{topItem.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame size={11} color="#e74444" strokeWidth={2.5} />
                                <span className="text-[12px] font-black text-[#e74444] tabular-nums">+{topItem.change}%</span>
                            </div>
                            <ArrowUpRight size={14} color="rgba(26,26,26,0.15)" strokeWidth={2} className="flex-shrink-0" />
                        </div>

                        {/* Bottom row: 3 mini product thumbnails + stats */}
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {TRENDING_PRODUCTS.slice(1, 5).map(p => (
                                    <div key={p.id} className="w-[24px] h-[24px] rounded-[6px] overflow-hidden border-2 border-white flex-shrink-0">
                                        <ImageWithFallback src={p.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-semibold text-[#1A1A1A]/25">
                                {totalOrders7d.toLocaleString()} orders this week across {TRENDING_PRODUCTS.length} trending products
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Expanded: full Creative Center panel ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div
                            className="rounded-[22px] bg-white/75 backdrop-blur-2xl border border-white/40 overflow-hidden"
                            style={{
                                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.75), 0 0 0 0.5px rgba(0,0,0,0.02), 0 1px 3px 0 rgba(0,0,0,0.018), 0 6px 24px -6px rgba(0,0,0,0.04), 0 28px 64px -20px rgba(0,0,0,0.055)',
                            }}
                        >
                            {/* ── FILTER BAR: search + industry + country + time ── */}
                            <div className="px-4 pt-4 pb-3 border-b border-black/[0.03]">
                                {/* Search */}
                                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] border transition-all duration-200 mb-3 ${
                                    searchFocused ? 'border-[#0171E3]/25 bg-white shadow-sm' : 'border-black/[0.06] bg-[#F5F5F7]/60'
                                }`}>
                                    <Search size={14} color={searchFocused ? '#0171E3' : 'rgba(26,26,26,0.25)'} strokeWidth={2} className="flex-shrink-0" />
                                    <input
                                        ref={searchRef}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setSearchFocused(false)}
                                        placeholder="Search products, categories, keywords..."
                                        className="flex-1 bg-transparent text-[12px] font-medium text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/25 outline-none border-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                                            className="w-[18px] h-[18px] rounded-full bg-black/[0.06] flex items-center justify-center border-none cursor-pointer hover:bg-black/[0.1] transition-colors flex-shrink-0"
                                        >
                                            <X size={10} color="rgba(26,26,26,0.4)" strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>

                                {/* Filters row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DropdownSelect
                                        options={INDUSTRIES}
                                        value={industry}
                                        onChange={setIndustry}
                                        icon={<SlidersHorizontal size={11} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                                    />
                                    <DropdownSelect
                                        options={COUNTRIES}
                                        value={country}
                                        onChange={setCountry}
                                        icon={<Globe2 size={11} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                                    />
                                    <div className="flex-1" />
                                    {/* Time filter */}
                                    <div className="flex items-center gap-0.5 bg-[#F5F5F7]/80 rounded-full p-[3px]">
                                        {['24h', '7d', '30d', '120d'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTimeRange(t)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                                                    timeRange === t
                                                        ? 'bg-white text-[#1A1A1A]/70 shadow-sm'
                                                        : 'bg-transparent text-[#1A1A1A]/25 hover:text-[#1A1A1A]/45'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── TAB BAR ── */}
                            <div className="px-4 border-b border-black/[0.03] overflow-x-auto">
                                <div className="flex items-center gap-1 py-2.5 min-w-max">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all duration-200 whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'bg-[#1A1A1A] text-white'
                                                    : 'bg-transparent text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 hover:bg-black/[0.03]'
                                            }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── TAB CONTENT ── */}
                            <div className="px-4 pb-4">
                                <AnimatePresence mode="wait">

                                    {/* ═══ MY PRODUCTS — clean priority list, no boxes ═══ */}
                                    {activeTab === 'portfolio' && (
                                        <motion.div key="portfolio" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            {/* Headline metric as natural text */}
                                            <div className="py-3">
                                                <p className="text-[13px] font-medium text-[#1A1A1A]/40 leading-relaxed">
                                                    You've earned <span className="font-black text-[#0171E3]/70">{fmtValue(EXTENDED_PORTFOLIO.reduce((s, p) => s + p.revenue, 0))}</span> across <span className="font-bold text-[#1A1A1A]/55">{EXTENDED_PORTFOLIO.filter(p => p.status === 'active').length} active</span> products — <span className="font-bold text-[#1A1A1A]/55">{EXTENDED_PORTFOLIO.reduce((s, p) => s + p.sold, 0)} units</span> sold, rated <span className="font-bold text-[#e67e22]/60">{(EXTENDED_PORTFOLIO.filter(p => p.rating > 0).reduce((s, p) => s + p.rating, 0) / EXTENDED_PORTFOLIO.filter(p => p.rating > 0).length).toFixed(1)}</span> avg.
                                                </p>
                                            </div>

                                            {/* Products sorted by revenue — hero first, rest tight */}
                                            {[...EXTENDED_PORTFOLIO].sort((a, b) => b.revenue - a.revenue).slice(0, visibleCounts.portfolio).map((product, i) => {
                                                const isPortfolioExpanded = selectedProduct === `portfolio-${product.id}`;
                                                return (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                                    className={`-mx-2 px-2 cursor-pointer transition-all duration-200 ${i > 0 ? 'border-t border-black/[0.025]' : ''} ${isPortfolioExpanded ? 'rounded-[14px] bg-[#F8F9FA]/60 border-black/[0.04] mb-1' : 'rounded-[10px] hover:bg-black/[0.015]'}`}
                                                    onClick={() => setSelectedProduct(isPortfolioExpanded ? null : `portfolio-${product.id}`)}
                                                >
                                                    <div className="flex items-center gap-3 py-3">
                                                    {/* Thumbnail — hero gets bigger */}
                                                    <div className={`${i === 0 ? 'w-[44px] h-[44px]' : 'w-[34px] h-[34px]'} rounded-[${i === 0 ? '10' : '8'}px] overflow-hidden flex-shrink-0 bg-[#F5F5F7]`}>
                                                        <ImageWithFallback src={product.image} alt="" className="w-full h-full object-cover" />
                                                    </div>

                                                    {/* Name + inline context */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className={`${i === 0 ? 'text-[13px]' : 'text-[12px]'} font-semibold text-[#1A1A1A]/65 truncate leading-tight`}>{product.name}</p>
                                                            {/* Status dot */}
                                                            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: PORTFOLIO_STATUS_STYLES[product.status].color, opacity: 0.6 }} />
                                                        </div>
                                                        {product.status === 'active' ? (
                                                            <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5 truncate">
                                                                {product.sold} sold · {product.convRate}% conv · {product.stock < 50 ? <span className="text-[#e74444]/60 font-bold">{product.stock} left</span> : <>{product.stock} in stock</>}
                                                                {product.rating > 0 && <> · <Star size={8} strokeWidth={2} fill="#e67e22" color="#e67e22" className="inline -mt-[1px]" /> {product.rating}</>}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] font-medium mt-0.5" style={{ color: PORTFOLIO_STATUS_STYLES[product.status].color, opacity: 0.6 }}>
                                                                {product.status === 'review' ? 'Under review — 24-48h' : 'Draft'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Revenue + sparkline */}
                                                    {product.status === 'active' && (
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {!isPortfolioExpanded && (
                                                                <div className="hidden sm:block">
                                                                    <MiniSparkline data={product.sparkline} color="#0171E3" height={22} width={48} />
                                                                </div>
                                                            )}
                                                            <div className="text-right">
                                                                <p className={`${i === 0 ? 'text-[14px]' : 'text-[12px]'} font-black text-[#0171E3]/70 tabular-nums`}>{fmtValue(product.revenue)}</p>
                                                                <p className="text-[9px] font-medium text-[#1A1A1A]/20 tabular-nums">{product.views7d.toLocaleString()} views</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {product.status !== 'active' && (
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/30 tabular-nums">${product.price}</span>
                                                    )}

                                                    {isPortfolioExpanded ? (
                                                        <ChevronUp size={12} strokeWidth={2} className="text-[#1A1A1A]/15" />
                                                    ) : (
                                                        <ChevronDown size={12} strokeWidth={2} className="w-[22px] text-[#1A1A1A]/15" />
                                                    )}
                                                    </div>

                                                    {/* Expanded detail panel */}
                                                    <AnimatePresence>
                                                        {isPortfolioExpanded && product.status === 'active' && (
                                                            <motion.div
                                                                key={`detail-portfolio-${product.id}`}
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pb-3 px-1">
                                                                    {/* Detailed stats as flowing text */}
                                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/30 mb-2.5 leading-relaxed">
                                                                        ${product.price}/unit · {product.sold} sold · {product.reviews} reviews · {product.stock} in stock · {product.category}
                                                                    </p>

                                                                    {/* Sparkline chart — larger view */}
                                                                    <div className="mb-3">
                                                                        {(() => {
                                                                            const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                                                                            const sparkSum = product.sparkline.reduce((a, b) => a + b, 0);
                                                                            const scale = sparkSum > 0 ? product.revenue / sparkSum : 0;
                                                                            const chartData = product.sparkline.map((v, si) => ({
                                                                                month: MONTHS[si] || `M${si + 1}`,
                                                                                revenue: Math.round(v * scale),
                                                                            }));
                                                                            const startVal = chartData[0]?.revenue || 0;
                                                                            const endVal = chartData[chartData.length - 1]?.revenue || 0;
                                                                            const maxVal = Math.max(...chartData.map(d => d.revenue));
                                                                            const changeDir = endVal >= startVal;
                                                                            return (
                                                                                <>
                                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                                        <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider">Revenue trend</p>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[9px] font-medium text-[#1A1A1A]/20">{fmtValue(startVal)}</span>
                                                                                            <ArrowRight size={8} strokeWidth={2} className={changeDir ? 'text-[#2eaa57]/50' : 'text-[#e74c3c]/50'} />
                                                                                            <span className={`text-[9px] font-bold ${changeDir ? 'text-[#2eaa57]/60' : 'text-[#e74c3c]/60'}`}>{fmtValue(endVal)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div style={{ width: '100%', height: 80 }}>
                                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                                            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                                                                                                <defs key="defs">
                                                                                                    <linearGradient id={`sparkGrad-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                                                        <stop offset="0%" stopColor="#0171E3" stopOpacity={0.12} />
                                                                                                        <stop offset="100%" stopColor="#0171E3" stopOpacity={0.01} />
                                                                                                    </linearGradient>
                                                                                                </defs>
                                                                                                <XAxis
                                                                                                    key="xaxis"
                                                                                                    dataKey="month"
                                                                                                    tick={{ fontSize: 8, fill: 'rgba(26,26,26,0.2)' }}
                                                                                                    axisLine={false}
                                                                                                    tickLine={false}
                                                                                                    interval={1}
                                                                                                />
                                                                                                <YAxis
                                                                                                    key="yaxis"
                                                                                                    tick={{ fontSize: 7, fill: 'rgba(26,26,26,0.15)' }}
                                                                                                    axisLine={false}
                                                                                                    tickLine={false}
                                                                                                    tickCount={4}
                                                                                                    tickFormatter={(v: any) => { const n = Number(v); return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'K' : '$' + n; }}
                                                                                                    domain={[0, Math.ceil((maxVal || 500) / 500) * 500]}
                                                                                                    width={32}
                                                                                                />
                                                                                                <Tooltip
                                                                                                    key="tooltip"
                                                                                                    contentStyle={{
                                                                                                        background: 'rgba(255,255,255,0.95)',
                                                                                                        backdropFilter: 'blur(12px)',
                                                                                                        border: '1px solid rgba(0,0,0,0.06)',
                                                                                                        borderRadius: 10,
                                                                                                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.08)',
                                                                                                        padding: '6px 10px',
                                                                                                        fontSize: 10,
                                                                                                    }}
                                                                                                    labelStyle={{ fontSize: 9, color: 'rgba(26,26,26,0.4)', fontWeight: 600, marginBottom: 2 }}
                                                                                                    formatter={(value: any) => [fmtValue(Number(value)), 'Revenue']}
                                                                                                    cursor={{ stroke: 'rgba(1,113,227,0.15)', strokeWidth: 1 }}
                                                                                                />
                                                                                                <Area
                                                                                                    key="area"
                                                                                                    type="monotone"
                                                                                                    dataKey="revenue"
                                                                                                    stroke="#0171E3"
                                                                                                    strokeWidth={1.5}
                                                                                                    strokeOpacity={0.5}
                                                                                                    fill={`url(#sparkGrad-${product.id})`}
                                                                                                    dot={false}
                                                                                                    activeDot={{ r: 3, fill: '#0171E3', stroke: '#fff', strokeWidth: 1.5 }}
                                                                                                />
                                                                                            </AreaChart>
                                                                                        </ResponsiveContainer>
                                                                                    </div>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    {/* Top buyer countries */}
                                                                    {product.topBuyers.length > 0 && (
                                                                        <>
                                                                            <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider mb-1.5">Top buying countries</p>
                                                                            {product.topBuyers.map((buyer, bi) => {
                                                                                const buyerRevenue = Math.round(product.revenue * buyer.pct / 100);
                                                                                return (
                                                                                    <div key={buyer.iso} className="flex items-center gap-2 py-[4px]">
                                                                                        <img src={`https://flagcdn.com/w40/${buyer.iso}.png`} alt={ISO_TO_COUNTRY[buyer.iso] || buyer.iso} className="w-[18px] h-[12px] rounded-[2px] object-cover flex-shrink-0" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />
                                                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/40 w-[70px] sm:w-[90px] truncate">{ISO_TO_COUNTRY[buyer.iso] || buyer.iso}</span>
                                                                                        <div className="flex-1 h-[3px] rounded-full bg-black/[0.04] overflow-hidden">
                                                                                            <motion.div
                                                                                                className="h-full rounded-full"
                                                                                                style={{ background: bi === 0 ? '#0171E3' : `rgba(1,113,227,${0.45 - bi * 0.08})` }}
                                                                                                initial={{ width: 0 }}
                                                                                                animate={{ width: `${buyer.pct * 2.5}%` }}
                                                                                                transition={{ delay: bi * 0.04, duration: 0.45, ease: EASE }}
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-[10px] font-bold text-[#1A1A1A]/40 tabular-nums w-[38px] text-right">{fmtValue(buyerRevenue)}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                );
                                            })}

                                            {/* Load more */}
                                            {visibleCounts.portfolio < EXTENDED_PORTFOLIO.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('portfolio')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">
                                                            Load more
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                                                            {visibleCounts.portfolio} / {EXTENDED_PORTFOLIO.length}
                                                        </span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20 mt-3 pt-2 border-t border-black/[0.025] leading-relaxed">
                                                <Sparkles size={10} strokeWidth={2} className="inline -mt-[1px] mr-1 text-[#0171E3]/30" />
                                                <span className="font-bold text-[#0171E3]/50">USB C Wire</span> converts at 6.8% — your best performer. <span className="font-bold text-[#0171E3]/50">Headphones</span> drive the most revenue at $12.9K.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ═══ BUYERS — flowing country list, no stat grids ═══ */}
                                    {activeTab === 'buyers' && (
                                        <motion.div key="buyers" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            {/* Headline as natural text */}
                                            <div className="py-3">
                                                <p className="text-[13px] font-medium text-[#1A1A1A]/40 leading-relaxed">
                                                    <span className="font-black text-[#0171E3]/70">{fmtValue(EXTENDED_COUNTRIES.reduce((s, c) => s + c.totalImports, 0))}</span> in imports across <span className="font-bold text-[#1A1A1A]/55">{EXTENDED_COUNTRIES.length} countries</span> — <span className="font-bold text-[#1A1A1A]/55">{EXTENDED_COUNTRIES.reduce((s, c) => s + c.orders7d, 0).toLocaleString()}</span> orders this week.
                                                </p>
                                            </div>

                                            {EXTENDED_COUNTRIES.slice(0, visibleCounts.buyers).map((country, ci) => {
                                                const isCountryExpanded = selectedProduct === `buyer-${country.id}`;
                                                return (
                                                <motion.div
                                                    key={country.id}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: ci * 0.03, duration: 0.3 }}
                                                    className={`-mx-2 px-2 cursor-pointer transition-all duration-200 ${ci > 0 ? 'border-t border-black/[0.025]' : ''} ${isCountryExpanded ? 'rounded-[14px] bg-[#F8F9FA]/60 border-black/[0.04] mb-1' : 'rounded-[10px] hover:bg-[#0171E3]/[0.015]'}`}
                                                    onClick={() => setSelectedProduct(isCountryExpanded ? null : `buyer-${country.id}`)}
                                                >
                                                    <div className="flex items-center gap-2.5 py-2.5">
                                                        {/* Flag — bigger for top 3 */}
                                                        <img
                                                            src={`https://flagcdn.com/w80/${country.id}.png`}
                                                            alt={country.name}
                                                            className={`${ci < 3 ? 'w-[26px] h-[18px]' : 'w-[22px] h-[15px]'} flex-shrink-0 rounded-[3px] object-cover`}
                                                            style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }}
                                                        />

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`${ci < 3 ? 'text-[13px]' : 'text-[12px]'} font-semibold text-[#1A1A1A]/65 truncate`}>{country.name}</p>
                                                            <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5">
                                                                {country.orders7d.toLocaleString()}/wk · avg ${country.avgOrderValue} · {country.repeatRate}% repeat
                                                            </p>
                                                        </div>

                                                        {!isCountryExpanded && (
                                                            <div className="hidden sm:block flex-shrink-0">
                                                                <MiniSparkline data={country.monthlyTrend} color="#0171E3" height={20} width={44} />
                                                            </div>
                                                        )}

                                                        <div className="text-right flex-shrink-0">
                                                            <p className={`${ci < 3 ? 'text-[13px]' : 'text-[12px]'} font-bold text-[#1A1A1A]/55 tabular-nums`}>{fmtValue(country.totalImports)}</p>
                                                            <span className="text-[10px] font-bold text-[#2eaa57] tabular-nums">+{country.growth}%</span>
                                                        </div>

                                                        {isCountryExpanded ? (
                                                            <ChevronUp size={11} strokeWidth={2} className="text-[#1A1A1A]/15 flex-shrink-0" />
                                                        ) : (
                                                            <ChevronDown size={11} strokeWidth={2} className="text-[#1A1A1A]/15 flex-shrink-0" />
                                                        )}
                                                    </div>

                                                    {/* Expanded — category bars + trend, no pill stats */}
                                                    <AnimatePresence>
                                                        {isCountryExpanded && (
                                                            <motion.div
                                                                key={`buyer-detail-${country.id}`}
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pb-3 pl-8">
                                                                    {/* Category bars — clean, no card wrapper */}
                                                                    <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider mb-1.5">What they buy</p>
                                                                    {country.topCategories.map((cat, catI) => (
                                                                        <div key={cat.name} className="flex items-center gap-2 py-[4px]">
                                                                            <span className="text-[10px] font-medium text-[#1A1A1A]/40 w-[70px] sm:w-[90px] truncate">{cat.name}</span>
                                                                            <div className="flex-1 h-[3px] rounded-full bg-black/[0.04] overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full rounded-full"
                                                                                    style={{ background: catI === 0 ? '#0171E3' : `rgba(1,113,227,${0.45 - catI * 0.1})` }}
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${(cat.value / country.topCategories[0].value) * 100}%` }}
                                                                                    transition={{ delay: catI * 0.04, duration: 0.45, ease: EASE }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-[#1A1A1A]/40 tabular-nums w-[38px] text-right">{fmtValue(cat.value)}</span>
                                                                        </div>
                                                                    ))}

                                                                    {/* Inline trend */}
                                                                    <div className="mt-3">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider">7-month trend</p>
                                                                            <span className="text-[8px] font-semibold text-[#2eaa57]/50">+{country.growth}%</span>
                                                                        </div>
                                                                        <div style={{ width: '100%', height: 48 }}>
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <AreaChart data={country.monthlyTrend.map((v, mi) => ({ v, m: ['S', 'O', 'N', 'D', 'J', 'F', 'M'][mi] }))}>
                                                                                    <defs key="defs">
                                                                                        <linearGradient id={`bg-${country.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                                            <stop offset="0%" stopColor="#0171E3" stopOpacity={0.12} />
                                                                                            <stop offset="100%" stopColor="#0171E3" stopOpacity={0} />
                                                                                        </linearGradient>
                                                                                    </defs>
                                                                                    <XAxis key="xaxis" dataKey="m" tick={{ fontSize: 7, fill: 'rgba(26,26,26,0.15)' }} axisLine={false} tickLine={false} />
                                                                                    <Area key="area" type="monotone" dataKey="v" stroke="#0171E3" strokeWidth={1.5} fill={`url(#bg-${country.id})`} dot={false} />
                                                                                </AreaChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                );
                                            })}

                                            {/* Load more */}
                                            {visibleCounts.buyers < EXTENDED_COUNTRIES.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('buyers')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">
                                                            Load more
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                                                            {visibleCounts.buyers} / {EXTENDED_COUNTRIES.length}
                                                        </span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20 mt-3 pt-2 border-t border-black/[0.025] leading-relaxed">
                                                <Globe2 size={10} strokeWidth={2} className="inline -mt-[1px] mr-1 text-[#0171E3]/30" />
                                                <span className="font-bold text-[#0171E3]/50">UAE</span> growing fastest at +31% with $198 avg orders. <span className="font-bold text-[#0171E3]/50">Japan</span> has 45% repeat rate — your most loyal market.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ═══ TRENDING PRODUCTS TAB ═══ */}
                                    {activeTab === 'trending' && (
                                        <motion.div key="trending" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            {/* Column headers */}
                                            <div className="flex items-center gap-2 py-2.5 text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-widest">
                                                <span className="w-[22px] text-center">#</span>
                                                <span className="flex-1">Product</span>
                                                <span className="w-[50px] text-center hidden sm:block">Score</span>
                                                <span className="w-[72px] text-center hidden sm:block">Trend</span>
                                                <span className="w-[62px] text-right">Trade Val</span>
                                                <span className="w-[42px] text-right">Chg</span>
                                                <span className="w-[22px]" />
                                            </div>

                                            {filteredProducts.length === 0 && (
                                                <div className="py-8 text-center">
                                                    <Search size={20} color="rgba(26,26,26,0.12)" strokeWidth={2} className="mx-auto mb-2" />
                                                    <p className="text-[12px] font-medium text-[#1A1A1A]/25">No products match your filters</p>
                                                    <button onClick={() => { setSearchQuery(''); setIndustry('all'); }} className="text-[11px] font-semibold text-[#0171E3]/60 mt-1 border-none bg-transparent cursor-pointer hover:text-[#0171E3]">
                                                        Clear filters
                                                    </button>
                                                </div>
                                            )}

                                            {filteredProducts.slice(0, visibleCounts.trending).map((product, i) => {
                                                const tradeValue = product.orders7d * product.avgPrice;
                                                const isExpanded = selectedProduct === product.id;
                                                const breakdown = isExpanded ? getMarketBreakdown(product) : [];
                                                return (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03, duration: 0.3 }}
                                                    className={`-mx-2 px-2 border-t border-black/[0.025] cursor-pointer transition-all duration-200 ${isExpanded ? 'rounded-[14px] bg-[#F8F9FA]/60 border-black/[0.04] mb-1' : 'rounded-[10px] hover:bg-[#0171E3]/[0.015]'}`}
                                                    onClick={() => setSelectedProduct(isExpanded ? null : product.id)}
                                                >
                                                    <div className="flex items-center gap-2 py-2.5">
                                                    <span className={`w-[22px] text-center text-[13px] font-black tabular-nums ${
                                                        i === 0 ? 'text-[#0171E3]/70' : i < 3 ? 'text-[#1A1A1A]/40' : 'text-[#1A1A1A]/18'
                                                    }`}>{i + 1}</span>

                                                    <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                                        <div className="w-[34px] h-[34px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#F5F5F7]">
                                                            <ImageWithFallback src={product.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-semibold text-[#1A1A1A]/65 truncate leading-tight">{product.name}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] font-medium text-[#1A1A1A]/25">{product.category}</span>
                                                                {product.badge && (
                                                                    <span
                                                                        className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-full"
                                                                        style={{
                                                                            background: BADGE_STYLES[product.badge].bg,
                                                                            color: BADGE_STYLES[product.badge].color,
                                                                            boxShadow: BADGE_STYLES[product.badge].glow,
                                                                        }}
                                                                    >
                                                                        {BADGE_STYLES[product.badge].label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isExpanded && (
                                                        <div className="w-[50px] hidden sm:flex justify-center">
                                                            <PopularityBar score={product.popularityScore} />
                                                        </div>
                                                    )}

                                                    {!isExpanded && (
                                                        <div className="w-[72px] hidden sm:flex justify-center">
                                                            <MiniSparkline data={product.sparkline} color={product.change >= 0 ? '#2eaa57' : '#e74c3c'} />
                                                        </div>
                                                    )}

                                                    <div className="w-[62px] text-right">
                                                        <span className="text-[12px] font-bold text-[#1A1A1A]/55 tabular-nums">{fmtValue(tradeValue)}</span>
                                                        <p className="text-[9px] font-medium text-[#1A1A1A]/20 tabular-nums">{product.orders7d.toLocaleString()} orders</p>
                                                    </div>

                                                    <div className="w-[42px] flex items-center justify-end gap-0.5">
                                                        {product.change >= 0 ? (
                                                            <TrendingUp size={9} color="#2eaa57" strokeWidth={2.5} />
                                                        ) : (
                                                            <TrendingDown size={9} color="#e74c3c" strokeWidth={2.5} />
                                                        )}
                                                        <span className={`text-[11px] font-bold tabular-nums ${product.change >= 0 ? 'text-[#2eaa57]' : 'text-[#e74c3c]'}`}>
                                                            {product.change >= 0 ? '+' : ''}{product.change}%
                                                        </span>
                                                    </div>

                                                    {isExpanded ? (
                                                        <div className="flex items-center gap-1">
                                                            <motion.button
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => { e.stopPropagation(); toggleSave(product.id); }}
                                                                className="w-[24px] h-[24px] rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
                                                                style={{ background: savedProducts.has(product.id) ? 'rgba(1,113,227,0.08)' : 'rgba(0,0,0,0.03)' }}
                                                            >
                                                                <Bookmark size={11} strokeWidth={2} color={savedProducts.has(product.id) ? '#0171E3' : 'rgba(26,26,26,0.2)'} fill={savedProducts.has(product.id) ? '#0171E3' : 'none'} />
                                                            </motion.button>
                                                            <ChevronUp size={12} strokeWidth={2} className="text-[#1A1A1A]/15" />
                                                        </div>
                                                    ) : (
                                                        <ChevronDown size={12} strokeWidth={2} className="w-[22px] text-[#1A1A1A]/15" />
                                                    )}
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                key={`detail-${product.id}`}
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pb-3 px-1">
                                                                    {/* Inline context — not pills, just flowing text */}
                                                                    <p className="text-[10px] font-medium text-[#1A1A1A]/30 mb-2.5 leading-relaxed">
                                                                        ${product.avgPrice}/unit · {(product.buyerInterest / 1000).toFixed(1)}K buyer interest · {product.competitorCount} competing sellers
                                                                        {product.relatedKeywords.slice(0, 3).map(kw => (
                                                                            <button
                                                                                key={kw}
                                                                                onClick={(e) => { e.stopPropagation(); setSearchQuery(kw); setActiveTab('keywords'); }}
                                                                                className="ml-1.5 text-[#0171E3]/40 font-semibold border-none bg-transparent cursor-pointer hover:text-[#0171E3]/60 transition-colors"
                                                                            >
                                                                                #{kw.replace(/ /g, '')}
                                                                            </button>
                                                                        ))}
                                                                    </p>

                                                                    {/* Country bars — no card wrapper */}
                                                                    <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider mb-1.5">Top buying countries</p>
                                                                    {breakdown.map((market, mi) => (
                                                                        <div key={market.country} className="flex items-center gap-2 py-[4px]">
                                                                            <img src={`https://flagcdn.com/w40/${market.iso}.png`} alt={market.country} className="w-[18px] h-[12px] rounded-[2px] object-cover flex-shrink-0" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />
                                                                            <span className="text-[10px] font-medium text-[#1A1A1A]/40 w-[70px] sm:w-[90px] truncate">{market.country}</span>
                                                                            <div className="flex-1 h-[3px] rounded-full bg-black/[0.04] overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full rounded-full"
                                                                                    style={{ background: mi === 0 ? '#0171E3' : `rgba(1,113,227,${0.45 - mi * 0.08})` }}
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${market.pct * 2.5}%` }}
                                                                                    transition={{ delay: mi * 0.04, duration: 0.45, ease: EASE }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-[#1A1A1A]/40 tabular-nums w-[38px] text-right">{fmtValue(market.value)}</span>
                                                                        </div>
                                                                    ))}

                                                                    {/* Weekly chart — no card wrapper */}
                                                                    <div className="mt-3 mb-1">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <p className="text-[9px] font-bold text-[#1A1A1A]/20 uppercase tracking-wider">This week</p>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="flex items-center gap-1 text-[8px] font-semibold text-[#1A1A1A]/15">
                                                                                    <span className="w-[5px] h-[5px] rounded-[1px] bg-[#0171E3]/50 inline-block" /> Orders
                                                                                </span>
                                                                                <span className="flex items-center gap-1 text-[8px] font-semibold text-[#1A1A1A]/15">
                                                                                    <span className="w-[5px] h-[5px] rounded-[1px] bg-[#1A1A1A]/8 inline-block" /> Views
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ width: '100%', height: 56 }}>
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <BarChart data={product.weeklyData} barGap={2}>
                                                                                    <XAxis key="xaxis" dataKey="day" tick={{ fontSize: 8, fill: 'rgba(26,26,26,0.15)' }} axisLine={false} tickLine={false} />
                                                                                    <Bar key="orders" dataKey="orders" fill="#0171E3" opacity={0.5} radius={[2, 2, 0, 0]} />
                                                                                    <Bar key="views" dataKey="views" fill="rgba(26,26,26,0.06)" radius={[2, 2, 0, 0]} />
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                );
                                            })}

                                            {/* Load more */}
                                            {visibleCounts.trending < filteredProducts.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('trending')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">
                                                            Load more
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">
                                                            {visibleCounts.trending} / {filteredProducts.length}
                                                        </span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20 mt-3 pt-2 border-t border-black/[0.025] leading-relaxed">
                                                <Sparkles size={10} strokeWidth={2} className="inline -mt-[1px] mr-1 text-[#0171E3]/30" />
                                                <span className="font-bold text-[#0171E3]/50">Concrete Plant Pots</span> are surging +38% with only 15 sellers — low competition, high opportunity.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ═══ BREAKOUT TAB ═══ */}
                                    {activeTab === 'breakout' && (
                                        <motion.div key="breakout" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            <p className="text-[11px] font-medium text-[#1A1A1A]/30 py-3">Products surging 25%+ in the last {timeRange}</p>

                                            {breakoutProducts.slice(0, visibleCounts.breakout).map((product, i) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                                    className={`flex items-center gap-3 py-3 -mx-2 px-2 rounded-[10px] hover:bg-[#e74444]/[0.01] transition-colors cursor-pointer ${i > 0 ? 'border-t border-black/[0.025]' : ''}`}
                                                    onClick={() => { setSelectedProduct(selectedProduct === product.id ? null : product.id); setActiveTab('trending'); }}
                                                >
                                                    <div className="w-[40px] h-[40px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[#F5F5F7]">
                                                        <ImageWithFallback src={product.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-semibold text-[#1A1A1A]/65 truncate">{product.name}</p>
                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5">
                                                            {product.category} · {fmtValue(product.orders7d * product.avgPrice)} · {product.competitorCount} sellers
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <span className="text-[13px] font-black text-[#e74444] tabular-nums">+{product.change}%</span>
                                                        <MiniSparkline data={product.sparkline} color="#e74444" height={18} width={48} />
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {/* Load more */}
                                            {visibleCounts.breakout < breakoutProducts.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('breakout')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">Load more</span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">{visibleCounts.breakout} / {breakoutProducts.length}</span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20 mt-3 pt-2 border-t border-black/[0.025] leading-relaxed">
                                                <Flame size={10} strokeWidth={2} className="inline -mt-[1px] mr-1 text-[#e74444]/30" />
                                                Breakout products sustain growth for 2-4 weeks. Early movers capture <span className="font-bold text-[#e74444]/50">3× more orders</span>.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ═══ TOP SELLERS TAB ═══ */}
                                    {activeTab === 'top' && (
                                        <motion.div key="top" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            <p className="text-[11px] font-medium text-[#1A1A1A]/30 py-3">By order volume this {timeRange === '24h' ? 'day' : timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : 'quarter'}</p>

                                            {topProducts.slice(0, visibleCounts.top).map((product, i) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03, duration: 0.3 }}
                                                    className={`flex items-center gap-2.5 py-2.5 -mx-2 px-2 rounded-[10px] hover:bg-black/[0.01] transition-colors cursor-pointer ${i > 0 ? 'border-t border-black/[0.025]' : ''}`}
                                                    onClick={() => { setSelectedProduct(selectedProduct === product.id ? null : product.id); setActiveTab('trending'); }}
                                                >
                                                    <div className="w-[22px] flex justify-center flex-shrink-0">
                                                        {i === 0 ? <span className="text-[14px]">🥇</span> :
                                                         i === 1 ? <span className="text-[14px]">🥈</span> :
                                                         i === 2 ? <span className="text-[14px]">🥉</span> :
                                                         <span className="text-[12px] font-black text-[#1A1A1A]/18 tabular-nums">{i + 1}</span>}
                                                    </div>
                                                    <div className="w-[32px] h-[32px] rounded-[8px] overflow-hidden flex-shrink-0">
                                                        <ImageWithFallback src={product.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-semibold text-[#1A1A1A]/65 truncate">{product.name}</p>
                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/25 mt-0.5">{product.category}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[13px] font-black text-[#0171E3]/70 tabular-nums">{fmtValue(product.orders7d * product.avgPrice)}</p>
                                                        <p className="text-[9px] font-medium text-[#1A1A1A]/20 tabular-nums">{product.orders7d.toLocaleString()} orders</p>
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {/* Load more */}
                                            {visibleCounts.top < topProducts.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('top')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">Load more</span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">{visibleCounts.top} / {topProducts.length}</span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ═══ KEYWORDS TAB ═══ */}
                                    {activeTab === 'keywords' && (
                                        <motion.div key="keywords" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                                            <p className="text-[11px] font-medium text-[#1A1A1A]/30 py-3">What buyers are searching for</p>

                                            {filteredKeywords.slice(0, visibleCounts.keywords).map((kw, i) => (
                                                <motion.div
                                                    key={`${kw.keyword}-${i}`}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.025, duration: 0.3 }}
                                                    className={`flex items-center gap-2 py-2 -mx-2 px-2 rounded-lg hover:bg-black/[0.01] transition-colors cursor-pointer ${i > 0 ? 'border-t border-black/[0.025]' : ''}`}
                                                    onClick={() => { setSearchQuery(kw.keyword); setActiveTab('trending'); }}
                                                >
                                                    <span className="w-[22px] text-center text-[11px] font-bold text-[#1A1A1A]/18 tabular-nums">{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-semibold text-[#1A1A1A]/60 truncate">
                                                            <span className="text-[#0171E3]/35">#</span>{kw.keyword.replace(/ /g, '')}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-[#1A1A1A]/20 truncate">{kw.product}</p>
                                                    </div>
                                                    <span className="w-[50px] text-right text-[12px] font-bold text-[#1A1A1A]/40 tabular-nums">
                                                        {kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(1)}K` : kw.volume}
                                                    </span>
                                                    <div className="w-[42px] flex items-center justify-end gap-0.5">
                                                        {kw.change >= 0 ? <TrendingUp size={9} color="#2eaa57" strokeWidth={2.5} /> : <TrendingDown size={9} color="#e74c3c" strokeWidth={2.5} />}
                                                        <span className={`text-[10px] font-bold tabular-nums ${kw.change >= 0 ? 'text-[#2eaa57]' : 'text-[#e74c3c]'}`}>
                                                            {kw.change >= 0 ? '+' : ''}{kw.change}%
                                                        </span>
                                                    </div>
                                                    <span className={`w-[52px] text-right text-[10px] font-semibold hidden sm:block ${
                                                        kw.competition === 'Low' ? 'text-[#2eaa57]' : kw.competition === 'Medium' ? 'text-[#e67e22]' : 'text-[#e74c3c]'
                                                    }`}>{kw.competition}</span>
                                                </motion.div>
                                            ))}

                                            {/* Load more */}
                                            {visibleCounts.keywords < filteredKeywords.length && (
                                                <div className="flex justify-center mt-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        onClick={() => loadMore('keywords')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full cursor-pointer border-none transition-all duration-200"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.6)',
                                                            backdropFilter: 'blur(16px)',
                                                            WebkitBackdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.5)',
                                                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                                    >
                                                        <span className="text-[11px] font-bold text-[#1A1A1A]/40">Load more</span>
                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/25">{visibleCounts.keywords} / {filteredKeywords.length}</span>
                                                        <ChevronDown size={11} color="rgba(26,26,26,0.35)" strokeWidth={2.5} />
                                                    </motion.button>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-medium text-[#1A1A1A]/20 mt-3 pt-2 border-t border-black/[0.025] leading-relaxed">
                                                <Info size={10} strokeWidth={2} className="inline -mt-[1px] mr-1 text-[#2eaa57]/30" />
                                                <span className="font-bold text-[#2eaa57]/50">Low competition</span> + high volume = your best opportunity. Optimize listing titles with these terms.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
