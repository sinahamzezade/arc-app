import { Suspense } from "react";
import StudyInviteScreen from "@/components/study/StudyInviteScreen";

export default function StudyInvitePage() {
  return (
    <Suspense fallback={null}>
      <StudyInviteScreen />
    </Suspense>
  );
}
