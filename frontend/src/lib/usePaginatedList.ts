"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJsonAuthed } from "@/lib/api";

type Filters = Record<string, unknown>;

function filtersKey(filters: Filters | undefined) {
  if (!filters) return "";
  const keys = Object.keys(filters).sort();
  const pairs: string[] = [];
  for (const k of keys) {
    const v: any = (filters as any)[k];
    if (v == null) continue;
    if (typeof v === "string") {
      const s = v.trim();
      if (!s || s.toLowerCase() === "all") continue;
      pairs.push(`${k}=${s}`);
      continue;
    }
    if (typeof v === "number") {
      if (!Number.isFinite(v)) continue;
      pairs.push(`${k}=${String(v)}`);
      continue;
    }
    if (typeof v === "boolean") {
      pairs.push(`${k}=${v ? "1" : "0"}`);
      continue;
    }
    if (Array.isArray(v)) {
      const cleaned = v
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter((x) => !!x && x.toLowerCase() !== "all")
        .join(",");
      if (cleaned) pairs.push(`${k}=${cleaned}`);
      continue;
    }
    const s = String(v).trim();
    if (!s || s.toLowerCase() === "all") continue;
    pairs.push(`${k}=${s}`);
  }
  return pairs.join("&");
}

function buildParams(filters: Filters | undefined, ordering: string, page: number, pageSize: number) {
  const params = new URLSearchParams();
  if (filters) {
    const keys = Object.keys(filters).sort();
    for (const k of keys) {
      const v: any = (filters as any)[k];
      if (v == null) continue;
      if (typeof v === "string") {
        const s = v.trim();
        if (!s || s.toLowerCase() === "all") continue;
        params.set(k, s);
        continue;
      }
      if (typeof v === "number") {
        if (!Number.isFinite(v)) continue;
        params.set(k, String(v));
        continue;
      }
      if (typeof v === "boolean") {
        params.set(k, v ? "1" : "0");
        continue;
      }
      if (Array.isArray(v)) {
        const cleaned = v
          .map((x) => (x == null ? "" : String(x).trim()))
          .filter((x) => !!x && x.toLowerCase() !== "all")
          .join(",");
        if (cleaned) params.set(k, cleaned);
        continue;
      }
      const s = String(v).trim();
      if (!s || s.toLowerCase() === "all") continue;
      params.set(k, s);
    }
  }
  if (ordering) params.set("ordering", ordering);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  return params;
}

export function usePaginatedList<T>(opts: {
  endpoint: string;
  filters?: Filters;
  initialOrdering?: string;
  initialPage?: number;
  initialPageSize?: number;
  debounceMs?: number;
}) {
  const {
    endpoint,
    filters,
    initialOrdering = "-created_at",
    initialPage = 1,
    initialPageSize = 20,
    debounceMs = 250,
  } = opts;

  const [rows, setRows] = useState<T[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [ordering, setOrdering] = useState(initialOrdering);

  const [refreshNonce, setRefreshNonce] = useState(0);
  const refresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  const fKey = useMemo(() => filtersKey(filters), [filters]);
  const prevFKeyRef = useRef<string>(fKey);
  useEffect(() => {
    if (prevFKeyRef.current !== fKey) {
      prevFKeyRef.current = fKey;
      setPage(1);
    }
  }, [fKey]);

  const query = useMemo(() => buildParams(filters, ordering, page, pageSize).toString(), [filters, ordering, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setError("");
    setLoading(true);

    const t = window.setTimeout(() => {
      (async () => {
        try {
          const data: any = await fetchJsonAuthed(`${endpoint}?${query}`, { signal: controller.signal } as any);
          const nextRows = Array.isArray(data) ? (data as T[]) : Array.isArray(data?.results) ? (data.results as T[]) : [];
          const nextCount =
            typeof data?.count === "number" ? Number(data.count) : Array.isArray(data) ? (data as any[]).length : null;
          if (!cancelled) {
            setRows(nextRows);
            setCount(Number.isFinite(nextCount as any) ? (nextCount as number) : null);
          }
        } catch (e: any) {
          if (!cancelled) {
            setRows([]);
            setCount(null);
            setError(e?.name === "AbortError" ? "" : e?.message || "Failed to load.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [endpoint, query, debounceMs, refreshNonce]);

  const setOrderingAndReset = useCallback((next: string) => {
    setOrdering(next);
    setPage(1);
  }, []);

  const setPageSizeAndReset = useCallback((next: number) => {
    setPageSize(next);
    setPage(1);
  }, []);

  const totalPages = useMemo(() => {
    if (count == null) return null;
    if (!pageSize) return null;
    const n = Math.max(1, Math.ceil(count / pageSize));
    return Number.isFinite(n) ? n : null;
  }, [count, pageSize]);

  return {
    rows,
    count,
    loading,
    error,
    page,
    pageSize,
    ordering,
    setPage,
    setPageSize: setPageSizeAndReset,
    setOrdering: setOrderingAndReset,
    refresh,
    totalPages,
  };
}

