"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ChevronLeft,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Reply,
  SendHorizontal,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import {
  chatApi,
  type ChatMessageDto,
  type ConversationListItemDto,
} from "@/lib/api/chat";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useChatSocket } from "@/hooks/useChatSocket";
import { cn } from "@/lib/utils";

function newClientMsgId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function initialFrom(title: string) {
  return (title.trim()[0] || "?").toUpperCase();
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (dayKey(iso) === dayKey(now.toISOString())) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (dayKey(iso) === dayKey(y.toISOString())) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Thread — Mengobrol layout, Arc gold sent bubbles + online status.
 */
export default function ChatConversationScreen() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const myId = session?.user?.id;

  const [conv, setConv] = useState<ConversationListItemDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [presenceLabel, setPresenceLabel] = useState("…");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessageDto | null>(null);
  const [stagedFile, setStagedFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    Record<string, string>
  >({});
  /** Blob previews for optimistic image sends (keyed by clientMsgId). */
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>(
    {},
  );
  const [peerLastReadMessageId, setPeerLastReadMessageId] = useState<
    string | null
  >(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const markedReadRef = useRef<string | null>(null);
  const stagedFileRef = useRef<{ file: File; previewUrl: string } | null>(null);

  const clearStagedFile = useCallback(() => {
    setStagedFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  useEffect(() => {
    stagedFileRef.current = stagedFile;
  }, [stagedFile]);

  useEffect(() => {
    return () => {
      const staged = stagedFileRef.current;
      if (staged) URL.revokeObjectURL(staged.previewUrl);
    };
  }, []);

  const applyPeerRead = useCallback(
    (lastReadMessageId: string) => {
      setPeerLastReadMessageId(lastReadMessageId);
      setMessages((prev) => {
        const readMsg = prev.find((m) => m.id === lastReadMessageId);
        if (!readMsg) return prev;
        const readAt = new Date(readMsg.createdAt).getTime();
        let changed = false;
        const next = prev.map((m) => {
          if (m.senderId !== myId || m.pending) return m;
          const shouldSeen = new Date(m.createdAt).getTime() <= readAt;
          if (!!m.seen === shouldSeen) return m;
          changed = true;
          return { ...m, seen: shouldSeen, delivered: true };
        });
        return changed ? next : prev;
      });
    },
    [myId],
  );

  const mergeMessage = useCallback((msg: ChatMessageDto) => {
    setMessages((prev) => {
      const byClient = prev.findIndex(
        (m) => m.clientMsgId && m.clientMsgId === msg.clientMsgId,
      );
      if (byClient >= 0) {
        const next = [...prev];
        next[byClient] = {
          ...msg,
          pending: false,
          seen: msg.seen ?? false,
          delivered: true,
        };
        return next;
      }
      if (prev.some((m) => m.id === msg.id)) {
        return prev.map((m) =>
          m.id === msg.id
            ? {
                ...msg,
                pending: false,
                seen: msg.seen ?? m.seen,
                delivered: m.delivered ?? true,
              }
            : m,
        );
      }
      return [
        ...prev,
        { ...msg, pending: false, seen: msg.seen ?? false, delivered: false },
      ];
    });
  }, []);

  const { connected, emitSend, emitRead, emitTypingStart, emitTypingStop } =
    useChatSocket({
      conversationId,
      enabled: Boolean(token && conversationId),
      onMessage: (msg) => {
        mergeMessage(msg);
        if (
          msg.senderId !== myId &&
          conversationId &&
          msg.id !== markedReadRef.current
        ) {
          markedReadRef.current = msg.id;
          emitRead(conversationId, msg.id);
          if (token) {
            void chatApi
              .markRead(conversationId, msg.id, token)
              .catch(() => undefined);
          }
        }
      },
      onRead: (payload) => {
        if (payload.userId === myId) return;
        applyPeerRead(payload.lastReadMessageId);
      },
      onDelivered: (payload) => {
        if (payload.userId !== myId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId || m.clientMsgId === payload.messageId
              ? { ...m, delivered: true }
              : m,
          ),
        );
      },
      onTyping: (payload) => {
        if (payload.userId === myId) return;
        if (payload.isTyping) {
          setTypingUser(payload.userId);
          if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
          typingTimeout.current = window.setTimeout(
            () => setTypingUser(null),
            5000,
          );
        } else {
          setTypingUser(null);
        }
      },
      onPresence: (payload) => {
        if (!conv?.peerUserId || payload.userId !== conv.peerUserId) return;
        setPresenceLabel(payload.status === "online" ? "Online" : "Offline");
      },
    });

  const load = useCallback(async () => {
    if (!token || !conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, hist, presence] = await Promise.all([
        chatApi.conversation(conversationId, token),
        chatApi.messages(conversationId, { limit: 50 }, token),
        chatApi.presence(conversationId, token).catch(() => null),
      ]);
      setConv(c);
      setMessages(
        hist.items.map((m) => ({
          ...m,
          seen: !!m.seen,
          delivered: true,
        })),
      );
      setNextBefore(hist.nextBefore);
      if (c.peerLastReadMessageId) {
        setPeerLastReadMessageId(c.peerLastReadMessageId);
      }
      if (presence) {
        setPresenceLabel(presence.label);
      } else if (c.peerOnline != null) {
        setPresenceLabel(c.peerOnline ? "Online" : "Offline");
      }
      const last = hist.items[hist.items.length - 1];
      if (last) {
        markedReadRef.current = last.id;
        if (connected) emitRead(conversationId, last.id);
        else await chatApi.markRead(conversationId, last.id, token);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not load conversation",
      );
    } finally {
      setLoading(false);
    }
  }, [token, conversationId, connected, emitRead]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!peerLastReadMessageId || !myId) return;
    applyPeerRead(peerLastReadMessageId);
  }, [peerLastReadMessageId, messages.length, myId, applyPeerRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages.length, typingUser, reduceMotion]);

  useEffect(() => {
    if (!token) return;
    for (const m of messages) {
      if (
        m.attachmentId &&
        (m.type === "image" || m.attachmentMime?.startsWith("image/")) &&
        !attachmentPreviews[m.attachmentId] &&
        !m.deletedAt
      ) {
        void chatApi
          .fetchAttachmentBlob(m.attachmentId, token)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            setAttachmentPreviews((prev) => ({
              ...prev,
              [m.attachmentId!]: url,
            }));
          })
          .catch(() => undefined);
      }
    }
  }, [messages, token, attachmentPreviews]);

  // Poll presence lightly
  useEffect(() => {
    if (!token || !conversationId) return;
    const tick = () => {
      void chatApi
        .presence(conversationId, token)
        .then((p) => setPresenceLabel(p.label))
        .catch(() => undefined);
    };
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [token, conversationId]);

  async function loadOlder() {
    if (!token || !conversationId || !nextBefore) return;
    const hist = await chatApi.messages(
      conversationId,
      { before: nextBefore, limit: 40 },
      token,
    );
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const older = hist.items
        .filter((m) => !ids.has(m.id))
        .map((m) => ({ ...m, seen: !!m.seen, delivered: true }));
      return [...older, ...prev];
    });
    setNextBefore(hist.nextBefore);
  }

  async function onSend(e?: FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    const fileSnapshot = stagedFile;
    if ((!body && !fileSnapshot) || !token || !conversationId || sending) {
      return;
    }

    setSending(true);
    setText("");
    setStagedFile(null);
    emitTypingStop(conversationId);
    const replySnapshot = replyTo;
    setReplyTo(null);

    const clientMsgId = newClientMsgId();
    const isImage = !!fileSnapshot;
    if (fileSnapshot) {
      setLocalPreviews((prev) => ({
        ...prev,
        [clientMsgId]: fileSnapshot.previewUrl,
      }));
    }

    const optimistic: ChatMessageDto = {
      id: clientMsgId,
      conversationId,
      senderId: myId ?? "me",
      senderName: "You",
      senderAvatarUrl: null,
      clientMsgId,
      type: isImage ? "image" : "text",
      body: body || null,
      attachmentId: null,
      attachmentUrl: null,
      attachmentMime: fileSnapshot?.file.type || null,
      replyToId: replySnapshot?.id ?? null,
      replyTo: replySnapshot
        ? {
            id: replySnapshot.id,
            senderId: replySnapshot.senderId,
            senderName: replySnapshot.senderName,
            body: replySnapshot.body,
          }
        : null,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
      seen: false,
      delivered: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      let attachmentId: string | undefined;
      if (fileSnapshot) {
        const att = await chatApi.uploadAttachment(
          conversationId,
          fileSnapshot.file,
          fileSnapshot.file.name || "photo.jpg",
          token,
        );
        attachmentId = att.id;
      }

      const payload = {
        clientMsgId,
        type: (isImage ? "image" : "text") as "image" | "text",
        body: body || undefined,
        attachmentId,
        replyToId: replySnapshot?.id,
      };

      let msg: ChatMessageDto | null = null;
      if (connected) {
        msg = await emitSend({ conversationId, ...payload });
      }
      if (!msg) {
        msg = await chatApi.sendMessage(conversationId, payload, token);
      }
      mergeMessage({ ...msg, seen: !!msg.seen, delivered: true });
      if (fileSnapshot) {
        URL.revokeObjectURL(fileSnapshot.previewUrl);
        setLocalPreviews((prev) => {
          const next = { ...prev };
          delete next[clientMsgId];
          return next;
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.clientMsgId !== clientMsgId));
      setLocalPreviews((prev) => {
        const next = { ...prev };
        delete next[clientMsgId];
        return next;
      });
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : fileSnapshot
            ? "Upload failed"
            : "Send failed",
      );
      setText(body);
      if (fileSnapshot) {
        setStagedFile(fileSnapshot);
      }
      if (replySnapshot) setReplyTo(replySnapshot);
    } finally {
      setSending(false);
    }
  }

  function onPickImage(file: File) {
    if (sending) return;
    setStagedFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  function onType(value: string) {
    setText(value);
    if (!conversationId) return;
    if (value.trim()) emitTypingStart(conversationId);
    else emitTypingStop(conversationId);
  }

  async function deleteOwn(msg: ChatMessageDto) {
    if (!token || msg.senderId !== myId) return;
    try {
      const updated = await chatApi.deleteMessage(msg.id, token);
      mergeMessage(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Delete failed",
      );
    }
  }

  async function blockPeer() {
    if (!token || !conv?.peerUserId) return;
    try {
      await chatApi.block(conv.peerUserId, token);
      setMenuOpen(false);
      router.push("/chat");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Block failed",
      );
    }
  }

  const rows = useMemo(() => {
    const out: Array<
      | { kind: "day"; key: string; label: string }
      | { kind: "msg"; key: string; msg: ChatMessageDto; isLastOwn: boolean }
    > = [];
    let lastDay: string | null = null;
    let lastOwnId: string | null = null;
    for (const m of messages) {
      if (m.senderId === myId) lastOwnId = m.id;
    }
    for (const m of messages) {
      const dk = dayKey(m.createdAt);
      if (dk !== lastDay) {
        out.push({
          kind: "day",
          key: `day-${dk}`,
          label: dayLabel(m.createdAt),
        });
        lastDay = dk;
      }
      out.push({
        kind: "msg",
        key: m.id,
        msg: m,
        isLastOwn: m.id === lastOwnId,
      });
    }
    return out;
  }, [messages, myId]);

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-white font-rounded text-[#0f1220]">
      <header className="sticky top-0 z-20 shrink-0 border-b border-[#f0ebf8] bg-white/95 px-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.push("/chat")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f4f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
          </button>
          <UserAvatar
            initial={initialFrom(conv?.title ?? "?")}
            avatarUrl={conv?.avatarUrl}
            className="h-10 w-10 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold tracking-tight">
              {conv?.title ?? "Chat"}
            </p>
            <p
              className="text-[12px] font-semibold text-[#8a82a8]"
              aria-live="polite"
            >
              {typingUser ? "typing…" : presenceLabel}
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-label="Video call (coming soon)"
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full text-[#b3a8d6] opacity-50"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-label="Voice call (coming soon)"
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full text-[#b3a8d6] opacity-50"
          >
            <Phone className="h-5 w-5" />
          </button>
          {conv?.peerUserId ? (
            <div className="relative">
              <button
                type="button"
                aria-label="More"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#0f1220] hover:bg-[#f4f0ff]"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <div className="absolute top-11 right-0 z-20 min-w-[140px] overflow-hidden rounded-2xl border border-[#f0ebf8] bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => void blockPeer()}
                    className="w-full cursor-pointer px-3.5 py-2.5 text-left text-sm font-extrabold text-red-600 hover:bg-red-50"
                  >
                    Block user
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-[#faf8ff]">
        {error ? (
          <p
            role="alert"
            className="mx-4 mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-2">
          {nextBefore ? (
            <button
              type="button"
              onClick={() => void loadOlder()}
              className="mx-auto mb-2 block cursor-pointer text-[11px] font-extrabold tracking-wide text-arc-purple-600 uppercase"
            >
              Load earlier
            </button>
          ) : null}

          {loading ? (
            <div className="space-y-2" aria-busy>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-10 w-[70%] animate-pulse rounded-[20px] bg-[#efeaff]",
                    i % 2 ? "ml-auto bg-arc-purple-200/60" : "",
                  )}
                />
              ))}
            </div>
          ) : (
            rows.map((row) => {
              if (row.kind === "day") {
                return (
                  <div key={row.key} className="flex justify-center py-2">
                    <span className="text-[12px] font-bold text-[#8a82a8]">
                      {row.label}
                    </span>
                  </div>
                );
              }

              const m = row.msg;
              const mine = m.senderId === myId;
              const preview = m.attachmentId
                ? attachmentPreviews[m.attachmentId]
                : m.clientMsgId
                  ? localPreviews[m.clientMsgId]
                  : null;
              const quote = m.replyTo;

              return (
                <motion.div
                  key={row.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group relative flex max-w-[82%] flex-col",
                    mine ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "relative rounded-[22px] px-3.5 py-2 text-[14px] leading-snug",
                      mine
                        ? "rounded-br-md bg-arc-purple-600 text-white"
                        : "rounded-bl-md bg-[#efeaff] text-[#0f1220]",
                      m.pending && "opacity-70",
                    )}
                  >
                    {quote ? (
                      <div
                        className={cn(
                          "mb-2 rounded-xl border-l-[3px] px-2.5 py-1.5",
                          mine
                            ? "border-[#0f1220]/70 bg-black/5"
                            : "border-arc-purple-500 bg-white/70",
                        )}
                      >
                        <p className="text-[11px] font-extrabold">
                          {quote.senderName}
                        </p>
                        <p className="truncate text-[12px] font-medium opacity-80">
                          {quote.body || "Attachment"}
                        </p>
                      </div>
                    ) : null}

                    {m.deletedAt ? (
                      <span className="italic opacity-60">Message deleted</span>
                    ) : (
                      <>
                        {preview ? (
                          <Image
                            src={preview}
                            alt="Shared image"
                            width={220}
                            height={220}
                            unoptimized
                            className="mb-1.5 max-h-56 w-auto rounded-xl object-cover"
                          />
                        ) : null}
                        {m.body ? (
                          <p className="whitespace-pre-wrap font-medium">
                            {m.body}
                          </p>
                        ) : null}
                        {!m.body && m.type === "image" && !preview ? (
                          <p className="font-semibold opacity-70">Photo</p>
                        ) : null}
                      </>
                    )}
                  </div>

                  {!m.deletedAt ? (
                    <div
                      className={cn(
                        "pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 gap-0.5 rounded-full border border-[#f0ebf8] bg-white/95 p-0.5 opacity-0 shadow-sm transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                        mine ? "right-full mr-1.5" : "left-full ml-1.5",
                      )}
                    >
                      <button
                        type="button"
                        aria-label="Reply"
                        onClick={() => setReplyTo(m)}
                        className="cursor-pointer rounded-full p-1.5 text-[#0f1220]/55 transition-colors hover:bg-[#f4f0ff] hover:text-[#0f1220]"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                      {mine ? (
                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => void deleteOwn(m)}
                          className="cursor-pointer rounded-full p-1.5 text-[#0f1220]/55 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {mine && row.isLastOwn && !m.deletedAt ? (
                    <p className="mt-0.5 px-1 text-[11px] font-bold text-[#8a82a8]">
                      {m.pending
                        ? "Sending"
                        : m.seen
                          ? "Seen"
                          : m.delivered
                            ? "Delivered"
                            : "Sent"}
                    </p>
                  ) : null}
                </motion.div>
              );
            })
          )}

          {typingUser ? (
            <div className="flex justify-start" aria-live="polite">
              <div className="flex items-center gap-1 rounded-[20px] rounded-bl-md bg-[#efeaff] px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8a82a8] [animation-delay:240ms]" />
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 z-20 shrink-0 border-t border-[#f0ebf8] bg-white">
          {replyTo ? (
            <div className="flex items-center gap-2 bg-white px-4 py-2">
              <div className="min-w-0 flex-1 rounded-xl border-l-[3px] border-arc-purple-500 bg-[#f4f0ff] px-3 py-1.5">
                <p className="text-[11px] font-extrabold text-[#0f1220]">
                  {replyTo.senderName}
                </p>
                <p className="truncate text-[12px] font-medium text-[#5c5478]">
                  {replyTo.body || "Attachment"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
                className="cursor-pointer rounded-full p-2 text-[#8a82a8] hover:bg-[#f4f0ff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {stagedFile ? (
            <div className="flex items-center gap-3 border-t border-[#f0ebf8] bg-[#faf8ff] px-4 py-2.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-[#ebe4f6]">
                <Image
                  src={stagedFile.previewUrl}
                  alt="Attachment preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-[#0f1220]">
                  Photo
                </p>
                <p className="truncate text-[11px] font-semibold text-[#8a82a8]">
                  {stagedFile.file.name || "image"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove attachment"
                disabled={sending}
                onClick={clearStagedFile}
                className="cursor-pointer rounded-full p-2 text-[#8a82a8] transition-colors hover:bg-white hover:text-[#0f1220] disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <form
            onSubmit={(e) => void onSend(e)}
            className="bg-white px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"
          >
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Attach"
                disabled={sending}
                onClick={() => fileRef.current?.click()}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f4f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500 disabled:opacity-40"
              >
                <Plus className="h-6 w-6" strokeWidth={2.25} />
              </button>
              <label className="sr-only" htmlFor="chat-composer">
                {stagedFile ? "Caption" : "Message"}
              </label>
              <input
                id="chat-composer"
                value={text}
                onChange={(e) => onType(e.target.value)}
                placeholder={stagedFile ? "Add a caption…" : "Message"}
                className="min-h-12 flex-1 rounded-full bg-[#f4f0ff] px-4 py-3 text-sm font-medium text-[#0f1220] outline-none placeholder:text-[#8a82a8] focus-visible:ring-2 focus-visible:ring-arc-purple-500"
              />
              {text.trim() || stagedFile ? (
                <button
                  type="submit"
                  disabled={sending}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#0f1220] text-white transition-colors hover:bg-[#1a1f35] disabled:opacity-40"
                >
                  <SendHorizontal className="h-4.5 w-4.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Voice messages coming soon"
                  aria-label="Voice message (coming soon)"
                  className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-[#b3a8d6] opacity-60"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
