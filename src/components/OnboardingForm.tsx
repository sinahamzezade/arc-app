"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ArcField } from "@/components/ArcField";
import {
  AuthShell,
  authCtaClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/schemas/onboarding";

export default function OnboardingForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      currentRole: "",
      targetRole: "",
      yearsExperience: 0,
    },
  });

  const onSubmit = (data: OnboardingFormData) => {
    console.log(data);
  };

  return (
    <AuthShell
      eyebrow="Profile basics"
      title={
        <>
          Where you are
          <br />
          → where you go
        </>
      }
      subtitle="Quick role snapshot for your plan."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3.5"
      >
        <Controller
          name="currentRole"
          control={control}
          render={({ field }) => (
            <ArcField
              id="currentRole"
              label="Current role"
              error={errors.currentRole?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="targetRole"
          control={control}
          render={({ field }) => (
            <ArcField
              id="targetRole"
              label="Target role"
              error={errors.targetRole?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="yearsExperience"
          control={control}
          render={({ field }) => (
            <ArcField
              id="yearsExperience"
              label="Years of experience"
              type="text"
              inputMode="numeric"
              error={errors.yearsExperience?.message}
              value={String(field.value ?? "")}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? 0 : Number(e.target.value),
                )
              }
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        <motion.div whileTap={{ scale: 0.98 }} className="mt-2">
          <Button type="submit" variant="primary" className={authCtaClassName}>
            Continue
          </Button>
        </motion.div>
      </form>
    </AuthShell>
  );
}
