"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/context/language";
import { Component, useEffect, type ReactNode } from "react";
import { useLanguage } from "@/context/language";

function LanguageHtmlSync() {
  const { language } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh" : "en";
  }, [language]);
  return null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    try {
      const payload = {
        message: error?.message || "Unknown error",
        stack: error?.stack || "",
        at: new Date().toISOString(),
      };
      window.localStorage.setItem("vehsl.last_client_error", JSON.stringify(payload));
    } catch {}
  }

  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error.message || "Application error";
    const stack = this.state.error.stack || "";
    return (
      <div className="min-h-dvh w-full bg-white text-[#111] p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="text-lg font-semibold">Application error</div>
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm">
            {msg}
          </div>
          {stack ? (
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-black/10 bg-black/[0.02] p-4 text-xs leading-relaxed">
              {stack}
            </pre>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              type="button"
              className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black"
              onClick={() => {
                try {
                  window.localStorage.removeItem("vehsl.last_client_error");
                } catch {}
                this.setState({ error: null });
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <LanguageHtmlSync />
        <TooltipProvider delayDuration={200}>
          <AppErrorBoundary>{children}</AppErrorBoundary>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
