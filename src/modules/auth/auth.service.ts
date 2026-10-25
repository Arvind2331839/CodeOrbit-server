import type { Request } from "express";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import RefreshSession from "./models/refreshSession.model.js";
import User, { type IUser } from "./models/user.model.js";
import { AppError } from "../../common/errors/AppError.js";
import { toPublicUser } from "../../common/utils/publicUser.js";
import {
  createOpaqueToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/token.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../common/utils/mail.service.js";

interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}

const sessionExpiry = (): Date =>
  new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 86_400_000);

const createSession = async (userId: string, metadata: RequestMetadata) => {
  const sessionId = new Types.ObjectId();
  const refreshToken = signRefreshToken(userId, sessionId.toString());
  const tokenHash = hashToken(refreshToken);
  await RefreshSession.create({
    _id: sessionId,
    user: userId,
    tokenHash,
    expiresAt: sessionExpiry(),
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  });
  return { refreshToken, tokenHash };
};

const issueTokens = async (user: IUser, metadata: RequestMetadata) => {
  const { refreshToken } = await createSession(user._id.toString(), metadata);
  return {
    accessToken: signAccessToken(user._id.toString(), user.role),
    refreshToken,
  };
};

export const register = async (
  input: { name: string; email: string; password: string; profilePic?: string },
  metadata: RequestMetadata
) => {
  if (await User.exists({ email: input.email })) {
    throw new AppError(409, "An account with this email already exists");
  }
  const verification = createOpaqueToken();
  const user = await User.create({
    ...input,
    emailVerified: !env.EMAIL_VERIFICATION_ENABLED,
    ...(env.EMAIL_VERIFICATION_ENABLED && {
      emailVerificationTokenHash: verification.hash,
      emailVerificationExpiresAt: new Date(Date.now() + 86_400_000),
    }),
  });
  if (env.EMAIL_VERIFICATION_ENABLED) {
    await sendVerificationEmail(user.email, verification.token);
  }
  return { user: toPublicUser(user), ...(await issueTokens(user, metadata)) };
};

export const login = async (
  input: { email: string; password: string },
  metadata: RequestMetadata
) => {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user || !(await user.matchPassword(input.password))) {
    throw new AppError(401, "Invalid email or password");
  }
  if (user.status !== "active") {
    throw new AppError(403, "This account is disabled");
  }
  if (env.REQUIRE_VERIFIED_EMAIL && !user.emailVerified) {
    throw new AppError(403, "Please verify your email before logging in");
  }
  return { user: toPublicUser(user), ...(await issueTokens(user, metadata)) };
};

export const rotateRefreshToken = async (refreshToken: string, metadata: RequestMetadata) => {
  const payload = verifyRefreshToken(refreshToken);
  if (payload.purpose !== "refresh" || !payload.sub || !payload.sid) {
    throw new AppError(401, "Invalid refresh token");
  }
  const presentedHash = hashToken(refreshToken);
  const session = await RefreshSession.findOneAndUpdate(
    {
      _id: payload.sid,
      user: payload.sub,
      tokenHash: presentedHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    },
    { revokedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!session) {
    const reusedSession = await RefreshSession.findOne({ _id: payload.sid, user: payload.sub });
    if (reusedSession) {
      await RefreshSession.updateMany(
        { user: payload.sub, revokedAt: { $exists: false } },
        { revokedAt: new Date() }
      );
    }
    throw new AppError(401, "Invalid refresh token");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") {
    throw new AppError(401, "Invalid refresh token");
  }
  const next = await createSession(user._id.toString(), metadata);
  session.replacedByTokenHash = next.tokenHash;
  await session.save();
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user._id.toString(), user.role),
    refreshToken: next.refreshToken,
  };
};

export const logout = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshSession.updateOne(
      {
        _id: payload.sid,
        user: payload.sub,
        tokenHash: hashToken(refreshToken),
        revokedAt: { $exists: false },
      },
      { revokedAt: new Date() }
    );
  } catch {
    /* Logout remains idempotent for invalid or expired cookies. */
  }
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) return;
  const reset = createOpaqueToken();
  user.passwordResetTokenHash = reset.hash;
  user.passwordResetExpiresAt = new Date(Date.now() + 1_800_000);
  await user.save({ validateModifiedOnly: true });
  await sendPasswordResetEmail(user.email, reset.token);
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");
  if (!user) throw new AppError(400, "Password reset token is invalid or expired");
  user.password = password;
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  await RefreshSession.deleteMany({ user: user._id });
};

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");
  if (!user) throw new AppError(400, "Email verification token is invalid or expired");
  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });
};

export const resendVerification = async (email: string): Promise<void> => {
  if (!env.EMAIL_VERIFICATION_ENABLED) return;
  const user = await User.findOne({ email });
  if (!user || user.emailVerified) return;
  const verification = createOpaqueToken();
  user.emailVerificationTokenHash = verification.hash;
  user.emailVerificationExpiresAt = new Date(Date.now() + 86_400_000);
  await user.save({ validateModifiedOnly: true });
  await sendVerificationEmail(user.email, verification.token);
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select("+password");
  if (!user || !(await user.matchPassword(currentPassword))) {
    throw new AppError(401, "Current password is incorrect");
  }
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  await RefreshSession.deleteMany({ user: user._id });
};

export const getRequestMetadata = (req: Request): RequestMetadata => ({
  ip: req.ip,
  userAgent: req.get("user-agent")?.slice(0, 500),
});
