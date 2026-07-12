"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  AuthShell,
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button, InputOTP, REGEXP_ONLY_DIGITS } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-route";
import { assets } from "@/lib/assets";
import { useAuthStore } from "@/store/useAuthStore";

const OTP_LENGTH = 6;

type Purpose = "reset" | "verify";

export default function OtpScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const purposeParam = searchParams.get("purpose") as Purpose | null;
  const purpose: Purpose =
    purposeParam ??
    (pathname?.includes("verify-email") ? "verify" : "reset");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const setResetToken = useAuthStore((s) => s.setResetToken);
  const { update } = useSession();

  useEffect(() => {
    if (!email) {
      router.replace(
        purpose === "verify" ? "/register" : "/forgot-password",
      );
    }
  }, [email, purpose, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!email || otp.length !== OTP_LENGTH) return;
    setIsLoading(true);
    setFormError(null);
    try {
      if (purpose === "verify") {
        const res = await authApi.confirmVerifyEmail(email, otp);
        await update({
          user: { emailVerified: true },
          profile: res.profile ?? undefined,
        });
        router.push(
          resolvePostAuthPath({
            emailVerified: true,
            email,
            profile: res.profile,
          }),
        );      } else {
        const res = await authApi.verifyForgotOtp(email, otp);
        setResetToken(res.resetToken);
        router.push("/reset-password");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(messageForCode(err.code, err.message));
      } else {
        setFormError("Could not verify code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setFormError(null);
    try {
      if (purpose === "verify") {
        await authApi.requestVerifyEmail(email);
      } else {
        await authApi.forgotPassword(email);
      }
      setCountdown(30);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(messageForCode(err.code, err.message));
      } else {
        setFormError("Could not resend code");
      }
    }
  };

  if (!email) return null;

  const isComplete = otp.length === OTP_LENGTH;

  return (
    <AuthShell
      eyebrow="Check inbox"
      title={
        <>
          Enter the
          <br />
          6-digit code
        </>
      }
      subtitle={
        <>
          Sent to <span className="text-white/80">{email}</span>
        </>
      }
      onBack={() => router.back()}
      heroMedia={
        <Image
          src={assets.brand.checkEmail}
          alt=""
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
      <div className="flex flex-col">
        <motion.div
          className="flex justify-center"
          animate={isComplete ? { scale: [1, 1.02, 1] } : undefined}
          transition={{ duration: 0.35 }}
        >
          <InputOTP
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            onChange={setOtp}
          >
            <InputOTP.Group className="gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <InputOTP.Slot
                  key={i}
                  className="size-12 rounded-[14px] border-2 border-[#ebe4f6] bg-white text-[18px] font-black shadow-[0_3px_0_#ebe4f6] sm:size-14"
                  index={i}
                />
              ))}
            </InputOTP.Group>
          </InputOTP>
        </motion.div>

        {formError ? (
          <p className="mt-4 text-center text-[12px] font-bold text-arc-error">
            {formError}
          </p>
        ) : null}

        <motion.div whileTap={{ scale: 0.98 }} className="mt-8">
          <Button
            fullWidth
            variant="primary"
            isDisabled={!isComplete || isLoading}
            onPress={handleVerify}
            className={authCtaClassName}
          >
            Verify code
          </Button>
        </motion.div>

        <p className="mt-5 text-center text-[13px] font-bold text-[#7a6fa3]">
          Didn&apos;t get it?{" "}
          <AnimatePresence mode="wait">
            {countdown > 0 ? (
              <motion.span
                key="countdown"
                className="text-[#b3a8d6]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                Resend in {countdown}s
              </motion.span>
            ) : (
              <motion.button
                key="resend"
                type="button"
                onClick={handleResend}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-black text-arc-purple-500 underline-offset-2 hover:underline"
              >
                Resend code
              </motion.button>
            )}
          </AnimatePresence>
        </p>
      </div>
    </AuthShell>
  );
}
