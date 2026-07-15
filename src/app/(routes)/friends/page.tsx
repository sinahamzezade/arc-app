import { Suspense } from "react";
import FriendsScreen from "@/components/friends/FriendsScreen";
import { FriendsSkeleton } from "@/components/friends/FriendsSkeleton";

export default function FriendsPage() {
  return (
    <Suspense fallback={<FriendsSkeleton />}>
      <FriendsScreen />
    </Suspense>
  );
}
