"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      if (stored === "en" || stored === "zh") setLanguageState(stored);
    } catch {}
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
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
