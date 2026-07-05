"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft } from "lucide-react";
import { ArcField } from "@/components/ArcField";
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

      <div className="flex flex-1 flex-col items-center justify-center pb-4">
        <div className="relative h-80 w-full max-w-full">
          <Image
            src={assets.arlo.thumbsUp}
            alt="Arlo giving a thumbs up"
            fill
            priority
            className="object-contain"
            sizes="320px"
          />
        </div>

        <div className="mt-4 w-full">
          <div className="text-center">
            <h1 className="font-display text-arc-title font-bold text-arc-navy-900">
              Create new password
            </h1>
            <p className="mt-2 px-2 text-arc-body text-arc-navy-500">
              Make sure it&apos;s strong and secure.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <ArcField
              id="password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <ArcField
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <ul className="space-y-2">
              {passwordRequirements.map(({ label, test }) => {
                const met = test(password);

                return (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-arc-small text-arc-navy-900"
                  >
                    <span
                      className={
                        met
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-arc-success"
                          : "flex h-5 w-5 items-center justify-center rounded-full border border-arc-soft bg-white"
                      }
                    >
                      {met ? (
                        <Check
                          className="h-3 w-3 text-white"
                          strokeWidth={3}
                        />
                      ) : null}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>

            <Button
              type="submit"
              fullWidth
              variant="primary"
              isDisabled={isSubmitting}
              className="mt-2 h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
