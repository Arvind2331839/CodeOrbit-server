import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Question from "../src/modules/questions/questions.model.js";
import User from "../src/modules/auth/models/user.model.js";

let mongo: MongoMemoryServer;
let app: Awaited<typeof import("../src/app.js")>["default"];
let adminToken: string;
let userToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  app = (await import("../src/app.js")).default;
  await mongoose.connect(process.env.MONGODB_URI);

  // Create an admin user and a regular user
  const adminAgent = request.agent(app);
  const adminRes = await adminAgent.post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "AdminPassword123!",
  });
  // Promote to admin
  await User.updateOne({ email: "admin@example.com" }, { role: "admin" });

  // Log in again to get admin JWT payload with admin role
  const adminLoginRes = await adminAgent.post("/api/auth/login").send({
    email: "admin@example.com",
    password: "AdminPassword123!",
  });
  adminToken = adminLoginRes.body.data.accessToken;

  // Create regular user
  const userAgent = request.agent(app);
  const userRes = await userAgent.post("/api/auth/register").send({
    name: "Regular Student",
    email: "student@example.com",
    password: "StudentPassword123!",
  });
  userToken = userRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe("Question API Integration", () => {
  const sampleQuestion = {
    id: "js-test-0001",
    title: "Test Scope Question",
    question: "What is the result of typeof NaN?",
    answer: "number",
    topic: "Data Types",
    difficulty: "beginner",
    tags: ["javascript", "types"],
    technology: "javascript",
    options: [
      { id: "A", text: "number" },
      { id: "B", text: "NaN" },
      { id: "C", text: "undefined" },
      { id: "D", text: "object" },
    ],
    correctAnswer: "A",
    explanation: "NaN is a numeric data type according to IEEE 754 standard.",
  };

  it("denies unauthenticated requests to create questions", async () => {
    await request(app)
      .post("/api/questions")
      .send(sampleQuestion)
      .expect(401);
  });

  it("denies non-admin authenticated users from creating questions", async () => {
    await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${userToken}`)
      .send(sampleQuestion)
      .expect(403);
  });

  it("allows admin to create a single question and validates fields", async () => {
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleQuestion)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("js-test-0001");
    expect(res.body.data.question).toBe("What is the result of typeof NaN?");

    // Check duplicate ID rejection
    await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleQuestion)
      .expect(409);
  });

  it("allows public access to read questions with filters and pagination", async () => {
    const res = await request(app)
      .get("/api/questions?technology=javascript")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.page).toBe(1);
  });

  it("allows public access to get a single question by id", async () => {
    const res = await request(app)
      .get("/api/questions/js-test-0001")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("js-test-0001");
    expect(res.body.data.question).toBe("What is the result of typeof NaN?");
  });

  it("allows public access to get stats and topics", async () => {
    const statsRes = await request(app)
      .get("/api/questions/stats?technology=javascript")
      .expect(200);

    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.totalQuestions).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.data.beginnerCount).toBeGreaterThanOrEqual(1);

    const topicsRes = await request(app)
      .get("/api/questions/topics?technology=javascript")
      .expect(200);

    expect(topicsRes.body.success).toBe(true);
    expect(topicsRes.body.data.topics).toBeDefined();
    expect(topicsRes.body.data.topics.some((t: any) => t.name === "Data Types")).toBe(true);
  });

  it("allows admin to bulk insert questions", async () => {
    const bulkPayload = [
      {
        id: "react-test-0001",
        title: "Virtual DOM Question",
        question: "What is Virtual DOM?",
        answer: "A lightweight copy of the real DOM",
        topic: "Core Concepts",
        difficulty: "beginner",
        tags: ["react", "vdom"],
        technology: "react",
        options: [
          { id: "A", text: "A copy of the real DOM kept in memory" },
          { id: "B", text: "A browser extension" },
        ],
        correctAnswer: "A",
        explanation: "React maintains a virtual representation in memory.",
      },
      {
        id: "react-test-0002",
        title: "JSX Question",
        question: "What is JSX?",
        answer: "Syntax extension for JavaScript",
        topic: "Core Concepts",
        difficulty: "beginner",
        tags: ["react", "jsx"],
        technology: "react",
        options: [
          { id: "A", text: "Syntax extension for JavaScript" },
          { id: "B", text: "A CSS preprocessor" },
        ],
        correctAnswer: "A",
        explanation: "JSX produces React elements.",
      },
    ];

    const res = await request(app)
      .post("/api/questions/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(bulkPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.upsertedCount).toBe(2);

    // Verify questions were saved
    const reactQuestions = await request(app)
      .get("/api/questions?technology=react")
      .expect(200);

    expect(reactQuestions.body.data.items.length).toBe(2);
  });

  it("rejects malformed bulk imports with clear validation errors", async () => {
    // Missing required fields
    const invalidBulk = [
      {
        question: "Short",
        // missing answer, topic, difficulty, technology
      },
    ];

    const res = await request(app)
      .post("/api/questions/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(invalidBulk)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("allows admin to update an existing question", async () => {
    const res = await request(app)
      .put("/api/questions/js-test-0001")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated Scope Question", difficulty: "intermediate" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Scope Question");
    expect(res.body.data.difficulty).toBe("intermediate");
  });

  it("allows admin to delete a question", async () => {
    await request(app)
      .delete("/api/questions/js-test-0001")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Should return 404 now
    await request(app)
      .get("/api/questions/js-test-0001")
      .expect(404);
  });
});
