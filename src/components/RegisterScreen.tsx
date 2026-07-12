"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Button, Checkbox, Link as ArcLink } from "@/components/ui";
import { getAppleIdToken, getGoogleIdToken } from "@/lib/auth/oauth";
import {
  authErrorMessage,
  signInWithOAuth,
  signUpWithPassword,
} from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-route";
import { assets } from "@/lib/assets";
import { registerSchema, type RegisterFormData } from "@/schemas/register";

export default function RegisterScreen() {
  const router = useRouter();
  const { update } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const goVerify = async () => {
    const session = await update();
    const email = session?.user?.email;
    if (email) {
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&purpose=verify`,
      );
    } else {
      router.push("/onboarding");
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    try {
      await signUpWithPassword({
        name: data.name,
        email: data.email,
        password: data.password,
        agreeToTerms: data.agreeToTerms,
      });
      await goVerify();
    } catch (err) {
      setFormError(authErrorMessage(err, "Could not create account"));
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setOauthBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      await signInWithOAuth("google", idToken);
      const session = await update();
      router.push(
        resolvePostAuthPath({
          emailVerified: Boolean(session?.user?.emailVerified),
          email: session?.user?.email,
          profile: session?.profile,
        }),
      );
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
      const session = await update();
      router.push(
        resolvePostAuthPath({
          emailVerified: Boolean(session?.user?.emailVerified),
          email: session?.user?.email,
          profile: session?.profile,
        }),
      );
    } catch (err) {
      setFormError(authErrorMessage(err, "Apple sign-in failed"));
    } finally {
      setOauthBusy(false);
    }
  };

  return (
    <AuthShell
      compact
      eyebrow="New journey"
      title={
        <>
          Create your
          <br />
          Arc account
        </>
      }
      subtitle="Then we shape your roadmap."
      onBack={() => router.back()}
      heroMedia={
        <Image
          src={assets.arlo.waveHand}
          alt="Arlo waving hello"
          fill
          priority
          className="object-contain"
          sizes="88px"
        />
      }
      footer={
        <p className="text-center text-[13px] font-bold text-[#7a6fa3]">
          Already have an account?{" "}
          <Link href="/login" className={authGhostLinkClassName}>
            Log in
          </Link>
        </p>
      }
    >
      <form
        className="flex flex-col gap-3.5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <ArcField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          error={errors.name?.message}
          {...register("name")}
        />
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
              className="mt-1 items-start"
            >
              <Checkbox.Content className="items-start gap-2.5">
                <Checkbox.Control className="size-4.5">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-[12px] leading-snug font-bold text-[#5a5278]">
                  I agree to the{" "}
                  <ArcLink
                    href="/terms"
                    className="font-black text-arc-purple-500 underline-offset-2 hover:underline"
                  >
                    Terms
                  </ArcLink>{" "}
                  and{" "}
                  <ArcLink
                    href="/privacy"
                    className="font-black text-arc-purple-500 underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </ArcLink>
                </span>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
        {errors.agreeToTerms ? (
          <p className="text-[12px] font-bold text-arc-error">
            {errors.agreeToTerms.message}
          </p>
        ) : null}

        {formError ? (
          <p className="text-[12px] font-bold text-arc-error">{formError}</p>
        ) : null}

        <motion.div whileTap={{ scale: 0.98 }} className="mt-1">
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting || oauthBusy}
            className={authCtaClassName}
          >
            Create account
          </Button>
        </motion.div>

        <div className="my-1 flex items-center gap-3">
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
      </form>
    </AuthShell>
  );
}
