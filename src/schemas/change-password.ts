import { z } from "zod";
import { passwordRequirements } from "./reset-password";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/\d/, "Contains a number")
  .regex(/[^A-Za-z0-9]/, "Contains a special character");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: "New password must differ from current",
    path: ["password"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export { passwordRequirements };
