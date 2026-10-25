import type { ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next
) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Invalid request data";
    errors = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Invalid request data";
    errors = Object.values(error.errors).map((item) => item.message);
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid identifier";
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Profile image is too large"
        : "Invalid file upload";
  } else if (error instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Token has expired";
  } else if (error instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    statusCode = 409;
    const mongoError = error as { keyPattern?: Record<string, number> };
    if (mongoError.keyPattern?.email) {
      message = "An account with this email already exists";
    } else if (mongoError.keyPattern?.id) {
      message = "A question with this identifier already exists";
    } else {
      message = "A duplicate record already exists";
    }
  }

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.NODE_ENV !== "production" && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};
