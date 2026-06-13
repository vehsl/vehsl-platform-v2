"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  Eye,
  Filter,
  Globe,
  Hash,
  Package,
  Play,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
  Users,
  X,
} from "lucide-react";

import { BounceButton } from "./BounceButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StatusPill } from "./StatusPill";
import { fmtMoney as fmtMoneyUtil } from "@/lib/utils";
import {
  SellerTrendSeller,
  SellerTrendsProductSort,
  SellerTrendsOption,
  useAdminSellerTrends,
} from "./useAdminSellerTrends";

const timeRanges = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "120d", label: "120 days" },
] as const;

const productSortOptions: { value: SellerTrendsProductSort; label: string }[] = [
  { value: "orders", label: "Top Orders" },
  { value: "revenue", label: "Top Revenue" },
  { value: "change", label: "Fastest Growth" },
];

type BadgeType = "breakout" | "popular" | "new" | "rising" | "steady";

function formatNum(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function formatMoney(value: number) {
  return fmtMoneyUtil(value || 0);
}

function TrendBadge({ type }: { type: string }) {
  const config: Record<BadgeType, { label: string; className: string }> = {
    breakout: { label: "Breakout", className: "bg-[#E5484D]/10 text-[#E5484D]" },
    popular: { label: "Popular", className: "bg-[#0171E3]/10 text-[#0171E3]" },
    new: { label: "New", className: "bg-[#30A46C]/10 text-[#30A46C]" },
    rising: { label: "Rising", className: "bg-[#FFB224]/10 text-[#D97706]" },
    steady: { label: "Steady", className: "bg-muted/40 text-muted-foreground" },
  };
  const normalized = (type in config ? type : "steady") as BadgeType;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] ${config[normalized].className}`}>{config[normalized].label}</span>;
}

function MiniSparkline({ data, color = "#30A46C", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const points = data.length ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const polyline = points
    .map((value, index) => `${(index / Math.max(points.length - 1, 1)) * width},${height - ((value - min) / range) * (height - 4) - 2}`)
    .join(" ");
  const fill = `${polyline} ${width},${height} 0,${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`seller-trend-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#seller-trend-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SimpleBarChart({ data }: { data: { day: string; orders: number; revenue: number }[] }) {
  const normalized = data.length ? data : [{ day: "-", orders: 0, revenue: 0 }];
  const maxValue = Math.max(...normalized.flatMap((row) => [row.orders, row.revenue]), 1);
  return (
    <div className="flex h-[120px] items-end gap-2">
      {normalized.map((row) => (
        <div key={row.day} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-[100px] w-full items-end gap-1">
            <div className="flex-1 rounded-t-md bg-[#0171E3]" style={{ height: `${(row.orders / maxValue) * 100}%` }} />
            <div className="flex-1 rounded-t-md bg-[#30A46C]" style={{ height: `${(row.revenue / maxValue) * 100}%` }} />
          </div>
          <span className="text-[0.5625rem] text-muted-foreground">{row.day}</span>
        </div>
      ))}
    </div>
  );
}

function Dropdown({
  value,
  options,
  onChange,
  icon,
  getValue,
  getLabel,
  getFlag,
}: {
  value: string;
  options: SellerTrendsOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  getValue: (option: SellerTrendsOption) => string;
  getLabel: (option: SellerTrendsOption) => string;
  getFlag?: (option: SellerTrendsOption) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => getValue(option) === value) || options[0];

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-card px-3.5 py-2 text-[0.8125rem] text-foreground transition-all hover:bg-muted/30"
      >
        {icon}
        {getFlag ? <span>{getFlag(selected) || ""}</span> : null}
        <span>{getLabel(selected)}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((option) => {
              const optionValue = getValue(option);
              return (
                <button
                  key={optionValue}
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-[0.8125rem] transition-colors ${optionValue === value ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted/40"}`}
                >
                  {getFlag ? <span>{getFlag(option) || ""}</span> : null}
                  <span>{getLabel(option)}</span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function BigStat({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</div>
      <p className="mb-1 text-[0.75rem] text-muted-foreground">{label}</p>
      <p className="mb-1.5 text-[1.75rem] leading-none tracking-tight text-foreground">{value}</p>
      <p className="text-[0.6875rem] text-muted-foreground">{sub}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border/50 bg-card p-10 text-center text-[0.875rem] text-muted-foreground">{message}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-[#E5484D]/20 bg-[#E5484D]/5 p-4 text-[0.8125rem] text-[#B42318]">{message}</div>;
}

export function SellerTrends() {
  const {
    period,
    search,
    industry,
    country,
    sortBy,
    activeTab,
    setPeriod,
    setSearch,
    setIndustry,
    setCountry,
    setSortBy,
    setActiveTab,
    refresh,
    summary,
    products,
    breakoutProducts,
    sellers,
    keywords,
    reels,
    summaryLoading,
    productsLoading,
    sellersLoading,
    keywordsLoading,
    reelsLoading,
    summaryError,
    productsError,
    sellersError,
    keywordsError,
    reelsError,
  } = useAdminSellerTrends();

  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerTrendSeller | null>(null);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) setSearch(localSearch);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [localSearch, search, setSearch]);

  const industryOptions = useMemo(() => summary?.filters.industry_options || [{ value: "all", label: "All Industries" }], [summary]);
  const countryOptions = useMemo(() => summary?.filters.country_options || [{ code: "all", name: "All Regions", flag: "" }], [summary]);
  const currentProducts = activeTab === "breakout" ? breakoutProducts : products;
  const tabs = [
    { id: "trending" as const, label: "Trending Products", short: "Trending" },
    { id: "breakout" as const, label: "Breakout", short: "Breakout" },
    { id: "sellers" as const, label: "Top Sellers", short: "Sellers" },
    { id: "keywords" as const, label: "Keywords", short: "Keywords" },
  ];
  const hero = summary?.metrics;

  return (
    <div className="max-w-[1400px] space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[1.35rem] text-foreground">Seller Trends</h2>
          <p className="text-[0.8125rem] text-muted-foreground">Real ops-manager analytics for products, sellers, keywords, and video content.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary?.data_sources?.length ? (
            <div className="rounded-full bg-muted/30 px-3 py-1 text-[0.6875rem] text-muted-foreground">Sources: {summary.data_sources.join(", ")}</div>
          ) : null}
          <BounceButton onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3.5 py-2 text-[0.8125rem] text-foreground">
            <RefreshCw size={14} /> Refresh
          </BounceButton>
        </div>
      </div>

      {summaryError ? <ErrorState message={summaryError} /> : null}
      {summary?.warnings?.length ? <ErrorState message={summary.warnings.join(" ")} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <BigStat
          icon={<CircleDollarSign size={22} className="text-[#30A46C]" />}
          iconBg="bg-[#30A46C]/10"
          label="Total Sales Value"
          value={summaryLoading && !hero ? "..." : formatMoney(hero?.total_sales_value || 0)}
          sub={`Avg ${formatMoney(hero?.avg_order_value || 0)} per order`}
        />
        <BigStat
          icon={<ShoppingCart size={22} className="text-[#0171E3]" />}
          iconBg="bg-[#0171E3]/10"
          label="Total Orders"
          value={summaryLoading && !hero ? "..." : formatNum(hero?.total_orders || 0)}
          sub={`Across ${formatNum(hero?.active_sellers || 0)} active sellers`}
        />
        <BigStat
          icon={<Eye size={22} className="text-[#D97706]" />}
          iconBg="bg-[#FFB224]/10"
          label="Total Views"
          value={summaryLoading && !hero ? "..." : formatNum(hero?.total_views || 0)}
          sub={`${(hero?.buy_rate || 0).toFixed(1)}% buy rate, ${products[0]?.views_source || "derived"} views`}
        />
        <BigStat
          icon={<Users size={22} className="text-[#E5484D]" />}
          iconBg="bg-[#E5484D]/10"
          label="Active Sellers"
          value={summaryLoading && !hero ? "..." : `${hero?.active_sellers || 0}`}
          sub={`Tracking ${formatNum(products.length)} ranked products`}
        />
      </div>

      <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/30 px-4 py-2.5 transition-all focus-within:bg-card focus-within:shadow-[0_0_0_2px_rgba(1,113,227,0.15)]">
            <Search size={16} className="flex-shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, categories, sellers..."
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              className="w-full border-none bg-transparent text-[0.8125rem] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {localSearch ? (
              <button onClick={() => setLocalSearch("")} className="cursor-pointer rounded-lg p-0.5 hover:bg-muted/40">
                <X size={14} className="text-muted-foreground" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown
              value={industry}
              options={industryOptions}
              onChange={setIndustry}
              icon={<Filter size={13} className="text-muted-foreground" />}
              getValue={(option) => String(option.value || "all")}
              getLabel={(option) => String(option.label || "All Industries")}
            />
            <Dropdown
              value={country}
              options={countryOptions}
              onChange={setCountry}
              icon={<Globe size={13} className="text-muted-foreground" />}
              getValue={(option) => String(option.code || "all")}
              getLabel={(option) => String(option.name || "All Regions")}
              getFlag={(option) => String(option.flag || "")}
            />
            <Dropdown
              value={sortBy}
              options={productSortOptions}
              onChange={(value) => setSortBy(value as SellerTrendsProductSort)}
              icon={<ArrowDown size={13} className="text-muted-foreground" />}
              getValue={(option) => String(option.value || "orders")}
              getLabel={(option) => String(option.label || "Top Orders")}
            />
            <div className="flex items-center gap-1 rounded-xl bg-muted/30 p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setPeriod(range.value)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-[0.75rem] transition-all ${period === range.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-border/40 bg-card p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-[0.8125rem] transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
          >
            <span>{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {(activeTab === "trending" || activeTab === "breakout") && (
        <div className="space-y-3">
          {productsError ? <ErrorState message={productsError} /> : null}
          {productsLoading && currentProducts.length === 0 ? <EmptyState message="Loading trend products..." /> : null}
          {!productsLoading && currentProducts.length === 0 ? <EmptyState message={activeTab === "breakout" ? "No breakout products match your filters." : "No trend products match your filters."} /> : null}
          {currentProducts.map((product) => (
            <motion.div
              key={product.id}
              className={`overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md ${expandedProduct === product.id ? "ring-2 ring-primary/15" : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setExpandedProduct((current) => (current === product.id ? null : product.id))}
            >
              <div className="flex cursor-pointer items-center gap-4 p-4 sm:p-5">
                <div className="flex w-10 flex-col items-center">
                  <span className="text-[1.5rem] leading-none text-foreground">{product.rank}</span>
                  <span className={`mt-0.5 flex items-center gap-0.5 text-[0.625rem] ${product.change >= 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                    {product.change >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                    {Math.abs(product.change)}%
                  </span>
                </div>
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
                  <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] text-foreground">{product.name}</p>
                  <p className="text-[0.6875rem] text-muted-foreground">{product.category}</p>
                </div>
                <div className="hidden flex-shrink-0 text-right sm:block">
                  <p className="text-[1.125rem] tracking-tight text-foreground">{formatMoney(product.revenue7d)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">current sales value</p>
                </div>
                <div className="hidden w-[80px] flex-shrink-0 text-right md:block">
                  <p className="text-[0.875rem] text-foreground">{formatNum(product.orders7d)}</p>
                  <p className="text-[0.5625rem] text-muted-foreground">units sold</p>
                </div>
                <div className="hidden flex-shrink-0 lg:block">
                  <MiniSparkline data={product.sparkline} color={product.change >= 0 ? "#30A46C" : "#E5484D"} />
                </div>
                <div className="flex-shrink-0">
                  <TrendBadge type={product.badge} />
                </div>
              </div>
              <AnimatePresence>
                {expandedProduct === product.id ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 border-t border-border/30 p-5 sm:p-6">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {[
                          { label: "Sales", value: formatMoney(product.revenue7d) },
                          { label: "Orders", value: formatNum(product.orders7d) },
                          { label: "Views", value: formatNum(product.views7d) },
                          { label: "Avg Price", value: formatMoney(product.avgPrice) },
                          { label: "Sellers", value: `${product.sellers}` },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-border/20 bg-muted/8 p-4 text-center">
                            <p className="text-[1.05rem] tracking-tight text-foreground">{item.value}</p>
                            <p className="mt-0.5 text-[0.625rem] text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-border/20 bg-muted/8 p-5">
                          <p className="mb-1 text-[0.875rem] text-foreground">Weekly Performance</p>
                          <p className="mb-4 text-[0.6875rem] text-muted-foreground">Orders and revenue trend for the selected period.</p>
                          <SimpleBarChart data={product.weeklyData.map((point) => ({ day: point.day, orders: point.orders, revenue: point.revenue }))} />
                        </div>
                        <div className="rounded-2xl border border-border/20 bg-muted/8 p-5">
                          <p className="mb-1 text-[0.875rem] text-foreground">Top Markets</p>
                          <p className="mb-4 text-[0.6875rem] text-muted-foreground">Where buyers are purchasing this product.</p>
                          <div className="space-y-3">
                            {product.topMarkets.length ? (
                              product.topMarkets.map((market) => (
                                <div key={`${product.id}-${market.code || market.name}`} className="flex items-center gap-3">
                                  <span>{market.flag}</span>
                                  <span className="w-[100px] truncate text-[0.8125rem] text-foreground">{market.name}</span>
                                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted/30">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-[#0171E3] to-[#348DE9]"
                                      style={{ width: `${(market.revenue / Math.max(product.topMarkets[0]?.revenue || 1, 1)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-[70px] text-right text-[0.75rem] text-foreground">{formatMoney(market.revenue)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[0.75rem] text-muted-foreground">No market breakdown is available for this filter.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Hash size={14} className="text-muted-foreground" />
                          <p className="text-[0.875rem] text-foreground">Related searches</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {product.relatedKeywords.length ? (
                            product.relatedKeywords.map((keyword) => (
                              <span key={`${product.id}-${keyword}`} className="rounded-full bg-muted/30 px-3 py-1.5 text-[0.75rem] text-foreground">
                                #{keyword}
                              </span>
                            ))
                          ) : (
                            <span className="text-[0.75rem] text-muted-foreground">No keyword signals available.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "sellers" && (
        <div className="overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="border-b border-border/30 p-6">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[1.125rem]">Sellers</span>
              <h3 className="text-foreground">Top Sellers</h3>
            </div>
            <p className="text-[0.75rem] text-muted-foreground">Click any seller to open their performance detail.</p>
          </div>
          {sellersError ? <div className="p-6"><ErrorState message={sellersError} /></div> : null}
          {sellersLoading && sellers.length === 0 ? <div className="p-6"><EmptyState message="Loading top sellers..." /></div> : null}
          {!sellersLoading && sellers.length === 0 ? <div className="p-6"><EmptyState message="No sellers match the current filters." /></div> : null}
          {sellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => setSelectedSeller(seller)}
              className="flex cursor-pointer items-center gap-4 border-b border-border/15 px-5 py-5 transition-all hover:bg-muted/15 sm:px-6"
            >
              <div className="flex w-10 flex-shrink-0 items-center justify-center">
                <span className="text-[1.125rem] text-muted-foreground">{seller.rank}</span>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/35 text-[0.875rem] text-primary">{seller.avatar}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.875rem] text-foreground">{seller.name}</p>
                <div className="mt-0.5 flex items-center gap-3 text-[0.6875rem] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Package size={10} />{seller.products} products</span>
                  <span className="flex items-center gap-0.5"><Star size={10} className="text-[#FFB224]" />{seller.rating.toFixed(1)}</span>
                  <span className="hidden sm:inline-flex items-center gap-0.5"><Calendar size={10} />{seller.joinedMonthsAgo}mo</span>
                </div>
              </div>
              <div className="hidden flex-shrink-0 text-right sm:block">
                <p className="text-[1.25rem] tracking-tight text-foreground">{formatMoney(seller.revenue)}</p>
                <p className="text-[0.5625rem] text-muted-foreground">sales</p>
              </div>
              <div className="hidden w-[70px] flex-shrink-0 text-right md:block">
                <p className="text-[0.875rem] text-foreground">{formatNum(seller.orders)}</p>
                <p className="text-[0.5625rem] text-muted-foreground">units</p>
              </div>
              <div className={`flex flex-shrink-0 items-center gap-0.5 text-[0.8125rem] ${seller.change >= 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                {seller.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {Math.abs(seller.change)}%
              </div>
              <ArrowRight size={16} className="hidden flex-shrink-0 text-muted-foreground/40 sm:block" />
            </div>
          ))}
        </div>
      )}

      {activeTab === "keywords" && (
        <div className="overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="border-b border-border/30 p-6">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[1.125rem]">Keywords</span>
              <h3 className="text-foreground">What Buyers Search For</h3>
            </div>
            <p className="text-[0.75rem] text-muted-foreground">Derived keyword signals based on real catalog and order activity.</p>
          </div>
          {keywordsError ? <div className="p-6"><ErrorState message={keywordsError} /></div> : null}
          {keywordsLoading && keywords.length === 0 ? <div className="p-6"><EmptyState message="Loading keyword trends..." /></div> : null}
          {!keywordsLoading && keywords.length === 0 ? <div className="p-6"><EmptyState message="No keyword data matches the current filters." /></div> : null}
          {keywords.map((keyword, index) => (
            <div key={`${keyword.keyword}-${index}`} className="flex items-center gap-4 border-b border-border/15 px-5 py-4 transition-all hover:bg-muted/15 sm:px-6">
              <span className="w-6 flex-shrink-0 text-center text-[0.9375rem] text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[0.875rem] text-foreground">{keyword.keyword}</span>
                  {keyword.change >= 35 ? <TrendBadge type="breakout" /> : keyword.change >= 10 ? <TrendBadge type="rising" /> : null}
                </div>
                <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">Top product: {keyword.product} • source: {keyword.source_type}</p>
              </div>
              <div className="hidden w-[80px] flex-shrink-0 text-right sm:block">
                <p className="text-[0.875rem] text-foreground">{formatNum(keyword.volume)}</p>
                <p className="text-[0.5625rem] text-muted-foreground">searches</p>
              </div>
              <div className={`flex w-[50px] flex-shrink-0 items-center justify-end gap-0.5 text-[0.8125rem] ${keyword.change >= 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                {keyword.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(keyword.change)}%
              </div>
              <div className="hidden flex-shrink-0 md:block">
                <StatusPill
                  status={keyword.competition === "Low" ? "success" : keyword.competition === "Medium" ? "warning" : "error"}
                  label={keyword.competition}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[1rem]">Videos</span>
              <h3 className="text-foreground">Seller Videos</h3>
            </div>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">Video and reel inventory from real seller product media.</p>
          </div>
          {reelsLoading ? <span className="text-[0.6875rem] text-muted-foreground">Loading...</span> : null}
        </div>
        {reelsError ? <ErrorState message={reelsError} /> : null}
        {!reelsLoading && reels.length === 0 ? <EmptyState message="No seller videos are available for the current filters." /> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {reels.map((reel) => (
            <div key={reel.id} className="group cursor-pointer">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted/30">
                <ImageWithFallback src={reel.thumbnail} alt={reel.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm transition-all group-hover:bg-white/50">
                    <Play size={18} className="ml-0.5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="truncate text-[0.6875rem] text-white/90">{reel.title}</p>
                  <p className="mt-0.5 text-[0.625rem] text-white/70">{reel.seller_name} • {formatNum(reel.views)} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedSeller ? (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedSeller(null)} />
            <motion.div
              className="relative h-full w-full max-w-[560px] overflow-y-auto bg-card shadow-2xl"
              initial={{ x: 560 }}
              animate={{ x: 0 }}
              exit={{ x: 560 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="sticky top-0 z-10 border-b border-border/30 bg-card/95 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/40 text-[1.125rem] text-primary">{selectedSeller.avatar}</div>
                    <div>
                      <h2 className="text-foreground">{selectedSeller.name}</h2>
                      <div className="mt-0.5 flex items-center gap-3 text-[0.6875rem] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Star size={10} className="text-[#FFB224]" />{selectedSeller.rating.toFixed(1)}</span>
                        <span>{selectedSeller.products} products</span>
                        <span>Joined {selectedSeller.joinedMonthsAgo} months ago</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSeller(null)} className="cursor-pointer rounded-xl p-2 hover:bg-muted/40">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="space-y-8 p-6">
                <div>
                  <p className="mb-3 text-[0.75rem] uppercase tracking-wider text-muted-foreground">Performance Snapshot</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#30A46C]/15 bg-[#30A46C]/8 p-5 text-center">
                      <p className="text-[2rem] leading-none tracking-tight text-foreground">{formatMoney(selectedSeller.revenue)}</p>
                      <p className="mt-2 text-[0.6875rem] text-muted-foreground">Revenue</p>
                    </div>
                    <div className="rounded-2xl border border-[#0171E3]/15 bg-[#0171E3]/8 p-5 text-center">
                      <p className="text-[2rem] leading-none tracking-tight text-foreground">{formatNum(selectedSeller.orders)}</p>
                      <p className="mt-2 text-[0.6875rem] text-muted-foreground">Units Sold</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-3 text-center">
                      <p className="text-[1rem] text-foreground">{formatMoney(selectedSeller.avgOrderValue)}</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Avg Order</p>
                    </div>
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-3 text-center">
                      <p className="text-[1rem] text-foreground">{selectedSeller.repeatBuyerRate}%</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Repeat Buyers</p>
                    </div>
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-3 text-center">
                      <p className="text-[1rem] text-foreground">{selectedSeller.returnRate}%</p>
                      <p className="text-[0.5625rem] text-muted-foreground">Return / Dispute</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[0.75rem] uppercase tracking-wider text-muted-foreground">Growth Trend</p>
                  <div className="rounded-2xl border border-border/20 bg-muted/8 p-5">
                    <div className={`mb-4 flex items-center gap-1 text-[1rem] ${selectedSeller.change >= 0 ? "text-[#30A46C]" : "text-[#E5484D]"}`}>
                      {selectedSeller.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      {Math.abs(selectedSeller.change)}% in the selected trend window
                    </div>
                    <SimpleBarChart data={selectedSeller.monthlySales.map((item) => ({ day: item.month, orders: item.orders, revenue: item.revenue }))} />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[0.75rem] uppercase tracking-wider text-muted-foreground">Top Products</p>
                  <div className="space-y-2.5">
                    {selectedSeller.topProducts.map((product, index) => (
                      <div key={`${selectedSeller.id}-${product.name}`} className="flex items-center gap-4 rounded-2xl border border-border/20 bg-muted/8 p-4">
                        <span className="text-[1.125rem]">{index + 1}</span>
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
                          <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8125rem] text-foreground">{product.name}</p>
                          <p className="text-[0.6875rem] text-muted-foreground">{formatNum(product.orders)} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[1rem] tracking-tight text-foreground">{formatMoney(product.revenue)}</p>
                          <p className="text-[0.5625rem] text-muted-foreground">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[0.75rem] uppercase tracking-wider text-muted-foreground">Top Markets</p>
                  <div className="space-y-3 rounded-2xl border border-border/20 bg-muted/8 p-5">
                    {selectedSeller.topMarkets.length ? (
                      selectedSeller.topMarkets.map((market) => (
                        <div key={`${selectedSeller.id}-${market.name}`} className="flex items-center gap-3">
                          <span>{market.flag}</span>
                          <span className="w-[100px] truncate text-[0.8125rem] text-foreground">{market.name}</span>
                          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-muted/30">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#0171E3] to-[#348DE9]" style={{ width: `${(market.revenue / Math.max(selectedSeller.topMarkets[0]?.revenue || 1, 1)) * 100}%` }} />
                          </div>
                          <span className="w-[65px] text-right text-[0.8125rem] text-foreground">{formatMoney(market.revenue)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[0.75rem] text-muted-foreground">No country breakdown is available for this seller.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
                  <p className="mb-2 text-[0.75rem] uppercase tracking-wider text-muted-foreground">Quick Summary</p>
                  <p className="text-[0.8125rem] text-foreground">
                    {selectedSeller.name} generated {formatMoney(selectedSeller.revenue)} from {formatNum(selectedSeller.orders)} units, with {selectedSeller.repeatBuyerRate}% repeat buyers and a {selectedSeller.returnRate}% derived return/dispute rate.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
