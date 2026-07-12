"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ArcField } from "@/components/ArcField";
import {
  AuthShell,
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { assets } from "@/lib/assets";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/forgot-password";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError(null);
    try {
      await authApi.forgotPassword(data.email);
      router.push(
        `/forgot-password/check-email?email=${encodeURIComponent(data.email)}&purpose=reset`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(messageForCode(err.code, err.message));
      } else {
        setFormError("Could not send reset code");
      }
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={
        <>
          Reset your
          <br />
          password
        </>
      }
      subtitle="We'll email a 6-digit code."
      onBack={() => router.back()}
      heroMedia={
        <Image
          src={assets.arlo.envelope}
          alt="Arlo holding a password reset envelope"
          fill
          priority
          className="object-contain"
          sizes="120px"
        />
      }
      footer={
        <p className="text-center text-[13px] font-bold text-[#7a6fa3]">
          <Link href="/login" className={authGhostLinkClassName}>
            Back to log in
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <ArcField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          error={errors.email?.message}
          {...register("email")}
        />

        {formError ? (
          <p className="text-[12px] font-bold text-arc-error">{formError}</p>
        ) : null}

        <motion.div whileTap={{ scale: 0.98 }} className="mt-2">
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting}
            className={authCtaClassName}
          >
            Send reset code
          </Button>
        </motion.div>
      </form>
    </AuthShell>
  );
}
