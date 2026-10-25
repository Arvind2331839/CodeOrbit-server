import { z } from "zod";

export const questionDifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);

export const questionOptionSchema = z.object({
  id: z.string().trim().min(1, "Option ID is required").max(50),
  text: z.string().trim().min(1, "Option text is required").max(5000),
});

export const singleQuestionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().max(500).optional().default(""),
  question: z.string().trim().min(3, "Question text must be at least 3 characters").max(10000),
  answer: z.string().trim().min(1, "Answer is required").max(10000),
  topic: z.string().trim().min(1, "Topic is required").max(150),
  subtopic: z.string().trim().max(150).optional().default(""),
  difficulty: questionDifficultyEnum,
  tags: z.array(z.string().trim().max(100)).optional().default([]),
  codeExample: z.string().optional().default(""),
  output: z.string().optional().default(""),
  explanation: z.string().optional().default(""),
  options: z.array(questionOptionSchema).optional().default([]),
  correctAnswer: z.string().trim().max(50).optional().default(""),
  technology: z
    .string()
    .trim()
    .min(1, "Technology is required")
    .max(50)
    .transform((val) => val.toLowerCase()),
});

export const bulkQuestionArraySchema = z
  .array(singleQuestionSchema)
  .min(1, "The array must contain at least one question");

export const bulkCreateQuestionSchema = z.union([
  bulkQuestionArraySchema,
  z.object({
    questions: bulkQuestionArraySchema,
  }),
]);

export const updateQuestionSchema = singleQuestionSchema.partial();

export const questionQuerySchema = z.object({
  technology: z.string().trim().max(50).optional(),
  topic: z.string().trim().max(150).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "all"]).optional().default("all"),
  search: z.string().trim().max(200).optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(500).optional().default(20),
});

export const questionParamSchema = z.object({
  id: z.string().trim().min(1, "Question ID is required"),
});
