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
import { authedFetch } from '@/lib/api';

const FONT = "'Urbanist', sans-serif";
/* Chart + animation easing */
const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

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

function hashString(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

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

interface KeywordRow {
    keyword: string;
    product: string;
    volume: number;
    change: number;
    competition: 'Low' | 'Medium' | 'High';
}

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
function getMarketBreakdown(product: TrendingProduct, getName: (iso: string) => string) {
    const markets = Array.from(new Set((product.topMarkets || []).map((m) => (m || '').toLowerCase()).filter(Boolean))).slice(0, 5);
    if (markets.length === 0) return [];
    const totalValue = product.orders7d * product.avgPrice;
    const per = Math.round(100 / markets.length);
    const pcts = markets.map((_, idx) => (idx === markets.length - 1 ? (100 - per * (markets.length - 1)) : per));
    return markets.map((iso, i) => {
        const pct = pcts[i];
        const orders = Math.round(product.orders7d * pct / 100);
        const value = Math.round(totalValue * pct / 100);
        return { country: getName(iso), iso, orders, value, pct };
    });
}

function fmtValue(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n}`;
}

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
    const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
    const [portfolioProducts, setPortfolioProducts] = useState<SellerProduct[]>([]);
    const [buyerCountries, setBuyerCountries] = useState<BuyerCountry[]>([]);
    const [keywordRows, setKeywordRows] = useState<KeywordRow[]>([]);
    const [visibleCounts, setVisibleCounts] = useState<Record<TabId, number>>({
        portfolio: INITIAL_VISIBLE, buyers: INITIAL_VISIBLE, trending: INITIAL_VISIBLE,
        breakout: INITIAL_VISIBLE, top: INITIAL_VISIBLE, keywords: INITIAL_VISIBLE,
    });
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        const t = window.setTimeout(() => {
            (async () => {
                try {
                    const params = new URLSearchParams();
                    params.set("range", timeRange);
                    params.set("limit", "100");
                    if (industry !== "all") params.set("industry", industry);
                    if (searchQuery.trim()) params.set("search", searchQuery.trim());
                    const res = await authedFetch(`/api/v1/seller/dashboard/trends/?${params.toString()}`);
                    if (!res.ok) {
                        if (!cancelled) setTrendingProducts([]);
                        return;
                    }
                    const data = await res.json().catch(() => null);
                    if (cancelled) return;
                    setTrendingProducts(Array.isArray(data) ? (data as TrendingProduct[]) : []);
                } catch (e) {
                    if (!cancelled) setTrendingProducts([]);
                }
            })();
        }, 250);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [timeRange, industry, searchQuery]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams();
                params.set("range", timeRange);
                params.set("limit", "100");
                if (industry !== "all") params.set("industry", industry);
                const res = await authedFetch(`/api/v1/seller/dashboard/insights/portfolio/?${params.toString()}`);
                if (!res.ok) {
                    if (!cancelled) setPortfolioProducts([]);
                    return;
                }
                const data = await res.json().catch(() => null);
                if (cancelled) return;
                setPortfolioProducts(Array.isArray(data) ? (data as SellerProduct[]) : []);
            } catch (e) {
                if (!cancelled) setPortfolioProducts([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [timeRange, industry]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams();
                params.set("range", timeRange);
                const res = await authedFetch(`/api/v1/seller/dashboard/insights/buyers/?${params.toString()}`);
                if (!res.ok) {
                    if (!cancelled) setBuyerCountries([]);
                    return;
                }
                const data = await res.json().catch(() => null);
                if (cancelled) return;
                setBuyerCountries(Array.isArray(data) ? (data as BuyerCountry[]) : []);
            } catch (e) {
                if (!cancelled) setBuyerCountries([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [timeRange]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams();
                params.set("range", timeRange);
                params.set("limit", "100");
                if (industry !== "all") params.set("industry", industry);
                const res = await authedFetch(`/api/v1/seller/dashboard/insights/keywords/?${params.toString()}`);
                if (!res.ok) {
                    if (!cancelled) setKeywordRows([]);
                    return;
                }
                const data = await res.json().catch(() => null);
                if (cancelled) return;
                setKeywordRows(Array.isArray(data) ? (data as KeywordRow[]) : []);
            } catch (e) {
                if (!cancelled) setKeywordRows([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [timeRange, industry]);

    const countryNameByIso = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        for (const c of buyerCountries) {
            const id = (c?.id || '').toLowerCase();
            if (!id) continue;
            map[id] = c.name || id.toUpperCase();
        }
        return map;
    }, [buyerCountries]);

    const industryOptions = useMemo(() => {
        const set = new Set<string>();
        for (const p of trendingProducts) {
            const slug = (p?.industry || '').trim();
            if (slug) set.add(slug);
        }
        const ids = Array.from(set).sort((a, b) => a.localeCompare(b));
        return [{ id: 'all', label: 'All Industries' }, ...ids.map((id) => ({ id, label: id }))];
    }, [trendingProducts]);

    const countryOptions = useMemo(() => {
        const set = new Set<string>();
        for (const p of trendingProducts) {
            for (const iso of (p?.topMarkets || [])) {
                const v = (iso || '').toLowerCase().trim();
                if (v) set.add(v);
            }
        }
        for (const c of buyerCountries) {
            const v = (c?.id || '').toLowerCase().trim();
            if (v) set.add(v);
        }
        const ids = Array.from(set).sort((a, b) => a.localeCompare(b));
        return [{ id: 'all', label: 'All Countries', flag: '' }, ...ids.map((id) => ({ id, label: countryNameByIso[id] || id.toUpperCase(), flag: id }))];
    }, [buyerCountries, countryNameByIso, trendingProducts]);

    const allKeywords = useMemo<KeywordRow[]>(() => {
        const rows = trendingProducts.flatMap(p =>
            p.relatedKeywords.map(kw => {
                const seed = hashString(`${p.id}:${kw}`);
                const mult = 0.2 + (seed % 30) / 100;
                const drift = 0.5 + (seed % 100) / 100;
                return {
                    keyword: kw,
                    product: p.name,
                    volume: Math.round(p.buyerInterest * mult),
                    change: Math.round(p.change * drift),
                    competition: (p.competitorCount > 40 ? 'High' : p.competitorCount > 20 ? 'Medium' : 'Low') as KeywordRow['competition'],
                };
            })
        );
        return rows.sort((a, b) => b.volume - a.volume).slice(0, 15);
    }, [trendingProducts]);

    const extendedProducts = useMemo(() => trendingProducts, [trendingProducts]);
    const extendedKeywords = useMemo<KeywordRow[]>(() => (keywordRows.length ? keywordRows : allKeywords), [keywordRows, allKeywords]);

    const loadMore = (tab: TabId) => {
        setVisibleCounts(prev => ({
            ...prev,
            [tab]: Math.min(prev[tab] + LOAD_MORE_INCREMENT, MAX_VISIBLE),
        }));
    };

    /* ── Filtered products ── */
    const filteredProducts = useMemo(() => {
        let filtered = extendedProducts as TrendingProduct[];
        if (industry !== 'all') filtered = filtered.filter(p => p.industry === industry);
        if (country !== 'all') filtered = filtered.filter(p => (p.topMarkets || []).includes(country));
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.relatedKeywords.some(kw => kw.toLowerCase().includes(q))
            );
        }
        return filtered;
    }, [extendedProducts, industry, country, searchQuery]);

    const breakoutProducts = useMemo(() =>
        extendedProducts.filter(p => p.badge === 'breakout' || (p.change >= 25)).sort((a, b) => b.change - a.change),
    [extendedProducts]);

    const topProducts = useMemo(() =>
        [...extendedProducts].sort((a, b) => b.orders7d - a.orders7d),
    [extendedProducts]);

    const filteredKeywords = useMemo<KeywordRow[]>(() => {
        if (!searchQuery.trim()) return extendedKeywords;
        const q = searchQuery.toLowerCase();
        return extendedKeywords.filter(k => k.keyword.toLowerCase().includes(q) || k.product.toLowerCase().includes(q));
    }, [extendedKeywords, searchQuery]);

    const toggleSave = (id: string) => {
        setSavedProducts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    /* ── Collapsed summary stats ── */
    const topItem = extendedProducts[0] || trendingProducts[0] || null;
    const totalOrders7d = extendedProducts.reduce((s, p) => s + p.orders7d, 0);

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
                        {topItem ? (
                            <>
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

                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {trendingProducts.slice(1, 5).map(p => (
                                            <div key={p.id} className="w-[24px] h-[24px] rounded-[6px] overflow-hidden border-2 border-white flex-shrink-0">
                                                <ImageWithFallback src={p.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-semibold text-[#1A1A1A]/25">
                                        {totalOrders7d.toLocaleString()} orders this week across {trendingProducts.length} trending products
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-[#1A1A1A]/60">No trends yet</p>
                                    <p className="text-[10px] font-medium text-[#1A1A1A]/30">Once products/orders exist, trends will appear here.</p>
                                </div>
                                <ArrowUpRight size={14} color="rgba(26,26,26,0.15)" strokeWidth={2} className="flex-shrink-0" />
                            </div>
                        )}
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
                                        options={industryOptions}
                                        value={industry}
                                        onChange={setIndustry}
                                        icon={<SlidersHorizontal size={11} strokeWidth={2} className="text-[#1A1A1A]/30" />}
                                    />
                                    <DropdownSelect
                                        options={countryOptions}
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
                                                    You've earned <span className="font-black text-[#0171E3]/70">{fmtValue(portfolioProducts.reduce((s, p) => s + p.revenue, 0))}</span> across <span className="font-bold text-[#1A1A1A]/55">{portfolioProducts.filter(p => p.status === 'active').length} active</span> products — <span className="font-bold text-[#1A1A1A]/55">{portfolioProducts.reduce((s, p) => s + p.sold, 0)} units</span> sold, rated <span className="font-bold text-[#e67e22]/60">{(portfolioProducts.filter(p => p.rating > 0).length ? (portfolioProducts.filter(p => p.rating > 0).reduce((s, p) => s + p.rating, 0) / portfolioProducts.filter(p => p.rating > 0).length).toFixed(1) : '0.0')}</span> avg.
                                                </p>
                                            </div>

                                            {/* Products sorted by revenue — hero first, rest tight */}
                                            {[...portfolioProducts].sort((a, b) => b.revenue - a.revenue).slice(0, visibleCounts.portfolio).map((product, i) => {
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
                                                                                const buyerIso = (buyer.iso || '').toLowerCase();
                                                                                const buyerName = (countryNameByIso[buyerIso] || buyerIso.toUpperCase() || buyer.iso);
                                                                                return (
                                                                                    <div key={buyer.iso} className="flex items-center gap-2 py-[4px]">
                                                                                        <img src={`https://flagcdn.com/w40/${buyerIso || buyer.iso}.png`} alt={buyerName} className="w-[18px] h-[12px] rounded-[2px] object-cover flex-shrink-0" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }} />
                                                                                        <span className="text-[10px] font-medium text-[#1A1A1A]/40 w-[70px] sm:w-[90px] truncate">{buyerName}</span>
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
                                            {visibleCounts.portfolio < portfolioProducts.length && (
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
                                                            {visibleCounts.portfolio} / {portfolioProducts.length}
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
                                                    <span className="font-black text-[#0171E3]/70">{fmtValue(buyerCountries.reduce((s: number, c: BuyerCountry) => s + c.totalImports, 0))}</span> in imports across <span className="font-bold text-[#1A1A1A]/55">{buyerCountries.length} countries</span> — <span className="font-bold text-[#1A1A1A]/55">{buyerCountries.reduce((s: number, c: BuyerCountry) => s + c.orders7d, 0).toLocaleString()}</span> orders this week.
                                                </p>
                                            </div>

                                            {buyerCountries.slice(0, visibleCounts.buyers).map((country, ci) => {
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
                                            {visibleCounts.buyers < buyerCountries.length && (
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
                                                            {visibleCounts.buyers} / {buyerCountries.length}
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
                                                const breakdown = isExpanded ? getMarketBreakdown(product, (iso) => countryNameByIso[(iso || '').toLowerCase()] || (iso || '').toUpperCase() || iso) : [];
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
