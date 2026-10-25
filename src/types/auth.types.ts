import type { Request } from "express";
import type { Types } from "mongoose";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profilePic: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  purpose: "access";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  purpose: "refresh";
  iat?: number;
  exp?: number;
}