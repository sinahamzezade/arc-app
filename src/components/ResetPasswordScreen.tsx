"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { ArcField } from "@/components/ArcField";
import {
  AuthShell,
  authCtaClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { assets } from "@/lib/assets";
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
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = (data: ResetPasswordFormData) => {
    console.log(data);
    router.push("/login");
  };

  return (
    <AuthShell
      compact
      eyebrow="New lock"
      title={
        <>
          Create a strong
          <br />
          password
        </>
      }
      subtitle="Make it hard to guess, easy to remember."
      onBack={() => router.back()}
      heroMedia={
        <Image
          src={assets.arlo.thumbsUp}
          alt="Arlo giving a thumbs up"
          fill
          priority
          className="object-contain"
          sizes="88px"
        />
      }
    >
      <form
        className="flex flex-col gap-3.5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <ArcField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <ArcField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <ul className="mt-1 space-y-2">
          {passwordRequirements.map(({ label, test }) => {
            const met = test(password);
            return (
              <li
                key={label}
                className="flex items-center gap-2.5 text-[13px] font-bold text-[#0f1220]"
              >
                <span
                  className={
                    met
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#62d84e] shadow-[0_2px_0_#3eaa2d]"
                      : "flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#ebe4f6] bg-white"
                  }
                >
                  <AnimatePresence mode="wait">
                    {met ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className={met ? "text-[#0f1220]" : "text-[#7a6fa3]"}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <motion.div whileTap={{ scale: 0.98 }} className="mt-3">
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting}
            className={authCtaClassName}
          >
            Reset password
          </Button>
        </motion.div>
      </form>
    </AuthShell>
  );
}
