import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const uploadDirectory = path.resolve("uploads", "profiles");
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedMimeTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);
const storage = multer.diskStorage({ destination: uploadDirectory, filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${allowedMimeTypes.get(file.mimetype) ?? ""}`) });

export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: env.MAX_PROFILE_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) return callback(new AppError(400, "Only JPEG, PNG, and WebP profile images are supported"));
    callback(null, true);
  },
}).single("profileImage");

const hasValidImageSignature = (buffer: Buffer): boolean => {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return isJpeg || isPng || isWebp;
};

export const validateUploadedProfileImage: import("express").RequestHandler = async (req, _res, next) => {
  if (!req.file) return next();
  try {
    const handle = await fs.promises.open(req.file.path, "r");
    const signature = Buffer.alloc(12);
    await handle.read(signature, 0, signature.length, 0);
    await handle.close();
    if (!hasValidImageSignature(signature)) {
      await fs.promises.unlink(req.file.path);
      return next(new AppError(400, "Uploaded file is not a valid supported image"));
    }
    next();
  } catch (error) {
    next(error);
  }
};