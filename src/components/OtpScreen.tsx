"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MotionReveal,
  MotionStagger,
  OnboardingPage,
} from "@/components/motion";
import { Button, InputOTP, REGEXP_ONLY_DIGITS } from "@/components/ui";
import { otpSlot, scaleIn } from "@/lib/motion/onboarding";

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setIsLoading(true);
    try {
      console.log({ email, otp });
      router.push(`/reset-password?email=${encodeURIComponent(email!)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (!email || countdown > 0) return;
    console.log("resend to", email);
    setCountdown(30);
  };

  if (!email) return null;

  const isComplete = otp.length === OTP_LENGTH;

  return (
    <OnboardingPage className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        <MotionStagger className="w-full">
          <MotionReveal className="text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Enter the code
            </h1>
            <p className="mt-2 px-2 text-arc-body text-arc-navy-500">
              We sent a 6-digit code to{" "}
              <span className="font-bold text-arc-navy-900">{email}</span>
            </p>
          </MotionReveal>

          <MotionReveal className="mt-8 flex justify-center">
            <motion.div
              animate={isComplete ? { scale: [1, 1.02, 1] } : undefined}
              transition={{ duration: 0.35 }}
            >
              <InputOTP
                maxLength={OTP_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                value={otp}
                onChange={setOtp}
              >
                <InputOTP.Group>
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={otpSlot}
                      initial="hidden"
                      animate="visible"
                    >
                      <InputOTP.Slot className="size-14" index={i} />
                    </motion.div>
                  ))}
                </InputOTP.Group>
              </InputOTP>
            </motion.div>
          </MotionReveal>

          <MotionReveal>
            <motion.div whileTap={{ scale: 0.98 }} variants={scaleIn}>
              <Button
                fullWidth
                variant="primary"
                isDisabled={!isComplete || isLoading}
                onPress={handleVerify}
                className="mt-8 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
              >
                Verify Code
              </Button>
            </motion.div>
          </MotionReveal>

          <MotionReveal as="p" className="mt-6 text-center text-arc-small text-arc-navy-700">
            Didn&apos;t receive it?{" "}
            <AnimatePresence mode="wait">
              {countdown > 0 ? (
                <motion.span
                  key="countdown"
                  className="text-arc-navy-500"
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
                  whileHover={{ scale: 1.04 }}
                  className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
                >
                  Resend code
                </motion.button>
              )}
            </AnimatePresence>
          </MotionReveal>

          <MotionReveal as="p" className="mt-4 text-center text-arc-small text-arc-navy-700">
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
