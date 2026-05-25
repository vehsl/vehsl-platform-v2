"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, CheckCircle2, Clock, XCircle, FileText, RefreshCw, LogOut, Eye, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { fetchJsonAuthed } from "@/lib/api";

type RequirementOption = { kind: string; label: string; doc_type?: string };
type RequirementGroup = {
  key: string;
  label: string;
  required: boolean;
  required_count?: number;
  uploaded_count?: number;
  verified_count?: number;
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

type KycDocumentRow = RequirementGroup["documents"][number];

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background text-foreground" />}>
      <KycPageInner />
    </Suspense>
  );
}

function KycPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<{
    role: string;
    account_type: string;
    groups: RequirementGroup[];
    missing_groups: string[];
    unverified_groups: string[];
    all_required_uploaded: boolean;
    all_required_verified: boolean;
    seller_verification_status: string;
    can_access_dashboard: boolean;
  } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<KycDocumentRow | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  const logout = useCallback(async () => {
    const refresh = (() => {
      try {
        return window.localStorage.getItem("vehsl.refresh") || "";
      } catch {
        return "";
      }
    })();

    try {
      await fetchJsonAuthed("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    } catch {}

    try {
      window.localStorage.removeItem("vehsl.access");
      window.localStorage.removeItem("vehsl.refresh");
      window.localStorage.removeItem("vehsl.user");
    } catch {}

    window.location.href = "/?signin=1";
  }, []);

  const fetchRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonAuthed("/api/v1/kyc/requirements");
      setRequirements(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load verification requirements.";
      toast.error(msg);
      setRequirements(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
        await fetchJsonAuthed("/api/v1/kyc/documents", { method: "POST", body: fd });
        toast.success("Document uploaded.");
        await fetchRequirements();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [fetchRequirements],
  );

  const removeDocument = useCallback(
    async (doc: KycDocumentRow) => {
      if (!doc?.id) return;
      const ok = window.confirm("Remove this document? You can upload a replacement after removing it.");
      if (!ok) return;

      setSubmitting(true);
      try {
        await fetchJsonAuthed(`/api/v1/kyc/documents/${doc.id}`, { method: "DELETE" });
        if (previewDoc?.id === doc.id) setPreviewDoc(null);
        toast.success("Document removed.");
        await fetchRequirements();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Remove failed.";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [fetchRequirements, previewDoc],
  );

  const statusChip = (status: RequirementGroup["status"]) => {
    if (status === "verified") return { label: "Verified", icon: <CheckCircle2 className="h-4 w-4" />, cls: "bg-[#30A46C]/10 text-[#1f7a4a]" };
    if (status === "pending") return { label: "Pending", icon: <Clock className="h-4 w-4" />, cls: "bg-[#FFB224]/12 text-[#9a5b00]" };
    if (status === "rejected") return { label: "Rejected", icon: <XCircle className="h-4 w-4" />, cls: "bg-[#E5484D]/10 text-[#b4232a]" };
    return { label: "Missing", icon: <FileText className="h-4 w-4" />, cls: "bg-muted/30 text-muted-foreground" };
  };

  const isImageDoc = (doc: KycDocumentRow) => {
    const name = `${doc.original_name || doc.file_url || ""}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
  };

  const pageState = useMemo(() => {
    if (!requirements) {
      return {
        label: "Action required",
        className: "bg-[#FFB224]/12 text-[#9a5b00]",
        footer: "Upload all required documents to submit for admin review.",
      };
    }
    if (requirements.can_access_dashboard) {
      return {
        label: "Approved",
        className: "bg-[#30A46C]/10 text-[#1f7a4a]",
        footer: "Your account is approved. You can continue to the dashboard.",
      };
    }
    if (requirements.all_required_uploaded) {
      return {
        label: "Waiting for admin approval",
        className: "bg-[#0171E3]/10 text-[#075fb0]",
        footer: "All required documents are uploaded. Please wait for admin approval before continuing.",
      };
    }
    return {
      label: "Action required",
      className: "bg-[#FFB224]/12 text-[#9a5b00]",
      footer: "Upload all required documents to submit for admin review.",
    };
  }, [requirements]);

  const continuePath = useMemo(() => {
    const raw = (searchParams?.get("returnTo") || "").toString().trim();
    if (raw.startsWith("/")) return raw;

    const role = (requirements?.role || "").toLowerCase();
    const accountType = (requirements?.account_type || "").toLowerCase();
    if (role === "admin" || role === "manager" || role === "staff") return "/admin";
    if (accountType === "buyer" || role === "buyer") return "/explore";
    return "/orders";
  }, [requirements?.account_type, requirements?.role, searchParams]);

  const browserUrl = useCallback((url: string) => {
    if (!url) return url;
    try {
      const next = new URL(url, window.location.href);
      if (next.hostname === "0.0.0.0" && window.location.hostname !== "0.0.0.0") {
        next.hostname = window.location.hostname;
      }
      return next.toString();
    } catch {
      return url;
    }
  }, []);

  useEffect(() => {
    if (!previewDoc?.file_url) {
      setPreviewObjectUrl("");
      setPreviewError("");
      return;
    }

    let alive = true;
    let objectUrl = "";
    setPreviewObjectUrl("");
    setPreviewError("");

    fetch(browserUrl(previewDoc.file_url), {
      headers: (() => {
        const h = new Headers();
        try {
          const access = window.localStorage.getItem("vehsl.access") || "";
          if (access) h.set("Authorization", `Bearer ${access}`);
        } catch {}
        return h;
      })(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Document failed to load (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewObjectUrl(objectUrl);
      })
      .catch((e) => {
        if (!alive) return;
        setPreviewError(e instanceof Error ? e.message : "Document failed to load.");
      });

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [browserUrl, previewDoc]);

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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={fetchRequirements} disabled={loading || submitting}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" className="rounded-full" onClick={logout} disabled={submitting}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
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
                    pageState.className,
                  )}
                >
                  {pageState.label}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {requirements.groups.map((g) => {
                  const chip = statusChip(g.status);
                  const uploadedKinds = new Set((g.documents || []).map((d) => d.kind));
                  const requiredCount = Number(g.required_count || (g.required ? 1 : 0));
                  const uploadedCount = Number(g.uploaded_count ?? uploadedKinds.size);
                  const verifiedCount = Number(g.verified_count ?? 0);
                  const isRejected = (g.status || "") === "rejected";
                  const groupFilled = g.required ? uploadedCount >= requiredCount : false;
                  const extraDocs = requiredCount ? Math.max(0, (g.documents || []).length - requiredCount) : 0;
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
                        {g.options.map((o) => {
                          const alreadyUploaded = uploadedKinds.has(o.kind);
                          const lockedByRequirement = groupFilled && !alreadyUploaded && !isRejected;
                          const uploadLocked = alreadyUploaded || lockedByRequirement || requirements.can_access_dashboard;
                          return (
                            <label
                              key={o.kind}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border border-border/40 bg-white/70 px-3 py-2 text-[12px] transition-colors",
                                uploadLocked
                                  ? "cursor-not-allowed opacity-45"
                                  : "cursor-pointer hover:bg-white",
                                submitting ? "opacity-60 pointer-events-none" : "",
                              )}
                              title={
                                requirements.can_access_dashboard
                                  ? "Your account is approved."
                                  : lockedByRequirement
                                    ? "Required documents are uploaded. Remove an existing document to upload a different one."
                                  : alreadyUploaded
                                    ? "Remove the existing document before uploading another for this field."
                                    : undefined
                              }
                            >
                              {uploadLocked ? (
                                <CheckCircle2 className="h-4 w-4 text-[#30A46C]" />
                              ) : (
                                <Upload className="h-4 w-4 text-muted-foreground/70" />
                              )}
                              {alreadyUploaded ? `${o.label} uploaded` : `Upload ${o.label}`}
                              <input
                                type="file"
                                className="sr-only"
                                accept=".jpg,.jpeg,.png,.pdf"
                                disabled={uploadLocked || submitting}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) upload(o.kind, f, o.doc_type);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground mb-2">
                          <div>
                            Uploaded {requiredCount ? `${Math.min(uploadedCount, requiredCount)}/${requiredCount}` : `(${uploadedCount})`}
                          </div>
                          {requiredCount ? <div>Verified {Math.min(verifiedCount, requiredCount)}/{requiredCount}</div> : null}
                        </div>
                        {extraDocs > 0 ? (
                          <div className="mb-2 text-[12px] text-[#9a5b00]">
                            {extraDocs} extra document{extraDocs === 1 ? "" : "s"} uploaded. Remove extras to avoid delays.
                          </div>
                        ) : null}
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
                                <div className="flex shrink-0 items-center gap-3">
                                  {d.file_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDoc(d)}
                                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>
                                  ) : (
                                    <span className="text-[12px] text-muted-foreground/60">—</span>
                                  )}
                                  {d.review_status !== "verified" && !requirements.can_access_dashboard && (
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(d)}
                                      disabled={submitting}
                                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#E5484D]/80 hover:text-[#E5484D] hover:underline disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove
                                    </button>
                                  )}
                                </div>
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
                  {pageState.footer}
                </div>
                <Button
                  className="rounded-full"
                  onClick={() => router.push(continuePath)}
                  disabled={!requirements.can_access_dashboard}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>

        {previewDoc && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close preview"
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setPreviewDoc(null)}
            />
            <div className="absolute left-1/2 top-1/2 h-[min(760px,88vh)] w-[min(940px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{previewDoc.original_name || previewDoc.kind}</div>
                  <div className="text-[11px] text-muted-foreground">{previewDoc.review_status}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-57px)] bg-muted/10">
                {previewError ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-[#E5484D]/80">
                    {previewError}
                  </div>
                ) : !previewObjectUrl ? (
                  <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                    Loading document…
                  </div>
                ) : isImageDoc(previewDoc) ? (
                  <img src={previewObjectUrl} alt={previewDoc.original_name || previewDoc.kind} className="h-full w-full object-contain" />
                ) : (
                  <iframe src={previewObjectUrl} title={previewDoc.original_name || previewDoc.kind} className="h-full w-full border-0" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
