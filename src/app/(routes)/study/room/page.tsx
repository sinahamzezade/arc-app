import { Suspense } from "react";
import StudyRoomScreen from "@/components/study/StudyRoomScreen";

export default function StudyRoomPage() {
  return (
    <Suspense fallback={null}>
      <StudyRoomScreen />
    </Suspense>
  );
}
