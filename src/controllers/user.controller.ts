import type { Request, Response } from "express";
import User from "../models/user.model.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/appError.js";
import { toPublicUser } from "../utils/publicUser.js";

//================== getAllUsers =======================//
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const users = await User.find({ _id: { $ne: authReq.user._id }, status: "active" })
    .select("name email profilePic role emailVerified").lean();
  res.json({ success: true, data: users.map(toPublicUser), message: "Users retrieved successfully" });
};

//================== getMe =======================//
export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: toPublicUser((req as AuthRequest).user), message: "User retrieved successfully" });
};

//================== searchUsers =======================//
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const keyword = String(req.query.keyword ?? "");
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = escaped ? { $or: [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }] } : {};
  const users = await User.find({ ...filter, _id: { $ne: authReq.user._id }, status: "active" })
    .select("name email profilePic role emailVerified").limit(25).lean();
  res.json({ success: true, message: "Users retrieved successfully", data: users.map(toPublicUser) });
};

//================== updateProfile =======================//
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findByIdAndUpdate((req as AuthRequest).user._id, { $set: req.body }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, "User not found");
  res.json({ success: true, message: "Profile updated successfully", data: toPublicUser(user) });
};

export const updateProfileImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new AppError(400, "Profile image is required");
  const user = await User.findByIdAndUpdate((req as AuthRequest).user._id, { profilePic: `/uploads/profiles/${req.file.filename}` }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, "User not found");
  res.json({ success: true, message: "Profile image updated successfully", data: toPublicUser(user) });
};
