"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArcField } from "@/components/ArcField";
import {
  MotionBackButton,
  MotionHero,
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { Button } from "@/components/ui";
import { assets } from "@/lib/assets";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/forgot-password";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    router.push(
      `/forgot-password/check-email?email=${encodeURIComponent(data.email)}`,
    );
  };

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton className="pt-4" onClick={() => router.back()} />

      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        <MotionHero className="relative h-80 w-full max-w-full">
          <Image
            src={assets.arlo.envelope}
            alt="Arlo holding a password reset envelope"
            fill
            priority
            className="object-contain"
            sizes="320px"
          />
        </MotionHero>

        <MotionStagger className="mt-4 w-full">
          <MotionReveal className="text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Reset your password
            </h1>
            <p className="mt-2 px-2 text-arc-body text-arc-navy-500">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
          </MotionReveal>

          <MotionStagger
            as="form"
            className="mt-6 flex flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
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
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  isDisabled={isSubmitting}
                  className="mt-6 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
                >
                  Send Reset Link
                </Button>
              </motion.div>
            </MotionReveal>
          </MotionStagger>

          <MotionReveal as="p" className="mt-8 text-center text-arc-small text-arc-navy-700">
            <Link
              href="/login"
              className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
            >
              Back to log in
            </Link>
          </MotionReveal>
        </MotionStagger>
      </div>
    </OnboardingPage>
  );
}
