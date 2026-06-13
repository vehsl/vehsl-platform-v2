"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { fetchJsonAuthed } from "@/lib/api";

export type CommandCenterPeriod = "24h" | "7d" | "30d" | "90d";

export interface CommandCenterMeta {
  period: CommandCenterPeriod;
  generated_at: string;
  last_updated: string;
  cache_ttl_seconds: number;
  generated_from_cache: boolean;
  is_partial: boolean;
  warnings: string[];
  data_sources: string[];
  paths: {
    orders: string;
    listings: string;
    logistics: string;
    users: string;
    quality: string;
  };
}

export interface CommandCenterCardMetric {
  path: string;
}

export interface CommandCenterActiveOrders extends CommandCenterCardMetric {
  snapshot_total: number;
  snapshot_b2b: number;
  snapshot_b2c: number;
  sparkline: number[];
}

export interface CommandCenterQualityScore extends CommandCenterCardMetric {
  total: number;
  pass_rate: number;
  pending: number;
  inspections: number;
  delta: number;
  sparkline: number[];
}

export interface CommandCenterUsersOnline extends CommandCenterCardMetric {
  snapshot_total: number;
  snapshot_buyers: number;
  snapshot_sellers: number;
  snapshot_workers: number;
  sparkline: number[];
}

export interface CommandCenterShipmentsInTransit extends CommandCenterCardMetric {
  total: number;
  on_time_rate: number;
  delta: number;
}

export interface CommandCenterPipelineItem {
  key: string;
  label: string;
  count: number;
  path: string;
}

export interface CommandCenterPipeline {
  total: number;
  items: CommandCenterPipelineItem[];
}

export interface CommandCenterSummary {
  meta: CommandCenterMeta;
  hero: {
    active_orders: CommandCenterActiveOrders;
    quality_score: CommandCenterQualityScore;
    users_online: CommandCenterUsersOnline;
    shipments_in_transit: CommandCenterShipmentsInTransit;
  };
  pipelines: {
    listings: CommandCenterPipeline;
    orders: CommandCenterPipeline;
  };
}

export interface CommandCenterShipmentRow {
  id: number;
  order_id: number | null;
  status: string;
  destination: string;
  seller: string;
  tracking_number: string;
}

interface UseAdminCommandCenterResult {
  period: CommandCenterPeriod;
  setPeriod: (next: CommandCenterPeriod) => void;
  refresh: () => void;
  summary: CommandCenterSummary | null;
  shipments: CommandCenterShipmentRow[];
  summaryLoading: boolean;
  shipmentsLoading: boolean;
  summaryError: string;
  shipmentsError: string;
  lastUpdated: string;
  initialLoading: boolean;
  refreshing: boolean;
}

const PERIODS: CommandCenterPeriod[] = ["24h", "7d", "30d", "90d"];
const SUMMARY_POLL_MS = 90_000;
const SHIPMENTS_POLL_MS = 45_000;
const LIVE_SHIPMENT_STATUS = "label_created,picked_up,in_transit,customs,out_for_delivery";

