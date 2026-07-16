import { Suspense } from "react";
import NotificationsScreen from "@/components/NotificationsScreen";
import { NotificationsSkeleton } from "@/components/notifications/NotificationsSkeleton";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsScreen />
    </Suspense>
  );
}
