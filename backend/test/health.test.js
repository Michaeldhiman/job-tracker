import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";

beforeAll(async () => {
  let mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-tracker-test-health";
  if (mongoUri.includes('/job-crm')) {
    mongoUri = mongoUri.replace('/job-crm', '/job-crm-test-health');
  }
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Health Check API", () => {
  it("should return 200 OK with status and services when database is connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("services");
    expect(res.body.services).toHaveProperty("server", "UP");
    expect(res.body.services).toHaveProperty("database", "UP");
  });
});
