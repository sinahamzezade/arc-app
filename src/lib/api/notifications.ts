import { apiFetch } from "./client";
import type {
  NotificationDto,
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationUnreadCountResponse,
} from "./types";

export type NotificationListFilter = "all" | "unread" | "rewards" | "social";

export const notificationsApi = {
  list(
    params: {
      filter?: NotificationListFilter;
      limit?: number;
      offset?: number;
    } = {},
    accessToken?: string | null,
  ) {
    const q = new URLSearchParams();
    if (params.filter) q.set("filter", params.filter);
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.offset != null) q.set("offset", String(params.offset));
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

  markRead(id: string, accessToken?: string | null) {
    return apiFetch<NotificationDto>(`/notifications/${id}/read`, {
      method: "PATCH",
      accessToken,
    });
  },

  markAllRead(accessToken?: string | null) {
    return apiFetch<{ updated: number }>("/notifications/read-all", {
      method: "POST",
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
};
