import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Question from "../src/modules/questions/questions.model.js";
import { seedQuestions } from "../src/scripts/seedQuestions.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe("Database Migration / Seed Script", () => {
  it("successfully parses and seeds all static questions into MongoDB", async () => {
    const result1 = await seedQuestions(mongo.getUri());

    expect(result1.total).toBe(193);
    expect(result1.upserted).toBe(193);

    // Verify database count
    const totalCount = await Question.countDocuments();
    expect(totalCount).toBe(193);

    // Verify all technologies are present
    const jsCount = await Question.countDocuments({ technology: "javascript" });
    const reactCount = await Question.countDocuments({ technology: "react" });
    const nodeCount = await Question.countDocuments({ technology: "nodejs" });
    const dbCount = await Question.countDocuments({ technology: "database" });
    const tsCount = await Question.countDocuments({ technology: "typescript" });

    expect(jsCount).toBe(168);
    expect(reactCount).toBe(10);
    expect(nodeCount).toBe(5);
    expect(dbCount).toBe(5);
    expect(tsCount).toBe(5);
  });

  it("is completely idempotent when run a second time", async () => {
    const result2 = await seedQuestions(mongo.getUri());

    // Should not create duplicates
    expect(result2.total).toBe(193);
    expect(result2.upserted).toBe(0);

    const totalCount = await Question.countDocuments();
    expect(totalCount).toBe(193);
  });
});
