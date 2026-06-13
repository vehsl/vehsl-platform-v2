"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { fetchJsonAuthed } from "@/lib/api";

export type SellerTrendsPeriod = "24h" | "7d" | "30d" | "120d";
export type SellerTrendsTab = "trending" | "breakout" | "sellers" | "keywords";
export type SellerTrendsProductSort = "orders" | "revenue" | "change";

export interface SellerTrendsOption {
  value?: string;
  label?: string;
  code?: string;
  name?: string;
  flag?: string;
}

export interface SellerTrendsSummary {
  period: SellerTrendsPeriod;
  generated_at: string;
  is_partial: boolean;
  warnings: string[];
  data_sources: string[];
  metrics: {
    total_sales_value: number;
    total_orders: number;
    total_views: number;
    active_sellers: number;
    avg_order_value: number;
    buy_rate: number;
  };
  filters: {
    industry_options: SellerTrendsOption[];
    country_options: SellerTrendsOption[];
  };
}

export interface SellerTrendMarket {
  code?: string;
  name: string;
  flag: string;
  orders: number;
  revenue: number;
}

export interface SellerTrendWeeklyPoint {
  day: string;
  orders: number;
  revenue: number;
  views?: number;
}

export interface SellerTrendsListMeta {
  period: SellerTrendsPeriod;
  generated_at: string;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  sort?: string;
  breakout?: boolean;
  is_partial: boolean;
  warnings: string[];
}

export interface SellerTrendProduct {
  id: string;
  product_id: string;
  rank: number;
  name: string;
  image: string;
  hero_image: string;
  category: string;
  industry: string;
  popularityScore: number;
  change: number;
  change_pct: number;
  badge: string;
  sparkline: number[];
  orders7d: number;
  orders: number;
  views7d: number;
  revenue7d: number;
  revenue: number;
  avgPrice: number;
  avg_price: number;
  topMarkets: SellerTrendMarket[];
  top_markets: SellerTrendMarket[];
  buyerInterest: number;
  competitorCount: number;
  relatedKeywords: string[];
  related_keywords: string[];
  weeklyData: SellerTrendWeeklyPoint[];
  weekly_data: SellerTrendWeeklyPoint[];
  sellers: number;
  seller_count: number;
  views_source: string;
  path: string;
}

export interface SellerTrendSellerTopProduct {
  name: string;
  image: string;
  orders: number;
  revenue: number;
}

export interface SellerTrendSellerMonthlySales {
  month: string;
  orders: number;
  revenue: number;
}

export interface SellerTrendSeller {
  id: string;
  seller_id: string;
  rank: number;
  name: string;
  avatar: string;
  orders: number;
  revenue: number;
  products: number;
  product_count: number;
  rating: number;
  change: number;
  growth_pct: number;
  avgOrderValue: number;
  avg_order_value: number;
  joinedMonthsAgo: number;
  joined_months_ago: number;
  joined_at: string | null;
  topProducts: SellerTrendSellerTopProduct[];
  top_products_preview: SellerTrendSellerTopProduct[];
  monthlySales: SellerTrendSellerMonthlySales[];
  monthly_sales: SellerTrendSellerMonthlySales[];
  topMarkets: SellerTrendMarket[];
  top_markets: SellerTrendMarket[];
  returnRate: number;
  refund_or_return_rate: number;
  repeatBuyerRate: number;
  repeat_buyer_rate: number;
  rating_count: number;
  path: string;
  metrics_source: {
    return_rate: string;
  };
}

export interface SellerTrendSellerDetail {
  seller_id: string;
  name: string;
  avatar: string;
  rating: number;
  joined_at: string | null;
  joined_months_ago: number;
  monthly_sales: SellerTrendSellerMonthlySales[];
  top_products: SellerTrendSellerTopProduct[];
  top_markets: SellerTrendMarket[];
  repeat_buyer_rate: number;
  refund_or_return_rate: number;
  avg_order_value: number;
  summary: string;
  metrics_source: {
    return_rate: string;
  };
  path: string;
}

export interface SellerTrendKeyword {
  keyword: string;
  product: string;
  top_product: string;
  volume: number;
  change: number;
  change_pct: number;
  competition: string;
  source_type: string;
}

