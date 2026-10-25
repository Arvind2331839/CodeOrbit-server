import mongoose from "mongoose";
import Question, { type IQuestion, type QuestionDifficulty } from "./questions.model.js";
import { AppError } from "../../common/errors/AppError.js";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function generateQuestionId(technology: string, topic: string): string {
  const cleanTech = technology.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanTech}-${cleanTopic}-${randomSuffix}`;
}

export interface QuestionQueryParams {
  technology?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const findQuestions = async (params: QuestionQueryParams) => {
  const {
    technology,
    topic,
    difficulty,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  const query: Record<string, any> = {};

  if (technology && technology.trim()) {
    query.technology = technology.trim().toLowerCase();
  }

  if (topic && topic !== "all" && topic.trim()) {
    query.topic = new RegExp(`^${escapeRegex(topic.trim())}$`, "i");
  }

  if (difficulty && difficulty !== "all") {
    query.difficulty = difficulty as QuestionDifficulty;
  }

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(escapeRegex(term), "i");
    query.$or = [
      { title: regex },
      { question: regex },
      { topic: regex },
      { tags: regex },
      { codeExample: regex },
      { "options.text": regex },
    ];
  }

  const numPage = Number(page) || 1;
  const numPageSize = Number(pageSize) || 20;
  const skip = (numPage - 1) * numPageSize;

  const [items, total] = await Promise.all([
    Question.find(query).sort({ createdAt: 1 }).skip(skip).limit(numPageSize).lean(),
    Question.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / numPageSize) || 1;
  const startIndex = total === 0 ? 0 : skip + 1;
  const endIndex = Math.min(skip + items.length, total);

  return {
    items,
    total,
    page: numPage,
    pageSize: numPageSize,
    totalPages,
    startIndex,
    endIndex,
  };
};

export const findQuestionById = async (id: string) => {
  let question = await Question.findOne({ id }).lean();

  if (!question && mongoose.Types.ObjectId.isValid(id)) {
    question = await Question.findById(id).lean();
  }

  if (!question) {
    throw new AppError(404, `Question with identifier "${id}" not found`);
  }

  return question;
};

export const getTopicsByTechnology = async (technology: string = "javascript") => {
  const techKey = technology.toLowerCase().trim();
  const questions = await Question.find({ technology: techKey }).select("topic").lean();

  const topicMap: Record<string, number> = {};
  questions.forEach((q) => {
    if (q.topic) {
      topicMap[q.topic] = (topicMap[q.topic] || 0) + 1;
    }
  });

  const topics = Object.entries(topicMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    technology: techKey,
    totalQuestions: questions.length,
    topics,
  };
};

export const getStatisticsByTechnology = async (technology: string = "javascript") => {
  const techKey = technology.toLowerCase().trim();
  const questions = await Question.find({ technology: techKey })
    .select("topic difficulty")
    .lean();

  const topicCounts: Record<string, number> = {};
  const difficultyCounts: Record<QuestionDifficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  questions.forEach((q) => {
    if (q.topic) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }
    const diff = q.difficulty as QuestionDifficulty;
    if (difficultyCounts[diff] !== undefined) {
      difficultyCounts[diff]++;
    }
  });

  const uniqueTopics = Object.keys(topicCounts);

  return {
    totalQuestions: questions.length,
    topicCounts,
    difficultyCounts,
    beginnerCount: difficultyCounts.beginner,
    intermediateCount: difficultyCounts.intermediate,
    advancedCount: difficultyCounts.advanced,
    totalTopics: uniqueTopics.length,
  };
};

export const createSingleQuestion = async (data: Record<string, any>) => {
  const questionData = { ...data };

  if (!questionData.id || !questionData.id.trim()) {
    questionData.id = generateQuestionId(questionData.technology, questionData.topic);
  }

  const existing = await Question.findOne({ id: questionData.id }).lean();
  if (existing) {
    throw new AppError(409, `A question with ID "${questionData.id}" already exists`);
  }

  return Question.create(questionData);
};

export const bulkCreateQuestionList = async (questionsList: Array<Record<string, any>>) => {
  if (!Array.isArray(questionsList) || questionsList.length === 0) {
    throw new AppError(400, "Expected a non-empty array of question objects");
  }

  const operations = questionsList.map((item, idx) => {
    const tech = String(item.technology || "javascript").toLowerCase().trim();
    const topic = String(item.topic || "General").trim();
    const id =
      item.id && String(item.id).trim()
        ? String(item.id).trim()
        : generateQuestionId(tech, `${topic}-${idx}`);

    const doc = {
      ...item,
      id,
      technology: tech,
    };

    return {
      updateOne: {
        filter: { id },
        update: { $set: doc },
        upsert: true,
      },
    };
  });

  const bulkResult = await Question.bulkWrite(operations);
  const insertedCount = (bulkResult.upsertedCount || 0) + (bulkResult.modifiedCount || 0);

  return {
    totalReceived: questionsList.length,
    upsertedCount: bulkResult.upsertedCount,
    modifiedCount: bulkResult.modifiedCount,
    matchedCount: bulkResult.matchedCount,
    totalSaved: insertedCount,
  };
};

export const updateQuestionById = async (id: string, updates: Record<string, any>) => {
  let query: Record<string, any> = { id };
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = { $or: [{ id }, { _id: id }] };
  }

  const updated = await Question.findOneAndUpdate(
    query,
    { $set: updates },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError(404, `Question with identifier "${id}" not found`);
  }

  return updated;
};

export const deleteQuestionById = async (id: string) => {
  let query: Record<string, any> = { id };
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = { $or: [{ id }, { _id: id }] };
  }

  const deleted = await Question.findOneAndDelete(query).lean();

  if (!deleted) {
    throw new AppError(404, `Question with identifier "${id}" not found`);
  }

  return deleted;
};
