"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 max-w-md"
    >
      <Controller
        name="currentRole"
        control={control}
        render={({ field }) => (
          <TextField isInvalid={!!errors.currentRole}>
            <Label>Current Role</Label>
            <Input {...field} />
            <FieldError>{errors.currentRole?.message}</FieldError>
          </TextField>
        )}
      />
      <Controller
        name="targetRole"
        control={control}
        render={({ field }) => (
          <TextField isInvalid={!!errors.targetRole}>
            <Label>Target Role</Label>
            <Input {...field} />
            <FieldError>{errors.targetRole?.message}</FieldError>
          </TextField>
        )}
      />
      <Controller
        name="yearsExperience"
        control={control}
        render={({ field }) => (
          <TextField isInvalid={!!errors.yearsExperience}>
            <Label>Years of Experience</Label>
            <Input {...field} type="number" />
            <FieldError>{errors.yearsExperience?.message}</FieldError>
          </TextField>
        )}
      />
      <Button type="submit" variant="primary">
        Continue
      </Button>
    </form>
  );
}
