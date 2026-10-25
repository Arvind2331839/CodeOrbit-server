import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from "../types/auth.types.js";

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createOpaqueToken = (): { token: string; hash: string } => {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
};

export const signAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign(
    { role, purpose: "access" },
    env.JWT_ACCESS_SECRET,
    { subject: userId, expiresIn: env.ACCESS_TOKEN_EXPIRES_IN } as SignOptions,
  );

export const signRefreshToken = (userId: string, sessionId: string): string =>
  jwt.sign(
    { sid: sessionId, purpose: "refresh" },
    env.JWT_REFRESH_SECRET,
    { subject: userId, expiresIn: `${env.REFRESH_TOKEN_EXPIRES_IN_DAYS}d` } as SignOptions,
  );

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;