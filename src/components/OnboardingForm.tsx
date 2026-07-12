"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { ArcField } from "@/components/ArcField";
import {
  AuthShell,
  authCtaClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { meApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/schemas/onboarding";
import { useUserStore } from "@/store/useUserStore";

export default function OnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const setCurrentRole = useUserStore((s) => s.setCurrentRole);
  const setTargetRole = useUserStore((s) => s.setTargetRole);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      currentRole: "",
      targetRole: "",
      yearsExperience: 0,
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setFormError(null);
    try {
      const res = await meApi.updateProfile({
        currentRole: data.currentRole,
        targetRole: data.targetRole,
        yearsExperience: data.yearsExperience,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await update({ profile: res.profile });
      setCurrentRole(data.currentRole);
      setTargetRole(data.targetRole);
      router.push("/questionnaire");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(messageForCode(err.code, err.message));
      } else {
        setFormError("Could not save profile");
      }
    }
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
      onBack={() => router.back()}
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
        {formError ? (
          <p className="text-[12px] font-bold text-arc-error">{formError}</p>
        ) : null}
        <motion.div whileTap={{ scale: 0.98 }} className="mt-2">
          <Button
            type="submit"
            variant="primary"
            isDisabled={isSubmitting}
            className={authCtaClassName}
          >
            Continue
          </Button>
        </motion.div>
      </form>
    </AuthShell>
  );
}
