import { apiFetch, apiFetchBlob, apiFetchFormData } from "./client";

export type ChatMessageType = "text" | "image" | "file" | "audio" | "system";
export type ConversationType = "direct" | "group";

export type ChatReplyPreview = {
  id: string;
  senderId: string;
  senderName: string;
  body: string | null;
  e2e?: boolean;
};

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  clientMsgId: string;
  type: ChatMessageType;
  body: string | null;
  e2e?: boolean;
  attachmentId: string | null;
  attachmentUrl: string | null;
  attachmentMime: string | null;
  replyToId: string | null;
  replyTo?: ChatReplyPreview | null;
  durationMs?: number | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  seen?: boolean;
  pending?: boolean;
  delivered?: boolean;
};

export type ConversationListItemDto = {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  peerUserId: string | null;
  peerOnline?: boolean | null;
  lastMessage: ChatMessageDto | null;
  lastMessageFromMe?: boolean;
  unreadCount: number;
  muted: boolean;
  lastMessageAt: string | null;
  updatedAt: string;
  peerLastReadMessageId?: string | null;
  memberCount?: number;
  /** DM: you blocked this peer. */
  peerBlockedByMe?: boolean;
};

export type ChatSummaryDto = {
  unreadTotal: number;
  conversationsWithUnread: number;
};

export type ConversationPresenceDto = {
  conversationId: string;
  online: boolean;
  label: string;
  members: Array<{
    userId: string;
    online: boolean;
    displayName: string;
  }>;
};

