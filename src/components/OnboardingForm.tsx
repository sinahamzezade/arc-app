"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { MotionReveal, MotionStagger, OnboardingPage } from "@/components/motion";
import { Button, TextField, Label, Input, FieldError } from "@/components/ui";
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
    <OnboardingPage className="mx-auto w-full max-w-md px-5 pt-safe-top pb-safe-bottom">
      <MotionStagger
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <Controller
          name="currentRole"
          control={control}
          render={({ field }) => (
            <MotionReveal>
              <TextField isInvalid={!!errors.currentRole}>
                <Label>Current Role</Label>
                <Input {...field} />
                <FieldError>{errors.currentRole?.message}</FieldError>
              </TextField>
            </MotionReveal>
          )}
        />
        <Controller
          name="targetRole"
          control={control}
          render={({ field }) => (
            <MotionReveal>
              <TextField isInvalid={!!errors.targetRole}>
                <Label>Target Role</Label>
                <Input {...field} />
                <FieldError>{errors.targetRole?.message}</FieldError>
              </TextField>
            </MotionReveal>
          )}
        />
        <Controller
          name="yearsExperience"
          control={control}
          render={({ field }) => (
            <MotionReveal>
              <TextField isInvalid={!!errors.yearsExperience}>
                <Label>Years of Experience</Label>
                <Input {...field} type="number" />
                <FieldError>{errors.yearsExperience?.message}</FieldError>
              </TextField>
            </MotionReveal>
          )}
        />
        <MotionReveal>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" variant="primary">
              Continue
            </Button>
          </motion.div>
        </MotionReveal>
      </MotionStagger>
    </OnboardingPage>
  );
}
