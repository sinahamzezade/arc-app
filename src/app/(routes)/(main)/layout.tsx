import type { ReactNode } from "react";
import { MainTabShell } from "@/components/MainTabShell";
import { MobileTabBar } from "@/components/MobileTabBar";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <div className="pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
        <MainTabShell>{children}</MainTabShell>
      </div>
      <MobileTabBar />
    </div>
  );
}
