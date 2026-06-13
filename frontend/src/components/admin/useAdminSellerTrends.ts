"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export interface SellerTrendProduct {
  id: string;
  product_id: string;
  rank: number;
  name: string;
  image: string;
  category: string;
  industry: string;
  popularityScore: number;
  change: number;
  badge: string;
  sparkline: number[];
  orders7d: number;
  views7d: number;
  revenue7d: number;
  avgPrice: number;
  avg_price: number;
  topMarkets: SellerTrendMarket[];
  buyerInterest: number;
  competitorCount: number;
  relatedKeywords: string[];
  weeklyData: SellerTrendWeeklyPoint[];
  sellers: number;
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
  rating: number;
  change: number;
  avgOrderValue: number;
  joinedMonthsAgo: number;
  topProducts: SellerTrendSellerTopProduct[];
  monthlySales: SellerTrendSellerMonthlySales[];
  topMarkets: SellerTrendMarket[];
  returnRate: number;
  repeatBuyerRate: number;
  rating_count: number;
  path: string;
  metrics_source: {
    return_rate: string;
  };
}

export interface SellerTrendKeyword {
  keyword: string;
  product: string;
  volume: number;
  change: number;
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
  if (!Array.isArray(input)) return [];
  return input.map((row: any, index: number) => ({
    id: String(row?.id || `product-${index}`),
    product_id: String(row?.product_id || ""),
    rank: coerceNumber(row?.rank || index + 1),
    name: String(row?.name || ""),
    image: String(row?.image || ""),
    category: String(row?.category || "—"),
    industry: String(row?.industry || "all"),
    popularityScore: coerceNumber(row?.popularityScore),
    change: coerceNumber(row?.change),
    badge: String(row?.badge || "steady"),
    sparkline: Array.isArray(row?.sparkline) ? row.sparkline.map((value: unknown) => coerceNumber(value)) : [],
    orders7d: coerceNumber(row?.orders7d),
    views7d: coerceNumber(row?.views7d),
    revenue7d: coerceNumber(row?.revenue7d, 2),
    avgPrice: coerceNumber(row?.avgPrice ?? row?.avg_price, 2),
    avg_price: coerceNumber(row?.avg_price ?? row?.avgPrice, 2),
    topMarkets: Array.isArray(row?.topMarkets) ? row.topMarkets : [],
    buyerInterest: coerceNumber(row?.buyerInterest),
    competitorCount: coerceNumber(row?.competitorCount),
    relatedKeywords: Array.isArray(row?.relatedKeywords) ? row.relatedKeywords.map((value: unknown) => String(value || "")) : [],
    weeklyData: Array.isArray(row?.weeklyData) ? row.weeklyData : [],
    sellers: coerceNumber(row?.sellers),
    views_source: String(row?.views_source || "derived"),
    path: String(row?.path || ""),
  }));
}

function normalizeSellers(input: any): SellerTrendSeller[] {
  if (!Array.isArray(input)) return [];
  return input.map((row: any, index: number) => ({
    id: String(row?.id || `seller-${index}`),
    seller_id: String(row?.seller_id || row?.id || ""),
    rank: coerceNumber(row?.rank || index + 1),
    name: String(row?.name || ""),
    avatar: String(row?.avatar || "U"),
    orders: coerceNumber(row?.orders),
    revenue: coerceNumber(row?.revenue, 2),
    products: coerceNumber(row?.products),
    rating: coerceNumber(row?.rating, 1),
    change: coerceNumber(row?.change),
    avgOrderValue: coerceNumber(row?.avgOrderValue, 2),
    joinedMonthsAgo: coerceNumber(row?.joinedMonthsAgo),
    topProducts: Array.isArray(row?.topProducts) ? row.topProducts : [],
    monthlySales: Array.isArray(row?.monthlySales) ? row.monthlySales : [],
    topMarkets: Array.isArray(row?.topMarkets) ? row.topMarkets : [],
    returnRate: coerceNumber(row?.returnRate, 1),
    repeatBuyerRate: coerceNumber(row?.repeatBuyerRate),
    rating_count: coerceNumber(row?.rating_count),
    path: String(row?.path || ""),
    metrics_source: {
      return_rate: String(row?.metrics_source?.return_rate || "derived"),
    },
  }));
}

function normalizeKeywords(input: any): SellerTrendKeyword[] {
  if (!Array.isArray(input)) return [];
  return input.map((row: any) => ({
    keyword: String(row?.keyword || ""),
    product: String(row?.product || "—"),
    volume: coerceNumber(row?.volume),
    change: coerceNumber(row?.change),
    competition: String(row?.competition || ""),
    source_type: String(row?.source_type || "derived"),
  }));
}

