import { rateLimit } from "express-rate-limit";
import { env } from "../../config/env.js";

const baseOptions = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { success: false, message: "Too many requests. Please try again later." },
};

export const authLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1_000, limit: 20 });
export const sensitiveAuthLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1_000, limit: 5 });