export interface SellerTrendReel {
  id: string;
  video_id: string;
  thumbnail: string;
  caption: string;
  title: string;
  product: string;
  productId: string;
  product_id: string;
  product_name: string;
  seller_id: string;
  seller_name: string;
  status: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: string;
  postedAt: string;
  published_at: string | null;
  hashtags: string[];
  visibility: string;
  stats_source: string;
}

interface UseAdminSellerTrendsResult {
  period: SellerTrendsPeriod;
  search: string;
  industry: string;
  country: string;
  sortBy: SellerTrendsProductSort;
  activeTab: SellerTrendsTab;
  setPeriod: (value: SellerTrendsPeriod) => void;
  setSearch: (value: string) => void;
  setIndustry: (value: string) => void;
  setCountry: (value: string) => void;
  setSortBy: (value: SellerTrendsProductSort) => void;
  setActiveTab: (value: SellerTrendsTab) => void;
  refresh: () => void;
  summary: SellerTrendsSummary | null;
  products: SellerTrendProduct[];
  breakoutProducts: SellerTrendProduct[];
  sellers: SellerTrendSeller[];
  keywords: SellerTrendKeyword[];
  reels: SellerTrendReel[];
  productsMeta: SellerTrendsListMeta;
  sellersMeta: SellerTrendsListMeta;
  keywordsMeta: SellerTrendsListMeta;
  reelsMeta: SellerTrendsListMeta;
  setProductsPage: (page: number) => void;
  setSellersPage: (page: number) => void;
  setKeywordsPage: (page: number) => void;
  setReelsPage: (page: number) => void;
  sellerDetail: SellerTrendSellerDetail | null;
  sellerDetailLoading: boolean;
  sellerDetailError: string;
  loadSellerDetail: (sellerId: string) => Promise<void>;
  clearSellerDetail: () => void;
  summaryLoading: boolean;
  productsLoading: boolean;
  sellersLoading: boolean;
  keywordsLoading: boolean;
  reelsLoading: boolean;
  summaryError: string;
  productsError: string;
  sellersError: string;
  keywordsError: string;
  reelsError: string;
}

const PERIODS: SellerTrendsPeriod[] = ["24h", "7d", "30d", "120d"];
const TABS: SellerTrendsTab[] = ["trending", "breakout", "sellers", "keywords"];
const PRODUCT_SORTS: SellerTrendsProductSort[] = ["orders", "revenue", "change"];
const DEFAULT_META: SellerTrendsListMeta = {
  period: "7d",
  generated_at: "",
  count: 0,
  page: 1,
  page_size: 1,
  total_pages: 1,
  has_next: false,
  has_previous: false,
  is_partial: false,
  warnings: [],
};

function normalizePeriod(value: string | null | undefined): SellerTrendsPeriod {
  return PERIODS.includes(value as SellerTrendsPeriod) ? (value as SellerTrendsPeriod) : "7d";
}

function normalizeTab(value: string | null | undefined): SellerTrendsTab {
  return TABS.includes(value as SellerTrendsTab) ? (value as SellerTrendsTab) : "trending";
}

function normalizeProductSort(value: string | null | undefined): SellerTrendsProductSort {
  return PRODUCT_SORTS.includes(value as SellerTrendsProductSort) ? (value as SellerTrendsProductSort) : "orders";
}

