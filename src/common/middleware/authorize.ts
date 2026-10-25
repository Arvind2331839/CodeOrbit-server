import type { Request, Response, NextFunction } from "express";
import type { AuthRequest, UserRole } from "../types/auth.types.js";
import { AppError } from "../errors/AppError.js";

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      return next(
        new AppError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
