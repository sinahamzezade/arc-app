import { Suspense } from "react";
import StudyPathScreen from "@/components/study/StudyPathScreen";

export default function StudyPathPage() {
  return (
    <Suspense fallback={null}>
      <StudyPathScreen />
    </Suspense>
  );
}
