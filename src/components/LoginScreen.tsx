"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { ArcField } from "@/components/ArcField";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import { Button, Link as ArcLink } from "@/components/ui";
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-5 pt-safe-top pb-safe-bottom">
      <header className="pt-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="-ml-2 inline-flex rounded-full p-2 text-arc-navy-900"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </button>
      </header>

      <div className="flex-1" />

      <div className="pb-4">
        <div className="text-center">
          <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
            Welcome back!
          </h1>
          <p className="mt-1 text-arc-body text-arc-navy-500">
            Glad to see you again
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col">
          <div className="flex flex-col gap-4">
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
          </div>

          <div className="mt-3 flex justify-end">
            <ArcLink
              href="/forgot-password"
              className="text-arc-small font-semibold text-arc-purple-500 underline-offset-2 hover:underline"
            >
              Forgot password?
            </ArcLink>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isDisabled={isSubmitting}
            className="mt-6 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
          >
            Log In
          </Button>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-arc-soft" />
            <span className="text-arc-caption font-medium text-arc-lavender-700">
              or continue with
            </span>
            <div className="h-px flex-1 bg-arc-soft" />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
            >
              <AppleIcon />
              Apple
            </button>
            <button
              type="button"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-arc-md border border-arc-soft bg-white font-rounded text-arc-body font-semibold text-arc-navy-900 shadow-arc-card transition-colors active:bg-arc-lavender-50"
            >
              <GoogleIcon />
              Google
            </button>
          </div>

          <p className="mt-14 text-center text-arc-small text-arc-navy-700">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-arc-purple-500 underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
