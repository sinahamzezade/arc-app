"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { ArcField } from "@/components/ArcField";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import { Button, Checkbox, Link as ArcLink } from "@/components/ui";
import { registerSchema, type RegisterFormData } from "@/schemas/register";

export default function RegisterScreen() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log(data);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <header className="pt-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="-ml-2 inline-flex rounded-full p-2 text-arc-navy-900"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>
      </header>

      <div className="flex-1" />

      <div className="pb-4">
        <div className="text-center">
          <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
            Create your account
          </h1>
          <p className="mt-1 text-arc-body text-arc-navy-500">
            Start your journey with Arc
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col">
          <div className="flex flex-col gap-4">
            <ArcField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <ArcField
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <ArcField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <div className="mt-5">
            <Controller
              name="agreeToTerms"
              control={control}
              render={({ field: { value, onChange, onBlur, name } }) => (
                <Checkbox
                  name={name}
                  isSelected={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={!!errors.agreeToTerms}
                  className="items-start"
                >
                  <Checkbox.Content className="items-start gap-2.5">
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-arc-small leading-snug text-arc-navy-700">
                      I agree to the{" "}
                      <ArcLink
                        href="/terms"
                        className="font-semibold text-arc-purple-500 underline-offset-2 hover:underline"
                      >
                        Terms of Service
                      </ArcLink>{" "}
                      and{" "}
                      <ArcLink
                        href="/privacy"
                        className="font-semibold text-arc-purple-500 underline-offset-2 hover:underline"
                      >
                        Privacy Policy
                      </ArcLink>
                    </span>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
            {errors.agreeToTerms ? (
              <p className="mt-1.5 px-1 text-arc-caption text-arc-error">
                {errors.agreeToTerms.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting}
            className="mt-6 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
          >
            Create Account
          </Button>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-arc-soft" />
            <span className="text-arc-caption font-medium text-arc-lavender-700">
              or continue with
            </span>
            <div className="h-px flex-1 bg-arc-soft" />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
            >
              <AppleIcon />
              Apple
            </button>
            <button
              type="button"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
            >
              <GoogleIcon />
              Google
            </button>
          </div>

          <p className="mt-14 text-center text-arc-small text-arc-navy-700">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
