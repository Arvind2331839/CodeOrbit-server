import type { Types } from "mongoose";
import type { UserRole } from "../types/auth.types.js";

interface PublicUserSource {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profilePic: string;
  role: UserRole;
  emailVerified: boolean;
}

export const toPublicUser = (user: PublicUserSource) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePic: user.profilePic,
  role: user.role,
  emailVerified: user.emailVerified,
});
