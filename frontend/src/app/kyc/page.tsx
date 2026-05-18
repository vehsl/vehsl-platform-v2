"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Clock, XCircle, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

type RequirementOption = { kind: string; label: string; doc_type?: string };
type RequirementGroup = {
  key: string;
  label: string;
  required: boolean;
  required_count?: number;
  uploaded_count?: number;
  options: RequirementOption[];
  status: "missing" | "pending" | "verified" | "rejected";
  documents: Array<{
    id: string;
    kind: string;
    doc_type: string;
    original_name: string;
    size_bytes: number;
    uploaded_at: string;
    review_status: string;
    rejection_reason: string;
    file_url: string;
  }>;
};

export default function KycPage() {
  const router = useRouter();

  const apiBase = useCallback(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const normalize = (u: string) => u.replace(/\/$/, "");
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
    return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
  }, []);

  const access = useMemo(() => {
    try {
      return window.localStorage.getItem("vehsl.access") || "";
    } catch {
      return "";
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<{
    role: string;
    account_type: string;
    groups: RequirementGroup[];
    missing_groups: string[];
    all_required_uploaded: boolean;
  } | null>(null);

  const fetchRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/kyc/requirements`, {
        headers: access ? { Authorization: `Bearer ${access}` } : {},
      });
      if (res.status === 401) {
        router.push("/?signin=1");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.detail || data.error)) || `Request failed (${res.status})`);
      setRequirements(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load verification requirements.";
      toast.error(msg);
      setRequirements(null);
    } finally {
      setLoading(false);
    }
  }, [access, apiBase, router]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const upload = useCallback(
    async (kind: string, file: File, docType?: string) => {
      if (!kind || !file) return;
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.set("kind", kind);
        if (docType) fd.set("doc_type", docType);
        fd.set("file", file);
        const res = await fetch(`${apiBase()}/api/v1/kyc/documents`, {
          method: "POST",
          headers: access ? { Authorization: `Bearer ${access}` } : {},
          body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && (data.detail || data.error)) || `Upload failed (${res.status})`);
        toast.success("Document uploaded.");
        await fetchRequirements();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [access, apiBase, fetchRequirements],
  );

  const statusChip = (status: RequirementGroup["status"]) => {
    if (status === "verified") return { label: "Verified", icon: <CheckCircle2 className="h-4 w-4" />, cls: "bg-[#30A46C]/10 text-[#1f7a4a]" };
    if (status === "pending") return { label: "Pending", icon: <Clock className="h-4 w-4" />, cls: "bg-[#FFB224]/12 text-[#9a5b00]" };
    if (status === "rejected") return { label: "Rejected", icon: <XCircle className="h-4 w-4" />, cls: "bg-[#E5484D]/10 text-[#b4232a]" };
    return { label: "Missing", icon: <FileText className="h-4 w-4" />, cls: "bg-muted/30 text-muted-foreground" };
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-[980px] px-5 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Account Verification</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Upload required documents. After submission, you’ll wait for admin acceptance.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={fetchRequirements} disabled={loading || submitting}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="mt-7 rounded-3xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {loading && <div className="text-[13px] text-muted-foreground">Loading requirements…</div>}
          {!loading && requirements && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] text-muted-foreground">
                  {requirements.account_type ? `Account type: ${requirements.account_type}` : "Account type: —"}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium",
                    requirements.all_required_uploaded ? "bg-[#30A46C]/10 text-[#1f7a4a]" : "bg-[#FFB224]/12 text-[#9a5b00]",
                  )}
                >
                  {requirements.all_required_uploaded ? "Submitted / In review" : "Action required"}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {requirements.groups.map((g) => {
                  const chip = statusChip(g.status);
                  return (
                    <div key={g.key} className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-[14px] font-semibold">{g.label}</div>
                            {g.required && <span className="text-[11px] text-muted-foreground/70">(required)</span>}
                          </div>
                          <div className="mt-1 text-[12px] text-muted-foreground">
                            {g.options?.length ? `Accepted: ${g.options.map((o) => o.label).join(" / ")}` : ""}
                          </div>
                        </div>
                        <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium", chip.cls)}>
                          {chip.icon}
                          {chip.label}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {g.options.map((o) => (
                          <label
                            key={o.kind}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border border-border/40 bg-white/70 px-3 py-2 text-[12px] cursor-pointer hover:bg-white transition-colors",
                              submitting ? "opacity-60 pointer-events-none" : "",
                            )}
                          >
                            <Upload className="h-4 w-4 text-muted-foreground/70" />
                            Upload {o.label}
                            <input
                              type="file"
                              className="sr-only"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) upload(o.kind, f, o.doc_type);
                                e.currentTarget.value = "";
                              }}
                            />
                          </label>
                        ))}
                      </div>

                      <div className="mt-4">
                        <div className="text-[12px] text-muted-foreground mb-2">
                          Uploaded ({g.documents?.length || 0})
                        </div>
                        {(g.documents || []).length === 0 ? (
                          <div className="text-[12px] text-muted-foreground/70">No documents uploaded yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {g.documents.slice(0, 4).map((d) => (
                              <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-card border border-border/30 px-3 py-2">
                                <div className="min-w-0">
                                  <div className="text-[12px] font-medium truncate">{d.original_name || d.kind}</div>
                                  <div className="text-[11px] text-muted-foreground/70 truncate">{d.review_status}{d.rejection_reason ? ` · ${d.rejection_reason}` : ""}</div>
                                </div>
                                {d.file_url ? (
                                  <a
                                    href={d.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] font-medium text-primary hover:underline"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-[12px] text-muted-foreground/60">—</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="text-[12px] text-muted-foreground">
                  {requirements.all_required_uploaded
                    ? "All required documents uploaded. Waiting for admin acceptance."
                    : "Upload all required documents to submit for admin review."}
                </div>
                <Button
                  className="rounded-full"
                  onClick={() => router.push("/orders/1")}
                  disabled={!requirements.all_required_uploaded}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