function coerceNumber(value: unknown, digits?: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return typeof digits === "number" ? Number(next.toFixed(digits)) : next;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function extractResults(input: any) {
  if (Array.isArray(input?.results)) return input.results;
  if (Array.isArray(input)) return input;
  return [];
}

function normalizeListMeta(input: any, pageSizeFallback: number): SellerTrendsListMeta {
  const meta = input?.meta ?? input ?? {};
  return {
    period: normalizePeriod(meta?.period),
    generated_at: String(meta?.generated_at || ""),
    count: coerceNumber(meta?.count),
    page: Math.max(1, coerceNumber(meta?.page) || 1),
    page_size: Math.max(1, coerceNumber(meta?.page_size) || pageSizeFallback),
    total_pages: Math.max(1, coerceNumber(meta?.total_pages) || 1),
    has_next: Boolean(meta?.has_next),
    has_previous: Boolean(meta?.has_previous),
    sort: meta?.sort ? String(meta.sort) : undefined,
    breakout: typeof meta?.breakout === "boolean" ? meta.breakout : undefined,
    is_partial: Boolean(meta?.is_partial),
    warnings: Array.isArray(meta?.warnings) ? meta.warnings.map((value: unknown) => String(value || "")) : [],
  };
}

function normalizeSummary(input: any): SellerTrendsSummary {
  return {
    period: normalizePeriod(input?.period),
    generated_at: String(input?.generated_at || ""),
    is_partial: Boolean(input?.is_partial),
    warnings: Array.isArray(input?.warnings) ? input.warnings.map((value: unknown) => String(value || "")) : [],
    data_sources: Array.isArray(input?.data_sources) ? input.data_sources.map((value: unknown) => String(value || "")) : [],
    metrics: {
      total_sales_value: coerceNumber(input?.metrics?.total_sales_value, 2),
      total_orders: coerceNumber(input?.metrics?.total_orders),
      total_views: coerceNumber(input?.metrics?.total_views),
      active_sellers: coerceNumber(input?.metrics?.active_sellers),
      avg_order_value: coerceNumber(input?.metrics?.avg_order_value, 2),
      buy_rate: coerceNumber(input?.metrics?.buy_rate, 1),
    },
    filters: {
      industry_options: Array.isArray(input?.filters?.industry_options) ? input.filters.industry_options : [],
      country_options: Array.isArray(input?.filters?.country_options) ? input.filters.country_options : [],
    },
  };
}

function normalizeProducts(input: any): SellerTrendProduct[] {
  return extractResults(input).map((row: any, index: number) => ({
    id: String(row?.id || `product-${index}`),
    product_id: String(row?.product_id || row?.product?.id || ""),
    rank: coerceNumber(row?.rank || index + 1),
    name: String(row?.name || row?.product?.name || ""),
    image: String(row?.image || row?.hero_image || row?.product?.hero_image || ""),
    hero_image: String(row?.hero_image || row?.image || row?.product?.hero_image || ""),
    category: String(row?.category || row?.product?.category || "—"),
    industry: String(row?.industry || row?.product?.industry || "all"),
    popularityScore: coerceNumber(row?.popularityScore),
    change: coerceNumber(row?.change ?? row?.change_pct),
    change_pct: coerceNumber(row?.change_pct ?? row?.change),
    badge: String(row?.badge || "steady"),
    sparkline: Array.isArray(row?.sparkline) ? row.sparkline.map((value: unknown) => coerceNumber(value)) : [],
    orders7d: coerceNumber(row?.orders7d ?? row?.orders),
    orders: coerceNumber(row?.orders ?? row?.orders7d),
    views7d: coerceNumber(row?.views7d),
    revenue7d: coerceNumber(row?.revenue7d ?? row?.revenue, 2),
    revenue: coerceNumber(row?.revenue ?? row?.revenue7d, 2),
    avgPrice: coerceNumber(row?.avgPrice ?? row?.avg_price, 2),
    avg_price: coerceNumber(row?.avg_price ?? row?.avgPrice, 2),
    topMarkets: Array.isArray(row?.topMarkets) ? row.topMarkets : Array.isArray(row?.top_markets) ? row.top_markets : [],
    top_markets: Array.isArray(row?.top_markets) ? row.top_markets : Array.isArray(row?.topMarkets) ? row.topMarkets : [],
    buyerInterest: coerceNumber(row?.buyerInterest),
    competitorCount: coerceNumber(row?.competitorCount),
    relatedKeywords: Array.isArray(row?.relatedKeywords) ? row.relatedKeywords.map((value: unknown) => String(value || "")) : Array.isArray(row?.related_keywords) ? row.related_keywords.map((value: unknown) => String(value || "")) : [],
    related_keywords: Array.isArray(row?.related_keywords) ? row.related_keywords.map((value: unknown) => String(value || "")) : Array.isArray(row?.relatedKeywords) ? row.relatedKeywords.map((value: unknown) => String(value || "")) : [],
    weeklyData: Array.isArray(row?.weeklyData) ? row.weeklyData : Array.isArray(row?.weekly_data) ? row.weekly_data : [],
    weekly_data: Array.isArray(row?.weekly_data) ? row.weekly_data : Array.isArray(row?.weeklyData) ? row.weeklyData : [],
    sellers: coerceNumber(row?.sellers ?? row?.seller_count),
    seller_count: coerceNumber(row?.seller_count ?? row?.sellers),
    views_source: String(row?.views_source || "derived"),
    path: String(row?.path || row?.product?.path || ""),
  }));
}

function normalizeSellers(input: any): SellerTrendSeller[] {
  return extractResults(input).map((row: any, index: number) => ({
    id: String(row?.id || `seller-${index}`),
    seller_id: String(row?.seller_id || row?.id || ""),
    rank: coerceNumber(row?.rank || index + 1),
    name: String(row?.name || ""),
    avatar: String(row?.avatar || "U"),
    orders: coerceNumber(row?.orders),
    revenue: coerceNumber(row?.revenue, 2),
    products: coerceNumber(row?.products ?? row?.product_count),
    product_count: coerceNumber(row?.product_count ?? row?.products),
    rating: coerceNumber(row?.rating, 1),
    change: coerceNumber(row?.change ?? row?.growth_pct),
    growth_pct: coerceNumber(row?.growth_pct ?? row?.change),
    avgOrderValue: coerceNumber(row?.avgOrderValue ?? row?.avg_order_value, 2),
    avg_order_value: coerceNumber(row?.avg_order_value ?? row?.avgOrderValue, 2),
    joinedMonthsAgo: coerceNumber(row?.joinedMonthsAgo ?? row?.joined_months_ago),
    joined_months_ago: coerceNumber(row?.joined_months_ago ?? row?.joinedMonthsAgo),
    joined_at: row?.joined_at ? String(row.joined_at) : null,
    topProducts: Array.isArray(row?.topProducts) ? row.topProducts : Array.isArray(row?.top_products_preview) ? row.top_products_preview : [],
    top_products_preview: Array.isArray(row?.top_products_preview) ? row.top_products_preview : Array.isArray(row?.topProducts) ? row.topProducts : [],
    monthlySales: Array.isArray(row?.monthlySales) ? row.monthlySales : Array.isArray(row?.monthly_sales) ? row.monthly_sales : [],
    monthly_sales: Array.isArray(row?.monthly_sales) ? row.monthly_sales : Array.isArray(row?.monthlySales) ? row.monthlySales : [],
    topMarkets: Array.isArray(row?.topMarkets) ? row.topMarkets : Array.isArray(row?.top_markets) ? row.top_markets : [],
    top_markets: Array.isArray(row?.top_markets) ? row.top_markets : Array.isArray(row?.topMarkets) ? row.topMarkets : [],
    returnRate: coerceNumber(row?.returnRate ?? row?.refund_or_return_rate, 1),
    refund_or_return_rate: coerceNumber(row?.refund_or_return_rate ?? row?.returnRate, 1),
    repeatBuyerRate: coerceNumber(row?.repeatBuyerRate ?? row?.repeat_buyer_rate),
    repeat_buyer_rate: coerceNumber(row?.repeat_buyer_rate ?? row?.repeatBuyerRate),
    rating_count: coerceNumber(row?.rating_count),
    path: String(row?.path || ""),
    metrics_source: {
      return_rate: String(row?.metrics_source?.return_rate || "derived"),
    },
  }));
}

function normalizeSellerDetail(input: any): SellerTrendSellerDetail | null {
  if (!input || typeof input !== "object") return null;
  return {
    seller_id: String(input?.seller_id || ""),
    name: String(input?.name || ""),
    avatar: String(input?.avatar || "U"),
    rating: coerceNumber(input?.rating, 1),
    joined_at: input?.joined_at ? String(input.joined_at) : null,
    joined_months_ago: coerceNumber(input?.joined_months_ago),
    monthly_sales: Array.isArray(input?.monthly_sales) ? input.monthly_sales : [],
    top_products: Array.isArray(input?.top_products) ? input.top_products : [],
    top_markets: Array.isArray(input?.top_markets) ? input.top_markets : [],
    repeat_buyer_rate: coerceNumber(input?.repeat_buyer_rate),
    refund_or_return_rate: coerceNumber(input?.refund_or_return_rate, 1),
    avg_order_value: coerceNumber(input?.avg_order_value, 2),
    summary: String(input?.summary || ""),
    metrics_source: {
      return_rate: String(input?.metrics_source?.return_rate || "derived"),
    },
    path: String(input?.path || ""),
  };
}

function normalizeKeywords(input: any): SellerTrendKeyword[] {
  return extractResults(input).map((row: any) => ({
    keyword: String(row?.keyword || ""),
    product: String(row?.product || row?.top_product || "—"),
    top_product: String(row?.top_product || row?.product || "—"),
    volume: coerceNumber(row?.volume),
    change: coerceNumber(row?.change ?? row?.change_pct),
    change_pct: coerceNumber(row?.change_pct ?? row?.change),
    competition: String(row?.competition || ""),
    source_type: String(row?.source_type || "derived"),
  }));
}

function normalizeReels(input: any): SellerTrendReel[] {
  return extractResults(input).map((row: any, index: number) => ({
    id: String(row?.id || `reel-${index}`),
    video_id: String(row?.video_id || ""),
    thumbnail: String(row?.thumbnail || ""),
    caption: String(row?.caption || ""),
    title: String(row?.title || row?.caption || ""),
    product: String(row?.product || row?.product_name || ""),
    productId: String(row?.productId || row?.product_id || ""),
    product_id: String(row?.product_id || row?.productId || ""),
    product_name: String(row?.product_name || row?.product || ""),
    seller_id: String(row?.seller_id || ""),
    seller_name: String(row?.seller_name || ""),
    status: String(row?.status || ""),
    views: coerceNumber(row?.views),
    likes: coerceNumber(row?.likes),
    comments: coerceNumber(row?.comments),
    shares: coerceNumber(row?.shares),
    duration: String(row?.duration || ""),
    postedAt: String(row?.postedAt || ""),
    published_at: row?.published_at ? String(row.published_at) : null,
    hashtags: Array.isArray(row?.hashtags) ? row.hashtags.map((value: unknown) => String(value || "")) : [],
    visibility: String(row?.visibility || ""),
    stats_source: String(row?.stats_source || "derived"),
  }));
}

function buildBaseQuery(period: SellerTrendsPeriod, search: string, industry: string, country: string) {
  const params = new URLSearchParams();
  params.set("period", period);
  if (search.trim()) params.set("search", search.trim());
  if (industry && industry !== "all") params.set("industry", industry);
  if (country && country !== "all") params.set("country", country);
  return params.toString();
}

function buildListQuery(
  baseQuery: string,
  options: {
    page: number;
    pageSize: number;
    sortBy?: SellerTrendsProductSort;
    breakout?: boolean;
  },
) {
  const params = new URLSearchParams(baseQuery);
  params.set("page", String(Math.max(1, options.page)));
  params.set("page_size", String(Math.max(1, options.pageSize)));
  if (options.sortBy && options.sortBy !== "orders") params.set("sort", options.sortBy);
  else params.delete("sort");
  if (options.breakout) params.set("breakout", "1");
  else params.delete("breakout");
  return params.toString();
}

export function useAdminSellerTrends(): UseAdminSellerTrendsResult {
  const location = useLocation();
  const navigate = useNavigate();
  const sellerDetailRequestRef = useRef(0);
  const urlParams = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const urlPeriod = normalizePeriod(urlParams.get("period"));
  const urlSearch = (urlParams.get("search") || "").trim();
  const urlIndustry = (urlParams.get("industry") || "all").trim().toLowerCase() || "all";
  const urlCountry = (urlParams.get("country") || "all").trim().toLowerCase() || "all";
  const urlSortBy = normalizeProductSort(urlParams.get("sort"));
  const urlTab = normalizeTab(urlParams.get("tab"));

  const [period, setPeriodState] = useState<SellerTrendsPeriod>(urlPeriod);
  const [search, setSearchState] = useState(urlSearch);
  const [industry, setIndustryState] = useState(urlIndustry);
  const [country, setCountryState] = useState(urlCountry);
  const [sortBy, setSortByState] = useState<SellerTrendsProductSort>(urlSortBy);
  const [activeTab, setActiveTabState] = useState<SellerTrendsTab>(urlTab);
  const [nonce, setNonce] = useState(0);

  const [productsPage, setProductsPageState] = useState(1);
  const [sellersPage, setSellersPageState] = useState(1);
  const [keywordsPage, setKeywordsPageState] = useState(1);
  const [reelsPage, setReelsPageState] = useState(1);

  const [summary, setSummary] = useState<SellerTrendsSummary | null>(null);
  const [products, setProducts] = useState<SellerTrendProduct[]>([]);
  const [sellers, setSellers] = useState<SellerTrendSeller[]>([]);
  const [keywords, setKeywords] = useState<SellerTrendKeyword[]>([]);
  const [reels, setReels] = useState<SellerTrendReel[]>([]);

  const [productsMeta, setProductsMeta] = useState<SellerTrendsListMeta>(DEFAULT_META);
  const [sellersMeta, setSellersMeta] = useState<SellerTrendsListMeta>(DEFAULT_META);
  const [keywordsMeta, setKeywordsMeta] = useState<SellerTrendsListMeta>(DEFAULT_META);
  const [reelsMeta, setReelsMeta] = useState<SellerTrendsListMeta>(DEFAULT_META);

  const [sellerDetail, setSellerDetail] = useState<SellerTrendSellerDetail | null>(null);
  const [sellerDetailLoading, setSellerDetailLoading] = useState(false);
  const [sellerDetailError, setSellerDetailError] = useState("");

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(false);

  const [summaryError, setSummaryError] = useState("");
  const [productsError, setProductsError] = useState("");
  const [sellersError, setSellersError] = useState("");
  const [keywordsError, setKeywordsError] = useState("");
  const [reelsError, setReelsError] = useState("");

  useEffect(() => {
    setPeriodState(urlPeriod);
    setSearchState(urlSearch);
    setIndustryState(urlIndustry);
    setCountryState(urlCountry);
    setSortByState(urlSortBy);
    setActiveTabState(urlTab);
  }, [urlCountry, urlIndustry, urlPeriod, urlSearch, urlSortBy, urlTab]);

  const updateUrl = useCallback(
    (next: Partial<{ period: SellerTrendsPeriod; search: string; industry: string; country: string; sortBy: SellerTrendsProductSort; tab: SellerTrendsTab }>) => {
      const params = new URLSearchParams(location.search || "");
      const nextPeriod = next.period ?? period;
      const nextSearch = next.search ?? search;
      const nextIndustry = next.industry ?? industry;
      const nextCountry = next.country ?? country;
      const nextSortBy = next.sortBy ?? sortBy;
      const nextTab = next.tab ?? activeTab;

      params.set("period", nextPeriod);
      params.set("tab", nextTab);
      nextSearch.trim() ? params.set("search", nextSearch.trim()) : params.delete("search");
      nextIndustry && nextIndustry !== "all" ? params.set("industry", nextIndustry) : params.delete("industry");
      nextCountry && nextCountry !== "all" ? params.set("country", nextCountry) : params.delete("country");
      nextSortBy !== "orders" ? params.set("sort", nextSortBy) : params.delete("sort");
      navigate({ search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    },
    [activeTab, country, industry, location.search, navigate, period, search, sortBy],
  );

  const setPeriod = useCallback((value: SellerTrendsPeriod) => {
    const next = normalizePeriod(value);
    setPeriodState(next);
    updateUrl({ period: next });
  }, [updateUrl]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    updateUrl({ search: value });
  }, [updateUrl]);

  const setIndustry = useCallback((value: string) => {
    const next = (value || "all").trim().toLowerCase() || "all";
    setIndustryState(next);
    updateUrl({ industry: next });
  }, [updateUrl]);

  const setCountry = useCallback((value: string) => {
    const next = (value || "all").trim().toLowerCase() || "all";
    setCountryState(next);
    updateUrl({ country: next });
  }, [updateUrl]);

  const setSortBy = useCallback((value: SellerTrendsProductSort) => {
    const next = normalizeProductSort(value);
    setSortByState(next);
    updateUrl({ sortBy: next });
  }, [updateUrl]);

  const setActiveTab = useCallback((value: SellerTrendsTab) => {
    const next = normalizeTab(value);
    setActiveTabState(next);
    updateUrl({ tab: next });
  }, [updateUrl]);

  const setProductsPage = useCallback((page: number) => setProductsPageState(Math.max(1, page)), []);
  const setSellersPage = useCallback((page: number) => setSellersPageState(Math.max(1, page)), []);
  const setKeywordsPage = useCallback((page: number) => setKeywordsPageState(Math.max(1, page)), []);
  const setReelsPage = useCallback((page: number) => setReelsPageState(Math.max(1, page)), []);

  const refresh = useCallback(() => {
    setNonce((value) => value + 1);
  }, []);

  const clearSellerDetail = useCallback(() => {
    setSellerDetail(null);
    setSellerDetailError("");
    setSellerDetailLoading(false);
  }, []);

  const baseQuery = useMemo(() => buildBaseQuery(period, search, industry, country), [country, industry, period, search]);
  const productsQuery = useMemo(
    () => buildListQuery(baseQuery, { page: productsPage, pageSize: 12, sortBy, breakout: activeTab === "breakout" }),
    [activeTab, baseQuery, productsPage, sortBy],
  );
  const sellersQuery = useMemo(() => buildListQuery(baseQuery, { page: sellersPage, pageSize: 10 }), [baseQuery, sellersPage]);
  const keywordsQuery = useMemo(() => buildListQuery(baseQuery, { page: keywordsPage, pageSize: 12 }), [baseQuery, keywordsPage]);
  const reelsQuery = useMemo(() => buildListQuery(baseQuery, { page: reelsPage, pageSize: 12 }), [baseQuery, reelsPage]);

  useEffect(() => {
    setProductsPageState(1);
    setSellersPageState(1);
    setKeywordsPageState(1);
    setReelsPageState(1);
    clearSellerDetail();
  }, [baseQuery, sortBy, clearSellerDetail]);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/summary?${baseQuery}`, { signal: controller.signal });
        setSummary(normalizeSummary(data));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSummaryError(error instanceof Error ? error.message : "Failed to load seller trends summary.");
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    })();
    return () => controller.abort();
  }, [baseQuery, nonce]);

  useEffect(() => {
    const controller = new AbortController();
    setProductsLoading(true);
    setProductsError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/products?${productsQuery}`, { signal: controller.signal });
        setProducts(normalizeProducts(data));
        setProductsMeta(normalizeListMeta(data, 12));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setProductsError(error instanceof Error ? error.message : "Failed to load trend products.");
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [productsQuery, nonce]);

  useEffect(() => {
    if (activeTab !== "sellers") return;
    const controller = new AbortController();
    setSellersLoading(true);
    setSellersError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/sellers?${sellersQuery}`, { signal: controller.signal });
        setSellers(normalizeSellers(data));
        setSellersMeta(normalizeListMeta(data, 10));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSellersError(error instanceof Error ? error.message : "Failed to load top sellers.");
      } finally {
        if (!controller.signal.aborted) setSellersLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, sellersQuery, nonce]);

  useEffect(() => {
    if (activeTab !== "keywords") return;
    const controller = new AbortController();
    setKeywordsLoading(true);
    setKeywordsError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/keywords?${keywordsQuery}`, { signal: controller.signal });
        setKeywords(normalizeKeywords(data));
        setKeywordsMeta(normalizeListMeta(data, 12));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setKeywordsError(error instanceof Error ? error.message : "Failed to load trend keywords.");
      } finally {
        if (!controller.signal.aborted) setKeywordsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, keywordsQuery, nonce]);

  useEffect(() => {
    const controller = new AbortController();
    setReelsLoading(true);
    setReelsError("");
    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/reels?${reelsQuery}`, { signal: controller.signal });
          setReels(normalizeReels(data));
          setReelsMeta(normalizeListMeta(data, 12));
        } catch (error: unknown) {
          if (isAbortError(error)) return;
          setReelsError(error instanceof Error ? error.message : "Failed to load seller videos.");
        } finally {
          if (!controller.signal.aborted) setReelsLoading(false);
        }
      })();
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [reelsQuery, nonce]);

  const loadSellerDetail = useCallback(async (sellerId: string) => {
    const normalizedSellerId = String(sellerId || "").trim();
    if (!normalizedSellerId) return;
    const requestId = sellerDetailRequestRef.current + 1;
    sellerDetailRequestRef.current = requestId;
    setSellerDetailLoading(true);
    setSellerDetailError("");
    try {
      const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/sellers/${normalizedSellerId}?${baseQuery}`);
      if (sellerDetailRequestRef.current !== requestId) return;
      setSellerDetail(normalizeSellerDetail(data));
    } catch (error: unknown) {
      if (sellerDetailRequestRef.current !== requestId) return;
      setSellerDetailError(error instanceof Error ? error.message : "Failed to load seller detail.");
    } finally {
      if (sellerDetailRequestRef.current === requestId) setSellerDetailLoading(false);
    }
  }, [baseQuery]);

  const breakoutProducts = useMemo(() => {
    if (activeTab === "breakout") return products;
    return products.filter((product) => product.change_pct >= 25 || product.badge === "breakout");
  }, [activeTab, products]);

  return {
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
    productsMeta,
    sellersMeta,
    keywordsMeta,
    reelsMeta,
    setProductsPage,
    setSellersPage,
    setKeywordsPage,
    setReelsPage,
    sellerDetail,
    sellerDetailLoading,
    sellerDetailError,
    loadSellerDetail,
    clearSellerDetail,
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
  };
}
