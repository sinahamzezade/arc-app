import { Suspense } from "react";
import FriendsScreen from "@/components/friends/FriendsScreen";

export default function FriendsPage() {
  return (
    <Suspense fallback={null}>
      <FriendsScreen />
    </Suspense>
  );
}
