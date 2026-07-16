import { Suspense } from "react";
import QuestionnaireStepScreen from "@/components/questionnaire/QuestionnaireStepScreen";
import { QuestionnaireStepSkeleton } from "@/components/questionnaire/QuestionnaireStepSkeleton";

type PageProps = {
  params: Promise<{ step: string }>;
};

export default async function QuestionnaireStepPage({ params }: PageProps) {
  const { step } = await params;
  const stepNumber = Number.parseInt(step, 10);
  const safeStep = Number.isNaN(stepNumber) ? 1 : stepNumber;

  return (
    <Suspense fallback={<QuestionnaireStepSkeleton />}>
      <QuestionnaireStepScreen stepNumber={safeStep} />
    </Suspense>
  );
}
