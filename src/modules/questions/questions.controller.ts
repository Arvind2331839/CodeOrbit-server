import type { Request, Response } from "express";
import * as questionService from "./questions.service.js";

/**
 * Public: Get paginated and filtered questions.
 */
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  const result = await questionService.findQuestions(req.query);
  res.json({
    success: true,
    data: result,
  });
};

/**
 * Public: Fetch a single question by id.
 */
export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const question = await questionService.findQuestionById(id);
  res.json({
    success: true,
    data: question,
  });
};

/**
 * Public: Get distinct topics and counts for a technology.
 */
export const getTopicsForTechnology = async (req: Request, res: Response): Promise<void> => {
  const { technology = "javascript" } = req.query as { technology?: string };
  const result = await questionService.getTopicsByTechnology(technology);
  res.json({
    success: true,
    data: result,
  });
};

/**
 * Public: Compute aggregated question statistics for a technology.
 */
export const getQuestionStatistics = async (req: Request, res: Response): Promise<void> => {
  const { technology = "javascript" } = req.query as { technology?: string };
  const stats = await questionService.getStatisticsByTechnology(technology);
  res.json({
    success: true,
    data: stats,
  });
};

/**
 * Admin: Create a single question.
 */
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  const question = await questionService.createSingleQuestion(req.body);
  res.status(201).json({
    success: true,
    message: "Question created successfully",
    data: question,
  });
};

/**
 * Admin: Bulk create multiple questions from JSON array.
 */
export const bulkCreateQuestions = async (req: Request, res: Response): Promise<void> => {
  const rawPayload = req.body;
  const list = Array.isArray(rawPayload) ? rawPayload : rawPayload.questions;
  const result = await questionService.bulkCreateQuestionList(list);

  res.status(201).json({
    success: true,
    message: `Successfully processed ${list.length} questions (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
    data: result,
  });
};

/**
 * Admin: Update an existing question.
 */
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const updated = await questionService.updateQuestionById(id, req.body);
  res.json({
    success: true,
    message: "Question updated successfully",
    data: updated,
  });
};

/**
 * Admin: Delete a question.
 */
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  await questionService.deleteQuestionById(id);
  res.json({
    success: true,
    message: "Question deleted successfully",
  });
};
