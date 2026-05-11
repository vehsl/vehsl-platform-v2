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
import { useLanguage } from "@/context/language";

export function HomeShell() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeTimer = useRef<number | null>(null);

  const openMenu = useCallback((categoryId: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setActiveCategoryId(categoryId);
    setMenuOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 120);
  }, []);

  const keepMenuOpen = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const [signInOpen, setSignInOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("signin") === "1") {
        setSignInOpen(true);
        u.searchParams.delete("signin");
        window.history.replaceState({}, "", u.toString());
      }
    } catch {}
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

  const handleSignIn = useCallback(async () => {
    if (signingIn) return;
    const id = identifier.trim();
    const pw = password;
    if (!id || !pw) {
      toast.error("Enter email/phone and password.");
      return;
    }

    const base = (() => {
      const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
      const normalize = (u: string) => u.replace(/\/$/, "");
      if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) {
        return normalize(fromEnv);
      }
      return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
    })();

    try {
      setSigningIn(true);
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password: pw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = (err && (err.detail || err.non_field_errors)) || "Login failed.";
        toast.error(typeof msg === "string" ? msg : "Login failed.");
        return;
      }

      const tokens = await res.json();
      try {
        window.localStorage.setItem("vehsl.access", tokens.access);
        window.localStorage.setItem("vehsl.refresh", tokens.refresh);
        window.localStorage.setItem("vehsl.user", JSON.stringify(tokens.user));
      } catch {}

      setSignInOpen(false);
      toast.success("Signed in.");
      const role = (tokens?.user?.role || "").toString().toLowerCase();
      router.push(role === "admin" ? "/admin" : "/orders/1");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error.";
      toast.error(message.includes("Failed to fetch") ? "Network error. Check backend URL/CORS." : message);
    } finally {
      setSigningIn(false);
    }
  }, [identifier, password, router, signingIn]);

  return (
    <div className="bg-vehsl-watercolor font-inter min-h-screen w-full overflow-hidden">
      <div className="relative min-h-screen">
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
            align="end"
            sideOffset={14}
            className={cn(
              "w-[360px] rounded-[28px] border border-white/60 bg-white/55 p-4 backdrop-blur-2xl shadow-soft",
            )}
          >
            <div className="rounded-3xl bg-white/65 p-4">
              <div className="text-center text-sm font-semibold text-[#0f1115]">{t("login")}</div>

              <div className="mt-4 space-y-3">
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("emailOrPhone")}
                  className="h-11 rounded-full bg-white/85"
                />

                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("password")}
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-full bg-white/85 pr-12"
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
              </div>

              <div className="mt-2 flex justify-end">
                <button type="button" className="text-xs font-medium text-blue-600">
                  {t("forgotPassword")}
                </button>
              </div>

              <div className="mt-5 flex justify-center">
                <Button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className={cn(
                    "h-11 rounded-full bg-blue-600 px-6 text-white shadow-soft hover:bg-blue-600/90",
                  )}
                >
                  {signingIn ? "Signing in..." : t("signIn")}
                </Button>
                <Button
                  asChild
                  className={cn(
                    "h-11 rounded-full bg-white px-6 text-[#0f1115] shadow-soft",
                    "bg-[linear-gradient(white,white),linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b)] bg-origin-border bg-clip-padding,border-box border border-transparent",
                  )}
                >
                  <Link href="/signup">{t("signUp")}</Link>
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[200px]" />

        <div className="absolute inset-x-0 top-0 z-40">
          <MegaMenu
            open={menuOpen}
            activeCategoryId={activeCategoryId}
            onClose={scheduleClose}
            onKeepOpen={keepMenuOpen}
          />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-24 pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10" />

          <div className="flex w-full flex-col items-center">
            <div className="select-none text-center text-[84px] font-extrabold tracking-[-0.04em] text-gradient-brand md:text-[160px]">
              Vehsl
            </div>

            <div className="mt-8 w-full">
              <SearchBar value={query} onChange={setQuery} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
