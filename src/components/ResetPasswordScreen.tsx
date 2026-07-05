"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
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
import { checkPop } from "@/lib/motion/onboarding";
import {
  passwordRequirements,
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/schemas/reset-password";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = (data: ResetPasswordFormData) => {
    console.log(data);
    router.push("/login");
  };

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <MotionBackButton className="pt-4" onClick={() => router.back()} />

      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        <MotionHero className="relative h-80 w-full max-w-full">
          <Image
            src={assets.arlo.thumbsUp}
            alt="Arlo giving a thumbs up"
            fill
            priority
            className="object-contain"
            sizes="320px"
          />
        </MotionHero>

        <MotionStagger className="mt-4 w-full">
          <MotionReveal className="text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Create new password
            </h1>
            <p className="mt-2 px-2 text-arc-body text-arc-navy-500">
              Make sure it&apos;s strong and secure.
            </p>
          </MotionReveal>

          <MotionStagger
            as="form"
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <MotionReveal>
              <ArcField
                id="password"
                label="New Password"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
            </MotionReveal>
            <MotionReveal>
              <ArcField
                id="confirmPassword"
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </MotionReveal>

            <MotionReveal as="ul" className="space-y-2">
              {passwordRequirements.map(({ label, test }) => {
                const met = test(password);

                return (
                  <motion.li
                    key={label}
                    className="flex items-center gap-2 text-arc-small text-arc-navy-900"
                    animate={{ x: met ? 0 : 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <span
                      className={
                        met
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-arc-success"
                          : "flex h-5 w-5 items-center justify-center rounded-full border border-arc-soft bg-white"
                      }
                    >
                      <AnimatePresence mode="wait">
                        {met ? (
                          <motion.span
                            key="check"
                            variants={checkPop}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </span>
                    <motion.span
                      animate={{
                        color: met ? "var(--color-arc-navy-900)" : "var(--color-arc-navy-700)",
                      }}
                    >
                      {label}
                    </motion.span>
                  </motion.li>
                );
              })}
            </MotionReveal>

            <MotionReveal>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  isDisabled={isSubmitting}
                  className="mt-2 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
                >
                  Reset Password
                </Button>
              </motion.div>
            </MotionReveal>
          </MotionStagger>
        </MotionStagger>
      </div>
    </OnboardingPage>
  );
}
