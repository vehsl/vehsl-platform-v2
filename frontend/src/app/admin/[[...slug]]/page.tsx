"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/components/admin/AdminApp").then((m) => m.AdminApp), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading admin…</div>,
});

export default function Page() {
  return <AdminApp />;
}