export const chatApi = {
  summary(accessToken?: string | null) {
    return apiFetch<ChatSummaryDto>("/chat/summary", { accessToken });
  },

  conversations(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{
      items: ConversationListItemDto[];
      nextCursor: string | null;
    }>(`/chat/conversations${q}`, { accessToken });
  },

  conversation(id: string, accessToken?: string | null) {
    return apiFetch<ConversationListItemDto>(`/chat/conversations/${id}`, {
      accessToken,
    });
  },

  presence(id: string, accessToken?: string | null) {
    return apiFetch<ConversationPresenceDto>(
      `/chat/conversations/${id}/presence`,
      { accessToken },
    );
  },

  createDirect(peerUserId: string, accessToken?: string | null) {
    return apiFetch<ConversationListItemDto>("/chat/conversations", {
      method: "POST",
      body: { type: "direct", peerUserId },
      accessToken,
    });
  },

  createGroup(
    title: string,
    memberIds: string[],
    accessToken?: string | null,
  ) {
    return apiFetch<ConversationListItemDto>("/chat/conversations", {
      method: "POST",
      body: { type: "group", title, memberIds },
      accessToken,
    });
  },

  messages(
    id: string,
    opts?: { before?: string; after?: string; limit?: number },
    accessToken?: string | null,
  ) {
    const params = new URLSearchParams();
    if (opts?.before) params.set("before", opts.before);
    if (opts?.after) params.set("after", opts.after);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const q = params.toString() ? `?${params}` : "";
    return apiFetch<{
      items: ChatMessageDto[];
      nextBefore: string | null;
      nextAfter: string | null;
    }>(`/chat/conversations/${id}/messages${q}`, { accessToken });
  },

  sendMessage(
    id: string,
    body: {
      clientMsgId: string;
      type: ChatMessageType;
      body?: string;
      attachmentId?: string;
      replyToId?: string;
      durationMs?: number;
    },
    accessToken?: string | null,
  ) {
    return apiFetch<ChatMessageDto>(`/chat/conversations/${id}/messages`, {
      method: "POST",
      body,
      accessToken,
    });
  },

  markRead(
    id: string,
    lastReadMessageId: string,
    accessToken?: string | null,
  ) {
    return apiFetch<{
      conversationId: string;
      userId: string;
      lastReadMessageId: string;
    }>(`/chat/conversations/${id}/read`, {
      method: "POST",
      body: { lastReadMessageId },
      accessToken,
    });
  },

  editMessage(id: string, body: string, accessToken?: string | null) {
    return apiFetch<ChatMessageDto>(`/chat/messages/${id}`, {
      method: "PATCH",
      body: { body },
      accessToken,
    });
  },

  deleteMessage(id: string, accessToken?: string | null) {
    return apiFetch<ChatMessageDto>(`/chat/messages/${id}`, {
      method: "DELETE",
      accessToken,
    });
  },

  uploadAttachment(
    conversationId: string,
    file: Blob,
    filename: string,
    accessToken?: string | null,
  ) {
    const form = new FormData();
    form.append("file", file, filename);
    return apiFetchFormData<{
      id: string;
      mimeType: string;
      sizeBytes: number;
      scanStatus: string;
      url: string;
    }>(`/chat/conversations/${conversationId}/attachments`, form, accessToken);
  },

  async fetchAttachmentBlob(
    attachmentId: string,
    accessToken?: string | null,
  ): Promise<Blob> {
    return apiFetchBlob(`/chat/attachments/${attachmentId}`, accessToken);
  },

  block(userId: string, accessToken?: string | null) {
    return apiFetch("/chat/blocks", {
      method: "POST",
      body: { userId },
      accessToken,
    });
  },

  unblock(userId: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/chat/blocks/${userId}`, {
      method: "DELETE",
      accessToken,
    });
  },

  report(
    body: {
      reportedUserId: string;
      messageId?: string;
      reason: string;
      detail?: string;
    },
    accessToken?: string | null,
  ) {
    return apiFetch("/chat/reports", {
      method: "POST",
      body,
      accessToken,
    });
  },

  putMyPublicKey(publicKey: string, accessToken?: string | null) {
    return apiFetch<{ userId: string; publicKey: string; updatedAt: string }>(
      "/chat/keys/me",
      {
        method: "PUT",
        body: { publicKey },
        accessToken,
      },
    );
  },

  getPublicKeys(userIds: string[], accessToken?: string | null) {
    const q = encodeURIComponent(userIds.join(","));
    return apiFetch<{ keys: Array<{ userId: string; publicKey: string }> }>(
      `/chat/keys?userIds=${q}`,
      { accessToken },
    );
  },

  getKeyWraps(conversationId: string, accessToken?: string | null) {
    return apiFetch<{
      conversationId: string;
      memberIds: string[];
      epoch: number | null;
      wrappedKey: string | null;
      hasWraps?: boolean;
    }>(`/chat/conversations/${conversationId}/key-wraps`, { accessToken });
  },

  putKeyWraps(
    conversationId: string,
    body: {
      epoch: number;
      wraps: Array<{ userId: string; wrappedKey: string }>;
    },
    accessToken?: string | null,
  ) {
    return apiFetch<{
      conversationId: string;
      epoch: number;
      count: number;
    }>(`/chat/conversations/${conversationId}/key-wraps`, {
      method: "PUT",
      body,
      accessToken,
    });
  },

  resetKeyWraps(conversationId: string, accessToken?: string | null) {
    return apiFetch<{ conversationId: string; reset: boolean }>(
      `/chat/conversations/${conversationId}/key-wraps`,
      {
        method: "DELETE",
        accessToken,
      },
    );
  },

  addMembers(
    conversationId: string,
    userIds: string[],
    accessToken?: string | null,
  ) {
    return apiFetch<{ ok: boolean }>(
      `/chat/conversations/${conversationId}/members`,
      {
        method: "POST",
        body: { userIds },
        accessToken,
      },
    );
  },

  /** Add group members then seal conversation key for newcomers. */
  async addMembersSecure(
    conversationId: string,
    userIds: string[],
    accessToken?: string | null,
  ) {
    const res = await chatApi.addMembers(
      conversationId,
      userIds,
      accessToken,
    );
    const { rewrapConversationKeys } = await import("@/lib/chat/e2e");
    await rewrapConversationKeys(conversationId, accessToken);
    return res;
  },
};
