import express from "express";
import {
  getAllUsers,
  getMe,
  searchUsers,
  updateProfile,
  updateProfileImage,
} from "./user.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { uploadProfileImage, validateUploadedProfileImage } from "../../common/middleware/upload.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { searchUsersSchema, updateProfileSchema } from "./user.validator.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), asyncHandler(getAllUsers));
router.get("/me", authenticate, asyncHandler(getMe));
router.get("/search", authenticate, validate({ query: searchUsersSchema }), asyncHandler(searchUsers));
router.put(
  "/profile-update",
  authenticate,
  validate({ body: updateProfileSchema }),
  asyncHandler(updateProfile)
);
router.put(
  "/profile-image",
  authenticate,
  uploadProfileImage,
  validateUploadedProfileImage,
  asyncHandler(updateProfileImage)
);

export default router;
