"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchJsonAuthed } from "@/lib/api";
import { safeJsonParse } from "@/lib/utils";

export type AppLanguage = "en" | "zh";

type TranslationKey =
  | "brand"
  | "searchPlaceholder"
  | "signIn"
  | "login"
  | "emailOrPhone"
  | "password"
  | "forgotPassword"
  | "signUp"
  | "accountTypeTitle"
  | "accountTypeSubtitle"
  | "buyer"
  | "seller";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    brand: "Vehsl",
    searchPlaceholder: "Search here...",
    signIn: "sign in",
    login: "Login",
    emailOrPhone: "Email/Phone Number (existing or new)",
    password: "Password",
    forgotPassword: "Forgot password?",
    signUp: "Sign Up",
    accountTypeTitle: "Account type.",
    accountTypeSubtitle: "Buyer or seller?",
    buyer: "Buyer",
    seller: "Seller",
  },
  zh: {
    brand: "Vehsl",
    searchPlaceholder: "搜索…",
    signIn: "登录",
    login: "登录",
    emailOrPhone: "邮箱/手机号（新或已有）",
    password: "密码",
    forgotPassword: "忘记密码？",
    signUp: "注册",
    accountTypeTitle: "账户类型。",
    accountTypeSubtitle: "买家还是卖家？",
    buyer: "买家",
    seller: "卖家",
  },
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "vehsl.language";
const GUEST_STORAGE_KEY = "vehsl.language.guest";

function hasAccessToken() {
  try {
    return Boolean(window.localStorage.getItem("vehsl.access") || "");
  } catch {
    return false;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const tokenExists = hasAccessToken();
    if (tokenExists) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
        if (stored === "en" || stored === "zh") setLanguageState(stored);
      } catch {}
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(GUEST_STORAGE_KEY) as AppLanguage | null;
      if (stored === "en" || stored === "zh") setLanguageState(stored);
    } catch {}

    try {
      const raw = (window.localStorage.getItem("vehsl.platform_language") || "").toString().trim().toLowerCase();
      if (raw === "en" || raw === "english") setLanguageState("en");
      if (raw === "zh" || raw === "chinese" || raw === "中文") setLanguageState("zh");
    } catch {}
  }, []);

  useEffect(() => {
    const fromLocalUser = () => {
      try {
        const raw = window.localStorage.getItem("vehsl.user");
        const u = safeJsonParse<any | null>(raw, null);
        const profLang = (u?.profile?.language_preference || "").toString();
        const buyerLang = (u?.buyer_profile?.language_preference || "").toString();
        const candidate = (profLang || buyerLang).toLowerCase();
        if (candidate === "en" || candidate === "zh") return candidate as AppLanguage;
      } catch {}
      return null;
    };

    const fromServer = async () => {
      try {
        const access = window.localStorage.getItem("vehsl.access") || "";
        if (!access) return;
        const me = (await fetchJsonAuthed("/api/v1/auth/me")) as any;
        const profLang = (me?.profile?.language_preference || "").toString();
        const buyerLang = (me?.buyer_profile?.language_preference || "").toString();
        const candidate = (profLang || buyerLang).toLowerCase();
        if (candidate === "en" || candidate === "zh") {
          setLanguageState(candidate as AppLanguage);
          try {
            window.localStorage.setItem(STORAGE_KEY, candidate);
            window.localStorage.setItem("vehsl.user", JSON.stringify(me));
          } catch {}
        }
      } catch {}
    };

    if (!hasAccessToken()) return;
    const localUserLang = fromLocalUser();
    if (localUserLang) setLanguageState(localUserLang);
    void fromServer();
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    const tokenExists = hasAccessToken();
    if (tokenExists) {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
    } else {
      try {
        window.sessionStorage.setItem(GUEST_STORAGE_KEY, lang);
      } catch {}
    }

    void (async () => {
      try {
        if (!hasAccessToken()) return;
        const updated = (await fetchJsonAuthed("/api/v1/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language_preference: lang }),
        })) as any;
        try {
          window.localStorage.setItem("vehsl.user", JSON.stringify(updated));
        } catch {}
      } catch {}
    })();
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