function normalizeReels(input: any): SellerTrendReel[] {
  if (!Array.isArray(input)) return [];
  return input.map((row: any, index: number) => ({
    id: String(row?.id || `reel-${index}`),
    video_id: String(row?.video_id || ""),
    thumbnail: String(row?.thumbnail || ""),
    caption: String(row?.caption || ""),
    title: String(row?.title || row?.caption || ""),
    product: String(row?.product || ""),
    productId: String(row?.productId || ""),
    product_id: String(row?.product_id || row?.productId || ""),
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

function buildQuery(period: SellerTrendsPeriod, search: string, industry: string, country: string, sortBy: SellerTrendsProductSort) {
  const params = new URLSearchParams();
  params.set("period", period);
  if (search.trim()) params.set("search", search.trim());
  if (industry && industry !== "all") params.set("industry", industry);
  if (country && country !== "all") params.set("country", country);
  if (sortBy !== "orders") params.set("sort", sortBy);
  return params.toString();
}

export function useAdminSellerTrends(): UseAdminSellerTrendsResult {
  const location = useLocation();
  const navigate = useNavigate();
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

  const [summary, setSummary] = useState<SellerTrendsSummary | null>(null);
  const [products, setProducts] = useState<SellerTrendProduct[]>([]);
  const [sellers, setSellers] = useState<SellerTrendSeller[]>([]);
  const [keywords, setKeywords] = useState<SellerTrendKeyword[]>([]);
  const [reels, setReels] = useState<SellerTrendReel[]>([]);

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

  const setPeriod = useCallback(
    (value: SellerTrendsPeriod) => {
      const next = normalizePeriod(value);
      setPeriodState(next);
      updateUrl({ period: next });
    },
    [updateUrl],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      updateUrl({ search: value });
    },
    [updateUrl],
  );

  const setIndustry = useCallback(
    (value: string) => {
      const next = (value || "all").trim().toLowerCase() || "all";
      setIndustryState(next);
      updateUrl({ industry: next });
    },
    [updateUrl],
  );

  const setCountry = useCallback(
    (value: string) => {
      const next = (value || "all").trim().toLowerCase() || "all";
      setCountryState(next);
      updateUrl({ country: next });
    },
    [updateUrl],
  );

  const setSortBy = useCallback(
    (value: SellerTrendsProductSort) => {
      const next = normalizeProductSort(value);
      setSortByState(next);
      updateUrl({ sortBy: next });
    },
    [updateUrl],
  );

  const setActiveTab = useCallback(
    (value: SellerTrendsTab) => {
      const next = normalizeTab(value);
      setActiveTabState(next);
      updateUrl({ tab: next });
    },
    [updateUrl],
  );

  const refresh = useCallback(() => {
    setNonce((value) => value + 1);
  }, []);

  const query = useMemo(() => buildQuery(period, search, industry, country, sortBy), [country, industry, period, search, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/summary?${query}`, { signal: controller.signal });
        setSummary(normalizeSummary(data));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSummaryError(error instanceof Error ? error.message : "Failed to load seller trends summary.");
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    })();
    return () => controller.abort();
  }, [query, nonce]);

  useEffect(() => {
    const controller = new AbortController();
    setProductsLoading(true);
    setProductsError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/products?${query}`, { signal: controller.signal });
        setProducts(normalizeProducts(data));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setProductsError(error instanceof Error ? error.message : "Failed to load trend products.");
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [query, nonce]);

  useEffect(() => {
    if (activeTab !== "sellers") return;
    const controller = new AbortController();
    setSellersLoading(true);
    setSellersError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/sellers?${query}`, { signal: controller.signal });
        setSellers(normalizeSellers(data));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSellersError(error instanceof Error ? error.message : "Failed to load top sellers.");
      } finally {
        if (!controller.signal.aborted) setSellersLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, query, nonce]);

  useEffect(() => {
    if (activeTab !== "keywords") return;
    const controller = new AbortController();
    setKeywordsLoading(true);
    setKeywordsError("");
    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/keywords?${query}`, { signal: controller.signal });
        setKeywords(normalizeKeywords(data));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setKeywordsError(error instanceof Error ? error.message : "Failed to load trend keywords.");
      } finally {
        if (!controller.signal.aborted) setKeywordsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, query, nonce]);

  useEffect(() => {
    const controller = new AbortController();
    setReelsLoading(true);
    setReelsError("");
    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const data = await fetchJsonAuthed(`/api/v1/admin/seller-trends/reels?${query}`, { signal: controller.signal });
          setReels(normalizeReels(data));
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
  }, [query, nonce]);

  const breakoutProducts = useMemo(() => products.filter((product) => product.change >= 25 || product.badge === "breakout"), [products]);

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
