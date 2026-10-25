import type { Request, Response } from "express";
import * as userService from "./user.service.js";
import type { AuthRequest } from "../../common/types/auth.types.js";
import { toPublicUser } from "../../common/utils/publicUser.js";
import { AppError } from "../../common/errors/AppError.js";

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const users = await userService.getAllUsers(authReq.user._id);
  res.json({ success: true, message: "Users retrieved successfully", data: users });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: "User retrieved successfully",
    data: toPublicUser((req as AuthRequest).user),
  });
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const keyword = String(req.query.keyword ?? "");
  const users = await userService.searchUsers(keyword, authReq.user._id);
  res.json({ success: true, message: "Users retrieved successfully", data: users });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateProfile((req as AuthRequest).user._id, req.body);
  res.json({ success: true, message: "Profile updated successfully", data: user });
};

export const updateProfileImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new AppError(400, "Profile image is required");
  const user = await userService.updateProfileImage(
    (req as AuthRequest).user._id,
    `/uploads/profiles/${req.file.filename}`
  );
  res.json({ success: true, message: "Profile image updated successfully", data: user });
};
