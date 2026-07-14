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
          "relative flex h-[58px] flex-col justify-center rounded-[16px] border-2 bg-white px-4 shadow-[0_3px_0_#ebe4f6]",
          error ? "border-arc-error" : "border-[#ebe4f6]",
        )}
      >
        <label
          htmlFor={id}
          className="text-[10px] font-black tracking-[0.08em] text-[#b3a8d6] uppercase"
        >
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-transparent text-[15px] font-bold text-[#0f1220] outline-none placeholder:text-[#c3badb] disabled:cursor-not-allowed disabled:opacity-70",
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
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#b3a8d6]"
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
        <p className="px-1 text-[12px] font-bold text-arc-error">{error}</p>
      ) : null}
    </div>
  );
}
