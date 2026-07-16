import { Suspense } from "react";
import QuestionnaireIntroScreen from "@/components/questionnaire/QuestionnaireIntroScreen";
import { QuestionnaireStepSkeleton } from "@/components/questionnaire/QuestionnaireStepSkeleton";

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<QuestionnaireStepSkeleton />}>
      <QuestionnaireIntroScreen />
    </Suspense>
  );
}
