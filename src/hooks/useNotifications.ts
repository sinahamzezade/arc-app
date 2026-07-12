"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  notificationsApi,
  type NotificationListFilter,
} from "@/lib/api/notifications";
import {
  groupNotificationsByDay,
  mapNotificationDto,
} from "@/lib/notifications/map-notification";

export function useNotifications(filter: NotificationListFilter = "all") {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications", "list", filter, accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await notificationsApi.list(
        { filter, limit: 100 },
        accessToken,
      );
      const items = res.items.map(mapNotificationDto);
      return {
        items,
        sections: groupNotificationsByDay(items),
        unreadCount: res.unreadCount,
        total: res.total,
      };
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id, accessToken),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken),
    onSuccess: invalidate,
  });

  const hide = useMutation({
    mutationFn: (id: string) => notificationsApi.hide(id, accessToken),
    onSuccess: invalidate,
  });

  return {
    ...listQuery,
    markRead,
    markAllRead,
    hide,
  };
}
