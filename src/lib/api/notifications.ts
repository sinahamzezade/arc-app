import { apiFetch } from "./client";
import type {
  NotificationDto,
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationUnreadCountResponse,
} from "./types";

export type NotificationListFilter =
  | "all"
  | "unread"
  | "rewards"
  | "social"
  | "learning"
  | "coach"
  | "system";

export const notificationsApi = {
  list(
    params: {
      filter?: NotificationListFilter;
      limit?: number;
      offset?: number;
      cursor?: string | null;
    } = {},
    accessToken?: string | null,
  ) {
    const q = new URLSearchParams();
    if (params.filter) q.set("filter", params.filter);
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.cursor) q.set("cursor", params.cursor);
    else if (params.offset != null) q.set("offset", String(params.offset));
    const qs = q.toString();
    return apiFetch<NotificationListResponse>(
      `/notifications${qs ? `?${qs}` : ""}`,
      { accessToken },
    );
  },

  unreadCount(accessToken?: string | null) {
    return apiFetch<NotificationUnreadCountResponse>(
      "/notifications/unread-count",
      { accessToken },
    );
  },

  markRead(id: string, accessToken?: string | null, unread = false) {
    const qs = unread ? "?unread=true" : "";
    return apiFetch<NotificationDto>(`/notifications/${id}/read${qs}`, {
      method: "PATCH",
      accessToken,
    });
  },

  markAllRead(accessToken?: string | null, category?: string) {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiFetch<{ updated: number }>(`/notifications/read-all${qs}`, {
      method: "POST",
      accessToken,
    });
  },

  hide(id: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/notifications/${id}`, {
      method: "DELETE",
      accessToken,
    });
  },

  getPreferences(accessToken?: string | null) {
    return apiFetch<NotificationPreferencesResponse>(
      "/notifications/preferences",
      { accessToken },
    );
  },

  updatePreferences(
    body: Partial<NotificationPreferencesResponse["preferences"]>,
    accessToken?: string | null,
  ) {
    return apiFetch<NotificationPreferencesResponse>(
      "/notifications/preferences",
      { method: "PATCH", body, accessToken },
    );
  },

  registerDevice(
    body: {
      deviceId: string;
      platform: "web" | "ios" | "android";
      token: string;
      endpoint?: string;
    },
    accessToken?: string | null,
  ) {
    return apiFetch<{
      id: string;
      deviceId: string;
      platform: string;
      lastSeenAt: string | null;
    }>("/notifications/devices", {
      method: "POST",
      body,
      accessToken,
    });
  },

  revokeDevice(id: string, accessToken?: string | null) {
    return apiFetch<{ ok: boolean }>(`/notifications/devices/${id}`, {
      method: "DELETE",
      accessToken,
    });
  },
};
