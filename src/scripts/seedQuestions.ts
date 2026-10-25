import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import Question, { type IQuestion } from "../modules/questions/questions.model.js";

// Helper to extract question objects from TypeScript source file
function parseQuestionsFromFile(filePath: string, defaultTech?: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Seed] File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  // Find start of array [
  const startIndex = content.indexOf("[");
  // Find end of array ];
  const lastIndex = content.lastIndexOf("]");

  if (startIndex === -1 || lastIndex === -1) {
    console.warn(`[Seed] Could not locate question array in: ${filePath}`);
    return [];
  }

  const arrayString = content.slice(startIndex, lastIndex + 1);

  // Evaluate safely using Function constructor or JSON
  try {
    const rawQuestions = new Function(`return ${arrayString}`)();
    return rawQuestions.map((q: any) => ({
      ...q,
      technology: (q.technology || defaultTech || "javascript").toLowerCase(),
    }));
  } catch (err) {
    console.error(`[Seed] Failed to parse questions from ${filePath}:`, err);
    return [];
  }
}

export async function seedQuestions(customMongoUri?: string): Promise<{ total: number; upserted: number; modified: number }> {
  const uri = customMongoUri || env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  console.log("[Seed] Connected to MongoDB. Collecting static questions...");

  // Potential locations for frontend question data
  const candidateDirs = [
    path.resolve(process.cwd(), "../client/src/modules/questions/data"),
    path.resolve(process.cwd(), "../Interview-client/src/modules/questions/data"),
    path.resolve(process.cwd(), "src/data/seed"),
  ];

  let clientDataDir = candidateDirs.find((d) => fs.existsSync(d));

  if (!clientDataDir) {
    throw new Error(`[Seed] Could not find questions data directory in any candidate path: ${candidateDirs.join(", ")}`);
  }

  console.log(`[Seed] Using question sources from: ${clientDataDir}`);

  const sources = [
    { file: "javascriptQuestions.ts", tech: "javascript" },
    { file: "reactQuestions.ts", tech: "react" },
    { file: "nodeQuestions.ts", tech: "nodejs" },
    { file: "databaseQuestions.ts", tech: "database" },
    { file: "typescriptQuestions.ts", tech: "typescript" },
  ];

  const allQuestions: any[] = [];

  for (const src of sources) {
    const filePath = path.join(clientDataDir, src.file);
    const questions = parseQuestionsFromFile(filePath, src.tech);
    console.log(`[Seed] Loaded ${questions.length} questions from ${src.file} (${src.tech})`);
    allQuestions.push(...questions);
  }

  console.log(`[Seed] Total questions gathered for seeding: ${allQuestions.length}`);

  if (allQuestions.length === 0) {
    console.warn("[Seed] No questions found to seed.");
    return { total: 0, upserted: 0, modified: 0 };
  }

  // Idempotent bulk upsert by 'id'
  const bulkOps = allQuestions.map((q, index) => {
    const tech = (q.technology || "javascript").toLowerCase().trim();
    const topic = (q.topic || "General").trim();
    const id = q.id && String(q.id).trim() ? String(q.id).trim() : `${tech}-${topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${index + 1}`;

    const questionDoc: Partial<IQuestion> = {
      id,
      title: q.title || "",
      question: q.question,
      answer: q.answer,
      topic,
      subtopic: q.subtopic || "",
      difficulty: q.difficulty || "intermediate",
      tags: Array.isArray(q.tags) ? q.tags : [],
      codeExample: q.codeExample || q.code || "",
      output: q.output || "",
      explanation: q.explanation || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || "",
      technology: tech,
    };

    return {
      updateOne: {
        filter: { id },
        update: { $set: questionDoc },
        upsert: true,
      },
    };
  });

  const result = await Question.bulkWrite(bulkOps);

  console.log(`[Seed] Seeding completed:
  - Total Processed: ${allQuestions.length}
  - New Questions Upserted: ${result.upsertedCount}
  - Existing Questions Updated: ${result.modifiedCount}
  - Matched (unchanged): ${result.matchedCount}`);

  return {
    total: allQuestions.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
}

// Standalone execution
if (process.argv[1]?.endsWith("seedQuestions.ts") || process.argv[1]?.endsWith("seedQuestions.js")) {
  seedQuestions()
    .then(() => {
      console.log("[Seed] Done! Disconnecting...");
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Error during seeding:", err);
      process.exit(1);
    });
}
