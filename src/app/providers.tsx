"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { StudyLivePill } from "@/components/study/StudyLivePill";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <StudyLivePill />
      </AuthProvider>
    </QueryProvider>
  );
}
