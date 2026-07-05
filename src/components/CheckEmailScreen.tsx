"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { assets } from "@/lib/assets";

const helpItems = [
  "Check your spam folder",
  "Make sure the email is correct",
  "Click the button below to resend",
];

export default function CheckEmailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const handleResend = () => {
    if (!email) return;
    console.log({ email });
  };

  if (!email) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        <div className="relative aspect-square w-full max-w-[280px]">
          <Image
            src={assets.brand.checkEmail}
            alt="Password reset email sent"
            fill
            priority
            className="object-contain"
            sizes="280px"
          />
        </div>

        <div className="mt-4 w-full">
          <div className="text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Check your email
            </h1>
            <p className="mt-2 px-2 text-arc-body text-arc-navy-500">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-bold text-arc-navy-900">{email}</span>
            </p>
          </div>

          <div className="mt-6 rounded-arc-xl bg-arc-lavender-100 px-5 py-4">
            <p className="font-rounded text-arc-body font-bold text-arc-navy-900">
              Didn&apos;t receive the email?
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-arc-small text-arc-navy-700">
              {helpItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <Button
            fullWidth
            variant="primary"
            onPress={handleResend}
            className="mt-6 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
          >
            Resend Email
          </Button>

          <p className="mt-8 text-center text-arc-small text-arc-navy-700">
            <Link
              href="/login"
              className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
            >
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
