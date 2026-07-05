import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/\d/, "Contains a number")
  .regex(/[^A-Za-z0-9]/, "Contains a special character");

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const passwordRequirements = [
  {
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "Contains a number",
    test: (password: string) => /\d/.test(password),
  },
  {
    label: "Contains a special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;
