"use client";

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback } from "react";
import {
  chatApi,
  type ChatMessageDto,
  type ConversationListItemDto,
} from "@/lib/api/chat";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { decryptChatMessages } from "@/lib/chat/e2e";
import { CHAT_CONVERSATIONS_QUERY_KEY } from "@/hooks/useChatInbox";

export const CHAT_THREAD_QUERY_KEY = ["chat", "thread"] as const;

export type ChatThreadCache = {
  conv: ConversationListItemDto;
  messages: ChatMessageDto[];
  nextBefore: string | null;
  presenceLabel: string;
  peerLastReadMessageId: string | null;
};

export function chatThreadKey(
  conversationId: string,
  accessToken?: string | null,
) {
  return [
    ...CHAT_THREAD_QUERY_KEY,
    conversationId,
    accessToken ?? "anon",
  ] as const;
}

function mapHistoryItems(items: ChatMessageDto[]): ChatMessageDto[] {
  return items.map((m) => ({
    ...m,
    seen: !!m.seen,
    delivered: true,
  }));
}

function inboxSeed(
  queryClient: QueryClient,
  conversationId: string,
  accessToken?: string | null,
): ChatThreadCache | undefined {
  const lists = queryClient.getQueriesData<ConversationListItemDto[]>({
    queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
  });
  for (const [, items] of lists) {
    const hit = items?.find((c) => c.id === conversationId);
    if (!hit) continue;
    return {
      conv: hit,
      messages: hit.lastMessage
        ? mapHistoryItems([hit.lastMessage])
        : [],
      nextBefore: null,
      presenceLabel:
        hit.peerOnline == null
          ? "…"
          : hit.peerOnline
            ? "Online"
            : "Offline",
      peerLastReadMessageId: hit.peerLastReadMessageId ?? null,
    };
  }
  void accessToken;
  return undefined;
}

/**
 * Cached thread — reopen chat shows last messages instantly, refetch in background.
 */
export function useChatThread(conversationId: string | undefined) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const authed =
    status === "authenticated" &&
    Boolean(accessToken) &&
    Boolean(conversationId);

  const key = conversationId
    ? chatThreadKey(conversationId, accessToken)
    : ([...CHAT_THREAD_QUERY_KEY, "none"] as const);

  const query = useQuery({
    queryKey: key,
    enabled: authed,
    staleTime: 20_000,
    gcTime: 15 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: () =>
      conversationId
        ? inboxSeed(queryClient, conversationId, accessToken)
        : undefined,
    queryFn: async (): Promise<ChatThreadCache> => {
      const id = conversationId!;
      const [c, hist, presence] = await Promise.all([
        chatApi.conversation(id, accessToken),
        chatApi.messages(id, { limit: 50 }, accessToken),
        chatApi.presence(id, accessToken).catch(() => null),
      ]);
      const presenceLabel = presence
        ? presence.label
        : c.peerOnline == null
          ? "…"
          : c.peerOnline
            ? "Online"
            : "Offline";
      const decrypted = await decryptChatMessages(
        mapHistoryItems(hist.items),
        accessToken,
      );
      let conv = c;
      if (c.lastMessage) {
        const [last] = await decryptChatMessages(
          [c.lastMessage],
          accessToken,
        );
        conv = { ...c, lastMessage: last ?? c.lastMessage };
      }
      return {
        conv,
        messages: decrypted,
        nextBefore: hist.nextBefore,
        presenceLabel,
        peerLastReadMessageId: c.peerLastReadMessageId ?? null,
      };
    },
  });

  const patch = useCallback(
    (updater: (prev: ChatThreadCache) => ChatThreadCache) => {
      queryClient.setQueryData<ChatThreadCache>(key, (prev) =>
        prev ? updater(prev) : prev,
      );
    },
    [queryClient, key],
  );

  const setMessages = useCallback(
    (updater: (prev: ChatMessageDto[]) => ChatMessageDto[]) => {
      patch((prev) => ({ ...prev, messages: updater(prev.messages) }));
    },
    [patch],
  );

  const setConv = useCallback(
    (conv: ConversationListItemDto | null) => {
      if (!conv) return;
      patch((prev) => ({ ...prev, conv }));
    },
    [patch],
  );

  const setPresenceLabel = useCallback(
    (presenceLabel: string) => {
      patch((prev) => ({ ...prev, presenceLabel }));
    },
    [patch],
  );

  const setPeerLastReadMessageId = useCallback(
    (peerLastReadMessageId: string | null) => {
      patch((prev) => ({ ...prev, peerLastReadMessageId }));
    },
    [patch],
  );

  const setNextBefore = useCallback(
    (nextBefore: string | null) => {
      patch((prev) => ({ ...prev, nextBefore }));
    },
    [patch],
  );

  const loadOlder = useCallback(async () => {
    if (!accessToken || !conversationId) return;
    const cur = queryClient.getQueryData<ChatThreadCache>(key);
    if (!cur?.nextBefore) return;
    const hist = await chatApi.messages(
      conversationId,
      { before: cur.nextBefore, limit: 50 },
      accessToken,
    );
    const older = await decryptChatMessages(
      mapHistoryItems(hist.items),
      accessToken,
    );
    patch((prev) => {
      const ids = new Set(prev.messages.map((m) => m.id));
      const merged = [
        ...older.filter((m) => !ids.has(m.id)),
        ...prev.messages,
      ];
      return { ...prev, messages: merged, nextBefore: hist.nextBefore };
    });
  }, [accessToken, conversationId, key, patch, queryClient]);

  const errorMessage = (() => {
    const err = query.error;
    if (!err) return null;
    if (err instanceof ApiError) return messageForCode(err.code, err.message);
    if (err instanceof Error) return err.message;
    return "Could not load conversation";
  })();

  return {
    conv: query.data?.conv ?? null,
    messages: query.data?.messages ?? [],
    nextBefore: query.data?.nextBefore ?? null,
    presenceLabel: query.data?.presenceLabel ?? "…",
    peerLastReadMessageId: query.data?.peerLastReadMessageId ?? null,
    showSkeleton: query.isPending && !query.data,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    error: errorMessage,
    setMessages,
    setConv,
    setPresenceLabel,
    setPeerLastReadMessageId,
    setNextBefore,
    loadOlder,
    refetch: query.refetch,
  };
}
