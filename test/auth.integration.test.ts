import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import RefreshSession from "../src/modules/auth/models/refreshSession.model.js";

let mongo: MongoMemoryServer;
let app: Awaited<typeof import("../src/app.js")>["default"];

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  app = (await import("../src/app.js")).default;
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe("authentication flow", () => {
  it("registers, protects data, rotates refresh tokens, and logs out", async () => {
    const agent = request.agent(app);
    const registered = await agent.post("/api/auth/register").send({ name: "Test User", email: "TEST@example.com", password: "StrongPass123" }).expect(201);
    expect(registered.body.data.user.email).toBe("test@example.com");
    expect(registered.body.data.user.password).toBeUndefined();
    const accessToken = registered.body.data.accessToken as string;
    await agent.get("/api/users/me").set("Authorization", `Bearer ${accessToken}`).expect(200);

    const refreshed = await agent.post("/api/auth/refresh-token").send({}).expect(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
    expect(await RefreshSession.countDocuments({ revokedAt: { $exists: true } })).toBe(1);
    expect(await RefreshSession.countDocuments({ revokedAt: { $exists: false } })).toBe(1);
    await agent.post("/api/auth/logout").send({}).expect(200);
    await agent.post("/api/auth/refresh-token").send({}).expect(401);
  });

  it("rejects duplicate email, invalid credentials, unexpected fields, and unauthorized roles", async () => {
    await request(app).post("/api/auth/register").send({ name: "Other User", email: "other@example.com", password: "StrongPass123" }).expect(201);
    await request(app).post("/api/auth/register").send({ name: "Other User", email: "other@example.com", password: "StrongPass123" }).expect(409);
    await request(app).post("/api/auth/login").send({ email: "other@example.com", password: "wrong" }).expect(401);
    await request(app).post("/api/auth/login").send({ email: "other@example.com", password: "StrongPass123", role: "admin" }).expect(400);
    const login = await request(app).post("/api/auth/login").send({ email: "other@example.com", password: "StrongPass123" }).expect(200);
    await request(app).get("/api/users/all").set("Authorization", `Bearer ${login.body.data.accessToken}`).expect(403);
  });

  it("changes passwords and invalidates refresh sessions", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({ email: "other@example.com", password: "StrongPass123" }).expect(200);
    await agent.post("/api/auth/change-password").set("Authorization", `Bearer ${login.body.data.accessToken}`).send({ currentPassword: "StrongPass123", newPassword: "NewStrongPass456" }).expect(200);
    await agent.post("/api/auth/refresh-token").send({}).expect(401);
    await request(app).post("/api/auth/login").send({ email: "other@example.com", password: "StrongPass123" }).expect(401);
    await request(app).post("/api/auth/login").send({ email: "other@example.com", password: "NewStrongPass456" }).expect(200);
  });
});