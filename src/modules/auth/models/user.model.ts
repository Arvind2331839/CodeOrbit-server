import mongoose, { type HydratedDocument, type Model, Schema, type Types } from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES, type UserRole } from "../../../common/types/auth.types.js";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profilePic: string;
  role: UserRole;
  status: "active" | "disabled";
  emailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(password: string): Promise<boolean>;
}

type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    profilePic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    role: { type: String, enum: USER_ROLES, default: "user", index: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
