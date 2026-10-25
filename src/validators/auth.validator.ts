import { z } from "zod";

const email = z.email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(128);
const token = z.string().min(20).max(2_000);

export const registerSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  profilePic: z.url().max(2_000).optional(),
});
export const loginSchema = z.strictObject({ email, password: z.string().min(1).max(128) });
export const refreshSchema = z.strictObject({ refreshToken: token.optional() });
export const forgotPasswordSchema = z.strictObject({ email });
export const resetPasswordSchema = z.strictObject({ token, password });
export const verifyEmailSchema = z.strictObject({ token });
export const resendVerificationSchema = z.strictObject({ email });
export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: "New password must be different from the current password",
  path: ["newPassword"],
});