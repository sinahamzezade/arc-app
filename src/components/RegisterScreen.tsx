"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArcField } from "@/components/ArcField";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import {
  MotionBackButton,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { Button, Checkbox, Link as ArcLink } from "@/components/ui";
import { assets } from "@/lib/assets";
import { dividerGrow, mascotEnter, scaleIn } from "@/lib/motion/onboarding";
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

  const onSubmit = () => {
    router.push("/questionnaire");
  };

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton className="pt-4" onClick={() => router.back()} />

      <div className="flex flex-1 flex-col pb-4">
        <MotionStagger className="w-full">
          <MotionReveal
            custom={mascotEnter}
            className="relative mx-auto mt-2 h-56 w-full max-w-[280px] shrink-0"
          >
            <Image
              src={assets.arlo.waveHand}
              alt="Arlo waving hello"
              fill
              priority
              className="object-contain"
              sizes="320px"
            />
          </MotionReveal>

          <MotionReveal className="mt-4 text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Create your account
            </h1>
            <p className="mt-1 text-arc-body text-arc-navy-500">
              Start your journey with Arc
            </p>
          </MotionReveal>

          <MotionStagger
            as="form"
            className="mt-6 flex flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-4">
              <MotionReveal>
                <ArcField
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </MotionReveal>
              <MotionReveal>
                <ArcField
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </MotionReveal>
              <MotionReveal>
                <ArcField
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </MotionReveal>
            </div>

            <MotionReveal className="mt-5">
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
                      <Checkbox.Control className="size-4.5">
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
                <motion.p
                  className="mt-1.5 px-1 text-arc-caption text-arc-error"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {errors.agreeToTerms.message}
                </motion.p>
              ) : null}
            </MotionReveal>

            <MotionReveal>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  isDisabled={isSubmitting}
                  className="mt-6 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
                >
                  Create Account
                </Button>
              </motion.div>
            </MotionReveal>

            <MotionReveal className="mt-8 flex items-center gap-3">
              <motion.div
                className="h-px flex-1 origin-left bg-arc-soft"
                variants={dividerGrow}
              />
              <span className="text-arc-caption font-medium text-arc-lavender-700">
                or continue with
              </span>
              <motion.div
                className="h-px flex-1 origin-right bg-arc-soft"
                variants={dividerGrow}
              />
            </MotionReveal>

            <MotionStagger fast className="mt-5 flex gap-3">
              <motion.button
                type="button"
                variants={scaleIn}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
              >
                <AppleIcon />
                Apple
              </motion.button>
              <motion.button
                type="button"
                variants={scaleIn}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
              >
                <GoogleIcon />
                Google
              </motion.button>
            </MotionStagger>

            <MotionReveal
              as="p"
              className="mt-14 text-center text-arc-small text-arc-navy-700"
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
              >
                Log in
              </Link>
            </MotionReveal>
          </MotionStagger>
        </MotionStagger>
      </div>
    </OnboardingPage>
  );
}
