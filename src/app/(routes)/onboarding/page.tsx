import { redirect } from "next/navigation";

/** Legacy /onboarding (profile basics) removed — send to questionnaire. */
export default function OnboardingPage() {
  redirect("/questionnaire");
}
