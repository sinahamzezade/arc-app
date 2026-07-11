"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ArcField } from "@/components/ArcField";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import {
  AuthShell,
  authCtaClassName,
  authGhostLinkClassName,
} from "@/components/onboarding/AuthShell";
import { Button, Link as ArcLink } from "@/components/ui";
import { assets } from "@/lib/assets";
import { loginSchema, type LoginFormData } from "@/schemas/login";

export default function LoginScreen() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
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
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
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

        <motion.div whileTap={{ scale: 0.98 }} className="mt-2">
          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting}
            className={authCtaClassName}
          >
            Log in
          </Button>
        </motion.div>

        <div className="my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ebe4f6]" />
          <span className="text-[11px] font-black tracking-wide text-[#b3a8d6] uppercase">
            or
          </span>
          <div className="h-px flex-1 bg-[#ebe4f6]" />
        </div>

        <div className="flex gap-2.5">
          <SocialButton label="Apple">
            <AppleIcon />
          </SocialButton>
          <SocialButton label="Google">
            <GoogleIcon />
          </SocialButton>
        </div>
      </form>
    </AuthShell>
  );
}

function SocialButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] border-2 border-[#ebe4f6] bg-white text-[14px] font-bold text-[#0f1220] shadow-[0_3px_0_#ebe4f6]"
    >
      {children}
      {label}
    </motion.button>
  );
}
