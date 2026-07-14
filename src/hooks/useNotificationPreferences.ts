"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api/notifications";
import type { NotificationPreferenceToggleId } from "@/lib/api/types";
import { settingsToggleDefs } from "@/lib/settings/toggle-defs";

export function useNotificationPreferences() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", "preferences", accessToken ?? "anon"],
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      const res = await notificationsApi.getPreferences(accessToken);
      return res;
    },
    placeholderData: {
      preferences: Object.fromEntries(
        settingsToggleDefs.map((t) => [t.id, t.on]),
      ) as Record<NotificationPreferenceToggleId, boolean>,
      toggles: settingsToggleDefs,
    },
  });

  const update = useMutation({
    mutationFn: (patch: Partial<Record<NotificationPreferenceToggleId, boolean>>) =>
      notificationsApi.updatePreferences(patch, accessToken),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "preferences"],
      });
      const prev = queryClient.getQueryData<typeof query.data>([
        "notifications",
        "preferences",
        accessToken ?? "anon",
      ]);
      if (prev) {
        queryClient.setQueryData(
          ["notifications", "preferences", accessToken ?? "anon"],
          {
            ...prev,
            preferences: { ...prev.preferences, ...patch },
            toggles: prev.toggles.map((t) =>
              patch[t.id] !== undefined ? { ...t, on: Boolean(patch[t.id]) } : t,
            ),
          },
        );
      }
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(
          ["notifications", "preferences", accessToken ?? "anon"],
          ctx.prev,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });

  return { ...query, update };
}
