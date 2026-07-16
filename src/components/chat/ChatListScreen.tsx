"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  CheckCheck,
  Home,
  MoreHorizontal,
  Plus,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSession } from "next-auth/react";
import { CallScreen } from "@/components/chat/CallScreen";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { chatApi, type ConversationListItemDto } from "@/lib/api/chat";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { useCallSession } from "@/hooks/useCallSession";
import { useChatInbox } from "@/hooks/useChatInbox";
import { cn } from "@/lib/utils";

function initialFrom(title: string) {
  return (title.trim()[0] || "?").toUpperCase();
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function previewText(c: ConversationListItemDto) {
  const m = c.lastMessage;
  if (!m) return "Start chatting";
  if (m.deletedAt) return "Message deleted";
  const body =
    m.type === "image"
      ? "Photo"
      : m.type === "audio"
        ? "Voice message"
        : m.type === "file"
          ? "File"
          : m.type === "system"
            ? m.body?.trim() || "Call"
            : m.body?.trim() || "No messages yet";
  if (c.type === "group" && m.senderName && !c.lastMessageFromMe) {
    return `${m.senderName} : ${body}`;
  }
  return body;
}

type ComposeMode = "dm" | "group";

/**
 * Inbox — Mengobrol layout, Arc colors (gold / navy / lavender).
 */
export default function ChatListScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();

  const {
    items,
    onlineFriends,
    allFriends,
    showSkeleton,
    error: inboxError,
    invalidateInbox,
    connected,
    socketRef,
  } = useChatInbox();

  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? inboxError;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("dm");
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const call = useCallSession({
    socketRef,
    connected,
    myUserId: session?.user?.id ?? null,
  });

  const filtered = items.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.lastMessage?.body ?? "").toLowerCase().includes(q)
    );
  });

  const filteredFriends = allFriends.filter((f) => {
    if (!friendQuery.trim()) return true;
    const q = friendQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.username ?? "").toLowerCase().includes(q)
    );
  });

  function openCompose(mode: ComposeMode = "dm") {
    setComposeMode(mode);
    setSelectedIds([]);
    setGroupTitle("");
    setFriendQuery("");
    setLocalError(null);
    setComposing(true);
  }

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function startDm(peerUserId: string) {
    if (!session?.accessToken || creating) return;
    setCreating(true);
    setLocalError(null);
    try {
      const conv = await chatApi.createDirect(peerUserId, session.accessToken);
      invalidateInbox();
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      setLocalError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not start chat",
      );
      setCreating(false);
    }
  }

  async function createGroup() {
    if (
      !session?.accessToken ||
      creating ||
      selectedIds.length < 1 ||
      !groupTitle.trim()
    ) {
      return;
    }
    setCreating(true);
    setLocalError(null);
    try {
      const conv = await chatApi.createGroup(
        groupTitle.trim(),
        selectedIds,
        session.accessToken,
      );
      invalidateInbox();
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      setLocalError(
        err instanceof ApiError
          ? messageForCode(err.code, err.message)
          : "Could not create group",
      );
      setCreating(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-white font-rounded text-[#0f1220]">
      <header className="sticky top-0 z-20 bg-white/95 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-[28px] font-extrabold tracking-tight text-[#0f1220]">
            Messages
          </h1>
          <button
            type="button"
            aria-label={searchOpen ? "Close search" : "Search chats"}
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f2eefb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          >
            {searchOpen ? (
              <X className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <Search className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
        {searchOpen ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="mt-3 w-full rounded-2xl bg-[#f4f0ff] px-4 py-2.5 text-sm font-medium outline-none placeholder:text-[#8a82a8] focus-visible:ring-2 focus-visible:ring-arc-purple-500"
          />
        ) : null}
      </header>

      <main className="flex-1 px-5 pb-36">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        ) : null}

        {/* Active / online strip */}
        <section aria-label="Active friends" className="mb-5">
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => openCompose("group")}
              className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#cfc3ec] bg-[#f8f6fc] text-arc-purple-500 transition-colors hover:border-arc-purple-400">
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <span className="w-full truncate text-center text-[11px] font-bold text-[#5c5478]">
                New group
              </span>
            </button>
            {onlineFriends.map((f) => (
              <button
                key={f.userId}
                type="button"
                onClick={() => void startDm(f.userId)}
                className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
              >
                <span className="relative">
                  <UserAvatar
                    initial={f.initial}
                    color={f.color}
                    avatarUrl={f.avatarUrl}
                    className="h-16 w-16 rounded-full ring-2 ring-[#ffc928]/80"
                  />
                  <span
                    aria-label="Online"
                    className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"
                  />
                </span>
                <span className="w-full truncate text-center text-[11px] font-bold text-[#0f1220]">
                  {f.name.split(" ")[0]}
                </span>
              </button>
            ))}
            {!showSkeleton && onlineFriends.length === 0 ? (
              <p className="flex items-center self-center text-xs font-medium text-[#8a82a8]">
                No friends online
              </p>
            ) : null}
          </div>
        </section>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0f1220]">Chats</h2>
          <button
            type="button"
            aria-label="Chat options"
            onClick={() => openCompose("dm")}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#0f1220] hover:bg-[#f2eefb]"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {showSkeleton ? (
          <div className="space-y-4" aria-busy>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-14 w-14 animate-pulse rounded-full bg-[#f2eefb]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-[#f2eefb]" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#f7f5ff]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-[#cfc3ec]" />
            <p className="mt-3 text-base font-extrabold text-[#0f1220]">
              No chats yet
            </p>
            <p className="mt-1 text-sm font-medium text-[#5c5478]">
              Start a DM or create a group with your crew.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f0ebf8]">
            {filtered.map((c) => {
              const unread = c.unreadCount > 0;
              const fromMe = !!c.lastMessageFromMe;
              const seen = !!c.lastMessage?.seen;
              return (
                <motion.li
                  key={c.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link
                    href={`/chat/${c.id}`}
                    className="flex cursor-pointer items-center gap-3 py-3.5 transition-colors hover:bg-[#fcfbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-arc-purple-500"
                  >
                    <div className="relative shrink-0">
                      <UserAvatar
                        initial={initialFrom(c.title)}
                        avatarUrl={c.avatarUrl}
                        className="h-14 w-14 rounded-full"
                      />
                      {c.type === "direct" && c.peerOnline ? (
                        <span
                          aria-label="Online"
                          className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-[15px] tracking-tight text-[#0f1220]",
                            unread ? "font-extrabold" : "font-bold",
                          )}
                        >
                          {c.title}
                        </p>
                        <span className="shrink-0 text-[11px] font-semibold text-[#8a82a8]">
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {fromMe && c.lastMessage && !c.lastMessage.deletedAt ? (
                          seen ? (
                            <CheckCheck
                              className="h-3.5 w-3.5 shrink-0 text-[#ffc928]"
                              strokeWidth={2.75}
                              aria-label="Seen"
                            />
                          ) : (
                            <CheckCheck
                              className="h-3.5 w-3.5 shrink-0 text-[#b3a8d6]"
                              strokeWidth={2.5}
                              aria-label="Sent"
                            />
                          )
                        ) : null}
                        <p
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13px]",
                            unread
                              ? "font-semibold text-[#3d3560]"
                              : "font-medium text-[#8a82a8]",
                          )}
                        >
                          {previewText(c)}
                        </p>
                        {unread ? (
                          <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#ffc928] px-1.5 text-[10px] font-extrabold text-[#0f1220]">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Bottom bar — Home | New Chat | Profile */}
      <nav
        aria-label="Chat actions"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-[#f0ebf8] bg-white/95 px-5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/home"
            aria-label="Home"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f2eefb]"
          >
            <Home className="h-5 w-5" strokeWidth={2.25} />
          </Link>
          <button
            type="button"
            onClick={() => openCompose("dm")}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[#0f1220] px-7 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(15,18,32,0.25)] transition-colors hover:bg-[#1a1f35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
            New Chat
          </button>
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[#0f1220] transition-colors hover:bg-[#f2eefb]"
          >
            <User className="h-5 w-5" strokeWidth={2.25} />
          </Link>
        </div>
      </nav>

      {composing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1220]/45 p-3 backdrop-blur-[2px]"
          role="dialog"
          aria-modal
          aria-label="New chat"
          onClick={() => setComposing(false)}
        >
          <motion.div
            initial={reduceMotion ? false : { y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="max-h-[78dvh] w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f0ebf8] px-4 py-3.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setComposeMode("dm")}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors",
                    composeMode === "dm"
                      ? "bg-[#0f1220] text-white"
                      : "bg-[#f4f0ff] text-[#5c5478]",
                  )}
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={() => setComposeMode("group")}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors",
                    composeMode === "group"
                      ? "bg-[#0f1220] text-white"
                      : "bg-[#f4f0ff] text-[#5c5478]",
                  )}
                >
                  Group
                </button>
              </div>
              <button
                type="button"
                className="cursor-pointer text-sm font-bold text-[#5c5478]"
                onClick={() => setComposing(false)}
              >
                Close
              </button>
            </div>

            {composeMode === "group" ? (
              <div className="border-b border-[#f0ebf8] px-4 py-3">
                <label className="sr-only" htmlFor="group-title">
                  Group name
                </label>
                <input
                  id="group-title"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Group name"
                  className="w-full rounded-2xl bg-[#f4f0ff] px-3 py-2.5 text-sm font-semibold outline-none placeholder:text-[#8a82a8] focus-visible:ring-2 focus-visible:ring-arc-purple-500"
                />
                <p className="mt-1.5 text-[11px] font-semibold text-[#8a82a8]">
                  {selectedIds.length} member
                  {selectedIds.length === 1 ? "" : "s"} selected
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-2 border-b border-[#f0ebf8] px-4 py-2.5">
              <Search className="h-4 w-4 text-[#8a82a8]" />
              <input
                value={friendQuery}
                onChange={(e) => setFriendQuery(e.target.value)}
                placeholder="Search friends"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[#8a82a8]"
              />
            </div>

            <ul className="max-h-[42dvh] overflow-y-auto p-2">
              {filteredFriends.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-[#5c5478]">
                  No friends found
                </li>
              ) : (
                filteredFriends.map((f) => {
                  const selected = selectedIds.includes(f.userId);
                  return (
                    <li key={f.userId}>
                      <button
                        type="button"
                        disabled={creating}
                        onClick={() =>
                          composeMode === "dm"
                            ? void startDm(f.userId)
                            : toggleMember(f.userId)
                        }
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[#f4f0ff] disabled:opacity-50",
                          selected && "bg-[#f4f0ff]",
                        )}
                      >
                        <span className="relative">
                          <UserAvatar
                            initial={f.initial}
                            color={f.color}
                            avatarUrl={f.avatarUrl}
                            className="h-11 w-11 rounded-full"
                          />
                          {f.online ? (
                            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-[#0f1220]">
                          {f.name}
                        </span>
                        {composeMode === "group" ? (
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2",
                              selected
                                ? "border-[#ffc928] bg-[#ffc928] text-[#0f1220]"
                                : "border-[#cfc3ec]",
                            )}
                          >
                            {selected ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : null}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {composeMode === "group" ? (
              <div className="border-t border-[#f0ebf8] p-3">
                <button
                  type="button"
                  disabled={
                    creating || selectedIds.length < 1 || !groupTitle.trim()
                  }
                  onClick={() => void createGroup()}
                  className="w-full cursor-pointer rounded-full bg-[#0f1220] py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#1a1f35] disabled:opacity-40"
                >
                  Create group
                </button>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}

      <CallScreen
        call={call}
        peerName={
          items.find((c) => c.id === call.incoming?.conversationId)?.title ??
          items.find((c) => c.id === call.conversationId)?.title ??
          "Contact"
        }
      />
    </div>
  );
}
