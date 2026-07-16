"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useEffect } from "react";
import {
  chatApi,
  type ChatMessageDto,
  type ConversationListItemDto,
} from "@/lib/api/chat";
import { socialApi, type SocialFriendDto } from "@/lib/api/social";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { decryptChatMessage, decryptChatMessages } from "@/lib/chat/e2e";
import { useChatSocket } from "@/hooks/useChatSocket";

export const CHAT_CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const;
export const CHAT_FRIENDS_ONLINE_QUERY_KEY = ["social", "friends", "online"] as const;
export const CHAT_FRIENDS_ALL_QUERY_KEY = ["social", "friends", "all"] as const;

function conversationsKey(accessToken: string | undefined) {
  return [...CHAT_CONVERSATIONS_QUERY_KEY, accessToken ?? "anon"] as const;
}

function patchConversationWithMessage(
  items: ConversationListItemDto[],
  msg: ChatMessageDto,
  myUserId: string | undefined,
): ConversationListItemDto[] {
  const idx = items.findIndex((c) => c.id === msg.conversationId);
  if (idx < 0) return items;
  const cur = items[idx]!;
  const fromMe = !!myUserId && msg.senderId === myUserId;
  const next: ConversationListItemDto = {
    ...cur,
    lastMessage: msg,
    lastMessageFromMe: fromMe,
    lastMessageAt: msg.createdAt,
    unreadCount: fromMe ? cur.unreadCount : cur.unreadCount + 1,
    updatedAt: msg.createdAt,
  };
  const rest = items.filter((_, i) => i !== idx);
  return [next, ...rest];
}

/**
 * Cached inbox — stale-while-revalidate so /chat reopen shows last list instantly.
 */
export function useChatInbox() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const myUserId = session?.user?.id;
  const queryClient = useQueryClient();
  const authed = status === "authenticated" && Boolean(accessToken);

  const conversations = useQuery({
    queryKey: conversationsKey(accessToken),
    enabled: authed,
    queryFn: async () => {
      const res = await chatApi.conversations(undefined, accessToken);
      const items = res.items;
      return Promise.all(
        items.map(async (c) => {
          if (!c.lastMessage) return c;
          try {
            const [last] = await decryptChatMessages(
              [c.lastMessage],
              accessToken,
            );
            return { ...c, lastMessage: last ?? c.lastMessage };
          } catch {
            return c;
          }
        }),
      );
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const onlineFriends = useQuery({
    queryKey: [...CHAT_FRIENDS_ONLINE_QUERY_KEY, accessToken ?? "anon"],
    enabled: authed,
    queryFn: async () => {
      try {
        const res = await socialApi.friends(true, accessToken);
        return res.items ?? ([] as SocialFriendDto[]);
      } catch {
        return [] as SocialFriendDto[];
      }
    },
    staleTime: 20_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
  });

  const allFriends = useQuery({
    queryKey: [...CHAT_FRIENDS_ALL_QUERY_KEY, accessToken ?? "anon"],
    enabled: authed,
    queryFn: async () => {
      try {
        const res = await socialApi.friends(undefined, accessToken);
        return res.items ?? ([] as SocialFriendDto[]);
      } catch {
        return [] as SocialFriendDto[];
      }
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
  });

  const invalidateInbox = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: CHAT_FRIENDS_ONLINE_QUERY_KEY,
    });
  }, [queryClient]);

  const { connected, socketRef } = useChatSocket({
    conversationId: null,
    enabled: authed,
    onMessage: (msg) => {
      void decryptChatMessage(msg, accessToken)
        .then((plain) => {
          queryClient.setQueryData<ConversationListItemDto[]>(
            conversationsKey(accessToken),
            (prev) =>
              prev
                ? patchConversationWithMessage(prev, plain, myUserId)
                : prev,
          );
        })
        .catch(() => {
          queryClient.setQueryData<ConversationListItemDto[]>(
            conversationsKey(accessToken),
            (prev) =>
              prev
                ? patchConversationWithMessage(prev, msg, myUserId)
                : prev,
          );
        });
    },
    onUnreadChanged: () => {
      void queryClient.invalidateQueries({
        queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
      });
    },
  });

  useEffect(() => {
    if (!connected || !accessToken) return;
    void conversations.refetch();
    void onlineFriends.refetch();
  }, [connected, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = conversations.data ?? [];
  const showSkeleton = conversations.isPending && !conversations.data;

  const errorMessage = (() => {
    const err = conversations.error;
    if (!err) return null;
    if (err instanceof ApiError) return messageForCode(err.code, err.message);
    if (err instanceof Error) return err.message;
    return "Could not load chats";
  })();

  return {
    items,
    onlineFriends: onlineFriends.data ?? [],
    allFriends: allFriends.data ?? [],
    showSkeleton,
    isFetching: conversations.isFetching,
    error: errorMessage,
    refetch: invalidateInbox,
    invalidateInbox,
    connected,
    socketRef,
  };
}
