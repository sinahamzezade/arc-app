"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock } from "lucide-react";
import { ArcField } from "@/components/ArcField";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { signOutArc } from "@/lib/auth/session";
import {
  changePasswordSchema,
  passwordRequirements,
  type ChangePasswordFormData,
} from "@/schemas/change-password";

/**
 * Authenticated change-password — settings privacy desk.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setFormError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setDone(true);
      window.setTimeout(() => {
        void (async () => {
          await signOutArc();
          router.replace("/login");
        })();
      }, 900);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(messageForCode(err.code, err.message));
      } else {
        setFormError("Could not change password");
      }
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#f3effc] font-rounded">
      <section className="relative overflow-hidden bg-[#0f1220] px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-40px] h-64 w-64 rounded-full bg-arc-purple-500/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[-30px] h-40 w-40 rounded-full bg-[#ffc928]/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
              Security
            </p>
            <h1 className="mt-0.5 font-display text-[26px] leading-none font-bold tracking-[-0.03em]">
              Password
            </h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
            <Lock className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
        <p className="relative mt-4 max-w-[18rem] text-[13px] font-bold text-white/55">
          Enter current password, then pick a stronger one.
        </p>
      </section>

      <div className="relative z-[1] -mt-5 flex-1 rounded-t-[28px] bg-[#f3effc] px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <form
          className="flex flex-col gap-3.5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <ArcField
            id="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
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
            label="Confirm new password"
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
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={3}
                          />
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

          {formError ? (
            <p className="text-[12px] font-bold text-arc-error">{formError}</p>
          ) : null}
          {done ? (
            <p className="text-[12px] font-bold text-[#3eaa2d]">
              Password updated
            </p>
          ) : null}

          <motion.div whileTap={{ scale: 0.98 }} className="mt-3">
            <Button
              type="submit"
              fullWidth
              variant="primary"
              isPending={isSubmitting}
              isDisabled={done}
              pendingLabel="Saving…"
              className="h-[54px] rounded-[18px] font-display text-[16px] font-bold shadow-[0_5px_0_var(--color-arc-purple-700)]"
            >
              Update password
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
