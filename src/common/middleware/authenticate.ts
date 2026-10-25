import type { Request, Response, NextFunction } from "express";
import User from "../../modules/auth/models/user.model.js";
import type { AuthRequest } from "../types/auth.types.js";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../utils/token.js";

export type { AuthRequest } from "../types/auth.types.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [scheme, token] = req.get("authorization")?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new AppError(401, "Authentication required");
    }
    const payload = verifyAccessToken(token);
    if (payload.purpose !== "access" || !payload.sub) {
      throw new AppError(401, "Invalid access token");
    }
    const user = await User.findById(payload.sub)
      .select("name email profilePic role emailVerified status")
      .lean();
    if (!user || user.status !== "active") {
      throw new AppError(401, "Authentication required");
    }
    (req as AuthRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const protect = authenticate;