function normalizePeriod(raw: string | null | undefined): CommandCenterPeriod {
  return PERIODS.includes(raw as CommandCenterPeriod) ? (raw as CommandCenterPeriod) : "7d";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function coerceNumber(value: unknown, digits?: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return typeof digits === "number" ? Number(next.toFixed(digits)) : next;
}

function normalizePipeline(input: any): CommandCenterPipeline {
  const items = Array.isArray(input?.items)
    ? input.items.map((item: any) => ({
        key: String(item?.key || ""),
        label: String(item?.label || ""),
        count: coerceNumber(item?.count),
        path: String(item?.path || ""),
      }))
    : [];
  return {
    total: coerceNumber(input?.total ?? items.reduce((sum: number, item: CommandCenterPipelineItem) => sum + item.count, 0)),
    items,
  };
}

function normalizeSummary(input: any): CommandCenterSummary {
  const meta = input?.meta || {};
  const hero = input?.hero || {};
  const activeOrders = hero?.active_orders || {};
  const qualityScore = hero?.quality_score || {};
  const usersOnline = hero?.users_online || {};
  const shipmentsInTransit = hero?.shipments_in_transit || {};

  return {
    meta: {
      period: normalizePeriod(meta?.period),
      generated_at: String(meta?.generated_at || ""),
      last_updated: String(meta?.last_updated || meta?.generated_at || ""),
      cache_ttl_seconds: coerceNumber(meta?.cache_ttl_seconds),
      generated_from_cache: Boolean(meta?.generated_from_cache),
      is_partial: Boolean(meta?.is_partial),
      warnings: Array.isArray(meta?.warnings) ? meta.warnings.map((value: unknown) => String(value || "")) : [],
      data_sources: Array.isArray(meta?.data_sources) ? meta.data_sources.map((value: unknown) => String(value || "")) : [],
      paths: {
        orders: String(meta?.paths?.orders || "/admin/management/orders"),
        listings: String(meta?.paths?.listings || "/admin/management/listings"),
        logistics: String(meta?.paths?.logistics || "/admin/logistics"),
        users: String(meta?.paths?.users || "/admin/users"),
        quality: String(meta?.paths?.quality || "/admin/quality"),
      },
    },
    hero: {
      active_orders: {
        snapshot_total: coerceNumber(activeOrders?.snapshot_total),
        snapshot_b2b: coerceNumber(activeOrders?.snapshot_b2b),
        snapshot_b2c: coerceNumber(activeOrders?.snapshot_b2c),
        sparkline: Array.isArray(activeOrders?.sparkline) ? activeOrders.sparkline.map((value: unknown) => coerceNumber(value)) : [],
        path: String(activeOrders?.path || "/admin/management/orders"),
      },
      quality_score: {
        total: coerceNumber(qualityScore?.total, 1),
        pass_rate: coerceNumber(qualityScore?.pass_rate, 1),
        pending: coerceNumber(qualityScore?.pending),
        inspections: coerceNumber(qualityScore?.inspections),
        delta: coerceNumber(qualityScore?.delta, 1),
        sparkline: Array.isArray(qualityScore?.sparkline) ? qualityScore.sparkline.map((value: unknown) => coerceNumber(value, 1)) : [],
        path: String(qualityScore?.path || "/admin/quality"),
      },
      users_online: {
        snapshot_total: coerceNumber(usersOnline?.snapshot_total),
        snapshot_buyers: coerceNumber(usersOnline?.snapshot_buyers),
        snapshot_sellers: coerceNumber(usersOnline?.snapshot_sellers),
        snapshot_workers: coerceNumber(usersOnline?.snapshot_workers),
        sparkline: Array.isArray(usersOnline?.sparkline) ? usersOnline.sparkline.map((value: unknown) => coerceNumber(value)) : [],
        path: String(usersOnline?.path || "/admin/users"),
      },
      shipments_in_transit: {
        total: coerceNumber(shipmentsInTransit?.total),
        on_time_rate: coerceNumber(shipmentsInTransit?.on_time_rate, 1),
        delta: coerceNumber(shipmentsInTransit?.delta, 1),
        path: String(shipmentsInTransit?.path || "/admin/logistics"),
      },
    },
    pipelines: {
      listings: normalizePipeline(input?.pipelines?.listings),
      orders: normalizePipeline(input?.pipelines?.orders),
    },
  };
}

function normalizeShipments(input: any): CommandCenterShipmentRow[] {
  const rows = Array.isArray(input?.results) ? input.results : [];
  return rows.map((row: any) => ({
    id: coerceNumber(row?.id),
    order_id: row?.order_id == null ? null : coerceNumber(row?.order_id),
    status: String(row?.status || ""),
    destination: String(row?.destination || ""),
    seller: String(row?.seller || ""),
    tracking_number: String(row?.tracking_number || ""),
  }));
}

export function useAdminCommandCenter(): UseAdminCommandCenterResult {
  const location = useLocation();
  const navigate = useNavigate();
  const urlPeriod = useMemo(() => normalizePeriod(new URLSearchParams(location.search || "").get("period")), [location.search]);

  const [period, setPeriodState] = useState<CommandCenterPeriod>(urlPeriod);
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null);
  const [shipments, setShipments] = useState<CommandCenterShipmentRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [shipmentsError, setShipmentsError] = useState("");
  const [summaryNonce, setSummaryNonce] = useState(0);
  const [shipmentsNonce, setShipmentsNonce] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setPeriodState(urlPeriod);
  }, [urlPeriod]);

  const updateUrlPeriod = useCallback(
    (next: CommandCenterPeriod) => {
      const params = new URLSearchParams(location.search || "");
      params.set("period", next);
      navigate({ search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    },
    [location.search, navigate],
  );

  const setPeriod = useCallback(
    (next: CommandCenterPeriod) => {
      const normalized = normalizePeriod(next);
      setPeriodState(normalized);
      updateUrlPeriod(normalized);
    },
    [updateUrlPeriod],
  );

  const refresh = useCallback(() => {
    setSummaryNonce((value) => value + 1);
    setShipmentsNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError("");

    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/command-center?period=${encodeURIComponent(period)}`, {
          signal: controller.signal,
        });
        const normalized = normalizeSummary(data);
        setSummary(normalized);
        setLastUpdated(normalized.meta.last_updated || new Date().toISOString());
        setHasLoadedOnce(true);
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSummaryError(error instanceof Error ? error.message : "Failed to load command center summary.");
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    })();

    return () => controller.abort();
  }, [period, summaryNonce]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page_size", "6");
    params.set("status", LIVE_SHIPMENT_STATUS);

    setShipmentsLoading(true);
    setShipmentsError("");

    (async () => {
      try {
        const data = await fetchJsonAuthed(`/api/v1/admin/logistics/shipments/?${params.toString()}`, {
          signal: controller.signal,
        });
        setShipments(normalizeShipments(data));
        setHasLoadedOnce(true);
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setShipmentsError(error instanceof Error ? error.message : "Failed to load live shipments.");
      } finally {
        if (!controller.signal.aborted) setShipmentsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [shipmentsNonce]);

  useEffect(() => {
    const summaryTimer = window.setInterval(() => {
      setSummaryNonce((value) => value + 1);
    }, SUMMARY_POLL_MS);
    const shipmentsTimer = window.setInterval(() => {
      setShipmentsNonce((value) => value + 1);
    }, SHIPMENTS_POLL_MS);
    return () => {
      window.clearInterval(summaryTimer);
      window.clearInterval(shipmentsTimer);
    };
  }, []);

  return {
    period,
    setPeriod,
    refresh,
    summary,
    shipments,
    summaryLoading,
    shipmentsLoading,
    summaryError,
    shipmentsError,
    lastUpdated,
    initialLoading: summaryLoading && !summary,
    refreshing: hasLoadedOnce && (summaryLoading || shipmentsLoading),
  };
}
