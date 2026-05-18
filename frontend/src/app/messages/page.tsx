"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { ArrowLeft, Search, Plus, Send, Paperclip, MoreHorizontal, X, Check } from "lucide-react";

type ThreadUser = {
  id: number;
  name: string;
  role?: string | null;
  account_type?: string | null;
  email?: string | null;
  phone?: string | null;
};

type ChatMessage = {
  id: number;
  thread: number;
  sender_id: number;
  sender_name: string;
  content: string;
  attachments: { name: string; url: string; content_type?: string; size?: number }[];
  sent_at: string;
  read_by: number[];
  deleted_at: string | null;
};

type ChatThread = {
  id: number;
  type: string;
  participants: number[];
  created_at: string;
  updated_at: string;
  unread_count: number;
  other_participants: ThreadUser[];
  last_message: ChatMessage | null;
};

type UserSearchResult = ThreadUser;

function apiBase() {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  const normalize = (u: string) => u.replace(/\/$/, "");
  if (fromEnv && /^https?:\/\//.test(fromEnv) && !/\/\/backend(?=[:/]|$)/.test(fromEnv)) return normalize(fromEnv);
  return normalize(`${window.location.protocol}//${window.location.hostname}:8000`);
}

function readAccessToken() {
  try {
    return window.localStorage.getItem("vehsl.access") || "";
  } catch {
    return "";
  }
}

function readRefreshToken() {
  try {
    return window.localStorage.getItem("vehsl.refresh") || "";
  } catch {
    return "";
  }
}

function readUser() {
  try {
    const raw = window.localStorage.getItem("vehsl.user");
    return raw ? (JSON.parse(raw) as { id?: number; account_type?: string; role?: string } | null) : null;
  } catch {
    return null;
  }
}

function clearAuth() {
  try {
    window.localStorage.removeItem("vehsl.access");
    window.localStorage.removeItem("vehsl.refresh");
    window.localStorage.removeItem("vehsl.user");
  } catch {}
}

export default function Page() {
  const me = readUser();
  const myId = Number(me?.id || 0);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get("thread") || "").trim();
      const id = Number(raw);
      if (id && Number.isFinite(id)) setActiveThreadId(id);
    } catch {}
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [query, setQuery] = useState("");
  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const title = t.other_participants.map((p) => p.name).join(", ");
      const last = t.last_message?.content || "";
      return `${title} ${last}`.toLowerCase().includes(q);
    });
  }, [threads, query]);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [creating, setCreating] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userOffset, setUserOffset] = useState(0);
  const [userHasMore, setUserHasMore] = useState(false);
  const [userTotal, setUserTotal] = useState<number | null>(null);

  const [menuMsgId, setMenuMsgId] = useState<number | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);

  const refreshAccess = useCallback(async () => {
    const refresh = readRefreshToken();
    if (!refresh) return "";
    try {
      const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = await res.json().catch(() => null);
      const nextAccess = (data?.access || "").toString();
      if (!res.ok || !nextAccess) return "";
      try {
        window.localStorage.setItem("vehsl.access", nextAccess);
      } catch {}
      return nextAccess;
    } catch {
      return "";
    }
  }, []);

  const authedFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const doFetch = async (access: string) =>
        fetch(`${apiBase()}${path}`, {
          ...init,
          headers: {
            ...(init?.headers || {}),
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
          },
          cache: "no-store",
        });

      let access = readAccessToken();
      let res = await doFetch(access);
      if (res.status !== 401) return res;

      const nextAccess = await refreshAccess();
      if (!nextAccess) {
        clearAuth();
        try {
          window.location.assign("/?signin=1");
        } catch {}
        return res;
      }

      access = nextAccess;
      res = await doFetch(access);
      return res;
    },
    [refreshAccess]
  );

  const goDashboard = useCallback(() => {
    try {
      const user = readUser();
      const acct = (user?.account_type || user?.role || "").toString().toLowerCase();
      if (acct === "seller") {
        window.location.href = "/orders/1?tab=orders";
        return;
      }
      window.location.href = "/orders/1?tab=orders";
    } catch {
      window.location.href = "/orders/1?tab=orders";
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await authedFetch(`/api/v1/chat/threads/`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
      const items = Array.isArray(data) ? (data as ChatThread[]) : [];
      setThreads(items);
      if (activeThreadId == null && items.length) setActiveThreadId(items[0].id);
    } catch (e: any) {
      toast("Could not load chats", { description: e?.message || "Try again." });
    } finally {
      setLoadingThreads(false);
    }
  }, [activeThreadId, authedFetch]);

  const fetchMessages = useCallback(
    async (threadId: number) => {
      setLoadingMessages(true);
      try {
        const res = await authedFetch(`/api/v1/chat/threads/${threadId}/messages/?limit=200`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
        const items = Array.isArray(data) ? (data as ChatMessage[]) : [];
        setMessages(items);
        setMenuMsgId(null);
        setEditingMsgId(null);
        setEditingText("");
        window.setTimeout(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        }, 0);
        setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
      } catch (e: any) {
        toast("Could not load messages", { description: e?.message || "Try again." });
      } finally {
        setLoadingMessages(false);
      }
    },
    [authedFetch]
  );

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (activeThreadId == null) return;
    void fetchMessages(activeThreadId);
  }, [activeThreadId, fetchMessages]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) || null, [threads, activeThreadId]);
  const activeTitle = activeThread?.other_participants?.length
    ? activeThread.other_participants.map((p) => p.name).join(", ")
    : activeThread
    ? `Thread #${activeThread.id}`
    : "Messages";

  const sendMessage = useCallback(async () => {
    if (!activeThreadId) return;
    if (!composer.trim() && files.length === 0) return;
    if (sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("content", composer.trim());
      files.forEach((f) => fd.append("files", f));

      const res = await authedFetch(`/api/v1/chat/threads/${activeThreadId}/messages/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);

      setComposer("");
      setFiles([]);
      setMessages((prev) => [...prev, data as ChatMessage]);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId ? { ...t, last_message: data as ChatMessage, updated_at: (data as ChatMessage).sent_at } : t
        )
      );
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    } catch (e: any) {
      toast("Could not send message", { description: e?.message || "Try again." });
    } finally {
      setSending(false);
    }
  }, [activeThreadId, authedFetch, composer, files, sending]);

  const beginEdit = useCallback(
    (m: ChatMessage) => {
      setMenuMsgId(null);
      setEditingMsgId(m.id);
      setEditingText(m.content || "");
    },
    []
  );

  const saveEdit = useCallback(async () => {
    if (!editingMsgId) return;
    try {
      const res = await authedFetch(`/api/v1/chat/messages/${editingMsgId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingText }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
      setMessages((prev) => prev.map((x) => (x.id === editingMsgId ? (data as ChatMessage) : x)));
      setThreads((prev) =>
        prev.map((t) => (t.id === (data as ChatMessage).thread ? { ...t, last_message: t.last_message?.id === editingMsgId ? (data as ChatMessage) : t.last_message } : t))
      );
      setEditingMsgId(null);
      setEditingText("");
    } catch (e: any) {
      toast("Could not edit message", { description: e?.message || "Try again." });
    }
  }, [authedFetch, editingMsgId, editingText]);

  const deleteMessage = useCallback(
    async (id: number) => {
      setMenuMsgId(null);
      try {
        const res = await authedFetch(`/api/v1/chat/messages/${id}/`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) {
          const data = await res.json().catch(() => null);
          throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
        }
        setMessages((prev) => prev.filter((x) => x.id !== id));
      } catch (e: any) {
        toast("Could not delete message", { description: e?.message || "Try again." });
      }
    },
    [authedFetch]
  );

  const searchUsers = useCallback(
    async (q: string, offset: number) => {
      setSearchingUsers(true);
      try {
        const res = await authedFetch(
          `/api/v1/chat/threads/users/?q=${encodeURIComponent(q)}&limit=50&offset=${encodeURIComponent(String(offset))}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
        const items = Array.isArray(data?.results) ? (data.results as UserSearchResult[]) : [];
        const hasMore = !!data?.has_more;
        const nextOffset = Number(data?.next_offset || 0);
        const total = data?.total != null ? Number(data.total) : null;
        setUserTotal(Number.isFinite(total as any) ? (total as number) : null);
        setUserHasMore(Boolean(hasMore));
        setUserOffset(Number.isFinite(nextOffset) ? nextOffset : offset + items.length);
        if (offset > 0) setUserResults((prev) => [...prev, ...items]);
        else setUserResults(items);
      } catch (e: any) {
        if (offset === 0) setUserResults([]);
        toast("User search failed", { description: e?.message || "Try again." });
      } finally {
        setSearchingUsers(false);
      }
    },
    [authedFetch]
  );

  useEffect(() => {
    if (!creating) return;
    setUserOffset(0);
    setUserHasMore(false);
    setUserTotal(null);
    void searchUsers("", 0);
  }, [creating, searchUsers, userSearch]);

  useEffect(() => {
    if (!creating) return;
    const q = userSearch.trim();
    if (q.length === 0) {
      void searchUsers("", 0);
      return;
    }
    if (q.length < 2) {
      setUserResults([]);
      setUserOffset(0);
      setUserHasMore(false);
      setUserTotal(null);
      return;
    }
    const t = window.setTimeout(() => void searchUsers(q, 0), 260);
    return () => window.clearTimeout(t);
  }, [creating, searchUsers, userSearch]);

  const loadMoreUsers = useCallback(() => {
    if (searchingUsers || !userHasMore) return;
    const q = userSearch.trim();
    void searchUsers(q, userOffset);
  }, [searchingUsers, searchUsers, userHasMore, userOffset, userSearch]);

  const createThreadWith = useCallback(
    async (u: UserSearchResult) => {
      try {
        const res = await authedFetch(`/api/v1/chat/threads/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participants: [u.id] }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && (data.detail || data.error)) || `HTTP ${res.status}`);
        const thread = data as ChatThread;
        setCreating(false);
        setUserSearch("");
        setUserResults([]);
        await fetchThreads();
        setActiveThreadId(thread.id);
      } catch (e: any) {
        toast("Could not start chat", { description: e?.message || "Try again." });
      }
    },
    [authedFetch, fetchThreads]
  );

  return (
    <div className="min-h-dvh font-urbanist selection:bg-blue-500/15 selection:text-blue-600 relative overflow-x-hidden">
      <Toaster richColors />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#F2EDE7] via-[#EAECF2] to-[#E3E8F0]" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button
              onClick={goDashboard}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-bold bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#1A1A1A]/60"
            >
              <ArrowLeft size={14} />
              Back to dashboard
            </button>
            <h1 className="text-[34px] sm:text-[42px] font-black tracking-tight text-[#1A1A1A] leading-[1.05] mt-4">Messages</h1>
            <p className="text-[13px] font-semibold text-[#1A1A1A]/35 mt-2">Chat with other users on Vehsl</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black bg-white/55 border border-white/70 hover:bg-white/75 transition text-[#1A1A1A]/60"
          >
            <Plus size={14} />
            New chat
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
          <div className="bg-white/55 border border-white/70 rounded-[26px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.04]">
              <div className="flex items-center gap-2 bg-white/60 border border-white/70 rounded-full px-4 py-2.5">
                <Search size={16} className="text-[#1A1A1A]/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent border-none outline-none text-[13px] font-semibold text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/30 w-full"
                />
              </div>
              <p className="text-[11px] font-semibold text-[#1A1A1A]/35 mt-3">
                {loadingThreads ? "Loading…" : `${filteredThreads.length} conversations`}
              </p>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {filteredThreads.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-[13px] font-black text-[#1A1A1A]/70">No conversations</p>
                  <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">Start a new chat to message someone.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {filteredThreads.map((t) => {
                    const title = t.other_participants?.length ? t.other_participants.map((p) => p.name).join(", ") : `Thread #${t.id}`;
                    const preview = (t.last_message?.content || "").trim() || (t.last_message?.attachments?.length ? "Attachment" : "");
                    const active = t.id === activeThreadId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveThreadId(t.id)}
                        className="w-full text-left px-5 py-4 hover:bg-white/35 transition"
                        style={{ background: active ? "rgba(0,113,227,0.06)" : "transparent" }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[12px] font-black text-[#1A1A1A]/55">
                            {(title.trim()[0] || "C").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-black text-[#1A1A1A]/85 truncate">{title}</p>
                              {t.unread_count > 0 ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/15">
                                  {t.unread_count}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] font-semibold text-[#1A1A1A]/35 truncate mt-1">{preview || "—"}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/55 border border-white/70 rounded-[26px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.04]">
              <p className="text-[13px] font-black text-[#1A1A1A]/85 truncate">{activeTitle}</p>
              <p className="text-[11px] font-semibold text-[#1A1A1A]/35 mt-1">{loadingMessages ? "Loading…" : `${messages.length} messages`}</p>
            </div>

            <div ref={listRef} className="h-[56vh] overflow-auto px-5 py-5 space-y-3">
              {activeThreadId == null ? (
                <div className="py-10 text-center">
                  <p className="text-[13px] font-black text-[#1A1A1A]/70">Select a conversation</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[13px] font-black text-[#1A1A1A]/70">No messages yet</p>
                  <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">Say hello.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = myId && m.sender_id === myId;
                  const showMenu = mine && !m.deleted_at;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[82%]">
                        <div className={`rounded-2xl px-4 py-3 border ${mine ? "bg-[#0071e3]/10 border-[#0071e3]/15" : "bg-white/65 border-white/70"}`}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              {!mine ? (
                                <p className="text-[11px] font-black text-[#1A1A1A]/55">{m.sender_name || "User"}</p>
                              ) : null}

                              {editingMsgId === m.id ? (
                                <div className="mt-1">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full min-h-[70px] bg-white/70 border border-white/80 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#1A1A1A]/80 outline-none"
                                  />
                                  <div className="mt-2 flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingMsgId(null);
                                        setEditingText("");
                                      }}
                                      className="inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition text-[#1A1A1A]/55"
                                    >
                                      <X size={14} />
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => void saveEdit()}
                                      className="inline-flex items-center justify-center rounded-full px-3.5 py-2 text-[12px] font-black bg-white/70 border border-white/80 hover:bg-white transition text-[#0071e3]"
                                    >
                                      <Check size={14} />
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : m.deleted_at ? (
                                <p className="text-[13px] font-semibold text-[#1A1A1A]/35 italic">Message deleted</p>
                              ) : (
                                <>
                                  {m.content ? (
                                    <p className="text-[13px] font-semibold text-[#1A1A1A]/80 whitespace-pre-wrap">{m.content}</p>
                                  ) : null}
                                  {m.attachments?.length ? (
                                    <div className="mt-2 space-y-2">
                                      {m.attachments.map((a, i) => (
                                        <a
                                          key={`${m.id}-a-${i}`}
                                          href={a.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block rounded-xl bg-white/70 border border-white/80 px-3 py-2 hover:bg-white transition"
                                        >
                                          <p className="text-[12px] font-black text-[#1A1A1A]/70 truncate">{a.name || "Attachment"}</p>
                                          <p className="text-[11px] font-semibold text-[#1A1A1A]/35 truncate">{a.url}</p>
                                        </a>
                                      ))}
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>

                            {showMenu ? (
                              <div className="relative">
                                <button
                                  onClick={() => setMenuMsgId((x) => (x === m.id ? null : m.id))}
                                  className="p-1.5 rounded-full hover:bg-black/[0.04] transition"
                                >
                                  <MoreHorizontal size={16} className="text-[#1A1A1A]/40" />
                                </button>
                                {menuMsgId === m.id ? (
                                  <div className="absolute right-0 mt-2 w-[150px] rounded-2xl bg-white/95 border border-white/80 shadow-[0_16px_60px_rgba(0,0,0,0.12)] overflow-hidden">
                                    <button
                                      onClick={() => beginEdit(m)}
                                      className="w-full text-left px-4 py-3 text-[12px] font-black text-[#1A1A1A]/75 hover:bg-black/[0.03] transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => void deleteMessage(m.id)}
                                      className="w-full text-left px-4 py-3 text-[12px] font-black text-[#D64545] hover:bg-black/[0.03] transition"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <p className={`text-[10px] font-semibold mt-1 ${mine ? "text-right" : "text-left"} text-[#1A1A1A]/28`}>
                          {new Date(m.sent_at).toLocaleString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-4 border-t border-black/[0.04]">
              {files.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 text-[11px] font-semibold text-[#1A1A1A]/65"
                    >
                      <span className="max-w-[220px] truncate">{f.name}</span>
                      <button
                        onClick={() => setFiles((xs) => xs.filter((_, idx) => idx !== i))}
                        className="p-0.5 rounded-full hover:bg-black/[0.04] transition"
                      >
                        <X size={12} className="text-[#1A1A1A]/40" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white/60 border border-white/70 rounded-2xl px-4 py-3">
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Write a message..."
                    className="w-full bg-transparent border-none outline-none resize-none text-[13px] font-semibold text-[#1A1A1A]/80 placeholder:text-[#1A1A1A]/30 min-h-[44px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                </div>

                <label className="inline-flex items-center justify-center rounded-full w-11 h-11 bg-white/55 border border-white/70 hover:bg-white/75 transition cursor-pointer">
                  <Paperclip size={16} className="text-[#1A1A1A]/55" />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      setFiles((xs) => [...xs, ...picked].slice(0, 10));
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || activeThreadId == null}
                  className="inline-flex items-center justify-center rounded-full w-11 h-11 bg-[#0071e3]/10 border border-[#0071e3]/15 hover:bg-[#0071e3]/14 transition disabled:opacity-60"
                >
                  <Send size={16} className="text-[#0071e3]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {creating ? (
          <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/10" onClick={() => setCreating(false)} />
            <div className="absolute left-1/2 top-[14%] -translate-x-1/2 w-[92vw] max-w-[520px] bg-white/92 border border-white/80 shadow-[0_18px_80px_rgba(0,0,0,0.16)] rounded-[26px] overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.04] flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-black text-[#1A1A1A]/85">Start a new chat</p>
                  <p className="text-[12px] font-semibold text-[#1A1A1A]/35 mt-1">Search users by name, email, or phone.</p>
                </div>
                <button
                  onClick={() => setCreating(false)}
                  className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-white/60 border border-white/70 hover:bg-white transition"
                >
                  <X size={16} className="text-[#1A1A1A]/55" />
                </button>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 bg-white/60 border border-white/70 rounded-full px-4 py-2.5">
                  <Search size={16} className="text-[#1A1A1A]/35" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Type to search…"
                    className="bg-transparent border-none outline-none text-[13px] font-semibold text-[#1A1A1A]/75 placeholder:text-[#1A1A1A]/30 w-full"
                  />
                </div>
                <p className="text-[11px] font-semibold text-[#1A1A1A]/35 mt-3">
                  {searchingUsers
                    ? "Loading…"
                    : userSearch.trim().length >= 2
                    ? userTotal != null
                      ? `${userTotal} results`
                      : `${userResults.length} results`
                    : userTotal != null
                    ? `${userTotal} users`
                    : `${userResults.length} users`}
                </p>
              </div>
              <div className="max-h-[46vh] overflow-auto border-t border-black/[0.04]">
                {userResults.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]/35">
                      {userSearch.trim().length < 2 ? "Showing all users. Type to filter." : "No users found."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="divide-y divide-black/[0.04]">
                      {userResults.map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => void createThreadWith(u)}
                          className="w-full text-left px-6 py-4 hover:bg-black/[0.02] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[12px] font-black text-[#1A1A1A]/55">
                              {(u.name?.trim?.()[0] || "U").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-black text-[#1A1A1A]/85 truncate">
                                {u.name}
                                {u.is_manager ? <span className="ml-2 text-[11px] font-black text-[#0071e3]/70">(Manager)</span> : null}
                              </p>
                              <p className="text-[11px] font-semibold text-[#1A1A1A]/35 truncate">
                                {(u.email || u.phone || "").toString()}
                              </p>
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-black/[0.03] text-[#1A1A1A]/55 border border-black/[0.05]">
                              {(u.account_type || u.role || "user").toString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {userHasMore ? (
                      <div className="px-6 py-4 border-t border-black/[0.04]">
                        <button
                          onClick={loadMoreUsers}
                          disabled={searchingUsers}
                          className="w-full inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-black bg-white/60 border border-white/70 hover:bg-white transition text-[#1A1A1A]/60 disabled:opacity-60"
                        >
                          Load more
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
