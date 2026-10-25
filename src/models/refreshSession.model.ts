import { Schema, model, type Types } from "mongoose";

export interface IRefreshSession {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenHash?: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    replacedByTokenHash: String,
    userAgent: { type: String, maxlength: 500 },
    ip: { type: String, maxlength: 100 },
  },
  { timestamps: true },
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IRefreshSession>("RefreshSession", refreshSessionSchema);