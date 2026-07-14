"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { ArcField } from "@/components/ArcField";
import { SocialButton } from "@/components/auth/SocialButton";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import {
  AuthShell,
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button, Link as ArcLink } from "@/components/ui";
import { getAppleIdToken, getGoogleIdToken } from "@/lib/auth/oauth";
import {
  authErrorMessage,
  signInWithOAuth,
  signInWithPassword,
} from "@/lib/auth/session";
import { resolvePostAuthPathWithFlags } from "@/lib/auth/resolve-post-auth";
import { useSystemFlags } from "@/hooks/useSystemFlags";
import { assets } from "@/lib/assets";
import { loginSchema, type LoginFormData } from "@/schemas/login";

export default function LoginScreen() {
  const router = useRouter();
  const { update } = useSession();
  const { flags } = useSystemFlags();
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const afterSignIn = async () => {
    const session = await update();
    const dest = await resolvePostAuthPathWithFlags({
      emailVerified: Boolean(session?.user?.emailVerified),
      email: session?.user?.email,
      profile: session?.profile,
      accessToken: session?.accessToken,
    });
    router.push(dest);
  };

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await signInWithPassword(data);
      await afterSignIn();
    } catch (err) {
      setFormError(authErrorMessage(err, "Could not log in"));
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setOauthBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      await signInWithOAuth("google", idToken);
      await afterSignIn();
    } catch (err) {
      setFormError(authErrorMessage(err, "Google sign-in failed"));
    } finally {
      setOauthBusy(false);
    }
  };

  const onApple = async () => {
    setFormError(null);
    setOauthBusy(true);
    try {
      const idToken = await getAppleIdToken();
      await signInWithOAuth("apple", idToken);
      await afterSignIn();
    } catch (err) {
      setFormError(authErrorMessage(err, "Apple sign-in failed"));
    } finally {
      setOauthBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Log in
          <br />
          and keep going
        </>
      }
      subtitle="Your roadmap is waiting."
      onBack={() => router.back()}
      heroMedia={
        <Image
          src={assets.arlo.waveHand}
          alt="Arlo waving hello"
          fill
          priority
          className="object-contain"
          sizes="120px"
        />
      }
      footer={
        <p className="text-center text-[13px] font-bold text-[#7a6fa3]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className={authGhostLinkClassName}>
            Sign up
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
        <ArcField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <ArcLink
            href="/forgot-password"
            className="text-[12px] font-black text-arc-purple-500 underline-offset-2 hover:underline"
          >
            Forgot password?
          </ArcLink>
        </div>

        {formError ? (
          <p className="text-[12px] font-bold text-arc-error">{formError}</p>
        ) : null}

        <motion.div whileTap={{ scale: 0.98 }} className="mt-2">
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting || oauthBusy}
            className={authCtaClassName}
          >
            Log in
          </Button>
        </motion.div>

        {flags.sso_enabled ? (
          <>
            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ebe4f6]" />
              <span className="text-[11px] font-black tracking-wide text-[#b3a8d6] uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-[#ebe4f6]" />
            </div>

            <div className="flex gap-2.5">
              <SocialButton label="Apple" onPress={onApple} disabled={oauthBusy}>
                <AppleIcon />
              </SocialButton>
              <SocialButton label="Google" onPress={onGoogle} disabled={oauthBusy}>
                <GoogleIcon />
              </SocialButton>
            </div>
          </>
        ) : null}
      </form>
    </AuthShell>
  );
}
