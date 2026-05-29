"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { MegaMenu } from "@/components/marketplace/MegaMenu";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { TopNav } from "@/components/marketplace/TopNav";
import { SuggestedProducts } from "@/components/marketplace/SuggestedProducts";
import { TrustSection } from "@/components/marketplace/TrustSection";
import { PromisesSection } from "@/components/marketplace/PromisesSection";
import { LogisticsSection } from "@/components/marketplace/LogisticsSection";
import { ValueSection } from "@/components/marketplace/ValueSection";
import { useLanguage } from "@/context/language";
import { SavingsSection } from "@/components/marketplace/SavingsSection";
import { WeeklyProducts } from "@/components/marketplace/WeeklyProducts";
import { SustainabilitySection } from "@/components/marketplace/SustainabilitySection";
import { Footer } from "@/components/marketplace/Footer";


export function HomeShell() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeTimer = useRef<number | null>(null);

  const openMenu = useCallback((categoryId: string) => {
    if (typeof window !== "undefined" && closeTimer.current) window.clearTimeout(closeTimer.current);
    setActiveCategoryId(categoryId);
    setMenuOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    if (typeof window !== "undefined" && closeTimer.current) window.clearTimeout(closeTimer.current);
    if (typeof window !== "undefined") {
      closeTimer.current = window.setTimeout(() => setMenuOpen(false), 120) as any;
    }
  }, []);

  const keepMenuOpen = useCallback(() => {
    if (typeof window !== "undefined" && closeTimer.current) window.clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const [signInOpen, setSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "reset">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!signInOpen) {
      setRequiresOtp(false);
      setOtpCode("");
      setAuthMode("signin");
      setResetToken("");
      setResetNewPassword("");
    }
  }, [signInOpen]);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("reset") === "1") {
        setAuthMode("reset");
        setSignInOpen(true);
        setIdentifier(u.searchParams.get("identifier") || "");
        setResetToken(u.searchParams.get("token") || "");
        u.searchParams.delete("reset");
        u.searchParams.delete("identifier");
        u.searchParams.delete("token");
        window.history.replaceState({}, "", u.toString());
        return;
      }
      if (u.searchParams.get("signin") === "1") {
        setAuthMode("signin");
        setSignInOpen(true);
        u.searchParams.delete("signin");
        window.history.replaceState({}, "", u.toString());
      }
    } catch { }
  }, []);

  const signInAnchor = useMemo(
    () => (
      <button
        type="button"
        className={cn(
          "rounded-full bg-white px-4 py-2 text-xs font-semibold tracking-tight text-[#ec4899] shadow-soft",
          "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding,border-box border border-transparent",
        )}
      >
        {t("signIn")}
      </button>
    ),
    [t],
  );

  const base = useMemo(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const normalize = (u: string) => u.replace(/\/$/, "");
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
      return normalize(fromEnv);
    }
    if (typeof window === "undefined") return "http://localhost:8000";
    const host = (window.location.hostname === "0.0.0.0" || window.location.hostname === "") ? "localhost" : window.location.hostname;
    return normalize(`${window.location.protocol}//${host}:8000`);
  }, []);

  const authedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const access = typeof window !== "undefined" ? window.localStorage.getItem("vehsl.access") : null;
      const url = typeof input === "string" && !input.startsWith("http") ? `${base}${input}` : input;
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${access}`,
        },
      });
    },
    [base],
  );

  const handleSignIn = useCallback(async () => {
    if (signingIn) return;
    const id = identifier.trim();
    const pw = password;
    if (!id || !pw) {
      toast.error("Enter email/phone and password.");
      return;
    }
    if (requiresOtp && !otpCode.trim()) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      setSigningIn(true);
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password: pw, otp: otpCode.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err && err.otp_required) {
          setRequiresOtp(true);
          toast.error("Enter the 6-digit code from your authenticator app.");
          return;
        }
        const msg = (err && (err.detail || err.non_field_errors)) || "Login failed.";
        toast.error(typeof msg === "string" ? msg : "Login failed.");
        return;
      }

      const tokens = await res.json();
      try {
        window.localStorage.setItem("vehsl.access", tokens.access);
        window.localStorage.setItem("vehsl.refresh", tokens.refresh);
        window.localStorage.setItem("vehsl.user", JSON.stringify(tokens.user));
      } catch { }

      setSignInOpen(false);
      setRequiresOtp(false);
      setOtpCode("");
      toast.success("Signed in.");
      const role = (tokens?.user?.role || "").toString().toLowerCase();
      if (role === "admin") {
        router.push("/admin");
        return;
      }

      try {
        const access = tokens?.access || "";
        const reqRes = await fetch(`${base}/api/v1/kyc/requirements`, {
          headers: access ? { Authorization: `Bearer ${access}` } : {},
        });
        const reqData = await reqRes.json().catch(() => null);
        const canAccessDashboard = !!reqData && reqRes.ok && reqData.can_access_dashboard === true;
        const t = ((reqData?.account_type || tokens?.user?.account_type || tokens?.user?.role || "") as string).toLowerCase();
        const dest = t === "buyer" ? "/explore" : "/orders";
        router.push(canAccessDashboard ? dest : "/kyc");
      } catch {
        router.push("/kyc");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error.";
      toast.error(message.includes("Failed to fetch") ? "Network error. Check backend URL/CORS." : message);
    } finally {
      setSigningIn(false);
    }
  }, [identifier, password, router, signingIn, otpCode, requiresOtp]);

  const handlePasswordReset = useCallback(async () => {
    if (resetting) return;
    const id = identifier.trim();
    const token = resetToken.trim();
    const pw = resetNewPassword;
    if (!id || !token || !pw) {
      toast.error("Enter email/phone, token and new password.");
      return;
    }
    try {
      setResetting(true);
      const res = await fetch(`${base}/api/v1/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, token, new_password: pw }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && (data.detail || data.error)) || "Password reset failed.";
        toast.error(typeof msg === "string" ? msg : "Password reset failed.");
        return;
      }
      toast.success("Password updated. Please sign in.");
      setAuthMode("signin");
      setPassword("");
      setResetNewPassword("");
      setResetToken("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error.";
      toast.error(message.includes("Failed to fetch") ? "Network error. Check backend URL/CORS." : message);
    } finally {
      setResetting(false);
    }
  }, [base, identifier, resetNewPassword, resetToken, resetting]);

  if (!mounted) return null;

  return (
    <div className="bg-vehsl-watercolor font-inter min-h-dvh w-full overflow-x-hidden">
      <div className="relative min-h-dvh">
        <Popover open={signInOpen} onOpenChange={setSignInOpen}>
          <TopNav
            activeCategoryId={menuOpen ? activeCategoryId : null}
            onCategoryEnter={openMenu}
            onCategoryLeave={scheduleClose}
            signInSlot={
              <PopoverTrigger asChild>
                {signInAnchor}
              </PopoverTrigger>
            }
          />

          <PopoverContent
            align="center"
            sideOffset={14}
            className={cn(
              "w-[88vw] max-w-[360px] max-h-[80dvh] overflow-y-auto rounded-[22px] border border-white/60 bg-white/55 p-3 backdrop-blur-2xl shadow-soft",
            )}
          >
            <div className="rounded-[20px] bg-white/65 p-3">
              {authMode === "signin" ? (
                <>
                  <div className="text-center text-[13px] font-semibold text-[#0f1115]">{t("login")}</div>

                  <div className="mt-3 space-y-2.5">
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t("emailOrPhone")}
                      className="h-10 rounded-full bg-white/85 text-sm"
                    />

                    <div className="relative">
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("password")}
                        type={showPassword ? "text" : "password"}
                        className="h-10 rounded-full bg-white/85 pr-10 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSignIn();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7f87]"
                        aria-label="Toggle password visibility"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    {requiresOtp && (
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="6-digit code"
                        className="h-10 rounded-full bg-white/85 text-sm"
                        inputMode="numeric"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSignIn();
                        }}
                      />
                    )}
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="text-[11px] font-medium text-blue-600"
                      onClick={() => setAuthMode("reset")}
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      type="button"
                      onClick={handleSignIn}
                      disabled={signingIn}
                      className={cn("h-10 rounded-full bg-blue-600 px-5 text-[13px] text-white shadow-soft hover:bg-blue-600/90")}
                    >
                      {signingIn ? "Signing in..." : t("signIn")}
                    </Button>
                    <Button
                      asChild
                      className={cn(
                        "h-10 rounded-full bg-white px-5 text-[13px] text-[#0f1115] shadow-soft",
                        "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding,border-box border border-transparent",
                      )}
                    >
                      <Link href="/signup">{t("signUp")}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center text-[13px] font-semibold text-[#0f1115]">Reset password</div>

                  <div className="mt-3 space-y-2.5">
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t("emailOrPhone")}
                      className="h-10 rounded-full bg-white/85 text-sm"
                    />
                    <Input
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Reset token"
                      className="h-10 rounded-full bg-white/85 text-sm"
                    />
                    <Input
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="New password"
                      type={showPassword ? "text" : "password"}
                      className="h-10 rounded-full bg-white/85 pr-10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePasswordReset();
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between">
                    <button type="button" className="text-[11px] font-medium text-blue-600" onClick={() => setAuthMode("signin")}>
                      Back to sign in
                    </button>
                    <button type="button" className="text-[11px] font-medium text-blue-600" onClick={() => setShowPassword((s) => !s)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetting}
                      className={cn("h-10 rounded-full bg-blue-600 px-5 text-[13px] text-white shadow-soft hover:bg-blue-600/90")}
                    >
                      {resetting ? "Saving..." : "Update password"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-200px" />

        <div className="absolute inset-x-0 top-0 z-40">
          <MegaMenu
            open={menuOpen}
            activeCategoryId={activeCategoryId}
            onClose={scheduleClose}
            onKeepOpen={keepMenuOpen}
          />
        </div>

        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-center px-4 pb-24 pt-28 sm:px-6">
          <div className="pointer-events-none absolute inset-0 -z-10" />

          <div className="flex w-full flex-col items-center">
            <div className="select-none text-center text-[56px] font-extrabold leading-[0.95] tracking-[-0.04em] text-gradient-brand sm:text-[60px] md:text-[100px]"
              style={{
                fontFamily: "'Urbanist', sans-serif",
                backgroundImage:
                  "linear-gradient(75.5174deg, rgba(0, 143, 247, 0.8) 9.9891%, rgba(45, 132, 248, 0.8) 20.466%, rgba(90, 121, 249, 0.8) 30.943%, rgba(179, 99, 250, 0.8) 42.629%, rgba(228, 75, 193, 0.8) 55.524%, rgba(235, 72, 131, 0.8) 67.21%, rgba(243, 69, 70, 0.72) 85.423%, rgba(255, 221, 85, 0.8) 93.805%)",
              }}>
              Vehsl
            </div>

            <div className="mt-8 w-full">
              <SearchBar value={query} onChange={setQuery} />
            </div>
          </div>
        </div>

        <SuggestedProducts />
        <TrustSection />
        <PromisesSection />
        <LogisticsSection />
        <ValueSection />
        <SavingsSection />
        <WeeklyProducts />
        <SustainabilitySection />
        <Footer />
      </div>
    </div>
  );
}
