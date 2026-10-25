import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import * as authService from "./auth.service.js";
import type { AuthRequest } from "../../common/types/auth.types.js";
import { AppError } from "../../common/errors/AppError.js";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 86_400_000,
};

const getRefreshToken = (req: Request): string | undefined =>
  req.cookies?.[env.REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;

const sendAuthResponse = (
  res: Response,
  status: number,
  message: string,
  result: Awaited<ReturnType<typeof authService.login>>
) => {
  res.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  res.status(status).json({
    success: true,
    message,
    data: { user: result.user, accessToken: result.accessToken },
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  sendAuthResponse(
    res,
    201,
    "Registration successful",
    await authService.register(req.body, authService.getRequestMetadata(req))
  );
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  sendAuthResponse(
    res,
    200,
    "Login successful",
    await authService.login(req.body, authService.getRequestMetadata(req))
  );
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const token = getRefreshToken(req);
  if (!token) throw new AppError(401, "Refresh token is required");
  sendAuthResponse(
    res,
    200,
    "Token refreshed successfully",
    await authService.rotateRefreshToken(token, authService.getRequestMetadata(req))
  );
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(getRefreshToken(req));
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.json({ success: true, message: "Logout successful" });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  await authService.forgotPassword(req.body.email);
  res.json({ success: true, message: "If an account exists, a password reset email has been sent" });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.json({ success: true, message: "Password reset successful. Please log in again." });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  await authService.verifyEmail(req.body.token);
  res.json({ success: true, message: "Email verified successfully" });
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  await authService.resendVerification(req.body.email);
  res.json({ success: true, message: "If verification is required, a new email has been sent" });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  await authService.changePassword(
    (req as AuthRequest).user._id.toString(),
    req.body.currentPassword,
    req.body.newPassword
  );
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.json({ success: true, message: "Password changed successfully. Please log in again." });
};
