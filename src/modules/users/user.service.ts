import User from "../auth/models/user.model.js";
import { AppError } from "../../common/errors/AppError.js";
import { toPublicUser } from "../../common/utils/publicUser.js";

export const getAllUsers = async (excludeUserId: any) => {
  const users = await User.find({ _id: { $ne: excludeUserId }, status: "active" })
    .select("name email profilePic role emailVerified")
    .lean();
  return users.map(toPublicUser);
};

export const searchUsers = async (keyword: string, excludeUserId: any) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = escaped
    ? {
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find({ ...filter, _id: { $ne: excludeUserId }, status: "active" })
    .select("name email profilePic role emailVerified")
    .limit(25)
    .lean();

  return users.map(toPublicUser);
};

export const updateProfile = async (userId: any, updates: { name?: string; profilePic?: string }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: "after", runValidators: true }
  );
  if (!user) throw new AppError(404, "User not found");
  return toPublicUser(user);
};

export const updateProfileImage = async (userId: any, imagePath: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { profilePic: imagePath },
    { returnDocument: "after", runValidators: true }
  );
  if (!user) throw new AppError(404, "User not found");
  return toPublicUser(user);
};
