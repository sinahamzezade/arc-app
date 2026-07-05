import { redirect } from "next/navigation";
import QuestionnaireStepScreen from "@/components/questionnaire/QuestionnaireStepScreen";

type PageProps = {
  params: Promise<{ step: string }>;
};

export default async function QuestionnaireStepPage({ params }: PageProps) {
  const { step } = await params;
  const stepNumber = Number.parseInt(step, 10);

  if (Number.isNaN(stepNumber) || stepNumber < 1 || stepNumber > 10) {
    redirect("/questionnaire");
  }

  return <QuestionnaireStepScreen stepNumber={stepNumber} />;
}
