"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppPulseHost } from "@/components/AppPulseHost";
import { CallHost } from "@/components/CallHost";
import { ChatRealtimeHost } from "@/components/ChatRealtimeHost";
import { NotificationToastHost } from "@/components/notifications/NotificationToastHost";
import { StudyLivePill } from "@/components/study/StudyLivePill";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CallHost>
          {children}
          <ChatRealtimeHost />
          <AppPulseHost />
          <NotificationToastHost />
          <StudyLivePill />
        </CallHost>
      </AuthProvider>
    </QueryProvider>
  );
}
