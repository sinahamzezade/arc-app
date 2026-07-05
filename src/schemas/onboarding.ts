import { z } from "zod";

export const onboardingSchema = z.object({
  currentRole: z.string().min(2, "Required"),
  targetRole: z.string().min(2, "Required"),
  yearsExperience: z.coerce.number().min(0),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
