import { Suspense } from "react";
import FollowersScreen from "@/components/profile/FollowersScreen";

export default function ProfileFollowersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-[#f3effc] font-rounded">
          <p className="text-[13px] font-bold text-[#8a7cb8]">Loading…</p>
        </div>
      }
    >
      <FollowersScreen />
    </Suspense>
  );
}
