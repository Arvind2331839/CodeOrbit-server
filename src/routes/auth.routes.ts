import express from "express";
import { changePassword, forgotPassword, loginUser, logoutUser, refreshToken, registerUser, resendVerification, resetPassword, verifyEmail } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authLimiter, sensitiveAuthLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, verifyEmailSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", sensitiveAuthLimiter, validate({ body: registerSchema }), asyncHandler(registerUser));
router.post("/login", sensitiveAuthLimiter, validate({ body: loginSchema }), asyncHandler(loginUser));
router.post("/refresh-token", authLimiter, validate({ body: refreshSchema }), asyncHandler(refreshToken));
router.post("/logout", validate({ body: refreshSchema }), asyncHandler(logoutUser));
router.post("/forgot-password", sensitiveAuthLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(forgotPassword));
router.post("/reset-password", sensitiveAuthLimiter, validate({ body: resetPasswordSchema }), asyncHandler(resetPassword));
router.post("/verify-email", sensitiveAuthLimiter, validate({ body: verifyEmailSchema }), asyncHandler(verifyEmail));
router.post("/resend-verification", sensitiveAuthLimiter, validate({ body: resendVerificationSchema }), asyncHandler(resendVerification));
router.post("/change-password", authenticate, validate({ body: changePasswordSchema }), asyncHandler(changePassword));

export default router;
