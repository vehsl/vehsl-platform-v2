"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { safeJsonParse } from "@/lib/utils";

type StoredUser = {
  role?: string;
  account_type?: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string;
  last_name?: string;
};

const AdminApp = dynamic(() => import("@/components/admin/AdminApp").then((m) => m.AdminApp), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading admin…</div>,
});

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vehsl.user");
      setUser(safeJsonParse<StoredUser | null>(raw, null));
    } catch {
      setUser(null);
    }
    setBootstrapped(true);
  }, []);

  const isAdmin = useMemo(() => (user?.role || "").toLowerCase() === "admin", [user]);

  useEffect(() => {
    if (!bootstrapped) return;
    if (user == null) {
      router.replace("/?signin=1");
      return;
    }
    if (!isAdmin) {
      router.replace("/orders");
    }
  }, [bootstrapped, isAdmin, router, user]);

  if (!bootstrapped) return null;

  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <AdminApp />
      </div>
    );
  }

  return null;
}
