import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const getTransport = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new AppError(503, "Email service is not configured");
  }
  return nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } });
};

const sendMail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
  await getTransport().sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
};

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const url = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail(to, "Verify your email", `Verify your email by opening: ${url}`, `<p>Verify your email by clicking <a href="${url}">this link</a>. The link expires in 24 hours.</p>`);
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const url = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail(to, "Reset your password", `Reset your password by opening: ${url}`, `<p>Reset your password by clicking <a href="${url}">this link</a>. The link expires in 30 minutes.</p>`);
};