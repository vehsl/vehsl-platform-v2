"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/context/language";
import { useEffect } from "react";
import { useLanguage } from "@/context/language";

function LanguageHtmlSync() {
  const { language } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh" : "en";
  }, [language]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <LanguageHtmlSync />
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
