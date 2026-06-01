export { cn } from "@/components/ui/utils";

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getPlatformGeneralFromStorage(): {
  platform_name: string;
  default_currency: string;
  timezone: string;
  language: string;
} {
  const out = {
    platform_name: "Vehsl",
    default_currency: "USD",
    timezone: "UTC",
    language: "English",
  };
  if (typeof window === "undefined") return out;
  try {
    const pn = (window.localStorage.getItem("vehsl.platform_name") || "").toString().trim();
    const cur = (window.localStorage.getItem("vehsl.platform_currency") || "").toString().trim();
    const tz = (window.localStorage.getItem("vehsl.platform_timezone") || "").toString().trim();
    const lang = (window.localStorage.getItem("vehsl.platform_language") || "").toString().trim();
    if (pn) out.platform_name = pn;
    if (cur) out.default_currency = cur;
    if (tz) out.timezone = tz;
    if (lang) out.language = lang;
  } catch {}
  return out;
}

export function fmtMoney(amount: string | number, currency?: string) {
  const n = Number(amount);
  const cur = (currency || getPlatformGeneralFromStorage().default_currency || "USD").toString();
  if (!Number.isFinite(n)) return `${cur} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n);
  } catch {
    return `${cur} ${n.toFixed(2)}`;
  }
}

export function fmtDateTime(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "";
  const ts = new Date(iso);
  const tz = getPlatformGeneralFromStorage().timezone || "UTC";
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, ...opts }).format(ts);
  } catch {
    return ts.toISOString();
  }
}
