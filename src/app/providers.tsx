"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { NotificationToastHost } from "@/components/notifications/NotificationToastHost";
import { PresenceHeartbeat } from "@/components/social/PresenceHeartbeat";
import { StudyLivePill } from "@/components/study/StudyLivePill";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <PresenceHeartbeat />
        <NotificationToastHost />
        <StudyLivePill />
      </AuthProvider>
    </QueryProvider>
  );
}
