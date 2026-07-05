"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Button, Link as ArcLink } from "@/components/ui";
import { assets } from "@/lib/assets";
import { dividerGrow, mascotEnter, scaleIn } from "@/lib/motion/onboarding";
import { loginSchema, type LoginFormData } from "@/schemas/login";

export default function LoginScreen() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
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
              Welcome back!
            </h1>
            <p className="mt-1 text-arc-body text-arc-navy-500">
              Glad to see you again
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
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </MotionReveal>
            </div>

            <MotionReveal className="mt-3 flex justify-end">
              <ArcLink
                href="/forgot-password"
                className="text-arc-small font-semibold text-arc-purple-500 underline-offset-2 hover:underline"
              >
                Forgot password?
              </ArcLink>
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
                  Log In
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
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
              >
                Sign up
              </Link>
            </MotionReveal>
          </MotionStagger>
        </MotionStagger>
      </div>
    </OnboardingPage>
  );
}
