import express from "express";
import {
  bulkCreateQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  getQuestionStatistics,
  getTopicsForTechnology,
  updateQuestion,
} from "./questions.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import {
  bulkCreateQuestionSchema,
  questionParamSchema,
  questionQuerySchema,
  singleQuestionSchema,
  updateQuestionSchema,
} from "./questions.validator.js";

const router = express.Router();

// --- Public Routes for Students & Browsing ---
router.get("/", validate({ query: questionQuerySchema }), asyncHandler(getQuestions));
router.get("/stats", asyncHandler(getQuestionStatistics));
router.get("/topics", asyncHandler(getTopicsForTechnology));
router.get("/:id", validate({ params: questionParamSchema }), asyncHandler(getQuestionById));

// --- Admin-Protected Routes for Question Management ---
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate({ body: singleQuestionSchema }),
  asyncHandler(createQuestion)
);

router.post(
  "/bulk",
  authenticate,
  authorize("admin"),
  validate({ body: bulkCreateQuestionSchema }),
  asyncHandler(bulkCreateQuestions)
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate({ params: questionParamSchema, body: updateQuestionSchema }),
  asyncHandler(updateQuestion)
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate({ params: questionParamSchema }),
  asyncHandler(deleteQuestion)
);

export default router;
