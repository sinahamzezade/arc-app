"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ArcFieldProps = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  autoComplete?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function ArcField({
  id,
  label,
  type = "text",
  autoComplete,
  error,
  className,
  ...props
}: ArcFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "relative flex h-16 flex-col justify-center rounded-arc-md border bg-white px-4 shadow-arc-inner",
          error ? "border-arc-error" : "border-arc-soft",
        )}
      >
        <label
          htmlFor={id}
          className="text-arc-caption font-semibold text-arc-lavender-700"
        >
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-transparent text-arc-body font-semibold text-arc-navy-900 outline-none",
            isPassword && "pr-10",
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((current) => !current)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-arc-lavender-600"
          >
            {visible ? (
              <Eye className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <EyeOff className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="px-1 text-arc-caption text-arc-error">{error}</p>
      ) : null}
    </div>
  );
}
