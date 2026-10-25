import express from "express";
import {
  getAllUsers,
  getMe,
  searchUsers,
  updateProfile,
  updateProfileImage,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { uploadProfileImage, validateUploadedProfileImage } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { searchUsersSchema, updateProfileSchema } from "../validators/user.validator.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), asyncHandler(getAllUsers));
router.get("/me", authenticate, asyncHandler(getMe));
router.get("/search", authenticate, validate({ query: searchUsersSchema }), asyncHandler(searchUsers));
router.put("/profile-update", authenticate, validate({ body: updateProfileSchema }), asyncHandler(updateProfile));
router.put("/profile-image", authenticate, uploadProfileImage, validateUploadedProfileImage, asyncHandler(updateProfileImage));

export default router;
